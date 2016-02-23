DEFAULT_SOCKET_URL = 'http://www.hyperlocalcontext.com/notman';
DEFAULT_ASSOCIATIONS_URL = 'http://www.hyperlocalcontext.com/associations/';
EVENT_HISTORY = 10;

angular.module('dashboard', [ 'btford.socket-io', 'reelyactive.beaver',
                              'reelyactive.cormorant', 'ngSanitize' ])

  // Socket.io factory
  .factory('Socket', function(socketFactory) {
    return socketFactory( { ioSocket: io.connect(DEFAULT_SOCKET_URL) } );
  })


  // Dashboard controller
  .controller('DashCtrl', function($scope, $interval, $http, $sce, Socket,
                                   beaver, cormorant) {

    var chart;
    $scope.devices = beaver.getDevices();
    $scope.stats = beaver.getStats();
    $scope.events = [];
    $scope.chartLegend = '<h1>Waiting for initial event...</h1>';

    beaver.listen(Socket);


    // Action triggers: appearance, displacement and disappearance
    Socket.on('appearance', function(data) {
      updateChart();
      updateEvents('appearance', data);
    });
    Socket.on('displacement', function(data) {
      updateChart();
      updateEvents('displacement', data);
    });
    Socket.on('disappearance', function(data) {
      updateChart();
      updateEvents('disappearance', data);
    });

    function initChart() {
      var ctx = document.getElementById('chart').getContext('2d');
      chart = new Chart(ctx).Doughnut([
        {
          value: 0,
          color: "#ff6900",
          highlight: "#f8b586",
          label: "Main Floor"
        }, {
          value: 1,
          color: "#0770a2",
          highlight: "#82b6cf",
          label: "Second Floor"
        }, {
          value: 0,
          color: "#aec844",
          highlight: "#d0dd9e",
          label: "Third Floor"
      }]);
      $scope.chartLegend = $sce.trustAsHtml(chart.generateLegend());
    }

    function updateChart() {
      if(chart == null) {
        initChart();
        return;
      }
      chart.segments[0].value = 0;
      chart.segments[1].value = 0;
      chart.segments[2].value = 0;
      for(deviceId in $scope.devices) {
        var device = $scope.devices[deviceId];
        var strongestDecoder = device.tiraid.radioDecodings[0]
                              .identifier.value;
        switch(strongestDecoder) {
          case '001bc509408100d9':
          case '001bc509408100da':
          case '001bc509408100db':
            chart.segments[0].value++; // Main floor
            break;
          case '001bc509408100dc':
          case '001bc509408100dd':
          case '001bc509408100de':
            chart.segments[1].value++; // Second floor
            break;
          case '001bc509408100df':
            chart.segments[2].value++; // Third floor
            break;
        }
      }
      setTimeout(function() { chart.update() });
    }

    function updateEvents(type, data) {
      var length = $scope.events.unshift({ type: type, tiraid: data.tiraid });
      if(length > EVENT_HISTORY) {
        $scope.events.pop();
      }
    }

  });
