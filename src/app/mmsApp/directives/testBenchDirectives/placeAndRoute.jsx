'use strict';

angular.module('mms.testBenchDirectives')
.run(function(testBenchService) {

    testBenchService.registerTestBenchDirectives(
        'Place and Route',
        {
            config: 'place-and-route-config',
            resultCompact: 'place-and-route-result-compact'
        }
    );

})

.directive('placeAndRouteConfig', function() {

    function TestBenchConfigController() {

    }

    return {
        restrict: 'E',
        controller: TestBenchConfigController,
        controllerAs: 'ctrl',
        bindToController: true,
        replace: true,
        transclude: false,
        scope: {
            testBench: '='
        },
        templateUrl: '/mmsApp/templates/placeAndRouteConfig.html'
    };

})

.directive('placeAndRouteResult', function() {

    function TestBenchResultController() {

    }

    return {
        restrict: 'E',
        controller: TestBenchResultController,
        controllerAs: 'ctrl',
        bindToController: true,
        replace: true,
        transclude: false,
        scope: {
            result: '='
        },
        templateUrl: '/mmsApp/templates/placeAndRouteResult.html'
    };

})

.directive('placeAndRouteResultCompact', function() {

    function TestBenchResultCompactController() {

    }

    return {
        restrict: 'E',
        controller: TestBenchResultCompactController,
        controllerAs: 'ctrl',
        bindToController: true,
        replace: true,
        transclude: false,
        scope: {
            result: '='
        },
        templateUrl: '/mmsApp/templates/placeAndRouteResultCompact.html',
        require: ['placeAndRouteResultCompact', '^testBenchResultOpener'],
        link: function(s, element, attributes, controllers) {

            var openerController = controllers[1];

            function showResults() {
                console.log('Show results from here');
            }

            openerController.resultsOpener = showResults;

        }
    };

});