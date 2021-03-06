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
                '<div class="angular-autocomplete" ng-if="isOpen()">' +
                '  <ul class="_suggestions">' +
                '    <li ng-repeat="match in matches" ' +
                '        class="_suggestion"' +
                '        ng-class="{ \'-selected\': selectedIndex == $index }" ' +
                // use mousedown to stay clear of input losing focus when suggestion is clicked
                '        ng-mousedown="handleSelect($index, $event)" ' +
                '        ng-mousemove="setSelectedIndex($index)">{{ render({ value: match }) }}<a class="delete" href="javascript:void(0)" ng-if="suggestionIsDeletable({ value: match })">Delete</a></li>' +
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
                scope: {
                    inputElement: '=',
                    onSelectionComplete: '&',
                    render: '&',
                    query: '&',
                    deleteSuggestion: '&',
                    suggestionIsDeletable: '&'
                },

                link: function (scope, element, attributes) {
                    scope.matches = []
                    scope.selectedIndex = -1;

                    var resetMatches = function () {
                        scope.matches = [];
                        scope.selectedIndex = -1;
                    };

                    function select(selectedIndex) {
                        // called from within the $digest() cycle
                        var selectedValue = scope.matches[selectedIndex];

                        resetMatches();

                        // notify observer of selection complete
                        scope.onSelectionComplete({ value: selectedValue });
                    };

                    scope.isOpen = function () {
                        return scope.matches.length > 0;
                    };

                    scope.handleSelect = function (selectedIndex, evt) {
                        // don't do selection on delete
                        if (!evt.target.classList.contains('delete')) {
                            select(selectedIndex);
                        } else {
                            scope.deleteSuggestion({ value: scope.matches[selectedIndex] });
                            scope.matches.splice(selectedIndex, 1);
                            evt.preventDefault();
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

                    var latestQuery = null;

                    // 1. Watch model for changes
                    scope.$parent.$watch(attributes.queryText, function (queryText) {
                        // clear out existing displayed suggestions
                        resetMatches();

                        var inputValue = queryText.replace(/^\s+/, '').replace(/\s+$/, '');

                        var currentQuery =
                            $timeout(function () {
                                return inputValue;
                            }, 350)
                            .then(function (v) {
                                // 2. Fetch suggestions
                                if (latestQuery === currentQuery) {
                                    return scope.query({ input: v });
                                }
                            })
                            .then(function (suggestions) {
                                // 3. Present suggestions
                                if (latestQuery === currentQuery) {
                                    scope.matches = suggestions;
                                    scope.selectedIndex = suggestions.length ? 0 : -1;
                                }
                            });

                        latestQuery = currentQuery;
                    });

                    // 4. Handle mouse selection or keypresses
                    scope.inputElement.bind('keydown', function (evt) {
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
                            if (!scope.isOpen()) {
                                return;
                            }

                            if (evt.which === 40) { // Down Arrow
                                scope.selectNext();
                            } else if (evt.which === 38) { // Up Arrow
                                scope.selectPrev();
                            } else if (evt.which === 13 || evt.which === 9) { // Enter or Tab
                                select(scope.selectedIndex);
                            } else if (evt.which === 27) { // Esc
                                // 5. Handle cancelling of the dialog
                                resetMatches();
                                evt.stopPropagation();
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
