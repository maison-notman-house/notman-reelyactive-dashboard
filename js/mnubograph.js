/*
 * ---------------------------------------------------------------------------
 *
 * COPYRIGHT (c) 2016 Mnubo Inc. All Rights Reserved.
 *
 * The copyright to the computer program(s) herein is the property of Mnubo
 * Inc. The program(s) may be used and/or copied only with the written
 * permission from Mnubo Inc. or in accordance with the terms and conditions
 * stipulated in the agreement/contract under which the program(s) have been
 * supplied.
 *
 * ---------------------------------------------------------------------------
 */

'use strict';

angular.module('dashboard')
    .controller('GraphCtrl', function($scope) {
        var graph = this;

        Highcharts.setOptions({
                        global: {
                          useUTC: false
                        }
                      });

        var color = ['#00A2DF','#7a7b7d'];
        var title = ['yesterday','today'];

        $scope.$watch('goModel', function() {

            if (!_.isEmpty($scope.goModel)) {
                var series = [];
                var categories = [];

                var day = new Date($scope.goModel[1].rows[$scope.goModel[1].rows.length-1][0]);

                _.each($scope.goModel, function(data,key) {
                    var out = _.map(data.rows, function(row) { 

                        var b = new Date(row[0]);
                        var c = new Date(day.getYear(),day.getMonth(),day.getDay(), b.getHours(), b.getMinutes())
                        return [c.getTime(), row[1]]; 
                    });
                    series.push({
                        data: out,
                        turboThreshold: 0,
                        color : color[key],
                        name: title[key]
                    });
                });

                var data = _.first($scope.goModel);
                var xInformation = _.first(data.columns);

                var xAxis = {
                    type: 'datetime',
                    title: { text: xInformation.label },
                };

                var yInformation = data.columns[1];
                var yAxis = {
                    title: { text: 'Activity Events' }
                };



                $scope.chartConfig = {
                    options: {
                        //This is the Main Highcharts chart config. Any Highchart options are valid here.
                        //will be overriden by values specified below.

                        chart: {
                            type: 'line',
                            zoomType: 'x',
                            panning: true,
                            panKey: 'shift'
                        },
                        plotOptions: {
                            series: {
                                animation: false 
                            }
                        },
                        tooltip: {
                            style: {
                                padding: 10,
                                fontWeight: 'bold'
                            }
                        },
                        credits: {
                            enabled: false
                        }

                    },
                    //The below properties are watched separately for changes.
                    xAxis: xAxis,
                    yAxis: yAxis,
                    //Series object (optional) - a list of series using normal Highcharts series options.
                    series: series,
                    //Title configuration (optional)
                    title: {
                        text: 'Daily Activity Level via mnubo SmartObjects Platform'
                    }
                };

            } else {
                $scope.chartConfig = {};
            }

        });
    });
