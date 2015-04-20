(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([ 'module', 'angular' ], function (module, angular) {
            module.exports = factory(angular);
        });
    } else if (typeof module === 'object') {
        module.exports = factory(require('angular'));
    } else {
        if (!root.mp) {
            root.mp = {};
        }

        root.mp.autocomplete = factory(root.angular);
    }
}(this, function (angular) {
    'use strict';

    return angular.module('mp.autocomplete', []).directive('autocomplete', [ '$window', function ($window) {
        // Introduce custom elements for IE8
        $window.document.createElement('autocomplete');

        var tmpl = '' +
            '<div class="angular-autocomplete">' +
            '   <span ng-repeat="item in items">{{ item }}</span>' +
            '   <span ng-if="items.length == 0">{{ noResultsText }}</span>' +
            '</div>';

        return {
            restrict: 'AE',
            template: tmpl,
            replace: true,
            require: '?ngModel',
            scope: {
                dataSource: '@',
                template: '@',
                parser: '&',
                noResultsText: '@',
                debounce: '@'
            },

            link: function ($scope, $element, $attributes, ngModel) {
                // Init values.
                if (!!$scope.noResultsText) {
                    $scope.noResultsText = 'No results';
                }
                $scope.items = ['hello', 'world'];

                // Add the search handler.
            }
        };
    }]);
}));
