/**
 * Copyright reelyActive 2016
 * We believe in an open Internet of Things
 */


// Constant definitions
DEFAULT_SOCKET_URL = 'http://www.hyperlocalcontext.com/notman';
MAX_RSSI = 255;


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
  $scope.directories = {};

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
    updateDirectories(event);
  }

  // Update the collection of stories
  function updateStories(url) {
    cormorant.getStory(url, function() {});
  }

  // Update the directories of events
  function updateDirectories(event) {
    var directory = event.receiverDirectory;
    var deviceId = event.deviceId;

    // Update existing directories
    for(currentDirectory in $scope.directories) {
      if((directory === currentDirectory) &&
         (event.event !== 'disappearance')) {
        addReceiver(directory, event.receiverId, event.receiverUrl);
        $scope.directories[currentDirectory][deviceId] = event;
      }
      else if($scope.directories[currentDirectory].hasOwnProperty(deviceId)) {
        delete $scope.directories[currentDirectory][deviceId];
      }
    }

    // Create new directory and add both receiver and event
    if(!$scope.directories.hasOwnProperty(directory)) {
      $scope.directories[directory] = {};
      addReceiver(directory, event.receiverId, event.receiverUrl);
      $scope.directories[directory][deviceId] = event;
    }
  }

  // Add the receiver to the given directory
  function addReceiver(directory, receiverId, receiverUrl) {
    if(!$scope.directories[directory].hasOwnProperty(receiverId)) {
      $scope.directories[directory][receiverId] = {
        deviceUrl: receiverUrl,
        rssi: MAX_RSSI
      };
    }
  }

  // Verify if the device's story has been fetched
  $scope.hasFetchedStory = function(device) {
    return $scope.stories.hasOwnProperty(device.deviceUrl);
  };

  // Get the story corresponding to the given device
  $scope.getStory = function(device) {
    return $scope.stories[device.deviceUrl];
  };
});
