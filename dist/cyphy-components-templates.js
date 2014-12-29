angular.module("cyphy.components.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("/cyphy-components/templates/ComponentEdit.html","<form>\n    <div class=\"modal-header\">\n        <h3 class=\"modal-title\">Edit Component</h3>\n    </div>\n    <div class=\"modal-body\">\n        <div class=\"row\">\n            <div class=\"col-md-12\">\n                <span class=\"title\">Description</span>\n                <textarea class=\"form-control edit-description\" data-ng-model=\"data.description\"></textarea>\n            </div>\n        </div>\n    </div>\n    <div class=\"modal-footer\">\n        <button class=\"btn btn-primary\" ng-click=\"ok()\">OK</button>\n        <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n    </div>\n</form>");
$templateCache.put("/cyphy-components/templates/ComponentList.html","<div class=\"component-list\">\n    <script type=\"text/ng-template\" id=\"componentDetails.html\">\n        <component-details data-component-id=\"listData.items[$index].id\"></component-details>\n    </script>\n    <item-list list-data=\"listData\" config=\"config\" class=\"col-lg-12 col-md-12 col-sm-12 col-xs-12\"></item-list>\n</div>");
$templateCache.put("/cyphy-components/templates/ConfigurationSetSelector.html","<span class=\"configuration-set-selector\">\n    <div class=\"btn-group\" dropdown is-open=\"dataModel.isOpen\">\n        <button type=\"button\" class=\"btn btn-default btn-sm dropdown-toggle\" ng-disabled=\"dataModel.dataAvaliable === false\">\n            Load Set <span class=\"caret\"></span>\n        </button>\n        <ul class=\"dropdown-menu\" role=\"menu\">\n            <li ng-repeat=\"configurationSet in dataModel.configurationSets\">\n                <a ng-click=\"loadConfigurations(configurationSet.id, configurationSet.name)\">{{configurationSet.name}}</a>\n            </li>\n        </ul>\n    </div>\n</span>");
$templateCache.put("/cyphy-components/templates/ConfigurationTable.html","<div class=\"configuration-table\">\n\n    <script type=\"text/ng-template\" id=\"tableCell.html\">\n        <a ng-click=\"cfgClicked(item)\" tooltip=\"View in tree\" tooltip-placement=\"right\"> {{item.name}} </a>\n\n        <a ng-repeat=\"res in item.results\" class=\"results\" tooltip=\"Results avaliable\" tooltip-placement=\"right\">!</a>\n    </script>\n\n    <p class=\"text-muted\">\n        Selected: <span class=\"badge\">{{ dataModel.selected.length }}</span> of\n        <span class=\"badge\">{{ dataModel.configurations.length }}</span> in {{dataModel.setName}}\n    </p>\n\n    <!-- ========== Usage ========== -->\n    <ad-table-lite table-name=\"DesertConfigurations\"\n                   column-definition=\"tableColumnDefinition\"\n                   local-data-source=\"dataModel.configurations\"\n                   page-sizes=\"[10, 20, 50, 100]\"\n                   pagination-btn-group-classes=\"btn-group btn-group-sm\"\n                   table-classes=\"table table-bordered\"\n                   selected-items=\"dataModel.selected\">\n    </ad-table-lite>\n</div>");
$templateCache.put("/cyphy-components/templates/DesignEdit.html","<form>\n    <div class=\"modal-header\">\n        <h3 class=\"modal-title\">Edit Design</h3>\n    </div>\n    <div class=\"modal-body\">\n        <div class=\"row\">\n            <div class=\"col-md-6\">\n                <span class=\"title\">Name</span>\n                <input type=\"text\" class=\"form-control\" data-ng-model=\"data.name\">\n            </div>\n        </div>\n        <div class=\"row\">\n            <div class=\"col-md-12\">\n                <span class=\"title\">Description</span>\n                <textarea class=\"form-control edit-description\" data-ng-model=\"data.description\"></textarea>\n            </div>\n        </div>\n    </div>\n    <div class=\"modal-footer\">\n        <button class=\"btn btn-primary\" ng-click=\"ok()\">OK</button>\n        <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n    </div>\n</form>");
$templateCache.put("/cyphy-components/templates/DesignList.html","<div class=\"design-list\">\n    <script type=\"text/ng-template\" id=\"designDetails.html\">\n        <design-details data-design-id=\"listData.items[$index].id\"></design-details>\n    </script>\n    <item-list list-data=\"listData\" config=\"config\" class=\"col-lg-12 col-md-12 col-sm-12 col-xs-12\"></item-list>\n</div>");
$templateCache.put("/cyphy-components/templates/DesignTree.html","<div class=\"design-tree\">\n    <tree-navigator tree-data=\"treeData\" config=\"config\"></tree-navigator>\n</div>");
$templateCache.put("/cyphy-components/templates/SimpleModal.html","<form>\n    <div class=\"modal-header\">\n        <h3 class=\"modal-title\">{{data.title}}</h3>\n    </div>\n    <div class=\"modal-body\">\n        <div class=\"row\">\n            <div class=\"col-md-12\">\n                {{data.details}}\n            </div>\n        </div>\n    </div>\n    <div class=\"modal-footer\">\n        <button class=\"btn btn-primary\" ng-click=\"ok()\">OK</button>\n        <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n    </div>\n</form>");
$templateCache.put("/cyphy-components/templates/TestBenchEdit.html","<form>\n    <div class=\"modal-header\">\n        <h3 class=\"modal-title\">Edit Test Bench</h3>\n    </div>\n    <div class=\"modal-body drop-box-edit-test-bench\" ng-file-drop=\"onDroppedFiles($files)\"\n         ng-file-drag-over-class=\"dragOverClass($event)\">\n        <div class=\"row\">\n            <div class=\"col-md-6\">\n                <span class=\"title\">Name</span>\n                <input type=\"text\" class=\"form-control\" data-ng-model=\"data.name\">\n            </div>\n        </div>\n        <div class=\"row\">\n            <div class=\"col-md-12\">\n                <span class=\"title\">Description</span>\n                <textarea class=\"form-control edit-description\" data-ng-model=\"data.description\"></textarea>\n            </div>\n        </div>\n        <div class=\"row\">\n            <div class=\"col-md-6\">\n                <span class=\"title\">Test Bench Zip File [drop files here]</span>\n                <br>\n                <a ng-if=\"data.fileInfo.name\" ng-href=\"{{data.fileInfo.url}}\">{{data.fileInfo.name}}</a>\n            </div>\n            <div class=\"col-md-6\">\n                <span class=\"title\">Test Bench Path</span>\n                <input type=\"text\" class=\"form-control\" data-ng-model=\"data.path\">\n            </div>\n        </div>\n    </div>\n    <div class=\"modal-footer\">\n        <button class=\"btn btn-primary\" ng-click=\"ok()\">OK</button>\n        <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n    </div>\n</form>");
$templateCache.put("/cyphy-components/templates/TestBenchList.html","<div class=\"test-bench-list\">\n    <script type=\"text/ng-template\" id=\"testBenchDetails.html\">\n        <test-bench-details data-test-bench-id=\"listData.items[$index].id\"></test-bench-details>\n    </script>\n    <item-list list-data=\"listData\" config=\"config\" class=\"col-lg-12 col-md-12 col-sm-12 col-xs-12\"></item-list>\n</div>");
$templateCache.put("/cyphy-components/templates/WorkersList.html","<div class=\"workers-list\">\n    <ul class=\"workers-list-group\">\n        <li class=\"workers-list-group-item\" data-ng-repeat=\"worker in dataModel.workers\">\n            <h3 class=\"worker-id\">{{ worker.clientId }}</h3>\n            <ul class=\"worker-running-jobs-list\">\n                <li class=\"worker-running-jobs-list-item\" data-ng-repeat=\"job in worker.jobs\">\n                    <span>{{job.status}} :: {{job.createTime}}</span>\n                </li>\n            </ul>\n            <!--<ul class=\"worker-label-list\">-->\n                <!--<li class=\"worker-label-list-item\" data-ng-repeat=\"label in worker.labels\">-->\n                    <!--{{label}}-->\n                <!--</li>-->\n            <!--</ul>-->\n        </li>\n    </ul>\n</div>");
$templateCache.put("/cyphy-components/templates/WorkspaceEdit.html","<form>\n    <div class=\"modal-header\">\n        <h3 class=\"modal-title\">Edit Workspace</h3>\n    </div>\n    <div class=\"modal-body\">\n        <div class=\"row\">\n            <div class=\"col-md-6\">\n                <span class=\"title\">Name</span>\n                <input type=\"text\" class=\"form-control\" data-ng-model=\"data.name\">\n            </div>\n        </div>\n        <div class=\"row\">\n            <div class=\"col-md-12\">\n                <span class=\"title\">Description</span>\n                <textarea class=\"form-control edit-description\" data-ng-model=\"data.description\"></textarea>\n            </div>\n        </div>\n    </div>\n    <div class=\"modal-footer\">\n        <button class=\"btn btn-primary\" ng-click=\"ok()\">OK</button>\n        <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n    </div>\n</form>");
$templateCache.put("/cyphy-components/templates/WorkspaceList.html","<div class=\"workspace-list\">\n    <item-list list-data=\"listData\" config=\"config\" class=\"col-lg-12 col-md-12 col-sm-12 col-xs-12\"></item-list>\n</div>");
$templateCache.put("/cyphy-components/templates/WorkspaceNewItem.html","<form class=\"drop-box-new-workspace\" ng-file-drop=\"onDroppedFiles($files)\" ng-file-drag-over-class=\"dragOverClass($event)\">\n    <div class=\"row\">\n        <div class=\"col-md-6\">\n            <input type=\"text\" class=\"form-control\" data-ng-model=\"newItem.name\"\n                   placeholder=\"Name\">\n        </div>\n    </div>\n    <div class=\"row\">\n        <div class=\"col-md-10\">\n            <textarea class=\"form-control edit-workspace-description\" rows=\"5\"\n                      data-ng-model=\"newItem.description\"\n                      placeholder=\"Description\"></textarea>\n        </div>\n    </div>\n    <ul class=\"dropped-files\">\n        <li class=\"dropped-file\" ng-repeat=\"file in model.droppedFiles\"><span ng-class=\"file.icon\"></span> {{file.name}} [{{file.size}}]</li>\n    </ul>\n    <div class=\"row form-footer\">\n        <div class=\"col-md-8\">\n            <button class=\"btn btn-default btn-submit btn-success\"\n                    data-ng-click=\"createItem(newItem)\">Create\n            </button>\n        </div>\n    </div>\n</form>");
$templateCache.put("/cyphy-components/templates/InterfaceDetails.html","<div class=\"interface-details\">\n    <h5>Connectors</h5>\n    <ul class=\"connector-list\">\n        <li class=\"connector-list-item\" ng-repeat=\"conn in details.connectors\"> {{conn.name}}</li>\n    </ul>\n    <h5>Properties</h5>\n    <ul class=\"property-list\">\n        <li class=\"property-list-item\" ng-repeat=\"prop in details.properties\">\n            {{prop.name}} [{{prop.dataType}}] {{prop.valueType}} <span ng-if=\"prop.derived\"> (is derived)</span>\n        </li>\n    </ul>\n    <h5>Ports</h5>\n    <ul class=\"port-list\">\n        <li class=\"port-list-item\" ng-repeat=\"port in details.ports\"> {{port.name}} [{{port.type}}] {{port.class}}</li>\n    </ul>\n</div>");
$templateCache.put("/cyphy-components/templates/componentBrowser.html","<div class=\"component-browser\">\n    <h2>Components</h2>\n    <!--<md-progress-circular ng-if=\"!loaded\" class=\"md-hue-2\" md-mode=\"indeterminate\"></md-progress-circular>-->\n    <!--<script type=\"text/ng-template\" id=\"componentDetails.html\">-->\n        <!--<component-details data-component-id=\"listData.items[$index].id\"></component-details>-->\n    <!--</script>-->\n    <!--<tree-navigator tree-data=\"treeData\" config=\"config\"></tree-navigator>-->\n    <item-list list-data=\"listData\" config=\"config\" class=\"col-lg-12 col-md-12 col-sm-12 col-xs-12\"></item-list>\n    <!--<tree-navigator tree-data=\"treeData\" config=\"treeConfig\"></tree-navigator>-->\n</div>\n");}]);