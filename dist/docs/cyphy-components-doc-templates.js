angular.module("cyphy.demoApp.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("/docs/cyphy_components_docs.html","<!DOCTYPE html>\n<html data-ng-app=\"cyphy.demoApp\">\n<head>\n    <title>CyPhy Components Documentation</title>\n\n    <link type=\"text/css\" rel=\"stylesheet\" href=\"../../bower_components/bootstrap/dist/css/bootstrap.min.css\">\n    <link type=\"text/css\" rel=\"stylesheet\" href=\"../../bower_components/jquery-ui/themes/black-tie/jquery-ui.css\">\n    <link type=\"text/css\" rel=\"stylesheet\" href=\"../../bower_components/angular-growl/build/angular-growl.min.css\">\n    <link type=\"text/css\" href=\"../../bower_components/font-awesome/css/font-awesome.min.css\" rel=\"stylesheet\">\n\n    <link type=\"text/css\" rel=\"stylesheet\" href=\"../../bower_components/isis-ui-components/dist/isis-ui-components.css\">\n\n    <link type=\"text/css\" rel=\"stylesheet\" href=\"cyphy-components-docs.css\">\n    <link type=\"text/css\" rel=\"stylesheet\" href=\"../cyphy-components.css\">\n\n</head>\n<body>\n<div growl></div>\n<div ng-controller=\"CyPhyComponentsDemoController\" class=\"container\">\n\n    <h1>cyphy.ui.components</h1>\n\n    <section ng-repeat=\"component in components\" id=\"{{ component.name }}\">\n        <div class=\"page-header\">\n            <h1>{{ component.name }}\n                <small>(cyphy.ui.{{ component.name }})</small>\n            </h1>\n        </div>\n\n        <div class=\"row\">\n            <div class=\"col-md-6 show-grid\" ng-include=\"component.template\">\n\n            </div>\n            <div btf-markdown class=\"col-md-6\" ng-include=\"component.docs\">\n            </div>\n        </div>\n            <div class=\"row\">\n                <tabset class=\"col-md-12\" ng-if=\"component.sources\">\n                    <tab ng-repeat=\"sourceFile in component.sources\"\n                         heading=\"{{sourceFile.fileName}}\"\n                         select=\"selectedSourceFile=sourceFile\">\n                        <div ui-codemirror\n                             ui-codemirror-opts=\"sourceFile.viewerOptions\"\n                             ng-model=\"sourceFile.code\"\n                             ui-refresh=\"selectedSourceFile\"\n                             >\n\n                        </div>\n                    </tab>\n                </tabset>\n            </div>\n\n    </section>\n\n</div>\n<!--<script src=\"https://code.jquery.com/jquery-2.1.1.min.js\"></script>-->\n<!--<script src=\"https://code.jquery.com/ui/1.11.1/jquery-ui.min.js\"></script>-->\n<!--<script src=\"//cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular.min.js\"></script>-->\n<!--<script src=\"//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js\"></script>-->\n<!--<script src=\"http://cdnjs.cloudflare.com/ajax/libs/angular-ui-bootstrap/0.10.0/ui-bootstrap-tpls.js\"></script>-->\n\n<script src=\"../../bower_components/jquery/dist/jquery.min.js\"></script>\n<script src=\"../../bower_components/jquery-ui/jquery-ui.min.js\"></script>\n<script src=\"../../bower_components/angular/angular.js\"></script>\n<script src=\"../../bower_components/bootstrap/dist/js/bootstrap.min.js\"></script>\n<script src=\"../../bower_components/angular-bootstrap/ui-bootstrap-tpls.js\"></script>\n<script src=\"../../bower_components/angular-ui-utils/ui-utils.min.js\"></script>\n<script src=\"../../bower_components/ng-grid/build/ng-grid.min.js\"></script>\n\n<script src=\"../../bower_components/isis-ui-components/dist/isis-ui-components.js\"></script>\n<script src=\"../../bower_components/isis-ui-components/dist/isis-ui-components-templates.js\"></script>\n\n\n<script src=\"../cyphy-components.js\"></script>\n<script src=\"../cyphy-components-templates.js\"></script>\n\n<script src=\"cyphy-components-docs.js\"></script>\n<script src=\"cyphy-components-doc-templates.js\"></script>\n\n</body>\n</html>");
$templateCache.put("/library/ComponentList/docs/demo.html","<div>\n    <component-list data-workspace-id=\"\'/1/2/3/4/5/6\'\" data-connection-id=\"\'my-db-connection-id\'\"></component-list>\n</div>");
$templateCache.put("/library/DesignList/docs/demo.html","<div>\n    <design-list data-workspace-id=\"\'/1/2/3/4/5/6\'\"></design-list>\n</div>");
$templateCache.put("/library/DesignTree/docs/demo.html","<div>\n    <design-tree data-design-id=\"\'/1/2/3/4/5/6\'\"></design-tree>\n</div>");
$templateCache.put("/library/TestBenchList/docs/demo.html","<div>\n    <test-bench-list data-workspace-id=\"\'/1/2/3/4/5/6\'\"></test-bench-list>\n</div>");
$templateCache.put("/library/WorkspaceList/docs/demo.html","<div>\n    <workspace-list data-connection-id=\"\'my-db-connection-id\'\"></workspace-list>\n</div>");
$templateCache.put("/library/componentBrowser/docs/demo.html","<div>\n    <component-browser data-workspace-id=\"\'/1/2/3/4/5/6\'\" data-connection-id=\"\'my-db-connection-id\'\"></component-browser>\n</div>");
$templateCache.put("/docs/docs_app.js","/*globals angular, require, window, console */\n\nvar components = [\n    //    {\n    //        name: \'WorkersList\',\n    //        sources: [ \'demo.html\', \'demo.js\']\n    //    }\n    //    {\n    //        name: \'WorkspaceList\',\n    //        sources: [ \'demo.html\', \'demo.js\']\n    //    },\n    //    {\n    //        name: \'ComponentList\',\n    //        sources: [ \'demo.html\', \'demo.js\']\n    //    },\n    //    {\n    //        name: \'DesignList\',\n    //        sources: [ \'demo.html\', \'demo.js\']\n    //    },\n    //    {\n    //        name: \'DesignTree\',\n    //        sources: [ \'demo.html\', \'demo.js\']\n    //    },\n    //    {\n    //        name: \'TestBenchList\',\n    //        sources: [ \'demo.html\', \'demo.js\']\n    //    }\n];\n\nrequire( \'chance\' );\n\nangular.module( \'gme.services\', [] );\n\n//require(\'../library/WorkersList/docs/demo.js\');\n//require(\'../library/WorkspaceList/docs/demo.js\');\n//require(\'../library/ComponentList/docs/demo.js\');\n//require(\'../library/DesignList/docs/demo.js\');\n//require(\'../library/DesignTree/docs/demo.js\');\n//require(\'../library/TestBenchList/docs/demo.js\');\n\n\nrequire( \'angular-sanitize\' );\nwindow.Showdown = require( \'showdown\' );\nrequire( \'angular-markdown-directive\' );\n\nrequire( \'codemirrorCSS\' );\nwindow.CodeMirror = require( \'code-mirror\' );\n\nrequire( \'code-mirror/mode/htmlmixed\' );\nrequire( \'code-mirror/mode/xml\' );\nrequire( \'code-mirror/mode/javascript\' );\n\nrequire( \'angular-ui-codemirror\' );\n\n\nvar demoApp = angular.module(\n    \'cyphy.demoApp\', [\n        \'cyphy.demoApp.templates\',\n        \'btford.markdown\',\n        \'ui.codemirror\',\n        \'ui.bootstrap\',\n        \'isis.ui.components\'\n    ].concat( components.map( function ( e ) {\n        \'use strict\';\n\n        return \'cyphy.ui.\' + e.name + \'.demo\';\n    } ) )\n);\n\ndemoApp.run( function () {\n    \'use strict\';\n    console.log( \'DemoApp run...\' );\n} );\n\ndemoApp.controller(\n    \'CyPhyComponentsDemoController\',\n    function ( $scope, $templateCache ) {\n        \'use strict\';\n\n        var fileExtensionRE,\n            codeMirrorModes;\n\n        fileExtensionRE = /(?:\\.([^.]+))?$/;\n\n        codeMirrorModes = {\n            \'js\': \'javascript\',\n            \'html\': \'htmlmixed\'\n        };\n\n        $scope.components = components.map( function ( component ) {\n            var sources,\n                viewerOptions,\n                fileExtension;\n\n            if ( angular.isArray( component.sources ) ) {\n                sources = component.sources.map( function ( sourceFile ) {\n\n                    fileExtension = fileExtensionRE.exec( sourceFile );\n\n                    viewerOptions = {\n                        lineWrapping: true,\n                        lineNumbers: true,\n                        readOnly: \'nocursor\',\n                        mode: codeMirrorModes[ fileExtension[ 1 ] ] || \'xml\'\n                    };\n\n                    return {\n                        fileName: sourceFile,\n                        code: $templateCache.get( \'/library/\' + component.name + \'/docs/\' + sourceFile ),\n                        viewerOptions: viewerOptions\n                    };\n                } );\n            }\n\n            return {\n                name: component.name,\n                template: \'/library/\' + component.name + \'/docs/demo.html\',\n                docs: \'/library/\' + component.name + \'/docs/readme.md\',\n                sources: sources\n            };\n        } );\n\n    }\n);");
$templateCache.put("/library/ComponentList/docs/demo.js","/*globals console, angular, Chance*/\n\nvar demoApp = angular.module( \'cyphy.ui.ComponentList.demo\', [\n    \'cyphy.components\',\n    \'cyphy.components.templates\'\n] );\n\n// see ComponentDetails for mocked ComponentService..");
$templateCache.put("/library/DesignList/docs/demo.js","/*globals console, angular, Chance*/\n\nvar demoApp = angular.module( \'cyphy.ui.DesignList.demo\', [\n    \'cyphy.components\',\n    \'cyphy.components.templates\'\n] );\n\ndemoApp.service( \'designService\', function () {\n    \'use strict\';\n\n} );");
$templateCache.put("/library/DesignTree/docs/demo.js","/*globals console, angular, Chance*/\n\nvar demoApp = angular.module( \'cyphy.ui.DesignTree.demo\', [\n    \'cyphy.components\',\n    \'cyphy.components.templates\'\n] );\n\ndemoApp.service( \'designService\', function () {\n    \'use strict\';\n\n    this.watchDesignStructure = function ( parentContext, designId, updateListener ) {\n        var treeStructure;\n\n        treeStructure = {\n            id: \'/1\',\n            label: \'Design space name\',\n            extraInfo: \'\',\n            unCollapsible: true,\n            children: [ {\n                id: \'/1/1\',\n                label: \'Container 1\',\n                extraInfo: \'Compound\',\n\n                children: [ {\n                    id: \'/1/1/1\',\n                    label: \'Sub Container 1\',\n                    extraInfo: \'Compound\'\n                }, {\n                    id: \'/1/1/2\',\n                    label: \'Sub Container 2\',\n                    extraInfo: \'Compound\'\n                }, {\n                    id: \'/1/1/3\',\n                    label: \'Sub Container 3\',\n                    extraInfo: \'Compound\'\n                } ],\n                childrenCount: 3\n            }, {\n                id: \'/1/2\',\n                label: \'Container 2\',\n                extraInfo: \'Alternative\'\n            }, {\n                id: \'/1/3\',\n                label: \'Container 3\',\n                extraInfo: \'Optional\'\n            } ],\n            childrenCount: 3\n        };\n\n        updateListener( null, treeStructure );\n    };\n\n} );");
$templateCache.put("/library/TestBenchList/docs/demo.js","/*globals console, angular, Chance*/\n\nvar demoApp = angular.module( \'cyphy.ui.TestBenchList.demo\', [\n    \'cyphy.components\',\n    \'cyphy.components.templates\'\n] );\n\ndemoApp.service( \'TestBenchService\', function () {\n    \'use strict\';\n} );");
$templateCache.put("/library/WorkspaceList/docs/demo.js","/*globals console, angular, Chance, setTimeout*/\n\nvar demoApp = angular.module( \'cyphy.ui.WorkspaceList.demo\', [\n    \'cyphy.components\',\n    \'cyphy.components.templates\'\n] );\n\n// overwrite WorkspaceService with dummy data\ndemoApp.service( \'WorkspaceService\', function ( $q, $timeout ) {\n    \'use strict\';\n\n    var self = this,\n        workspaceUpdateListener;\n\n    this.duplicateWorkspace = function ( context, otherWorkspaceId ) {\n        console.log( \'Not implemented.\', otherWorkspaceId );\n    };\n\n    this.createWorkspace = function ( context, data ) {\n        console.log( \'Not implemented.\', data );\n    };\n\n    this.deleteWorkspace = function ( context, workspaceId, msg ) {\n        $timeout( function () {\n            workspaceUpdateListener( {\n                id: workspaceId,\n                type: \'unload\',\n                data: null\n            } );\n        }, 400 );\n    };\n\n    this.exportWorkspace = function ( workspaceId ) {\n        console.log( \'Not implemented.\', workspaceId );\n    };\n\n    this.watchWorkspaces = function ( parentContext, updateListener ) {\n        var deferred = $q.defer(),\n            i,\n            numItems,\n            data = {\n                regionId: \'region_mockId\',\n                workspaces: {} // workspace = {id: <string>, name: <string>, description: <string>}\n            };\n\n        workspaceUpdateListener = updateListener;\n\n        self.chance = new Chance();\n        numItems = 3;\n\n        for ( i = 0; i < numItems; i += 1 ) {\n            data.workspaces[ i ] = {\n                id: i,\n                name: self.chance.name(),\n                description: self.chance.sentence()\n            };\n        }\n\n        $timeout( function () {\n            updateListener( {\n                id: \'update_1\',\n                type: \'load\',\n                data: {\n                    id: \'update_1\',\n                    name: \'Created elsewhere\',\n                    description: \'New Workspace from update listener\'\n                }\n            } );\n        }, 2500 );\n\n        deferred.resolve( data );\n\n        return deferred.promise;\n    };\n\n    this.watchNumberOfComponents = function ( parentContext, workspaceId, updateListener ) {\n        var deferred = $q.defer();\n        $timeout( function () {\n            updateListener( {\n                id: \'/1/1\',\n                type: \'unload\',\n                data: self.chance.integer( {\n                    min: 0,\n                    max: 175\n                } )\n            } );\n        }, 5000 );\n        deferred.resolve( {\n            regionId: workspaceId,\n            count: self.chance.integer( {\n                min: 0,\n                max: 175\n            } )\n        } );\n        return deferred.promise;\n    };\n\n    this.watchNumberOfDesigns = function ( parentContext, workspaceId, updateListener ) {\n        var deferred = $q.defer();\n        $timeout( function () {\n            updateListener( {\n                id: \'/1/1\',\n                type: \'unload\',\n                data: self.chance.integer( {\n                    min: 0,\n                    max: 15\n                } )\n            } );\n        }, 7000 );\n        deferred.resolve( {\n            regionId: workspaceId,\n            count: self.chance.integer( {\n                min: 0,\n                max: 15\n            } )\n        } );\n        return deferred.promise;\n    };\n\n    this.watchNumberOfTestBenches = function ( parentContext, workspaceId, updateListener ) {\n        var deferred = $q.defer();\n        $timeout( function () {\n            updateListener( {\n                id: \'/1/1\',\n                type: \'unload\',\n                data: self.chance.integer( {\n                    min: 0,\n                    max: 10\n                } )\n            } );\n        }, 3000 );\n        deferred.resolve( {\n            regionId: workspaceId,\n            count: self.chance.integer( {\n                min: 0,\n                max: 10\n            } )\n        } );\n        return deferred.promise;\n    };\n\n    this.cleanUpRegion = function ( parentContext, regionId ) {\n        console.log( \'cleanUpRegion\' );\n    };\n\n    this.cleanUpAllRegions = function ( parentContext ) {\n        console.log( \'cleanUpAllRegions\' );\n    };\n\n    this.registerWatcher = function ( parentContext, fn ) {\n        fn( false );\n    };\n} );\n\ndemoApp.service( \'FileService\', function ( $q ) {\n    \'use strict\';\n\n    this.getDownloadUrl = function ( hash ) {\n        return null;\n    };\n\n    this.saveDroppedFiles = function ( files, validExtensions ) {\n        var deferred = $q.defer(),\n            addedFiles = [],\n            i;\n        for ( i = 0; i < files.length; i += 1 ) {\n            addedFiles.push( {\n                hash: \'\',\n                name: files[ i ].name,\n                type: \'zip\',\n                size: files[ i ].size,\n                url: \'\'\n            } );\n        }\n\n        deferred.resolve( addedFiles );\n\n        return deferred.promise;\n    };\n} );");
$templateCache.put("/library/componentBrowser/docs/demo.js","/*globals console, angular, Chance*/\n\nvar demoApp = angular.module( \'cyphy.ui.componentBrowser.demo\', [\n    \'cyphy.components\',\n    \'cyphy.components.templates\'\n] );\n\n// see ComponentDetails for mocked ComponentService..");
$templateCache.put("/library/ComponentList/docs/readme.md","TODO: add description of `ComponentList`");
$templateCache.put("/library/DesignList/docs/readme.md","TODO: add description of `DesignList`");
$templateCache.put("/library/DesignTree/docs/readme.md","TODO: add description of `DesignTree`");
$templateCache.put("/library/TestBenchList/docs/readme.md","TODO: add description of `TestBenchList`");
$templateCache.put("/library/WorkspaceList/docs/readme.md","`WorkspaceList` components lists all workspaces in a WebGME project that uses the `ADMEditor` meta-model.\n\nWorkspace item structure\n\n* `id` - {string} identifier\n* `name` - {string} displayed name\n* `toolTip` - {string} tool tip on displayed name\n* `description` - {string} short description of the content\n* `lastUpdated` - {object} \n    - `time` - {date|string} date of last update\n    - `user` - {name} username who last updated\n* `stats` - {array of object} summary of statistics (components, design spaces, test benches, requirements)\n\nSee `demo.js` for an example.");
$templateCache.put("/library/componentBrowser/docs/readme.md","TODO: add description of `ComponentBrowser`");}]);