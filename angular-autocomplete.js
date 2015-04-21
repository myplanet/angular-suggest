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

    return angular.module('mp.autocomplete', []).directive('autocomplete', [
        '$window', '$q', '$compile', '$parse', '$timeout',
        function($window, $q, $compile, $parse, $timeout) {
            var TEMPLATE = '' +
                '<ul class="angular-autocomplete" ng-if="isOpen()">' +
                '   <li ng-repeat="match in matches" ' +
                '      ng-class="{ selected: selectedIndex == $index }" ' +
                '      ng-click="select($index)">{{ match }}</li>' +
                '</ul>';

            var HOT_KEYS = [9, 13, 27, 38, 40];

            return {
                restrict: 'A',
                require: 'ngModel',
                link: function (originalScope, $element, $attributes, ngModel) {
                    // model setter executed upon match selection
                    var $setModelValue = $parse($attributes.ngModel).assign;

                    // suggestion fetch function
                    var fetchSuggestions = originalScope.$eval($attributes.autocomplete);

                    // create a child scope for the directive so that we are not
                    // polluting original scope with matches, query etc.
                    var $scope = originalScope.$new();
                    originalScope.$on('$destroy', function () {
                        $scope.$destroy();
                    });

                    var resetMatches = function () {
                        $scope.matches = [];
                        $scope.selectedIndex = -1;
                    };

                    $scope.isOpen = function () {
                        return $scope.matches.length > 0;
                    };

                    $scope.select = function (selectedIndex) {
                        //called from within the $digest() cycle
                        $setModelValue(originalScope, $scope.matches[selectedIndex]);
                        resetMatches();

                        // @todo Notify observer of selection

                        //return focus to the input element if a match was selected via a mouse click event
                        // use timeout to avoid $rootScope:inprog error
                        $timeout(function () {
                            $element[0].focus();
                        }, 0, false);
                    };

                    $scope.selectNext = function () {
                        $scope.selectedIndex = ($scope.selectedIndex + 1) % $scope.matches.length;
                    };

                    $scope.selectPrev = function () {
                        $scope.selectedIndex = ($scope.selectedIndex > 0
                                                ? $scope.selectedIndex
                                                : $scope.matches.length) - 1;
                    };

                    // 0. Initialize to empty state
                    resetMatches();

                    // 1. Watch model for changes
                    ngModel.$parsers.unshift(function (inputValue) {
                        // @todo: add debouncing
                        // 2. Fetch suggestions
                        fetchSuggestions(inputValue).then(function (suggestions) {
                            // 3. Present suggestions
                            $scope.matches = suggestions;
                        });
                    });

                    // 4. Handle mouse selection or keypresses
                    $element.bind('keydown', function (evt) {
                        // we have matches and an "interesting" key was pressed
                        if ($scope.matches.length === 0 || HOT_KEYS.indexOf(evt.which) === -1) {
                            return;
                        }

                        // if there's nothing selected and enter/tab is hit, don't do anything
                        if ($scope.selectedIndex == -1 && (evt.which === 13 || evt.which === 9)) {
                            return;
                        }

                        evt.preventDefault();

                        $scope.$apply(function () {
                            if (evt.which === 40) { // Down Arrow
                                $scope.selectNext();
                            } else if (evt.which === 38) { // Up Arrow
                                $scope.selectPrev();
                            } else if (evt.which === 13 || evt.which === 9) { // Enter or Tab
                                $scope.select($scope.selectedIndex);
                            } else if (evt.which === 27) { // Esc
                                // 6. Handle cancelling of the dialog
                                resetMatches();
                                evt.stopPropagation();
                            }
                        });
                    }).bind('blur', function () {
                        // Close the autocomplete dialog when the element loses focus
                        $scope.$apply(function () {
                            resetMatches();
                        });
                    });

                    var $template = $compile(TEMPLATE)($scope);
                    $element.after($template);
                }
            };
        }
    ]);
}));