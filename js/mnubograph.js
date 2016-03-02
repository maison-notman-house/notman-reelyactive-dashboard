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

        var color = ['#00A2DF','#7a7b7d'];
        var title = ['yesterday','today'];

        $scope.$watch('goModel', function() {

            if (!_.isEmpty($scope.goModel)) {
                var series = [];
                var categories = [];

                _.each($scope.goModel, function(data,key) {
                    series.push({
                        data: _.map(data.rows, function(row) {
                            categories.push(row[0]);
                            return row[1];
                        }),
                        turboThreshold: 0,
                        color : color[key],
                        name: title[key]
                    });
                });
                categories = _.uniq(categories);
                var data = _.first($scope.goModel);
                var xInformation = _.first(data.columns);

                var xAxis = {
                    /*categories: categories,*/
                    categories: _.map(categories, function(row) {return row.substring(row.length-8,11);}),
                    title: { text: xInformation.label }
                };
                if (xInformation.type === 'datetime') {
                    xAxis.type = xInformation.type;

                }

                var yInformation = data.columns[1];
                var yAxis = {
                    title: { text: yInformation.label }
                };
                $scope.chartConfig = {

                    options: {
                        //This is the Main Highcharts chart config. Any Highchart options are valid here.
                        //will be overriden by values specified below.

                        chart: {
                            type: 'line',
                            animation: false
                        },
                        tooltip: {
                            style: {
                                padding: 10,
                                fontWeight: 'bold'
                            }
                        }

                    },
                    //The below properties are watched separately for changes.
                    xAxis: xAxis,
                    yAxis: yAxis,
                    //Series object (optional) - a list of series using normal Highcharts series options.
                    series: series,
                    //Title configuration (optional)
                    title: {
                        text: 'mnubo SmartObjects Platform'
                    }
                };
            } else {
                $scope.chartConfig = {};
            }

        });
    });
