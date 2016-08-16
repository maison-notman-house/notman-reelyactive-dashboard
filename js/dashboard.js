/**
 * Copyright reelyActive 2016
 * We believe in an open Internet of Things
 */


// Constant definitions
DEFAULT_SOCKET_URL = 'http://www.hyperlocalcontext.com/notman';
DEFAULT_ASSOCIATIONS_URL = 'http://www.hyperlocalcontext.com/associations/';


/**
 * dashboard Module
 * All of the JavaScript specific to the dashboard is contained inside this
 * angular module.  The only external dependencies are:
 * - beaver, cormorant and cuttlefish (reelyActive)
 * - socket.io (btford)
 * - ngSanitize (angular)
 */
angular.module('dashboard', ['btford.socket-io', 'reelyactive.beaver',
                             'reelyactive.cormorant',
                             'reelyactive.cuttlefish', 'ngSanitize'])


/**
 * Socket Factory
 * Creates the websocket connection to the given URL using socket.io.
 */
.factory('Socket', function(socketFactory) {
  return socketFactory({
    ioSocket: io.connect(DEFAULT_SOCKET_URL)
  });
})


/**
 * DashCtrl Controller
 * Handles the manipulation of all variables accessed by the HTML view.
 */
.controller('DashCtrl', function($scope, Socket, beaver, cormorant) {

  // Variables accessible in the HTML scope
  $scope.devices = beaver.getDevices();
  $scope.stats = beaver.getStats();
  $scope.stories = cormorant.getStories();

  // beaver.js listens on the websocket for events
  beaver.listen(Socket);

  // Handle events pre-processed by beaver.js
  beaver.on('appearance', function(event) {
    handleEvent(event);
  });
  beaver.on('displacement', function(event) {
    handleEvent(event);
  });
  beaver.on('keep-alive', function(event) {
    handleEvent(event);
  });
  beaver.on('disappearance', function(event) {
    handleEvent(event);
  });

  // Handle an event
  function handleEvent(event) {
    updateStories(event.deviceUrl);
    updateStories(event.receiverUrl);
  }

  // Update the collection of stories
  function updateStories(url) {
    cormorant.getStory(url, function() {});
  }
});
