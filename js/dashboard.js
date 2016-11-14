/**
 * Copyright reelyActive 2016
 * We believe in an open Internet of Things
 */


// Constant definitions
NOTMAN_DIRECTORY_URL_ROOT = 'https://maison-notman-house.github.io/notman-occupants/';
DEFAULT_SOCKET_URL = 'https://www.hyperlocalcontext.com/notman';
UTC_OFFSET_MILLISECONDS = (-5 * 3600 * 1000);
STORY_CYCLE_MILLISECONDS = 12000;
UNIQUE_STORY_RETRIES = 3;


/**
 * dashboard Module
 * All of the JavaScript specific to the dashboard is contained inside this
 * angular module.  The only external dependencies are:
 * - beaver, cormorant (reelyActive)
 * - socket.io (btford)
 */
angular.module('dashboard', ['reelyactive.beaver', 'reelyactive.cormorant'])

/**
 * DashCtrl Controller
 * Handles the manipulation of all variables accessed by the HTML view.
 */
.controller('DashCtrl', function($scope, $interval, beaver, cormorant) {

  // Variables accessible in the HTML scope
  $scope.devices = beaver.getDevices();
  $scope.directories = beaver.getDirectories();
  $scope.stats = beaver.getStats();
  $scope.stories = cormorant.getStories();
  $scope.numberOfDevices = 0;
  $scope.clock = '';
  $scope.occupantUrls = [];
  $scope.featuredUrl;
  $scope.featuredImgUrl;
  $scope.featuredName;

  // Fetch all the occupants and their stories
  getOccupants();
  
  // beaver.js listens on the websocket for events
  //beaver.listen(Socket);
  // Removed because Raspberry Pi was struggling with socket.io
  // When reinstating, don't forget to include Socket in the controller above

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

  // Fetch all the notman-occupants and their stories, one-by-one
  function getOccupants() {
    for(person in notman_people) {
      $scope.occupantUrls.push(NOTMAN_DIRECTORY_URL_ROOT +
                               notman_people[person]);
    }
    for(organization in notman_organizations) {
      $scope.occupantUrls.push(NOTMAN_DIRECTORY_URL_ROOT +
                               notman_organizations[organization]);
    }

    getNextOccupantStory($scope.occupantUrls, 0, function() {
      updateFeaturedStory();
      $interval(updateFeaturedStory, STORY_CYCLE_MILLISECONDS);
    });
  }

  // Recursively fetch occupant stories from an array of URLs
  function getNextOccupantStory(urls, index, callback) {
    if(index >= urls.length) {
      return callback();
    }
    cormorant.getStory(urls[index], function(story, url) {
      getNextOccupantStory(urls, ++index, callback);
    });
  }

  // Update the time every second
  var tick = function() {
    var now = new Date();
    if(now.getTimezoneOffset() === 0) {                     // Hack from UTC
      now = new Date(Date.now() + UTC_OFFSET_MILLISECONDS); //   to Montreal
    }                                                       //   if required
    $scope.clock = now.getHours() + 'h' + ('0' + now.getMinutes()).slice(-2);
  };
  tick();
  $interval(tick, 1000);

  // Update the featured story
  var updateFeaturedStory = function() {
    if($scope.occupantUrls.length > 0) {
      var randomIndex;
      var url;

      // Retry until we have a new story
      for(var cRetry = 0; cRetry < UNIQUE_STORY_RETRIES; cRetry++) {
        randomIndex = Math.floor((Math.random() *
                                  $scope.occupantUrls.length));
        console.log(randomIndex + ' ' + cRetry);
        url = $scope.occupantUrls[randomIndex];
        if(url !== $scope.featuredUrl) {
          $scope.featuredUrl = url;
          break;
        }
      }

      var story = $scope.stories[url];
      $scope.featuredImgUrl = story['@graph'][0]['schema:image'] ||
                              story['@graph'][0]['schema:logo'] ||
                              'images/default-unsupported.png';
      $scope.featuredName = story['@graph'][0]['schema:givenName'] ||
                            story['@graph'][0]['schema:name'];
    }
  };

});
