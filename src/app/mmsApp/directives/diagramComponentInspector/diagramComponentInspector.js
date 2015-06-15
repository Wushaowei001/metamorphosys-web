'use strict';

require('../contentEditable/contentEditable.js');
require('./inspectedContainerDetails.js');
require('./inspectedComponentDetails.js');
require('../../services/subcircuitDocumentation/subcircuitDocumentation.js');

angular.module('mms.diagramComponentInspector', [
        'mms.diagramComponentInspector.inspectedContainerDetails',
        'mms.diagramComponentInspector.inspectedComponentDetails',
        'mms.contentEditable',
        'mms.componentBrowser.infoButton',
        'mms.subcircuitDetails.react',
        'mms.subcircuitDocumentation'
    ])
    .directive('diagramComponentInspector', [
        function() {

            function DiagramComponentInspectorController($scope, $rootScope, $http, projectHandling, subcircuitDocumentation) {

                var self = this;

                this.$http = $http;
                this.subcircuitDocumentation = subcircuitDocumentation;
                this.projectHandling = projectHandling;

                this.$rootScope = $rootScope;

                this.config = this.config || {
                    noInspectableMessage: 'Select a single diagram element or wire to inspect.'
                };

                this.classificationTags = [];

                $scope.$watch(function() {
                    return self.inspectable;
                }, function(newInspectable, oldInspectable) {

                    if (newInspectable !== oldInspectable) {
                        self._loadInspectableDetails(newInspectable);
                    }

                });

                this._loadInspectableDetails(this.inspectable);

            }

            DiagramComponentInspectorController.prototype._loadInspectableDetails = function(newInspectable) {
                self.classificationTags = [];

                if (newInspectable) {

                    if (newInspectable.metaType === 'AVMComponent') {

                        if (newInspectable.details) {

                            if (!newInspectable.details.acmInfo) {

                                if (newInspectable.details.resource) {

                                    this.$http.get('/rest/external/acminfo/' + newInspectable.details.resource)
                                        .then(function(response) {

                                            if (response.data) {

                                                console.log(response.data);

                                                if (angular.isString(response.data.classification)) {

                                                    response.data.classification.split('.').map(function(className) {

                                                        newInspectable.classificationTags.push({
                                                            id: className,
                                                            name: className.replace(/_/g, ' ')
                                                        });
                                                    });
                                                }

                                                newInspectable.details.properties = [];

                                                angular.forEach(response.data.properties, function(prop, propName) {

                                                    newInspectable.details.properties.push({
                                                        name: propName,
                                                        value: prop.value,
                                                        unit: prop.unit
                                                    });

                                                    if (propName === 'octopart_mpn') {
                                                        newInspectable.infoUrl = 'http://octopart.com/search?q=' + prop.value + '&view=list';
                                                    }

                                                });

                                                if (angular.isString(response.data.name)) {
                                                    response.data.name.replace(/_/g, ' ');
                                                }

                                                newInspectable.details.acmInfo = response.data;

                                            }

                                        });

                                }

                            }

                        }

                    }
                    else if (newInspectable.metaType === 'Container') {

                        newInspectable.details = {};
                        this.subcircuitDocumentation.loadDocumentation(this.projectHandling.getContainerLayoutContext(), newInspectable.id)
                            .then(function (containerData) {
                                newInspectable.details.documentation = containerData;

                            });

                    }
                }

            };

            DiagramComponentInspectorController.prototype.openInfo = function() {

                if (this.inspectable.infoUrl) {

                    var w = window.open(this.inspectable.infoUrl, '_blank');
                    w.focus();

                }

            };

            DiagramComponentInspectorController.prototype.isNameValid = function(data) {

                if (data.length < 1 || data.length > 20) {
                    return 'Name should be between 1 and 20 characters long!';
                }

            };

            DiagramComponentInspectorController.prototype.commitName = function() {

                this.$rootScope.$emit('componentLabelMustBeSaved', this.inspectable);

            };


            return {
                restrict: 'E',
                controller: DiagramComponentInspectorController,
                controllerAs: 'ctrl',
                bindToController: true,
                replace: true,
                transclude: true,
                templateUrl: '/mmsApp/templates/diagramComponentInspector.html',
                require: [],
                scope: {
                    inspectable: '='
                }
            };
        }
    ]);
