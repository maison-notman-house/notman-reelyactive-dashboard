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
  $scope.featuredDirectory = null;
  $scope.featuredStories = [];

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
    cormorant.getStory(url, function(story, url) {});
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

  // Update the featured stories
  function updateFeaturedStories() {
    var candidateStories = [];
    for(currentDevice in $scope.devices) {
      var device = $scope.devices[currentDevice];
      if($scope.stories.hasOwnProperty(device.deviceUrl) &&
         includesPerson($scope.stories[device.deviceUrl])) {
        candidateStories.push($scope.stories[device.deviceUrl]);
      }
    }
    $scope.featuredStories = candidateStories;
  }

  // Update the featured directory, toggling between the two with most people
  function updateFeaturedDirectory() {
    var people = 0;
    var newFeaturedDirectory = $scope.featuredDirectory;
    for(cDirectory in $scope.directories) {
      var currentPeople = 0;
      var currentDirectory = $scope.directories[cDirectory];
      for(cDevice in currentDirectory) {
        var deviceUrl = currentDirectory[cDevice].deviceUrl;
        if(includesPerson($scope.stories[deviceUrl])) {
          currentPeople++;
        }
      }
      if((currentPeople > people) &&
         (currentDirectory !== $scope.featuredDirectory)) {
        newFeaturedDirectory = currentDirectory;
      }
    }
    $scope.featuredDirectory = newFeaturedDirectory;
  }

  updateFeaturedStories();
  updateFeaturedDirectory();
  setInterval(updateFeaturedStories, 4000);
  setInterval(updateFeaturedDirectory, 8000);
});
