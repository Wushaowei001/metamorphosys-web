(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*globals angular*/

'use strict';

var CyPhyApp = angular.module('CyPhyApp', [
    'ui.router',

    'gme.services',

    'isis.ui.components',

    'cyphy.components',

    // app specific templates
    'cyphy.mmsApp.templates',

    'ui.bootstrap',

    'mms.designVisualization.wiringService',
    'mms.designVisualization.diagramService',

    'mms.designVisualization.diagramContainer',
    'mms.designVisualization.fabricCanvas',
    'mms.designVisualization.svgDiagram',
    'mms.designVisualization.symbols',
    'ngMaterial'
]);

require('./utils.js');

require('./services/diagramService/diagramService.js');
require('./services/gridService/gridService.js');
require('./services/wiringService/wiringService.js');

require('./directives/diagramContainer/diagramContainer.js');
require('./directives/fabricCanvas/fabricCanvas.js');
require('./directives/svgDiagram/svgDiagram.js');

require('./directives/symbols/componentSymbol.js');

CyPhyApp.config(function ($stateProvider, $urlRouterProvider) {

    var selectProject;

    selectProject = {
        load: function ($q, $stateParams, $rootScope, $state, $log, dataStoreService, projectService, workspaceService) {
            var
                connectionId,
                deferred;

            $rootScope.mainDbConnectionId = 'mms-main-db-connection-id';

            connectionId = $rootScope.mainDbConnectionId;
            deferred = $q.defer();

            $rootScope.loading = true;

            dataStoreService.connectToDatabase(connectionId, {
                host: window.location.basename
            })
                .then(function () {
                    return projectService.selectProject(connectionId, $stateParams.projectId);
                })
                .then(function (projectId) {

                    var wsContext;

                    $rootScope.projectId = projectId;
                    $rootScope.loading = false;

                    wsContext = {
                        db: $rootScope.mainDbConnectionId,
                        regionId: 'WorkspaceListController_' + ( new Date() )
                            .toISOString()
                    };
                    //$scope.$on( '$destroy', function () {
                    //    workspaceService.cleanUpAllRegions( context );
                    //} );


                    workspaceService.registerWatcher(wsContext, function (destroyed) {

                        console.info('WorkspaceListController - initialize event raised');
                        workspaceService.watchWorkspaces(wsContext, function (updateObject) {
                            var index;

                            if (updateObject.type === 'load') {
                                console.log('load', updateObject);
                            } else if (updateObject.type === 'update') {
                                console.log('update', updateObject);
                            } else if (updateObject.type === 'unload') {
                                console.log('unload', updateObject);
                            } else {
                                throw new Error(updateObject);

                            }

                        }).then(function (data) {
                                var workspaceId;

                                for (workspaceId in data.workspaces) {
                                    if (data.workspaces.hasOwnProperty(workspaceId)) {
                                    }
                                }
                            });
                        });


                        deferred.resolve(projectId);
                    })
                        .
                        catch(function (reason) {
                        $rootScope.loading = false;
                        $log.debug('Opening project errored:', $stateParams.projectId, reason);
                        $state.go('404', {
                            projectId: $stateParams.projectId
                        });
                    });

                    return deferred.promise;
                }
        };

    $urlRouterProvider.otherwise('/noProject');


    $stateProvider
        .state('project', {
            url: '/project/:projectId',
            templateUrl: '/mmsApp/templates/editor.html',
            resolve: selectProject,
            controller: 'ProjectViewController'
        })
        .state('noProject', {
            url: '/noProject',
            templateUrl: '/mmsApp/templates/noProjectSpecified.html',
            controller: 'NoProjectController'
        })
        .state('404', {
            url: '/404/:projectId',
            controller: 'NoProjectController',
            templateUrl: '/mmsApp/templates/404.html'
        });
});

CyPhyApp.controller('MainNavigatorController', function ($rootScope, $scope, $window) {

    var defaultNavigatorItems;

    defaultNavigatorItems = [{
        id: 'root',
        label: 'MMS App',
        itemClass: 'cyphy-root'
    }];

    $scope.navigator = {
        separator: true,
        items: angular.copy(defaultNavigatorItems, [])
    };

    $rootScope.$watch('projectId', function (projectId) {

        if (projectId) {

            $scope.navigator.items = angular.copy(defaultNavigatorItems, []);
            $scope.navigator.items.push({
                id: 'project',
                label: projectId,
                action: function () {
                    $window.open('/?project=' + projectId);
                }
            });

        } else {
            $scope.navigator.items = angular.copy(defaultNavigatorItems, []);
        }

    });

});

CyPhyApp.controller('ProjectViewController', function ($scope, $rootScope, diagramService, $log) {

    $scope.diagram = diagramService.getDiagram();


    $log.debug('Diagram:', $scope.diagram);

});

CyPhyApp.controller('NoProjectController', function ($rootScope, $scope, $stateParams, $http, $log, $state, growl) {

    $scope.projectId = $stateParams.projectId;
    $scope.errored = false;

    $scope.startNewProject = function () {

        $rootScope.processing = true;

        $log.debug('New project creation');

        $http.get('/rest/external/copyproject/noredirect')
            .
            success(function (data) {

                $rootScope.processing = false;
                $log.debug('New project creation successful', data);
                $state.go('project', {
                    projectId: data
                });

            })
            .
            error(function (data, status) {

                $log.debug('New project creation failed', status);
                $rootScope.processing = false;
                growl.error('An error occured while project creation. Please retry later.');

            });

    };

});


//CyPhyApp.run(function ($state, growl, dataStoreService, projectService) {

//  var connectionId = 'mms-connection-id';
//
//  dataStoreService.connectToDatabase(connectionId, {host: window.location.basename})
//    .then(function () {
//      // select default project and branch (master)
//      return projectService.selectProject(connectionId, 'ADMEditor');
//    })
//    .catch(function (reason) {
//      growl.error('ADMEditor does not exist. Create and import it using the <a href="' +
//        window.location.origin + '"> webgme interface</a>.');
//      console.error(reason);
//    });
//});

},{"./directives/diagramContainer/diagramContainer.js":6,"./directives/fabricCanvas/fabricCanvas.js":8,"./directives/svgDiagram/svgDiagram.js":12,"./directives/symbols/componentSymbol.js":15,"./services/diagramService/diagramService.js":24,"./services/gridService/gridService.js":25,"./services/wiringService/wiringService.js":29,"./utils.js":30}],2:[function(require,module,exports){
// Array.prototype.find - MIT License (c) 2013 Paul Miller <http://paulmillr.com>
// For all details and docs: https://github.com/paulmillr/array.prototype.find
// Fixes and tests supplied by Duncan Hall <http://duncanhall.net> 
(function(globals){
  if (Array.prototype.find) return;

  var find = function(predicate) {
    var list = Object(this);
    var length = list.length < 0 ? 0 : list.length >>> 0; // ES.ToUint32;
    if (length === 0) return undefined;
    if (typeof predicate !== 'function' || Object.prototype.toString.call(predicate) !== '[object Function]') {
      throw new TypeError('Array#find: predicate must be a function');
    }
    var thisArg = arguments[1];
    for (var i = 0, value; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) return value;
    }
    return undefined;
  };

  if (Object.defineProperty) {
    try {
      Object.defineProperty(Array.prototype, 'find', {
        value: find, configurable: true, enumerable: false, writable: true
      });
    } catch(e) {}
  }

  if (!Array.prototype.find) {
    Array.prototype.find = find;
  }
})(this);

},{}],3:[function(require,module,exports){
/**
 * @fileoverview gl-matrix - High performance matrix and vector operations
 * @author Brandon Jones
 * @author Colin MacKenzie IV
 * @version 2.2.1
 */
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */
(function(e){"use strict";var t={};typeof exports=="undefined"?typeof define=="function"&&typeof define.amd=="object"&&define.amd?(t.exports={},define(function(){return t.exports})):t.exports=typeof window!="undefined"?window:e:t.exports=exports,function(e){if(!t)var t=1e-6;if(!n)var n=typeof Float32Array!="undefined"?Float32Array:Array;if(!r)var r=Math.random;var i={};i.setMatrixArrayType=function(e){n=e},typeof e!="undefined"&&(e.glMatrix=i);var s=Math.PI/180;i.toRadian=function(e){return e*s};var o={};o.create=function(){var e=new n(2);return e[0]=0,e[1]=0,e},o.clone=function(e){var t=new n(2);return t[0]=e[0],t[1]=e[1],t},o.fromValues=function(e,t){var r=new n(2);return r[0]=e,r[1]=t,r},o.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e},o.set=function(e,t,n){return e[0]=t,e[1]=n,e},o.add=function(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e},o.subtract=function(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e},o.sub=o.subtract,o.multiply=function(e,t,n){return e[0]=t[0]*n[0],e[1]=t[1]*n[1],e},o.mul=o.multiply,o.divide=function(e,t,n){return e[0]=t[0]/n[0],e[1]=t[1]/n[1],e},o.div=o.divide,o.min=function(e,t,n){return e[0]=Math.min(t[0],n[0]),e[1]=Math.min(t[1],n[1]),e},o.max=function(e,t,n){return e[0]=Math.max(t[0],n[0]),e[1]=Math.max(t[1],n[1]),e},o.scale=function(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e},o.scaleAndAdd=function(e,t,n,r){return e[0]=t[0]+n[0]*r,e[1]=t[1]+n[1]*r,e},o.distance=function(e,t){var n=t[0]-e[0],r=t[1]-e[1];return Math.sqrt(n*n+r*r)},o.dist=o.distance,o.squaredDistance=function(e,t){var n=t[0]-e[0],r=t[1]-e[1];return n*n+r*r},o.sqrDist=o.squaredDistance,o.length=function(e){var t=e[0],n=e[1];return Math.sqrt(t*t+n*n)},o.len=o.length,o.squaredLength=function(e){var t=e[0],n=e[1];return t*t+n*n},o.sqrLen=o.squaredLength,o.negate=function(e,t){return e[0]=-t[0],e[1]=-t[1],e},o.normalize=function(e,t){var n=t[0],r=t[1],i=n*n+r*r;return i>0&&(i=1/Math.sqrt(i),e[0]=t[0]*i,e[1]=t[1]*i),e},o.dot=function(e,t){return e[0]*t[0]+e[1]*t[1]},o.cross=function(e,t,n){var r=t[0]*n[1]-t[1]*n[0];return e[0]=e[1]=0,e[2]=r,e},o.lerp=function(e,t,n,r){var i=t[0],s=t[1];return e[0]=i+r*(n[0]-i),e[1]=s+r*(n[1]-s),e},o.random=function(e,t){t=t||1;var n=r()*2*Math.PI;return e[0]=Math.cos(n)*t,e[1]=Math.sin(n)*t,e},o.transformMat2=function(e,t,n){var r=t[0],i=t[1];return e[0]=n[0]*r+n[2]*i,e[1]=n[1]*r+n[3]*i,e},o.transformMat2d=function(e,t,n){var r=t[0],i=t[1];return e[0]=n[0]*r+n[2]*i+n[4],e[1]=n[1]*r+n[3]*i+n[5],e},o.transformMat3=function(e,t,n){var r=t[0],i=t[1];return e[0]=n[0]*r+n[3]*i+n[6],e[1]=n[1]*r+n[4]*i+n[7],e},o.transformMat4=function(e,t,n){var r=t[0],i=t[1];return e[0]=n[0]*r+n[4]*i+n[12],e[1]=n[1]*r+n[5]*i+n[13],e},o.forEach=function(){var e=o.create();return function(t,n,r,i,s,o){var u,a;n||(n=2),r||(r=0),i?a=Math.min(i*n+r,t.length):a=t.length;for(u=r;u<a;u+=n)e[0]=t[u],e[1]=t[u+1],s(e,e,o),t[u]=e[0],t[u+1]=e[1];return t}}(),o.str=function(e){return"vec2("+e[0]+", "+e[1]+")"},typeof e!="undefined"&&(e.vec2=o);var u={};u.create=function(){var e=new n(3);return e[0]=0,e[1]=0,e[2]=0,e},u.clone=function(e){var t=new n(3);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t},u.fromValues=function(e,t,r){var i=new n(3);return i[0]=e,i[1]=t,i[2]=r,i},u.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e},u.set=function(e,t,n,r){return e[0]=t,e[1]=n,e[2]=r,e},u.add=function(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e[2]=t[2]+n[2],e},u.subtract=function(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e[2]=t[2]-n[2],e},u.sub=u.subtract,u.multiply=function(e,t,n){return e[0]=t[0]*n[0],e[1]=t[1]*n[1],e[2]=t[2]*n[2],e},u.mul=u.multiply,u.divide=function(e,t,n){return e[0]=t[0]/n[0],e[1]=t[1]/n[1],e[2]=t[2]/n[2],e},u.div=u.divide,u.min=function(e,t,n){return e[0]=Math.min(t[0],n[0]),e[1]=Math.min(t[1],n[1]),e[2]=Math.min(t[2],n[2]),e},u.max=function(e,t,n){return e[0]=Math.max(t[0],n[0]),e[1]=Math.max(t[1],n[1]),e[2]=Math.max(t[2],n[2]),e},u.scale=function(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e[2]=t[2]*n,e},u.scaleAndAdd=function(e,t,n,r){return e[0]=t[0]+n[0]*r,e[1]=t[1]+n[1]*r,e[2]=t[2]+n[2]*r,e},u.distance=function(e,t){var n=t[0]-e[0],r=t[1]-e[1],i=t[2]-e[2];return Math.sqrt(n*n+r*r+i*i)},u.dist=u.distance,u.squaredDistance=function(e,t){var n=t[0]-e[0],r=t[1]-e[1],i=t[2]-e[2];return n*n+r*r+i*i},u.sqrDist=u.squaredDistance,u.length=function(e){var t=e[0],n=e[1],r=e[2];return Math.sqrt(t*t+n*n+r*r)},u.len=u.length,u.squaredLength=function(e){var t=e[0],n=e[1],r=e[2];return t*t+n*n+r*r},u.sqrLen=u.squaredLength,u.negate=function(e,t){return e[0]=-t[0],e[1]=-t[1],e[2]=-t[2],e},u.normalize=function(e,t){var n=t[0],r=t[1],i=t[2],s=n*n+r*r+i*i;return s>0&&(s=1/Math.sqrt(s),e[0]=t[0]*s,e[1]=t[1]*s,e[2]=t[2]*s),e},u.dot=function(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]},u.cross=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=n[0],u=n[1],a=n[2];return e[0]=i*a-s*u,e[1]=s*o-r*a,e[2]=r*u-i*o,e},u.lerp=function(e,t,n,r){var i=t[0],s=t[1],o=t[2];return e[0]=i+r*(n[0]-i),e[1]=s+r*(n[1]-s),e[2]=o+r*(n[2]-o),e},u.random=function(e,t){t=t||1;var n=r()*2*Math.PI,i=r()*2-1,s=Math.sqrt(1-i*i)*t;return e[0]=Math.cos(n)*s,e[1]=Math.sin(n)*s,e[2]=i*t,e},u.transformMat4=function(e,t,n){var r=t[0],i=t[1],s=t[2];return e[0]=n[0]*r+n[4]*i+n[8]*s+n[12],e[1]=n[1]*r+n[5]*i+n[9]*s+n[13],e[2]=n[2]*r+n[6]*i+n[10]*s+n[14],e},u.transformMat3=function(e,t,n){var r=t[0],i=t[1],s=t[2];return e[0]=r*n[0]+i*n[3]+s*n[6],e[1]=r*n[1]+i*n[4]+s*n[7],e[2]=r*n[2]+i*n[5]+s*n[8],e},u.transformQuat=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=n[0],u=n[1],a=n[2],f=n[3],l=f*r+u*s-a*i,c=f*i+a*r-o*s,h=f*s+o*i-u*r,p=-o*r-u*i-a*s;return e[0]=l*f+p*-o+c*-a-h*-u,e[1]=c*f+p*-u+h*-o-l*-a,e[2]=h*f+p*-a+l*-u-c*-o,e},u.rotateX=function(e,t,n,r){var i=[],s=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],s[0]=i[0],s[1]=i[1]*Math.cos(r)-i[2]*Math.sin(r),s[2]=i[1]*Math.sin(r)+i[2]*Math.cos(r),e[0]=s[0]+n[0],e[1]=s[1]+n[1],e[2]=s[2]+n[2],e},u.rotateY=function(e,t,n,r){var i=[],s=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],s[0]=i[2]*Math.sin(r)+i[0]*Math.cos(r),s[1]=i[1],s[2]=i[2]*Math.cos(r)-i[0]*Math.sin(r),e[0]=s[0]+n[0],e[1]=s[1]+n[1],e[2]=s[2]+n[2],e},u.rotateZ=function(e,t,n,r){var i=[],s=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],s[0]=i[0]*Math.cos(r)-i[1]*Math.sin(r),s[1]=i[0]*Math.sin(r)+i[1]*Math.cos(r),s[2]=i[2],e[0]=s[0]+n[0],e[1]=s[1]+n[1],e[2]=s[2]+n[2],e},u.forEach=function(){var e=u.create();return function(t,n,r,i,s,o){var u,a;n||(n=3),r||(r=0),i?a=Math.min(i*n+r,t.length):a=t.length;for(u=r;u<a;u+=n)e[0]=t[u],e[1]=t[u+1],e[2]=t[u+2],s(e,e,o),t[u]=e[0],t[u+1]=e[1],t[u+2]=e[2];return t}}(),u.str=function(e){return"vec3("+e[0]+", "+e[1]+", "+e[2]+")"},typeof e!="undefined"&&(e.vec3=u);var a={};a.create=function(){var e=new n(4);return e[0]=0,e[1]=0,e[2]=0,e[3]=0,e},a.clone=function(e){var t=new n(4);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t},a.fromValues=function(e,t,r,i){var s=new n(4);return s[0]=e,s[1]=t,s[2]=r,s[3]=i,s},a.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e},a.set=function(e,t,n,r,i){return e[0]=t,e[1]=n,e[2]=r,e[3]=i,e},a.add=function(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e[2]=t[2]+n[2],e[3]=t[3]+n[3],e},a.subtract=function(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e[2]=t[2]-n[2],e[3]=t[3]-n[3],e},a.sub=a.subtract,a.multiply=function(e,t,n){return e[0]=t[0]*n[0],e[1]=t[1]*n[1],e[2]=t[2]*n[2],e[3]=t[3]*n[3],e},a.mul=a.multiply,a.divide=function(e,t,n){return e[0]=t[0]/n[0],e[1]=t[1]/n[1],e[2]=t[2]/n[2],e[3]=t[3]/n[3],e},a.div=a.divide,a.min=function(e,t,n){return e[0]=Math.min(t[0],n[0]),e[1]=Math.min(t[1],n[1]),e[2]=Math.min(t[2],n[2]),e[3]=Math.min(t[3],n[3]),e},a.max=function(e,t,n){return e[0]=Math.max(t[0],n[0]),e[1]=Math.max(t[1],n[1]),e[2]=Math.max(t[2],n[2]),e[3]=Math.max(t[3],n[3]),e},a.scale=function(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e[2]=t[2]*n,e[3]=t[3]*n,e},a.scaleAndAdd=function(e,t,n,r){return e[0]=t[0]+n[0]*r,e[1]=t[1]+n[1]*r,e[2]=t[2]+n[2]*r,e[3]=t[3]+n[3]*r,e},a.distance=function(e,t){var n=t[0]-e[0],r=t[1]-e[1],i=t[2]-e[2],s=t[3]-e[3];return Math.sqrt(n*n+r*r+i*i+s*s)},a.dist=a.distance,a.squaredDistance=function(e,t){var n=t[0]-e[0],r=t[1]-e[1],i=t[2]-e[2],s=t[3]-e[3];return n*n+r*r+i*i+s*s},a.sqrDist=a.squaredDistance,a.length=function(e){var t=e[0],n=e[1],r=e[2],i=e[3];return Math.sqrt(t*t+n*n+r*r+i*i)},a.len=a.length,a.squaredLength=function(e){var t=e[0],n=e[1],r=e[2],i=e[3];return t*t+n*n+r*r+i*i},a.sqrLen=a.squaredLength,a.negate=function(e,t){return e[0]=-t[0],e[1]=-t[1],e[2]=-t[2],e[3]=-t[3],e},a.normalize=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=n*n+r*r+i*i+s*s;return o>0&&(o=1/Math.sqrt(o),e[0]=t[0]*o,e[1]=t[1]*o,e[2]=t[2]*o,e[3]=t[3]*o),e},a.dot=function(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]+e[3]*t[3]},a.lerp=function(e,t,n,r){var i=t[0],s=t[1],o=t[2],u=t[3];return e[0]=i+r*(n[0]-i),e[1]=s+r*(n[1]-s),e[2]=o+r*(n[2]-o),e[3]=u+r*(n[3]-u),e},a.random=function(e,t){return t=t||1,e[0]=r(),e[1]=r(),e[2]=r(),e[3]=r(),a.normalize(e,e),a.scale(e,e,t),e},a.transformMat4=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3];return e[0]=n[0]*r+n[4]*i+n[8]*s+n[12]*o,e[1]=n[1]*r+n[5]*i+n[9]*s+n[13]*o,e[2]=n[2]*r+n[6]*i+n[10]*s+n[14]*o,e[3]=n[3]*r+n[7]*i+n[11]*s+n[15]*o,e},a.transformQuat=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=n[0],u=n[1],a=n[2],f=n[3],l=f*r+u*s-a*i,c=f*i+a*r-o*s,h=f*s+o*i-u*r,p=-o*r-u*i-a*s;return e[0]=l*f+p*-o+c*-a-h*-u,e[1]=c*f+p*-u+h*-o-l*-a,e[2]=h*f+p*-a+l*-u-c*-o,e},a.forEach=function(){var e=a.create();return function(t,n,r,i,s,o){var u,a;n||(n=4),r||(r=0),i?a=Math.min(i*n+r,t.length):a=t.length;for(u=r;u<a;u+=n)e[0]=t[u],e[1]=t[u+1],e[2]=t[u+2],e[3]=t[u+3],s(e,e,o),t[u]=e[0],t[u+1]=e[1],t[u+2]=e[2],t[u+3]=e[3];return t}}(),a.str=function(e){return"vec4("+e[0]+", "+e[1]+", "+e[2]+", "+e[3]+")"},typeof e!="undefined"&&(e.vec4=a);var f={};f.create=function(){var e=new n(4);return e[0]=1,e[1]=0,e[2]=0,e[3]=1,e},f.clone=function(e){var t=new n(4);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t},f.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e},f.identity=function(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=1,e},f.transpose=function(e,t){if(e===t){var n=t[1];e[1]=t[2],e[2]=n}else e[0]=t[0],e[1]=t[2],e[2]=t[1],e[3]=t[3];return e},f.invert=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=n*s-i*r;return o?(o=1/o,e[0]=s*o,e[1]=-r*o,e[2]=-i*o,e[3]=n*o,e):null},f.adjoint=function(e,t){var n=t[0];return e[0]=t[3],e[1]=-t[1],e[2]=-t[2],e[3]=n,e},f.determinant=function(e){return e[0]*e[3]-e[2]*e[1]},f.multiply=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=n[0],a=n[1],f=n[2],l=n[3];return e[0]=r*u+s*a,e[1]=i*u+o*a,e[2]=r*f+s*l,e[3]=i*f+o*l,e},f.mul=f.multiply,f.rotate=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=Math.sin(n),a=Math.cos(n);return e[0]=r*a+s*u,e[1]=i*a+o*u,e[2]=r*-u+s*a,e[3]=i*-u+o*a,e},f.scale=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=n[0],a=n[1];return e[0]=r*u,e[1]=i*u,e[2]=s*a,e[3]=o*a,e},f.str=function(e){return"mat2("+e[0]+", "+e[1]+", "+e[2]+", "+e[3]+")"},f.frob=function(e){return Math.sqrt(Math.pow(e[0],2)+Math.pow(e[1],2)+Math.pow(e[2],2)+Math.pow(e[3],2))},f.LDU=function(e,t,n,r){return e[2]=r[2]/r[0],n[0]=r[0],n[1]=r[1],n[3]=r[3]-e[2]*n[1],[e,t,n]},typeof e!="undefined"&&(e.mat2=f);var l={};l.create=function(){var e=new n(6);return e[0]=1,e[1]=0,e[2]=0,e[3]=1,e[4]=0,e[5]=0,e},l.clone=function(e){var t=new n(6);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4],t[5]=e[5],t},l.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[4]=t[4],e[5]=t[5],e},l.identity=function(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=1,e[4]=0,e[5]=0,e},l.invert=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=t[4],u=t[5],a=n*s-r*i;return a?(a=1/a,e[0]=s*a,e[1]=-r*a,e[2]=-i*a,e[3]=n*a,e[4]=(i*u-s*o)*a,e[5]=(r*o-n*u)*a,e):null},l.determinant=function(e){return e[0]*e[3]-e[1]*e[2]},l.multiply=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=t[4],a=t[5],f=n[0],l=n[1],c=n[2],h=n[3],p=n[4],d=n[5];return e[0]=r*f+s*l,e[1]=i*f+o*l,e[2]=r*c+s*h,e[3]=i*c+o*h,e[4]=r*p+s*d+u,e[5]=i*p+o*d+a,e},l.mul=l.multiply,l.rotate=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=t[4],a=t[5],f=Math.sin(n),l=Math.cos(n);return e[0]=r*l+s*f,e[1]=i*l+o*f,e[2]=r*-f+s*l,e[3]=i*-f+o*l,e[4]=u,e[5]=a,e},l.scale=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=t[4],a=t[5],f=n[0],l=n[1];return e[0]=r*f,e[1]=i*f,e[2]=s*l,e[3]=o*l,e[4]=u,e[5]=a,e},l.translate=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=t[4],a=t[5],f=n[0],l=n[1];return e[0]=r,e[1]=i,e[2]=s,e[3]=o,e[4]=r*f+s*l+u,e[5]=i*f+o*l+a,e},l.str=function(e){return"mat2d("+e[0]+", "+e[1]+", "+e[2]+", "+e[3]+", "+e[4]+", "+e[5]+")"},l.frob=function(e){return Math.sqrt(Math.pow(e[0],2)+Math.pow(e[1],2)+Math.pow(e[2],2)+Math.pow(e[3],2)+Math.pow(e[4],2)+Math.pow(e[5],2)+1)},typeof e!="undefined"&&(e.mat2d=l);var c={};c.create=function(){var e=new n(9);return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=1,e[5]=0,e[6]=0,e[7]=0,e[8]=1,e},c.fromMat4=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[4],e[4]=t[5],e[5]=t[6],e[6]=t[8],e[7]=t[9],e[8]=t[10],e},c.clone=function(e){var t=new n(9);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4],t[5]=e[5],t[6]=e[6],t[7]=e[7],t[8]=e[8],t},c.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[8]=t[8],e},c.identity=function(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=1,e[5]=0,e[6]=0,e[7]=0,e[8]=1,e},c.transpose=function(e,t){if(e===t){var n=t[1],r=t[2],i=t[5];e[1]=t[3],e[2]=t[6],e[3]=n,e[5]=t[7],e[6]=r,e[7]=i}else e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8];return e},c.invert=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=t[4],u=t[5],a=t[6],f=t[7],l=t[8],c=l*o-u*f,h=-l*s+u*a,p=f*s-o*a,d=n*c+r*h+i*p;return d?(d=1/d,e[0]=c*d,e[1]=(-l*r+i*f)*d,e[2]=(u*r-i*o)*d,e[3]=h*d,e[4]=(l*n-i*a)*d,e[5]=(-u*n+i*s)*d,e[6]=p*d,e[7]=(-f*n+r*a)*d,e[8]=(o*n-r*s)*d,e):null},c.adjoint=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=t[4],u=t[5],a=t[6],f=t[7],l=t[8];return e[0]=o*l-u*f,e[1]=i*f-r*l,e[2]=r*u-i*o,e[3]=u*a-s*l,e[4]=n*l-i*a,e[5]=i*s-n*u,e[6]=s*f-o*a,e[7]=r*a-n*f,e[8]=n*o-r*s,e},c.determinant=function(e){var t=e[0],n=e[1],r=e[2],i=e[3],s=e[4],o=e[5],u=e[6],a=e[7],f=e[8];return t*(f*s-o*a)+n*(-f*i+o*u)+r*(a*i-s*u)},c.multiply=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=t[4],a=t[5],f=t[6],l=t[7],c=t[8],h=n[0],p=n[1],d=n[2],v=n[3],m=n[4],g=n[5],y=n[6],b=n[7],w=n[8];return e[0]=h*r+p*o+d*f,e[1]=h*i+p*u+d*l,e[2]=h*s+p*a+d*c,e[3]=v*r+m*o+g*f,e[4]=v*i+m*u+g*l,e[5]=v*s+m*a+g*c,e[6]=y*r+b*o+w*f,e[7]=y*i+b*u+w*l,e[8]=y*s+b*a+w*c,e},c.mul=c.multiply,c.translate=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=t[4],a=t[5],f=t[6],l=t[7],c=t[8],h=n[0],p=n[1];return e[0]=r,e[1]=i,e[2]=s,e[3]=o,e[4]=u,e[5]=a,e[6]=h*r+p*o+f,e[7]=h*i+p*u+l,e[8]=h*s+p*a+c,e},c.rotate=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=t[4],a=t[5],f=t[6],l=t[7],c=t[8],h=Math.sin(n),p=Math.cos(n);return e[0]=p*r+h*o,e[1]=p*i+h*u,e[2]=p*s+h*a,e[3]=p*o-h*r,e[4]=p*u-h*i,e[5]=p*a-h*s,e[6]=f,e[7]=l,e[8]=c,e},c.scale=function(e,t,n){var r=n[0],i=n[1];return e[0]=r*t[0],e[1]=r*t[1],e[2]=r*t[2],e[3]=i*t[3],e[4]=i*t[4],e[5]=i*t[5],e[6]=t[6],e[7]=t[7],e[8]=t[8],e},c.fromMat2d=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=0,e[3]=t[2],e[4]=t[3],e[5]=0,e[6]=t[4],e[7]=t[5],e[8]=1,e},c.fromQuat=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=n+n,u=r+r,a=i+i,f=n*o,l=r*o,c=r*u,h=i*o,p=i*u,d=i*a,v=s*o,m=s*u,g=s*a;return e[0]=1-c-d,e[3]=l-g,e[6]=h+m,e[1]=l+g,e[4]=1-f-d,e[7]=p-v,e[2]=h-m,e[5]=p+v,e[8]=1-f-c,e},c.normalFromMat4=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=t[4],u=t[5],a=t[6],f=t[7],l=t[8],c=t[9],h=t[10],p=t[11],d=t[12],v=t[13],m=t[14],g=t[15],y=n*u-r*o,b=n*a-i*o,w=n*f-s*o,E=r*a-i*u,S=r*f-s*u,x=i*f-s*a,T=l*v-c*d,N=l*m-h*d,C=l*g-p*d,k=c*m-h*v,L=c*g-p*v,A=h*g-p*m,O=y*A-b*L+w*k+E*C-S*N+x*T;return O?(O=1/O,e[0]=(u*A-a*L+f*k)*O,e[1]=(a*C-o*A-f*N)*O,e[2]=(o*L-u*C+f*T)*O,e[3]=(i*L-r*A-s*k)*O,e[4]=(n*A-i*C+s*N)*O,e[5]=(r*C-n*L-s*T)*O,e[6]=(v*x-m*S+g*E)*O,e[7]=(m*w-d*x-g*b)*O,e[8]=(d*S-v*w+g*y)*O,e):null},c.str=function(e){return"mat3("+e[0]+", "+e[1]+", "+e[2]+", "+e[3]+", "+e[4]+", "+e[5]+", "+e[6]+", "+e[7]+", "+e[8]+")"},c.frob=function(e){return Math.sqrt(Math.pow(e[0],2)+Math.pow(e[1],2)+Math.pow(e[2],2)+Math.pow(e[3],2)+Math.pow(e[4],2)+Math.pow(e[5],2)+Math.pow(e[6],2)+Math.pow(e[7],2)+Math.pow(e[8],2))},typeof e!="undefined"&&(e.mat3=c);var h={};h.create=function(){var e=new n(16);return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e},h.clone=function(e){var t=new n(16);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4],t[5]=e[5],t[6]=e[6],t[7]=e[7],t[8]=e[8],t[9]=e[9],t[10]=e[10],t[11]=e[11],t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15],t},h.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e},h.identity=function(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e},h.transpose=function(e,t){if(e===t){var n=t[1],r=t[2],i=t[3],s=t[6],o=t[7],u=t[11];e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=n,e[6]=t[9],e[7]=t[13],e[8]=r,e[9]=s,e[11]=t[14],e[12]=i,e[13]=o,e[14]=u}else e[0]=t[0],e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=t[1],e[5]=t[5],e[6]=t[9],e[7]=t[13],e[8]=t[2],e[9]=t[6],e[10]=t[10],e[11]=t[14],e[12]=t[3],e[13]=t[7],e[14]=t[11],e[15]=t[15];return e},h.invert=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=t[4],u=t[5],a=t[6],f=t[7],l=t[8],c=t[9],h=t[10],p=t[11],d=t[12],v=t[13],m=t[14],g=t[15],y=n*u-r*o,b=n*a-i*o,w=n*f-s*o,E=r*a-i*u,S=r*f-s*u,x=i*f-s*a,T=l*v-c*d,N=l*m-h*d,C=l*g-p*d,k=c*m-h*v,L=c*g-p*v,A=h*g-p*m,O=y*A-b*L+w*k+E*C-S*N+x*T;return O?(O=1/O,e[0]=(u*A-a*L+f*k)*O,e[1]=(i*L-r*A-s*k)*O,e[2]=(v*x-m*S+g*E)*O,e[3]=(h*S-c*x-p*E)*O,e[4]=(a*C-o*A-f*N)*O,e[5]=(n*A-i*C+s*N)*O,e[6]=(m*w-d*x-g*b)*O,e[7]=(l*x-h*w+p*b)*O,e[8]=(o*L-u*C+f*T)*O,e[9]=(r*C-n*L-s*T)*O,e[10]=(d*S-v*w+g*y)*O,e[11]=(c*w-l*S-p*y)*O,e[12]=(u*N-o*k-a*T)*O,e[13]=(n*k-r*N+i*T)*O,e[14]=(v*b-d*E-m*y)*O,e[15]=(l*E-c*b+h*y)*O,e):null},h.adjoint=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=t[4],u=t[5],a=t[6],f=t[7],l=t[8],c=t[9],h=t[10],p=t[11],d=t[12],v=t[13],m=t[14],g=t[15];return e[0]=u*(h*g-p*m)-c*(a*g-f*m)+v*(a*p-f*h),e[1]=-(r*(h*g-p*m)-c*(i*g-s*m)+v*(i*p-s*h)),e[2]=r*(a*g-f*m)-u*(i*g-s*m)+v*(i*f-s*a),e[3]=-(r*(a*p-f*h)-u*(i*p-s*h)+c*(i*f-s*a)),e[4]=-(o*(h*g-p*m)-l*(a*g-f*m)+d*(a*p-f*h)),e[5]=n*(h*g-p*m)-l*(i*g-s*m)+d*(i*p-s*h),e[6]=-(n*(a*g-f*m)-o*(i*g-s*m)+d*(i*f-s*a)),e[7]=n*(a*p-f*h)-o*(i*p-s*h)+l*(i*f-s*a),e[8]=o*(c*g-p*v)-l*(u*g-f*v)+d*(u*p-f*c),e[9]=-(n*(c*g-p*v)-l*(r*g-s*v)+d*(r*p-s*c)),e[10]=n*(u*g-f*v)-o*(r*g-s*v)+d*(r*f-s*u),e[11]=-(n*(u*p-f*c)-o*(r*p-s*c)+l*(r*f-s*u)),e[12]=-(o*(c*m-h*v)-l*(u*m-a*v)+d*(u*h-a*c)),e[13]=n*(c*m-h*v)-l*(r*m-i*v)+d*(r*h-i*c),e[14]=-(n*(u*m-a*v)-o*(r*m-i*v)+d*(r*a-i*u)),e[15]=n*(u*h-a*c)-o*(r*h-i*c)+l*(r*a-i*u),e},h.determinant=function(e){var t=e[0],n=e[1],r=e[2],i=e[3],s=e[4],o=e[5],u=e[6],a=e[7],f=e[8],l=e[9],c=e[10],h=e[11],p=e[12],d=e[13],v=e[14],m=e[15],g=t*o-n*s,y=t*u-r*s,b=t*a-i*s,w=n*u-r*o,E=n*a-i*o,S=r*a-i*u,x=f*d-l*p,T=f*v-c*p,N=f*m-h*p,C=l*v-c*d,k=l*m-h*d,L=c*m-h*v;return g*L-y*k+b*C+w*N-E*T+S*x},h.multiply=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=t[4],a=t[5],f=t[6],l=t[7],c=t[8],h=t[9],p=t[10],d=t[11],v=t[12],m=t[13],g=t[14],y=t[15],b=n[0],w=n[1],E=n[2],S=n[3];return e[0]=b*r+w*u+E*c+S*v,e[1]=b*i+w*a+E*h+S*m,e[2]=b*s+w*f+E*p+S*g,e[3]=b*o+w*l+E*d+S*y,b=n[4],w=n[5],E=n[6],S=n[7],e[4]=b*r+w*u+E*c+S*v,e[5]=b*i+w*a+E*h+S*m,e[6]=b*s+w*f+E*p+S*g,e[7]=b*o+w*l+E*d+S*y,b=n[8],w=n[9],E=n[10],S=n[11],e[8]=b*r+w*u+E*c+S*v,e[9]=b*i+w*a+E*h+S*m,e[10]=b*s+w*f+E*p+S*g,e[11]=b*o+w*l+E*d+S*y,b=n[12],w=n[13],E=n[14],S=n[15],e[12]=b*r+w*u+E*c+S*v,e[13]=b*i+w*a+E*h+S*m,e[14]=b*s+w*f+E*p+S*g,e[15]=b*o+w*l+E*d+S*y,e},h.mul=h.multiply,h.translate=function(e,t,n){var r=n[0],i=n[1],s=n[2],o,u,a,f,l,c,h,p,d,v,m,g;return t===e?(e[12]=t[0]*r+t[4]*i+t[8]*s+t[12],e[13]=t[1]*r+t[5]*i+t[9]*s+t[13],e[14]=t[2]*r+t[6]*i+t[10]*s+t[14],e[15]=t[3]*r+t[7]*i+t[11]*s+t[15]):(o=t[0],u=t[1],a=t[2],f=t[3],l=t[4],c=t[5],h=t[6],p=t[7],d=t[8],v=t[9],m=t[10],g=t[11],e[0]=o,e[1]=u,e[2]=a,e[3]=f,e[4]=l,e[5]=c,e[6]=h,e[7]=p,e[8]=d,e[9]=v,e[10]=m,e[11]=g,e[12]=o*r+l*i+d*s+t[12],e[13]=u*r+c*i+v*s+t[13],e[14]=a*r+h*i+m*s+t[14],e[15]=f*r+p*i+g*s+t[15]),e},h.scale=function(e,t,n){var r=n[0],i=n[1],s=n[2];return e[0]=t[0]*r,e[1]=t[1]*r,e[2]=t[2]*r,e[3]=t[3]*r,e[4]=t[4]*i,e[5]=t[5]*i,e[6]=t[6]*i,e[7]=t[7]*i,e[8]=t[8]*s,e[9]=t[9]*s,e[10]=t[10]*s,e[11]=t[11]*s,e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e},h.rotate=function(e,n,r,i){var s=i[0],o=i[1],u=i[2],a=Math.sqrt(s*s+o*o+u*u),f,l,c,h,p,d,v,m,g,y,b,w,E,S,x,T,N,C,k,L,A,O,M,_;return Math.abs(a)<t?null:(a=1/a,s*=a,o*=a,u*=a,f=Math.sin(r),l=Math.cos(r),c=1-l,h=n[0],p=n[1],d=n[2],v=n[3],m=n[4],g=n[5],y=n[6],b=n[7],w=n[8],E=n[9],S=n[10],x=n[11],T=s*s*c+l,N=o*s*c+u*f,C=u*s*c-o*f,k=s*o*c-u*f,L=o*o*c+l,A=u*o*c+s*f,O=s*u*c+o*f,M=o*u*c-s*f,_=u*u*c+l,e[0]=h*T+m*N+w*C,e[1]=p*T+g*N+E*C,e[2]=d*T+y*N+S*C,e[3]=v*T+b*N+x*C,e[4]=h*k+m*L+w*A,e[5]=p*k+g*L+E*A,e[6]=d*k+y*L+S*A,e[7]=v*k+b*L+x*A,e[8]=h*O+m*M+w*_,e[9]=p*O+g*M+E*_,e[10]=d*O+y*M+S*_,e[11]=v*O+b*M+x*_,n!==e&&(e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15]),e)},h.rotateX=function(e,t,n){var r=Math.sin(n),i=Math.cos(n),s=t[4],o=t[5],u=t[6],a=t[7],f=t[8],l=t[9],c=t[10],h=t[11];return t!==e&&(e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[4]=s*i+f*r,e[5]=o*i+l*r,e[6]=u*i+c*r,e[7]=a*i+h*r,e[8]=f*i-s*r,e[9]=l*i-o*r,e[10]=c*i-u*r,e[11]=h*i-a*r,e},h.rotateY=function(e,t,n){var r=Math.sin(n),i=Math.cos(n),s=t[0],o=t[1],u=t[2],a=t[3],f=t[8],l=t[9],c=t[10],h=t[11];return t!==e&&(e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=s*i-f*r,e[1]=o*i-l*r,e[2]=u*i-c*r,e[3]=a*i-h*r,e[8]=s*r+f*i,e[9]=o*r+l*i,e[10]=u*r+c*i,e[11]=a*r+h*i,e},h.rotateZ=function(e,t,n){var r=Math.sin(n),i=Math.cos(n),s=t[0],o=t[1],u=t[2],a=t[3],f=t[4],l=t[5],c=t[6],h=t[7];return t!==e&&(e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=s*i+f*r,e[1]=o*i+l*r,e[2]=u*i+c*r,e[3]=a*i+h*r,e[4]=f*i-s*r,e[5]=l*i-o*r,e[6]=c*i-u*r,e[7]=h*i-a*r,e},h.fromRotationTranslation=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=r+r,a=i+i,f=s+s,l=r*u,c=r*a,h=r*f,p=i*a,d=i*f,v=s*f,m=o*u,g=o*a,y=o*f;return e[0]=1-(p+v),e[1]=c+y,e[2]=h-g,e[3]=0,e[4]=c-y,e[5]=1-(l+v),e[6]=d+m,e[7]=0,e[8]=h+g,e[9]=d-m,e[10]=1-(l+p),e[11]=0,e[12]=n[0],e[13]=n[1],e[14]=n[2],e[15]=1,e},h.fromQuat=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=n+n,u=r+r,a=i+i,f=n*o,l=r*o,c=r*u,h=i*o,p=i*u,d=i*a,v=s*o,m=s*u,g=s*a;return e[0]=1-c-d,e[1]=l+g,e[2]=h-m,e[3]=0,e[4]=l-g,e[5]=1-f-d,e[6]=p+v,e[7]=0,e[8]=h+m,e[9]=p-v,e[10]=1-f-c,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e},h.frustum=function(e,t,n,r,i,s,o){var u=1/(n-t),a=1/(i-r),f=1/(s-o);return e[0]=s*2*u,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=s*2*a,e[6]=0,e[7]=0,e[8]=(n+t)*u,e[9]=(i+r)*a,e[10]=(o+s)*f,e[11]=-1,e[12]=0,e[13]=0,e[14]=o*s*2*f,e[15]=0,e},h.perspective=function(e,t,n,r,i){var s=1/Math.tan(t/2),o=1/(r-i);return e[0]=s/n,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=s,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=(i+r)*o,e[11]=-1,e[12]=0,e[13]=0,e[14]=2*i*r*o,e[15]=0,e},h.ortho=function(e,t,n,r,i,s,o){var u=1/(t-n),a=1/(r-i),f=1/(s-o);return e[0]=-2*u,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=-2*a,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=2*f,e[11]=0,e[12]=(t+n)*u,e[13]=(i+r)*a,e[14]=(o+s)*f,e[15]=1,e},h.lookAt=function(e,n,r,i){var s,o,u,a,f,l,c,p,d,v,m=n[0],g=n[1],y=n[2],b=i[0],w=i[1],E=i[2],S=r[0],x=r[1],T=r[2];return Math.abs(m-S)<t&&Math.abs(g-x)<t&&Math.abs(y-T)<t?h.identity(e):(c=m-S,p=g-x,d=y-T,v=1/Math.sqrt(c*c+p*p+d*d),c*=v,p*=v,d*=v,s=w*d-E*p,o=E*c-b*d,u=b*p-w*c,v=Math.sqrt(s*s+o*o+u*u),v?(v=1/v,s*=v,o*=v,u*=v):(s=0,o=0,u=0),a=p*u-d*o,f=d*s-c*u,l=c*o-p*s,v=Math.sqrt(a*a+f*f+l*l),v?(v=1/v,a*=v,f*=v,l*=v):(a=0,f=0,l=0),e[0]=s,e[1]=a,e[2]=c,e[3]=0,e[4]=o,e[5]=f,e[6]=p,e[7]=0,e[8]=u,e[9]=l,e[10]=d,e[11]=0,e[12]=-(s*m+o*g+u*y),e[13]=-(a*m+f*g+l*y),e[14]=-(c*m+p*g+d*y),e[15]=1,e)},h.str=function(e){return"mat4("+e[0]+", "+e[1]+", "+e[2]+", "+e[3]+", "+e[4]+", "+e[5]+", "+e[6]+", "+e[7]+", "+e[8]+", "+e[9]+", "+e[10]+", "+e[11]+", "+e[12]+", "+e[13]+", "+e[14]+", "+e[15]+")"},h.frob=function(e){return Math.sqrt(Math.pow(e[0],2)+Math.pow(e[1],2)+Math.pow(e[2],2)+Math.pow(e[3],2)+Math.pow(e[4],2)+Math.pow(e[5],2)+Math.pow(e[6],2)+Math.pow(e[6],2)+Math.pow(e[7],2)+Math.pow(e[8],2)+Math.pow(e[9],2)+Math.pow(e[10],2)+Math.pow(e[11],2)+Math.pow(e[12],2)+Math.pow(e[13],2)+Math.pow(e[14],2)+Math.pow(e[15],2))},typeof e!="undefined"&&(e.mat4=h);var p={};p.create=function(){var e=new n(4);return e[0]=0,e[1]=0,e[2]=0,e[3]=1,e},p.rotationTo=function(){var e=u.create(),t=u.fromValues(1,0,0),n=u.fromValues(0,1,0);return function(r,i,s){var o=u.dot(i,s);return o<-0.999999?(u.cross(e,t,i),u.length(e)<1e-6&&u.cross(e,n,i),u.normalize(e,e),p.setAxisAngle(r,e,Math.PI),r):o>.999999?(r[0]=0,r[1]=0,r[2]=0,r[3]=1,r):(u.cross(e,i,s),r[0]=e[0],r[1]=e[1],r[2]=e[2],r[3]=1+o,p.normalize(r,r))}}(),p.setAxes=function(){var e=c.create();return function(t,n,r,i){return e[0]=r[0],e[3]=r[1],e[6]=r[2],e[1]=i[0],e[4]=i[1],e[7]=i[2],e[2]=-n[0],e[5]=-n[1],e[8]=-n[2],p.normalize(t,p.fromMat3(t,e))}}(),p.clone=a.clone,p.fromValues=a.fromValues,p.copy=a.copy,p.set=a.set,p.identity=function(e){return e[0]=0,e[1]=0,e[2]=0,e[3]=1,e},p.setAxisAngle=function(e,t,n){n*=.5;var r=Math.sin(n);return e[0]=r*t[0],e[1]=r*t[1],e[2]=r*t[2],e[3]=Math.cos(n),e},p.add=a.add,p.multiply=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=n[0],a=n[1],f=n[2],l=n[3];return e[0]=r*l+o*u+i*f-s*a,e[1]=i*l+o*a+s*u-r*f,e[2]=s*l+o*f+r*a-i*u,e[3]=o*l-r*u-i*a-s*f,e},p.mul=p.multiply,p.scale=a.scale,p.rotateX=function(e,t,n){n*=.5;var r=t[0],i=t[1],s=t[2],o=t[3],u=Math.sin(n),a=Math.cos(n);return e[0]=r*a+o*u,e[1]=i*a+s*u,e[2]=s*a-i*u,e[3]=o*a-r*u,e},p.rotateY=function(e,t,n){n*=.5;var r=t[0],i=t[1],s=t[2],o=t[3],u=Math.sin(n),a=Math.cos(n);return e[0]=r*a-s*u,e[1]=i*a+o*u,e[2]=s*a+r*u,e[3]=o*a-i*u,e},p.rotateZ=function(e,t,n){n*=.5;var r=t[0],i=t[1],s=t[2],o=t[3],u=Math.sin(n),a=Math.cos(n);return e[0]=r*a+i*u,e[1]=i*a-r*u,e[2]=s*a+o*u,e[3]=o*a-s*u,e},p.calculateW=function(e,t){var n=t[0],r=t[1],i=t[2];return e[0]=n,e[1]=r,e[2]=i,e[3]=-Math.sqrt(Math.abs(1-n*n-r*r-i*i)),e},p.dot=a.dot,p.lerp=a.lerp,p.slerp=function(e,t,n,r){var i=t[0],s=t[1],o=t[2],u=t[3],a=n[0],f=n[1],l=n[2],c=n[3],h,p,d,v,m;return p=i*a+s*f+o*l+u*c,p<0&&(p=-p,a=-a,f=-f,l=-l,c=-c),1-p>1e-6?(h=Math.acos(p),d=Math.sin(h),v=Math.sin((1-r)*h)/d,m=Math.sin(r*h)/d):(v=1-r,m=r),e[0]=v*i+m*a,e[1]=v*s+m*f,e[2]=v*o+m*l,e[3]=v*u+m*c,e},p.invert=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=n*n+r*r+i*i+s*s,u=o?1/o:0;return e[0]=-n*u,e[1]=-r*u,e[2]=-i*u,e[3]=s*u,e},p.conjugate=function(e,t){return e[0]=-t[0],e[1]=-t[1],e[2]=-t[2],e[3]=t[3],e},p.length=a.length,p.len=p.length,p.squaredLength=a.squaredLength,p.sqrLen=p.squaredLength,p.normalize=a.normalize,p.fromMat3=function(e,t){var n=t[0]+t[4]+t[8],r;if(n>0)r=Math.sqrt(n+1),e[3]=.5*r,r=.5/r,e[0]=(t[7]-t[5])*r,e[1]=(t[2]-t[6])*r,e[2]=(t[3]-t[1])*r;else{var i=0;t[4]>t[0]&&(i=1),t[8]>t[i*3+i]&&(i=2);var s=(i+1)%3,o=(i+2)%3;r=Math.sqrt(t[i*3+i]-t[s*3+s]-t[o*3+o]+1),e[i]=.5*r,r=.5/r,e[3]=(t[o*3+s]-t[s*3+o])*r,e[s]=(t[s*3+i]+t[i*3+s])*r,e[o]=(t[o*3+i]+t[i*3+o])*r}return e},p.str=function(e){return"quat("+e[0]+", "+e[1]+", "+e[2]+", "+e[3]+")"},typeof e!="undefined"&&(e.quat=p)}(t.exports)})(this);

},{}],4:[function(require,module,exports){
/*globals angular*/

'use strict';

require( './componentWireSegment' );

angular.module(
    'mms.designVisualization.componentWire', [
        'mms.designVisualization.componentWire.segment'
    ]
)
    .controller( 'ComponentWireController', function ( $scope ) {
        $scope.getSegments = function () {
            var endPositions,
                x1, y1, x2, y2;

            endPositions = $scope.wire.getEndPositions();

            x1 = endPositions.x1;
            x2 = endPositions.x2;
            y1 = endPositions.y1;
            y2 = endPositions.y2;

            return [
                endPositions
            ];

        };

        $scope.onSegmentClick = function ( wire, segment ) {
            console.log( wire, segment );
        };

        $scope.segments = $scope.getSegments();

    } )
    .directive(
        'componentWire',

        function () {

            return {
                scope: true,
                controller: 'ComponentWireController',
                restrict: 'E',
                replace: true,
                templateUrl: '/mmsApp/templates/componentWire.html',
                templateNamespace: 'SVG'
            };
        }
);
},{"./componentWireSegment":5}],5:[function(require,module,exports){
/*globals angular*/

'use strict';

angular.module(
    'mms.designVisualization.componentWire.segment', []
)

.directive(
    'componentWireSegment',

    function () {

        return {
            restrict: 'E',
            replace: true,
            templateUrl: '/mmsApp/templates/componentWireSegment.html',
            templateNamespace: 'SVG'
        };
    }
);
},{}],6:[function(require,module,exports){
/*globals angular, $*/

'use strict';

// Move this to GME eventually

require( '../drawingCanvas/drawingCanvas.js' );

angular.module( 'mms.designVisualization.diagramContainer', [
    'mms.designVisualization.drawingCanvas',
    'panzoom',
    'panzoomwidget'
] )
    .controller( 'DiagramContainerController', [
        '$scope',
        'PanZoomService',
        function ( $scope, PanZoomService ) {

            var compiledDirectives;

            compiledDirectives = {};

            $scope.diagram.state = $scope.diagram.state || {};
            $scope.diagram.state.selectedComponentIds = $scope.diagram.state.selectedComponentIds || [];

            $scope.diagram.config = $scope.diagram.config || {};

            $scope.panzoomId = 'panzoomId'; //scope.id + '-panzoomed';

            $scope.zoomLevel = 4;

            $scope.panzoomModel = {}; // always pass empty object

            $scope.panzoomConfig = {
                zoomLevels: 10,
                neutralZoomLevel: $scope.zoomLevel,
                scalePerZoomLevel: 1.25,
                friction: 50,
                haltSpeed: 50,

                modelChangedCallback: function ( val ) {
                    PanZoomService.getAPI( $scope.panzoomId )
                        .then( function ( api ) {

                            var topLeftCorner, bottomRightCorner;

                            $scope.zoomLevel = val.zoomLevel;

                            topLeftCorner = api.getModelPosition( {
                                x: 0,
                                y: 0
                            } );

                            bottomRightCorner = api.getModelPosition( {
                                x: $scope.canvasWidth,
                                y: $scope.canvasHeight
                            } );

                            $scope.visibleArea = {
                                top: topLeftCorner.y,
                                left: topLeftCorner.x,
                                right: bottomRightCorner.x,
                                bottom: bottomRightCorner.y
                            };

                        } );

                }
            };

            $scope.getCssClass = function () {
                return 'zoom-level-' + $scope.zoomLevel;
            };

            this.getVisibleArea = function () {
                return $scope.visibleArea;
            };

            this.getId = function () {
                return $scope.id;
            };

            this.getDiagram = function () {
                return $scope.diagram;
            };

            this.getZoomLevel = function () {
                return $scope.zoomLevel;
            };

            this.getCompiledDirective = function ( directive ) {
                return compiledDirectives[ directive ];
            };

            this.setCompiledDirective = function ( directive, compiledDirective ) {
                compiledDirectives[ directive ] = compiledDirective;
            };

            this.isEditable = function () {

                $scope.diagram.config = $scope.diagram.config || {};

                return $scope.diagram.config.editable === true;
            };

            this.isComponentSelected = function ( component ) {
                return $scope.diagram.state.selectedComponentIds.indexOf( component.id ) > -1;
            };

        }
    ] )
    .directive( 'diagramContainer', [
        'diagramService', '$log', 'PanZoomService',
        function ( diagramService, $log ) {

            return {
                controller: 'DiagramContainerController',
                scope: {
                    id: '@',
                    diagram: '='
                },
                restrict: 'E',
                replace: true,
                transclude: true,
                templateUrl: '/mmsApp/templates/diagramContainer.html',
                link: function ( scope, element ) {

                    scope.canvasWidth = $( element )
                        .outerWidth();
                    scope.canvasHeight = $( element )
                        .outerHeight();


                    scope.visibleArea = {
                        top: 0,
                        left: 0,
                        right: scope.canvasWidth,
                        bottom: scope.canvasHeight
                    };

                    $log.debug( 'In canvas container', scope.visibleArea );


                }

            };
        }
    ] );
},{"../drawingCanvas/drawingCanvas.js":7}],7:[function(require,module,exports){
/*globals angular*/

'use strict';

// Move this to GME eventually

angular.module( 'mms.designVisualization.drawingCanvas', [] )
    .directive( 'drawingCanvas',
        function () {

            return {

                scope: {
                    id: '@'
                },
                restrict: 'E',
                replace: true,
                transclude: true,
                templateUrl: '/mmsApp/templates/drawingCanvas.html'

            };
        } );
},{}],8:[function(require,module,exports){
/*globals angular, fabric*/

'use strict';

// Move this to GME eventually

angular.module( 'mms.designVisualization.fabricCanvas', [] )
    .controller( 'FabricCanvasController', function () {

    } )
    .directive( 'fabricCanvas', [
        '$log',
        'diagramService',
        function ( $log, diagramService ) {

            return {

                scope: {},
                controller: 'FabricCanvasController',
                require: '^diagramContainer',
                restrict: 'E',
                replace: true,
                templateUrl: '/mmsApp/templates/fabricCanvas.html',
                link: function ( scope, element, attributes, diagramContainerCtrl ) {

                    var
                    canvas,
                        renderDiagram;

                    scope.id = diagramContainerCtrl.getId() + 'fabric-canvas';

                    canvas = new fabric.Canvas( scope.id );

                    canvas.setBackgroundColor( 'rgba(255, 73, 64, 0.6)' );

                    renderDiagram = function () {

                        if ( angular.isObject( scope.diagramData ) ) {

                            if ( angular.isArray( scope.diagramData.symbols ) ) {

                                angular.forEach( scope.diagramData.symbols, function ( symbol ) {

                                    diagramService.getSVGForSymbolType( symbol.type )
                                        .then( function ( object ) {

                                            var svgObject;

                                            svgObject = object.set( {
                                                left: symbol.x,
                                                top: symbol.y,
                                                angle: 0
                                            } );

                                            //                  canvas.add(svgObject);

                                            var rect = new fabric.Rect( {
                                                left: 100,
                                                top: 50,
                                                width: 100,
                                                height: 100,
                                                fill: 'green',
                                                angle: 20,
                                                padding: 10
                                            } );

                                            canvas.add( rect );

                                            //                $log.debug('e', svgObject);

                                            canvas.renderAll();

                                        } );

                                } );

                            }

                        }

                        canvas.clear()
                            .renderAll();

                    };

                    scope.$watch( diagramContainerCtrl.getDiagramData, function ( value ) {
                        $log.debug( 'DiagramData is ', value );
                        scope.diagramData = value;
                        renderDiagram();

                    } );

                }

            };
        }
    ] );
},{}],9:[function(require,module,exports){
/*globals angular*/

'use strict';

angular.module(
    'mms.designVisualization.port', []
)
    .controller( 'PortController', function ( $scope ) {
        $scope.getPortTransform = function () {
            var transformString;

            transformString = 'translate(' + $scope.portInstance.portSymbol.x + ',' + $scope.portInstance.portSymbol
                .y + ')';

            return transformString;
        };
    } )
    .directive(
        'port',

        function () {

            return {
                scope: false,
                controller: 'PortController',
                restrict: 'E',
                replace: true,
                templateUrl: '/mmsApp/templates/port.html',
                templateNamespace: 'SVG',
                require: [ '^svgDiagram', '^diagramContainer' ],
                link: function ( scope, element, attributes, controllers ) {

                    var svgDiagramController;

                    svgDiagramController = controllers[ 0 ];

                    scope.onPortClick = function ( port, $event ) {
                        svgDiagramController.onPortClick( scope.component, port, $event );
                    };

                    scope.onPortMouseDown = function ( port, $event ) {
                        svgDiagramController.onPortMouseDown( scope.component, port, $event );
                    };

                    scope.onPortMouseUp = function ( port, $event ) {
                        svgDiagramController.onPortMouseUp( scope.component, port, $event );
                    };

                }
            };
        }
);
},{}],10:[function(require,module,exports){
/*globals angular*/

'use strict';

module.exports = function($scope, diagramService, wiringService, $log) {

    var self = this,
        getOffsetToMouse,
        possibbleDragTargetsDescriptor,
        dragTargetsDescriptor,

        onMouseUp,
        onMouseMove,
        onMouseLeave,
        onWindowBlur,
        onComponentMouseUp,
        onComponentMouseDown,

        startDrag,
        finishDrag,
        cancelDrag;


    getOffsetToMouse = function ( $event ) {

        var offset;

        offset = {
            x: $event.pageX - $scope.elementOffset.left,
            y: $event.pageY - $scope.elementOffset.top
        };

        return offset;

    };


    startDrag = function () {

        self.dragging = true;

        dragTargetsDescriptor = possibbleDragTargetsDescriptor;
        possibbleDragTargetsDescriptor = null;

        $log.debug( 'Dragging', dragTargetsDescriptor );

    };

    cancelDrag = function() {

        possibbleDragTargetsDescriptor = null;

        if ( dragTargetsDescriptor ) {

            var offset;

            angular.forEach( dragTargetsDescriptor.targets, function ( target ) {

                target.component.setPosition(
                    target.originalPosition.x,
                    target.originalPosition.y
                );

            } );

            angular.forEach( dragTargetsDescriptor.affectedWires, function ( wire ) {

                wiringService.adjustWireEndSegments( wire );

            } );

            dragTargetsDescriptor = null;

        }

        self.dragging = false;

    };

    finishDrag = function () {

        self.dragging = false;

        dragTargetsDescriptor = null;

        $log.debug( 'Finish dragging' );

    };

    onMouseMove = function($event) {

        if ( possibbleDragTargetsDescriptor ) {
            startDrag();
        }

        if ( dragTargetsDescriptor ) {

            var offset;

            offset = getOffsetToMouse( $event );

            angular.forEach( dragTargetsDescriptor.targets, function ( target ) {

                target.component.setPosition(
                    offset.x + target.deltaToCursor.x,
                    offset.y + target.deltaToCursor.y
                );

            } );

            angular.forEach( dragTargetsDescriptor.affectedWires, function ( wire ) {

                wiringService.adjustWireEndSegments( wire );

            } );

        }

    };

    onMouseUp = function($event) {

        possibbleDragTargetsDescriptor = null;

        if ( dragTargetsDescriptor ) {
            finishDrag();
            $event.stopPropagation();
        }

    };

    onMouseLeave = function(/*$event*/) {

        cancelDrag();

    };

    onWindowBlur = function(/*$event*/) {

        cancelDrag();

    };

    onComponentMouseUp = function(component, $event) {

        possibbleDragTargetsDescriptor = null;

        if ( dragTargetsDescriptor ) {
            finishDrag();
            $event.stopPropagation();
        }

    };

    onComponentMouseDown = function (component, $event) {

        var componentsToDrag,
            getDragDescriptor;

        componentsToDrag = [];

        getDragDescriptor = function ( component ) {

            var offset = getOffsetToMouse( $event );

            return {
                component: component,
                originalPosition: {
                    x: component.x,
                    y: component.y
                },
                deltaToCursor: {
                    x: component.x - offset.x,
                    y: component.y - offset.y
                }
            };

        };

        $scope.diagram.config = $scope.diagram.config || {};

        if ( $scope.diagram.config.editable === true &&
            component.nonSelectable !== true &&
            component.locationLocked !== true ) {

            $event.stopPropagation();

            possibbleDragTargetsDescriptor = {
                targets: [ getDragDescriptor( component ) ]
            };

            componentsToDrag.push( component );

            if ( $scope.diagram.state.selectedComponentIds.indexOf( component.id ) > -1 ) {

                // Drag along other selected components

                angular.forEach( $scope.diagram.state.selectedComponentIds, function ( selectedComponentId ) {

                    var selectedComponent;

                    if ( component.id !== selectedComponentId ) {

                        selectedComponent = $scope.diagram.components[ selectedComponentId ];

                        possibbleDragTargetsDescriptor.targets.push( getDragDescriptor(
                            selectedComponent ) );

                        componentsToDrag.push( selectedComponent );

                    }

                } );
            }

            possibbleDragTargetsDescriptor.affectedWires = diagramService.getWiresForComponents(
                componentsToDrag );

        }

    };

    this.onMouseUp = onMouseUp;
    this.onMouseMove = onMouseMove;
    this.onMouseLeave = onMouseLeave;
    this.onWindowBlur = onWindowBlur;
    this.onComponentMouseUp = onComponentMouseUp;
    this.onComponentMouseDown = onComponentMouseDown;

    return this;

};

},{}],11:[function(require,module,exports){
/*globals angular*/

'use strict';

module.exports = function($scope, diagramService, gridService, $log) {

    var self = this,

        onComponentMouseUp,

        moveComponentElementToFront,
        toggleComponentSelected;


    moveComponentElementToFront = function ( componentId ) {

        var z,
            component,
            needsTobeReordered;

        needsTobeReordered = false;

        z = diagramService.getHighestZ();
        component = $scope.diagram.components[ componentId ];

        if ( isNaN( component.z ) ) {
            component.z = z;
            needsTobeReordered = true;
        } else {
            if ( component.z < z ) {
                component.z = z + 1;
                needsTobeReordered = true;
            }
        }

        if ( needsTobeReordered ) {
            gridService.reorderVisibleComponents( $scope.id );
        }

    };


    toggleComponentSelected =  function ( component, $event ) {

        var index;

        $scope.diagram.config = $scope.diagram.config || {};

        if ( angular.isObject( component ) && $scope.diagram.config.disallowSelection !== true && component.nonSelectable !== true ) {

            index = $scope.diagram.state.selectedComponentIds.indexOf( component.id );

            console.log(index, $scope.diagram.state.selectedComponentIds);

            if ( index > -1 ) {

                $scope.diagram.state.selectedComponentIds.splice( index, 1 );

            } else {

                if ( $scope.diagram.state.selectedComponentIds.length > 0 &&
                    $scope.diagram.config.multiSelect !== true &&
                    $event.shiftKey !== true ) {

                    angular.forEach( $scope.diagram.state.selectedComponentIds, function ( componentId ) {
                        $scope.diagram.components[ componentId ].selected = false;
                    } );
                    $scope.diagram.state.selectedComponentIds = [];
                }

                $scope.diagram.state.selectedComponentIds.push( component.id );

                moveComponentElementToFront( component.id );

            }

            $log.debug('selecteds', $scope.diagram.state.selectedComponentIds);

        }

    };


    onComponentMouseUp = function(component, $event) {
        toggleComponentSelected( component, $event );

    };

    this.onComponentMouseUp = onComponentMouseUp;

    return this;

};

},{}],12:[function(require,module,exports){
/*globals angular, $*/

'use strict';

// Move this to GME eventually

require( '../componentWire/componentWire.js' );

angular.module( 'mms.designVisualization.svgDiagram', [
    'mms.designVisualization.gridService',
    'mms.designVisualization.componentWire'
] )
    .controller( 'SVGDiagramController', function (
        $scope, $log, diagramService, wiringService, gridService, $window
    ) {

        var

            ComponentSelectionHandler = require('./classes/ComponentSelectionHandler'),
            componentSelectionHandler,

            ComponentDragHandler = require('./classes/ComponentDragHandler'),
            componentDragHandler,

            startWire,
            finishWire,
            cancelWire,

            Wire = require( '../../services/diagramService/classes/Wire.js' ),

            addCornerToNewWireLine,

            componentElements,

            $$window;

        $$window = $($window);

        componentDragHandler = new ComponentDragHandler(
            $scope,
            diagramService,
            wiringService,
            $log,
            $scope.elementOffset
        );

        componentSelectionHandler = new ComponentSelectionHandler(
            $scope,
            diagramService,
            gridService,
            $log,
            $scope.elementOffset
        );

        startWire = function (component, port) {

            $scope.wireStart = {
                component: component,
                port: port
            };

            $log.debug( 'Starting wire', $scope.wireStart );

        };

        addCornerToNewWireLine = function () {

            var lastSegment;

            $scope.newWireLine.lockedSegments = $scope.newWireLine.segments;

            lastSegment = $scope.newWireLine.lockedSegments[ $scope.newWireLine.lockedSegments.length - 1 ];

            $scope.newWireLine.activeSegmentStartPosition = {
                x: lastSegment.x2,
                y: lastSegment.y2
            };

        };

        finishWire = function ( component, port ) {

            var wire = new Wire( {
                id: 'new-wire-' + Math.round( Math.random() * 10000 ),
                end1: {
                    component: $scope.wireStart.component,
                    port: $scope.wireStart.port
                },
                end2: {
                    component: component,
                    port: port
                }
            } );

            wire.segments = angular.copy(
                $scope.newWireLine.lockedSegments.concat(
                    wiringService.getSegmentsBetweenPositions( {
                            end1: $scope.newWireLine.activeSegmentStartPosition,
                            end2: port.getGridPosition()
                        },
                        'ElbowRouter'
                    )
                ) );

            console.log( wire.segments );


            diagramService.addWire( wire );

            $scope.diagram.wires[ wire.id ] = wire;

            gridService.invalidateVisibleDiagramComponents( $scope.id );

            $log.debug( 'Finish wire', wire );

            $scope.wireStart = null;
            $scope.newWireLine = null;

        };

        cancelWire = function () {
            $scope.newWireLine = null;
            $scope.wireStart = null;
        };


        $scope.onMouseUp = function ($event) {

            componentDragHandler.onMouseUp($event);

            if ( $scope.wireStart ) {

                $event.stopPropagation();

                addCornerToNewWireLine();

            } else {
                $scope.diagram.state.selectedComponentIds = [];
            }

        };


        $scope.onClick = function ( $event ) {
        };

        $scope.onMouseMove = function ( $event ) {


            // Dragging

            componentDragHandler.onMouseMove($event);

            // Wire drawing

            if ( $scope.wireStart ) {


                $scope.newWireLine = $scope.newWireLine || {};
                $scope.newWireLine.lockedSegments = $scope.newWireLine.lockedSegments || [];
                $scope.newWireLine.activeSegmentStartPosition =
                    $scope.newWireLine.activeSegmentStartPosition || $scope.wireStart.port.getGridPosition();

                $scope.newWireLine.segments = $scope.newWireLine.lockedSegments.concat(
                    wiringService.getSegmentsBetweenPositions( {
                            end1: $scope.newWireLine.activeSegmentStartPosition,
                            end2: {
                                x: $event.pageX - $scope.elementOffset.left - 3,
                                y: $event.pageY - $scope.elementOffset.top - 3
                            }
                        },
                        'ElbowRouter'
                    )
                );

            }

        };

        $scope.getCssClass = function () {

            var result = '';

            if ( $scope.dragTargetsDescriptor ) {
                result += 'dragging';
            }

            return result;

        };

        $scope.contextMenuData = [ {
            id: 'context-menu-common',
            items: [ {
                id: 'newComponent',
                label: 'New component ...',
                iconClass: 'glyphicon glyphicon-plus',
                action: function () {
                    console.log( 'New component clicked' );
                },
                actionData: {}
            } ]
        } ];


        $scope.onMouseLeave = function($event) {
           componentDragHandler.onMouseLeave($event);
        };

        $$window.blur(function($event) {
           componentDragHandler.onWindowBlur($event);
        });


        // Interactions with components

        this.onComponentMouseUp = function ( component, $event ) {

            if (!componentDragHandler.dragging) {

                componentSelectionHandler.onComponentMouseUp(component, $event);
                $event.stopPropagation();

                componentDragHandler.onComponentMouseUp(component, $event);

            } else {
                componentDragHandler.onComponentMouseUp(component, $event);
            }
        };

        this.onPortMouseDown = function ( component, port, $event ) {

            if ( $scope.wireStart ) {

                $event.stopPropagation();

                if ( $scope.wireStart.port !== port ) {
                    finishWire( component, port );
                } else {
                    cancelWire();
                }

            } else {

                startWire(component, port);
                $event.stopPropagation();

            }

        };

        this.onPortMouseUp = function ( component, port, $event ) {

            $event.stopPropagation();

        };

        this.onPortClick = function ( component, port, $event ) {

            $event.stopPropagation();

        };

        this.onComponentMouseDown = function ( component, $event ) {

            var wires;

            if ( $event.which === 3 ) {

                component.rotate( 90 );

                wires = diagramService.getWiresForComponents( component );

                angular.forEach( wires, function ( wire ) {
                    wiringService.adjustWireEndSegments( wire );
                } );


                $event.preventDefault();

            } else {

                componentDragHandler.onComponentMouseDown(component, $event);

            }
        };

        this.isEditable = function () {

            $scope.diagram.config = $scope.diagram.config || {};

            return $scope.diagram.config.editable === true;
        };

        this.disallowSelection = function () {

            $scope.diagram.config = $scope.diagram.config || {};

            return $scope.diagram.config.disallowSelection === true;
        };

        this.registerComponentElement = function ( id, el ) {

            componentElements = componentElements || {};

            componentElements[ id ] = el;

        };

        this.unregisterComponentElement = function ( id ) {

            componentElements = componentElements || {};

            delete componentElements[ id ];

        };

    } )
    .directive( 'svgDiagram', [
        '$log',
        'diagramService',
        'gridService',
        function ( $log, diagramService, gridService ) {

            return {
                controller: 'SVGDiagramController',
                require: '^diagramContainer',
                restrict: 'E',
                scope: false,
                replace: true,
                templateUrl: '/mmsApp/templates/svgDiagram.html',
                link: function ( scope, element, attributes, diagramContainerController ) {

                    var id;

                    id = diagramContainerController.getId();

                    scope.diagram = scope.diagram || {};
                    scope.$element = element;

                    scope.id = id;

                    scope.visibleObjects = gridService.createGrid( id, {
                            width: 10000,
                            height: 1000
                        },
                        scope.diagram
                    );

                    scope.$watch(
                        function () {
                            return diagramContainerController.getVisibleArea();
                        }, function ( visibleArea ) {
                            scope.elementOffset = scope.$element.offset();
                            gridService.setVisibleArea( id, visibleArea );
                        } );

                }

            };
        }
    ] );

},{"../../services/diagramService/classes/Wire.js":23,"../componentWire/componentWire.js":4,"./classes/ComponentDragHandler":10,"./classes/ComponentSelectionHandler":11}],13:[function(require,module,exports){
/*globals angular*/

'use strict';

angular.module(
    'mms.designVisualization.symbols.box', []
)
    .controller( 'BoxController', function ( $scope ) {

        $scope.portWires = [];

        angular.forEach( $scope.component.symbol.ports, function ( port ) {

            var toX = 0,
                toY = 0,
                portWireLength,
                width, height;

            portWireLength = $scope.component.symbol.portWireLength;
            width = $scope.component.symbol.width;
            height = $scope.component.symbol.height;

            if ( port.x === 0 ) {
                toX = portWireLength;
                toY = port.y;
            }

            if ( port.y === 0 ) {
                toY = portWireLength;
                toX = port.x;
            }

            if ( port.x === width ) {
                toX = width - portWireLength;
                toY = port.y;
            }

            if ( port.y === height ) {
                toY = height - portWireLength;
                toX = port.x;
            }

            $scope.portWires.push( {
                x1: port.x,
                y1: port.y,
                x2: toX,
                y2: toY
            } );
        } );

    } )
    .directive(
        'box',

        function () {

            return {
                scope: false,
                restrict: 'E',
                replace: true,
                controller: 'BoxController',
                templateUrl: '/mmsApp/templates/box.html',
                templateNamespace: 'SVG'
            };
        } );
},{}],14:[function(require,module,exports){
/*globals angular*/

'use strict';

angular.module(
    'mms.designVisualization.symbols.capacitor', []
)
    .config( [ 'symbolManagerProvider',
        function ( symbolManagerProvider ) {
            symbolManagerProvider.registerSymbol( {
                type: 'capacitor',
                directive: null,
                svgDecoration: 'images/symbols.svg#icon-capacitor',
                labelPrefix: 'C',
                labelPosition: {
                    x: 10,
                    y: -8
                },
                width: 60,
                height: 15,
                ports: [ {
                    id: 'C',
                    wireAngle: 180,
                    wireLeadIn: 20,
                    label: 'C',
                    x: 0,
                    y: 7.5
                }, {
                    id: 'A',
                    wireAngle: 0,
                    wireLeadIn: 20,
                    label: 'A',
                    x: 60,
                    y: 7.5
                } ]
            } );
        }
    ] );
},{}],15:[function(require,module,exports){
/*globals angular, $*/

'use strict';

require( '../../services/symbolServices/symbolServices.js' );
require( '../port/port.js' );

require( './resistor/resistor.js' );
require( './jFetP/jFetP.js' );
require( './opAmp/opAmp.js' );
require( './diode/diode.js' );
require( './capacitor/capacitor.js' );
require( './inductor/inductor.js' );

require( './box/box.js' );

var symbolsModule = angular.module(
    'mms.designVisualization.symbols', [
        'mms.designVisualization.symbolServices',

        'mms.designVisualization.port',

        'mms.designVisualization.symbols.resistor',
        'mms.designVisualization.symbols.jFetP',
        'mms.designVisualization.symbols.opAmp',
        'mms.designVisualization.symbols.diode',
        'mms.designVisualization.symbols.capacitor',
        'mms.designVisualization.symbols.inductor',

        'mms.designVisualization.symbols.box'

    ] );

symbolsModule.controller(
    'SymbolController', function ( $scope ) {

        $scope.getSymbolTransform = function () {

            var transformString;

            //    transformString = 'translate(' + $scope.component.x + ',' + $scope.component.y + ') ';
            //    transformString +=
            //      'rotate(' + $scope.component.rotation + ' ' + $scope.component.symbol.width/2 + ' ' + $scope.component.symbol.height/2  + ') ';
            //    //transformString += 'scale(' + $scope.component.scaleX + ',' + $scope.component.scaleY + ') ';
            //
            //    console.log($scope.component.getTransformationMatrix().join(', '));

            transformString = 'matrix(' + $scope.component.getSVGTransformationString() + ')';

            return transformString;
        };

    } );

symbolsModule.directive(
    'componentSymbol',

    function ( $compile ) {

        return {
            scope: {
                component: '=',
                test: '=',
                page: '=',
                instance: '='
            },
            restrict: 'E',
            replace: true,
            controller: 'SymbolController',
            templateUrl: '/mmsApp/templates/componentSymbol.html',
            templateNamespace: 'SVG',
            require: [ '^svgDiagram', '^diagramContainer' ],
            link: function ( scope, element, attributes, controllers ) {

                var templateStr,
                    template,

                    diagramContainerController,
                    svgDiagramController,

                    $el,
                    compiledSymbol,
                    symbolComponent;

                svgDiagramController = controllers[ 0 ];
                diagramContainerController = controllers[ 1 ];

                scope.portsVisible = function () {
                    return true;
                };

                scope.detailsVisible = function () {
                    return diagramContainerController.getZoomLevel() > 1;
                };

                scope.getCssClass = function () {

                    var result;

                    result = scope.component.symbol.type;

                    if ( diagramContainerController.isComponentSelected( scope.component ) ) {
                        result += ' selected';
                    }

                    return result;

                };

                // Interactions

                scope.onMouseUp = function ( $event ) {
                    svgDiagramController.onComponentMouseUp( scope.component, $event );
                };

                scope.onMouseDown = function ( $event ) {
                    svgDiagramController.onComponentMouseDown( scope.component, $event );
                };

                symbolComponent = scope.component.symbol.symbolComponent || 'generic-svg';

                compiledSymbol = diagramContainerController.getCompiledDirective( symbolComponent );

                if ( !angular.isFunction( compiledSymbol ) ) {

                    templateStr = '<' + symbolComponent + '>' +
                        '</' + symbolComponent + '>';

                    template = angular.element( templateStr );

                    compiledSymbol = $compile( template );

                    diagramContainerController.setCompiledDirective( symbolComponent, compiledSymbol );

                }

                $el = $( element );

                compiledSymbol( scope, function ( clonedElement ) {
                    $el.find( '.symbol-placeholder' )
                        .replaceWith( clonedElement );
                } );

                svgDiagramController.registerComponentElement( scope.component.id, $el );

                scope.$on( '$destroy', function () {
                    svgDiagramController.unregisterComponentElement( scope.component.id );
                } );

            }
        };
    }
);

symbolsModule.directive(
    'genericSvg',

    function () {

        return {
            scope: false,
            restrict: 'E',
            replace: true,
            templateUrl: '/mmsApp/templates/genericSvg.html',
            templateNamespace: 'SVG'
        };
    }
);

},{"../../services/symbolServices/symbolServices.js":26,"../port/port.js":9,"./box/box.js":13,"./capacitor/capacitor.js":14,"./diode/diode.js":16,"./inductor/inductor.js":17,"./jFetP/jFetP.js":18,"./opAmp/opAmp.js":19,"./resistor/resistor.js":20}],16:[function(require,module,exports){
/*globals angular*/

'use strict';

angular.module(
    'mms.designVisualization.symbols.diode', []
)
    .config( [ 'symbolManagerProvider',
        function ( symbolManagerProvider ) {
            symbolManagerProvider.registerSymbol( {
                type: 'diode',
                directive: null,
                svgDecoration: 'images/symbols.svg#icon-diode',
                labelPrefix: 'D',
                labelPosition: {
                    x: 10,
                    y: -8
                },
                width: 60,
                height: 15,
                ports: [ {
                    id: 'C',
                    wireAngle: 0,
                    wireLeadIn: 20,
                    label: 'C',
                    x: 0,
                    y: 7
                }, {
                    id: 'A',
                    wireAngle: 180,
                    wireLeadIn: 20,
                    label: 'A',
                    x: 60,
                    y: 7
                } ]
            } );
        }
    ] );
},{}],17:[function(require,module,exports){
/*globals angular*/

'use strict';

angular.module(
    'mms.designVisualization.symbols.inductor', []
)
    .config( [ 'symbolManagerProvider',
        function ( symbolManagerProvider ) {
            symbolManagerProvider.registerSymbol( {
                type: 'inductor',
                directive: null,
                svgDecoration: 'images/symbols.svg#icon-inductor',
                labelPrefix: 'L',
                labelPosition: {
                    x: 10,
                    y: -8
                },
                width: 50,
                height: 10,
                ports: [ {
                    id: 'p1',
                    wireAngle: 180,
                    wireLeadIn: 20,
                    label: 'p1',
                    x: 0,
                    y: 6.5
                }, {
                    id: 'p2',
                    wireAngle: 0,
                    wireLeadIn: 20,
                    label: 'p2',
                    x: 50,
                    y: 6.5
                } ]
            } );
        }
    ] );
},{}],18:[function(require,module,exports){
/*globals angular*/

'use strict';

angular.module(
    'mms.designVisualization.symbols.jFetP', []
)
    .config( [ 'symbolManagerProvider',
        function ( symbolManagerProvider ) {
            symbolManagerProvider.registerSymbol( {
                type: 'jFetP',
                directive: null,
                svgDecoration: 'images/symbols.svg#icon-jFetP',
                labelPrefix: 'Q',
                labelPosition: {
                    x: 60,
                    y: 12
                },
                width: 62,
                height: 70,
                ports: [ {
                    id: 's',
                    wireAngle: 270,
                    wireLeadIn: 20,
                    label: 'S',
                    x: 46,
                    y: 0
                }, {
                    id: 'd',
                    wireAngle: 90,
                    wireLeadIn: 20,
                    label: 'D',
                    x: 46,
                    y: 70
                }, {
                    id: 'g',
                    wireAngle: 180,
                    wireLeadIn: 20,
                    label: 'G',
                    x: 0,
                    y: 26
                } ]
            } );
        }
    ] );
},{}],19:[function(require,module,exports){
/*globals angular*/

'use strict';

angular.module(
    'mms.designVisualization.symbols.opAmp', []
)
    .config( [ 'symbolManagerProvider',
        function ( symbolManagerProvider ) {
            symbolManagerProvider.registerSymbol( {
                type: 'opAmp',
                directive: null,
                svgDecoration: 'images/symbols.svg#icon-opAmp',
                labelPrefix: 'A',
                labelPosition: {
                    x: 90,
                    y: 15
                },
                width: 140,
                height: 100,
                ports: [ {
                    id: 'Vs+',
                    wireAngle: 270,
                    wireLeadIn: 20,
                    label: 'Vs+',
                    x: 65,
                    y: 0
                }, {
                    id: 'Vout',
                    wireAngle: 0,
                    wireLeadIn: 20,
                    label: 'Vout',
                    x: 140,
                    y: 50
                }, {
                    id: 'Vs-',
                    wireAngle: 90,
                    wireLeadIn: 20,
                    label: 'Vs-',
                    x: 65,
                    y: 100
                }, {
                    id: 'V-',
                    wireAngle: 180,
                    wireLeadIn: 20,
                    label: 'V-',
                    x: 0,
                    y: 75
                }, {
                    id: 'V+',
                    wireAngle: 180,
                    wireLeadIn: 20,
                    label: 'V+',
                    x: 0,
                    y: 25
                } ]
            } );
        }
    ] );
},{}],20:[function(require,module,exports){
/*globals angular*/

'use strict';

angular.module(
    'mms.designVisualization.symbols.resistor', []
)
    .config( [ 'symbolManagerProvider',
        function ( symbolManagerProvider ) {
            symbolManagerProvider.registerSymbol( {
                type: 'resistor',
                symbolComponent: null,
                svgDecoration: 'images/symbols.svg#icon-resistor',
                labelPrefix: 'R',
                labelPosition: {
                    x: 10,
                    y: -8
                },
                width: 60,
                height: 10,
                ports: [ {
                    id: 'p1',
                    wireAngle: 180,
                    wireLeadIn: 20,
                    label: 'p1',
                    x: 0,
                    y: 5
                }, {
                    id: 'p2',
                    wireAngle: 0,
                    wireLeadIn: 20,
                    label: 'p2',
                    x: 60,
                    y: 5
                } ]
            } );
        }
    ] );
},{}],21:[function(require,module,exports){
/*globals angular*/

'use strict';

var glMatrix = require( 'glMatrix' );

var ComponentPort = function ( descriptor ) {

    angular.extend( this, descriptor );

};

ComponentPort.prototype.getGridPosition = function () {

    var position,
        positionVector;

    if ( angular.isObject( this.portSymbol ) && angular.isObject( this.parentComponent ) ) {

        positionVector = glMatrix.vec2.create();
        glMatrix.vec2.set( positionVector, this.portSymbol.x, this.portSymbol.y );

        glMatrix.vec2.transformMat3( positionVector, positionVector, this.parentComponent.getTransformationMatrix() );

        position = {

            x: positionVector[ 0 ],
            y: positionVector[ 1 ]

        };

    }

    return position;

};

module.exports = ComponentPort;
},{"glMatrix":3}],22:[function(require,module,exports){
/*globals angular*/

'use strict';

var glMatrix = require( 'glMatrix' );

var DiagramComponent = function ( descriptor ) {

    if ( !angular.isObject( descriptor.symbol ) ) {
        throw new Error( 'No symbol found for component ' + this.id );
    }

    angular.extend( this, descriptor );

};

DiagramComponent.prototype.isInViewPort = function ( viewPort, padding ) {

    //TODO: count width and height for orientation
    padding = padding || {
        x: 0,
        y: 0
    };

    return (
        angular.isObject( viewPort ) &&
        this.x + this.symbol.width >= ( viewPort.left + padding.x ) &&
        this.x <= ( viewPort.right - padding.x ) &&
        this.y + this.symbol.height >= ( viewPort.top + padding.y ) &&
        this.y <= ( viewPort.bottom - padding.y ) );
};

DiagramComponent.prototype.getTransformationMatrix = function () {

    if ( !angular.isArray( this.transformationMatrix ) ) {
        this.updateTransformationMatrix();
    }

    return this.transformationMatrix;

};


DiagramComponent.prototype.getSVGTransformationMatrix = function () {

    if ( !angular.isArray( this.svgTransformationMatrix ) ) {
        this.updateTransformationMatrix();
    }

    return this.svgTransformationMatrix;

};

DiagramComponent.prototype.getSVGTransformationString = function () {

    var transMatrix = this.getSVGTransformationMatrix();

    return transMatrix.join( ', ' );
};

DiagramComponent.prototype.updateTransformationMatrix = function () {

    var rotationRad,
        //sinA, cosA,
        translation,
        transformMat3,
        result;

    if ( angular.isNumber( this.rotation ) &&
        angular.isNumber( this.x ),
        angular.isNumber( this.y ) ) {

        rotationRad = this.rotation / 180 * Math.PI;

        transformMat3 = glMatrix.mat3.create();

        translation = glMatrix.vec2.create();
        glMatrix.vec2.set( translation, this.x, this.y );

        glMatrix.mat3.translate(
            transformMat3,
            transformMat3,
            translation
        );

        glMatrix.mat3.rotate(
            transformMat3,
            transformMat3,
            rotationRad
        );

        //    sinA = Math.sin(rotationRad);
        //    cosA = Math.cos(rotationRad);
        //
        //    this.transformationMatrix = [
        //      this.scaleX * cosA,
        //      sinA,
        //      -sinA,
        //      this.scaleY * cosA,
        //      this.x,
        //      this.y
        //    ];

        this.transformationMatrix = transformMat3;

        this.svgTransformationMatrix = [
            transformMat3[ 0 ],
            transformMat3[ 1 ],
            transformMat3[ 3 ],
            transformMat3[ 4 ],
            transformMat3[ 6 ],
            transformMat3[ 7 ]
        ];

        result = this.transformationMatrix;

    }

    return result;

};

DiagramComponent.prototype.setPosition = function ( x, y ) {

    if ( angular.isNumber( x ) && angular.isNumber( y ) ) {

        this.x = x;
        this.y = y;

        this.updateTransformationMatrix();

    } else {
        throw new Error( 'Coordinates must be numbers!' );
    }
};

DiagramComponent.prototype.rotate = function ( angle ) {

    if ( angular.isNumber( angle ) ) {

        this.rotation += angle;

        this.updateTransformationMatrix();

    } else {
        throw new Error( 'Angle must be number!' );
    }
};

DiagramComponent.prototype.registerPortInstances = function ( newPorts ) {

    var self = this;

    this.portInstances = this.portInstances || [];

    angular.forEach( newPorts, function ( newPort ) {

        newPort.parentComponent = self;
        self.portInstances.push( newPort );

    } );
};

DiagramComponent.prototype.getTransformedDimensions = function () {
    //  var width, height;
};

DiagramComponent.prototype.localToGlobal = function () {

    if ( !this.transformationMatrix ) {
        this.transformationMatrix = this.getTransformationMatrix();
    }



};

module.exports = DiagramComponent;
},{"glMatrix":3}],23:[function(require,module,exports){
/*globals angular*/

'use strict';

var Wire = function ( descriptor ) {

    angular.extend( this, descriptor );

    this.segments = [];

};

Wire.prototype.isInViewPort = function ( viewPort, padding ) {

    var j,
        shouldBeVisible,
        segment;

    padding = padding || {
        x: 0,
        y: 0
    };

    shouldBeVisible = false;

    if ( this.routerType === 'ElbowRouter' ) {

        if ( angular.isArray( this.segments ) ) {

            for ( j = 0; j < this.segments.length && !shouldBeVisible; j++ ) {

                segment = this.segments[ j ];

                if ( segment.orientation === 'vertical' ) {

                    if ( segment.x1 >= ( viewPort.left + padding.x ) &&
                        segment.x1 <= ( viewPort.right - padding.x ) ) {
                        shouldBeVisible = true;
                    }

                } else {

                    if ( segment.y1 >= ( viewPort.top + padding.y ) &&
                        segment.y1 <= ( viewPort.bottom - padding.y ) ) {
                        shouldBeVisible = true;
                    }

                }

            }

        }

    } else {
        shouldBeVisible = true;
    }

    return shouldBeVisible;

};

Wire.prototype.getEndPositions = function () {

    var port1Position,
        port2Position;

    port1Position = this.end1.port.getGridPosition();
    port2Position = this.end2.port.getGridPosition();

    return {

        end1: port1Position,
        end2: port2Position

    };

};

module.exports = Wire;
},{}],24:[function(require,module,exports){
/*globals angular */

'use strict';

// Move this to GME eventually

angular.module( 'mms.designVisualization.diagramService', [
    'mms.designVisualization.symbolServices'
] )
    .config( [ 'symbolManagerProvider',
        function ( symbolManagerProvider ) {

            var randomSymbolGenerator,
                kinds = 7;

            randomSymbolGenerator = function ( count ) {

                var i,
                    portCount,
                    symbol,
                    makeARandomSymbol,
                    makeSomePorts,
                    minPorts = 6,
                    maxPorts = 30,
                    portWireLength = 20,

                    spreadPortsAlongSide;

                spreadPortsAlongSide = function ( somePorts, side, width, height ) {
                    var offset = 2 * portWireLength;

                    angular.forEach( somePorts, function ( aPort ) {

                        switch ( side ) {

                        case 'top':
                            aPort.x = offset;
                            aPort.y = 0;
                            aPort.wireAngle = -90;

                            offset += width / ( somePorts.length + 2 );

                            break;

                        case 'right':
                            aPort.x = width;
                            aPort.y = offset;
                            aPort.wireAngle = 0;

                            offset += height / ( somePorts.length + 2 );

                            break;

                        case 'bottom':
                            aPort.x = offset;
                            aPort.y = height;
                            aPort.wireAngle = 90;

                            offset += width / ( somePorts.length + 2 );

                            break;

                        case 'left':
                            aPort.x = 0;
                            aPort.y = offset;
                            aPort.wireAngle = 180;

                            offset += height / ( somePorts.length + 2 );

                            break;

                        }

                    } );

                };


                makeSomePorts = function ( countOfPorts ) {

                    var ports = [],
                        port,
                        placement,
                        i,
                        top = [],
                        right = [],
                        bottom = [],
                        left = [],
                        width, height,
                        sides = [ top, right, bottom, left ],
                        portSpacing = 20,
                        minWidth = 140,
                        minHeight = 80;

                    for ( i = 0; i < countOfPorts; i++ ) {

                        port = {
                            id: 'p_' + i,
                            label: 'Port-' + i,
                            wireLeadIn: 20
                        };

                        placement = Math.round( Math.random() * 3 );

                        sides[ placement ].push( port );
                    }

                    width = Math.max(
                        portSpacing * top.length + 4 * portWireLength,
                        portSpacing * bottom.length + 4 * portWireLength,
                        minWidth
                    );

                    height = Math.max(
                        portSpacing * left.length + 4 * portWireLength,
                        portSpacing * right.length + 4 * portWireLength,
                        minHeight
                    );

                    spreadPortsAlongSide( top, 'top', width, height );
                    spreadPortsAlongSide( right, 'right', width, height );
                    spreadPortsAlongSide( bottom, 'bottom', width, height );
                    spreadPortsAlongSide( left, 'left', width, height );


                    ports = ports.concat( top )
                        .concat( right )
                        .concat( bottom )
                        .concat( left );

                    return {
                        ports: ports,
                        width: width,
                        height: height
                    };

                };

                makeARandomSymbol = function ( idPostfix, countOfPorts ) {

                    var portsAndSizes = makeSomePorts( countOfPorts );

                    var symbol = {
                        type: 'random_' + idPostfix,
                        symbolComponent: 'box',
                        svgDecoration: null,
                        labelPrefix: 'RND_' + countOfPorts + '_' + idPostfix + ' ',
                        labelPosition: {
                            x: portWireLength + 10,
                            y: portWireLength + 20
                        },
                        portWireLength: portWireLength,
                        width: portsAndSizes.width,
                        height: portsAndSizes.height,
                        ports: portsAndSizes.ports,
                        boxHeight: portsAndSizes.height - 2 * portWireLength,
                        boxWidth: portsAndSizes.width - 2 * portWireLength
                    };

                    //      debugger;

                    return symbol;

                };

                for ( i = 0; i < count; i++ ) {

                    portCount = Math.max(
                        Math.floor( Math.random() * maxPorts ),
                        minPorts
                    );

                    symbol = makeARandomSymbol( i, portCount );

                    symbolManagerProvider.registerSymbol( symbol );

                }

            };

            randomSymbolGenerator( kinds );

        }
    ] )
    .service( 'diagramService', [
        '$q',
        '$timeout',
        'symbolManager',
        'wiringService',
        function ( $q, $timeout, symbolManager, wiringService ) {

            var
            self = this,
                components = [],
                componentsById = {},

                wires = [],
                wiresById = {},
                wiresByComponentId = {},

                symbolTypes,

                registerWireForEnds,

                DiagramComponent = require( './classes/DiagramComponent.js' ),
                ComponentPort = require( './classes/ComponentPort' ),
                Wire = require( './classes/Wire.js' );

            symbolTypes = symbolManager.getAvailableSymbols();

            this.generateDummyDiagram = function ( countOfBoxes, countOfWires, canvasWidth, canvasHeight ) {

                var i, id,
                    countOfTypes,
                    symbol,
                    typeId,
                    type,
                    x,
                    y,
                    symbolTypeIds,
                    component1,
                    component2,
                    port1,
                    port2,
                    createdPorts,
                    newDiagramComponent,

                    portCreator,

                    wire;

                portCreator = function ( componentId, ports ) {

                    var portInstance,
                        portInstances,
                        portMapping;

                    portInstances = [];
                    portMapping = {};

                    angular.forEach( ports, function ( port ) {

                        portInstance = new ComponentPort( {
                            id: componentId + '_' + port.id,
                            portSymbol: port
                        } );

                        portInstances.push( portInstance );

                        portMapping[ port.id ] = portInstance.id;
                    } );

                    return {
                        portInstances: portInstances,
                        portMapping: portMapping
                    };

                };

                symbolTypeIds = Object.keys( symbolTypes );

                countOfTypes = symbolTypeIds.length;

                components = [];
                componentsById = {};

                for ( i = 0; i < countOfBoxes; i++ ) {

                    typeId = symbolTypeIds[ Math.floor( Math.random() * countOfTypes ) ];
                    type = symbolTypes[ typeId ];

                    x = Math.round( Math.random() * ( canvasWidth - 1 ) );
                    y = Math.round( Math.random() * ( canvasHeight - 1 ) );

                    id = 'component_' + typeId + '_' + i;

                    symbol = symbolManager.getSymbol( typeId );

                    createdPorts = portCreator( id, symbol.ports );

                    newDiagramComponent = new DiagramComponent( {
                        id: id,
                        label: type.labelPrefix + i,
                        x: x,
                        y: y,
                        z: i,
                        rotation: Math.floor( Math.random() * 40 ) * 90,
                        scaleX: 1, //[1, -1][Math.round(Math.random())],
                        scaleY: 1, //[1, -1][Math.round(Math.random())],
                        symbol: symbol,
                        nonSelectable: false,
                        locationLocked: false,
                        draggable: true

                        //          symbolConfig: {
                        //            x: 'x',
                        //            y: 'y',
                        //            label: 'label',
                        //            rotation: 'rotation',
                        //            scaleX: 'scaleX',
                        //            scaleY: 'scaleY',
                        //            ports: 'portInstances',
                        //            portMapping: createdPorts.portMapping
                        //          }
                    } );

                    newDiagramComponent.registerPortInstances( createdPorts.portInstances );

                    newDiagramComponent.updateTransformationMatrix();

                    self.addComponent( newDiagramComponent );

                }

                wires = [];
                wiresById = {};

                for ( i = 0; i < countOfWires; i++ ) {

                    id = 'wire_' + i;

                    component1 = components.getRandomElement();

                    port1 = component1.portInstances.getRandomElement();
                    port2 = undefined;

                    while ( !angular.isDefined( port2 ) || port1 === port2 ) {

                        component2 = components.getRandomElement();
                        port2 = component2.portInstances.getRandomElement();
                    }

                    wire = new Wire( {
                        id: id,
                        end1: {
                            component: component1,
                            port: port1
                        },
                        end2: {
                            component: component2,
                            port: port2
                        }
                    } );

                    wiringService.routeWire( wire, 'ElbowRouter' );

                    self.addWire( wire );

                }

            };

            this.addComponent = function ( aDiagramComponent ) {

                if ( angular.isObject( aDiagramComponent ) && !angular.isDefined( componentsById[ aDiagramComponent
                    .id ] ) ) {

                    componentsById[ aDiagramComponent.id ] = aDiagramComponent;
                    components.push( aDiagramComponent );

                }

            };

            registerWireForEnds = function ( wire ) {

                var componentId;

                componentId = wire.end1.component.id;

                wiresByComponentId[ componentId ] = wiresByComponentId[ componentId ] || [];

                if ( wiresByComponentId[ componentId ].indexOf( wire ) === -1 ) {
                    wiresByComponentId[ componentId ].push( wire );
                }

                componentId = wire.end2.component.id;

                wiresByComponentId[ componentId ] = wiresByComponentId[ componentId ] || [];

                if ( wiresByComponentId[ componentId ].indexOf( wire ) === -1 ) {
                    wiresByComponentId[ componentId ].push( wire );
                }

            };

            this.addWire = function ( aWire ) {

                if ( angular.isObject( aWire ) && !angular.isDefined( wiresById[ aWire.id ] ) ) {

                    wiresById[ aWire.id ] = aWire;
                    wires.push( aWire );

                    registerWireForEnds( aWire );

                }

            };

            this.getWiresForComponents = function ( components ) {

                var setOfWires = [];

                angular.forEach( components, function ( component ) {

                    angular.forEach( wiresByComponentId[ component.id ], function ( wire ) {

                        if ( setOfWires.indexOf( wire ) === -1 ) {
                            setOfWires.push( wire );
                        }
                    } );

                } );

                return setOfWires;

            };

            this.getDiagram = function () {

                return {
                    components: componentsById,
                    wires: wiresById,
                    config: {
                        editable: true,
                        disallowSelection: false
                    }
                };

            };

            this.getHighestZ = function () {

                var i,
                    component,
                    z;

                for ( i = 0; i < components.length; i++ ) {

                    component = components[ i ];

                    if ( !isNaN( component.z ) ) {

                        if ( isNaN( z ) ) {
                            z = component.z;
                        } else {

                            if ( z < component.z ) {
                                z = component.z;
                            }

                        }

                    }
                }

                if ( isNaN( z ) ) {
                    z = -1;
                }

                return z;

            };

            //this.generateDummyDiagram(2000, 500, 10000, 10000);
            //this.generateDummyDiagram(1000, 2000, 10000, 10000);
            this.generateDummyDiagram( 10, 2, 1200, 1200 );

        }
    ] );
},{"./classes/ComponentPort":21,"./classes/DiagramComponent.js":22,"./classes/Wire.js":23}],25:[function(require,module,exports){
/*globals angular*/

'use strict';

var gridServicesModule = angular.module(
    'mms.designVisualization.gridService', [] );

gridServicesModule.service( 'gridService', [ '$log', '$rootScope', '$timeout',
    function ( $log, $rootScope, $timeout ) {

        var self = this,

            grids = {},

            numberOfChangesAllowedInOneCycle = 2000,
            recalculateCycleDelay = 10,
            viewPortPadding = {
                x: -300,
                y: -200
            },

            recalculateVisibleDiagramComponents,
            recalculateVisibleWires;

        recalculateVisibleWires = function ( grid ) {

            var index;

            angular.forEach( grid.wires, function ( wire ) {

                index = grid.visibleWires.indexOf( wire );


                if ( wire.isInViewPort( grid.viewPort, viewPortPadding ) ) {

                    if ( index === -1 ) {
                        grid.visibleWires.push( wire );
                    }

                } else {

                    if ( index > -1 ) {
                        grid.visibleWires.splice( index, 1 );
                    }

                }

            } );

            $log.debug( 'Number of visible wires: ' + grid.visibleWires.length );

        };

        recalculateVisibleDiagramComponents = function ( grid ) {

            var i,
                component,
                countOfChanges = 0,
                changesLimitReached = false,
                index;

            grid.invisibleDiagramComponentsRecalculate = true;


            for ( i = 0; i < grid.components.length && !changesLimitReached; i++ ) {
                component = grid.components[ i ];
            }
            angular.forEach( grid.components, function ( component ) {

                index = grid.visibleDiagramComponents.indexOf( component );

                if ( component.isInViewPort( grid.viewPort, viewPortPadding ) ) {

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

            } );

            self.reorderVisibleComponents( grid.id );

            recalculateVisibleWires( grid );

            $log.debug( 'Number of changes compared to previous diagram state:', countOfChanges );

            if ( !changesLimitReached ) {
                grid.invisibleDiagramComponentsRecalculate = false;
            } else {
                $timeout( function () {
                    recalculateVisibleDiagramComponents( grid );
                }, recalculateCycleDelay );
            }

        };

        this.invalidateVisibleDiagramComponents = function ( gridId ) {

            var grid;

            grid = grids[ gridId ];

            if ( angular.isDefined( grid ) ) {

                if ( !grid.invisibleDiagramComponentsRecalculate ) {
                    $timeout( function () {
                        recalculateVisibleDiagramComponents( grid );
                    } );
                }
            }

        };


        this.createGrid = function ( id, dimensions, diagram ) {

            var grid;

            if ( !angular.isDefined( grids[ id ] ) ) {
                grid = grids[ id ] = {
                    id: id,
                    dimensions: dimensions,
                    components: diagram.components,
                    visibleDiagramComponents: [],
                    wires: diagram.wires,
                    visibleWires: [],
                    viewPort: {},
                    invisibleDiagramComponentsRecalculate: false
                };
            } else {
                throw ( 'Grid was already defined!', id );
            }

            return {
                components: grid.visibleDiagramComponents,
                wires: grid.visibleWires
            };
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

        };

    }
] );
},{}],26:[function(require,module,exports){
/*globals angular*/

'use strict';

var symbolServicesModule = angular.module(
    'mms.designVisualization.symbolServices', [] );

symbolServicesModule.provider( 'symbolManager', function SymbolManagerProvider() {
    var availableSymbols = {};

    this.registerSymbol = function ( symbolDescriptor ) {

        if ( angular.isObject( symbolDescriptor ) &&
            angular.isString( symbolDescriptor.type ) ) {
            availableSymbols[ symbolDescriptor.type ] = symbolDescriptor;
        }
    };

    this.$get = [

        function () {

            var SymbolManager;

            SymbolManager = function () {

                this.getAvailableSymbols = function () {
                    return availableSymbols;
                };

                this.getSymbol = function ( symbolType ) {
                    return availableSymbols[ symbolType ];
                };

                this.getSymbolElementForType = function ( symbolType ) {

                    var result = availableSymbols[ symbolType ] && availableSymbols[ symbolType ].directive;

                    if ( !result ) {
                        result = 'resistor';
                    }

                    return result;
                };
            };

            return new SymbolManager();

        }
    ];
} );
},{}],27:[function(require,module,exports){
/*globals angular*/

'use strict';

var ElbowRouter = function () {

    var self = this;

    this.name = 'ElbowRouter';

    this.makeSegments = function ( points, method ) {

        var i,
            point1, elbow, point2,
            segments;

        method = method || 'verticalFirst';

        if ( angular.isArray( points ) && points.length >= 2 ) {

            segments = [];

            for ( i = 0; i < points.length - 1; i++ ) {

                point1 = points[ i ];
                point2 = points[ i + 1 ];

                if ( method === 'verticalFirst' ) {

                    elbow = {
                        x: point1.x,
                        y: point2.y
                    };

                } else {

                    elbow = {
                        x: point1.y,
                        y: point2.x
                    };

                }

                segments.push( {

                    type: 'line',

                    x1: point1.x,
                    y1: point1.y,

                    x2: elbow.x,
                    y2: elbow.y,

                    router: self.name,
                    orientation: ( method === 'verticalFirst' ) ? 'vertical' : 'horizontal'

                }, {

                    type: 'line',

                    x1: elbow.x,
                    y1: elbow.y,

                    x2: point2.x,
                    y2: point2.y,

                    router: self.name,
                    orientation: ( method === 'verticalFirst' ) ? 'horizontal' : 'vertical'

                } );

            }

        }

        return segments;

    };

};

module.exports = ElbowRouter;
},{}],28:[function(require,module,exports){
/*globals angular*/

'use strict';

var SimpleRouter = function () {

    this.makeSegments = function ( points ) {

        var i,
            point1, point2,
            segments;

        if ( angular.isArray( points ) && points.length >= 2 ) {

            segments = [];

            for ( i = 0; i < points.length - 1; i++ ) {

                point1 = points[ i ];
                point2 = points[ i + 1 ];

                segments.push( {

                    type: 'line',

                    x1: point1.x,
                    y1: point1.y,

                    x2: point2.x,
                    y2: point2.y

                } );

            }

        }

        return segments;

    };

};

module.exports = SimpleRouter;
},{}],29:[function(require,module,exports){
/*globals angular*/

'use strict';

var wiringServicesModule = angular.module(
    'mms.designVisualization.wiringService', [] );

wiringServicesModule.service( 'wiringService', [ '$log', '$rootScope', '$timeout',
    function () {

        var self = this,
            SimpleRouter = require( './classes/SimpleRouter.js' ),
            ElbowRouter = require( './classes/ElbowRouter.js' ),
            routers = {

                SimpleRouter: new SimpleRouter(),
                ElbowRouter: new ElbowRouter()

            };

        this.getSegmentsBetweenPositions = function ( endPositions, routerType ) {

            var segments,
                router;

            router = routers[ routerType ];

            if ( angular.isObject( router ) && angular.isFunction( router.makeSegments ) ) {
                segments = router.makeSegments(
                    [ endPositions.end1, endPositions.end2 ] );
            }

            return segments;

        };

        this.routeWire = function ( wire, routerType ) {

            var router, endPositions;

            routerType = routerType || 'ElbowRouter';

            router = routers[ routerType ];

            if ( angular.isObject( router ) && angular.isFunction( router.makeSegments ) ) {

                endPositions = wire.getEndPositions();

                wire.segments = router.makeSegments(
                    [ endPositions.end1, endPositions.end2 ] );

                wire.routerType = routerType;
            }

        };

        this.adjustWireEndSegments = function ( wire ) {

            var firstSegment,
                secondSegment,
                secondToLastSegment,
                lastSegment,
                endPositions,
                newSegments,
                pos;

            endPositions = wire.getEndPositions();

            if ( angular.isArray( wire.segments ) && wire.segments.length > 1 ) {

                firstSegment = wire.segments[ 0 ];

                if ( firstSegment.x1 !== endPositions.end1.x || firstSegment.y1 !== endPositions.end1.y ) {

                    if ( firstSegment.router === 'ElbowRouter' ) {

                        secondSegment = wire.segments[ 1 ];

                        pos = {
                            x: secondSegment.x2,
                            y: secondSegment.y2
                        };

                        wire.segments.splice( 0, 2 );

                    } else {
                        pos = {
                            x: firstSegment.x2,
                            y: firstSegment.y2
                        };

                        wire.segments.splice( 0, 1 );
                    }

                    newSegments = self.getSegmentsBetweenPositions( {
                        end1: endPositions.end1,
                        end2: pos
                    }, firstSegment.router );

                    wire.segments = newSegments.concat( wire.segments );

                }

                lastSegment = wire.segments[ wire.segments.length - 1 ];

                if ( lastSegment.x2 !== endPositions.end2.x || lastSegment.y2 !== endPositions.end2.y ) {

                    if ( lastSegment.router === 'ElbowRouter' ) {

                        secondToLastSegment = wire.segments[ wire.segments.length - 2 ];

                        pos = {
                            x: secondToLastSegment.x1,
                            y: secondToLastSegment.y1
                        };

                        wire.segments.splice( wire.segments.length - 2, 2 );

                    } else {
                        pos = {
                            x: lastSegment.x1,
                            y: lastSegment.y1
                        };

                        wire.segments.splice( wire.segments.length - 1, 1 );
                    }

                    newSegments = self.getSegmentsBetweenPositions( {
                        end1: pos,
                        end2: endPositions.end2
                    }, lastSegment.router );

                    wire.segments = wire.segments.concat( newSegments );

                }

            } else {
                self.routeWire( wire );
            }

        };

    }
] );
},{"./classes/ElbowRouter.js":27,"./classes/SimpleRouter.js":28}],30:[function(require,module,exports){
'use strict';

require( 'Array.prototype.find' );

if ( !Array.prototype.findById ) {
    Array.prototype.findById = function ( id ) {
        return this.find( function ( a ) {
            return a.id !== undefined && a.id === id;
        } );
    };
}

if ( !Array.prototype.getRandomElement ) {
    Array.prototype.getRandomElement = function () {
        return this[ Math.round( Math.random() * ( this.length - 1 ) ) ];
    };
}

if ( !Array.prototype.shuffle ) {
    Array.prototype.shuffle = function () {
        var currentIndex = this.length,
            temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while ( 0 !== currentIndex ) {

            // Pick a remaining element...
            randomIndex = Math.floor( Math.random() * currentIndex );
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = this[ currentIndex ];
            this[ currentIndex ] = this[ randomIndex ];
            this[ randomIndex ] = temporaryValue;
        }

        return this;
    };
}
},{"Array.prototype.find":2}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuL3NyYy9hcHAvbW1zQXBwL2FwcC5qcyIsIi9Vc2Vycy9sYXN6bG9qdXJhY3ovUHJvamVjdHMvbW9ycGgvbW1zLXdlYmN5cGh5L2Jvd2VyX2NvbXBvbmVudHMvQXJyYXkucHJvdG90eXBlLmZpbmQvaW5kZXguanMiLCIvVXNlcnMvbGFzemxvanVyYWN6L1Byb2plY3RzL21vcnBoL21tcy13ZWJjeXBoeS9ib3dlcl9jb21wb25lbnRzL2dsLW1hdHJpeC9kaXN0L2dsLW1hdHJpeC1taW4uanMiLCIvVXNlcnMvbGFzemxvanVyYWN6L1Byb2plY3RzL21vcnBoL21tcy13ZWJjeXBoeS9zcmMvYXBwL21tc0FwcC9kaXJlY3RpdmVzL2NvbXBvbmVudFdpcmUvY29tcG9uZW50V2lyZS5qcyIsIi9Vc2Vycy9sYXN6bG9qdXJhY3ovUHJvamVjdHMvbW9ycGgvbW1zLXdlYmN5cGh5L3NyYy9hcHAvbW1zQXBwL2RpcmVjdGl2ZXMvY29tcG9uZW50V2lyZS9jb21wb25lbnRXaXJlU2VnbWVudC5qcyIsIi9Vc2Vycy9sYXN6bG9qdXJhY3ovUHJvamVjdHMvbW9ycGgvbW1zLXdlYmN5cGh5L3NyYy9hcHAvbW1zQXBwL2RpcmVjdGl2ZXMvZGlhZ3JhbUNvbnRhaW5lci9kaWFncmFtQ29udGFpbmVyLmpzIiwiL1VzZXJzL2xhc3psb2p1cmFjei9Qcm9qZWN0cy9tb3JwaC9tbXMtd2ViY3lwaHkvc3JjL2FwcC9tbXNBcHAvZGlyZWN0aXZlcy9kcmF3aW5nQ2FudmFzL2RyYXdpbmdDYW52YXMuanMiLCIvVXNlcnMvbGFzemxvanVyYWN6L1Byb2plY3RzL21vcnBoL21tcy13ZWJjeXBoeS9zcmMvYXBwL21tc0FwcC9kaXJlY3RpdmVzL2ZhYnJpY0NhbnZhcy9mYWJyaWNDYW52YXMuanMiLCIvVXNlcnMvbGFzemxvanVyYWN6L1Byb2plY3RzL21vcnBoL21tcy13ZWJjeXBoeS9zcmMvYXBwL21tc0FwcC9kaXJlY3RpdmVzL3BvcnQvcG9ydC5qcyIsIi9Vc2Vycy9sYXN6bG9qdXJhY3ovUHJvamVjdHMvbW9ycGgvbW1zLXdlYmN5cGh5L3NyYy9hcHAvbW1zQXBwL2RpcmVjdGl2ZXMvc3ZnRGlhZ3JhbS9jbGFzc2VzL0NvbXBvbmVudERyYWdIYW5kbGVyLmpzIiwiL1VzZXJzL2xhc3psb2p1cmFjei9Qcm9qZWN0cy9tb3JwaC9tbXMtd2ViY3lwaHkvc3JjL2FwcC9tbXNBcHAvZGlyZWN0aXZlcy9zdmdEaWFncmFtL2NsYXNzZXMvQ29tcG9uZW50U2VsZWN0aW9uSGFuZGxlci5qcyIsIi9Vc2Vycy9sYXN6bG9qdXJhY3ovUHJvamVjdHMvbW9ycGgvbW1zLXdlYmN5cGh5L3NyYy9hcHAvbW1zQXBwL2RpcmVjdGl2ZXMvc3ZnRGlhZ3JhbS9zdmdEaWFncmFtLmpzIiwiL1VzZXJzL2xhc3psb2p1cmFjei9Qcm9qZWN0cy9tb3JwaC9tbXMtd2ViY3lwaHkvc3JjL2FwcC9tbXNBcHAvZGlyZWN0aXZlcy9zeW1ib2xzL2JveC9ib3guanMiLCIvVXNlcnMvbGFzemxvanVyYWN6L1Byb2plY3RzL21vcnBoL21tcy13ZWJjeXBoeS9zcmMvYXBwL21tc0FwcC9kaXJlY3RpdmVzL3N5bWJvbHMvY2FwYWNpdG9yL2NhcGFjaXRvci5qcyIsIi9Vc2Vycy9sYXN6bG9qdXJhY3ovUHJvamVjdHMvbW9ycGgvbW1zLXdlYmN5cGh5L3NyYy9hcHAvbW1zQXBwL2RpcmVjdGl2ZXMvc3ltYm9scy9jb21wb25lbnRTeW1ib2wuanMiLCIvVXNlcnMvbGFzemxvanVyYWN6L1Byb2plY3RzL21vcnBoL21tcy13ZWJjeXBoeS9zcmMvYXBwL21tc0FwcC9kaXJlY3RpdmVzL3N5bWJvbHMvZGlvZGUvZGlvZGUuanMiLCIvVXNlcnMvbGFzemxvanVyYWN6L1Byb2plY3RzL21vcnBoL21tcy13ZWJjeXBoeS9zcmMvYXBwL21tc0FwcC9kaXJlY3RpdmVzL3N5bWJvbHMvaW5kdWN0b3IvaW5kdWN0b3IuanMiLCIvVXNlcnMvbGFzemxvanVyYWN6L1Byb2plY3RzL21vcnBoL21tcy13ZWJjeXBoeS9zcmMvYXBwL21tc0FwcC9kaXJlY3RpdmVzL3N5bWJvbHMvakZldFAvakZldFAuanMiLCIvVXNlcnMvbGFzemxvanVyYWN6L1Byb2plY3RzL21vcnBoL21tcy13ZWJjeXBoeS9zcmMvYXBwL21tc0FwcC9kaXJlY3RpdmVzL3N5bWJvbHMvb3BBbXAvb3BBbXAuanMiLCIvVXNlcnMvbGFzemxvanVyYWN6L1Byb2plY3RzL21vcnBoL21tcy13ZWJjeXBoeS9zcmMvYXBwL21tc0FwcC9kaXJlY3RpdmVzL3N5bWJvbHMvcmVzaXN0b3IvcmVzaXN0b3IuanMiLCIvVXNlcnMvbGFzemxvanVyYWN6L1Byb2plY3RzL21vcnBoL21tcy13ZWJjeXBoeS9zcmMvYXBwL21tc0FwcC9zZXJ2aWNlcy9kaWFncmFtU2VydmljZS9jbGFzc2VzL0NvbXBvbmVudFBvcnQuanMiLCIvVXNlcnMvbGFzemxvanVyYWN6L1Byb2plY3RzL21vcnBoL21tcy13ZWJjeXBoeS9zcmMvYXBwL21tc0FwcC9zZXJ2aWNlcy9kaWFncmFtU2VydmljZS9jbGFzc2VzL0RpYWdyYW1Db21wb25lbnQuanMiLCIvVXNlcnMvbGFzemxvanVyYWN6L1Byb2plY3RzL21vcnBoL21tcy13ZWJjeXBoeS9zcmMvYXBwL21tc0FwcC9zZXJ2aWNlcy9kaWFncmFtU2VydmljZS9jbGFzc2VzL1dpcmUuanMiLCIvVXNlcnMvbGFzemxvanVyYWN6L1Byb2plY3RzL21vcnBoL21tcy13ZWJjeXBoeS9zcmMvYXBwL21tc0FwcC9zZXJ2aWNlcy9kaWFncmFtU2VydmljZS9kaWFncmFtU2VydmljZS5qcyIsIi9Vc2Vycy9sYXN6bG9qdXJhY3ovUHJvamVjdHMvbW9ycGgvbW1zLXdlYmN5cGh5L3NyYy9hcHAvbW1zQXBwL3NlcnZpY2VzL2dyaWRTZXJ2aWNlL2dyaWRTZXJ2aWNlLmpzIiwiL1VzZXJzL2xhc3psb2p1cmFjei9Qcm9qZWN0cy9tb3JwaC9tbXMtd2ViY3lwaHkvc3JjL2FwcC9tbXNBcHAvc2VydmljZXMvc3ltYm9sU2VydmljZXMvc3ltYm9sU2VydmljZXMuanMiLCIvVXNlcnMvbGFzemxvanVyYWN6L1Byb2plY3RzL21vcnBoL21tcy13ZWJjeXBoeS9zcmMvYXBwL21tc0FwcC9zZXJ2aWNlcy93aXJpbmdTZXJ2aWNlL2NsYXNzZXMvRWxib3dSb3V0ZXIuanMiLCIvVXNlcnMvbGFzemxvanVyYWN6L1Byb2plY3RzL21vcnBoL21tcy13ZWJjeXBoeS9zcmMvYXBwL21tc0FwcC9zZXJ2aWNlcy93aXJpbmdTZXJ2aWNlL2NsYXNzZXMvU2ltcGxlUm91dGVyLmpzIiwiL1VzZXJzL2xhc3psb2p1cmFjei9Qcm9qZWN0cy9tb3JwaC9tbXMtd2ViY3lwaHkvc3JjL2FwcC9tbXNBcHAvc2VydmljZXMvd2lyaW5nU2VydmljZS93aXJpbmdTZXJ2aWNlLmpzIiwiL1VzZXJzL2xhc3psb2p1cmFjei9Qcm9qZWN0cy9tb3JwaC9tbXMtd2ViY3lwaHkvc3JjL2FwcC9tbXNBcHAvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDak1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qZ2xvYmFscyBhbmd1bGFyKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ3lQaHlBcHAgPSBhbmd1bGFyLm1vZHVsZSgnQ3lQaHlBcHAnLCBbXG4gICAgJ3VpLnJvdXRlcicsXG5cbiAgICAnZ21lLnNlcnZpY2VzJyxcblxuICAgICdpc2lzLnVpLmNvbXBvbmVudHMnLFxuXG4gICAgJ2N5cGh5LmNvbXBvbmVudHMnLFxuXG4gICAgLy8gYXBwIHNwZWNpZmljIHRlbXBsYXRlc1xuICAgICdjeXBoeS5tbXNBcHAudGVtcGxhdGVzJyxcblxuICAgICd1aS5ib290c3RyYXAnLFxuXG4gICAgJ21tcy5kZXNpZ25WaXN1YWxpemF0aW9uLndpcmluZ1NlcnZpY2UnLFxuICAgICdtbXMuZGVzaWduVmlzdWFsaXphdGlvbi5kaWFncmFtU2VydmljZScsXG5cbiAgICAnbW1zLmRlc2lnblZpc3VhbGl6YXRpb24uZGlhZ3JhbUNvbnRhaW5lcicsXG4gICAgJ21tcy5kZXNpZ25WaXN1YWxpemF0aW9uLmZhYnJpY0NhbnZhcycsXG4gICAgJ21tcy5kZXNpZ25WaXN1YWxpemF0aW9uLnN2Z0RpYWdyYW0nLFxuICAgICdtbXMuZGVzaWduVmlzdWFsaXphdGlvbi5zeW1ib2xzJyxcbiAgICAnbmdNYXRlcmlhbCdcbl0pO1xuXG5yZXF1aXJlKCcuL3V0aWxzLmpzJyk7XG5cbnJlcXVpcmUoJy4vc2VydmljZXMvZGlhZ3JhbVNlcnZpY2UvZGlhZ3JhbVNlcnZpY2UuanMnKTtcbnJlcXVpcmUoJy4vc2VydmljZXMvZ3JpZFNlcnZpY2UvZ3JpZFNlcnZpY2UuanMnKTtcbnJlcXVpcmUoJy4vc2VydmljZXMvd2lyaW5nU2VydmljZS93aXJpbmdTZXJ2aWNlLmpzJyk7XG5cbnJlcXVpcmUoJy4vZGlyZWN0aXZlcy9kaWFncmFtQ29udGFpbmVyL2RpYWdyYW1Db250YWluZXIuanMnKTtcbnJlcXVpcmUoJy4vZGlyZWN0aXZlcy9mYWJyaWNDYW52YXMvZmFicmljQ2FudmFzLmpzJyk7XG5yZXF1aXJlKCcuL2RpcmVjdGl2ZXMvc3ZnRGlhZ3JhbS9zdmdEaWFncmFtLmpzJyk7XG5cbnJlcXVpcmUoJy4vZGlyZWN0aXZlcy9zeW1ib2xzL2NvbXBvbmVudFN5bWJvbC5qcycpO1xuXG5DeVBoeUFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcblxuICAgIHZhciBzZWxlY3RQcm9qZWN0O1xuXG4gICAgc2VsZWN0UHJvamVjdCA9IHtcbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKCRxLCAkc3RhdGVQYXJhbXMsICRyb290U2NvcGUsICRzdGF0ZSwgJGxvZywgZGF0YVN0b3JlU2VydmljZSwgcHJvamVjdFNlcnZpY2UsIHdvcmtzcGFjZVNlcnZpY2UpIHtcbiAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25JZCxcbiAgICAgICAgICAgICAgICBkZWZlcnJlZDtcblxuICAgICAgICAgICAgJHJvb3RTY29wZS5tYWluRGJDb25uZWN0aW9uSWQgPSAnbW1zLW1haW4tZGItY29ubmVjdGlvbi1pZCc7XG5cbiAgICAgICAgICAgIGNvbm5lY3Rpb25JZCA9ICRyb290U2NvcGUubWFpbkRiQ29ubmVjdGlvbklkO1xuICAgICAgICAgICAgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICBkYXRhU3RvcmVTZXJ2aWNlLmNvbm5lY3RUb0RhdGFiYXNlKGNvbm5lY3Rpb25JZCwge1xuICAgICAgICAgICAgICAgIGhvc3Q6IHdpbmRvdy5sb2NhdGlvbi5iYXNlbmFtZVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9qZWN0U2VydmljZS5zZWxlY3RQcm9qZWN0KGNvbm5lY3Rpb25JZCwgJHN0YXRlUGFyYW1zLnByb2plY3RJZCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocHJvamVjdElkKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHdzQ29udGV4dDtcblxuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLnByb2plY3RJZCA9IHByb2plY3RJZDtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgd3NDb250ZXh0ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGI6ICRyb290U2NvcGUubWFpbkRiQ29ubmVjdGlvbklkLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVnaW9uSWQ6ICdXb3Jrc3BhY2VMaXN0Q29udHJvbGxlcl8nICsgKCBuZXcgRGF0ZSgpIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudG9JU09TdHJpbmcoKVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyRzY29wZS4kb24oICckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgd29ya3NwYWNlU2VydmljZS5jbGVhblVwQWxsUmVnaW9ucyggY29udGV4dCApO1xuICAgICAgICAgICAgICAgICAgICAvL30gKTtcblxuXG4gICAgICAgICAgICAgICAgICAgIHdvcmtzcGFjZVNlcnZpY2UucmVnaXN0ZXJXYXRjaGVyKHdzQ29udGV4dCwgZnVuY3Rpb24gKGRlc3Ryb3llZCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oJ1dvcmtzcGFjZUxpc3RDb250cm9sbGVyIC0gaW5pdGlhbGl6ZSBldmVudCByYWlzZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtzcGFjZVNlcnZpY2Uud2F0Y2hXb3Jrc3BhY2VzKHdzQ29udGV4dCwgZnVuY3Rpb24gKHVwZGF0ZU9iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbmRleDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1cGRhdGVPYmplY3QudHlwZSA9PT0gJ2xvYWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdsb2FkJywgdXBkYXRlT2JqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHVwZGF0ZU9iamVjdC50eXBlID09PSAndXBkYXRlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndXBkYXRlJywgdXBkYXRlT2JqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHVwZGF0ZU9iamVjdC50eXBlID09PSAndW5sb2FkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndW5sb2FkJywgdXBkYXRlT2JqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IodXBkYXRlT2JqZWN0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgd29ya3NwYWNlSWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh3b3Jrc3BhY2VJZCBpbiBkYXRhLndvcmtzcGFjZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLndvcmtzcGFjZXMuaGFzT3duUHJvcGVydHkod29ya3NwYWNlSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocHJvamVjdElkKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoKGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGxvZy5kZWJ1ZygnT3BlbmluZyBwcm9qZWN0IGVycm9yZWQ6JywgJHN0YXRlUGFyYW1zLnByb2plY3RJZCwgcmVhc29uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnNDA0Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2plY3RJZDogJHN0YXRlUGFyYW1zLnByb2plY3RJZFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy9ub1Byb2plY3QnKTtcblxuXG4gICAgJHN0YXRlUHJvdmlkZXJcbiAgICAgICAgLnN0YXRlKCdwcm9qZWN0Jywge1xuICAgICAgICAgICAgdXJsOiAnL3Byb2plY3QvOnByb2plY3RJZCcsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy9tbXNBcHAvdGVtcGxhdGVzL2VkaXRvci5odG1sJyxcbiAgICAgICAgICAgIHJlc29sdmU6IHNlbGVjdFByb2plY3QsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnUHJvamVjdFZpZXdDb250cm9sbGVyJ1xuICAgICAgICB9KVxuICAgICAgICAuc3RhdGUoJ25vUHJvamVjdCcsIHtcbiAgICAgICAgICAgIHVybDogJy9ub1Byb2plY3QnLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvbW1zQXBwL3RlbXBsYXRlcy9ub1Byb2plY3RTcGVjaWZpZWQuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnTm9Qcm9qZWN0Q29udHJvbGxlcidcbiAgICAgICAgfSlcbiAgICAgICAgLnN0YXRlKCc0MDQnLCB7XG4gICAgICAgICAgICB1cmw6ICcvNDA0Lzpwcm9qZWN0SWQnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ05vUHJvamVjdENvbnRyb2xsZXInLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvbW1zQXBwL3RlbXBsYXRlcy80MDQuaHRtbCdcbiAgICAgICAgfSk7XG59KTtcblxuQ3lQaHlBcHAuY29udHJvbGxlcignTWFpbk5hdmlnYXRvckNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHNjb3BlLCAkd2luZG93KSB7XG5cbiAgICB2YXIgZGVmYXVsdE5hdmlnYXRvckl0ZW1zO1xuXG4gICAgZGVmYXVsdE5hdmlnYXRvckl0ZW1zID0gW3tcbiAgICAgICAgaWQ6ICdyb290JyxcbiAgICAgICAgbGFiZWw6ICdNTVMgQXBwJyxcbiAgICAgICAgaXRlbUNsYXNzOiAnY3lwaHktcm9vdCdcbiAgICB9XTtcblxuICAgICRzY29wZS5uYXZpZ2F0b3IgPSB7XG4gICAgICAgIHNlcGFyYXRvcjogdHJ1ZSxcbiAgICAgICAgaXRlbXM6IGFuZ3VsYXIuY29weShkZWZhdWx0TmF2aWdhdG9ySXRlbXMsIFtdKVxuICAgIH07XG5cbiAgICAkcm9vdFNjb3BlLiR3YXRjaCgncHJvamVjdElkJywgZnVuY3Rpb24gKHByb2plY3RJZCkge1xuXG4gICAgICAgIGlmIChwcm9qZWN0SWQpIHtcblxuICAgICAgICAgICAgJHNjb3BlLm5hdmlnYXRvci5pdGVtcyA9IGFuZ3VsYXIuY29weShkZWZhdWx0TmF2aWdhdG9ySXRlbXMsIFtdKTtcbiAgICAgICAgICAgICRzY29wZS5uYXZpZ2F0b3IuaXRlbXMucHVzaCh7XG4gICAgICAgICAgICAgICAgaWQ6ICdwcm9qZWN0JyxcbiAgICAgICAgICAgICAgICBsYWJlbDogcHJvamVjdElkLFxuICAgICAgICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkd2luZG93Lm9wZW4oJy8/cHJvamVjdD0nICsgcHJvamVjdElkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLm5hdmlnYXRvci5pdGVtcyA9IGFuZ3VsYXIuY29weShkZWZhdWx0TmF2aWdhdG9ySXRlbXMsIFtdKTtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbn0pO1xuXG5DeVBoeUFwcC5jb250cm9sbGVyKCdQcm9qZWN0Vmlld0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCAkcm9vdFNjb3BlLCBkaWFncmFtU2VydmljZSwgJGxvZykge1xuXG4gICAgJHNjb3BlLmRpYWdyYW0gPSBkaWFncmFtU2VydmljZS5nZXREaWFncmFtKCk7XG5cblxuICAgICRsb2cuZGVidWcoJ0RpYWdyYW06JywgJHNjb3BlLmRpYWdyYW0pO1xuXG59KTtcblxuQ3lQaHlBcHAuY29udHJvbGxlcignTm9Qcm9qZWN0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgJGh0dHAsICRsb2csICRzdGF0ZSwgZ3Jvd2wpIHtcblxuICAgICRzY29wZS5wcm9qZWN0SWQgPSAkc3RhdGVQYXJhbXMucHJvamVjdElkO1xuICAgICRzY29wZS5lcnJvcmVkID0gZmFsc2U7XG5cbiAgICAkc2NvcGUuc3RhcnROZXdQcm9qZWN0ID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICRyb290U2NvcGUucHJvY2Vzc2luZyA9IHRydWU7XG5cbiAgICAgICAgJGxvZy5kZWJ1ZygnTmV3IHByb2plY3QgY3JlYXRpb24nKTtcblxuICAgICAgICAkaHR0cC5nZXQoJy9yZXN0L2V4dGVybmFsL2NvcHlwcm9qZWN0L25vcmVkaXJlY3QnKVxuICAgICAgICAgICAgLlxuICAgICAgICAgICAgc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xuXG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5wcm9jZXNzaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgJGxvZy5kZWJ1ZygnTmV3IHByb2plY3QgY3JlYXRpb24gc3VjY2Vzc2Z1bCcsIGRhdGEpO1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygncHJvamVjdCcsIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvamVjdElkOiBkYXRhXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuXG4gICAgICAgICAgICBlcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzKSB7XG5cbiAgICAgICAgICAgICAgICAkbG9nLmRlYnVnKCdOZXcgcHJvamVjdCBjcmVhdGlvbiBmYWlsZWQnLCBzdGF0dXMpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUucHJvY2Vzc2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGdyb3dsLmVycm9yKCdBbiBlcnJvciBvY2N1cmVkIHdoaWxlIHByb2plY3QgY3JlYXRpb24uIFBsZWFzZSByZXRyeSBsYXRlci4nKTtcblxuICAgICAgICAgICAgfSk7XG5cbiAgICB9O1xuXG59KTtcblxuXG4vL0N5UGh5QXBwLnJ1bihmdW5jdGlvbiAoJHN0YXRlLCBncm93bCwgZGF0YVN0b3JlU2VydmljZSwgcHJvamVjdFNlcnZpY2UpIHtcblxuLy8gIHZhciBjb25uZWN0aW9uSWQgPSAnbW1zLWNvbm5lY3Rpb24taWQnO1xuLy9cbi8vICBkYXRhU3RvcmVTZXJ2aWNlLmNvbm5lY3RUb0RhdGFiYXNlKGNvbm5lY3Rpb25JZCwge2hvc3Q6IHdpbmRvdy5sb2NhdGlvbi5iYXNlbmFtZX0pXG4vLyAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4vLyAgICAgIC8vIHNlbGVjdCBkZWZhdWx0IHByb2plY3QgYW5kIGJyYW5jaCAobWFzdGVyKVxuLy8gICAgICByZXR1cm4gcHJvamVjdFNlcnZpY2Uuc2VsZWN0UHJvamVjdChjb25uZWN0aW9uSWQsICdBRE1FZGl0b3InKTtcbi8vICAgIH0pXG4vLyAgICAuY2F0Y2goZnVuY3Rpb24gKHJlYXNvbikge1xuLy8gICAgICBncm93bC5lcnJvcignQURNRWRpdG9yIGRvZXMgbm90IGV4aXN0LiBDcmVhdGUgYW5kIGltcG9ydCBpdCB1c2luZyB0aGUgPGEgaHJlZj1cIicgK1xuLy8gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyAnXCI+IHdlYmdtZSBpbnRlcmZhY2U8L2E+LicpO1xuLy8gICAgICBjb25zb2xlLmVycm9yKHJlYXNvbik7XG4vLyAgICB9KTtcbi8vfSk7XG4iLCIvLyBBcnJheS5wcm90b3R5cGUuZmluZCAtIE1JVCBMaWNlbnNlIChjKSAyMDEzIFBhdWwgTWlsbGVyIDxodHRwOi8vcGF1bG1pbGxyLmNvbT5cbi8vIEZvciBhbGwgZGV0YWlscyBhbmQgZG9jczogaHR0cHM6Ly9naXRodWIuY29tL3BhdWxtaWxsci9hcnJheS5wcm90b3R5cGUuZmluZFxuLy8gRml4ZXMgYW5kIHRlc3RzIHN1cHBsaWVkIGJ5IER1bmNhbiBIYWxsIDxodHRwOi8vZHVuY2FuaGFsbC5uZXQ+IFxuKGZ1bmN0aW9uKGdsb2JhbHMpe1xuICBpZiAoQXJyYXkucHJvdG90eXBlLmZpbmQpIHJldHVybjtcblxuICB2YXIgZmluZCA9IGZ1bmN0aW9uKHByZWRpY2F0ZSkge1xuICAgIHZhciBsaXN0ID0gT2JqZWN0KHRoaXMpO1xuICAgIHZhciBsZW5ndGggPSBsaXN0Lmxlbmd0aCA8IDAgPyAwIDogbGlzdC5sZW5ndGggPj4+IDA7IC8vIEVTLlRvVWludDMyO1xuICAgIGlmIChsZW5ndGggPT09IDApIHJldHVybiB1bmRlZmluZWQ7XG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgIT09ICdmdW5jdGlvbicgfHwgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHByZWRpY2F0ZSkgIT09ICdbb2JqZWN0IEZ1bmN0aW9uXScpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FycmF5I2ZpbmQ6IHByZWRpY2F0ZSBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICB9XG4gICAgdmFyIHRoaXNBcmcgPSBhcmd1bWVudHNbMV07XG4gICAgZm9yICh2YXIgaSA9IDAsIHZhbHVlOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhbHVlID0gbGlzdFtpXTtcbiAgICAgIGlmIChwcmVkaWNhdGUuY2FsbCh0aGlzQXJnLCB2YWx1ZSwgaSwgbGlzdCkpIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfTtcblxuICBpZiAoT2JqZWN0LmRlZmluZVByb3BlcnR5KSB7XG4gICAgdHJ5IHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShBcnJheS5wcm90b3R5cGUsICdmaW5kJywge1xuICAgICAgICB2YWx1ZTogZmluZCwgY29uZmlndXJhYmxlOiB0cnVlLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWVcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2goZSkge31cbiAgfVxuXG4gIGlmICghQXJyYXkucHJvdG90eXBlLmZpbmQpIHtcbiAgICBBcnJheS5wcm90b3R5cGUuZmluZCA9IGZpbmQ7XG4gIH1cbn0pKHRoaXMpO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IGdsLW1hdHJpeCAtIEhpZ2ggcGVyZm9ybWFuY2UgbWF0cml4IGFuZCB2ZWN0b3Igb3BlcmF0aW9uc1xuICogQGF1dGhvciBCcmFuZG9uIEpvbmVzXG4gKiBAYXV0aG9yIENvbGluIE1hY0tlbnppZSBJVlxuICogQHZlcnNpb24gMi4yLjFcbiAqL1xuLyogQ29weXJpZ2h0IChjKSAyMDEzLCBCcmFuZG9uIEpvbmVzLCBDb2xpbiBNYWNLZW56aWUgSVYuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG5cblJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dCBtb2RpZmljYXRpb24sXG5hcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG5cbiAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsIHRoaXNcbiAgICBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsXG4gICAgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGUgZG9jdW1lbnRhdGlvblxuICAgIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuXG5USElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIiBBTkRcbkFOWSBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRSBJTVBMSUVEXG5XQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFXG5ESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUIEhPTERFUiBPUiBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUlxuQU5ZIERJUkVDVCwgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTXG4oSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7XG5MT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT05cbkFOWSBUSEVPUlkgT0YgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUXG4oSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0YgVEhJU1xuU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuICovXG4oZnVuY3Rpb24oZSl7XCJ1c2Ugc3RyaWN0XCI7dmFyIHQ9e307dHlwZW9mIGV4cG9ydHM9PVwidW5kZWZpbmVkXCI/dHlwZW9mIGRlZmluZT09XCJmdW5jdGlvblwiJiZ0eXBlb2YgZGVmaW5lLmFtZD09XCJvYmplY3RcIiYmZGVmaW5lLmFtZD8odC5leHBvcnRzPXt9LGRlZmluZShmdW5jdGlvbigpe3JldHVybiB0LmV4cG9ydHN9KSk6dC5leHBvcnRzPXR5cGVvZiB3aW5kb3chPVwidW5kZWZpbmVkXCI/d2luZG93OmU6dC5leHBvcnRzPWV4cG9ydHMsZnVuY3Rpb24oZSl7aWYoIXQpdmFyIHQ9MWUtNjtpZighbil2YXIgbj10eXBlb2YgRmxvYXQzMkFycmF5IT1cInVuZGVmaW5lZFwiP0Zsb2F0MzJBcnJheTpBcnJheTtpZighcil2YXIgcj1NYXRoLnJhbmRvbTt2YXIgaT17fTtpLnNldE1hdHJpeEFycmF5VHlwZT1mdW5jdGlvbihlKXtuPWV9LHR5cGVvZiBlIT1cInVuZGVmaW5lZFwiJiYoZS5nbE1hdHJpeD1pKTt2YXIgcz1NYXRoLlBJLzE4MDtpLnRvUmFkaWFuPWZ1bmN0aW9uKGUpe3JldHVybiBlKnN9O3ZhciBvPXt9O28uY3JlYXRlPWZ1bmN0aW9uKCl7dmFyIGU9bmV3IG4oMik7cmV0dXJuIGVbMF09MCxlWzFdPTAsZX0sby5jbG9uZT1mdW5jdGlvbihlKXt2YXIgdD1uZXcgbigyKTtyZXR1cm4gdFswXT1lWzBdLHRbMV09ZVsxXSx0fSxvLmZyb21WYWx1ZXM9ZnVuY3Rpb24oZSx0KXt2YXIgcj1uZXcgbigyKTtyZXR1cm4gclswXT1lLHJbMV09dCxyfSxvLmNvcHk9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZVswXT10WzBdLGVbMV09dFsxXSxlfSxvLnNldD1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGVbMF09dCxlWzFdPW4sZX0sby5hZGQ9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlWzBdPXRbMF0rblswXSxlWzFdPXRbMV0rblsxXSxlfSxvLnN1YnRyYWN0PWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZVswXT10WzBdLW5bMF0sZVsxXT10WzFdLW5bMV0sZX0sby5zdWI9by5zdWJ0cmFjdCxvLm11bHRpcGx5PWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZVswXT10WzBdKm5bMF0sZVsxXT10WzFdKm5bMV0sZX0sby5tdWw9by5tdWx0aXBseSxvLmRpdmlkZT1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGVbMF09dFswXS9uWzBdLGVbMV09dFsxXS9uWzFdLGV9LG8uZGl2PW8uZGl2aWRlLG8ubWluPWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZVswXT1NYXRoLm1pbih0WzBdLG5bMF0pLGVbMV09TWF0aC5taW4odFsxXSxuWzFdKSxlfSxvLm1heD1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGVbMF09TWF0aC5tYXgodFswXSxuWzBdKSxlWzFdPU1hdGgubWF4KHRbMV0sblsxXSksZX0sby5zY2FsZT1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGVbMF09dFswXSpuLGVbMV09dFsxXSpuLGV9LG8uc2NhbGVBbmRBZGQ9ZnVuY3Rpb24oZSx0LG4scil7cmV0dXJuIGVbMF09dFswXStuWzBdKnIsZVsxXT10WzFdK25bMV0qcixlfSxvLmRpc3RhbmNlPWZ1bmN0aW9uKGUsdCl7dmFyIG49dFswXS1lWzBdLHI9dFsxXS1lWzFdO3JldHVybiBNYXRoLnNxcnQobipuK3Iqcil9LG8uZGlzdD1vLmRpc3RhbmNlLG8uc3F1YXJlZERpc3RhbmNlPWZ1bmN0aW9uKGUsdCl7dmFyIG49dFswXS1lWzBdLHI9dFsxXS1lWzFdO3JldHVybiBuKm4rcipyfSxvLnNxckRpc3Q9by5zcXVhcmVkRGlzdGFuY2Usby5sZW5ndGg9ZnVuY3Rpb24oZSl7dmFyIHQ9ZVswXSxuPWVbMV07cmV0dXJuIE1hdGguc3FydCh0KnQrbipuKX0sby5sZW49by5sZW5ndGgsby5zcXVhcmVkTGVuZ3RoPWZ1bmN0aW9uKGUpe3ZhciB0PWVbMF0sbj1lWzFdO3JldHVybiB0KnQrbipufSxvLnNxckxlbj1vLnNxdWFyZWRMZW5ndGgsby5uZWdhdGU9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZVswXT0tdFswXSxlWzFdPS10WzFdLGV9LG8ubm9ybWFsaXplPWZ1bmN0aW9uKGUsdCl7dmFyIG49dFswXSxyPXRbMV0saT1uKm4rcipyO3JldHVybiBpPjAmJihpPTEvTWF0aC5zcXJ0KGkpLGVbMF09dFswXSppLGVbMV09dFsxXSppKSxlfSxvLmRvdD1mdW5jdGlvbihlLHQpe3JldHVybiBlWzBdKnRbMF0rZVsxXSp0WzFdfSxvLmNyb3NzPWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10WzBdKm5bMV0tdFsxXSpuWzBdO3JldHVybiBlWzBdPWVbMV09MCxlWzJdPXIsZX0sby5sZXJwPWZ1bmN0aW9uKGUsdCxuLHIpe3ZhciBpPXRbMF0scz10WzFdO3JldHVybiBlWzBdPWkrciooblswXS1pKSxlWzFdPXMrciooblsxXS1zKSxlfSxvLnJhbmRvbT1mdW5jdGlvbihlLHQpe3Q9dHx8MTt2YXIgbj1yKCkqMipNYXRoLlBJO3JldHVybiBlWzBdPU1hdGguY29zKG4pKnQsZVsxXT1NYXRoLnNpbihuKSp0LGV9LG8udHJhbnNmb3JtTWF0Mj1mdW5jdGlvbihlLHQsbil7dmFyIHI9dFswXSxpPXRbMV07cmV0dXJuIGVbMF09blswXSpyK25bMl0qaSxlWzFdPW5bMV0qcituWzNdKmksZX0sby50cmFuc2Zvcm1NYXQyZD1mdW5jdGlvbihlLHQsbil7dmFyIHI9dFswXSxpPXRbMV07cmV0dXJuIGVbMF09blswXSpyK25bMl0qaStuWzRdLGVbMV09blsxXSpyK25bM10qaStuWzVdLGV9LG8udHJhbnNmb3JtTWF0Mz1mdW5jdGlvbihlLHQsbil7dmFyIHI9dFswXSxpPXRbMV07cmV0dXJuIGVbMF09blswXSpyK25bM10qaStuWzZdLGVbMV09blsxXSpyK25bNF0qaStuWzddLGV9LG8udHJhbnNmb3JtTWF0ND1mdW5jdGlvbihlLHQsbil7dmFyIHI9dFswXSxpPXRbMV07cmV0dXJuIGVbMF09blswXSpyK25bNF0qaStuWzEyXSxlWzFdPW5bMV0qcituWzVdKmkrblsxM10sZX0sby5mb3JFYWNoPWZ1bmN0aW9uKCl7dmFyIGU9by5jcmVhdGUoKTtyZXR1cm4gZnVuY3Rpb24odCxuLHIsaSxzLG8pe3ZhciB1LGE7bnx8KG49Mikscnx8KHI9MCksaT9hPU1hdGgubWluKGkqbityLHQubGVuZ3RoKTphPXQubGVuZ3RoO2Zvcih1PXI7dTxhO3UrPW4pZVswXT10W3VdLGVbMV09dFt1KzFdLHMoZSxlLG8pLHRbdV09ZVswXSx0W3UrMV09ZVsxXTtyZXR1cm4gdH19KCksby5zdHI9ZnVuY3Rpb24oZSl7cmV0dXJuXCJ2ZWMyKFwiK2VbMF0rXCIsIFwiK2VbMV0rXCIpXCJ9LHR5cGVvZiBlIT1cInVuZGVmaW5lZFwiJiYoZS52ZWMyPW8pO3ZhciB1PXt9O3UuY3JlYXRlPWZ1bmN0aW9uKCl7dmFyIGU9bmV3IG4oMyk7cmV0dXJuIGVbMF09MCxlWzFdPTAsZVsyXT0wLGV9LHUuY2xvbmU9ZnVuY3Rpb24oZSl7dmFyIHQ9bmV3IG4oMyk7cmV0dXJuIHRbMF09ZVswXSx0WzFdPWVbMV0sdFsyXT1lWzJdLHR9LHUuZnJvbVZhbHVlcz1mdW5jdGlvbihlLHQscil7dmFyIGk9bmV3IG4oMyk7cmV0dXJuIGlbMF09ZSxpWzFdPXQsaVsyXT1yLGl9LHUuY29weT1mdW5jdGlvbihlLHQpe3JldHVybiBlWzBdPXRbMF0sZVsxXT10WzFdLGVbMl09dFsyXSxlfSx1LnNldD1mdW5jdGlvbihlLHQsbixyKXtyZXR1cm4gZVswXT10LGVbMV09bixlWzJdPXIsZX0sdS5hZGQ9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlWzBdPXRbMF0rblswXSxlWzFdPXRbMV0rblsxXSxlWzJdPXRbMl0rblsyXSxlfSx1LnN1YnRyYWN0PWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZVswXT10WzBdLW5bMF0sZVsxXT10WzFdLW5bMV0sZVsyXT10WzJdLW5bMl0sZX0sdS5zdWI9dS5zdWJ0cmFjdCx1Lm11bHRpcGx5PWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZVswXT10WzBdKm5bMF0sZVsxXT10WzFdKm5bMV0sZVsyXT10WzJdKm5bMl0sZX0sdS5tdWw9dS5tdWx0aXBseSx1LmRpdmlkZT1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGVbMF09dFswXS9uWzBdLGVbMV09dFsxXS9uWzFdLGVbMl09dFsyXS9uWzJdLGV9LHUuZGl2PXUuZGl2aWRlLHUubWluPWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZVswXT1NYXRoLm1pbih0WzBdLG5bMF0pLGVbMV09TWF0aC5taW4odFsxXSxuWzFdKSxlWzJdPU1hdGgubWluKHRbMl0sblsyXSksZX0sdS5tYXg9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlWzBdPU1hdGgubWF4KHRbMF0sblswXSksZVsxXT1NYXRoLm1heCh0WzFdLG5bMV0pLGVbMl09TWF0aC5tYXgodFsyXSxuWzJdKSxlfSx1LnNjYWxlPWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZVswXT10WzBdKm4sZVsxXT10WzFdKm4sZVsyXT10WzJdKm4sZX0sdS5zY2FsZUFuZEFkZD1mdW5jdGlvbihlLHQsbixyKXtyZXR1cm4gZVswXT10WzBdK25bMF0qcixlWzFdPXRbMV0rblsxXSpyLGVbMl09dFsyXStuWzJdKnIsZX0sdS5kaXN0YW5jZT1mdW5jdGlvbihlLHQpe3ZhciBuPXRbMF0tZVswXSxyPXRbMV0tZVsxXSxpPXRbMl0tZVsyXTtyZXR1cm4gTWF0aC5zcXJ0KG4qbityKnIraSppKX0sdS5kaXN0PXUuZGlzdGFuY2UsdS5zcXVhcmVkRGlzdGFuY2U9ZnVuY3Rpb24oZSx0KXt2YXIgbj10WzBdLWVbMF0scj10WzFdLWVbMV0saT10WzJdLWVbMl07cmV0dXJuIG4qbityKnIraSppfSx1LnNxckRpc3Q9dS5zcXVhcmVkRGlzdGFuY2UsdS5sZW5ndGg9ZnVuY3Rpb24oZSl7dmFyIHQ9ZVswXSxuPWVbMV0scj1lWzJdO3JldHVybiBNYXRoLnNxcnQodCp0K24qbityKnIpfSx1Lmxlbj11Lmxlbmd0aCx1LnNxdWFyZWRMZW5ndGg9ZnVuY3Rpb24oZSl7dmFyIHQ9ZVswXSxuPWVbMV0scj1lWzJdO3JldHVybiB0KnQrbipuK3Iqcn0sdS5zcXJMZW49dS5zcXVhcmVkTGVuZ3RoLHUubmVnYXRlPWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGVbMF09LXRbMF0sZVsxXT0tdFsxXSxlWzJdPS10WzJdLGV9LHUubm9ybWFsaXplPWZ1bmN0aW9uKGUsdCl7dmFyIG49dFswXSxyPXRbMV0saT10WzJdLHM9bipuK3IqcitpKmk7cmV0dXJuIHM+MCYmKHM9MS9NYXRoLnNxcnQocyksZVswXT10WzBdKnMsZVsxXT10WzFdKnMsZVsyXT10WzJdKnMpLGV9LHUuZG90PWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGVbMF0qdFswXStlWzFdKnRbMV0rZVsyXSp0WzJdfSx1LmNyb3NzPWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10WzBdLGk9dFsxXSxzPXRbMl0sbz1uWzBdLHU9blsxXSxhPW5bMl07cmV0dXJuIGVbMF09aSphLXMqdSxlWzFdPXMqby1yKmEsZVsyXT1yKnUtaSpvLGV9LHUubGVycD1mdW5jdGlvbihlLHQsbixyKXt2YXIgaT10WzBdLHM9dFsxXSxvPXRbMl07cmV0dXJuIGVbMF09aStyKihuWzBdLWkpLGVbMV09cytyKihuWzFdLXMpLGVbMl09bytyKihuWzJdLW8pLGV9LHUucmFuZG9tPWZ1bmN0aW9uKGUsdCl7dD10fHwxO3ZhciBuPXIoKSoyKk1hdGguUEksaT1yKCkqMi0xLHM9TWF0aC5zcXJ0KDEtaSppKSp0O3JldHVybiBlWzBdPU1hdGguY29zKG4pKnMsZVsxXT1NYXRoLnNpbihuKSpzLGVbMl09aSp0LGV9LHUudHJhbnNmb3JtTWF0ND1mdW5jdGlvbihlLHQsbil7dmFyIHI9dFswXSxpPXRbMV0scz10WzJdO3JldHVybiBlWzBdPW5bMF0qcituWzRdKmkrbls4XSpzK25bMTJdLGVbMV09blsxXSpyK25bNV0qaStuWzldKnMrblsxM10sZVsyXT1uWzJdKnIrbls2XSppK25bMTBdKnMrblsxNF0sZX0sdS50cmFuc2Zvcm1NYXQzPWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10WzBdLGk9dFsxXSxzPXRbMl07cmV0dXJuIGVbMF09cipuWzBdK2kqblszXStzKm5bNl0sZVsxXT1yKm5bMV0raSpuWzRdK3Mqbls3XSxlWzJdPXIqblsyXStpKm5bNV0rcypuWzhdLGV9LHUudHJhbnNmb3JtUXVhdD1mdW5jdGlvbihlLHQsbil7dmFyIHI9dFswXSxpPXRbMV0scz10WzJdLG89blswXSx1PW5bMV0sYT1uWzJdLGY9blszXSxsPWYqcit1KnMtYSppLGM9ZippK2Eqci1vKnMsaD1mKnMrbyppLXUqcixwPS1vKnItdSppLWEqcztyZXR1cm4gZVswXT1sKmYrcCotbytjKi1hLWgqLXUsZVsxXT1jKmYrcCotdStoKi1vLWwqLWEsZVsyXT1oKmYrcCotYStsKi11LWMqLW8sZX0sdS5yb3RhdGVYPWZ1bmN0aW9uKGUsdCxuLHIpe3ZhciBpPVtdLHM9W107cmV0dXJuIGlbMF09dFswXS1uWzBdLGlbMV09dFsxXS1uWzFdLGlbMl09dFsyXS1uWzJdLHNbMF09aVswXSxzWzFdPWlbMV0qTWF0aC5jb3MociktaVsyXSpNYXRoLnNpbihyKSxzWzJdPWlbMV0qTWF0aC5zaW4ocikraVsyXSpNYXRoLmNvcyhyKSxlWzBdPXNbMF0rblswXSxlWzFdPXNbMV0rblsxXSxlWzJdPXNbMl0rblsyXSxlfSx1LnJvdGF0ZVk9ZnVuY3Rpb24oZSx0LG4scil7dmFyIGk9W10scz1bXTtyZXR1cm4gaVswXT10WzBdLW5bMF0saVsxXT10WzFdLW5bMV0saVsyXT10WzJdLW5bMl0sc1swXT1pWzJdKk1hdGguc2luKHIpK2lbMF0qTWF0aC5jb3Mociksc1sxXT1pWzFdLHNbMl09aVsyXSpNYXRoLmNvcyhyKS1pWzBdKk1hdGguc2luKHIpLGVbMF09c1swXStuWzBdLGVbMV09c1sxXStuWzFdLGVbMl09c1syXStuWzJdLGV9LHUucm90YXRlWj1mdW5jdGlvbihlLHQsbixyKXt2YXIgaT1bXSxzPVtdO3JldHVybiBpWzBdPXRbMF0tblswXSxpWzFdPXRbMV0tblsxXSxpWzJdPXRbMl0tblsyXSxzWzBdPWlbMF0qTWF0aC5jb3MociktaVsxXSpNYXRoLnNpbihyKSxzWzFdPWlbMF0qTWF0aC5zaW4ocikraVsxXSpNYXRoLmNvcyhyKSxzWzJdPWlbMl0sZVswXT1zWzBdK25bMF0sZVsxXT1zWzFdK25bMV0sZVsyXT1zWzJdK25bMl0sZX0sdS5mb3JFYWNoPWZ1bmN0aW9uKCl7dmFyIGU9dS5jcmVhdGUoKTtyZXR1cm4gZnVuY3Rpb24odCxuLHIsaSxzLG8pe3ZhciB1LGE7bnx8KG49Mykscnx8KHI9MCksaT9hPU1hdGgubWluKGkqbityLHQubGVuZ3RoKTphPXQubGVuZ3RoO2Zvcih1PXI7dTxhO3UrPW4pZVswXT10W3VdLGVbMV09dFt1KzFdLGVbMl09dFt1KzJdLHMoZSxlLG8pLHRbdV09ZVswXSx0W3UrMV09ZVsxXSx0W3UrMl09ZVsyXTtyZXR1cm4gdH19KCksdS5zdHI9ZnVuY3Rpb24oZSl7cmV0dXJuXCJ2ZWMzKFwiK2VbMF0rXCIsIFwiK2VbMV0rXCIsIFwiK2VbMl0rXCIpXCJ9LHR5cGVvZiBlIT1cInVuZGVmaW5lZFwiJiYoZS52ZWMzPXUpO3ZhciBhPXt9O2EuY3JlYXRlPWZ1bmN0aW9uKCl7dmFyIGU9bmV3IG4oNCk7cmV0dXJuIGVbMF09MCxlWzFdPTAsZVsyXT0wLGVbM109MCxlfSxhLmNsb25lPWZ1bmN0aW9uKGUpe3ZhciB0PW5ldyBuKDQpO3JldHVybiB0WzBdPWVbMF0sdFsxXT1lWzFdLHRbMl09ZVsyXSx0WzNdPWVbM10sdH0sYS5mcm9tVmFsdWVzPWZ1bmN0aW9uKGUsdCxyLGkpe3ZhciBzPW5ldyBuKDQpO3JldHVybiBzWzBdPWUsc1sxXT10LHNbMl09cixzWzNdPWksc30sYS5jb3B5PWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGVbMF09dFswXSxlWzFdPXRbMV0sZVsyXT10WzJdLGVbM109dFszXSxlfSxhLnNldD1mdW5jdGlvbihlLHQsbixyLGkpe3JldHVybiBlWzBdPXQsZVsxXT1uLGVbMl09cixlWzNdPWksZX0sYS5hZGQ9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlWzBdPXRbMF0rblswXSxlWzFdPXRbMV0rblsxXSxlWzJdPXRbMl0rblsyXSxlWzNdPXRbM10rblszXSxlfSxhLnN1YnRyYWN0PWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZVswXT10WzBdLW5bMF0sZVsxXT10WzFdLW5bMV0sZVsyXT10WzJdLW5bMl0sZVszXT10WzNdLW5bM10sZX0sYS5zdWI9YS5zdWJ0cmFjdCxhLm11bHRpcGx5PWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZVswXT10WzBdKm5bMF0sZVsxXT10WzFdKm5bMV0sZVsyXT10WzJdKm5bMl0sZVszXT10WzNdKm5bM10sZX0sYS5tdWw9YS5tdWx0aXBseSxhLmRpdmlkZT1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGVbMF09dFswXS9uWzBdLGVbMV09dFsxXS9uWzFdLGVbMl09dFsyXS9uWzJdLGVbM109dFszXS9uWzNdLGV9LGEuZGl2PWEuZGl2aWRlLGEubWluPWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZVswXT1NYXRoLm1pbih0WzBdLG5bMF0pLGVbMV09TWF0aC5taW4odFsxXSxuWzFdKSxlWzJdPU1hdGgubWluKHRbMl0sblsyXSksZVszXT1NYXRoLm1pbih0WzNdLG5bM10pLGV9LGEubWF4PWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZVswXT1NYXRoLm1heCh0WzBdLG5bMF0pLGVbMV09TWF0aC5tYXgodFsxXSxuWzFdKSxlWzJdPU1hdGgubWF4KHRbMl0sblsyXSksZVszXT1NYXRoLm1heCh0WzNdLG5bM10pLGV9LGEuc2NhbGU9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlWzBdPXRbMF0qbixlWzFdPXRbMV0qbixlWzJdPXRbMl0qbixlWzNdPXRbM10qbixlfSxhLnNjYWxlQW5kQWRkPWZ1bmN0aW9uKGUsdCxuLHIpe3JldHVybiBlWzBdPXRbMF0rblswXSpyLGVbMV09dFsxXStuWzFdKnIsZVsyXT10WzJdK25bMl0qcixlWzNdPXRbM10rblszXSpyLGV9LGEuZGlzdGFuY2U9ZnVuY3Rpb24oZSx0KXt2YXIgbj10WzBdLWVbMF0scj10WzFdLWVbMV0saT10WzJdLWVbMl0scz10WzNdLWVbM107cmV0dXJuIE1hdGguc3FydChuKm4rcipyK2kqaStzKnMpfSxhLmRpc3Q9YS5kaXN0YW5jZSxhLnNxdWFyZWREaXN0YW5jZT1mdW5jdGlvbihlLHQpe3ZhciBuPXRbMF0tZVswXSxyPXRbMV0tZVsxXSxpPXRbMl0tZVsyXSxzPXRbM10tZVszXTtyZXR1cm4gbipuK3IqcitpKmkrcypzfSxhLnNxckRpc3Q9YS5zcXVhcmVkRGlzdGFuY2UsYS5sZW5ndGg9ZnVuY3Rpb24oZSl7dmFyIHQ9ZVswXSxuPWVbMV0scj1lWzJdLGk9ZVszXTtyZXR1cm4gTWF0aC5zcXJ0KHQqdCtuKm4rcipyK2kqaSl9LGEubGVuPWEubGVuZ3RoLGEuc3F1YXJlZExlbmd0aD1mdW5jdGlvbihlKXt2YXIgdD1lWzBdLG49ZVsxXSxyPWVbMl0saT1lWzNdO3JldHVybiB0KnQrbipuK3IqcitpKml9LGEuc3FyTGVuPWEuc3F1YXJlZExlbmd0aCxhLm5lZ2F0ZT1mdW5jdGlvbihlLHQpe3JldHVybiBlWzBdPS10WzBdLGVbMV09LXRbMV0sZVsyXT0tdFsyXSxlWzNdPS10WzNdLGV9LGEubm9ybWFsaXplPWZ1bmN0aW9uKGUsdCl7dmFyIG49dFswXSxyPXRbMV0saT10WzJdLHM9dFszXSxvPW4qbityKnIraSppK3MqcztyZXR1cm4gbz4wJiYobz0xL01hdGguc3FydChvKSxlWzBdPXRbMF0qbyxlWzFdPXRbMV0qbyxlWzJdPXRbMl0qbyxlWzNdPXRbM10qbyksZX0sYS5kb3Q9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZVswXSp0WzBdK2VbMV0qdFsxXStlWzJdKnRbMl0rZVszXSp0WzNdfSxhLmxlcnA9ZnVuY3Rpb24oZSx0LG4scil7dmFyIGk9dFswXSxzPXRbMV0sbz10WzJdLHU9dFszXTtyZXR1cm4gZVswXT1pK3IqKG5bMF0taSksZVsxXT1zK3IqKG5bMV0tcyksZVsyXT1vK3IqKG5bMl0tbyksZVszXT11K3IqKG5bM10tdSksZX0sYS5yYW5kb209ZnVuY3Rpb24oZSx0KXtyZXR1cm4gdD10fHwxLGVbMF09cigpLGVbMV09cigpLGVbMl09cigpLGVbM109cigpLGEubm9ybWFsaXplKGUsZSksYS5zY2FsZShlLGUsdCksZX0sYS50cmFuc2Zvcm1NYXQ0PWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10WzBdLGk9dFsxXSxzPXRbMl0sbz10WzNdO3JldHVybiBlWzBdPW5bMF0qcituWzRdKmkrbls4XSpzK25bMTJdKm8sZVsxXT1uWzFdKnIrbls1XSppK25bOV0qcytuWzEzXSpvLGVbMl09blsyXSpyK25bNl0qaStuWzEwXSpzK25bMTRdKm8sZVszXT1uWzNdKnIrbls3XSppK25bMTFdKnMrblsxNV0qbyxlfSxhLnRyYW5zZm9ybVF1YXQ9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPXRbMF0saT10WzFdLHM9dFsyXSxvPW5bMF0sdT1uWzFdLGE9blsyXSxmPW5bM10sbD1mKnIrdSpzLWEqaSxjPWYqaSthKnItbypzLGg9ZipzK28qaS11KnIscD0tbypyLXUqaS1hKnM7cmV0dXJuIGVbMF09bCpmK3AqLW8rYyotYS1oKi11LGVbMV09YypmK3AqLXUraCotby1sKi1hLGVbMl09aCpmK3AqLWErbCotdS1jKi1vLGV9LGEuZm9yRWFjaD1mdW5jdGlvbigpe3ZhciBlPWEuY3JlYXRlKCk7cmV0dXJuIGZ1bmN0aW9uKHQsbixyLGkscyxvKXt2YXIgdSxhO258fChuPTQpLHJ8fChyPTApLGk/YT1NYXRoLm1pbihpKm4rcix0Lmxlbmd0aCk6YT10Lmxlbmd0aDtmb3IodT1yO3U8YTt1Kz1uKWVbMF09dFt1XSxlWzFdPXRbdSsxXSxlWzJdPXRbdSsyXSxlWzNdPXRbdSszXSxzKGUsZSxvKSx0W3VdPWVbMF0sdFt1KzFdPWVbMV0sdFt1KzJdPWVbMl0sdFt1KzNdPWVbM107cmV0dXJuIHR9fSgpLGEuc3RyPWZ1bmN0aW9uKGUpe3JldHVyblwidmVjNChcIitlWzBdK1wiLCBcIitlWzFdK1wiLCBcIitlWzJdK1wiLCBcIitlWzNdK1wiKVwifSx0eXBlb2YgZSE9XCJ1bmRlZmluZWRcIiYmKGUudmVjND1hKTt2YXIgZj17fTtmLmNyZWF0ZT1mdW5jdGlvbigpe3ZhciBlPW5ldyBuKDQpO3JldHVybiBlWzBdPTEsZVsxXT0wLGVbMl09MCxlWzNdPTEsZX0sZi5jbG9uZT1mdW5jdGlvbihlKXt2YXIgdD1uZXcgbig0KTtyZXR1cm4gdFswXT1lWzBdLHRbMV09ZVsxXSx0WzJdPWVbMl0sdFszXT1lWzNdLHR9LGYuY29weT1mdW5jdGlvbihlLHQpe3JldHVybiBlWzBdPXRbMF0sZVsxXT10WzFdLGVbMl09dFsyXSxlWzNdPXRbM10sZX0sZi5pZGVudGl0eT1mdW5jdGlvbihlKXtyZXR1cm4gZVswXT0xLGVbMV09MCxlWzJdPTAsZVszXT0xLGV9LGYudHJhbnNwb3NlPWZ1bmN0aW9uKGUsdCl7aWYoZT09PXQpe3ZhciBuPXRbMV07ZVsxXT10WzJdLGVbMl09bn1lbHNlIGVbMF09dFswXSxlWzFdPXRbMl0sZVsyXT10WzFdLGVbM109dFszXTtyZXR1cm4gZX0sZi5pbnZlcnQ9ZnVuY3Rpb24oZSx0KXt2YXIgbj10WzBdLHI9dFsxXSxpPXRbMl0scz10WzNdLG89bipzLWkqcjtyZXR1cm4gbz8obz0xL28sZVswXT1zKm8sZVsxXT0tcipvLGVbMl09LWkqbyxlWzNdPW4qbyxlKTpudWxsfSxmLmFkam9pbnQ9ZnVuY3Rpb24oZSx0KXt2YXIgbj10WzBdO3JldHVybiBlWzBdPXRbM10sZVsxXT0tdFsxXSxlWzJdPS10WzJdLGVbM109bixlfSxmLmRldGVybWluYW50PWZ1bmN0aW9uKGUpe3JldHVybiBlWzBdKmVbM10tZVsyXSplWzFdfSxmLm11bHRpcGx5PWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10WzBdLGk9dFsxXSxzPXRbMl0sbz10WzNdLHU9blswXSxhPW5bMV0sZj1uWzJdLGw9blszXTtyZXR1cm4gZVswXT1yKnUrcyphLGVbMV09aSp1K28qYSxlWzJdPXIqZitzKmwsZVszXT1pKmYrbypsLGV9LGYubXVsPWYubXVsdGlwbHksZi5yb3RhdGU9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPXRbMF0saT10WzFdLHM9dFsyXSxvPXRbM10sdT1NYXRoLnNpbihuKSxhPU1hdGguY29zKG4pO3JldHVybiBlWzBdPXIqYStzKnUsZVsxXT1pKmErbyp1LGVbMl09ciotdStzKmEsZVszXT1pKi11K28qYSxlfSxmLnNjYWxlPWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10WzBdLGk9dFsxXSxzPXRbMl0sbz10WzNdLHU9blswXSxhPW5bMV07cmV0dXJuIGVbMF09cip1LGVbMV09aSp1LGVbMl09cyphLGVbM109byphLGV9LGYuc3RyPWZ1bmN0aW9uKGUpe3JldHVyblwibWF0MihcIitlWzBdK1wiLCBcIitlWzFdK1wiLCBcIitlWzJdK1wiLCBcIitlWzNdK1wiKVwifSxmLmZyb2I9ZnVuY3Rpb24oZSl7cmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyhlWzBdLDIpK01hdGgucG93KGVbMV0sMikrTWF0aC5wb3coZVsyXSwyKStNYXRoLnBvdyhlWzNdLDIpKX0sZi5MRFU9ZnVuY3Rpb24oZSx0LG4scil7cmV0dXJuIGVbMl09clsyXS9yWzBdLG5bMF09clswXSxuWzFdPXJbMV0sblszXT1yWzNdLWVbMl0qblsxXSxbZSx0LG5dfSx0eXBlb2YgZSE9XCJ1bmRlZmluZWRcIiYmKGUubWF0Mj1mKTt2YXIgbD17fTtsLmNyZWF0ZT1mdW5jdGlvbigpe3ZhciBlPW5ldyBuKDYpO3JldHVybiBlWzBdPTEsZVsxXT0wLGVbMl09MCxlWzNdPTEsZVs0XT0wLGVbNV09MCxlfSxsLmNsb25lPWZ1bmN0aW9uKGUpe3ZhciB0PW5ldyBuKDYpO3JldHVybiB0WzBdPWVbMF0sdFsxXT1lWzFdLHRbMl09ZVsyXSx0WzNdPWVbM10sdFs0XT1lWzRdLHRbNV09ZVs1XSx0fSxsLmNvcHk9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZVswXT10WzBdLGVbMV09dFsxXSxlWzJdPXRbMl0sZVszXT10WzNdLGVbNF09dFs0XSxlWzVdPXRbNV0sZX0sbC5pZGVudGl0eT1mdW5jdGlvbihlKXtyZXR1cm4gZVswXT0xLGVbMV09MCxlWzJdPTAsZVszXT0xLGVbNF09MCxlWzVdPTAsZX0sbC5pbnZlcnQ9ZnVuY3Rpb24oZSx0KXt2YXIgbj10WzBdLHI9dFsxXSxpPXRbMl0scz10WzNdLG89dFs0XSx1PXRbNV0sYT1uKnMtcippO3JldHVybiBhPyhhPTEvYSxlWzBdPXMqYSxlWzFdPS1yKmEsZVsyXT0taSphLGVbM109biphLGVbNF09KGkqdS1zKm8pKmEsZVs1XT0ocipvLW4qdSkqYSxlKTpudWxsfSxsLmRldGVybWluYW50PWZ1bmN0aW9uKGUpe3JldHVybiBlWzBdKmVbM10tZVsxXSplWzJdfSxsLm11bHRpcGx5PWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10WzBdLGk9dFsxXSxzPXRbMl0sbz10WzNdLHU9dFs0XSxhPXRbNV0sZj1uWzBdLGw9blsxXSxjPW5bMl0saD1uWzNdLHA9bls0XSxkPW5bNV07cmV0dXJuIGVbMF09cipmK3MqbCxlWzFdPWkqZitvKmwsZVsyXT1yKmMrcypoLGVbM109aSpjK28qaCxlWzRdPXIqcCtzKmQrdSxlWzVdPWkqcCtvKmQrYSxlfSxsLm11bD1sLm11bHRpcGx5LGwucm90YXRlPWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10WzBdLGk9dFsxXSxzPXRbMl0sbz10WzNdLHU9dFs0XSxhPXRbNV0sZj1NYXRoLnNpbihuKSxsPU1hdGguY29zKG4pO3JldHVybiBlWzBdPXIqbCtzKmYsZVsxXT1pKmwrbypmLGVbMl09ciotZitzKmwsZVszXT1pKi1mK28qbCxlWzRdPXUsZVs1XT1hLGV9LGwuc2NhbGU9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPXRbMF0saT10WzFdLHM9dFsyXSxvPXRbM10sdT10WzRdLGE9dFs1XSxmPW5bMF0sbD1uWzFdO3JldHVybiBlWzBdPXIqZixlWzFdPWkqZixlWzJdPXMqbCxlWzNdPW8qbCxlWzRdPXUsZVs1XT1hLGV9LGwudHJhbnNsYXRlPWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10WzBdLGk9dFsxXSxzPXRbMl0sbz10WzNdLHU9dFs0XSxhPXRbNV0sZj1uWzBdLGw9blsxXTtyZXR1cm4gZVswXT1yLGVbMV09aSxlWzJdPXMsZVszXT1vLGVbNF09cipmK3MqbCt1LGVbNV09aSpmK28qbCthLGV9LGwuc3RyPWZ1bmN0aW9uKGUpe3JldHVyblwibWF0MmQoXCIrZVswXStcIiwgXCIrZVsxXStcIiwgXCIrZVsyXStcIiwgXCIrZVszXStcIiwgXCIrZVs0XStcIiwgXCIrZVs1XStcIilcIn0sbC5mcm9iPWZ1bmN0aW9uKGUpe3JldHVybiBNYXRoLnNxcnQoTWF0aC5wb3coZVswXSwyKStNYXRoLnBvdyhlWzFdLDIpK01hdGgucG93KGVbMl0sMikrTWF0aC5wb3coZVszXSwyKStNYXRoLnBvdyhlWzRdLDIpK01hdGgucG93KGVbNV0sMikrMSl9LHR5cGVvZiBlIT1cInVuZGVmaW5lZFwiJiYoZS5tYXQyZD1sKTt2YXIgYz17fTtjLmNyZWF0ZT1mdW5jdGlvbigpe3ZhciBlPW5ldyBuKDkpO3JldHVybiBlWzBdPTEsZVsxXT0wLGVbMl09MCxlWzNdPTAsZVs0XT0xLGVbNV09MCxlWzZdPTAsZVs3XT0wLGVbOF09MSxlfSxjLmZyb21NYXQ0PWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGVbMF09dFswXSxlWzFdPXRbMV0sZVsyXT10WzJdLGVbM109dFs0XSxlWzRdPXRbNV0sZVs1XT10WzZdLGVbNl09dFs4XSxlWzddPXRbOV0sZVs4XT10WzEwXSxlfSxjLmNsb25lPWZ1bmN0aW9uKGUpe3ZhciB0PW5ldyBuKDkpO3JldHVybiB0WzBdPWVbMF0sdFsxXT1lWzFdLHRbMl09ZVsyXSx0WzNdPWVbM10sdFs0XT1lWzRdLHRbNV09ZVs1XSx0WzZdPWVbNl0sdFs3XT1lWzddLHRbOF09ZVs4XSx0fSxjLmNvcHk9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZVswXT10WzBdLGVbMV09dFsxXSxlWzJdPXRbMl0sZVszXT10WzNdLGVbNF09dFs0XSxlWzVdPXRbNV0sZVs2XT10WzZdLGVbN109dFs3XSxlWzhdPXRbOF0sZX0sYy5pZGVudGl0eT1mdW5jdGlvbihlKXtyZXR1cm4gZVswXT0xLGVbMV09MCxlWzJdPTAsZVszXT0wLGVbNF09MSxlWzVdPTAsZVs2XT0wLGVbN109MCxlWzhdPTEsZX0sYy50cmFuc3Bvc2U9ZnVuY3Rpb24oZSx0KXtpZihlPT09dCl7dmFyIG49dFsxXSxyPXRbMl0saT10WzVdO2VbMV09dFszXSxlWzJdPXRbNl0sZVszXT1uLGVbNV09dFs3XSxlWzZdPXIsZVs3XT1pfWVsc2UgZVswXT10WzBdLGVbMV09dFszXSxlWzJdPXRbNl0sZVszXT10WzFdLGVbNF09dFs0XSxlWzVdPXRbN10sZVs2XT10WzJdLGVbN109dFs1XSxlWzhdPXRbOF07cmV0dXJuIGV9LGMuaW52ZXJ0PWZ1bmN0aW9uKGUsdCl7dmFyIG49dFswXSxyPXRbMV0saT10WzJdLHM9dFszXSxvPXRbNF0sdT10WzVdLGE9dFs2XSxmPXRbN10sbD10WzhdLGM9bCpvLXUqZixoPS1sKnMrdSphLHA9ZipzLW8qYSxkPW4qYytyKmgraSpwO3JldHVybiBkPyhkPTEvZCxlWzBdPWMqZCxlWzFdPSgtbCpyK2kqZikqZCxlWzJdPSh1KnItaSpvKSpkLGVbM109aCpkLGVbNF09KGwqbi1pKmEpKmQsZVs1XT0oLXUqbitpKnMpKmQsZVs2XT1wKmQsZVs3XT0oLWYqbityKmEpKmQsZVs4XT0obypuLXIqcykqZCxlKTpudWxsfSxjLmFkam9pbnQ9ZnVuY3Rpb24oZSx0KXt2YXIgbj10WzBdLHI9dFsxXSxpPXRbMl0scz10WzNdLG89dFs0XSx1PXRbNV0sYT10WzZdLGY9dFs3XSxsPXRbOF07cmV0dXJuIGVbMF09bypsLXUqZixlWzFdPWkqZi1yKmwsZVsyXT1yKnUtaSpvLGVbM109dSphLXMqbCxlWzRdPW4qbC1pKmEsZVs1XT1pKnMtbip1LGVbNl09cypmLW8qYSxlWzddPXIqYS1uKmYsZVs4XT1uKm8tcipzLGV9LGMuZGV0ZXJtaW5hbnQ9ZnVuY3Rpb24oZSl7dmFyIHQ9ZVswXSxuPWVbMV0scj1lWzJdLGk9ZVszXSxzPWVbNF0sbz1lWzVdLHU9ZVs2XSxhPWVbN10sZj1lWzhdO3JldHVybiB0KihmKnMtbyphKStuKigtZippK28qdSkrciooYSppLXMqdSl9LGMubXVsdGlwbHk9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPXRbMF0saT10WzFdLHM9dFsyXSxvPXRbM10sdT10WzRdLGE9dFs1XSxmPXRbNl0sbD10WzddLGM9dFs4XSxoPW5bMF0scD1uWzFdLGQ9blsyXSx2PW5bM10sbT1uWzRdLGc9bls1XSx5PW5bNl0sYj1uWzddLHc9bls4XTtyZXR1cm4gZVswXT1oKnIrcCpvK2QqZixlWzFdPWgqaStwKnUrZCpsLGVbMl09aCpzK3AqYStkKmMsZVszXT12KnIrbSpvK2cqZixlWzRdPXYqaSttKnUrZypsLGVbNV09dipzK20qYStnKmMsZVs2XT15KnIrYipvK3cqZixlWzddPXkqaStiKnUrdypsLGVbOF09eSpzK2IqYSt3KmMsZX0sYy5tdWw9Yy5tdWx0aXBseSxjLnRyYW5zbGF0ZT1mdW5jdGlvbihlLHQsbil7dmFyIHI9dFswXSxpPXRbMV0scz10WzJdLG89dFszXSx1PXRbNF0sYT10WzVdLGY9dFs2XSxsPXRbN10sYz10WzhdLGg9blswXSxwPW5bMV07cmV0dXJuIGVbMF09cixlWzFdPWksZVsyXT1zLGVbM109byxlWzRdPXUsZVs1XT1hLGVbNl09aCpyK3AqbytmLGVbN109aCppK3AqdStsLGVbOF09aCpzK3AqYStjLGV9LGMucm90YXRlPWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10WzBdLGk9dFsxXSxzPXRbMl0sbz10WzNdLHU9dFs0XSxhPXRbNV0sZj10WzZdLGw9dFs3XSxjPXRbOF0saD1NYXRoLnNpbihuKSxwPU1hdGguY29zKG4pO3JldHVybiBlWzBdPXAqcitoKm8sZVsxXT1wKmkraCp1LGVbMl09cCpzK2gqYSxlWzNdPXAqby1oKnIsZVs0XT1wKnUtaCppLGVbNV09cCphLWgqcyxlWzZdPWYsZVs3XT1sLGVbOF09YyxlfSxjLnNjYWxlPWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj1uWzBdLGk9blsxXTtyZXR1cm4gZVswXT1yKnRbMF0sZVsxXT1yKnRbMV0sZVsyXT1yKnRbMl0sZVszXT1pKnRbM10sZVs0XT1pKnRbNF0sZVs1XT1pKnRbNV0sZVs2XT10WzZdLGVbN109dFs3XSxlWzhdPXRbOF0sZX0sYy5mcm9tTWF0MmQ9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZVswXT10WzBdLGVbMV09dFsxXSxlWzJdPTAsZVszXT10WzJdLGVbNF09dFszXSxlWzVdPTAsZVs2XT10WzRdLGVbN109dFs1XSxlWzhdPTEsZX0sYy5mcm9tUXVhdD1mdW5jdGlvbihlLHQpe3ZhciBuPXRbMF0scj10WzFdLGk9dFsyXSxzPXRbM10sbz1uK24sdT1yK3IsYT1pK2ksZj1uKm8sbD1yKm8sYz1yKnUsaD1pKm8scD1pKnUsZD1pKmEsdj1zKm8sbT1zKnUsZz1zKmE7cmV0dXJuIGVbMF09MS1jLWQsZVszXT1sLWcsZVs2XT1oK20sZVsxXT1sK2csZVs0XT0xLWYtZCxlWzddPXAtdixlWzJdPWgtbSxlWzVdPXArdixlWzhdPTEtZi1jLGV9LGMubm9ybWFsRnJvbU1hdDQ9ZnVuY3Rpb24oZSx0KXt2YXIgbj10WzBdLHI9dFsxXSxpPXRbMl0scz10WzNdLG89dFs0XSx1PXRbNV0sYT10WzZdLGY9dFs3XSxsPXRbOF0sYz10WzldLGg9dFsxMF0scD10WzExXSxkPXRbMTJdLHY9dFsxM10sbT10WzE0XSxnPXRbMTVdLHk9bip1LXIqbyxiPW4qYS1pKm8sdz1uKmYtcypvLEU9ciphLWkqdSxTPXIqZi1zKnUseD1pKmYtcyphLFQ9bCp2LWMqZCxOPWwqbS1oKmQsQz1sKmctcCpkLGs9YyptLWgqdixMPWMqZy1wKnYsQT1oKmctcCptLE89eSpBLWIqTCt3KmsrRSpDLVMqTit4KlQ7cmV0dXJuIE8/KE89MS9PLGVbMF09KHUqQS1hKkwrZiprKSpPLGVbMV09KGEqQy1vKkEtZipOKSpPLGVbMl09KG8qTC11KkMrZipUKSpPLGVbM109KGkqTC1yKkEtcyprKSpPLGVbNF09KG4qQS1pKkMrcypOKSpPLGVbNV09KHIqQy1uKkwtcypUKSpPLGVbNl09KHYqeC1tKlMrZypFKSpPLGVbN109KG0qdy1kKngtZypiKSpPLGVbOF09KGQqUy12KncrZyp5KSpPLGUpOm51bGx9LGMuc3RyPWZ1bmN0aW9uKGUpe3JldHVyblwibWF0MyhcIitlWzBdK1wiLCBcIitlWzFdK1wiLCBcIitlWzJdK1wiLCBcIitlWzNdK1wiLCBcIitlWzRdK1wiLCBcIitlWzVdK1wiLCBcIitlWzZdK1wiLCBcIitlWzddK1wiLCBcIitlWzhdK1wiKVwifSxjLmZyb2I9ZnVuY3Rpb24oZSl7cmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyhlWzBdLDIpK01hdGgucG93KGVbMV0sMikrTWF0aC5wb3coZVsyXSwyKStNYXRoLnBvdyhlWzNdLDIpK01hdGgucG93KGVbNF0sMikrTWF0aC5wb3coZVs1XSwyKStNYXRoLnBvdyhlWzZdLDIpK01hdGgucG93KGVbN10sMikrTWF0aC5wb3coZVs4XSwyKSl9LHR5cGVvZiBlIT1cInVuZGVmaW5lZFwiJiYoZS5tYXQzPWMpO3ZhciBoPXt9O2guY3JlYXRlPWZ1bmN0aW9uKCl7dmFyIGU9bmV3IG4oMTYpO3JldHVybiBlWzBdPTEsZVsxXT0wLGVbMl09MCxlWzNdPTAsZVs0XT0wLGVbNV09MSxlWzZdPTAsZVs3XT0wLGVbOF09MCxlWzldPTAsZVsxMF09MSxlWzExXT0wLGVbMTJdPTAsZVsxM109MCxlWzE0XT0wLGVbMTVdPTEsZX0saC5jbG9uZT1mdW5jdGlvbihlKXt2YXIgdD1uZXcgbigxNik7cmV0dXJuIHRbMF09ZVswXSx0WzFdPWVbMV0sdFsyXT1lWzJdLHRbM109ZVszXSx0WzRdPWVbNF0sdFs1XT1lWzVdLHRbNl09ZVs2XSx0WzddPWVbN10sdFs4XT1lWzhdLHRbOV09ZVs5XSx0WzEwXT1lWzEwXSx0WzExXT1lWzExXSx0WzEyXT1lWzEyXSx0WzEzXT1lWzEzXSx0WzE0XT1lWzE0XSx0WzE1XT1lWzE1XSx0fSxoLmNvcHk9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZVswXT10WzBdLGVbMV09dFsxXSxlWzJdPXRbMl0sZVszXT10WzNdLGVbNF09dFs0XSxlWzVdPXRbNV0sZVs2XT10WzZdLGVbN109dFs3XSxlWzhdPXRbOF0sZVs5XT10WzldLGVbMTBdPXRbMTBdLGVbMTFdPXRbMTFdLGVbMTJdPXRbMTJdLGVbMTNdPXRbMTNdLGVbMTRdPXRbMTRdLGVbMTVdPXRbMTVdLGV9LGguaWRlbnRpdHk9ZnVuY3Rpb24oZSl7cmV0dXJuIGVbMF09MSxlWzFdPTAsZVsyXT0wLGVbM109MCxlWzRdPTAsZVs1XT0xLGVbNl09MCxlWzddPTAsZVs4XT0wLGVbOV09MCxlWzEwXT0xLGVbMTFdPTAsZVsxMl09MCxlWzEzXT0wLGVbMTRdPTAsZVsxNV09MSxlfSxoLnRyYW5zcG9zZT1mdW5jdGlvbihlLHQpe2lmKGU9PT10KXt2YXIgbj10WzFdLHI9dFsyXSxpPXRbM10scz10WzZdLG89dFs3XSx1PXRbMTFdO2VbMV09dFs0XSxlWzJdPXRbOF0sZVszXT10WzEyXSxlWzRdPW4sZVs2XT10WzldLGVbN109dFsxM10sZVs4XT1yLGVbOV09cyxlWzExXT10WzE0XSxlWzEyXT1pLGVbMTNdPW8sZVsxNF09dX1lbHNlIGVbMF09dFswXSxlWzFdPXRbNF0sZVsyXT10WzhdLGVbM109dFsxMl0sZVs0XT10WzFdLGVbNV09dFs1XSxlWzZdPXRbOV0sZVs3XT10WzEzXSxlWzhdPXRbMl0sZVs5XT10WzZdLGVbMTBdPXRbMTBdLGVbMTFdPXRbMTRdLGVbMTJdPXRbM10sZVsxM109dFs3XSxlWzE0XT10WzExXSxlWzE1XT10WzE1XTtyZXR1cm4gZX0saC5pbnZlcnQ9ZnVuY3Rpb24oZSx0KXt2YXIgbj10WzBdLHI9dFsxXSxpPXRbMl0scz10WzNdLG89dFs0XSx1PXRbNV0sYT10WzZdLGY9dFs3XSxsPXRbOF0sYz10WzldLGg9dFsxMF0scD10WzExXSxkPXRbMTJdLHY9dFsxM10sbT10WzE0XSxnPXRbMTVdLHk9bip1LXIqbyxiPW4qYS1pKm8sdz1uKmYtcypvLEU9ciphLWkqdSxTPXIqZi1zKnUseD1pKmYtcyphLFQ9bCp2LWMqZCxOPWwqbS1oKmQsQz1sKmctcCpkLGs9YyptLWgqdixMPWMqZy1wKnYsQT1oKmctcCptLE89eSpBLWIqTCt3KmsrRSpDLVMqTit4KlQ7cmV0dXJuIE8/KE89MS9PLGVbMF09KHUqQS1hKkwrZiprKSpPLGVbMV09KGkqTC1yKkEtcyprKSpPLGVbMl09KHYqeC1tKlMrZypFKSpPLGVbM109KGgqUy1jKngtcCpFKSpPLGVbNF09KGEqQy1vKkEtZipOKSpPLGVbNV09KG4qQS1pKkMrcypOKSpPLGVbNl09KG0qdy1kKngtZypiKSpPLGVbN109KGwqeC1oKncrcCpiKSpPLGVbOF09KG8qTC11KkMrZipUKSpPLGVbOV09KHIqQy1uKkwtcypUKSpPLGVbMTBdPShkKlMtdip3K2cqeSkqTyxlWzExXT0oYyp3LWwqUy1wKnkpKk8sZVsxMl09KHUqTi1vKmstYSpUKSpPLGVbMTNdPShuKmstcipOK2kqVCkqTyxlWzE0XT0odipiLWQqRS1tKnkpKk8sZVsxNV09KGwqRS1jKmIraCp5KSpPLGUpOm51bGx9LGguYWRqb2ludD1mdW5jdGlvbihlLHQpe3ZhciBuPXRbMF0scj10WzFdLGk9dFsyXSxzPXRbM10sbz10WzRdLHU9dFs1XSxhPXRbNl0sZj10WzddLGw9dFs4XSxjPXRbOV0saD10WzEwXSxwPXRbMTFdLGQ9dFsxMl0sdj10WzEzXSxtPXRbMTRdLGc9dFsxNV07cmV0dXJuIGVbMF09dSooaCpnLXAqbSktYyooYSpnLWYqbSkrdiooYSpwLWYqaCksZVsxXT0tKHIqKGgqZy1wKm0pLWMqKGkqZy1zKm0pK3YqKGkqcC1zKmgpKSxlWzJdPXIqKGEqZy1mKm0pLXUqKGkqZy1zKm0pK3YqKGkqZi1zKmEpLGVbM109LShyKihhKnAtZipoKS11KihpKnAtcypoKStjKihpKmYtcyphKSksZVs0XT0tKG8qKGgqZy1wKm0pLWwqKGEqZy1mKm0pK2QqKGEqcC1mKmgpKSxlWzVdPW4qKGgqZy1wKm0pLWwqKGkqZy1zKm0pK2QqKGkqcC1zKmgpLGVbNl09LShuKihhKmctZiptKS1vKihpKmctcyptKStkKihpKmYtcyphKSksZVs3XT1uKihhKnAtZipoKS1vKihpKnAtcypoKStsKihpKmYtcyphKSxlWzhdPW8qKGMqZy1wKnYpLWwqKHUqZy1mKnYpK2QqKHUqcC1mKmMpLGVbOV09LShuKihjKmctcCp2KS1sKihyKmctcyp2KStkKihyKnAtcypjKSksZVsxMF09bioodSpnLWYqdiktbyoocipnLXMqdikrZCoocipmLXMqdSksZVsxMV09LShuKih1KnAtZipjKS1vKihyKnAtcypjKStsKihyKmYtcyp1KSksZVsxMl09LShvKihjKm0taCp2KS1sKih1Km0tYSp2KStkKih1KmgtYSpjKSksZVsxM109biooYyptLWgqdiktbCoociptLWkqdikrZCoocipoLWkqYyksZVsxNF09LShuKih1Km0tYSp2KS1vKihyKm0taSp2KStkKihyKmEtaSp1KSksZVsxNV09bioodSpoLWEqYyktbyoocipoLWkqYykrbCoociphLWkqdSksZX0saC5kZXRlcm1pbmFudD1mdW5jdGlvbihlKXt2YXIgdD1lWzBdLG49ZVsxXSxyPWVbMl0saT1lWzNdLHM9ZVs0XSxvPWVbNV0sdT1lWzZdLGE9ZVs3XSxmPWVbOF0sbD1lWzldLGM9ZVsxMF0saD1lWzExXSxwPWVbMTJdLGQ9ZVsxM10sdj1lWzE0XSxtPWVbMTVdLGc9dCpvLW4qcyx5PXQqdS1yKnMsYj10KmEtaSpzLHc9bip1LXIqbyxFPW4qYS1pKm8sUz1yKmEtaSp1LHg9ZipkLWwqcCxUPWYqdi1jKnAsTj1mKm0taCpwLEM9bCp2LWMqZCxrPWwqbS1oKmQsTD1jKm0taCp2O3JldHVybiBnKkwteSprK2IqQyt3Kk4tRSpUK1MqeH0saC5tdWx0aXBseT1mdW5jdGlvbihlLHQsbil7dmFyIHI9dFswXSxpPXRbMV0scz10WzJdLG89dFszXSx1PXRbNF0sYT10WzVdLGY9dFs2XSxsPXRbN10sYz10WzhdLGg9dFs5XSxwPXRbMTBdLGQ9dFsxMV0sdj10WzEyXSxtPXRbMTNdLGc9dFsxNF0seT10WzE1XSxiPW5bMF0sdz1uWzFdLEU9blsyXSxTPW5bM107cmV0dXJuIGVbMF09YipyK3cqdStFKmMrUyp2LGVbMV09YippK3cqYStFKmgrUyptLGVbMl09YipzK3cqZitFKnArUypnLGVbM109YipvK3cqbCtFKmQrUyp5LGI9bls0XSx3PW5bNV0sRT1uWzZdLFM9bls3XSxlWzRdPWIqcit3KnUrRSpjK1MqdixlWzVdPWIqaSt3KmErRSpoK1MqbSxlWzZdPWIqcyt3KmYrRSpwK1MqZyxlWzddPWIqbyt3KmwrRSpkK1MqeSxiPW5bOF0sdz1uWzldLEU9blsxMF0sUz1uWzExXSxlWzhdPWIqcit3KnUrRSpjK1MqdixlWzldPWIqaSt3KmErRSpoK1MqbSxlWzEwXT1iKnMrdypmK0UqcCtTKmcsZVsxMV09YipvK3cqbCtFKmQrUyp5LGI9blsxMl0sdz1uWzEzXSxFPW5bMTRdLFM9blsxNV0sZVsxMl09YipyK3cqdStFKmMrUyp2LGVbMTNdPWIqaSt3KmErRSpoK1MqbSxlWzE0XT1iKnMrdypmK0UqcCtTKmcsZVsxNV09YipvK3cqbCtFKmQrUyp5LGV9LGgubXVsPWgubXVsdGlwbHksaC50cmFuc2xhdGU9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPW5bMF0saT1uWzFdLHM9blsyXSxvLHUsYSxmLGwsYyxoLHAsZCx2LG0sZztyZXR1cm4gdD09PWU/KGVbMTJdPXRbMF0qcit0WzRdKmkrdFs4XSpzK3RbMTJdLGVbMTNdPXRbMV0qcit0WzVdKmkrdFs5XSpzK3RbMTNdLGVbMTRdPXRbMl0qcit0WzZdKmkrdFsxMF0qcyt0WzE0XSxlWzE1XT10WzNdKnIrdFs3XSppK3RbMTFdKnMrdFsxNV0pOihvPXRbMF0sdT10WzFdLGE9dFsyXSxmPXRbM10sbD10WzRdLGM9dFs1XSxoPXRbNl0scD10WzddLGQ9dFs4XSx2PXRbOV0sbT10WzEwXSxnPXRbMTFdLGVbMF09byxlWzFdPXUsZVsyXT1hLGVbM109ZixlWzRdPWwsZVs1XT1jLGVbNl09aCxlWzddPXAsZVs4XT1kLGVbOV09dixlWzEwXT1tLGVbMTFdPWcsZVsxMl09bypyK2wqaStkKnMrdFsxMl0sZVsxM109dSpyK2MqaSt2KnMrdFsxM10sZVsxNF09YSpyK2gqaSttKnMrdFsxNF0sZVsxNV09ZipyK3AqaStnKnMrdFsxNV0pLGV9LGguc2NhbGU9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPW5bMF0saT1uWzFdLHM9blsyXTtyZXR1cm4gZVswXT10WzBdKnIsZVsxXT10WzFdKnIsZVsyXT10WzJdKnIsZVszXT10WzNdKnIsZVs0XT10WzRdKmksZVs1XT10WzVdKmksZVs2XT10WzZdKmksZVs3XT10WzddKmksZVs4XT10WzhdKnMsZVs5XT10WzldKnMsZVsxMF09dFsxMF0qcyxlWzExXT10WzExXSpzLGVbMTJdPXRbMTJdLGVbMTNdPXRbMTNdLGVbMTRdPXRbMTRdLGVbMTVdPXRbMTVdLGV9LGgucm90YXRlPWZ1bmN0aW9uKGUsbixyLGkpe3ZhciBzPWlbMF0sbz1pWzFdLHU9aVsyXSxhPU1hdGguc3FydChzKnMrbypvK3UqdSksZixsLGMsaCxwLGQsdixtLGcseSxiLHcsRSxTLHgsVCxOLEMsayxMLEEsTyxNLF87cmV0dXJuIE1hdGguYWJzKGEpPHQ/bnVsbDooYT0xL2Escyo9YSxvKj1hLHUqPWEsZj1NYXRoLnNpbihyKSxsPU1hdGguY29zKHIpLGM9MS1sLGg9blswXSxwPW5bMV0sZD1uWzJdLHY9blszXSxtPW5bNF0sZz1uWzVdLHk9bls2XSxiPW5bN10sdz1uWzhdLEU9bls5XSxTPW5bMTBdLHg9blsxMV0sVD1zKnMqYytsLE49bypzKmMrdSpmLEM9dSpzKmMtbypmLGs9cypvKmMtdSpmLEw9bypvKmMrbCxBPXUqbypjK3MqZixPPXMqdSpjK28qZixNPW8qdSpjLXMqZixfPXUqdSpjK2wsZVswXT1oKlQrbSpOK3cqQyxlWzFdPXAqVCtnKk4rRSpDLGVbMl09ZCpUK3kqTitTKkMsZVszXT12KlQrYipOK3gqQyxlWzRdPWgqayttKkwrdypBLGVbNV09cCprK2cqTCtFKkEsZVs2XT1kKmsreSpMK1MqQSxlWzddPXYqaytiKkwreCpBLGVbOF09aCpPK20qTSt3Kl8sZVs5XT1wKk8rZypNK0UqXyxlWzEwXT1kKk8reSpNK1MqXyxlWzExXT12Kk8rYipNK3gqXyxuIT09ZSYmKGVbMTJdPW5bMTJdLGVbMTNdPW5bMTNdLGVbMTRdPW5bMTRdLGVbMTVdPW5bMTVdKSxlKX0saC5yb3RhdGVYPWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj1NYXRoLnNpbihuKSxpPU1hdGguY29zKG4pLHM9dFs0XSxvPXRbNV0sdT10WzZdLGE9dFs3XSxmPXRbOF0sbD10WzldLGM9dFsxMF0saD10WzExXTtyZXR1cm4gdCE9PWUmJihlWzBdPXRbMF0sZVsxXT10WzFdLGVbMl09dFsyXSxlWzNdPXRbM10sZVsxMl09dFsxMl0sZVsxM109dFsxM10sZVsxNF09dFsxNF0sZVsxNV09dFsxNV0pLGVbNF09cyppK2YqcixlWzVdPW8qaStsKnIsZVs2XT11KmkrYypyLGVbN109YSppK2gqcixlWzhdPWYqaS1zKnIsZVs5XT1sKmktbypyLGVbMTBdPWMqaS11KnIsZVsxMV09aCppLWEqcixlfSxoLnJvdGF0ZVk9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPU1hdGguc2luKG4pLGk9TWF0aC5jb3Mobikscz10WzBdLG89dFsxXSx1PXRbMl0sYT10WzNdLGY9dFs4XSxsPXRbOV0sYz10WzEwXSxoPXRbMTFdO3JldHVybiB0IT09ZSYmKGVbNF09dFs0XSxlWzVdPXRbNV0sZVs2XT10WzZdLGVbN109dFs3XSxlWzEyXT10WzEyXSxlWzEzXT10WzEzXSxlWzE0XT10WzE0XSxlWzE1XT10WzE1XSksZVswXT1zKmktZipyLGVbMV09byppLWwqcixlWzJdPXUqaS1jKnIsZVszXT1hKmktaCpyLGVbOF09cypyK2YqaSxlWzldPW8qcitsKmksZVsxMF09dSpyK2MqaSxlWzExXT1hKnIraCppLGV9LGgucm90YXRlWj1mdW5jdGlvbihlLHQsbil7dmFyIHI9TWF0aC5zaW4obiksaT1NYXRoLmNvcyhuKSxzPXRbMF0sbz10WzFdLHU9dFsyXSxhPXRbM10sZj10WzRdLGw9dFs1XSxjPXRbNl0saD10WzddO3JldHVybiB0IT09ZSYmKGVbOF09dFs4XSxlWzldPXRbOV0sZVsxMF09dFsxMF0sZVsxMV09dFsxMV0sZVsxMl09dFsxMl0sZVsxM109dFsxM10sZVsxNF09dFsxNF0sZVsxNV09dFsxNV0pLGVbMF09cyppK2YqcixlWzFdPW8qaStsKnIsZVsyXT11KmkrYypyLGVbM109YSppK2gqcixlWzRdPWYqaS1zKnIsZVs1XT1sKmktbypyLGVbNl09YyppLXUqcixlWzddPWgqaS1hKnIsZX0saC5mcm9tUm90YXRpb25UcmFuc2xhdGlvbj1mdW5jdGlvbihlLHQsbil7dmFyIHI9dFswXSxpPXRbMV0scz10WzJdLG89dFszXSx1PXIrcixhPWkraSxmPXMrcyxsPXIqdSxjPXIqYSxoPXIqZixwPWkqYSxkPWkqZix2PXMqZixtPW8qdSxnPW8qYSx5PW8qZjtyZXR1cm4gZVswXT0xLShwK3YpLGVbMV09Yyt5LGVbMl09aC1nLGVbM109MCxlWzRdPWMteSxlWzVdPTEtKGwrdiksZVs2XT1kK20sZVs3XT0wLGVbOF09aCtnLGVbOV09ZC1tLGVbMTBdPTEtKGwrcCksZVsxMV09MCxlWzEyXT1uWzBdLGVbMTNdPW5bMV0sZVsxNF09blsyXSxlWzE1XT0xLGV9LGguZnJvbVF1YXQ9ZnVuY3Rpb24oZSx0KXt2YXIgbj10WzBdLHI9dFsxXSxpPXRbMl0scz10WzNdLG89bituLHU9cityLGE9aStpLGY9bipvLGw9cipvLGM9cip1LGg9aSpvLHA9aSp1LGQ9aSphLHY9cypvLG09cyp1LGc9cyphO3JldHVybiBlWzBdPTEtYy1kLGVbMV09bCtnLGVbMl09aC1tLGVbM109MCxlWzRdPWwtZyxlWzVdPTEtZi1kLGVbNl09cCt2LGVbN109MCxlWzhdPWgrbSxlWzldPXAtdixlWzEwXT0xLWYtYyxlWzExXT0wLGVbMTJdPTAsZVsxM109MCxlWzE0XT0wLGVbMTVdPTEsZX0saC5mcnVzdHVtPWZ1bmN0aW9uKGUsdCxuLHIsaSxzLG8pe3ZhciB1PTEvKG4tdCksYT0xLyhpLXIpLGY9MS8ocy1vKTtyZXR1cm4gZVswXT1zKjIqdSxlWzFdPTAsZVsyXT0wLGVbM109MCxlWzRdPTAsZVs1XT1zKjIqYSxlWzZdPTAsZVs3XT0wLGVbOF09KG4rdCkqdSxlWzldPShpK3IpKmEsZVsxMF09KG8rcykqZixlWzExXT0tMSxlWzEyXT0wLGVbMTNdPTAsZVsxNF09bypzKjIqZixlWzE1XT0wLGV9LGgucGVyc3BlY3RpdmU9ZnVuY3Rpb24oZSx0LG4scixpKXt2YXIgcz0xL01hdGgudGFuKHQvMiksbz0xLyhyLWkpO3JldHVybiBlWzBdPXMvbixlWzFdPTAsZVsyXT0wLGVbM109MCxlWzRdPTAsZVs1XT1zLGVbNl09MCxlWzddPTAsZVs4XT0wLGVbOV09MCxlWzEwXT0oaStyKSpvLGVbMTFdPS0xLGVbMTJdPTAsZVsxM109MCxlWzE0XT0yKmkqcipvLGVbMTVdPTAsZX0saC5vcnRobz1mdW5jdGlvbihlLHQsbixyLGkscyxvKXt2YXIgdT0xLyh0LW4pLGE9MS8oci1pKSxmPTEvKHMtbyk7cmV0dXJuIGVbMF09LTIqdSxlWzFdPTAsZVsyXT0wLGVbM109MCxlWzRdPTAsZVs1XT0tMiphLGVbNl09MCxlWzddPTAsZVs4XT0wLGVbOV09MCxlWzEwXT0yKmYsZVsxMV09MCxlWzEyXT0odCtuKSp1LGVbMTNdPShpK3IpKmEsZVsxNF09KG8rcykqZixlWzE1XT0xLGV9LGgubG9va0F0PWZ1bmN0aW9uKGUsbixyLGkpe3ZhciBzLG8sdSxhLGYsbCxjLHAsZCx2LG09blswXSxnPW5bMV0seT1uWzJdLGI9aVswXSx3PWlbMV0sRT1pWzJdLFM9clswXSx4PXJbMV0sVD1yWzJdO3JldHVybiBNYXRoLmFicyhtLVMpPHQmJk1hdGguYWJzKGcteCk8dCYmTWF0aC5hYnMoeS1UKTx0P2guaWRlbnRpdHkoZSk6KGM9bS1TLHA9Zy14LGQ9eS1ULHY9MS9NYXRoLnNxcnQoYypjK3AqcCtkKmQpLGMqPXYscCo9dixkKj12LHM9dypkLUUqcCxvPUUqYy1iKmQsdT1iKnAtdypjLHY9TWF0aC5zcXJ0KHMqcytvKm8rdSp1KSx2Pyh2PTEvdixzKj12LG8qPXYsdSo9dik6KHM9MCxvPTAsdT0wKSxhPXAqdS1kKm8sZj1kKnMtYyp1LGw9YypvLXAqcyx2PU1hdGguc3FydChhKmErZipmK2wqbCksdj8odj0xL3YsYSo9dixmKj12LGwqPXYpOihhPTAsZj0wLGw9MCksZVswXT1zLGVbMV09YSxlWzJdPWMsZVszXT0wLGVbNF09byxlWzVdPWYsZVs2XT1wLGVbN109MCxlWzhdPXUsZVs5XT1sLGVbMTBdPWQsZVsxMV09MCxlWzEyXT0tKHMqbStvKmcrdSp5KSxlWzEzXT0tKGEqbStmKmcrbCp5KSxlWzE0XT0tKGMqbStwKmcrZCp5KSxlWzE1XT0xLGUpfSxoLnN0cj1mdW5jdGlvbihlKXtyZXR1cm5cIm1hdDQoXCIrZVswXStcIiwgXCIrZVsxXStcIiwgXCIrZVsyXStcIiwgXCIrZVszXStcIiwgXCIrZVs0XStcIiwgXCIrZVs1XStcIiwgXCIrZVs2XStcIiwgXCIrZVs3XStcIiwgXCIrZVs4XStcIiwgXCIrZVs5XStcIiwgXCIrZVsxMF0rXCIsIFwiK2VbMTFdK1wiLCBcIitlWzEyXStcIiwgXCIrZVsxM10rXCIsIFwiK2VbMTRdK1wiLCBcIitlWzE1XStcIilcIn0saC5mcm9iPWZ1bmN0aW9uKGUpe3JldHVybiBNYXRoLnNxcnQoTWF0aC5wb3coZVswXSwyKStNYXRoLnBvdyhlWzFdLDIpK01hdGgucG93KGVbMl0sMikrTWF0aC5wb3coZVszXSwyKStNYXRoLnBvdyhlWzRdLDIpK01hdGgucG93KGVbNV0sMikrTWF0aC5wb3coZVs2XSwyKStNYXRoLnBvdyhlWzZdLDIpK01hdGgucG93KGVbN10sMikrTWF0aC5wb3coZVs4XSwyKStNYXRoLnBvdyhlWzldLDIpK01hdGgucG93KGVbMTBdLDIpK01hdGgucG93KGVbMTFdLDIpK01hdGgucG93KGVbMTJdLDIpK01hdGgucG93KGVbMTNdLDIpK01hdGgucG93KGVbMTRdLDIpK01hdGgucG93KGVbMTVdLDIpKX0sdHlwZW9mIGUhPVwidW5kZWZpbmVkXCImJihlLm1hdDQ9aCk7dmFyIHA9e307cC5jcmVhdGU9ZnVuY3Rpb24oKXt2YXIgZT1uZXcgbig0KTtyZXR1cm4gZVswXT0wLGVbMV09MCxlWzJdPTAsZVszXT0xLGV9LHAucm90YXRpb25Ubz1mdW5jdGlvbigpe3ZhciBlPXUuY3JlYXRlKCksdD11LmZyb21WYWx1ZXMoMSwwLDApLG49dS5mcm9tVmFsdWVzKDAsMSwwKTtyZXR1cm4gZnVuY3Rpb24ocixpLHMpe3ZhciBvPXUuZG90KGkscyk7cmV0dXJuIG88LTAuOTk5OTk5Pyh1LmNyb3NzKGUsdCxpKSx1Lmxlbmd0aChlKTwxZS02JiZ1LmNyb3NzKGUsbixpKSx1Lm5vcm1hbGl6ZShlLGUpLHAuc2V0QXhpc0FuZ2xlKHIsZSxNYXRoLlBJKSxyKTpvPi45OTk5OTk/KHJbMF09MCxyWzFdPTAsclsyXT0wLHJbM109MSxyKToodS5jcm9zcyhlLGkscyksclswXT1lWzBdLHJbMV09ZVsxXSxyWzJdPWVbMl0sclszXT0xK28scC5ub3JtYWxpemUocixyKSl9fSgpLHAuc2V0QXhlcz1mdW5jdGlvbigpe3ZhciBlPWMuY3JlYXRlKCk7cmV0dXJuIGZ1bmN0aW9uKHQsbixyLGkpe3JldHVybiBlWzBdPXJbMF0sZVszXT1yWzFdLGVbNl09clsyXSxlWzFdPWlbMF0sZVs0XT1pWzFdLGVbN109aVsyXSxlWzJdPS1uWzBdLGVbNV09LW5bMV0sZVs4XT0tblsyXSxwLm5vcm1hbGl6ZSh0LHAuZnJvbU1hdDModCxlKSl9fSgpLHAuY2xvbmU9YS5jbG9uZSxwLmZyb21WYWx1ZXM9YS5mcm9tVmFsdWVzLHAuY29weT1hLmNvcHkscC5zZXQ9YS5zZXQscC5pZGVudGl0eT1mdW5jdGlvbihlKXtyZXR1cm4gZVswXT0wLGVbMV09MCxlWzJdPTAsZVszXT0xLGV9LHAuc2V0QXhpc0FuZ2xlPWZ1bmN0aW9uKGUsdCxuKXtuKj0uNTt2YXIgcj1NYXRoLnNpbihuKTtyZXR1cm4gZVswXT1yKnRbMF0sZVsxXT1yKnRbMV0sZVsyXT1yKnRbMl0sZVszXT1NYXRoLmNvcyhuKSxlfSxwLmFkZD1hLmFkZCxwLm11bHRpcGx5PWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10WzBdLGk9dFsxXSxzPXRbMl0sbz10WzNdLHU9blswXSxhPW5bMV0sZj1uWzJdLGw9blszXTtyZXR1cm4gZVswXT1yKmwrbyp1K2kqZi1zKmEsZVsxXT1pKmwrbyphK3MqdS1yKmYsZVsyXT1zKmwrbypmK3IqYS1pKnUsZVszXT1vKmwtcip1LWkqYS1zKmYsZX0scC5tdWw9cC5tdWx0aXBseSxwLnNjYWxlPWEuc2NhbGUscC5yb3RhdGVYPWZ1bmN0aW9uKGUsdCxuKXtuKj0uNTt2YXIgcj10WzBdLGk9dFsxXSxzPXRbMl0sbz10WzNdLHU9TWF0aC5zaW4obiksYT1NYXRoLmNvcyhuKTtyZXR1cm4gZVswXT1yKmErbyp1LGVbMV09aSphK3MqdSxlWzJdPXMqYS1pKnUsZVszXT1vKmEtcip1LGV9LHAucm90YXRlWT1mdW5jdGlvbihlLHQsbil7bio9LjU7dmFyIHI9dFswXSxpPXRbMV0scz10WzJdLG89dFszXSx1PU1hdGguc2luKG4pLGE9TWF0aC5jb3Mobik7cmV0dXJuIGVbMF09ciphLXMqdSxlWzFdPWkqYStvKnUsZVsyXT1zKmErcip1LGVbM109byphLWkqdSxlfSxwLnJvdGF0ZVo9ZnVuY3Rpb24oZSx0LG4pe24qPS41O3ZhciByPXRbMF0saT10WzFdLHM9dFsyXSxvPXRbM10sdT1NYXRoLnNpbihuKSxhPU1hdGguY29zKG4pO3JldHVybiBlWzBdPXIqYStpKnUsZVsxXT1pKmEtcip1LGVbMl09cyphK28qdSxlWzNdPW8qYS1zKnUsZX0scC5jYWxjdWxhdGVXPWZ1bmN0aW9uKGUsdCl7dmFyIG49dFswXSxyPXRbMV0saT10WzJdO3JldHVybiBlWzBdPW4sZVsxXT1yLGVbMl09aSxlWzNdPS1NYXRoLnNxcnQoTWF0aC5hYnMoMS1uKm4tcipyLWkqaSkpLGV9LHAuZG90PWEuZG90LHAubGVycD1hLmxlcnAscC5zbGVycD1mdW5jdGlvbihlLHQsbixyKXt2YXIgaT10WzBdLHM9dFsxXSxvPXRbMl0sdT10WzNdLGE9blswXSxmPW5bMV0sbD1uWzJdLGM9blszXSxoLHAsZCx2LG07cmV0dXJuIHA9aSphK3MqZitvKmwrdSpjLHA8MCYmKHA9LXAsYT0tYSxmPS1mLGw9LWwsYz0tYyksMS1wPjFlLTY/KGg9TWF0aC5hY29zKHApLGQ9TWF0aC5zaW4oaCksdj1NYXRoLnNpbigoMS1yKSpoKS9kLG09TWF0aC5zaW4ocipoKS9kKToodj0xLXIsbT1yKSxlWzBdPXYqaSttKmEsZVsxXT12KnMrbSpmLGVbMl09dipvK20qbCxlWzNdPXYqdSttKmMsZX0scC5pbnZlcnQ9ZnVuY3Rpb24oZSx0KXt2YXIgbj10WzBdLHI9dFsxXSxpPXRbMl0scz10WzNdLG89bipuK3IqcitpKmkrcypzLHU9bz8xL286MDtyZXR1cm4gZVswXT0tbip1LGVbMV09LXIqdSxlWzJdPS1pKnUsZVszXT1zKnUsZX0scC5jb25qdWdhdGU9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZVswXT0tdFswXSxlWzFdPS10WzFdLGVbMl09LXRbMl0sZVszXT10WzNdLGV9LHAubGVuZ3RoPWEubGVuZ3RoLHAubGVuPXAubGVuZ3RoLHAuc3F1YXJlZExlbmd0aD1hLnNxdWFyZWRMZW5ndGgscC5zcXJMZW49cC5zcXVhcmVkTGVuZ3RoLHAubm9ybWFsaXplPWEubm9ybWFsaXplLHAuZnJvbU1hdDM9ZnVuY3Rpb24oZSx0KXt2YXIgbj10WzBdK3RbNF0rdFs4XSxyO2lmKG4+MClyPU1hdGguc3FydChuKzEpLGVbM109LjUqcixyPS41L3IsZVswXT0odFs3XS10WzVdKSpyLGVbMV09KHRbMl0tdFs2XSkqcixlWzJdPSh0WzNdLXRbMV0pKnI7ZWxzZXt2YXIgaT0wO3RbNF0+dFswXSYmKGk9MSksdFs4XT50W2kqMytpXSYmKGk9Mik7dmFyIHM9KGkrMSklMyxvPShpKzIpJTM7cj1NYXRoLnNxcnQodFtpKjMraV0tdFtzKjMrc10tdFtvKjMrb10rMSksZVtpXT0uNSpyLHI9LjUvcixlWzNdPSh0W28qMytzXS10W3MqMytvXSkqcixlW3NdPSh0W3MqMytpXSt0W2kqMytzXSkqcixlW29dPSh0W28qMytpXSt0W2kqMytvXSkqcn1yZXR1cm4gZX0scC5zdHI9ZnVuY3Rpb24oZSl7cmV0dXJuXCJxdWF0KFwiK2VbMF0rXCIsIFwiK2VbMV0rXCIsIFwiK2VbMl0rXCIsIFwiK2VbM10rXCIpXCJ9LHR5cGVvZiBlIT1cInVuZGVmaW5lZFwiJiYoZS5xdWF0PXApfSh0LmV4cG9ydHMpfSkodGhpcyk7XG4iLCIvKmdsb2JhbHMgYW5ndWxhciovXG5cbid1c2Ugc3RyaWN0JztcblxucmVxdWlyZSggJy4vY29tcG9uZW50V2lyZVNlZ21lbnQnICk7XG5cbmFuZ3VsYXIubW9kdWxlKFxuICAgICdtbXMuZGVzaWduVmlzdWFsaXphdGlvbi5jb21wb25lbnRXaXJlJywgW1xuICAgICAgICAnbW1zLmRlc2lnblZpc3VhbGl6YXRpb24uY29tcG9uZW50V2lyZS5zZWdtZW50J1xuICAgIF1cbilcbiAgICAuY29udHJvbGxlciggJ0NvbXBvbmVudFdpcmVDb250cm9sbGVyJywgZnVuY3Rpb24gKCAkc2NvcGUgKSB7XG4gICAgICAgICRzY29wZS5nZXRTZWdtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBlbmRQb3NpdGlvbnMsXG4gICAgICAgICAgICAgICAgeDEsIHkxLCB4MiwgeTI7XG5cbiAgICAgICAgICAgIGVuZFBvc2l0aW9ucyA9ICRzY29wZS53aXJlLmdldEVuZFBvc2l0aW9ucygpO1xuXG4gICAgICAgICAgICB4MSA9IGVuZFBvc2l0aW9ucy54MTtcbiAgICAgICAgICAgIHgyID0gZW5kUG9zaXRpb25zLngyO1xuICAgICAgICAgICAgeTEgPSBlbmRQb3NpdGlvbnMueTE7XG4gICAgICAgICAgICB5MiA9IGVuZFBvc2l0aW9ucy55MjtcblxuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICBlbmRQb3NpdGlvbnNcbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUub25TZWdtZW50Q2xpY2sgPSBmdW5jdGlvbiAoIHdpcmUsIHNlZ21lbnQgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyggd2lyZSwgc2VnbWVudCApO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5zZWdtZW50cyA9ICRzY29wZS5nZXRTZWdtZW50cygpO1xuXG4gICAgfSApXG4gICAgLmRpcmVjdGl2ZShcbiAgICAgICAgJ2NvbXBvbmVudFdpcmUnLFxuXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzY29wZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnQ29tcG9uZW50V2lyZUNvbnRyb2xsZXInLFxuICAgICAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy9tbXNBcHAvdGVtcGxhdGVzL2NvbXBvbmVudFdpcmUuaHRtbCcsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVOYW1lc3BhY2U6ICdTVkcnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4pOyIsIi8qZ2xvYmFscyBhbmd1bGFyKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5hbmd1bGFyLm1vZHVsZShcbiAgICAnbW1zLmRlc2lnblZpc3VhbGl6YXRpb24uY29tcG9uZW50V2lyZS5zZWdtZW50JywgW11cbilcblxuLmRpcmVjdGl2ZShcbiAgICAnY29tcG9uZW50V2lyZVNlZ21lbnQnLFxuXG4gICAgZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL21tc0FwcC90ZW1wbGF0ZXMvY29tcG9uZW50V2lyZVNlZ21lbnQuaHRtbCcsXG4gICAgICAgICAgICB0ZW1wbGF0ZU5hbWVzcGFjZTogJ1NWRydcbiAgICAgICAgfTtcbiAgICB9XG4pOyIsIi8qZ2xvYmFscyBhbmd1bGFyLCAkKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBNb3ZlIHRoaXMgdG8gR01FIGV2ZW50dWFsbHlcblxucmVxdWlyZSggJy4uL2RyYXdpbmdDYW52YXMvZHJhd2luZ0NhbnZhcy5qcycgKTtcblxuYW5ndWxhci5tb2R1bGUoICdtbXMuZGVzaWduVmlzdWFsaXphdGlvbi5kaWFncmFtQ29udGFpbmVyJywgW1xuICAgICdtbXMuZGVzaWduVmlzdWFsaXphdGlvbi5kcmF3aW5nQ2FudmFzJyxcbiAgICAncGFuem9vbScsXG4gICAgJ3Bhbnpvb213aWRnZXQnXG5dIClcbiAgICAuY29udHJvbGxlciggJ0RpYWdyYW1Db250YWluZXJDb250cm9sbGVyJywgW1xuICAgICAgICAnJHNjb3BlJyxcbiAgICAgICAgJ1Bhblpvb21TZXJ2aWNlJyxcbiAgICAgICAgZnVuY3Rpb24gKCAkc2NvcGUsIFBhblpvb21TZXJ2aWNlICkge1xuXG4gICAgICAgICAgICB2YXIgY29tcGlsZWREaXJlY3RpdmVzO1xuXG4gICAgICAgICAgICBjb21waWxlZERpcmVjdGl2ZXMgPSB7fTtcblxuICAgICAgICAgICAgJHNjb3BlLmRpYWdyYW0uc3RhdGUgPSAkc2NvcGUuZGlhZ3JhbS5zdGF0ZSB8fCB7fTtcbiAgICAgICAgICAgICRzY29wZS5kaWFncmFtLnN0YXRlLnNlbGVjdGVkQ29tcG9uZW50SWRzID0gJHNjb3BlLmRpYWdyYW0uc3RhdGUuc2VsZWN0ZWRDb21wb25lbnRJZHMgfHwgW107XG5cbiAgICAgICAgICAgICRzY29wZS5kaWFncmFtLmNvbmZpZyA9ICRzY29wZS5kaWFncmFtLmNvbmZpZyB8fCB7fTtcblxuICAgICAgICAgICAgJHNjb3BlLnBhbnpvb21JZCA9ICdwYW56b29tSWQnOyAvL3Njb3BlLmlkICsgJy1wYW56b29tZWQnO1xuXG4gICAgICAgICAgICAkc2NvcGUuem9vbUxldmVsID0gNDtcblxuICAgICAgICAgICAgJHNjb3BlLnBhbnpvb21Nb2RlbCA9IHt9OyAvLyBhbHdheXMgcGFzcyBlbXB0eSBvYmplY3RcblxuICAgICAgICAgICAgJHNjb3BlLnBhbnpvb21Db25maWcgPSB7XG4gICAgICAgICAgICAgICAgem9vbUxldmVsczogMTAsXG4gICAgICAgICAgICAgICAgbmV1dHJhbFpvb21MZXZlbDogJHNjb3BlLnpvb21MZXZlbCxcbiAgICAgICAgICAgICAgICBzY2FsZVBlclpvb21MZXZlbDogMS4yNSxcbiAgICAgICAgICAgICAgICBmcmljdGlvbjogNTAsXG4gICAgICAgICAgICAgICAgaGFsdFNwZWVkOiA1MCxcblxuICAgICAgICAgICAgICAgIG1vZGVsQ2hhbmdlZENhbGxiYWNrOiBmdW5jdGlvbiAoIHZhbCApIHtcbiAgICAgICAgICAgICAgICAgICAgUGFuWm9vbVNlcnZpY2UuZ2V0QVBJKCAkc2NvcGUucGFuem9vbUlkIClcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKCBmdW5jdGlvbiAoIGFwaSApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0b3BMZWZ0Q29ybmVyLCBib3R0b21SaWdodENvcm5lcjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS56b29tTGV2ZWwgPSB2YWwuem9vbUxldmVsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wTGVmdENvcm5lciA9IGFwaS5nZXRNb2RlbFBvc2l0aW9uKCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9ICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3R0b21SaWdodENvcm5lciA9IGFwaS5nZXRNb2RlbFBvc2l0aW9uKCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6ICRzY29wZS5jYW52YXNXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogJHNjb3BlLmNhbnZhc0hlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS52aXNpYmxlQXJlYSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wOiB0b3BMZWZ0Q29ybmVyLnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IHRvcExlZnRDb3JuZXIueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQ6IGJvdHRvbVJpZ2h0Q29ybmVyLngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvdHRvbTogYm90dG9tUmlnaHRDb3JuZXIueVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gKTtcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICRzY29wZS5nZXRDc3NDbGFzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3pvb20tbGV2ZWwtJyArICRzY29wZS56b29tTGV2ZWw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmdldFZpc2libGVBcmVhID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkc2NvcGUudmlzaWJsZUFyZWE7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmdldElkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkc2NvcGUuaWQ7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmdldERpYWdyYW0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRzY29wZS5kaWFncmFtO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5nZXRab29tTGV2ZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRzY29wZS56b29tTGV2ZWw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmdldENvbXBpbGVkRGlyZWN0aXZlID0gZnVuY3Rpb24gKCBkaXJlY3RpdmUgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbXBpbGVkRGlyZWN0aXZlc1sgZGlyZWN0aXZlIF07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLnNldENvbXBpbGVkRGlyZWN0aXZlID0gZnVuY3Rpb24gKCBkaXJlY3RpdmUsIGNvbXBpbGVkRGlyZWN0aXZlICkge1xuICAgICAgICAgICAgICAgIGNvbXBpbGVkRGlyZWN0aXZlc1sgZGlyZWN0aXZlIF0gPSBjb21waWxlZERpcmVjdGl2ZTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuaXNFZGl0YWJsZSA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgICAgICRzY29wZS5kaWFncmFtLmNvbmZpZyA9ICRzY29wZS5kaWFncmFtLmNvbmZpZyB8fCB7fTtcblxuICAgICAgICAgICAgICAgIHJldHVybiAkc2NvcGUuZGlhZ3JhbS5jb25maWcuZWRpdGFibGUgPT09IHRydWU7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmlzQ29tcG9uZW50U2VsZWN0ZWQgPSBmdW5jdGlvbiAoIGNvbXBvbmVudCApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHNjb3BlLmRpYWdyYW0uc3RhdGUuc2VsZWN0ZWRDb21wb25lbnRJZHMuaW5kZXhPZiggY29tcG9uZW50LmlkICkgPiAtMTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgfVxuICAgIF0gKVxuICAgIC5kaXJlY3RpdmUoICdkaWFncmFtQ29udGFpbmVyJywgW1xuICAgICAgICAnZGlhZ3JhbVNlcnZpY2UnLCAnJGxvZycsICdQYW5ab29tU2VydmljZScsXG4gICAgICAgIGZ1bmN0aW9uICggZGlhZ3JhbVNlcnZpY2UsICRsb2cgKSB7XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0RpYWdyYW1Db250YWluZXJDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgICAgICBpZDogJ0AnLFxuICAgICAgICAgICAgICAgICAgICBkaWFncmFtOiAnPSdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB0cmFuc2NsdWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL21tc0FwcC90ZW1wbGF0ZXMvZGlhZ3JhbUNvbnRhaW5lci5odG1sJyxcbiAgICAgICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoIHNjb3BlLCBlbGVtZW50ICkge1xuXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLmNhbnZhc1dpZHRoID0gJCggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgICAgICAub3V0ZXJXaWR0aCgpO1xuICAgICAgICAgICAgICAgICAgICBzY29wZS5jYW52YXNIZWlnaHQgPSAkKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5vdXRlckhlaWdodCgpO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudmlzaWJsZUFyZWEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQ6IHNjb3BlLmNhbnZhc1dpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgYm90dG9tOiBzY29wZS5jYW52YXNIZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAkbG9nLmRlYnVnKCAnSW4gY2FudmFzIGNvbnRhaW5lcicsIHNjb3BlLnZpc2libGVBcmVhICk7XG5cblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIF0gKTsiLCIvKmdsb2JhbHMgYW5ndWxhciovXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gTW92ZSB0aGlzIHRvIEdNRSBldmVudHVhbGx5XG5cbmFuZ3VsYXIubW9kdWxlKCAnbW1zLmRlc2lnblZpc3VhbGl6YXRpb24uZHJhd2luZ0NhbnZhcycsIFtdIClcbiAgICAuZGlyZWN0aXZlKCAnZHJhd2luZ0NhbnZhcycsXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgcmV0dXJuIHtcblxuICAgICAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiAnQCdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB0cmFuc2NsdWRlOiB0cnVlLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL21tc0FwcC90ZW1wbGF0ZXMvZHJhd2luZ0NhbnZhcy5odG1sJ1xuXG4gICAgICAgICAgICB9O1xuICAgICAgICB9ICk7IiwiLypnbG9iYWxzIGFuZ3VsYXIsIGZhYnJpYyovXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gTW92ZSB0aGlzIHRvIEdNRSBldmVudHVhbGx5XG5cbmFuZ3VsYXIubW9kdWxlKCAnbW1zLmRlc2lnblZpc3VhbGl6YXRpb24uZmFicmljQ2FudmFzJywgW10gKVxuICAgIC5jb250cm9sbGVyKCAnRmFicmljQ2FudmFzQ29udHJvbGxlcicsIGZ1bmN0aW9uICgpIHtcblxuICAgIH0gKVxuICAgIC5kaXJlY3RpdmUoICdmYWJyaWNDYW52YXMnLCBbXG4gICAgICAgICckbG9nJyxcbiAgICAgICAgJ2RpYWdyYW1TZXJ2aWNlJyxcbiAgICAgICAgZnVuY3Rpb24gKCAkbG9nLCBkaWFncmFtU2VydmljZSApIHtcblxuICAgICAgICAgICAgcmV0dXJuIHtcblxuICAgICAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnRmFicmljQ2FudmFzQ29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgcmVxdWlyZTogJ15kaWFncmFtQ29udGFpbmVyJyxcbiAgICAgICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvbW1zQXBwL3RlbXBsYXRlcy9mYWJyaWNDYW52YXMuaHRtbCcsXG4gICAgICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKCBzY29wZSwgZWxlbWVudCwgYXR0cmlidXRlcywgZGlhZ3JhbUNvbnRhaW5lckN0cmwgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlckRpYWdyYW07XG5cbiAgICAgICAgICAgICAgICAgICAgc2NvcGUuaWQgPSBkaWFncmFtQ29udGFpbmVyQ3RybC5nZXRJZCgpICsgJ2ZhYnJpYy1jYW52YXMnO1xuXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcyA9IG5ldyBmYWJyaWMuQ2FudmFzKCBzY29wZS5pZCApO1xuXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy5zZXRCYWNrZ3JvdW5kQ29sb3IoICdyZ2JhKDI1NSwgNzMsIDY0LCAwLjYpJyApO1xuXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlckRpYWdyYW0gPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggYW5ndWxhci5pc09iamVjdCggc2NvcGUuZGlhZ3JhbURhdGEgKSApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggYW5ndWxhci5pc0FycmF5KCBzY29wZS5kaWFncmFtRGF0YS5zeW1ib2xzICkgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKCBzY29wZS5kaWFncmFtRGF0YS5zeW1ib2xzLCBmdW5jdGlvbiAoIHN5bWJvbCApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlhZ3JhbVNlcnZpY2UuZ2V0U1ZHRm9yU3ltYm9sVHlwZSggc3ltYm9sLnR5cGUgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKCBmdW5jdGlvbiAoIG9iamVjdCApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3ZnT2JqZWN0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN2Z09iamVjdCA9IG9iamVjdC5zZXQoIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IHN5bWJvbC54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wOiBzeW1ib2wueSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZ2xlOiAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgIGNhbnZhcy5hZGQoc3ZnT2JqZWN0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVjdCA9IG5ldyBmYWJyaWMuUmVjdCgge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogMTAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wOiA1MCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAxMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IDEwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGw6ICdncmVlbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmdsZTogMjAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAxMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9ICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzLmFkZCggcmVjdCApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgICRsb2cuZGVidWcoJ2UnLCBzdmdPYmplY3QpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhcy5yZW5kZXJBbGwoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9ICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzLmNsZWFyKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVuZGVyQWxsKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICBzY29wZS4kd2F0Y2goIGRpYWdyYW1Db250YWluZXJDdHJsLmdldERpYWdyYW1EYXRhLCBmdW5jdGlvbiAoIHZhbHVlICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGxvZy5kZWJ1ZyggJ0RpYWdyYW1EYXRhIGlzICcsIHZhbHVlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5kaWFncmFtRGF0YSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyRGlhZ3JhbSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0gKTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIF0gKTsiLCIvKmdsb2JhbHMgYW5ndWxhciovXG5cbid1c2Ugc3RyaWN0JztcblxuYW5ndWxhci5tb2R1bGUoXG4gICAgJ21tcy5kZXNpZ25WaXN1YWxpemF0aW9uLnBvcnQnLCBbXVxuKVxuICAgIC5jb250cm9sbGVyKCAnUG9ydENvbnRyb2xsZXInLCBmdW5jdGlvbiAoICRzY29wZSApIHtcbiAgICAgICAgJHNjb3BlLmdldFBvcnRUcmFuc2Zvcm0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdHJhbnNmb3JtU3RyaW5nO1xuXG4gICAgICAgICAgICB0cmFuc2Zvcm1TdHJpbmcgPSAndHJhbnNsYXRlKCcgKyAkc2NvcGUucG9ydEluc3RhbmNlLnBvcnRTeW1ib2wueCArICcsJyArICRzY29wZS5wb3J0SW5zdGFuY2UucG9ydFN5bWJvbFxuICAgICAgICAgICAgICAgIC55ICsgJyknO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJhbnNmb3JtU3RyaW5nO1xuICAgICAgICB9O1xuICAgIH0gKVxuICAgIC5kaXJlY3RpdmUoXG4gICAgICAgICdwb3J0JyxcblxuICAgICAgICBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc2NvcGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdQb3J0Q29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL21tc0FwcC90ZW1wbGF0ZXMvcG9ydC5odG1sJyxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZU5hbWVzcGFjZTogJ1NWRycsXG4gICAgICAgICAgICAgICAgcmVxdWlyZTogWyAnXnN2Z0RpYWdyYW0nLCAnXmRpYWdyYW1Db250YWluZXInIF0sXG4gICAgICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKCBzY29wZSwgZWxlbWVudCwgYXR0cmlidXRlcywgY29udHJvbGxlcnMgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHN2Z0RpYWdyYW1Db250cm9sbGVyO1xuXG4gICAgICAgICAgICAgICAgICAgIHN2Z0RpYWdyYW1Db250cm9sbGVyID0gY29udHJvbGxlcnNbIDAgXTtcblxuICAgICAgICAgICAgICAgICAgICBzY29wZS5vblBvcnRDbGljayA9IGZ1bmN0aW9uICggcG9ydCwgJGV2ZW50ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3ZnRGlhZ3JhbUNvbnRyb2xsZXIub25Qb3J0Q2xpY2soIHNjb3BlLmNvbXBvbmVudCwgcG9ydCwgJGV2ZW50ICk7XG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgc2NvcGUub25Qb3J0TW91c2VEb3duID0gZnVuY3Rpb24gKCBwb3J0LCAkZXZlbnQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdmdEaWFncmFtQ29udHJvbGxlci5vblBvcnRNb3VzZURvd24oIHNjb3BlLmNvbXBvbmVudCwgcG9ydCwgJGV2ZW50ICk7XG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgc2NvcGUub25Qb3J0TW91c2VVcCA9IGZ1bmN0aW9uICggcG9ydCwgJGV2ZW50ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3ZnRGlhZ3JhbUNvbnRyb2xsZXIub25Qb3J0TW91c2VVcCggc2NvcGUuY29tcG9uZW50LCBwb3J0LCAkZXZlbnQgKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbik7IiwiLypnbG9iYWxzIGFuZ3VsYXIqL1xuXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlLCBkaWFncmFtU2VydmljZSwgd2lyaW5nU2VydmljZSwgJGxvZykge1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICBnZXRPZmZzZXRUb01vdXNlLFxuICAgICAgICBwb3NzaWJibGVEcmFnVGFyZ2V0c0Rlc2NyaXB0b3IsXG4gICAgICAgIGRyYWdUYXJnZXRzRGVzY3JpcHRvcixcblxuICAgICAgICBvbk1vdXNlVXAsXG4gICAgICAgIG9uTW91c2VNb3ZlLFxuICAgICAgICBvbk1vdXNlTGVhdmUsXG4gICAgICAgIG9uV2luZG93Qmx1cixcbiAgICAgICAgb25Db21wb25lbnRNb3VzZVVwLFxuICAgICAgICBvbkNvbXBvbmVudE1vdXNlRG93bixcblxuICAgICAgICBzdGFydERyYWcsXG4gICAgICAgIGZpbmlzaERyYWcsXG4gICAgICAgIGNhbmNlbERyYWc7XG5cblxuICAgIGdldE9mZnNldFRvTW91c2UgPSBmdW5jdGlvbiAoICRldmVudCApIHtcblxuICAgICAgICB2YXIgb2Zmc2V0O1xuXG4gICAgICAgIG9mZnNldCA9IHtcbiAgICAgICAgICAgIHg6ICRldmVudC5wYWdlWCAtICRzY29wZS5lbGVtZW50T2Zmc2V0LmxlZnQsXG4gICAgICAgICAgICB5OiAkZXZlbnQucGFnZVkgLSAkc2NvcGUuZWxlbWVudE9mZnNldC50b3BcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gb2Zmc2V0O1xuXG4gICAgfTtcblxuXG4gICAgc3RhcnREcmFnID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHNlbGYuZHJhZ2dpbmcgPSB0cnVlO1xuXG4gICAgICAgIGRyYWdUYXJnZXRzRGVzY3JpcHRvciA9IHBvc3NpYmJsZURyYWdUYXJnZXRzRGVzY3JpcHRvcjtcbiAgICAgICAgcG9zc2liYmxlRHJhZ1RhcmdldHNEZXNjcmlwdG9yID0gbnVsbDtcblxuICAgICAgICAkbG9nLmRlYnVnKCAnRHJhZ2dpbmcnLCBkcmFnVGFyZ2V0c0Rlc2NyaXB0b3IgKTtcblxuICAgIH07XG5cbiAgICBjYW5jZWxEcmFnID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgcG9zc2liYmxlRHJhZ1RhcmdldHNEZXNjcmlwdG9yID0gbnVsbDtcblxuICAgICAgICBpZiAoIGRyYWdUYXJnZXRzRGVzY3JpcHRvciApIHtcblxuICAgICAgICAgICAgdmFyIG9mZnNldDtcblxuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKCBkcmFnVGFyZ2V0c0Rlc2NyaXB0b3IudGFyZ2V0cywgZnVuY3Rpb24gKCB0YXJnZXQgKSB7XG5cbiAgICAgICAgICAgICAgICB0YXJnZXQuY29tcG9uZW50LnNldFBvc2l0aW9uKFxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQub3JpZ2luYWxQb3NpdGlvbi54LFxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQub3JpZ2luYWxQb3NpdGlvbi55XG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgfSApO1xuXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goIGRyYWdUYXJnZXRzRGVzY3JpcHRvci5hZmZlY3RlZFdpcmVzLCBmdW5jdGlvbiAoIHdpcmUgKSB7XG5cbiAgICAgICAgICAgICAgICB3aXJpbmdTZXJ2aWNlLmFkanVzdFdpcmVFbmRTZWdtZW50cyggd2lyZSApO1xuXG4gICAgICAgICAgICB9ICk7XG5cbiAgICAgICAgICAgIGRyYWdUYXJnZXRzRGVzY3JpcHRvciA9IG51bGw7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuZHJhZ2dpbmcgPSBmYWxzZTtcblxuICAgIH07XG5cbiAgICBmaW5pc2hEcmFnID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHNlbGYuZHJhZ2dpbmcgPSBmYWxzZTtcblxuICAgICAgICBkcmFnVGFyZ2V0c0Rlc2NyaXB0b3IgPSBudWxsO1xuXG4gICAgICAgICRsb2cuZGVidWcoICdGaW5pc2ggZHJhZ2dpbmcnICk7XG5cbiAgICB9O1xuXG4gICAgb25Nb3VzZU1vdmUgPSBmdW5jdGlvbigkZXZlbnQpIHtcblxuICAgICAgICBpZiAoIHBvc3NpYmJsZURyYWdUYXJnZXRzRGVzY3JpcHRvciApIHtcbiAgICAgICAgICAgIHN0YXJ0RHJhZygpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBkcmFnVGFyZ2V0c0Rlc2NyaXB0b3IgKSB7XG5cbiAgICAgICAgICAgIHZhciBvZmZzZXQ7XG5cbiAgICAgICAgICAgIG9mZnNldCA9IGdldE9mZnNldFRvTW91c2UoICRldmVudCApO1xuXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goIGRyYWdUYXJnZXRzRGVzY3JpcHRvci50YXJnZXRzLCBmdW5jdGlvbiAoIHRhcmdldCApIHtcblxuICAgICAgICAgICAgICAgIHRhcmdldC5jb21wb25lbnQuc2V0UG9zaXRpb24oXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldC54ICsgdGFyZ2V0LmRlbHRhVG9DdXJzb3IueCxcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0LnkgKyB0YXJnZXQuZGVsdGFUb0N1cnNvci55XG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgfSApO1xuXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goIGRyYWdUYXJnZXRzRGVzY3JpcHRvci5hZmZlY3RlZFdpcmVzLCBmdW5jdGlvbiAoIHdpcmUgKSB7XG5cbiAgICAgICAgICAgICAgICB3aXJpbmdTZXJ2aWNlLmFkanVzdFdpcmVFbmRTZWdtZW50cyggd2lyZSApO1xuXG4gICAgICAgICAgICB9ICk7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIG9uTW91c2VVcCA9IGZ1bmN0aW9uKCRldmVudCkge1xuXG4gICAgICAgIHBvc3NpYmJsZURyYWdUYXJnZXRzRGVzY3JpcHRvciA9IG51bGw7XG5cbiAgICAgICAgaWYgKCBkcmFnVGFyZ2V0c0Rlc2NyaXB0b3IgKSB7XG4gICAgICAgICAgICBmaW5pc2hEcmFnKCk7XG4gICAgICAgICAgICAkZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBvbk1vdXNlTGVhdmUgPSBmdW5jdGlvbigvKiRldmVudCovKSB7XG5cbiAgICAgICAgY2FuY2VsRHJhZygpO1xuXG4gICAgfTtcblxuICAgIG9uV2luZG93Qmx1ciA9IGZ1bmN0aW9uKC8qJGV2ZW50Ki8pIHtcblxuICAgICAgICBjYW5jZWxEcmFnKCk7XG5cbiAgICB9O1xuXG4gICAgb25Db21wb25lbnRNb3VzZVVwID0gZnVuY3Rpb24oY29tcG9uZW50LCAkZXZlbnQpIHtcblxuICAgICAgICBwb3NzaWJibGVEcmFnVGFyZ2V0c0Rlc2NyaXB0b3IgPSBudWxsO1xuXG4gICAgICAgIGlmICggZHJhZ1RhcmdldHNEZXNjcmlwdG9yICkge1xuICAgICAgICAgICAgZmluaXNoRHJhZygpO1xuICAgICAgICAgICAgJGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgb25Db21wb25lbnRNb3VzZURvd24gPSBmdW5jdGlvbiAoY29tcG9uZW50LCAkZXZlbnQpIHtcblxuICAgICAgICB2YXIgY29tcG9uZW50c1RvRHJhZyxcbiAgICAgICAgICAgIGdldERyYWdEZXNjcmlwdG9yO1xuXG4gICAgICAgIGNvbXBvbmVudHNUb0RyYWcgPSBbXTtcblxuICAgICAgICBnZXREcmFnRGVzY3JpcHRvciA9IGZ1bmN0aW9uICggY29tcG9uZW50ICkge1xuXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gZ2V0T2Zmc2V0VG9Nb3VzZSggJGV2ZW50ICk7XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50OiBjb21wb25lbnQsXG4gICAgICAgICAgICAgICAgb3JpZ2luYWxQb3NpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICB4OiBjb21wb25lbnQueCxcbiAgICAgICAgICAgICAgICAgICAgeTogY29tcG9uZW50LnlcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGRlbHRhVG9DdXJzb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgeDogY29tcG9uZW50LnggLSBvZmZzZXQueCxcbiAgICAgICAgICAgICAgICAgICAgeTogY29tcG9uZW50LnkgLSBvZmZzZXQueVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuZGlhZ3JhbS5jb25maWcgPSAkc2NvcGUuZGlhZ3JhbS5jb25maWcgfHwge307XG5cbiAgICAgICAgaWYgKCAkc2NvcGUuZGlhZ3JhbS5jb25maWcuZWRpdGFibGUgPT09IHRydWUgJiZcbiAgICAgICAgICAgIGNvbXBvbmVudC5ub25TZWxlY3RhYmxlICE9PSB0cnVlICYmXG4gICAgICAgICAgICBjb21wb25lbnQubG9jYXRpb25Mb2NrZWQgIT09IHRydWUgKSB7XG5cbiAgICAgICAgICAgICRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICAgICAgcG9zc2liYmxlRHJhZ1RhcmdldHNEZXNjcmlwdG9yID0ge1xuICAgICAgICAgICAgICAgIHRhcmdldHM6IFsgZ2V0RHJhZ0Rlc2NyaXB0b3IoIGNvbXBvbmVudCApIF1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNvbXBvbmVudHNUb0RyYWcucHVzaCggY29tcG9uZW50ICk7XG5cbiAgICAgICAgICAgIGlmICggJHNjb3BlLmRpYWdyYW0uc3RhdGUuc2VsZWN0ZWRDb21wb25lbnRJZHMuaW5kZXhPZiggY29tcG9uZW50LmlkICkgPiAtMSApIHtcblxuICAgICAgICAgICAgICAgIC8vIERyYWcgYWxvbmcgb3RoZXIgc2VsZWN0ZWQgY29tcG9uZW50c1xuXG4gICAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKCAkc2NvcGUuZGlhZ3JhbS5zdGF0ZS5zZWxlY3RlZENvbXBvbmVudElkcywgZnVuY3Rpb24gKCBzZWxlY3RlZENvbXBvbmVudElkICkge1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3RlZENvbXBvbmVudDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIGNvbXBvbmVudC5pZCAhPT0gc2VsZWN0ZWRDb21wb25lbnRJZCApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRDb21wb25lbnQgPSAkc2NvcGUuZGlhZ3JhbS5jb21wb25lbnRzWyBzZWxlY3RlZENvbXBvbmVudElkIF07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3NpYmJsZURyYWdUYXJnZXRzRGVzY3JpcHRvci50YXJnZXRzLnB1c2goIGdldERyYWdEZXNjcmlwdG9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkQ29tcG9uZW50ICkgKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50c1RvRHJhZy5wdXNoKCBzZWxlY3RlZENvbXBvbmVudCApO1xuXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcG9zc2liYmxlRHJhZ1RhcmdldHNEZXNjcmlwdG9yLmFmZmVjdGVkV2lyZXMgPSBkaWFncmFtU2VydmljZS5nZXRXaXJlc0ZvckNvbXBvbmVudHMoXG4gICAgICAgICAgICAgICAgY29tcG9uZW50c1RvRHJhZyApO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICB0aGlzLm9uTW91c2VVcCA9IG9uTW91c2VVcDtcbiAgICB0aGlzLm9uTW91c2VNb3ZlID0gb25Nb3VzZU1vdmU7XG4gICAgdGhpcy5vbk1vdXNlTGVhdmUgPSBvbk1vdXNlTGVhdmU7XG4gICAgdGhpcy5vbldpbmRvd0JsdXIgPSBvbldpbmRvd0JsdXI7XG4gICAgdGhpcy5vbkNvbXBvbmVudE1vdXNlVXAgPSBvbkNvbXBvbmVudE1vdXNlVXA7XG4gICAgdGhpcy5vbkNvbXBvbmVudE1vdXNlRG93biA9IG9uQ29tcG9uZW50TW91c2VEb3duO1xuXG4gICAgcmV0dXJuIHRoaXM7XG5cbn07XG4iLCIvKmdsb2JhbHMgYW5ndWxhciovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkc2NvcGUsIGRpYWdyYW1TZXJ2aWNlLCBncmlkU2VydmljZSwgJGxvZykge1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzLFxuXG4gICAgICAgIG9uQ29tcG9uZW50TW91c2VVcCxcblxuICAgICAgICBtb3ZlQ29tcG9uZW50RWxlbWVudFRvRnJvbnQsXG4gICAgICAgIHRvZ2dsZUNvbXBvbmVudFNlbGVjdGVkO1xuXG5cbiAgICBtb3ZlQ29tcG9uZW50RWxlbWVudFRvRnJvbnQgPSBmdW5jdGlvbiAoIGNvbXBvbmVudElkICkge1xuXG4gICAgICAgIHZhciB6LFxuICAgICAgICAgICAgY29tcG9uZW50LFxuICAgICAgICAgICAgbmVlZHNUb2JlUmVvcmRlcmVkO1xuXG4gICAgICAgIG5lZWRzVG9iZVJlb3JkZXJlZCA9IGZhbHNlO1xuXG4gICAgICAgIHogPSBkaWFncmFtU2VydmljZS5nZXRIaWdoZXN0WigpO1xuICAgICAgICBjb21wb25lbnQgPSAkc2NvcGUuZGlhZ3JhbS5jb21wb25lbnRzWyBjb21wb25lbnRJZCBdO1xuXG4gICAgICAgIGlmICggaXNOYU4oIGNvbXBvbmVudC56ICkgKSB7XG4gICAgICAgICAgICBjb21wb25lbnQueiA9IHo7XG4gICAgICAgICAgICBuZWVkc1RvYmVSZW9yZGVyZWQgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCBjb21wb25lbnQueiA8IHogKSB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50LnogPSB6ICsgMTtcbiAgICAgICAgICAgICAgICBuZWVkc1RvYmVSZW9yZGVyZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBuZWVkc1RvYmVSZW9yZGVyZWQgKSB7XG4gICAgICAgICAgICBncmlkU2VydmljZS5yZW9yZGVyVmlzaWJsZUNvbXBvbmVudHMoICRzY29wZS5pZCApO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG5cbiAgICB0b2dnbGVDb21wb25lbnRTZWxlY3RlZCA9ICBmdW5jdGlvbiAoIGNvbXBvbmVudCwgJGV2ZW50ICkge1xuXG4gICAgICAgIHZhciBpbmRleDtcblxuICAgICAgICAkc2NvcGUuZGlhZ3JhbS5jb25maWcgPSAkc2NvcGUuZGlhZ3JhbS5jb25maWcgfHwge307XG5cbiAgICAgICAgaWYgKCBhbmd1bGFyLmlzT2JqZWN0KCBjb21wb25lbnQgKSAmJiAkc2NvcGUuZGlhZ3JhbS5jb25maWcuZGlzYWxsb3dTZWxlY3Rpb24gIT09IHRydWUgJiYgY29tcG9uZW50Lm5vblNlbGVjdGFibGUgIT09IHRydWUgKSB7XG5cbiAgICAgICAgICAgIGluZGV4ID0gJHNjb3BlLmRpYWdyYW0uc3RhdGUuc2VsZWN0ZWRDb21wb25lbnRJZHMuaW5kZXhPZiggY29tcG9uZW50LmlkICk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGluZGV4LCAkc2NvcGUuZGlhZ3JhbS5zdGF0ZS5zZWxlY3RlZENvbXBvbmVudElkcyk7XG5cbiAgICAgICAgICAgIGlmICggaW5kZXggPiAtMSApIHtcblxuICAgICAgICAgICAgICAgICRzY29wZS5kaWFncmFtLnN0YXRlLnNlbGVjdGVkQ29tcG9uZW50SWRzLnNwbGljZSggaW5kZXgsIDEgKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIGlmICggJHNjb3BlLmRpYWdyYW0uc3RhdGUuc2VsZWN0ZWRDb21wb25lbnRJZHMubGVuZ3RoID4gMCAmJlxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZGlhZ3JhbS5jb25maWcubXVsdGlTZWxlY3QgIT09IHRydWUgJiZcbiAgICAgICAgICAgICAgICAgICAgJGV2ZW50LnNoaWZ0S2V5ICE9PSB0cnVlICkge1xuXG4gICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaCggJHNjb3BlLmRpYWdyYW0uc3RhdGUuc2VsZWN0ZWRDb21wb25lbnRJZHMsIGZ1bmN0aW9uICggY29tcG9uZW50SWQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZGlhZ3JhbS5jb21wb25lbnRzWyBjb21wb25lbnRJZCBdLnNlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0gKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRpYWdyYW0uc3RhdGUuc2VsZWN0ZWRDb21wb25lbnRJZHMgPSBbXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAkc2NvcGUuZGlhZ3JhbS5zdGF0ZS5zZWxlY3RlZENvbXBvbmVudElkcy5wdXNoKCBjb21wb25lbnQuaWQgKTtcblxuICAgICAgICAgICAgICAgIG1vdmVDb21wb25lbnRFbGVtZW50VG9Gcm9udCggY29tcG9uZW50LmlkICk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgJGxvZy5kZWJ1Zygnc2VsZWN0ZWRzJywgJHNjb3BlLmRpYWdyYW0uc3RhdGUuc2VsZWN0ZWRDb21wb25lbnRJZHMpO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cblxuICAgIG9uQ29tcG9uZW50TW91c2VVcCA9IGZ1bmN0aW9uKGNvbXBvbmVudCwgJGV2ZW50KSB7XG4gICAgICAgIHRvZ2dsZUNvbXBvbmVudFNlbGVjdGVkKCBjb21wb25lbnQsICRldmVudCApO1xuXG4gICAgfTtcblxuICAgIHRoaXMub25Db21wb25lbnRNb3VzZVVwID0gb25Db21wb25lbnRNb3VzZVVwO1xuXG4gICAgcmV0dXJuIHRoaXM7XG5cbn07XG4iLCIvKmdsb2JhbHMgYW5ndWxhciwgJCovXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gTW92ZSB0aGlzIHRvIEdNRSBldmVudHVhbGx5XG5cbnJlcXVpcmUoICcuLi9jb21wb25lbnRXaXJlL2NvbXBvbmVudFdpcmUuanMnICk7XG5cbmFuZ3VsYXIubW9kdWxlKCAnbW1zLmRlc2lnblZpc3VhbGl6YXRpb24uc3ZnRGlhZ3JhbScsIFtcbiAgICAnbW1zLmRlc2lnblZpc3VhbGl6YXRpb24uZ3JpZFNlcnZpY2UnLFxuICAgICdtbXMuZGVzaWduVmlzdWFsaXphdGlvbi5jb21wb25lbnRXaXJlJ1xuXSApXG4gICAgLmNvbnRyb2xsZXIoICdTVkdEaWFncmFtQ29udHJvbGxlcicsIGZ1bmN0aW9uIChcbiAgICAgICAgJHNjb3BlLCAkbG9nLCBkaWFncmFtU2VydmljZSwgd2lyaW5nU2VydmljZSwgZ3JpZFNlcnZpY2UsICR3aW5kb3dcbiAgICApIHtcblxuICAgICAgICB2YXJcblxuICAgICAgICAgICAgQ29tcG9uZW50U2VsZWN0aW9uSGFuZGxlciA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9Db21wb25lbnRTZWxlY3Rpb25IYW5kbGVyJyksXG4gICAgICAgICAgICBjb21wb25lbnRTZWxlY3Rpb25IYW5kbGVyLFxuXG4gICAgICAgICAgICBDb21wb25lbnREcmFnSGFuZGxlciA9IHJlcXVpcmUoJy4vY2xhc3Nlcy9Db21wb25lbnREcmFnSGFuZGxlcicpLFxuICAgICAgICAgICAgY29tcG9uZW50RHJhZ0hhbmRsZXIsXG5cbiAgICAgICAgICAgIHN0YXJ0V2lyZSxcbiAgICAgICAgICAgIGZpbmlzaFdpcmUsXG4gICAgICAgICAgICBjYW5jZWxXaXJlLFxuXG4gICAgICAgICAgICBXaXJlID0gcmVxdWlyZSggJy4uLy4uL3NlcnZpY2VzL2RpYWdyYW1TZXJ2aWNlL2NsYXNzZXMvV2lyZS5qcycgKSxcblxuICAgICAgICAgICAgYWRkQ29ybmVyVG9OZXdXaXJlTGluZSxcblxuICAgICAgICAgICAgY29tcG9uZW50RWxlbWVudHMsXG5cbiAgICAgICAgICAgICQkd2luZG93O1xuXG4gICAgICAgICQkd2luZG93ID0gJCgkd2luZG93KTtcblxuICAgICAgICBjb21wb25lbnREcmFnSGFuZGxlciA9IG5ldyBDb21wb25lbnREcmFnSGFuZGxlcihcbiAgICAgICAgICAgICRzY29wZSxcbiAgICAgICAgICAgIGRpYWdyYW1TZXJ2aWNlLFxuICAgICAgICAgICAgd2lyaW5nU2VydmljZSxcbiAgICAgICAgICAgICRsb2csXG4gICAgICAgICAgICAkc2NvcGUuZWxlbWVudE9mZnNldFxuICAgICAgICApO1xuXG4gICAgICAgIGNvbXBvbmVudFNlbGVjdGlvbkhhbmRsZXIgPSBuZXcgQ29tcG9uZW50U2VsZWN0aW9uSGFuZGxlcihcbiAgICAgICAgICAgICRzY29wZSxcbiAgICAgICAgICAgIGRpYWdyYW1TZXJ2aWNlLFxuICAgICAgICAgICAgZ3JpZFNlcnZpY2UsXG4gICAgICAgICAgICAkbG9nLFxuICAgICAgICAgICAgJHNjb3BlLmVsZW1lbnRPZmZzZXRcbiAgICAgICAgKTtcblxuICAgICAgICBzdGFydFdpcmUgPSBmdW5jdGlvbiAoY29tcG9uZW50LCBwb3J0KSB7XG5cbiAgICAgICAgICAgICRzY29wZS53aXJlU3RhcnQgPSB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50OiBjb21wb25lbnQsXG4gICAgICAgICAgICAgICAgcG9ydDogcG9ydFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgJGxvZy5kZWJ1ZyggJ1N0YXJ0aW5nIHdpcmUnLCAkc2NvcGUud2lyZVN0YXJ0ICk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICBhZGRDb3JuZXJUb05ld1dpcmVMaW5lID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICB2YXIgbGFzdFNlZ21lbnQ7XG5cbiAgICAgICAgICAgICRzY29wZS5uZXdXaXJlTGluZS5sb2NrZWRTZWdtZW50cyA9ICRzY29wZS5uZXdXaXJlTGluZS5zZWdtZW50cztcblxuICAgICAgICAgICAgbGFzdFNlZ21lbnQgPSAkc2NvcGUubmV3V2lyZUxpbmUubG9ja2VkU2VnbWVudHNbICRzY29wZS5uZXdXaXJlTGluZS5sb2NrZWRTZWdtZW50cy5sZW5ndGggLSAxIF07XG5cbiAgICAgICAgICAgICRzY29wZS5uZXdXaXJlTGluZS5hY3RpdmVTZWdtZW50U3RhcnRQb3NpdGlvbiA9IHtcbiAgICAgICAgICAgICAgICB4OiBsYXN0U2VnbWVudC54MixcbiAgICAgICAgICAgICAgICB5OiBsYXN0U2VnbWVudC55MlxuICAgICAgICAgICAgfTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIGZpbmlzaFdpcmUgPSBmdW5jdGlvbiAoIGNvbXBvbmVudCwgcG9ydCApIHtcblxuICAgICAgICAgICAgdmFyIHdpcmUgPSBuZXcgV2lyZSgge1xuICAgICAgICAgICAgICAgIGlkOiAnbmV3LXdpcmUtJyArIE1hdGgucm91bmQoIE1hdGgucmFuZG9tKCkgKiAxMDAwMCApLFxuICAgICAgICAgICAgICAgIGVuZDE6IHtcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50OiAkc2NvcGUud2lyZVN0YXJ0LmNvbXBvbmVudCxcbiAgICAgICAgICAgICAgICAgICAgcG9ydDogJHNjb3BlLndpcmVTdGFydC5wb3J0XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbmQyOiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudDogY29tcG9uZW50LFxuICAgICAgICAgICAgICAgICAgICBwb3J0OiBwb3J0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSApO1xuXG4gICAgICAgICAgICB3aXJlLnNlZ21lbnRzID0gYW5ndWxhci5jb3B5KFxuICAgICAgICAgICAgICAgICRzY29wZS5uZXdXaXJlTGluZS5sb2NrZWRTZWdtZW50cy5jb25jYXQoXG4gICAgICAgICAgICAgICAgICAgIHdpcmluZ1NlcnZpY2UuZ2V0U2VnbWVudHNCZXR3ZWVuUG9zaXRpb25zKCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kMTogJHNjb3BlLm5ld1dpcmVMaW5lLmFjdGl2ZVNlZ21lbnRTdGFydFBvc2l0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZDI6IHBvcnQuZ2V0R3JpZFBvc2l0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAnRWxib3dSb3V0ZXInXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApICk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCB3aXJlLnNlZ21lbnRzICk7XG5cblxuICAgICAgICAgICAgZGlhZ3JhbVNlcnZpY2UuYWRkV2lyZSggd2lyZSApO1xuXG4gICAgICAgICAgICAkc2NvcGUuZGlhZ3JhbS53aXJlc1sgd2lyZS5pZCBdID0gd2lyZTtcblxuICAgICAgICAgICAgZ3JpZFNlcnZpY2UuaW52YWxpZGF0ZVZpc2libGVEaWFncmFtQ29tcG9uZW50cyggJHNjb3BlLmlkICk7XG5cbiAgICAgICAgICAgICRsb2cuZGVidWcoICdGaW5pc2ggd2lyZScsIHdpcmUgKTtcblxuICAgICAgICAgICAgJHNjb3BlLndpcmVTdGFydCA9IG51bGw7XG4gICAgICAgICAgICAkc2NvcGUubmV3V2lyZUxpbmUgPSBudWxsO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgY2FuY2VsV2lyZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5uZXdXaXJlTGluZSA9IG51bGw7XG4gICAgICAgICAgICAkc2NvcGUud2lyZVN0YXJ0ID0gbnVsbDtcbiAgICAgICAgfTtcblxuXG4gICAgICAgICRzY29wZS5vbk1vdXNlVXAgPSBmdW5jdGlvbiAoJGV2ZW50KSB7XG5cbiAgICAgICAgICAgIGNvbXBvbmVudERyYWdIYW5kbGVyLm9uTW91c2VVcCgkZXZlbnQpO1xuXG4gICAgICAgICAgICBpZiAoICRzY29wZS53aXJlU3RhcnQgKSB7XG5cbiAgICAgICAgICAgICAgICAkZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgICAgICAgICBhZGRDb3JuZXJUb05ld1dpcmVMaW5lKCk7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmRpYWdyYW0uc3RhdGUuc2VsZWN0ZWRDb21wb25lbnRJZHMgPSBbXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9O1xuXG5cbiAgICAgICAgJHNjb3BlLm9uQ2xpY2sgPSBmdW5jdGlvbiAoICRldmVudCApIHtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUub25Nb3VzZU1vdmUgPSBmdW5jdGlvbiAoICRldmVudCApIHtcblxuXG4gICAgICAgICAgICAvLyBEcmFnZ2luZ1xuXG4gICAgICAgICAgICBjb21wb25lbnREcmFnSGFuZGxlci5vbk1vdXNlTW92ZSgkZXZlbnQpO1xuXG4gICAgICAgICAgICAvLyBXaXJlIGRyYXdpbmdcblxuICAgICAgICAgICAgaWYgKCAkc2NvcGUud2lyZVN0YXJ0ICkge1xuXG5cbiAgICAgICAgICAgICAgICAkc2NvcGUubmV3V2lyZUxpbmUgPSAkc2NvcGUubmV3V2lyZUxpbmUgfHwge307XG4gICAgICAgICAgICAgICAgJHNjb3BlLm5ld1dpcmVMaW5lLmxvY2tlZFNlZ21lbnRzID0gJHNjb3BlLm5ld1dpcmVMaW5lLmxvY2tlZFNlZ21lbnRzIHx8IFtdO1xuICAgICAgICAgICAgICAgICRzY29wZS5uZXdXaXJlTGluZS5hY3RpdmVTZWdtZW50U3RhcnRQb3NpdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5uZXdXaXJlTGluZS5hY3RpdmVTZWdtZW50U3RhcnRQb3NpdGlvbiB8fCAkc2NvcGUud2lyZVN0YXJ0LnBvcnQuZ2V0R3JpZFBvc2l0aW9uKCk7XG5cbiAgICAgICAgICAgICAgICAkc2NvcGUubmV3V2lyZUxpbmUuc2VnbWVudHMgPSAkc2NvcGUubmV3V2lyZUxpbmUubG9ja2VkU2VnbWVudHMuY29uY2F0KFxuICAgICAgICAgICAgICAgICAgICB3aXJpbmdTZXJ2aWNlLmdldFNlZ21lbnRzQmV0d2VlblBvc2l0aW9ucygge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZDE6ICRzY29wZS5uZXdXaXJlTGluZS5hY3RpdmVTZWdtZW50U3RhcnRQb3NpdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmQyOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6ICRldmVudC5wYWdlWCAtICRzY29wZS5lbGVtZW50T2Zmc2V0LmxlZnQgLSAzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiAkZXZlbnQucGFnZVkgLSAkc2NvcGUuZWxlbWVudE9mZnNldC50b3AgLSAzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdFbGJvd1JvdXRlcidcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5nZXRDc3NDbGFzcyA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9ICcnO1xuXG4gICAgICAgICAgICBpZiAoICRzY29wZS5kcmFnVGFyZ2V0c0Rlc2NyaXB0b3IgKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9ICdkcmFnZ2luZyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuY29udGV4dE1lbnVEYXRhID0gWyB7XG4gICAgICAgICAgICBpZDogJ2NvbnRleHQtbWVudS1jb21tb24nLFxuICAgICAgICAgICAgaXRlbXM6IFsge1xuICAgICAgICAgICAgICAgIGlkOiAnbmV3Q29tcG9uZW50JyxcbiAgICAgICAgICAgICAgICBsYWJlbDogJ05ldyBjb21wb25lbnQgLi4uJyxcbiAgICAgICAgICAgICAgICBpY29uQ2xhc3M6ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxuICAgICAgICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggJ05ldyBjb21wb25lbnQgY2xpY2tlZCcgKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGFjdGlvbkRhdGE6IHt9XG4gICAgICAgICAgICB9IF1cbiAgICAgICAgfSBdO1xuXG5cbiAgICAgICAgJHNjb3BlLm9uTW91c2VMZWF2ZSA9IGZ1bmN0aW9uKCRldmVudCkge1xuICAgICAgICAgICBjb21wb25lbnREcmFnSGFuZGxlci5vbk1vdXNlTGVhdmUoJGV2ZW50KTtcbiAgICAgICAgfTtcblxuICAgICAgICAkJHdpbmRvdy5ibHVyKGZ1bmN0aW9uKCRldmVudCkge1xuICAgICAgICAgICBjb21wb25lbnREcmFnSGFuZGxlci5vbldpbmRvd0JsdXIoJGV2ZW50KTtcbiAgICAgICAgfSk7XG5cblxuICAgICAgICAvLyBJbnRlcmFjdGlvbnMgd2l0aCBjb21wb25lbnRzXG5cbiAgICAgICAgdGhpcy5vbkNvbXBvbmVudE1vdXNlVXAgPSBmdW5jdGlvbiAoIGNvbXBvbmVudCwgJGV2ZW50ICkge1xuXG4gICAgICAgICAgICBpZiAoIWNvbXBvbmVudERyYWdIYW5kbGVyLmRyYWdnaW5nKSB7XG5cbiAgICAgICAgICAgICAgICBjb21wb25lbnRTZWxlY3Rpb25IYW5kbGVyLm9uQ29tcG9uZW50TW91c2VVcChjb21wb25lbnQsICRldmVudCk7XG4gICAgICAgICAgICAgICAgJGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICAgICAgY29tcG9uZW50RHJhZ0hhbmRsZXIub25Db21wb25lbnRNb3VzZVVwKGNvbXBvbmVudCwgJGV2ZW50KTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb21wb25lbnREcmFnSGFuZGxlci5vbkNvbXBvbmVudE1vdXNlVXAoY29tcG9uZW50LCAkZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMub25Qb3J0TW91c2VEb3duID0gZnVuY3Rpb24gKCBjb21wb25lbnQsIHBvcnQsICRldmVudCApIHtcblxuICAgICAgICAgICAgaWYgKCAkc2NvcGUud2lyZVN0YXJ0ICkge1xuXG4gICAgICAgICAgICAgICAgJGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCAkc2NvcGUud2lyZVN0YXJ0LnBvcnQgIT09IHBvcnQgKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbmlzaFdpcmUoIGNvbXBvbmVudCwgcG9ydCApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbmNlbFdpcmUoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICBzdGFydFdpcmUoY29tcG9uZW50LCBwb3J0KTtcbiAgICAgICAgICAgICAgICAkZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMub25Qb3J0TW91c2VVcCA9IGZ1bmN0aW9uICggY29tcG9uZW50LCBwb3J0LCAkZXZlbnQgKSB7XG5cbiAgICAgICAgICAgICRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMub25Qb3J0Q2xpY2sgPSBmdW5jdGlvbiAoIGNvbXBvbmVudCwgcG9ydCwgJGV2ZW50ICkge1xuXG4gICAgICAgICAgICAkZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLm9uQ29tcG9uZW50TW91c2VEb3duID0gZnVuY3Rpb24gKCBjb21wb25lbnQsICRldmVudCApIHtcblxuICAgICAgICAgICAgdmFyIHdpcmVzO1xuXG4gICAgICAgICAgICBpZiAoICRldmVudC53aGljaCA9PT0gMyApIHtcblxuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5yb3RhdGUoIDkwICk7XG5cbiAgICAgICAgICAgICAgICB3aXJlcyA9IGRpYWdyYW1TZXJ2aWNlLmdldFdpcmVzRm9yQ29tcG9uZW50cyggY29tcG9uZW50ICk7XG5cbiAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goIHdpcmVzLCBmdW5jdGlvbiAoIHdpcmUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpcmluZ1NlcnZpY2UuYWRqdXN0V2lyZUVuZFNlZ21lbnRzKCB3aXJlICk7XG4gICAgICAgICAgICAgICAgfSApO1xuXG5cbiAgICAgICAgICAgICAgICAkZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIGNvbXBvbmVudERyYWdIYW5kbGVyLm9uQ29tcG9uZW50TW91c2VEb3duKGNvbXBvbmVudCwgJGV2ZW50KTtcblxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaXNFZGl0YWJsZSA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgJHNjb3BlLmRpYWdyYW0uY29uZmlnID0gJHNjb3BlLmRpYWdyYW0uY29uZmlnIHx8IHt9O1xuXG4gICAgICAgICAgICByZXR1cm4gJHNjb3BlLmRpYWdyYW0uY29uZmlnLmVkaXRhYmxlID09PSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGlzYWxsb3dTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICRzY29wZS5kaWFncmFtLmNvbmZpZyA9ICRzY29wZS5kaWFncmFtLmNvbmZpZyB8fCB7fTtcblxuICAgICAgICAgICAgcmV0dXJuICRzY29wZS5kaWFncmFtLmNvbmZpZy5kaXNhbGxvd1NlbGVjdGlvbiA9PT0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnJlZ2lzdGVyQ29tcG9uZW50RWxlbWVudCA9IGZ1bmN0aW9uICggaWQsIGVsICkge1xuXG4gICAgICAgICAgICBjb21wb25lbnRFbGVtZW50cyA9IGNvbXBvbmVudEVsZW1lbnRzIHx8IHt9O1xuXG4gICAgICAgICAgICBjb21wb25lbnRFbGVtZW50c1sgaWQgXSA9IGVsO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy51bnJlZ2lzdGVyQ29tcG9uZW50RWxlbWVudCA9IGZ1bmN0aW9uICggaWQgKSB7XG5cbiAgICAgICAgICAgIGNvbXBvbmVudEVsZW1lbnRzID0gY29tcG9uZW50RWxlbWVudHMgfHwge307XG5cbiAgICAgICAgICAgIGRlbGV0ZSBjb21wb25lbnRFbGVtZW50c1sgaWQgXTtcblxuICAgICAgICB9O1xuXG4gICAgfSApXG4gICAgLmRpcmVjdGl2ZSggJ3N2Z0RpYWdyYW0nLCBbXG4gICAgICAgICckbG9nJyxcbiAgICAgICAgJ2RpYWdyYW1TZXJ2aWNlJyxcbiAgICAgICAgJ2dyaWRTZXJ2aWNlJyxcbiAgICAgICAgZnVuY3Rpb24gKCAkbG9nLCBkaWFncmFtU2VydmljZSwgZ3JpZFNlcnZpY2UgKSB7XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ1NWR0RpYWdyYW1Db250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICByZXF1aXJlOiAnXmRpYWdyYW1Db250YWluZXInLFxuICAgICAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICAgICAgc2NvcGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvbW1zQXBwL3RlbXBsYXRlcy9zdmdEaWFncmFtLmh0bWwnLFxuICAgICAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uICggc2NvcGUsIGVsZW1lbnQsIGF0dHJpYnV0ZXMsIGRpYWdyYW1Db250YWluZXJDb250cm9sbGVyICkge1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBpZDtcblxuICAgICAgICAgICAgICAgICAgICBpZCA9IGRpYWdyYW1Db250YWluZXJDb250cm9sbGVyLmdldElkKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgc2NvcGUuZGlhZ3JhbSA9IHNjb3BlLmRpYWdyYW0gfHwge307XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLiRlbGVtZW50ID0gZWxlbWVudDtcblxuICAgICAgICAgICAgICAgICAgICBzY29wZS5pZCA9IGlkO1xuXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnZpc2libGVPYmplY3RzID0gZ3JpZFNlcnZpY2UuY3JlYXRlR3JpZCggaWQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMTAwMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAxMDAwXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuZGlhZ3JhbVxuICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLiR3YXRjaChcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGlhZ3JhbUNvbnRhaW5lckNvbnRyb2xsZXIuZ2V0VmlzaWJsZUFyZWEoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICggdmlzaWJsZUFyZWEgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuZWxlbWVudE9mZnNldCA9IHNjb3BlLiRlbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyaWRTZXJ2aWNlLnNldFZpc2libGVBcmVhKCBpZCwgdmlzaWJsZUFyZWEgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gKTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIF0gKTtcbiIsIi8qZ2xvYmFscyBhbmd1bGFyKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5hbmd1bGFyLm1vZHVsZShcbiAgICAnbW1zLmRlc2lnblZpc3VhbGl6YXRpb24uc3ltYm9scy5ib3gnLCBbXVxuKVxuICAgIC5jb250cm9sbGVyKCAnQm94Q29udHJvbGxlcicsIGZ1bmN0aW9uICggJHNjb3BlICkge1xuXG4gICAgICAgICRzY29wZS5wb3J0V2lyZXMgPSBbXTtcblxuICAgICAgICBhbmd1bGFyLmZvckVhY2goICRzY29wZS5jb21wb25lbnQuc3ltYm9sLnBvcnRzLCBmdW5jdGlvbiAoIHBvcnQgKSB7XG5cbiAgICAgICAgICAgIHZhciB0b1ggPSAwLFxuICAgICAgICAgICAgICAgIHRvWSA9IDAsXG4gICAgICAgICAgICAgICAgcG9ydFdpcmVMZW5ndGgsXG4gICAgICAgICAgICAgICAgd2lkdGgsIGhlaWdodDtcblxuICAgICAgICAgICAgcG9ydFdpcmVMZW5ndGggPSAkc2NvcGUuY29tcG9uZW50LnN5bWJvbC5wb3J0V2lyZUxlbmd0aDtcbiAgICAgICAgICAgIHdpZHRoID0gJHNjb3BlLmNvbXBvbmVudC5zeW1ib2wud2lkdGg7XG4gICAgICAgICAgICBoZWlnaHQgPSAkc2NvcGUuY29tcG9uZW50LnN5bWJvbC5oZWlnaHQ7XG5cbiAgICAgICAgICAgIGlmICggcG9ydC54ID09PSAwICkge1xuICAgICAgICAgICAgICAgIHRvWCA9IHBvcnRXaXJlTGVuZ3RoO1xuICAgICAgICAgICAgICAgIHRvWSA9IHBvcnQueTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCBwb3J0LnkgPT09IDAgKSB7XG4gICAgICAgICAgICAgICAgdG9ZID0gcG9ydFdpcmVMZW5ndGg7XG4gICAgICAgICAgICAgICAgdG9YID0gcG9ydC54O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIHBvcnQueCA9PT0gd2lkdGggKSB7XG4gICAgICAgICAgICAgICAgdG9YID0gd2lkdGggLSBwb3J0V2lyZUxlbmd0aDtcbiAgICAgICAgICAgICAgICB0b1kgPSBwb3J0Lnk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICggcG9ydC55ID09PSBoZWlnaHQgKSB7XG4gICAgICAgICAgICAgICAgdG9ZID0gaGVpZ2h0IC0gcG9ydFdpcmVMZW5ndGg7XG4gICAgICAgICAgICAgICAgdG9YID0gcG9ydC54O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAkc2NvcGUucG9ydFdpcmVzLnB1c2goIHtcbiAgICAgICAgICAgICAgICB4MTogcG9ydC54LFxuICAgICAgICAgICAgICAgIHkxOiBwb3J0LnksXG4gICAgICAgICAgICAgICAgeDI6IHRvWCxcbiAgICAgICAgICAgICAgICB5MjogdG9ZXG4gICAgICAgICAgICB9ICk7XG4gICAgICAgIH0gKTtcblxuICAgIH0gKVxuICAgIC5kaXJlY3RpdmUoXG4gICAgICAgICdib3gnLFxuXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzY29wZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdCb3hDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy9tbXNBcHAvdGVtcGxhdGVzL2JveC5odG1sJyxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZU5hbWVzcGFjZTogJ1NWRydcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gKTsiLCIvKmdsb2JhbHMgYW5ndWxhciovXG5cbid1c2Ugc3RyaWN0JztcblxuYW5ndWxhci5tb2R1bGUoXG4gICAgJ21tcy5kZXNpZ25WaXN1YWxpemF0aW9uLnN5bWJvbHMuY2FwYWNpdG9yJywgW11cbilcbiAgICAuY29uZmlnKCBbICdzeW1ib2xNYW5hZ2VyUHJvdmlkZXInLFxuICAgICAgICBmdW5jdGlvbiAoIHN5bWJvbE1hbmFnZXJQcm92aWRlciApIHtcbiAgICAgICAgICAgIHN5bWJvbE1hbmFnZXJQcm92aWRlci5yZWdpc3RlclN5bWJvbCgge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdjYXBhY2l0b3InLFxuICAgICAgICAgICAgICAgIGRpcmVjdGl2ZTogbnVsbCxcbiAgICAgICAgICAgICAgICBzdmdEZWNvcmF0aW9uOiAnaW1hZ2VzL3N5bWJvbHMuc3ZnI2ljb24tY2FwYWNpdG9yJyxcbiAgICAgICAgICAgICAgICBsYWJlbFByZWZpeDogJ0MnLFxuICAgICAgICAgICAgICAgIGxhYmVsUG9zaXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgeDogMTAsXG4gICAgICAgICAgICAgICAgICAgIHk6IC04XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB3aWR0aDogNjAsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAxNSxcbiAgICAgICAgICAgICAgICBwb3J0czogWyB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiAnQycsXG4gICAgICAgICAgICAgICAgICAgIHdpcmVBbmdsZTogMTgwLFxuICAgICAgICAgICAgICAgICAgICB3aXJlTGVhZEluOiAyMCxcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdDJyxcbiAgICAgICAgICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgICAgICAgICAgeTogNy41XG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBpZDogJ0EnLFxuICAgICAgICAgICAgICAgICAgICB3aXJlQW5nbGU6IDAsXG4gICAgICAgICAgICAgICAgICAgIHdpcmVMZWFkSW46IDIwLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0EnLFxuICAgICAgICAgICAgICAgICAgICB4OiA2MCxcbiAgICAgICAgICAgICAgICAgICAgeTogNy41XG4gICAgICAgICAgICAgICAgfSBdXG4gICAgICAgICAgICB9ICk7XG4gICAgICAgIH1cbiAgICBdICk7IiwiLypnbG9iYWxzIGFuZ3VsYXIsICQqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnJlcXVpcmUoICcuLi8uLi9zZXJ2aWNlcy9zeW1ib2xTZXJ2aWNlcy9zeW1ib2xTZXJ2aWNlcy5qcycgKTtcbnJlcXVpcmUoICcuLi9wb3J0L3BvcnQuanMnICk7XG5cbnJlcXVpcmUoICcuL3Jlc2lzdG9yL3Jlc2lzdG9yLmpzJyApO1xucmVxdWlyZSggJy4vakZldFAvakZldFAuanMnICk7XG5yZXF1aXJlKCAnLi9vcEFtcC9vcEFtcC5qcycgKTtcbnJlcXVpcmUoICcuL2Rpb2RlL2Rpb2RlLmpzJyApO1xucmVxdWlyZSggJy4vY2FwYWNpdG9yL2NhcGFjaXRvci5qcycgKTtcbnJlcXVpcmUoICcuL2luZHVjdG9yL2luZHVjdG9yLmpzJyApO1xuXG5yZXF1aXJlKCAnLi9ib3gvYm94LmpzJyApO1xuXG52YXIgc3ltYm9sc01vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKFxuICAgICdtbXMuZGVzaWduVmlzdWFsaXphdGlvbi5zeW1ib2xzJywgW1xuICAgICAgICAnbW1zLmRlc2lnblZpc3VhbGl6YXRpb24uc3ltYm9sU2VydmljZXMnLFxuXG4gICAgICAgICdtbXMuZGVzaWduVmlzdWFsaXphdGlvbi5wb3J0JyxcblxuICAgICAgICAnbW1zLmRlc2lnblZpc3VhbGl6YXRpb24uc3ltYm9scy5yZXNpc3RvcicsXG4gICAgICAgICdtbXMuZGVzaWduVmlzdWFsaXphdGlvbi5zeW1ib2xzLmpGZXRQJyxcbiAgICAgICAgJ21tcy5kZXNpZ25WaXN1YWxpemF0aW9uLnN5bWJvbHMub3BBbXAnLFxuICAgICAgICAnbW1zLmRlc2lnblZpc3VhbGl6YXRpb24uc3ltYm9scy5kaW9kZScsXG4gICAgICAgICdtbXMuZGVzaWduVmlzdWFsaXphdGlvbi5zeW1ib2xzLmNhcGFjaXRvcicsXG4gICAgICAgICdtbXMuZGVzaWduVmlzdWFsaXphdGlvbi5zeW1ib2xzLmluZHVjdG9yJyxcblxuICAgICAgICAnbW1zLmRlc2lnblZpc3VhbGl6YXRpb24uc3ltYm9scy5ib3gnXG5cbiAgICBdICk7XG5cbnN5bWJvbHNNb2R1bGUuY29udHJvbGxlcihcbiAgICAnU3ltYm9sQ29udHJvbGxlcicsIGZ1bmN0aW9uICggJHNjb3BlICkge1xuXG4gICAgICAgICRzY29wZS5nZXRTeW1ib2xUcmFuc2Zvcm0gPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIHZhciB0cmFuc2Zvcm1TdHJpbmc7XG5cbiAgICAgICAgICAgIC8vICAgIHRyYW5zZm9ybVN0cmluZyA9ICd0cmFuc2xhdGUoJyArICRzY29wZS5jb21wb25lbnQueCArICcsJyArICRzY29wZS5jb21wb25lbnQueSArICcpICc7XG4gICAgICAgICAgICAvLyAgICB0cmFuc2Zvcm1TdHJpbmcgKz1cbiAgICAgICAgICAgIC8vICAgICAgJ3JvdGF0ZSgnICsgJHNjb3BlLmNvbXBvbmVudC5yb3RhdGlvbiArICcgJyArICRzY29wZS5jb21wb25lbnQuc3ltYm9sLndpZHRoLzIgKyAnICcgKyAkc2NvcGUuY29tcG9uZW50LnN5bWJvbC5oZWlnaHQvMiAgKyAnKSAnO1xuICAgICAgICAgICAgLy8gICAgLy90cmFuc2Zvcm1TdHJpbmcgKz0gJ3NjYWxlKCcgKyAkc2NvcGUuY29tcG9uZW50LnNjYWxlWCArICcsJyArICRzY29wZS5jb21wb25lbnQuc2NhbGVZICsgJykgJztcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyAgICBjb25zb2xlLmxvZygkc2NvcGUuY29tcG9uZW50LmdldFRyYW5zZm9ybWF0aW9uTWF0cml4KCkuam9pbignLCAnKSk7XG5cbiAgICAgICAgICAgIHRyYW5zZm9ybVN0cmluZyA9ICdtYXRyaXgoJyArICRzY29wZS5jb21wb25lbnQuZ2V0U1ZHVHJhbnNmb3JtYXRpb25TdHJpbmcoKSArICcpJztcblxuICAgICAgICAgICAgcmV0dXJuIHRyYW5zZm9ybVN0cmluZztcbiAgICAgICAgfTtcblxuICAgIH0gKTtcblxuc3ltYm9sc01vZHVsZS5kaXJlY3RpdmUoXG4gICAgJ2NvbXBvbmVudFN5bWJvbCcsXG5cbiAgICBmdW5jdGlvbiAoICRjb21waWxlICkge1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudDogJz0nLFxuICAgICAgICAgICAgICAgIHRlc3Q6ICc9JyxcbiAgICAgICAgICAgICAgICBwYWdlOiAnPScsXG4gICAgICAgICAgICAgICAgaW5zdGFuY2U6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1N5bWJvbENvbnRyb2xsZXInLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvbW1zQXBwL3RlbXBsYXRlcy9jb21wb25lbnRTeW1ib2wuaHRtbCcsXG4gICAgICAgICAgICB0ZW1wbGF0ZU5hbWVzcGFjZTogJ1NWRycsXG4gICAgICAgICAgICByZXF1aXJlOiBbICdec3ZnRGlhZ3JhbScsICdeZGlhZ3JhbUNvbnRhaW5lcicgXSxcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uICggc2NvcGUsIGVsZW1lbnQsIGF0dHJpYnV0ZXMsIGNvbnRyb2xsZXJzICkge1xuXG4gICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlU3RyLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZSxcblxuICAgICAgICAgICAgICAgICAgICBkaWFncmFtQ29udGFpbmVyQ29udHJvbGxlcixcbiAgICAgICAgICAgICAgICAgICAgc3ZnRGlhZ3JhbUNvbnRyb2xsZXIsXG5cbiAgICAgICAgICAgICAgICAgICAgJGVsLFxuICAgICAgICAgICAgICAgICAgICBjb21waWxlZFN5bWJvbCxcbiAgICAgICAgICAgICAgICAgICAgc3ltYm9sQ29tcG9uZW50O1xuXG4gICAgICAgICAgICAgICAgc3ZnRGlhZ3JhbUNvbnRyb2xsZXIgPSBjb250cm9sbGVyc1sgMCBdO1xuICAgICAgICAgICAgICAgIGRpYWdyYW1Db250YWluZXJDb250cm9sbGVyID0gY29udHJvbGxlcnNbIDEgXTtcblxuICAgICAgICAgICAgICAgIHNjb3BlLnBvcnRzVmlzaWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHNjb3BlLmRldGFpbHNWaXNpYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGlhZ3JhbUNvbnRhaW5lckNvbnRyb2xsZXIuZ2V0Wm9vbUxldmVsKCkgPiAxO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBzY29wZS5nZXRDc3NDbGFzcyA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0O1xuXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHNjb3BlLmNvbXBvbmVudC5zeW1ib2wudHlwZTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIGRpYWdyYW1Db250YWluZXJDb250cm9sbGVyLmlzQ29tcG9uZW50U2VsZWN0ZWQoIHNjb3BlLmNvbXBvbmVudCApICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9ICcgc2VsZWN0ZWQnO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcblxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvLyBJbnRlcmFjdGlvbnNcblxuICAgICAgICAgICAgICAgIHNjb3BlLm9uTW91c2VVcCA9IGZ1bmN0aW9uICggJGV2ZW50ICkge1xuICAgICAgICAgICAgICAgICAgICBzdmdEaWFncmFtQ29udHJvbGxlci5vbkNvbXBvbmVudE1vdXNlVXAoIHNjb3BlLmNvbXBvbmVudCwgJGV2ZW50ICk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHNjb3BlLm9uTW91c2VEb3duID0gZnVuY3Rpb24gKCAkZXZlbnQgKSB7XG4gICAgICAgICAgICAgICAgICAgIHN2Z0RpYWdyYW1Db250cm9sbGVyLm9uQ29tcG9uZW50TW91c2VEb3duKCBzY29wZS5jb21wb25lbnQsICRldmVudCApO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBzeW1ib2xDb21wb25lbnQgPSBzY29wZS5jb21wb25lbnQuc3ltYm9sLnN5bWJvbENvbXBvbmVudCB8fCAnZ2VuZXJpYy1zdmcnO1xuXG4gICAgICAgICAgICAgICAgY29tcGlsZWRTeW1ib2wgPSBkaWFncmFtQ29udGFpbmVyQ29udHJvbGxlci5nZXRDb21waWxlZERpcmVjdGl2ZSggc3ltYm9sQ29tcG9uZW50ICk7XG5cbiAgICAgICAgICAgICAgICBpZiAoICFhbmd1bGFyLmlzRnVuY3Rpb24oIGNvbXBpbGVkU3ltYm9sICkgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVTdHIgPSAnPCcgKyBzeW1ib2xDb21wb25lbnQgKyAnPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvJyArIHN5bWJvbENvbXBvbmVudCArICc+JztcblxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZSA9IGFuZ3VsYXIuZWxlbWVudCggdGVtcGxhdGVTdHIgKTtcblxuICAgICAgICAgICAgICAgICAgICBjb21waWxlZFN5bWJvbCA9ICRjb21waWxlKCB0ZW1wbGF0ZSApO1xuXG4gICAgICAgICAgICAgICAgICAgIGRpYWdyYW1Db250YWluZXJDb250cm9sbGVyLnNldENvbXBpbGVkRGlyZWN0aXZlKCBzeW1ib2xDb21wb25lbnQsIGNvbXBpbGVkU3ltYm9sICk7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAkZWwgPSAkKCBlbGVtZW50ICk7XG5cbiAgICAgICAgICAgICAgICBjb21waWxlZFN5bWJvbCggc2NvcGUsIGZ1bmN0aW9uICggY2xvbmVkRWxlbWVudCApIHtcbiAgICAgICAgICAgICAgICAgICAgJGVsLmZpbmQoICcuc3ltYm9sLXBsYWNlaG9sZGVyJyApXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZVdpdGgoIGNsb25lZEVsZW1lbnQgKTtcbiAgICAgICAgICAgICAgICB9ICk7XG5cbiAgICAgICAgICAgICAgICBzdmdEaWFncmFtQ29udHJvbGxlci5yZWdpc3RlckNvbXBvbmVudEVsZW1lbnQoIHNjb3BlLmNvbXBvbmVudC5pZCwgJGVsICk7XG5cbiAgICAgICAgICAgICAgICBzY29wZS4kb24oICckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgc3ZnRGlhZ3JhbUNvbnRyb2xsZXIudW5yZWdpc3RlckNvbXBvbmVudEVsZW1lbnQoIHNjb3BlLmNvbXBvbmVudC5pZCApO1xuICAgICAgICAgICAgICAgIH0gKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbik7XG5cbnN5bWJvbHNNb2R1bGUuZGlyZWN0aXZlKFxuICAgICdnZW5lcmljU3ZnJyxcblxuICAgIGZ1bmN0aW9uICgpIHtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2NvcGU6IGZhbHNlLFxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy9tbXNBcHAvdGVtcGxhdGVzL2dlbmVyaWNTdmcuaHRtbCcsXG4gICAgICAgICAgICB0ZW1wbGF0ZU5hbWVzcGFjZTogJ1NWRydcbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLypnbG9iYWxzIGFuZ3VsYXIqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmFuZ3VsYXIubW9kdWxlKFxuICAgICdtbXMuZGVzaWduVmlzdWFsaXphdGlvbi5zeW1ib2xzLmRpb2RlJywgW11cbilcbiAgICAuY29uZmlnKCBbICdzeW1ib2xNYW5hZ2VyUHJvdmlkZXInLFxuICAgICAgICBmdW5jdGlvbiAoIHN5bWJvbE1hbmFnZXJQcm92aWRlciApIHtcbiAgICAgICAgICAgIHN5bWJvbE1hbmFnZXJQcm92aWRlci5yZWdpc3RlclN5bWJvbCgge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdkaW9kZScsXG4gICAgICAgICAgICAgICAgZGlyZWN0aXZlOiBudWxsLFxuICAgICAgICAgICAgICAgIHN2Z0RlY29yYXRpb246ICdpbWFnZXMvc3ltYm9scy5zdmcjaWNvbi1kaW9kZScsXG4gICAgICAgICAgICAgICAgbGFiZWxQcmVmaXg6ICdEJyxcbiAgICAgICAgICAgICAgICBsYWJlbFBvc2l0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgIHg6IDEwLFxuICAgICAgICAgICAgICAgICAgICB5OiAtOFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgd2lkdGg6IDYwLFxuICAgICAgICAgICAgICAgIGhlaWdodDogMTUsXG4gICAgICAgICAgICAgICAgcG9ydHM6IFsge1xuICAgICAgICAgICAgICAgICAgICBpZDogJ0MnLFxuICAgICAgICAgICAgICAgICAgICB3aXJlQW5nbGU6IDAsXG4gICAgICAgICAgICAgICAgICAgIHdpcmVMZWFkSW46IDIwLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0MnLFxuICAgICAgICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICAgICAgICB5OiA3XG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBpZDogJ0EnLFxuICAgICAgICAgICAgICAgICAgICB3aXJlQW5nbGU6IDE4MCxcbiAgICAgICAgICAgICAgICAgICAgd2lyZUxlYWRJbjogMjAsXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnQScsXG4gICAgICAgICAgICAgICAgICAgIHg6IDYwLFxuICAgICAgICAgICAgICAgICAgICB5OiA3XG4gICAgICAgICAgICAgICAgfSBdXG4gICAgICAgICAgICB9ICk7XG4gICAgICAgIH1cbiAgICBdICk7IiwiLypnbG9iYWxzIGFuZ3VsYXIqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmFuZ3VsYXIubW9kdWxlKFxuICAgICdtbXMuZGVzaWduVmlzdWFsaXphdGlvbi5zeW1ib2xzLmluZHVjdG9yJywgW11cbilcbiAgICAuY29uZmlnKCBbICdzeW1ib2xNYW5hZ2VyUHJvdmlkZXInLFxuICAgICAgICBmdW5jdGlvbiAoIHN5bWJvbE1hbmFnZXJQcm92aWRlciApIHtcbiAgICAgICAgICAgIHN5bWJvbE1hbmFnZXJQcm92aWRlci5yZWdpc3RlclN5bWJvbCgge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdpbmR1Y3RvcicsXG4gICAgICAgICAgICAgICAgZGlyZWN0aXZlOiBudWxsLFxuICAgICAgICAgICAgICAgIHN2Z0RlY29yYXRpb246ICdpbWFnZXMvc3ltYm9scy5zdmcjaWNvbi1pbmR1Y3RvcicsXG4gICAgICAgICAgICAgICAgbGFiZWxQcmVmaXg6ICdMJyxcbiAgICAgICAgICAgICAgICBsYWJlbFBvc2l0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgIHg6IDEwLFxuICAgICAgICAgICAgICAgICAgICB5OiAtOFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgd2lkdGg6IDUwLFxuICAgICAgICAgICAgICAgIGhlaWdodDogMTAsXG4gICAgICAgICAgICAgICAgcG9ydHM6IFsge1xuICAgICAgICAgICAgICAgICAgICBpZDogJ3AxJyxcbiAgICAgICAgICAgICAgICAgICAgd2lyZUFuZ2xlOiAxODAsXG4gICAgICAgICAgICAgICAgICAgIHdpcmVMZWFkSW46IDIwLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ3AxJyxcbiAgICAgICAgICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgICAgICAgICAgeTogNi41XG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBpZDogJ3AyJyxcbiAgICAgICAgICAgICAgICAgICAgd2lyZUFuZ2xlOiAwLFxuICAgICAgICAgICAgICAgICAgICB3aXJlTGVhZEluOiAyMCxcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdwMicsXG4gICAgICAgICAgICAgICAgICAgIHg6IDUwLFxuICAgICAgICAgICAgICAgICAgICB5OiA2LjVcbiAgICAgICAgICAgICAgICB9IF1cbiAgICAgICAgICAgIH0gKTtcbiAgICAgICAgfVxuICAgIF0gKTsiLCIvKmdsb2JhbHMgYW5ndWxhciovXG5cbid1c2Ugc3RyaWN0JztcblxuYW5ndWxhci5tb2R1bGUoXG4gICAgJ21tcy5kZXNpZ25WaXN1YWxpemF0aW9uLnN5bWJvbHMuakZldFAnLCBbXVxuKVxuICAgIC5jb25maWcoIFsgJ3N5bWJvbE1hbmFnZXJQcm92aWRlcicsXG4gICAgICAgIGZ1bmN0aW9uICggc3ltYm9sTWFuYWdlclByb3ZpZGVyICkge1xuICAgICAgICAgICAgc3ltYm9sTWFuYWdlclByb3ZpZGVyLnJlZ2lzdGVyU3ltYm9sKCB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2pGZXRQJyxcbiAgICAgICAgICAgICAgICBkaXJlY3RpdmU6IG51bGwsXG4gICAgICAgICAgICAgICAgc3ZnRGVjb3JhdGlvbjogJ2ltYWdlcy9zeW1ib2xzLnN2ZyNpY29uLWpGZXRQJyxcbiAgICAgICAgICAgICAgICBsYWJlbFByZWZpeDogJ1EnLFxuICAgICAgICAgICAgICAgIGxhYmVsUG9zaXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgeDogNjAsXG4gICAgICAgICAgICAgICAgICAgIHk6IDEyXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB3aWR0aDogNjIsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiA3MCxcbiAgICAgICAgICAgICAgICBwb3J0czogWyB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiAncycsXG4gICAgICAgICAgICAgICAgICAgIHdpcmVBbmdsZTogMjcwLFxuICAgICAgICAgICAgICAgICAgICB3aXJlTGVhZEluOiAyMCxcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdTJyxcbiAgICAgICAgICAgICAgICAgICAgeDogNDYsXG4gICAgICAgICAgICAgICAgICAgIHk6IDBcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiAnZCcsXG4gICAgICAgICAgICAgICAgICAgIHdpcmVBbmdsZTogOTAsXG4gICAgICAgICAgICAgICAgICAgIHdpcmVMZWFkSW46IDIwLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0QnLFxuICAgICAgICAgICAgICAgICAgICB4OiA0NixcbiAgICAgICAgICAgICAgICAgICAgeTogNzBcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiAnZycsXG4gICAgICAgICAgICAgICAgICAgIHdpcmVBbmdsZTogMTgwLFxuICAgICAgICAgICAgICAgICAgICB3aXJlTGVhZEluOiAyMCxcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdHJyxcbiAgICAgICAgICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgICAgICAgICAgeTogMjZcbiAgICAgICAgICAgICAgICB9IF1cbiAgICAgICAgICAgIH0gKTtcbiAgICAgICAgfVxuICAgIF0gKTsiLCIvKmdsb2JhbHMgYW5ndWxhciovXG5cbid1c2Ugc3RyaWN0JztcblxuYW5ndWxhci5tb2R1bGUoXG4gICAgJ21tcy5kZXNpZ25WaXN1YWxpemF0aW9uLnN5bWJvbHMub3BBbXAnLCBbXVxuKVxuICAgIC5jb25maWcoIFsgJ3N5bWJvbE1hbmFnZXJQcm92aWRlcicsXG4gICAgICAgIGZ1bmN0aW9uICggc3ltYm9sTWFuYWdlclByb3ZpZGVyICkge1xuICAgICAgICAgICAgc3ltYm9sTWFuYWdlclByb3ZpZGVyLnJlZ2lzdGVyU3ltYm9sKCB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ29wQW1wJyxcbiAgICAgICAgICAgICAgICBkaXJlY3RpdmU6IG51bGwsXG4gICAgICAgICAgICAgICAgc3ZnRGVjb3JhdGlvbjogJ2ltYWdlcy9zeW1ib2xzLnN2ZyNpY29uLW9wQW1wJyxcbiAgICAgICAgICAgICAgICBsYWJlbFByZWZpeDogJ0EnLFxuICAgICAgICAgICAgICAgIGxhYmVsUG9zaXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgeDogOTAsXG4gICAgICAgICAgICAgICAgICAgIHk6IDE1XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB3aWR0aDogMTQwLFxuICAgICAgICAgICAgICAgIGhlaWdodDogMTAwLFxuICAgICAgICAgICAgICAgIHBvcnRzOiBbIHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6ICdWcysnLFxuICAgICAgICAgICAgICAgICAgICB3aXJlQW5nbGU6IDI3MCxcbiAgICAgICAgICAgICAgICAgICAgd2lyZUxlYWRJbjogMjAsXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnVnMrJyxcbiAgICAgICAgICAgICAgICAgICAgeDogNjUsXG4gICAgICAgICAgICAgICAgICAgIHk6IDBcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiAnVm91dCcsXG4gICAgICAgICAgICAgICAgICAgIHdpcmVBbmdsZTogMCxcbiAgICAgICAgICAgICAgICAgICAgd2lyZUxlYWRJbjogMjAsXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnVm91dCcsXG4gICAgICAgICAgICAgICAgICAgIHg6IDE0MCxcbiAgICAgICAgICAgICAgICAgICAgeTogNTBcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiAnVnMtJyxcbiAgICAgICAgICAgICAgICAgICAgd2lyZUFuZ2xlOiA5MCxcbiAgICAgICAgICAgICAgICAgICAgd2lyZUxlYWRJbjogMjAsXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnVnMtJyxcbiAgICAgICAgICAgICAgICAgICAgeDogNjUsXG4gICAgICAgICAgICAgICAgICAgIHk6IDEwMFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6ICdWLScsXG4gICAgICAgICAgICAgICAgICAgIHdpcmVBbmdsZTogMTgwLFxuICAgICAgICAgICAgICAgICAgICB3aXJlTGVhZEluOiAyMCxcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdWLScsXG4gICAgICAgICAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICAgICAgICAgIHk6IDc1XG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBpZDogJ1YrJyxcbiAgICAgICAgICAgICAgICAgICAgd2lyZUFuZ2xlOiAxODAsXG4gICAgICAgICAgICAgICAgICAgIHdpcmVMZWFkSW46IDIwLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ1YrJyxcbiAgICAgICAgICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgICAgICAgICAgeTogMjVcbiAgICAgICAgICAgICAgICB9IF1cbiAgICAgICAgICAgIH0gKTtcbiAgICAgICAgfVxuICAgIF0gKTsiLCIvKmdsb2JhbHMgYW5ndWxhciovXG5cbid1c2Ugc3RyaWN0JztcblxuYW5ndWxhci5tb2R1bGUoXG4gICAgJ21tcy5kZXNpZ25WaXN1YWxpemF0aW9uLnN5bWJvbHMucmVzaXN0b3InLCBbXVxuKVxuICAgIC5jb25maWcoIFsgJ3N5bWJvbE1hbmFnZXJQcm92aWRlcicsXG4gICAgICAgIGZ1bmN0aW9uICggc3ltYm9sTWFuYWdlclByb3ZpZGVyICkge1xuICAgICAgICAgICAgc3ltYm9sTWFuYWdlclByb3ZpZGVyLnJlZ2lzdGVyU3ltYm9sKCB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3Jlc2lzdG9yJyxcbiAgICAgICAgICAgICAgICBzeW1ib2xDb21wb25lbnQ6IG51bGwsXG4gICAgICAgICAgICAgICAgc3ZnRGVjb3JhdGlvbjogJ2ltYWdlcy9zeW1ib2xzLnN2ZyNpY29uLXJlc2lzdG9yJyxcbiAgICAgICAgICAgICAgICBsYWJlbFByZWZpeDogJ1InLFxuICAgICAgICAgICAgICAgIGxhYmVsUG9zaXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgeDogMTAsXG4gICAgICAgICAgICAgICAgICAgIHk6IC04XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB3aWR0aDogNjAsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAxMCxcbiAgICAgICAgICAgICAgICBwb3J0czogWyB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiAncDEnLFxuICAgICAgICAgICAgICAgICAgICB3aXJlQW5nbGU6IDE4MCxcbiAgICAgICAgICAgICAgICAgICAgd2lyZUxlYWRJbjogMjAsXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAncDEnLFxuICAgICAgICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICAgICAgICB5OiA1XG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBpZDogJ3AyJyxcbiAgICAgICAgICAgICAgICAgICAgd2lyZUFuZ2xlOiAwLFxuICAgICAgICAgICAgICAgICAgICB3aXJlTGVhZEluOiAyMCxcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdwMicsXG4gICAgICAgICAgICAgICAgICAgIHg6IDYwLFxuICAgICAgICAgICAgICAgICAgICB5OiA1XG4gICAgICAgICAgICAgICAgfSBdXG4gICAgICAgICAgICB9ICk7XG4gICAgICAgIH1cbiAgICBdICk7IiwiLypnbG9iYWxzIGFuZ3VsYXIqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBnbE1hdHJpeCA9IHJlcXVpcmUoICdnbE1hdHJpeCcgKTtcblxudmFyIENvbXBvbmVudFBvcnQgPSBmdW5jdGlvbiAoIGRlc2NyaXB0b3IgKSB7XG5cbiAgICBhbmd1bGFyLmV4dGVuZCggdGhpcywgZGVzY3JpcHRvciApO1xuXG59O1xuXG5Db21wb25lbnRQb3J0LnByb3RvdHlwZS5nZXRHcmlkUG9zaXRpb24gPSBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgcG9zaXRpb24sXG4gICAgICAgIHBvc2l0aW9uVmVjdG9yO1xuXG4gICAgaWYgKCBhbmd1bGFyLmlzT2JqZWN0KCB0aGlzLnBvcnRTeW1ib2wgKSAmJiBhbmd1bGFyLmlzT2JqZWN0KCB0aGlzLnBhcmVudENvbXBvbmVudCApICkge1xuXG4gICAgICAgIHBvc2l0aW9uVmVjdG9yID0gZ2xNYXRyaXgudmVjMi5jcmVhdGUoKTtcbiAgICAgICAgZ2xNYXRyaXgudmVjMi5zZXQoIHBvc2l0aW9uVmVjdG9yLCB0aGlzLnBvcnRTeW1ib2wueCwgdGhpcy5wb3J0U3ltYm9sLnkgKTtcblxuICAgICAgICBnbE1hdHJpeC52ZWMyLnRyYW5zZm9ybU1hdDMoIHBvc2l0aW9uVmVjdG9yLCBwb3NpdGlvblZlY3RvciwgdGhpcy5wYXJlbnRDb21wb25lbnQuZ2V0VHJhbnNmb3JtYXRpb25NYXRyaXgoKSApO1xuXG4gICAgICAgIHBvc2l0aW9uID0ge1xuXG4gICAgICAgICAgICB4OiBwb3NpdGlvblZlY3RvclsgMCBdLFxuICAgICAgICAgICAgeTogcG9zaXRpb25WZWN0b3JbIDEgXVxuXG4gICAgICAgIH07XG5cbiAgICB9XG5cbiAgICByZXR1cm4gcG9zaXRpb247XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50UG9ydDsiLCIvKmdsb2JhbHMgYW5ndWxhciovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGdsTWF0cml4ID0gcmVxdWlyZSggJ2dsTWF0cml4JyApO1xuXG52YXIgRGlhZ3JhbUNvbXBvbmVudCA9IGZ1bmN0aW9uICggZGVzY3JpcHRvciApIHtcblxuICAgIGlmICggIWFuZ3VsYXIuaXNPYmplY3QoIGRlc2NyaXB0b3Iuc3ltYm9sICkgKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvciggJ05vIHN5bWJvbCBmb3VuZCBmb3IgY29tcG9uZW50ICcgKyB0aGlzLmlkICk7XG4gICAgfVxuXG4gICAgYW5ndWxhci5leHRlbmQoIHRoaXMsIGRlc2NyaXB0b3IgKTtcblxufTtcblxuRGlhZ3JhbUNvbXBvbmVudC5wcm90b3R5cGUuaXNJblZpZXdQb3J0ID0gZnVuY3Rpb24gKCB2aWV3UG9ydCwgcGFkZGluZyApIHtcblxuICAgIC8vVE9ETzogY291bnQgd2lkdGggYW5kIGhlaWdodCBmb3Igb3JpZW50YXRpb25cbiAgICBwYWRkaW5nID0gcGFkZGluZyB8fCB7XG4gICAgICAgIHg6IDAsXG4gICAgICAgIHk6IDBcbiAgICB9O1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgYW5ndWxhci5pc09iamVjdCggdmlld1BvcnQgKSAmJlxuICAgICAgICB0aGlzLnggKyB0aGlzLnN5bWJvbC53aWR0aCA+PSAoIHZpZXdQb3J0LmxlZnQgKyBwYWRkaW5nLnggKSAmJlxuICAgICAgICB0aGlzLnggPD0gKCB2aWV3UG9ydC5yaWdodCAtIHBhZGRpbmcueCApICYmXG4gICAgICAgIHRoaXMueSArIHRoaXMuc3ltYm9sLmhlaWdodCA+PSAoIHZpZXdQb3J0LnRvcCArIHBhZGRpbmcueSApICYmXG4gICAgICAgIHRoaXMueSA8PSAoIHZpZXdQb3J0LmJvdHRvbSAtIHBhZGRpbmcueSApICk7XG59O1xuXG5EaWFncmFtQ29tcG9uZW50LnByb3RvdHlwZS5nZXRUcmFuc2Zvcm1hdGlvbk1hdHJpeCA9IGZ1bmN0aW9uICgpIHtcblxuICAgIGlmICggIWFuZ3VsYXIuaXNBcnJheSggdGhpcy50cmFuc2Zvcm1hdGlvbk1hdHJpeCApICkge1xuICAgICAgICB0aGlzLnVwZGF0ZVRyYW5zZm9ybWF0aW9uTWF0cml4KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtYXRpb25NYXRyaXg7XG5cbn07XG5cblxuRGlhZ3JhbUNvbXBvbmVudC5wcm90b3R5cGUuZ2V0U1ZHVHJhbnNmb3JtYXRpb25NYXRyaXggPSBmdW5jdGlvbiAoKSB7XG5cbiAgICBpZiAoICFhbmd1bGFyLmlzQXJyYXkoIHRoaXMuc3ZnVHJhbnNmb3JtYXRpb25NYXRyaXggKSApIHtcbiAgICAgICAgdGhpcy51cGRhdGVUcmFuc2Zvcm1hdGlvbk1hdHJpeCgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnN2Z1RyYW5zZm9ybWF0aW9uTWF0cml4O1xuXG59O1xuXG5EaWFncmFtQ29tcG9uZW50LnByb3RvdHlwZS5nZXRTVkdUcmFuc2Zvcm1hdGlvblN0cmluZyA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciB0cmFuc01hdHJpeCA9IHRoaXMuZ2V0U1ZHVHJhbnNmb3JtYXRpb25NYXRyaXgoKTtcblxuICAgIHJldHVybiB0cmFuc01hdHJpeC5qb2luKCAnLCAnICk7XG59O1xuXG5EaWFncmFtQ29tcG9uZW50LnByb3RvdHlwZS51cGRhdGVUcmFuc2Zvcm1hdGlvbk1hdHJpeCA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciByb3RhdGlvblJhZCxcbiAgICAgICAgLy9zaW5BLCBjb3NBLFxuICAgICAgICB0cmFuc2xhdGlvbixcbiAgICAgICAgdHJhbnNmb3JtTWF0MyxcbiAgICAgICAgcmVzdWx0O1xuXG4gICAgaWYgKCBhbmd1bGFyLmlzTnVtYmVyKCB0aGlzLnJvdGF0aW9uICkgJiZcbiAgICAgICAgYW5ndWxhci5pc051bWJlciggdGhpcy54ICksXG4gICAgICAgIGFuZ3VsYXIuaXNOdW1iZXIoIHRoaXMueSApICkge1xuXG4gICAgICAgIHJvdGF0aW9uUmFkID0gdGhpcy5yb3RhdGlvbiAvIDE4MCAqIE1hdGguUEk7XG5cbiAgICAgICAgdHJhbnNmb3JtTWF0MyA9IGdsTWF0cml4Lm1hdDMuY3JlYXRlKCk7XG5cbiAgICAgICAgdHJhbnNsYXRpb24gPSBnbE1hdHJpeC52ZWMyLmNyZWF0ZSgpO1xuICAgICAgICBnbE1hdHJpeC52ZWMyLnNldCggdHJhbnNsYXRpb24sIHRoaXMueCwgdGhpcy55ICk7XG5cbiAgICAgICAgZ2xNYXRyaXgubWF0My50cmFuc2xhdGUoXG4gICAgICAgICAgICB0cmFuc2Zvcm1NYXQzLFxuICAgICAgICAgICAgdHJhbnNmb3JtTWF0MyxcbiAgICAgICAgICAgIHRyYW5zbGF0aW9uXG4gICAgICAgICk7XG5cbiAgICAgICAgZ2xNYXRyaXgubWF0My5yb3RhdGUoXG4gICAgICAgICAgICB0cmFuc2Zvcm1NYXQzLFxuICAgICAgICAgICAgdHJhbnNmb3JtTWF0MyxcbiAgICAgICAgICAgIHJvdGF0aW9uUmFkXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gICAgc2luQSA9IE1hdGguc2luKHJvdGF0aW9uUmFkKTtcbiAgICAgICAgLy8gICAgY29zQSA9IE1hdGguY29zKHJvdGF0aW9uUmFkKTtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gICAgdGhpcy50cmFuc2Zvcm1hdGlvbk1hdHJpeCA9IFtcbiAgICAgICAgLy8gICAgICB0aGlzLnNjYWxlWCAqIGNvc0EsXG4gICAgICAgIC8vICAgICAgc2luQSxcbiAgICAgICAgLy8gICAgICAtc2luQSxcbiAgICAgICAgLy8gICAgICB0aGlzLnNjYWxlWSAqIGNvc0EsXG4gICAgICAgIC8vICAgICAgdGhpcy54LFxuICAgICAgICAvLyAgICAgIHRoaXMueVxuICAgICAgICAvLyAgICBdO1xuXG4gICAgICAgIHRoaXMudHJhbnNmb3JtYXRpb25NYXRyaXggPSB0cmFuc2Zvcm1NYXQzO1xuXG4gICAgICAgIHRoaXMuc3ZnVHJhbnNmb3JtYXRpb25NYXRyaXggPSBbXG4gICAgICAgICAgICB0cmFuc2Zvcm1NYXQzWyAwIF0sXG4gICAgICAgICAgICB0cmFuc2Zvcm1NYXQzWyAxIF0sXG4gICAgICAgICAgICB0cmFuc2Zvcm1NYXQzWyAzIF0sXG4gICAgICAgICAgICB0cmFuc2Zvcm1NYXQzWyA0IF0sXG4gICAgICAgICAgICB0cmFuc2Zvcm1NYXQzWyA2IF0sXG4gICAgICAgICAgICB0cmFuc2Zvcm1NYXQzWyA3IF1cbiAgICAgICAgXTtcblxuICAgICAgICByZXN1bHQgPSB0aGlzLnRyYW5zZm9ybWF0aW9uTWF0cml4O1xuXG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcblxufTtcblxuRGlhZ3JhbUNvbXBvbmVudC5wcm90b3R5cGUuc2V0UG9zaXRpb24gPSBmdW5jdGlvbiAoIHgsIHkgKSB7XG5cbiAgICBpZiAoIGFuZ3VsYXIuaXNOdW1iZXIoIHggKSAmJiBhbmd1bGFyLmlzTnVtYmVyKCB5ICkgKSB7XG5cbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcblxuICAgICAgICB0aGlzLnVwZGF0ZVRyYW5zZm9ybWF0aW9uTWF0cml4KCk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdDb29yZGluYXRlcyBtdXN0IGJlIG51bWJlcnMhJyApO1xuICAgIH1cbn07XG5cbkRpYWdyYW1Db21wb25lbnQucHJvdG90eXBlLnJvdGF0ZSA9IGZ1bmN0aW9uICggYW5nbGUgKSB7XG5cbiAgICBpZiAoIGFuZ3VsYXIuaXNOdW1iZXIoIGFuZ2xlICkgKSB7XG5cbiAgICAgICAgdGhpcy5yb3RhdGlvbiArPSBhbmdsZTtcblxuICAgICAgICB0aGlzLnVwZGF0ZVRyYW5zZm9ybWF0aW9uTWF0cml4KCk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdBbmdsZSBtdXN0IGJlIG51bWJlciEnICk7XG4gICAgfVxufTtcblxuRGlhZ3JhbUNvbXBvbmVudC5wcm90b3R5cGUucmVnaXN0ZXJQb3J0SW5zdGFuY2VzID0gZnVuY3Rpb24gKCBuZXdQb3J0cyApIHtcblxuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHRoaXMucG9ydEluc3RhbmNlcyA9IHRoaXMucG9ydEluc3RhbmNlcyB8fCBbXTtcblxuICAgIGFuZ3VsYXIuZm9yRWFjaCggbmV3UG9ydHMsIGZ1bmN0aW9uICggbmV3UG9ydCApIHtcblxuICAgICAgICBuZXdQb3J0LnBhcmVudENvbXBvbmVudCA9IHNlbGY7XG4gICAgICAgIHNlbGYucG9ydEluc3RhbmNlcy5wdXNoKCBuZXdQb3J0ICk7XG5cbiAgICB9ICk7XG59O1xuXG5EaWFncmFtQ29tcG9uZW50LnByb3RvdHlwZS5nZXRUcmFuc2Zvcm1lZERpbWVuc2lvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gIHZhciB3aWR0aCwgaGVpZ2h0O1xufTtcblxuRGlhZ3JhbUNvbXBvbmVudC5wcm90b3R5cGUubG9jYWxUb0dsb2JhbCA9IGZ1bmN0aW9uICgpIHtcblxuICAgIGlmICggIXRoaXMudHJhbnNmb3JtYXRpb25NYXRyaXggKSB7XG4gICAgICAgIHRoaXMudHJhbnNmb3JtYXRpb25NYXRyaXggPSB0aGlzLmdldFRyYW5zZm9ybWF0aW9uTWF0cml4KCk7XG4gICAgfVxuXG5cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBEaWFncmFtQ29tcG9uZW50OyIsIi8qZ2xvYmFscyBhbmd1bGFyKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgV2lyZSA9IGZ1bmN0aW9uICggZGVzY3JpcHRvciApIHtcblxuICAgIGFuZ3VsYXIuZXh0ZW5kKCB0aGlzLCBkZXNjcmlwdG9yICk7XG5cbiAgICB0aGlzLnNlZ21lbnRzID0gW107XG5cbn07XG5cbldpcmUucHJvdG90eXBlLmlzSW5WaWV3UG9ydCA9IGZ1bmN0aW9uICggdmlld1BvcnQsIHBhZGRpbmcgKSB7XG5cbiAgICB2YXIgaixcbiAgICAgICAgc2hvdWxkQmVWaXNpYmxlLFxuICAgICAgICBzZWdtZW50O1xuXG4gICAgcGFkZGluZyA9IHBhZGRpbmcgfHwge1xuICAgICAgICB4OiAwLFxuICAgICAgICB5OiAwXG4gICAgfTtcblxuICAgIHNob3VsZEJlVmlzaWJsZSA9IGZhbHNlO1xuXG4gICAgaWYgKCB0aGlzLnJvdXRlclR5cGUgPT09ICdFbGJvd1JvdXRlcicgKSB7XG5cbiAgICAgICAgaWYgKCBhbmd1bGFyLmlzQXJyYXkoIHRoaXMuc2VnbWVudHMgKSApIHtcblxuICAgICAgICAgICAgZm9yICggaiA9IDA7IGogPCB0aGlzLnNlZ21lbnRzLmxlbmd0aCAmJiAhc2hvdWxkQmVWaXNpYmxlOyBqKysgKSB7XG5cbiAgICAgICAgICAgICAgICBzZWdtZW50ID0gdGhpcy5zZWdtZW50c1sgaiBdO1xuXG4gICAgICAgICAgICAgICAgaWYgKCBzZWdtZW50Lm9yaWVudGF0aW9uID09PSAndmVydGljYWwnICkge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICggc2VnbWVudC54MSA+PSAoIHZpZXdQb3J0LmxlZnQgKyBwYWRkaW5nLnggKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgc2VnbWVudC54MSA8PSAoIHZpZXdQb3J0LnJpZ2h0IC0gcGFkZGluZy54ICkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaG91bGRCZVZpc2libGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICggc2VnbWVudC55MSA+PSAoIHZpZXdQb3J0LnRvcCArIHBhZGRpbmcueSApICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWdtZW50LnkxIDw9ICggdmlld1BvcnQuYm90dG9tIC0gcGFkZGluZy55ICkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaG91bGRCZVZpc2libGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgICBzaG91bGRCZVZpc2libGUgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBzaG91bGRCZVZpc2libGU7XG5cbn07XG5cbldpcmUucHJvdG90eXBlLmdldEVuZFBvc2l0aW9ucyA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBwb3J0MVBvc2l0aW9uLFxuICAgICAgICBwb3J0MlBvc2l0aW9uO1xuXG4gICAgcG9ydDFQb3NpdGlvbiA9IHRoaXMuZW5kMS5wb3J0LmdldEdyaWRQb3NpdGlvbigpO1xuICAgIHBvcnQyUG9zaXRpb24gPSB0aGlzLmVuZDIucG9ydC5nZXRHcmlkUG9zaXRpb24oKTtcblxuICAgIHJldHVybiB7XG5cbiAgICAgICAgZW5kMTogcG9ydDFQb3NpdGlvbixcbiAgICAgICAgZW5kMjogcG9ydDJQb3NpdGlvblxuXG4gICAgfTtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBXaXJlOyIsIi8qZ2xvYmFscyBhbmd1bGFyICovXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gTW92ZSB0aGlzIHRvIEdNRSBldmVudHVhbGx5XG5cbmFuZ3VsYXIubW9kdWxlKCAnbW1zLmRlc2lnblZpc3VhbGl6YXRpb24uZGlhZ3JhbVNlcnZpY2UnLCBbXG4gICAgJ21tcy5kZXNpZ25WaXN1YWxpemF0aW9uLnN5bWJvbFNlcnZpY2VzJ1xuXSApXG4gICAgLmNvbmZpZyggWyAnc3ltYm9sTWFuYWdlclByb3ZpZGVyJyxcbiAgICAgICAgZnVuY3Rpb24gKCBzeW1ib2xNYW5hZ2VyUHJvdmlkZXIgKSB7XG5cbiAgICAgICAgICAgIHZhciByYW5kb21TeW1ib2xHZW5lcmF0b3IsXG4gICAgICAgICAgICAgICAga2luZHMgPSA3O1xuXG4gICAgICAgICAgICByYW5kb21TeW1ib2xHZW5lcmF0b3IgPSBmdW5jdGlvbiAoIGNvdW50ICkge1xuXG4gICAgICAgICAgICAgICAgdmFyIGksXG4gICAgICAgICAgICAgICAgICAgIHBvcnRDb3VudCxcbiAgICAgICAgICAgICAgICAgICAgc3ltYm9sLFxuICAgICAgICAgICAgICAgICAgICBtYWtlQVJhbmRvbVN5bWJvbCxcbiAgICAgICAgICAgICAgICAgICAgbWFrZVNvbWVQb3J0cyxcbiAgICAgICAgICAgICAgICAgICAgbWluUG9ydHMgPSA2LFxuICAgICAgICAgICAgICAgICAgICBtYXhQb3J0cyA9IDMwLFxuICAgICAgICAgICAgICAgICAgICBwb3J0V2lyZUxlbmd0aCA9IDIwLFxuXG4gICAgICAgICAgICAgICAgICAgIHNwcmVhZFBvcnRzQWxvbmdTaWRlO1xuXG4gICAgICAgICAgICAgICAgc3ByZWFkUG9ydHNBbG9uZ1NpZGUgPSBmdW5jdGlvbiAoIHNvbWVQb3J0cywgc2lkZSwgd2lkdGgsIGhlaWdodCApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9mZnNldCA9IDIgKiBwb3J0V2lyZUxlbmd0aDtcblxuICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goIHNvbWVQb3J0cywgZnVuY3Rpb24gKCBhUG9ydCApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoICggc2lkZSApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndG9wJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhUG9ydC54ID0gb2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFQb3J0LnkgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFQb3J0LndpcmVBbmdsZSA9IC05MDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCArPSB3aWR0aCAvICggc29tZVBvcnRzLmxlbmd0aCArIDIgKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYVBvcnQueCA9IHdpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFQb3J0LnkgPSBvZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYVBvcnQud2lyZUFuZ2xlID0gMDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCArPSBoZWlnaHQgLyAoIHNvbWVQb3J0cy5sZW5ndGggKyAyICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnYm90dG9tJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhUG9ydC54ID0gb2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFQb3J0LnkgPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYVBvcnQud2lyZUFuZ2xlID0gOTA7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQgKz0gd2lkdGggLyAoIHNvbWVQb3J0cy5sZW5ndGggKyAyICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYVBvcnQueCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYVBvcnQueSA9IG9mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhUG9ydC53aXJlQW5nbGUgPSAxODA7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQgKz0gaGVpZ2h0IC8gKCBzb21lUG9ydHMubGVuZ3RoICsgMiApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB9ICk7XG5cbiAgICAgICAgICAgICAgICB9O1xuXG5cbiAgICAgICAgICAgICAgICBtYWtlU29tZVBvcnRzID0gZnVuY3Rpb24gKCBjb3VudE9mUG9ydHMgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvcnRzID0gW10sXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3J0LFxuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2VtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcCA9IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvdHRvbSA9IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdCA9IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGgsIGhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZGVzID0gWyB0b3AsIHJpZ2h0LCBib3R0b20sIGxlZnQgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcnRTcGFjaW5nID0gMjAsXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aCA9IDE0MCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbkhlaWdodCA9IDgwO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIGkgPSAwOyBpIDwgY291bnRPZlBvcnRzOyBpKysgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcnQgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6ICdwXycgKyBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnUG9ydC0nICsgaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aXJlTGVhZEluOiAyMFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2VtZW50ID0gTWF0aC5yb3VuZCggTWF0aC5yYW5kb20oKSAqIDMgKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2lkZXNbIHBsYWNlbWVudCBdLnB1c2goIHBvcnQgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoID0gTWF0aC5tYXgoXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3J0U3BhY2luZyAqIHRvcC5sZW5ndGggKyA0ICogcG9ydFdpcmVMZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3J0U3BhY2luZyAqIGJvdHRvbS5sZW5ndGggKyA0ICogcG9ydFdpcmVMZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aFxuICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IE1hdGgubWF4KFxuICAgICAgICAgICAgICAgICAgICAgICAgcG9ydFNwYWNpbmcgKiBsZWZ0Lmxlbmd0aCArIDQgKiBwb3J0V2lyZUxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcnRTcGFjaW5nICogcmlnaHQubGVuZ3RoICsgNCAqIHBvcnRXaXJlTGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWluSGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgICAgc3ByZWFkUG9ydHNBbG9uZ1NpZGUoIHRvcCwgJ3RvcCcsIHdpZHRoLCBoZWlnaHQgKTtcbiAgICAgICAgICAgICAgICAgICAgc3ByZWFkUG9ydHNBbG9uZ1NpZGUoIHJpZ2h0LCAncmlnaHQnLCB3aWR0aCwgaGVpZ2h0ICk7XG4gICAgICAgICAgICAgICAgICAgIHNwcmVhZFBvcnRzQWxvbmdTaWRlKCBib3R0b20sICdib3R0b20nLCB3aWR0aCwgaGVpZ2h0ICk7XG4gICAgICAgICAgICAgICAgICAgIHNwcmVhZFBvcnRzQWxvbmdTaWRlKCBsZWZ0LCAnbGVmdCcsIHdpZHRoLCBoZWlnaHQgKTtcblxuXG4gICAgICAgICAgICAgICAgICAgIHBvcnRzID0gcG9ydHMuY29uY2F0KCB0b3AgKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNvbmNhdCggcmlnaHQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNvbmNhdCggYm90dG9tIClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jb25jYXQoIGxlZnQgKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9ydHM6IHBvcnRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBtYWtlQVJhbmRvbVN5bWJvbCA9IGZ1bmN0aW9uICggaWRQb3N0Zml4LCBjb3VudE9mUG9ydHMgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvcnRzQW5kU2l6ZXMgPSBtYWtlU29tZVBvcnRzKCBjb3VudE9mUG9ydHMgKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgc3ltYm9sID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3JhbmRvbV8nICsgaWRQb3N0Zml4LFxuICAgICAgICAgICAgICAgICAgICAgICAgc3ltYm9sQ29tcG9uZW50OiAnYm94JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN2Z0RlY29yYXRpb246IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbFByZWZpeDogJ1JORF8nICsgY291bnRPZlBvcnRzICsgJ18nICsgaWRQb3N0Zml4ICsgJyAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWxQb3NpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHBvcnRXaXJlTGVuZ3RoICsgMTAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogcG9ydFdpcmVMZW5ndGggKyAyMFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcnRXaXJlTGVuZ3RoOiBwb3J0V2lyZUxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBwb3J0c0FuZFNpemVzLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBwb3J0c0FuZFNpemVzLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcnRzOiBwb3J0c0FuZFNpemVzLnBvcnRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgYm94SGVpZ2h0OiBwb3J0c0FuZFNpemVzLmhlaWdodCAtIDIgKiBwb3J0V2lyZUxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJveFdpZHRoOiBwb3J0c0FuZFNpemVzLndpZHRoIC0gMiAqIHBvcnRXaXJlTGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICBkZWJ1Z2dlcjtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3ltYm9sO1xuXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGZvciAoIGkgPSAwOyBpIDwgY291bnQ7IGkrKyApIHtcblxuICAgICAgICAgICAgICAgICAgICBwb3J0Q291bnQgPSBNYXRoLm1heChcbiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguZmxvb3IoIE1hdGgucmFuZG9tKCkgKiBtYXhQb3J0cyApLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWluUG9ydHNcbiAgICAgICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgICAgICBzeW1ib2wgPSBtYWtlQVJhbmRvbVN5bWJvbCggaSwgcG9ydENvdW50ICk7XG5cbiAgICAgICAgICAgICAgICAgICAgc3ltYm9sTWFuYWdlclByb3ZpZGVyLnJlZ2lzdGVyU3ltYm9sKCBzeW1ib2wgKTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmFuZG9tU3ltYm9sR2VuZXJhdG9yKCBraW5kcyApO1xuXG4gICAgICAgIH1cbiAgICBdIClcbiAgICAuc2VydmljZSggJ2RpYWdyYW1TZXJ2aWNlJywgW1xuICAgICAgICAnJHEnLFxuICAgICAgICAnJHRpbWVvdXQnLFxuICAgICAgICAnc3ltYm9sTWFuYWdlcicsXG4gICAgICAgICd3aXJpbmdTZXJ2aWNlJyxcbiAgICAgICAgZnVuY3Rpb24gKCAkcSwgJHRpbWVvdXQsIHN5bWJvbE1hbmFnZXIsIHdpcmluZ1NlcnZpY2UgKSB7XG5cbiAgICAgICAgICAgIHZhclxuICAgICAgICAgICAgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgICAgICAgY29tcG9uZW50cyA9IFtdLFxuICAgICAgICAgICAgICAgIGNvbXBvbmVudHNCeUlkID0ge30sXG5cbiAgICAgICAgICAgICAgICB3aXJlcyA9IFtdLFxuICAgICAgICAgICAgICAgIHdpcmVzQnlJZCA9IHt9LFxuICAgICAgICAgICAgICAgIHdpcmVzQnlDb21wb25lbnRJZCA9IHt9LFxuXG4gICAgICAgICAgICAgICAgc3ltYm9sVHlwZXMsXG5cbiAgICAgICAgICAgICAgICByZWdpc3RlcldpcmVGb3JFbmRzLFxuXG4gICAgICAgICAgICAgICAgRGlhZ3JhbUNvbXBvbmVudCA9IHJlcXVpcmUoICcuL2NsYXNzZXMvRGlhZ3JhbUNvbXBvbmVudC5qcycgKSxcbiAgICAgICAgICAgICAgICBDb21wb25lbnRQb3J0ID0gcmVxdWlyZSggJy4vY2xhc3Nlcy9Db21wb25lbnRQb3J0JyApLFxuICAgICAgICAgICAgICAgIFdpcmUgPSByZXF1aXJlKCAnLi9jbGFzc2VzL1dpcmUuanMnICk7XG5cbiAgICAgICAgICAgIHN5bWJvbFR5cGVzID0gc3ltYm9sTWFuYWdlci5nZXRBdmFpbGFibGVTeW1ib2xzKCk7XG5cbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVEdW1teURpYWdyYW0gPSBmdW5jdGlvbiAoIGNvdW50T2ZCb3hlcywgY291bnRPZldpcmVzLCBjYW52YXNXaWR0aCwgY2FudmFzSGVpZ2h0ICkge1xuXG4gICAgICAgICAgICAgICAgdmFyIGksIGlkLFxuICAgICAgICAgICAgICAgICAgICBjb3VudE9mVHlwZXMsXG4gICAgICAgICAgICAgICAgICAgIHN5bWJvbCxcbiAgICAgICAgICAgICAgICAgICAgdHlwZUlkLFxuICAgICAgICAgICAgICAgICAgICB0eXBlLFxuICAgICAgICAgICAgICAgICAgICB4LFxuICAgICAgICAgICAgICAgICAgICB5LFxuICAgICAgICAgICAgICAgICAgICBzeW1ib2xUeXBlSWRzLFxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQxLFxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQyLFxuICAgICAgICAgICAgICAgICAgICBwb3J0MSxcbiAgICAgICAgICAgICAgICAgICAgcG9ydDIsXG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZWRQb3J0cyxcbiAgICAgICAgICAgICAgICAgICAgbmV3RGlhZ3JhbUNvbXBvbmVudCxcblxuICAgICAgICAgICAgICAgICAgICBwb3J0Q3JlYXRvcixcblxuICAgICAgICAgICAgICAgICAgICB3aXJlO1xuXG4gICAgICAgICAgICAgICAgcG9ydENyZWF0b3IgPSBmdW5jdGlvbiAoIGNvbXBvbmVudElkLCBwb3J0cyApIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgcG9ydEluc3RhbmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgcG9ydEluc3RhbmNlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcnRNYXBwaW5nO1xuXG4gICAgICAgICAgICAgICAgICAgIHBvcnRJbnN0YW5jZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgcG9ydE1hcHBpbmcgPSB7fTtcblxuICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goIHBvcnRzLCBmdW5jdGlvbiAoIHBvcnQgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcnRJbnN0YW5jZSA9IG5ldyBDb21wb25lbnRQb3J0KCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGNvbXBvbmVudElkICsgJ18nICsgcG9ydC5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3J0U3ltYm9sOiBwb3J0XG4gICAgICAgICAgICAgICAgICAgICAgICB9ICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcnRJbnN0YW5jZXMucHVzaCggcG9ydEluc3RhbmNlICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcnRNYXBwaW5nWyBwb3J0LmlkIF0gPSBwb3J0SW5zdGFuY2UuaWQ7XG4gICAgICAgICAgICAgICAgICAgIH0gKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9ydEluc3RhbmNlczogcG9ydEluc3RhbmNlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcnRNYXBwaW5nOiBwb3J0TWFwcGluZ1xuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHN5bWJvbFR5cGVJZHMgPSBPYmplY3Qua2V5cyggc3ltYm9sVHlwZXMgKTtcblxuICAgICAgICAgICAgICAgIGNvdW50T2ZUeXBlcyA9IHN5bWJvbFR5cGVJZHMubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgY29tcG9uZW50cyA9IFtdO1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudHNCeUlkID0ge307XG5cbiAgICAgICAgICAgICAgICBmb3IgKCBpID0gMDsgaSA8IGNvdW50T2ZCb3hlczsgaSsrICkge1xuXG4gICAgICAgICAgICAgICAgICAgIHR5cGVJZCA9IHN5bWJvbFR5cGVJZHNbIE1hdGguZmxvb3IoIE1hdGgucmFuZG9tKCkgKiBjb3VudE9mVHlwZXMgKSBdO1xuICAgICAgICAgICAgICAgICAgICB0eXBlID0gc3ltYm9sVHlwZXNbIHR5cGVJZCBdO1xuXG4gICAgICAgICAgICAgICAgICAgIHggPSBNYXRoLnJvdW5kKCBNYXRoLnJhbmRvbSgpICogKCBjYW52YXNXaWR0aCAtIDEgKSApO1xuICAgICAgICAgICAgICAgICAgICB5ID0gTWF0aC5yb3VuZCggTWF0aC5yYW5kb20oKSAqICggY2FudmFzSGVpZ2h0IC0gMSApICk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWQgPSAnY29tcG9uZW50XycgKyB0eXBlSWQgKyAnXycgKyBpO1xuXG4gICAgICAgICAgICAgICAgICAgIHN5bWJvbCA9IHN5bWJvbE1hbmFnZXIuZ2V0U3ltYm9sKCB0eXBlSWQgKTtcblxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVkUG9ydHMgPSBwb3J0Q3JlYXRvciggaWQsIHN5bWJvbC5wb3J0cyApO1xuXG4gICAgICAgICAgICAgICAgICAgIG5ld0RpYWdyYW1Db21wb25lbnQgPSBuZXcgRGlhZ3JhbUNvbXBvbmVudCgge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IHR5cGUubGFiZWxQcmVmaXggKyBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgeDogeCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICAgICAgICAgICAgICB6OiBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IE1hdGguZmxvb3IoIE1hdGgucmFuZG9tKCkgKiA0MCApICogOTAsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY2FsZVg6IDEsIC8vWzEsIC0xXVtNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlWTogMSwgLy9bMSwgLTFdW01hdGgucm91bmQoTWF0aC5yYW5kb20oKSldLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3ltYm9sOiBzeW1ib2wsXG4gICAgICAgICAgICAgICAgICAgICAgICBub25TZWxlY3RhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uTG9ja2VkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYWdnYWJsZTogdHJ1ZVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgICBzeW1ib2xDb25maWc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgeDogJ3gnLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICAgICB5OiAneScsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgIGxhYmVsOiAnbGFiZWwnLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICAgICByb3RhdGlvbjogJ3JvdGF0aW9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgc2NhbGVYOiAnc2NhbGVYJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgc2NhbGVZOiAnc2NhbGVZJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgcG9ydHM6ICdwb3J0SW5zdGFuY2VzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgcG9ydE1hcHBpbmc6IGNyZWF0ZWRQb3J0cy5wb3J0TWFwcGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9ICk7XG5cbiAgICAgICAgICAgICAgICAgICAgbmV3RGlhZ3JhbUNvbXBvbmVudC5yZWdpc3RlclBvcnRJbnN0YW5jZXMoIGNyZWF0ZWRQb3J0cy5wb3J0SW5zdGFuY2VzICk7XG5cbiAgICAgICAgICAgICAgICAgICAgbmV3RGlhZ3JhbUNvbXBvbmVudC51cGRhdGVUcmFuc2Zvcm1hdGlvbk1hdHJpeCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYWRkQ29tcG9uZW50KCBuZXdEaWFncmFtQ29tcG9uZW50ICk7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB3aXJlcyA9IFtdO1xuICAgICAgICAgICAgICAgIHdpcmVzQnlJZCA9IHt9O1xuXG4gICAgICAgICAgICAgICAgZm9yICggaSA9IDA7IGkgPCBjb3VudE9mV2lyZXM7IGkrKyApIHtcblxuICAgICAgICAgICAgICAgICAgICBpZCA9ICd3aXJlXycgKyBpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudDEgPSBjb21wb25lbnRzLmdldFJhbmRvbUVsZW1lbnQoKTtcblxuICAgICAgICAgICAgICAgICAgICBwb3J0MSA9IGNvbXBvbmVudDEucG9ydEluc3RhbmNlcy5nZXRSYW5kb21FbGVtZW50KCk7XG4gICAgICAgICAgICAgICAgICAgIHBvcnQyID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICggIWFuZ3VsYXIuaXNEZWZpbmVkKCBwb3J0MiApIHx8IHBvcnQxID09PSBwb3J0MiApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50MiA9IGNvbXBvbmVudHMuZ2V0UmFuZG9tRWxlbWVudCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9ydDIgPSBjb21wb25lbnQyLnBvcnRJbnN0YW5jZXMuZ2V0UmFuZG9tRWxlbWVudCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgd2lyZSA9IG5ldyBXaXJlKCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmQxOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50OiBjb21wb25lbnQxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcnQ6IHBvcnQxXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kMjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudDogY29tcG9uZW50MixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3J0OiBwb3J0MlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9ICk7XG5cbiAgICAgICAgICAgICAgICAgICAgd2lyaW5nU2VydmljZS5yb3V0ZVdpcmUoIHdpcmUsICdFbGJvd1JvdXRlcicgKTtcblxuICAgICAgICAgICAgICAgICAgICBzZWxmLmFkZFdpcmUoIHdpcmUgKTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5hZGRDb21wb25lbnQgPSBmdW5jdGlvbiAoIGFEaWFncmFtQ29tcG9uZW50ICkge1xuXG4gICAgICAgICAgICAgICAgaWYgKCBhbmd1bGFyLmlzT2JqZWN0KCBhRGlhZ3JhbUNvbXBvbmVudCApICYmICFhbmd1bGFyLmlzRGVmaW5lZCggY29tcG9uZW50c0J5SWRbIGFEaWFncmFtQ29tcG9uZW50XG4gICAgICAgICAgICAgICAgICAgIC5pZCBdICkgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50c0J5SWRbIGFEaWFncmFtQ29tcG9uZW50LmlkIF0gPSBhRGlhZ3JhbUNvbXBvbmVudDtcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50cy5wdXNoKCBhRGlhZ3JhbUNvbXBvbmVudCApO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZWdpc3RlcldpcmVGb3JFbmRzID0gZnVuY3Rpb24gKCB3aXJlICkge1xuXG4gICAgICAgICAgICAgICAgdmFyIGNvbXBvbmVudElkO1xuXG4gICAgICAgICAgICAgICAgY29tcG9uZW50SWQgPSB3aXJlLmVuZDEuY29tcG9uZW50LmlkO1xuXG4gICAgICAgICAgICAgICAgd2lyZXNCeUNvbXBvbmVudElkWyBjb21wb25lbnRJZCBdID0gd2lyZXNCeUNvbXBvbmVudElkWyBjb21wb25lbnRJZCBdIHx8IFtdO1xuXG4gICAgICAgICAgICAgICAgaWYgKCB3aXJlc0J5Q29tcG9uZW50SWRbIGNvbXBvbmVudElkIF0uaW5kZXhPZiggd2lyZSApID09PSAtMSApIHtcbiAgICAgICAgICAgICAgICAgICAgd2lyZXNCeUNvbXBvbmVudElkWyBjb21wb25lbnRJZCBdLnB1c2goIHdpcmUgKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb21wb25lbnRJZCA9IHdpcmUuZW5kMi5jb21wb25lbnQuaWQ7XG5cbiAgICAgICAgICAgICAgICB3aXJlc0J5Q29tcG9uZW50SWRbIGNvbXBvbmVudElkIF0gPSB3aXJlc0J5Q29tcG9uZW50SWRbIGNvbXBvbmVudElkIF0gfHwgW107XG5cbiAgICAgICAgICAgICAgICBpZiAoIHdpcmVzQnlDb21wb25lbnRJZFsgY29tcG9uZW50SWQgXS5pbmRleE9mKCB3aXJlICkgPT09IC0xICkge1xuICAgICAgICAgICAgICAgICAgICB3aXJlc0J5Q29tcG9uZW50SWRbIGNvbXBvbmVudElkIF0ucHVzaCggd2lyZSApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5hZGRXaXJlID0gZnVuY3Rpb24gKCBhV2lyZSApIHtcblxuICAgICAgICAgICAgICAgIGlmICggYW5ndWxhci5pc09iamVjdCggYVdpcmUgKSAmJiAhYW5ndWxhci5pc0RlZmluZWQoIHdpcmVzQnlJZFsgYVdpcmUuaWQgXSApICkge1xuXG4gICAgICAgICAgICAgICAgICAgIHdpcmVzQnlJZFsgYVdpcmUuaWQgXSA9IGFXaXJlO1xuICAgICAgICAgICAgICAgICAgICB3aXJlcy5wdXNoKCBhV2lyZSApO1xuXG4gICAgICAgICAgICAgICAgICAgIHJlZ2lzdGVyV2lyZUZvckVuZHMoIGFXaXJlICk7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0V2lyZXNGb3JDb21wb25lbnRzID0gZnVuY3Rpb24gKCBjb21wb25lbnRzICkge1xuXG4gICAgICAgICAgICAgICAgdmFyIHNldE9mV2lyZXMgPSBbXTtcblxuICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaCggY29tcG9uZW50cywgZnVuY3Rpb24gKCBjb21wb25lbnQgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKCB3aXJlc0J5Q29tcG9uZW50SWRbIGNvbXBvbmVudC5pZCBdLCBmdW5jdGlvbiAoIHdpcmUgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggc2V0T2ZXaXJlcy5pbmRleE9mKCB3aXJlICkgPT09IC0xICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldE9mV2lyZXMucHVzaCggd2lyZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9ICk7XG5cbiAgICAgICAgICAgICAgICB9ICk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0T2ZXaXJlcztcblxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5nZXREaWFncmFtID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50czogY29tcG9uZW50c0J5SWQsXG4gICAgICAgICAgICAgICAgICAgIHdpcmVzOiB3aXJlc0J5SWQsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRpdGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhbGxvd1NlbGVjdGlvbjogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0SGlnaGVzdFogPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50LFxuICAgICAgICAgICAgICAgICAgICB6O1xuXG4gICAgICAgICAgICAgICAgZm9yICggaSA9IDA7IGkgPCBjb21wb25lbnRzLmxlbmd0aDsgaSsrICkge1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudCA9IGNvbXBvbmVudHNbIGkgXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoICFpc05hTiggY29tcG9uZW50LnogKSApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBpc05hTiggeiApICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHogPSBjb21wb25lbnQuejtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHogPCBjb21wb25lbnQueiApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeiA9IGNvbXBvbmVudC56O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIGlzTmFOKCB6ICkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHogPSAtMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gejtcblxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy90aGlzLmdlbmVyYXRlRHVtbXlEaWFncmFtKDIwMDAsIDUwMCwgMTAwMDAsIDEwMDAwKTtcbiAgICAgICAgICAgIC8vdGhpcy5nZW5lcmF0ZUR1bW15RGlhZ3JhbSgxMDAwLCAyMDAwLCAxMDAwMCwgMTAwMDApO1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZUR1bW15RGlhZ3JhbSggMTAsIDIsIDEyMDAsIDEyMDAgKTtcblxuICAgICAgICB9XG4gICAgXSApOyIsIi8qZ2xvYmFscyBhbmd1bGFyKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgZ3JpZFNlcnZpY2VzTW9kdWxlID0gYW5ndWxhci5tb2R1bGUoXG4gICAgJ21tcy5kZXNpZ25WaXN1YWxpemF0aW9uLmdyaWRTZXJ2aWNlJywgW10gKTtcblxuZ3JpZFNlcnZpY2VzTW9kdWxlLnNlcnZpY2UoICdncmlkU2VydmljZScsIFsgJyRsb2cnLCAnJHJvb3RTY29wZScsICckdGltZW91dCcsXG4gICAgZnVuY3Rpb24gKCAkbG9nLCAkcm9vdFNjb3BlLCAkdGltZW91dCApIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXG5cbiAgICAgICAgICAgIGdyaWRzID0ge30sXG5cbiAgICAgICAgICAgIG51bWJlck9mQ2hhbmdlc0FsbG93ZWRJbk9uZUN5Y2xlID0gMjAwMCxcbiAgICAgICAgICAgIHJlY2FsY3VsYXRlQ3ljbGVEZWxheSA9IDEwLFxuICAgICAgICAgICAgdmlld1BvcnRQYWRkaW5nID0ge1xuICAgICAgICAgICAgICAgIHg6IC0zMDAsXG4gICAgICAgICAgICAgICAgeTogLTIwMFxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcmVjYWxjdWxhdGVWaXNpYmxlRGlhZ3JhbUNvbXBvbmVudHMsXG4gICAgICAgICAgICByZWNhbGN1bGF0ZVZpc2libGVXaXJlcztcblxuICAgICAgICByZWNhbGN1bGF0ZVZpc2libGVXaXJlcyA9IGZ1bmN0aW9uICggZ3JpZCApIHtcblxuICAgICAgICAgICAgdmFyIGluZGV4O1xuXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goIGdyaWQud2lyZXMsIGZ1bmN0aW9uICggd2lyZSApIHtcblxuICAgICAgICAgICAgICAgIGluZGV4ID0gZ3JpZC52aXNpYmxlV2lyZXMuaW5kZXhPZiggd2lyZSApO1xuXG5cbiAgICAgICAgICAgICAgICBpZiAoIHdpcmUuaXNJblZpZXdQb3J0KCBncmlkLnZpZXdQb3J0LCB2aWV3UG9ydFBhZGRpbmcgKSApIHtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIGluZGV4ID09PSAtMSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyaWQudmlzaWJsZVdpcmVzLnB1c2goIHdpcmUgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIGluZGV4ID4gLTEgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBncmlkLnZpc2libGVXaXJlcy5zcGxpY2UoIGluZGV4LCAxICk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSApO1xuXG4gICAgICAgICAgICAkbG9nLmRlYnVnKCAnTnVtYmVyIG9mIHZpc2libGUgd2lyZXM6ICcgKyBncmlkLnZpc2libGVXaXJlcy5sZW5ndGggKTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHJlY2FsY3VsYXRlVmlzaWJsZURpYWdyYW1Db21wb25lbnRzID0gZnVuY3Rpb24gKCBncmlkICkge1xuXG4gICAgICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgICAgICBjb21wb25lbnQsXG4gICAgICAgICAgICAgICAgY291bnRPZkNoYW5nZXMgPSAwLFxuICAgICAgICAgICAgICAgIGNoYW5nZXNMaW1pdFJlYWNoZWQgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBpbmRleDtcblxuICAgICAgICAgICAgZ3JpZC5pbnZpc2libGVEaWFncmFtQ29tcG9uZW50c1JlY2FsY3VsYXRlID0gdHJ1ZTtcblxuXG4gICAgICAgICAgICBmb3IgKCBpID0gMDsgaSA8IGdyaWQuY29tcG9uZW50cy5sZW5ndGggJiYgIWNoYW5nZXNMaW1pdFJlYWNoZWQ7IGkrKyApIHtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQgPSBncmlkLmNvbXBvbmVudHNbIGkgXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaCggZ3JpZC5jb21wb25lbnRzLCBmdW5jdGlvbiAoIGNvbXBvbmVudCApIHtcblxuICAgICAgICAgICAgICAgIGluZGV4ID0gZ3JpZC52aXNpYmxlRGlhZ3JhbUNvbXBvbmVudHMuaW5kZXhPZiggY29tcG9uZW50ICk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIGNvbXBvbmVudC5pc0luVmlld1BvcnQoIGdyaWQudmlld1BvcnQsIHZpZXdQb3J0UGFkZGluZyApICkge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICggaW5kZXggPT09IC0xICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3JpZC52aXNpYmxlRGlhZ3JhbUNvbXBvbmVudHMucHVzaCggY29tcG9uZW50ICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudE9mQ2hhbmdlcysrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIGluZGV4ID4gLTEgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBncmlkLnZpc2libGVEaWFncmFtQ29tcG9uZW50cy5zcGxpY2UoIGluZGV4LCAxICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvdW50T2ZDaGFuZ2VzKys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIGNvdW50T2ZDaGFuZ2VzID49IG51bWJlck9mQ2hhbmdlc0FsbG93ZWRJbk9uZUN5Y2xlICkge1xuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzTGltaXRSZWFjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gKTtcblxuICAgICAgICAgICAgc2VsZi5yZW9yZGVyVmlzaWJsZUNvbXBvbmVudHMoIGdyaWQuaWQgKTtcblxuICAgICAgICAgICAgcmVjYWxjdWxhdGVWaXNpYmxlV2lyZXMoIGdyaWQgKTtcblxuICAgICAgICAgICAgJGxvZy5kZWJ1ZyggJ051bWJlciBvZiBjaGFuZ2VzIGNvbXBhcmVkIHRvIHByZXZpb3VzIGRpYWdyYW0gc3RhdGU6JywgY291bnRPZkNoYW5nZXMgKTtcblxuICAgICAgICAgICAgaWYgKCAhY2hhbmdlc0xpbWl0UmVhY2hlZCApIHtcbiAgICAgICAgICAgICAgICBncmlkLmludmlzaWJsZURpYWdyYW1Db21wb25lbnRzUmVjYWxjdWxhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHRpbWVvdXQoIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjYWxjdWxhdGVWaXNpYmxlRGlhZ3JhbUNvbXBvbmVudHMoIGdyaWQgKTtcbiAgICAgICAgICAgICAgICB9LCByZWNhbGN1bGF0ZUN5Y2xlRGVsYXkgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZVZpc2libGVEaWFncmFtQ29tcG9uZW50cyA9IGZ1bmN0aW9uICggZ3JpZElkICkge1xuXG4gICAgICAgICAgICB2YXIgZ3JpZDtcblxuICAgICAgICAgICAgZ3JpZCA9IGdyaWRzWyBncmlkSWQgXTtcblxuICAgICAgICAgICAgaWYgKCBhbmd1bGFyLmlzRGVmaW5lZCggZ3JpZCApICkge1xuXG4gICAgICAgICAgICAgICAgaWYgKCAhZ3JpZC5pbnZpc2libGVEaWFncmFtQ29tcG9uZW50c1JlY2FsY3VsYXRlICkge1xuICAgICAgICAgICAgICAgICAgICAkdGltZW91dCggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVjYWxjdWxhdGVWaXNpYmxlRGlhZ3JhbUNvbXBvbmVudHMoIGdyaWQgKTtcbiAgICAgICAgICAgICAgICAgICAgfSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9O1xuXG5cbiAgICAgICAgdGhpcy5jcmVhdGVHcmlkID0gZnVuY3Rpb24gKCBpZCwgZGltZW5zaW9ucywgZGlhZ3JhbSApIHtcblxuICAgICAgICAgICAgdmFyIGdyaWQ7XG5cbiAgICAgICAgICAgIGlmICggIWFuZ3VsYXIuaXNEZWZpbmVkKCBncmlkc1sgaWQgXSApICkge1xuICAgICAgICAgICAgICAgIGdyaWQgPSBncmlkc1sgaWQgXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgICAgICAgICBkaW1lbnNpb25zOiBkaW1lbnNpb25zLFxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRzOiBkaWFncmFtLmNvbXBvbmVudHMsXG4gICAgICAgICAgICAgICAgICAgIHZpc2libGVEaWFncmFtQ29tcG9uZW50czogW10sXG4gICAgICAgICAgICAgICAgICAgIHdpcmVzOiBkaWFncmFtLndpcmVzLFxuICAgICAgICAgICAgICAgICAgICB2aXNpYmxlV2lyZXM6IFtdLFxuICAgICAgICAgICAgICAgICAgICB2aWV3UG9ydDoge30sXG4gICAgICAgICAgICAgICAgICAgIGludmlzaWJsZURpYWdyYW1Db21wb25lbnRzUmVjYWxjdWxhdGU6IGZhbHNlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgKCAnR3JpZCB3YXMgYWxyZWFkeSBkZWZpbmVkIScsIGlkICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50czogZ3JpZC52aXNpYmxlRGlhZ3JhbUNvbXBvbmVudHMsXG4gICAgICAgICAgICAgICAgd2lyZXM6IGdyaWQudmlzaWJsZVdpcmVzXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuXG5cbiAgICAgICAgdGhpcy5zZXRWaXNpYmxlQXJlYSA9IGZ1bmN0aW9uICggZ3JpZElkLCB2aWV3UG9ydCApIHtcbiAgICAgICAgICAgIHZhciBncmlkID0gZ3JpZHNbIGdyaWRJZCBdO1xuXG4gICAgICAgICAgICBpZiAoIGFuZ3VsYXIuaXNEZWZpbmVkKCBncmlkICkgKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoIGFuZ3VsYXIuaXNEZWZpbmVkKCB2aWV3UG9ydCApICkge1xuXG4gICAgICAgICAgICAgICAgICAgIGdyaWQudmlld1BvcnQgPSB2aWV3UG9ydDtcblxuICAgICAgICAgICAgICAgICAgICBzZWxmLmludmFsaWRhdGVWaXNpYmxlRGlhZ3JhbUNvbXBvbmVudHMoIGdyaWQuaWQgKTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAoICdHcmlkIHdhcyBub3QgZGVmaW5lZCEnLCBncmlkSWQgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMucmVvcmRlclZpc2libGVDb21wb25lbnRzID0gZnVuY3Rpb24gKCBncmlkSWQgKSB7XG5cbiAgICAgICAgICAgIHZhciBncmlkID0gZ3JpZHNbIGdyaWRJZCBdO1xuXG4gICAgICAgICAgICBpZiAoIGFuZ3VsYXIuaXNEZWZpbmVkKCBncmlkICkgKSB7XG4gICAgICAgICAgICAgICAgZ3JpZC52aXNpYmxlRGlhZ3JhbUNvbXBvbmVudHMuc29ydCggZnVuY3Rpb24gKCBhLCBiICkge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICggYS56ID4gYi56ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoIGEueiA8IGIueiApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xuXG4gICAgICAgICAgICAgICAgfSApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH07XG5cbiAgICB9XG5dICk7IiwiLypnbG9iYWxzIGFuZ3VsYXIqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBzeW1ib2xTZXJ2aWNlc01vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKFxuICAgICdtbXMuZGVzaWduVmlzdWFsaXphdGlvbi5zeW1ib2xTZXJ2aWNlcycsIFtdICk7XG5cbnN5bWJvbFNlcnZpY2VzTW9kdWxlLnByb3ZpZGVyKCAnc3ltYm9sTWFuYWdlcicsIGZ1bmN0aW9uIFN5bWJvbE1hbmFnZXJQcm92aWRlcigpIHtcbiAgICB2YXIgYXZhaWxhYmxlU3ltYm9scyA9IHt9O1xuXG4gICAgdGhpcy5yZWdpc3RlclN5bWJvbCA9IGZ1bmN0aW9uICggc3ltYm9sRGVzY3JpcHRvciApIHtcblxuICAgICAgICBpZiAoIGFuZ3VsYXIuaXNPYmplY3QoIHN5bWJvbERlc2NyaXB0b3IgKSAmJlxuICAgICAgICAgICAgYW5ndWxhci5pc1N0cmluZyggc3ltYm9sRGVzY3JpcHRvci50eXBlICkgKSB7XG4gICAgICAgICAgICBhdmFpbGFibGVTeW1ib2xzWyBzeW1ib2xEZXNjcmlwdG9yLnR5cGUgXSA9IHN5bWJvbERlc2NyaXB0b3I7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy4kZ2V0ID0gW1xuXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgdmFyIFN5bWJvbE1hbmFnZXI7XG5cbiAgICAgICAgICAgIFN5bWJvbE1hbmFnZXIgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmdldEF2YWlsYWJsZVN5bWJvbHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhdmFpbGFibGVTeW1ib2xzO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB0aGlzLmdldFN5bWJvbCA9IGZ1bmN0aW9uICggc3ltYm9sVHlwZSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF2YWlsYWJsZVN5bWJvbHNbIHN5bWJvbFR5cGUgXTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5nZXRTeW1ib2xFbGVtZW50Rm9yVHlwZSA9IGZ1bmN0aW9uICggc3ltYm9sVHlwZSApIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gYXZhaWxhYmxlU3ltYm9sc1sgc3ltYm9sVHlwZSBdICYmIGF2YWlsYWJsZVN5bWJvbHNbIHN5bWJvbFR5cGUgXS5kaXJlY3RpdmU7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhcmVzdWx0ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gJ3Jlc2lzdG9yJztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHJldHVybiBuZXcgU3ltYm9sTWFuYWdlcigpO1xuXG4gICAgICAgIH1cbiAgICBdO1xufSApOyIsIi8qZ2xvYmFscyBhbmd1bGFyKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRWxib3dSb3V0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLm5hbWUgPSAnRWxib3dSb3V0ZXInO1xuXG4gICAgdGhpcy5tYWtlU2VnbWVudHMgPSBmdW5jdGlvbiAoIHBvaW50cywgbWV0aG9kICkge1xuXG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgcG9pbnQxLCBlbGJvdywgcG9pbnQyLFxuICAgICAgICAgICAgc2VnbWVudHM7XG5cbiAgICAgICAgbWV0aG9kID0gbWV0aG9kIHx8ICd2ZXJ0aWNhbEZpcnN0JztcblxuICAgICAgICBpZiAoIGFuZ3VsYXIuaXNBcnJheSggcG9pbnRzICkgJiYgcG9pbnRzLmxlbmd0aCA+PSAyICkge1xuXG4gICAgICAgICAgICBzZWdtZW50cyA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKCBpID0gMDsgaSA8IHBvaW50cy5sZW5ndGggLSAxOyBpKysgKSB7XG5cbiAgICAgICAgICAgICAgICBwb2ludDEgPSBwb2ludHNbIGkgXTtcbiAgICAgICAgICAgICAgICBwb2ludDIgPSBwb2ludHNbIGkgKyAxIF07XG5cbiAgICAgICAgICAgICAgICBpZiAoIG1ldGhvZCA9PT0gJ3ZlcnRpY2FsRmlyc3QnICkge1xuXG4gICAgICAgICAgICAgICAgICAgIGVsYm93ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgeDogcG9pbnQxLngsXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiBwb2ludDIueVxuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICBlbGJvdyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IHBvaW50MS55LFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogcG9pbnQyLnhcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHNlZ21lbnRzLnB1c2goIHtcblxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbGluZScsXG5cbiAgICAgICAgICAgICAgICAgICAgeDE6IHBvaW50MS54LFxuICAgICAgICAgICAgICAgICAgICB5MTogcG9pbnQxLnksXG5cbiAgICAgICAgICAgICAgICAgICAgeDI6IGVsYm93LngsXG4gICAgICAgICAgICAgICAgICAgIHkyOiBlbGJvdy55LFxuXG4gICAgICAgICAgICAgICAgICAgIHJvdXRlcjogc2VsZi5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBvcmllbnRhdGlvbjogKCBtZXRob2QgPT09ICd2ZXJ0aWNhbEZpcnN0JyApID8gJ3ZlcnRpY2FsJyA6ICdob3Jpem9udGFsJ1xuXG4gICAgICAgICAgICAgICAgfSwge1xuXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdsaW5lJyxcblxuICAgICAgICAgICAgICAgICAgICB4MTogZWxib3cueCxcbiAgICAgICAgICAgICAgICAgICAgeTE6IGVsYm93LnksXG5cbiAgICAgICAgICAgICAgICAgICAgeDI6IHBvaW50Mi54LFxuICAgICAgICAgICAgICAgICAgICB5MjogcG9pbnQyLnksXG5cbiAgICAgICAgICAgICAgICAgICAgcm91dGVyOiBzZWxmLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIG9yaWVudGF0aW9uOiAoIG1ldGhvZCA9PT0gJ3ZlcnRpY2FsRmlyc3QnICkgPyAnaG9yaXpvbnRhbCcgOiAndmVydGljYWwnXG5cbiAgICAgICAgICAgICAgICB9ICk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNlZ21lbnRzO1xuXG4gICAgfTtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbGJvd1JvdXRlcjsiLCIvKmdsb2JhbHMgYW5ndWxhciovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFNpbXBsZVJvdXRlciA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHRoaXMubWFrZVNlZ21lbnRzID0gZnVuY3Rpb24gKCBwb2ludHMgKSB7XG5cbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBwb2ludDEsIHBvaW50MixcbiAgICAgICAgICAgIHNlZ21lbnRzO1xuXG4gICAgICAgIGlmICggYW5ndWxhci5pc0FycmF5KCBwb2ludHMgKSAmJiBwb2ludHMubGVuZ3RoID49IDIgKSB7XG5cbiAgICAgICAgICAgIHNlZ21lbnRzID0gW107XG5cbiAgICAgICAgICAgIGZvciAoIGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aCAtIDE7IGkrKyApIHtcblxuICAgICAgICAgICAgICAgIHBvaW50MSA9IHBvaW50c1sgaSBdO1xuICAgICAgICAgICAgICAgIHBvaW50MiA9IHBvaW50c1sgaSArIDEgXTtcblxuICAgICAgICAgICAgICAgIHNlZ21lbnRzLnB1c2goIHtcblxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbGluZScsXG5cbiAgICAgICAgICAgICAgICAgICAgeDE6IHBvaW50MS54LFxuICAgICAgICAgICAgICAgICAgICB5MTogcG9pbnQxLnksXG5cbiAgICAgICAgICAgICAgICAgICAgeDI6IHBvaW50Mi54LFxuICAgICAgICAgICAgICAgICAgICB5MjogcG9pbnQyLnlcblxuICAgICAgICAgICAgICAgIH0gKTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2VnbWVudHM7XG5cbiAgICB9O1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNpbXBsZVJvdXRlcjsiLCIvKmdsb2JhbHMgYW5ndWxhciovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHdpcmluZ1NlcnZpY2VzTW9kdWxlID0gYW5ndWxhci5tb2R1bGUoXG4gICAgJ21tcy5kZXNpZ25WaXN1YWxpemF0aW9uLndpcmluZ1NlcnZpY2UnLCBbXSApO1xuXG53aXJpbmdTZXJ2aWNlc01vZHVsZS5zZXJ2aWNlKCAnd2lyaW5nU2VydmljZScsIFsgJyRsb2cnLCAnJHJvb3RTY29wZScsICckdGltZW91dCcsXG4gICAgZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICAgIFNpbXBsZVJvdXRlciA9IHJlcXVpcmUoICcuL2NsYXNzZXMvU2ltcGxlUm91dGVyLmpzJyApLFxuICAgICAgICAgICAgRWxib3dSb3V0ZXIgPSByZXF1aXJlKCAnLi9jbGFzc2VzL0VsYm93Um91dGVyLmpzJyApLFxuICAgICAgICAgICAgcm91dGVycyA9IHtcblxuICAgICAgICAgICAgICAgIFNpbXBsZVJvdXRlcjogbmV3IFNpbXBsZVJvdXRlcigpLFxuICAgICAgICAgICAgICAgIEVsYm93Um91dGVyOiBuZXcgRWxib3dSb3V0ZXIoKVxuXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0U2VnbWVudHNCZXR3ZWVuUG9zaXRpb25zID0gZnVuY3Rpb24gKCBlbmRQb3NpdGlvbnMsIHJvdXRlclR5cGUgKSB7XG5cbiAgICAgICAgICAgIHZhciBzZWdtZW50cyxcbiAgICAgICAgICAgICAgICByb3V0ZXI7XG5cbiAgICAgICAgICAgIHJvdXRlciA9IHJvdXRlcnNbIHJvdXRlclR5cGUgXTtcblxuICAgICAgICAgICAgaWYgKCBhbmd1bGFyLmlzT2JqZWN0KCByb3V0ZXIgKSAmJiBhbmd1bGFyLmlzRnVuY3Rpb24oIHJvdXRlci5tYWtlU2VnbWVudHMgKSApIHtcbiAgICAgICAgICAgICAgICBzZWdtZW50cyA9IHJvdXRlci5tYWtlU2VnbWVudHMoXG4gICAgICAgICAgICAgICAgICAgIFsgZW5kUG9zaXRpb25zLmVuZDEsIGVuZFBvc2l0aW9ucy5lbmQyIF0gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHNlZ21lbnRzO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5yb3V0ZVdpcmUgPSBmdW5jdGlvbiAoIHdpcmUsIHJvdXRlclR5cGUgKSB7XG5cbiAgICAgICAgICAgIHZhciByb3V0ZXIsIGVuZFBvc2l0aW9ucztcblxuICAgICAgICAgICAgcm91dGVyVHlwZSA9IHJvdXRlclR5cGUgfHwgJ0VsYm93Um91dGVyJztcblxuICAgICAgICAgICAgcm91dGVyID0gcm91dGVyc1sgcm91dGVyVHlwZSBdO1xuXG4gICAgICAgICAgICBpZiAoIGFuZ3VsYXIuaXNPYmplY3QoIHJvdXRlciApICYmIGFuZ3VsYXIuaXNGdW5jdGlvbiggcm91dGVyLm1ha2VTZWdtZW50cyApICkge1xuXG4gICAgICAgICAgICAgICAgZW5kUG9zaXRpb25zID0gd2lyZS5nZXRFbmRQb3NpdGlvbnMoKTtcblxuICAgICAgICAgICAgICAgIHdpcmUuc2VnbWVudHMgPSByb3V0ZXIubWFrZVNlZ21lbnRzKFxuICAgICAgICAgICAgICAgICAgICBbIGVuZFBvc2l0aW9ucy5lbmQxLCBlbmRQb3NpdGlvbnMuZW5kMiBdICk7XG5cbiAgICAgICAgICAgICAgICB3aXJlLnJvdXRlclR5cGUgPSByb3V0ZXJUeXBlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5hZGp1c3RXaXJlRW5kU2VnbWVudHMgPSBmdW5jdGlvbiAoIHdpcmUgKSB7XG5cbiAgICAgICAgICAgIHZhciBmaXJzdFNlZ21lbnQsXG4gICAgICAgICAgICAgICAgc2Vjb25kU2VnbWVudCxcbiAgICAgICAgICAgICAgICBzZWNvbmRUb0xhc3RTZWdtZW50LFxuICAgICAgICAgICAgICAgIGxhc3RTZWdtZW50LFxuICAgICAgICAgICAgICAgIGVuZFBvc2l0aW9ucyxcbiAgICAgICAgICAgICAgICBuZXdTZWdtZW50cyxcbiAgICAgICAgICAgICAgICBwb3M7XG5cbiAgICAgICAgICAgIGVuZFBvc2l0aW9ucyA9IHdpcmUuZ2V0RW5kUG9zaXRpb25zKCk7XG5cbiAgICAgICAgICAgIGlmICggYW5ndWxhci5pc0FycmF5KCB3aXJlLnNlZ21lbnRzICkgJiYgd2lyZS5zZWdtZW50cy5sZW5ndGggPiAxICkge1xuXG4gICAgICAgICAgICAgICAgZmlyc3RTZWdtZW50ID0gd2lyZS5zZWdtZW50c1sgMCBdO1xuXG4gICAgICAgICAgICAgICAgaWYgKCBmaXJzdFNlZ21lbnQueDEgIT09IGVuZFBvc2l0aW9ucy5lbmQxLnggfHwgZmlyc3RTZWdtZW50LnkxICE9PSBlbmRQb3NpdGlvbnMuZW5kMS55ICkge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICggZmlyc3RTZWdtZW50LnJvdXRlciA9PT0gJ0VsYm93Um91dGVyJyApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc2Vjb25kU2VnbWVudCA9IHdpcmUuc2VnbWVudHNbIDEgXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHNlY29uZFNlZ21lbnQueDIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogc2Vjb25kU2VnbWVudC55MlxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgd2lyZS5zZWdtZW50cy5zcGxpY2UoIDAsIDIgKTtcblxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IGZpcnN0U2VnbWVudC54MixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiBmaXJzdFNlZ21lbnQueTJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHdpcmUuc2VnbWVudHMuc3BsaWNlKCAwLCAxICk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBuZXdTZWdtZW50cyA9IHNlbGYuZ2V0U2VnbWVudHNCZXR3ZWVuUG9zaXRpb25zKCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmQxOiBlbmRQb3NpdGlvbnMuZW5kMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZDI6IHBvc1xuICAgICAgICAgICAgICAgICAgICB9LCBmaXJzdFNlZ21lbnQucm91dGVyICk7XG5cbiAgICAgICAgICAgICAgICAgICAgd2lyZS5zZWdtZW50cyA9IG5ld1NlZ21lbnRzLmNvbmNhdCggd2lyZS5zZWdtZW50cyApO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGFzdFNlZ21lbnQgPSB3aXJlLnNlZ21lbnRzWyB3aXJlLnNlZ21lbnRzLmxlbmd0aCAtIDEgXTtcblxuICAgICAgICAgICAgICAgIGlmICggbGFzdFNlZ21lbnQueDIgIT09IGVuZFBvc2l0aW9ucy5lbmQyLnggfHwgbGFzdFNlZ21lbnQueTIgIT09IGVuZFBvc2l0aW9ucy5lbmQyLnkgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCBsYXN0U2VnbWVudC5yb3V0ZXIgPT09ICdFbGJvd1JvdXRlcicgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlY29uZFRvTGFzdFNlZ21lbnQgPSB3aXJlLnNlZ21lbnRzWyB3aXJlLnNlZ21lbnRzLmxlbmd0aCAtIDIgXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHNlY29uZFRvTGFzdFNlZ21lbnQueDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogc2Vjb25kVG9MYXN0U2VnbWVudC55MVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgd2lyZS5zZWdtZW50cy5zcGxpY2UoIHdpcmUuc2VnbWVudHMubGVuZ3RoIC0gMiwgMiApO1xuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3MgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogbGFzdFNlZ21lbnQueDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogbGFzdFNlZ21lbnQueTFcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHdpcmUuc2VnbWVudHMuc3BsaWNlKCB3aXJlLnNlZ21lbnRzLmxlbmd0aCAtIDEsIDEgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIG5ld1NlZ21lbnRzID0gc2VsZi5nZXRTZWdtZW50c0JldHdlZW5Qb3NpdGlvbnMoIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZDE6IHBvcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZDI6IGVuZFBvc2l0aW9ucy5lbmQyXG4gICAgICAgICAgICAgICAgICAgIH0sIGxhc3RTZWdtZW50LnJvdXRlciApO1xuXG4gICAgICAgICAgICAgICAgICAgIHdpcmUuc2VnbWVudHMgPSB3aXJlLnNlZ21lbnRzLmNvbmNhdCggbmV3U2VnbWVudHMgKTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLnJvdXRlV2lyZSggd2lyZSApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH07XG5cbiAgICB9XG5dICk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5yZXF1aXJlKCAnQXJyYXkucHJvdG90eXBlLmZpbmQnICk7XG5cbmlmICggIUFycmF5LnByb3RvdHlwZS5maW5kQnlJZCApIHtcbiAgICBBcnJheS5wcm90b3R5cGUuZmluZEJ5SWQgPSBmdW5jdGlvbiAoIGlkICkge1xuICAgICAgICByZXR1cm4gdGhpcy5maW5kKCBmdW5jdGlvbiAoIGEgKSB7XG4gICAgICAgICAgICByZXR1cm4gYS5pZCAhPT0gdW5kZWZpbmVkICYmIGEuaWQgPT09IGlkO1xuICAgICAgICB9ICk7XG4gICAgfTtcbn1cblxuaWYgKCAhQXJyYXkucHJvdG90eXBlLmdldFJhbmRvbUVsZW1lbnQgKSB7XG4gICAgQXJyYXkucHJvdG90eXBlLmdldFJhbmRvbUVsZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzWyBNYXRoLnJvdW5kKCBNYXRoLnJhbmRvbSgpICogKCB0aGlzLmxlbmd0aCAtIDEgKSApIF07XG4gICAgfTtcbn1cblxuaWYgKCAhQXJyYXkucHJvdG90eXBlLnNodWZmbGUgKSB7XG4gICAgQXJyYXkucHJvdG90eXBlLnNodWZmbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjdXJyZW50SW5kZXggPSB0aGlzLmxlbmd0aCxcbiAgICAgICAgICAgIHRlbXBvcmFyeVZhbHVlLCByYW5kb21JbmRleDtcblxuICAgICAgICAvLyBXaGlsZSB0aGVyZSByZW1haW4gZWxlbWVudHMgdG8gc2h1ZmZsZS4uLlxuICAgICAgICB3aGlsZSAoIDAgIT09IGN1cnJlbnRJbmRleCApIHtcblxuICAgICAgICAgICAgLy8gUGljayBhIHJlbWFpbmluZyBlbGVtZW50Li4uXG4gICAgICAgICAgICByYW5kb21JbmRleCA9IE1hdGguZmxvb3IoIE1hdGgucmFuZG9tKCkgKiBjdXJyZW50SW5kZXggKTtcbiAgICAgICAgICAgIGN1cnJlbnRJbmRleCAtPSAxO1xuXG4gICAgICAgICAgICAvLyBBbmQgc3dhcCBpdCB3aXRoIHRoZSBjdXJyZW50IGVsZW1lbnQuXG4gICAgICAgICAgICB0ZW1wb3JhcnlWYWx1ZSA9IHRoaXNbIGN1cnJlbnRJbmRleCBdO1xuICAgICAgICAgICAgdGhpc1sgY3VycmVudEluZGV4IF0gPSB0aGlzWyByYW5kb21JbmRleCBdO1xuICAgICAgICAgICAgdGhpc1sgcmFuZG9tSW5kZXggXSA9IHRlbXBvcmFyeVZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbn0iXX0=
