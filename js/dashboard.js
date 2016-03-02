DEFAULT_SOCKET_URL = 'http://www.hyperlocalcontext.com/notman';
DEFAULT_ASSOCIATIONS_URL = 'http://www.hyperlocalcontext.com/associations/';
EVENT_HISTORY = 10;

angular.module('dashboard', ['btford.socket-io', 'reelyactive.beaver',
  'reelyactive.cormorant', 'ngSanitize', 'highcharts-ng'
])

// Socket.io factory
.factory('Socket', function(socketFactory) {
  return socketFactory({
    ioSocket: io.connect(DEFAULT_SOCKET_URL)
  });
})

.service('mnubo', function($q, $http, $rootScope) {

  $rootScope.graphData = [];
  this.token = "Bearer eyJhbGciOiJSUzI1NiJ9.eyJzY29wZSI6WyJBTEwiXSwiYXBwdHlwZSI6IlNBTkRCT1giLCJuYW1lc3BhY2UiOiJyZWVseWFjdGl2ZSIsIndzbzJhY2Nlc3N0b2tlbmlkIjoiWTJVdlpTZ1FxQWRsdllSd3JlWXFoS3pnQUlNNHJ6WVdSRTNCNmZ1U2tnaHFTdHgxTkEiLCJleHAiOjE0NjA4MzE3ODcsImF1dGhvcml0aWVzIjpbIlJPTEVfQ0xJRU5UIl0sImp0aSI6ImI0MTQ5YTA0LTk2MGQtNDZhNy04YmZjLWY1OGRjNTQ5MTc4MSIsImNsaWVudF9pZCI6IlJxNVhsZ0VvdklsblQ3aU9OMmxjbzl5aEhNUTNuSDhJcmRCd0ZsdGRSc3c3WGttb0hBIiwiYWNjb3VudCI6InJlZWx5YWN0aXZlIiwidXNlci1hZ2VudCI6Ik1vemlsbGEvNS4wIChNYWNpbnRvc2g7IEludGVsIE1hYyBPUyBYIDEwXzExXzMpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS80OC4wLjI1NjQuMTE2IFNhZmFyaS81MzcuMzYifQ.EDMMdwU_y6qDjiMpzPAGFxan9Zp0rDYCz4_8u5WP8RllBXegasT8nTnKcdCCNI25OlppQGiQcan5Io_M-nrdvUR3tZouUaWbGtGxznHLIyXYtOro3nH0o92eMoXOHXYJ9tn0W-hFFPjhx8_KbYIawYSAvAK_ZvJY_BGlw46oXQ6GvHCiJhd5vajQtfio9gLW8uA3-4665UAlmKU1VrDs-RKEDJ9aEg4dtkloMPcC52O7tkhl5bT-7n7K-egoyZUILaJN75JEUxfsicMc-r2uHNZeoaDZT8AZjQpFZ04fbKqpc7L9M_LDopODcqL9Lu4naCHCxw0DhbLPcTMjMTAqh7zsghhjy0x8lworMcDlXy5X1cTDYS-C-V2VfJuKf6VyLdLeHoJRFchqQB_by_gCVRd0aXGgXGymclvDEUO_51KX6wmGmf_jQHp0T1CzRGq1J_2Zpi41mEw2wJ0lEisic24uxWXfvmMFd1arcqnMgIQxJnXqoyxmBW3dHi9qfMAeJaldeZLHkOLMXgF80aWI-kPAdq0bZudWz8qOv3ro_PjQE3rNh_LB2-WT9TKVK2m94nTM4l25VoxO4J50wT6HVd6BtFW7quQDITx-kSzg0894uA3fJDtCNygECR3vfzwsQ9u-mo67sB3Xm2yKkGOgoRvXKirY36YAUIs82B5jIws"
  this.endPoint = "https://reelyactive.sandbox.mnubo.com";
  this.headers = {
    'Authorization': this.token,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };


  this.tryFetch = function(query, ep, head) {

    return $http({
      url: ep + '/api/v3/search/basic',
      method: "POST",
      data: query,
      headers: head,
      cache: true
    })

  };

  this.notmanRequest = function() {


    var query1 = {
      "from": "event",
      "where": {
        "and": [{
          "x_pipeline": {
            "eq": "i"
          }
        }, {
          "x_timestamp": {
            "dateBetween": "2016-03-01T00:00:00-05:00",
            "and": "2016-03-01T23:59:59-05:00"
          }
        }]
      },
      "groupByTime": {
        "field": "x_timestamp",
        "interval": "minute",
        "timeZone": "America/New_York"
      },
      "select": [{
        "count": "*"
      }]
    };

    var query2 = {
      "from": "event",
      "where": {
        "and": [{
          "x_pipeline": {
            "eq": "i"
          }
        }, {
          "x_timestamp": {
            "dateBetween": "2016-03-02T00:00:00-05:00",
            "and": "2016-03-02T23:59:59-05:00"
          }
        }]
      },
      "groupByTime": {
        "field": "x_timestamp",
        "interval": "minute",
        "timeZone": "America/New_York"
      },
      "select": [{
        "count": "*"
      }]
    };
    var promises = [];
    var promise1 = this.tryFetch(query1, this.endPoint, this.headers);
    var promise2 = this.tryFetch(query2, this.endPoint, this.headers);
    promises.push(promise1);
    promises.push(promise2);
    return $q.all(promises).then(function(results) {

      /*console.log('resp1',results[0]);
      console.log('resp2',results[1]);*/
      var myres = [results[0].data, results[1].data];

      var resultmodified = _.each(myres, function(result) {

        return _.map(result.rows, function(row) {

          return [row[0].substring(row[0].length - 8, 11), row[1]];
        });

      });


      $rootScope.graphData = [];
      $rootScope.graphData = myres;

    });

  }


})

.run(function($interval, mnubo) {
  $interval(function() {


    mnubo.notmanRequest().then(function(resp) {

    });
  }, 10000);
})



.directive('graph', function() {
  return {
    restrict: 'E',
    template: '<div ng-show="chartConfig.series" style="width: 100%"><highchart id="chart1" config="chartConfig" style="width: 100%"></highchart></div>',
    replace: true,
    scope: {
      goModel: '='
    },
    controller: 'GraphCtrl',
    link: function(scope, element, attrs) {}
  }
})

// Dashboard controller
.controller('DashCtrl', function($q, $scope, $interval, $http, $sce, Socket,
  beaver, cormorant, mnubo) {

  var chart;
  $scope.devices = beaver.getDevices();
  $scope.stats = beaver.getStats();
  $scope.events = [];
  $scope.chartLegend = '<h1>Waiting for initial event...</h1>';

  beaver.listen(Socket);

  /*var fresp = mnubo.tryFetch(query,mnubo.endPoint,mnubo.headers).then(function(resp) {

          $scope.graphData=[];
          $scope.graphData.push(resp);
          console.log('respponse',resp);

        });*/



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
    chart = new Chart(ctx).Doughnut([{
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
    if (chart == null) {
      initChart();
      return;
    }
    chart.segments[0].value = 0;
    chart.segments[1].value = 0;
    chart.segments[2].value = 0;
    for (deviceId in $scope.devices) {
      var device = $scope.devices[deviceId];
      var strongestDecoder = device.tiraid.radioDecodings[0]
        .identifier.value;
      switch (strongestDecoder) {
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
    setTimeout(function() {
      chart.update()
    });
  }

  function updateEvents(type, data) {
    var length = $scope.events.unshift({
      type: type,
      tiraid: data.tiraid
    });
    if (length > EVENT_HISTORY) {
      $scope.events.pop();
    }
  }

});
