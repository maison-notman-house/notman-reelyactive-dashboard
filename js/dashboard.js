DEFAULT_SOCKET_URL = 'http://www.hyperlocalcontext.com/notman';
DEFAULT_ASSOCIATIONS_URL = 'http://www.hyperlocalcontext.com/associations/';
SEGMENTS = ['appearances', 'keepalives', 'disappearances', 'displacements'];

angular.module('dashboard', [ 'btford.socket-io', 'reelyactive.beaver',
                              'reelyactive.cormorant' ])

  // Socket.io factory
  .factory('Socket', function(socketFactory) {
    return socketFactory( { ioSocket: io.connect(DEFAULT_SOCKET_URL) } );
  })


  // Dashboard controller
  .controller('DashCtrl', function($scope, $interval, $http, Socket, beaver,
                                   cormorant) {

    $scope.devices = beaver.getDevices();
    $scope.stats = beaver.getStats();
    beaver.listen(Socket);


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

    $scope.$watch('stats', function(stats) {
      if (chart == null) { initChart(); return };
      for (var i = 0; i < SEGMENTS.length; i++) {
        chart.segments[i].value = stats[SEGMENTS[i]];
      }
      setTimeout(function() { chart.update() });
    }, true );

  });
