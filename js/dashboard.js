/**
 * Copyright reelyActive 2016
 * We believe in an open Internet of Things
 */


// Constant definitions
DEFAULT_SOCKET_URL = 'https://www.hyperlocalcontext.com/notman';
UTC_OFFSET_MILLISECONDS = (-5 * 3600 * 1000);


/**
 * dashboard Module
 * All of the JavaScript specific to the dashboard is contained inside this
 * angular module.  The only external dependencies are:
 * - beaver, cormorant (reelyActive)
 * - socket.io (btford)
 */
angular.module('dashboard', ['btford.socket-io', 'reelyactive.beaver',
                             'reelyactive.cormorant'])


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
  $scope.directories = beaver.getDirectories();
  $scope.stats = beaver.getStats();
  $scope.stories = cormorant.getStories();
  $scope.numberOfDevices = 0;
  $scope.clock = '';

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
    //updateDeviceStory(event.deviceId, event.deviceUrl);
    //updateDirectoryStory(event.receiverDirectory, event.receiverUrl);
    $scope.numberOfDevices = Object.keys($scope.devices).length;
  }

  // Update the device's story
  function updateDeviceStory(deviceId, url) {
    cormorant.getStory(url, function(story, url) {
      beaver.addDeviceProperty(deviceId, 'story', story);
      beaver.addDeviceProperty(deviceId, 'person', includesPerson(story));
    });
  }

  // Update the directory's story
  function updateDirectoryStory(directory, url) {
    cormorant.getStory(url, function(story, url) {
      if(story) {
        beaver.addDirectoryProperty(directory, 'story', story);
        beaver.addDirectoryProperty(directory, 'imageUrl',
                                    story['@graph'][0]['schema:image']);
      }
    });
  }

  // Get the number of devices in the given directory
  function getNumberOfDirectoryDevices(directory) {
    if(!$scope.directories.hasOwnProperty(directory)) {
      return 0;
    }
    return Object.keys($scope.directories[directory].devices).length;
  }

  // Verify if the story includes a Person
  function includesPerson(story) {
    if(story && story.hasOwnProperty('@graph')) {
      for(var cIndex = 0; cIndex < story['@graph'].length; cIndex++) {
        if(story['@graph'][cIndex].hasOwnProperty('@type') &&
           (story['@graph'][cIndex]['@type'] === 'schema:Person')) {
          return true;
        }
      }
    }
    return false;
  }

  // Update the time every second
  var tick = function() {
    var now = new Date();
    if(now.getTimezoneOffset() === 0) {                     // Hack from UTC
      now = new Date(Date.now() + UTC_OFFSET_MILLISECONDS); //   to Montreal
    }                                                       //   if required
    $scope.clock = now.getHours() + 'h' + ('0' + now.getMinutes()).slice(-2);
  }
  setInterval(tick, 1000);

});
