DEFAULT_SOCKET_URL = 'http://www.hyperlocalcontext.com/notman';
DEFAULT_ASSOCIATIONS_URL = 'http://www.hyperlocalcontext.com/associations/';
SEGMENTS = ['appearance', 'keep-alive', 'disappearance', 'displacement'];

angular.module('dashboard', [ 'btford.socket-io', 'reelyactive.cormorant' ])

  // Socket.io factory
  .factory('Socket', function(socketFactory) {
    return socketFactory( { ioSocket: io.connect(DEFAULT_SOCKET_URL) } );
  })


  // Dashboard controller
  .controller('DashCtrl', function($scope, $interval, $http, Socket,
                                   cormorant) {



    var chart;

    function initChart() {
      var ctx = document.getElementById('chart').getContext('2d');
      chart = new Chart(ctx).Doughnut([
        {
          value: 0,
          color: "#F7464A",
          highlight: "#FF5A5E",
          label: "Appearances"
        }, {
          value: 1,
          color: "#46BFBD",
          highlight: "#5AD3D1",
          label: "Keep-alives"
        }, {
          value: 0,
          color: "#FDB45C",
          highlight: "#FFC870",
          label: "Disappearances"
        }, {
          value: 0,
          color: "#FDB45C",
          highlight: "#FFC870",
          label: "Displacements"
      }]);
    }

    $scope.event = {};
    // Create a container of event counts by segment
    $scope.counts = {};
    for (var i = 0; i < SEGMENTS.length; i++) {
      $scope.counts[SEGMENTS[i]] = 0;
    }

    $scope.$watch('counts', function(counts) {
      if (chart == null) { initChart(); return };
      for (var i = 0; i < SEGMENTS.length; i++) {
        chart.segments[i].value = counts[SEGMENTS[i]];
      }
      setTimeout(function() { chart.update() });
    }, true );

    // Event: a new device is now detected
    Socket.on('appearance', function(event) {
      $scope.event = JSON.stringify(event, null, "  ");
      $scope.counts.appearance++;
    });

    // Event: a device has moved from one sensor to another
    Socket.on('displacement', function(event) {
      $scope.event = JSON.stringify(event, null, "  ");
      $scope.counts.displacement++;
    });

    // Event: a device is still detected and hasn't moved
    Socket.on('keep-alive', function(event) {
      $scope.event = JSON.stringify(event, null, "  ");
      $scope.counts['keep-alive']++;
    });

    // Event: a device is no longer detected
    Socket.on('disappearance', function(event) {
      $scope.event = JSON.stringify(event, null, "  ");
      $scope.counts.disappearance++;
    });

    Socket.on('error', function(err, data) {
      console.log('Socket Error: ' + err + ' - ' + data);
    });

    function fetchUrl(id, callback) {
      $http.defaults.headers.common.Accept = 'application/json';
      $http.get(DEFAULT_ASSOCIATIONS_URL + id)
        .success(function(data, status, headers, config) {
          var url = null;
          if(data.devices && data.devices[id]) {
            url = data.devices[id].url;
          }
          callback(url);
        })
        .error(function(data, status, headers, config) {
          callback(null);
        });
    }

  });
