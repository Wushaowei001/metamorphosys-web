/*globals angular*/

/**
 * @author pmeijer / https://github.com/pmeijer
 */

'use strict';

angular.module('cyphy.services')
    .service('designLayoutService', function ($q, $timeout, nodeService, baseCyPhyService, $log) {

        var self = this,
            watchers,
            typesWithConnectordsInside;

        typesWithConnectordsInside = [
            'AVMComponentModel',
            'Container'
        ];

        watchers = {};

        this.watchConnectorCompositionDetails = function (parentContext, containerId, updateListener) {

            var deferred,
                regionId,
                context;

            deferred = $q.defer();
            regionId = parentContext.regionId + '_watchConnectorCompositionDetails_' + containerId;
            context = {
                db: parentContext.db,
                regionId: regionId
            };

            nodeService.loadNode(context, containerId)
                .then(function (connectorCompositionNode) {

                    var sourcePtr,
                        destinationPtr,

                        sourceId,
                        destinationId,
                        wireSegments;

                    sourcePtr = connectorCompositionNode.getPointer('src');
                    destinationPtr = connectorCompositionNode.getPointer('dst');
                    wireSegments = connectorCompositionNode.getRegistry('wireSegments');

                    if (angular.isObject(sourcePtr)) {
                        sourceId = sourcePtr.to;
                    }

                    if (angular.isObject(destinationPtr)) {
                        destinationId = destinationPtr.to;
                    }


//                    connectorCompositionNode.onUpdate(onConnectorComposition);


                    deferred.resolve({
                        sourceId: sourceId,
                        destinationId: destinationId,
                        wireSegments: wireSegments
                    });

                });

            return deferred.promise;
        };

        this.watchConnectorsInside = function (parentContext, containerId, updateListener) {

            var deferred,
                regionId,
                context,
                metaNamesById,

                connectors,

                triggerUpdateListener,

                findChildForNode,
                onChildUpdate,
                onChildUnload,
                parseNewChild;


            deferred = $q.defer();
            regionId = parentContext.regionId + '_watchConnectorsInside_' + containerId;
            context = {
                db: parentContext.db,
                regionId: regionId
            };

            connectors = {};


            triggerUpdateListener = function (id, data, eventType) {

                $timeout(function () {
                    updateListener({
                        id: id,
                        type: eventType,
                        data: data
                    });
                });

            };

            findChildForNode = function (node) {

                return connectors[ node.getId() ];

            };

            onChildUpdate = function () {

                var newName,
                    newPos,
                    hadChanges,
                    child;

                // BaseName never changes, does it?

                child = findChildForNode(this);

                if (child) {

                    newName = this.getAttribute('name');
                    newPos = this.getRegistry('position');
                    hadChanges = false;

                    if (newName !== child.name) {
                        child.name = newName;
                        hadChanges = true;
                    }

                    if (newPos.x !== child.position.x || newPos.y !== child.position.y) {
                        child.position = newPos;
                        hadChanges = true;
                    }

                    if (hadChanges) {
                        triggerUpdateListener(child.id, child, 'update');
                    }


                }

            };

            onChildUnload = function (id) {

                var child;

                child = findChildForNode(this);

                if (child) {
                    delete connectors[ id ];
                }

                triggerUpdateListener(id, null, 'unload');

            };


            parseNewChild = function (node) {

                var deferredParseResult,
                    parsePromises,

                    baseName,
                    connector;

                deferredParseResult = $q.defer();
                parsePromises = [ deferredParseResult ];

                baseName = metaNamesById[ node.getBaseId() ];

                if (baseName === 'Connector') {

                    connector = {
                        id: node.getId(),
                        name: node.getAttribute('name'),
                        position: node.getRegistry('position'),
                        baseId: node.getBaseId()
                    };

                    connectors[ connector.id ] = connector;

                    node.onUpdate(onChildUpdate);
                    node.onUnload(onChildUnload);

                }


                deferredParseResult.resolve(connector);


                return $q.all(parsePromises);

            };

            nodeService.getMetaNodes(context)
                .then(function (meta) {

                    metaNamesById = {};

                    angular.forEach(meta, function (metaNode, name) {
                        metaNamesById[metaNode.id] = name;
                    });

                    nodeService.loadNode(context, containerId)

                        .then(function (rootNode) {
                            rootNode.loadChildren(context)
                                .then(function (childNodes) {

                                    var i,
                                        childPromises;

                                    childPromises = [];

                                    for (i = 0; i < childNodes.length; i += 1) {
                                        childPromises.push(parseNewChild(childNodes[i]));
                                    }

                                    rootNode.onNewChildLoaded(function (newNode) {


                                        parseNewChild(newNode).then(function (newChild) {
                                            triggerUpdateListener(newChild.id, newChild, 'load');
                                        });

                                    });

                                    $q.all(childPromises).then(function () {
                                        deferred.resolve(connectors);
                                    });

                                });
                        });
                });


            return deferred.promise;
        };

        this.watchDiagramElements = function (parentContext, containerId, updateListener) {

            var deferred,
                regionId,
                context,

                data,

                metaNamesById,

                onChildUnload,
                onChildUpdate,

                parseNewChild,
                findChildForNode,

                triggerUpdateListener;

            deferred = $q.defer();
            regionId = parentContext.regionId + '_watchDiagramElements_' + containerId;
            context = {
                db: parentContext.db,
                regionId: regionId
            };

            data = {
                regionId: regionId,
                elements: {}
            };


            triggerUpdateListener = function (id, data, eventType) {

                $timeout(function () {
                    updateListener({
                        id: id,
                        type: eventType,
                        data: data
                    });
                });

            };

            findChildForNode = function (node) {

                var baseName,
                    child;

                baseName = metaNamesById[ this.getBaseId() ];

                if (baseName) {

                    data.elements[ baseName ] = data.elements[ baseName ] || {};
                    child = data.elements[ baseName ][ node.getId() ];
                }

                return child;

            };

            onChildUpdate = function () {

                var newName,
                    newPos,
                    hadChanges,
                    child;

                // BaseName never changes, does it?

                child = findChildForNode(this);

                if (child) {

                    newName = this.getAttribute('name');
                    newPos = this.getRegistry('position');
                    hadChanges = false;

                    if (newName !== child.name) {
                        child.name = newName;
                        hadChanges = true;
                    }

                    if (newPos.x !== child.position.x || newPos.y !== child.position.y) {
                        child.position = newPos;
                        hadChanges = true;
                    }

                    if (hadChanges) {
                        triggerUpdateListener(child.id, child, 'update');
                    }


                }

            };

            onChildUnload = function (id) {

                var child;

                child = findChildForNode(this);

                if (child) {
                    delete data.elements[ child.baseName][ id ];
                }

                triggerUpdateListener(id, null, 'unload');

            };

            parseNewChild = function (node) {

                var deferredParseResult,
                    parsePromises,

                    getInterfacesPromise,
                    getConnectorCompositionDetailsPromise,

                    child;

                deferredParseResult = $q.defer();
                parsePromises = [ deferredParseResult ];

                child = {
                    id: node.getId(),
                    name: node.getAttribute('name'),
                    position: node.getRegistry('position'),
                    baseId: node.getBaseId()
                };

                child.baseName = metaNamesById[ child.baseId ];

                if (child.baseName) {

                    data.elements[ child.baseName ] = data.elements[ child.baseName ] || {};
                    data.elements[ child.baseName ][ child.id ] = child;

                }

                node.onUpdate(onChildUpdate);
                node.onUnload(onChildUnload);

                deferredParseResult.resolve(child);

                // Getting connectors from inside where needed

                if (typesWithConnectordsInside.indexOf(child.baseName) > -1) {

                    getInterfacesPromise = self.watchInterfaces(context, child.id, function (interfaceUpdateData) {
                        //TODO: finish this

                        $log.warn('Connector update is not handled for this', interfaceUpdateData);

                    });

                    getInterfacesPromise.then(function (interfaces) {
                        child.interfaces = interfaces;
                    });

                    parsePromises.push(getInterfacesPromise);
                }

                if (child.baseName === 'ConnectorComposition') {

                    getConnectorCompositionDetailsPromise = self.watchConnectorCompositionDetails(context, child.id, function (connectorCompositionUpdateData) {

                        //TODO: finish this

                        $log.warn('Wire update is not handled for this', connectorCompositionUpdateData);

                    });

                    getConnectorCompositionDetailsPromise.then(function (connectorCompositionDetails) {
                        console.log(connectorCompositionDetails);
                        angular.extend(child, connectorCompositionDetails);
                    });

                    parsePromises.push(getConnectorCompositionDetailsPromise);

                }


                return $q.all(parsePromises);

            };

            watchers[ parentContext.regionId ] = watchers[ parentContext.regionId ] || {};
            watchers[ parentContext.regionId ][ regionId ] = context;

            nodeService.getMetaNodes(context)
                .then(function (meta) {

                    metaNamesById = {};

                    angular.forEach(meta, function (metaNode, name) {
                        metaNamesById[metaNode.id] = name;
                    });

                    nodeService.loadNode(context, containerId)

                        .then(function (rootNode) {
                            rootNode.loadChildren(context)
                                .then(function (childNodes) {

                                    var i,
                                        childPromises;

                                    childPromises = [];

                                    for (i = 0; i < childNodes.length; i += 1) {
                                        childPromises.push(parseNewChild(childNodes[i]));
                                    }

                                    rootNode.onNewChildLoaded(function (newNode) {


                                        parseNewChild(newNode).then(function (newChild) {
                                            triggerUpdateListener(newChild.id, newChild, 'load');
                                        });

                                    });

                                    $q.all(childPromises).then(function () {

                                        deferred.resolve(data);
                                    });

                                });
                        });
                });

            return deferred.promise;
        };

        /**
         * See baseCyPhyService.watchInterfaces.
         */
        this.watchInterfaces = function (parentContext, id, updateListener) {
            return baseCyPhyService.watchInterfaces(watchers, parentContext, id, updateListener);
        };

        /**
         * See baseCyPhyService.cleanUpAllRegions.
         */
        this.cleanUpAllRegions = function (parentContext) {
            baseCyPhyService.cleanUpAllRegions(watchers, parentContext);
        };

        /**
         * See baseCyPhyService.cleanUpRegion.
         */
        this.cleanUpRegion = function (parentContext, regionId) {
            baseCyPhyService.cleanUpRegion(watchers, parentContext, regionId);
        };

        /**
         * See baseCyPhyService.registerWatcher.
         */
        this.registerWatcher = function (parentContext, fn) {
            baseCyPhyService.registerWatcher(watchers, parentContext, fn);
        };
    });