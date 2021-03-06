/*globals angular*/

'use strict';

var EventDispatcher = require('../../classes/EventDispatcher'),
    gridServicesModule = angular.module(
    'mms.designVisualization.gridService', [] );

function GridService( $log, $rootScope, $timeout ) {

        var self = this,

            gridSize,

            grids = {},

            numberOfChangesAllowedInOneCycle = 1,
            recalculateCycleDelay = 15,
            viewPortPadding = {
                x: -600,
                y: -600
            },

            recalculateVisibleDiagramComponents,
            _recalculateVisibleDiagramComponents,
            recalculateVisibleWires;

        gridSize = 10;

        recalculateVisibleWires = function ( grid ) {

            var index,
                i,
                wire;


            for (i = 0; i < grid.wires.length; i++) {

                wire = grid.wires[i];

                index = grid.visibleWires.indexOf(wire);

                if (wire.isInViewport(grid.viewPort, viewPortPadding)) {

                    if (index === -1) {
                        grid.visibleWires.push(wire);
                    }

                } else {

                    if (index > -1) {
                        grid.visibleWires.splice(index, 1);
                    }

                }

            }

            //$log.debug( 'Number of visible wires: ' + grid.visibleWires.length );

        };

        recalculateVisibleDiagramComponents = function( grid, startIndex ) {

            if (angular.isArray(grid.components) && angular.isArray(grid.wires)) {

                if (grid.recalculateVisibleDiagramComponentsPromise) {

                    if ($timeout.cancel(grid.recalculateVisibleDiagramComponentsPromise)) {
                        $log.debug('Had to kill recalculateVisibleDiagramComponents');
                    }

                }

                grid.recalculateVisibleDiagramComponentsPromise = $timeout(
                    function () {
                        _recalculateVisibleDiagramComponents(grid, startIndex);
                    },

                    recalculateCycleDelay,
                    false
                );
            }
        };

        _recalculateVisibleDiagramComponents = function ( grid, startIndex ) {

            var i, component,

                countOfChanges = 0,
                changesLimitReached = false,
                index;

            grid.insideVisibleDiagramComponentsRecalculate = true;


            if (!changesLimitReached) {
                recalculateVisibleWires( grid );
            }

            startIndex = startIndex || 0;

            for (i = startIndex; i< grid.components.length && changesLimitReached === false; i++) {

                component = grid.components[i];


                index = grid.visibleDiagramComponents.indexOf( component );

                if ( component.isInViewport( grid.viewPort, viewPortPadding ) ) {

                    if ( index === -1 ) {
                        grid.visibleDiagramComponents.push( component );
                        countOfChanges++;
                    }
                } else {

                    if ( index > -1 ) {
                        grid.visibleDiagramComponents.splice( index, 1 );
                        //countOfChanges++;
                    }
                }

                if ( countOfChanges >= numberOfChangesAllowedInOneCycle ) {
                    changesLimitReached = true;
                }

            }

            //$log.debug( 'Number of changes compared to previous diagram state:', countOfChanges );

            if ( !changesLimitReached ) {

                self.reorderVisibleComponents( grid.id );

                grid.insideVisibleDiagramComponentsRecalculate = false;


            } else {

                recalculateVisibleDiagramComponents(grid, i);

            }

        };

        this.invalidateVisibleDiagramComponents = function ( gridId, hard ) {

            var grid;

            grid = grids[ gridId ];

            if ( angular.isDefined( grid ) ) {

                if (hard === true) {

                    grid.visibleWires = [];
                    grid.visibleDiagramComponents = [];

                    $timeout(function(){

                        recalculateVisibleDiagramComponents(grid);

                    }, 1, false);

                } else {

                    if (!grid.insideVisibleDiagramComponentsRecalculate) {

                        recalculateVisibleDiagramComponents(grid);

                    }
                }
            }

        };


        this.createGrid = function ( id, diagram ) {

            var grid;


            grid = grids[ id ] = {
                id: id,
                components: diagram.getComponents(),
                visibleDiagramComponents: [],
                wires: diagram.getWires(),
                visibleWires: [],
                viewPort: {},
                insideVisibleDiagramComponentsRecalculate: false,
                initialized: false
            };

            return grid;
        };


        this.setVisibleArea = function ( gridId, viewPort ) {
            var grid = grids[ gridId ];

            if ( angular.isDefined( grid ) ) {

                if ( angular.isDefined( viewPort ) ) {

                    grid.viewPort = viewPort;

                    self.invalidateVisibleDiagramComponents( grid.id );

                }

            } else {
                throw ( 'Grid was not defined!', gridId );
            }

        };

        this.getViewPortCenter = function ( gridId ) {

            var grid,
                center;

                grid = grids[ gridId ];

            if ( angular.isDefined( grid ) && angular.isObject(grid.viewPort) ) {

                center = {

                    x: (grid.viewPort.left + grid.viewPort.right) / 2,
                    y: (grid.viewPort.top + grid.viewPort.bottom) / 2

                };
            }

            return center;

        };

        this.reorderVisibleComponents = function ( gridId ) {

            var grid = grids[ gridId ];

            if ( angular.isDefined( grid ) ) {
                grid.visibleDiagramComponents.sort( function ( a, b ) {

                    if ( a.z > b.z ) {
                        return 1;
                    }

                    if ( a.z < b.z ) {
                        return -1;
                    }

                    return 0;

                } );
            }

            this.dispatchEvent({
                type: 'visibleComponentsChanged'
            });

        };

        this.getSnappedPosition = function(position) {

            var x,
                y;

            if ($rootScope.snapToGrid !== true) {
                return position;
            }

            x = 0;
            y = 0;

            if (isNaN(gridSize)) {
                gridSize = 1;
            }

            if (angular.isObject(position)) {

                x = position.x || 0;
                y = position.y || 0;

                x = ( Math.round( x / gridSize ) * gridSize );
                y = ( Math.round( y / gridSize ) * gridSize );

                //console.log(gridSize, x, y);

            }

            return {
                x: x,
                y: y,
                z: position.z
            };

        };

        this.getGrid = function(id) {
            return grids[id];
        };

    }

EventDispatcher.prototype.apply(GridService.prototype);

gridServicesModule.service( 'gridService', GridService);
