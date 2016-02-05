DEFAULT_SOCKET_URL = 'http://www.hyperlocalcontext.com/notman';
DEFAULT_ASSOCIATIONS_URL = 'http://www.hyperlocalcontext.com/associations/';

angular.module('dashboard', [ 'btford.socket-io', 'reelyactive.cormorant' ])

  // Socket.io factory
  .factory('Socket', function(socketFactory) {
    return socketFactory( { ioSocket: io.connect(DEFAULT_SOCKET_URL) } );
  })


  // Dashboard controller
  .controller('DashCtrl', function($scope, $interval, $http, Socket,
                                   cormorant) {

    $scope.event = {};

    // Event: a new device is now detected
    Socket.on('appearance', function(event) {
      $scope.event = JSON.stringify(event, null, "  ");
    });

    // Event: a device has moved from one sensor to another
    Socket.on('displacement', function(event) {
      $scope.event = JSON.stringify(event, null, "  ");
    });

    // Event: a device is still detected and hasn't moved
    Socket.on('keep-alive', function(event) {
      $scope.event = JSON.stringify(event, null, "  ");
    });

    // Event: a device is no longer detected
    Socket.on('disappearance', function(event) {
      $scope.event = JSON.stringify(event, null, "  ");
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
