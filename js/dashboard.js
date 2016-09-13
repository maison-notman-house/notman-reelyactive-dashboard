/**
 * Copyright reelyActive 2016
 * We believe in an open Internet of Things
 */


// Constant definitions
DEFAULT_SOCKET_URL = 'http://www.hyperlocalcontext.com/notman';
MAX_RSSI = 255;
DOUGHNUT_OPTIONS = {
  legend: {
    display: true,
    labels: {
      fontSize: 24,
      fontColor: "#fff"
    }
  }
};


/**
 * dashboard Module
 * All of the JavaScript specific to the dashboard is contained inside this
 * angular module.  The only external dependencies are:
 * - beaver, cormorant and cuttlefish (reelyActive)
 * - socket.io (btford)
 * - ngSanitize (angular)
 * - chart.js (jtblin)
 */
angular.module('dashboard', ['btford.socket-io', 'reelyactive.beaver',
                             'reelyactive.cormorant',
                             'reelyactive.cuttlefish', 'ngSanitize',
                             'chart.js'])


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
  $scope.addFiller = true;
  $scope.doughnutLabels = [ '3', '2', '1', 'Cafe' ];
  $scope.doughnutData = [ 0, 0, 0, 0 ];
  $scope.doughnutColors = [ '#83b7d1', '#0770a2', '#043851', '#ff6900' ];
  $scope.doughnutOptions = DOUGHNUT_OPTIONS;
  $scope.numberOfDevices = 0;

  // beaver.js listens on the websocket for events
  beaver.listen(Socket);

  // Handle events pre-processed by beaver.js
  beaver.on('appearance', function(event) {
    handleEvent(event);
    updateDoughnut(event);
    beaver.addDeviceProperty(event.deviceId, 'featured', false);
  });
  beaver.on('displacement', function(event) {
    handleEvent(event);
    updateDoughnut(event);
  });
  beaver.on('keep-alive', function(event) {
    handleEvent(event);
  });
  beaver.on('disappearance', function(event) {
    handleEvent(event);
    updateDoughnut(event);
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

  // Update the doughnut chart
  function updateDoughnut(event) {
    $scope.doughnutData[0] = getNumberOfDirectoryDevices('notman:third:west')
                         + getNumberOfDirectoryDevices('notman:third:centre')
                         + getNumberOfDirectoryDevices('notman:third:east');
    $scope.doughnutData[1] = getNumberOfDirectoryDevices('notman:second:west')
                         + getNumberOfDirectoryDevices('notman:second:centre')
                         + getNumberOfDirectoryDevices('notman:second:east');
    $scope.doughnutData[2] = getNumberOfDirectoryDevices('notman:first:west')
                         + getNumberOfDirectoryDevices('notman:first:centre')
                         + getNumberOfDirectoryDevices('notman:first:east');
    $scope.doughnutData[3] = getNumberOfDirectoryDevices('notman:cafe');
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

  // Update the featured directory and story
  function updateFeatured() {
    var people = 0;
    var products = 0;
    var newFeaturedDirectory = $scope.featuredDirectory;
    for(cDirectory in $scope.directories) {
      var currentPeople = 0;
      var currentProducts = 0;
      var currentDirectory = $scope.directories[cDirectory];
      for(cDevice in currentDirectory.devices) {
        if(currentDirectory.devices[cDevice].person) {
          currentPeople++;
        }
        currentProducts++;
      }
      if(((currentPeople > people) ||
          ((people === 0) && (currentProducts > products))) &&
         (currentDirectory !== $scope.featuredDirectory)) {
        newFeaturedDirectory = currentDirectory;
        people = currentPeople;
        products = currentProducts;
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

    var featuredStories = [];
    for(cDevice in $scope.devices) {
      beaver.addDeviceProperty(cDevice, 'featured', false);
      if($scope.devices[cDevice].person === true) {
        featuredStories.push(cDevice);
      }
    }
    if(featuredStories.length > 0) {
      $scope.addFiller = false;
      var featuredStoryIndex = Math.floor(Math.random() *
                                          featuredStories.length);
      beaver.addDeviceProperty(featuredStories[featuredStoryIndex],
                               'featured', true);
    }
    else {
      $scope.addFiller = true;
    }
  }

  setInterval(updateFeatured, 12000);
});
