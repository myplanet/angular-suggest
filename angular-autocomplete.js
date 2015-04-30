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
            // Introduce custom elements for IE8
            $window.document.createElement('autocomplete');

            var TEMPLATE = '' +
                '<div class="angular-autocomplete" ng-show="isOpen()" tabindex="0">' +
                '  <ul class="_suggestions">' +
                '    <li ng-repeat="match in matches" ' +
                '        class="_suggestion"' +
                '        ng-class="{ \'-selected\': selectedIndex == $index }" ' +
                // use mousedown to stay clear of input losing focus when suggestion is clicked
                '        ng-mousedown="select($index)" ' +
                '        ng-mousemove="setSelectedIndex($index)">{{ render({ value: match }) }}</li>' +
                '  </ul>' +
                '</div>';

            var HOT_KEYS = [
                9,      // tab
                13,     // enter
                27,     // esc
                38,     // up arrow
                40      // down arrow
            ];

            return {
                restrict: 'E',
                template: TEMPLATE,
                replace: true,
                require: 'ngModel',
                scope: {
                    onSelectionComplete: '&',
                    render: '&',
                    query: '&'
                },

                link: function (scope, element, attributes, ngModel) {
                    scope.matches = []
                    scope.selectedIndex = -1;

                    var resetMatches = function () {
                        scope.matches = [];
                        scope.selectedIndex = -1;
                    };

                    scope.isOpen = function () {
                        return scope.matches.length > 0;
                    };

                    scope.select = function (selectedIndex) {
                        // called from within the $digest() cycle
                        var selectedValue = scope.matches[selectedIndex];
                        ngModel.$setViewValue(scope.render({ value: selectedValue }));
                        ngModel.$render();

                        resetMatches();

                        // notify observer of selection complete
                        // this is a good chance to restore focus on whatever element that triggered autocomplete
                        if (scope.onSelectionComplete) {
                            scope.onSelectionComplete({ value: selectedValue });
                        }
                    };

                    scope.selectNext = function () {
                        scope.selectedIndex = (scope.selectedIndex + 1) % scope.matches.length;
                    };

                    scope.selectPrev = function () {
                        scope.selectedIndex = (scope.selectedIndex > 0
                                                ? scope.selectedIndex
                                                : scope.matches.length) - 1;
                    };

                    scope.setSelectedIndex = function(index) {
                        if (scope.selectedIndex !== index) {
                            scope.selectedIndex = index;
                        }
                    };

                    // 0. Initialize to empty state
                    resetMatches();

                    // 1. Watch model for changes
                    ngModel.$formatters.unshift(function (inputValue) {
                        // @todo: add debouncing
                        // 2. Fetch suggestions
                        scope.query({ input: inputValue }).then(function (suggestions) {
                            // 3. Present suggestions
                            scope.matches = suggestions;
                        });
                    });

                    scope.$on('autocompleteFocus', function () {
                        element[0].focus();
                        scope.selectedIndex = 0;
                    });

                    // 4. Handle mouse selection or keypresses
                    element.bind('keydown', function (evt) {
                        // we have matches and an "interesting" key was pressed
                        if (scope.matches.length === 0 || HOT_KEYS.indexOf(evt.which) === -1) {
                            return;
                        }

                        // if there's nothing selected and enter/tab is hit, don't do anything
                        if (scope.selectedIndex == -1 && (evt.which === 13 || evt.which === 9)) {
                            return;
                        }

                        evt.preventDefault();

                        scope.$apply(function () {
                            if (evt.which === 40) { // Down Arrow
                                scope.selectNext();
                            } else if (evt.which === 38) { // Up Arrow
                                scope.selectPrev();
                            } else if (evt.which === 13 || evt.which === 9) { // Enter or Tab
                                scope.select(scope.selectedIndex);
                            } else if (evt.which === 27) { // Esc
                                // 5. Handle cancelling of the dialog
                                resetMatches();
                                evt.stopPropagation();

                                // null indicating no value is selected, again a good chance to restore focus on whatever element that triggered autocomplete
                                if (scope.onSelectionComplete) {
                                    scope.onSelectionComplete({ value: null });
                                }
                            }
                        });
                    }).bind('blur', function () {
                        if (scope.matches.length) {
                            // Close the autocomplete dialog when the element loses focus
                            scope.$apply(function () {
                                resetMatches();
                            });
                        }
                    });
                }
            };
        }
    ]);
}));
