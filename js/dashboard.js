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
  $scope.directories = beaver.getDirectories();
  $scope.stats = beaver.getStats();
  $scope.stories = cormorant.getStories();
  $scope.featuredDirectory = null;

  // beaver.js listens on the websocket for events
  beaver.listen(Socket);

  // Handle events pre-processed by beaver.js
  beaver.on('appearance', function(event) {
    handleEvent(event);
    beaver.addDeviceProperty(event.deviceId, 'featured', false);
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
    updateDeviceStory(event.deviceId, event.deviceUrl);
    updateDirectoryStory(event.receiverDirectory, event.receiverUrl);
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


  // Update the featured directory and story
  function updateFeatured() {
    var people = 0;
    var newFeaturedDirectory = $scope.featuredDirectory;
    for(cDirectory in $scope.directories) {
      var currentPeople = 0;
      var currentDirectory = $scope.directories[cDirectory];
      for(cDevice in currentDirectory.devices) {
        if(currentDirectory.devices[cDevice].person) {
          currentPeople++;
        }
      }
      if((currentPeople > people) &&
         (currentDirectory !== $scope.featuredDirectory)) {
        newFeaturedDirectory = currentDirectory;
      }
    }
    if(newFeaturedDirectory !== $scope.featuredDirectory) {
      $scope.featuredDirectory = newFeaturedDirectory;
    }
    else {
      var directories = Object.keys($scope.directories);
      var randomIndex = Math.floor(Math.random() * directories.length);
      $scope.featuredDirectory = $scope.directories[directories[randomIndex]];
    }

    var people = [];
    for(cDevice in $scope.devices) {
      beaver.addDeviceProperty(cDevice, 'featured', false);
      if($scope.devices[cDevice].person === true) {
        people.push(cDevice);
      }
    }
    var featuredStoryIndex = Math.floor(Math.random() * people.length);
    beaver.addDeviceProperty(people[featuredStoryIndex], 'featured', true);
  }

  setInterval(updateFeatured, 8000);
});
