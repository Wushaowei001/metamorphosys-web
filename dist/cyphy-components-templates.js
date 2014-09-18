angular.module("cyphy.components.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("/cyphy-components/templates/WorkspaceList.html","<div data-ng-controller=\"WorkspaceListController\">\n    <item-list list-data=\"listData\" config=\"config\" class=\"col-lg-12 col-md-12 col-sm-12 col-xs-12\"></item-list>\n</div>");
$templateCache.put("/cyphy-components/templates/WorkspaceNewItem.html","<form class=\"drop-box new-order-set\">\n    <div class=\"row\">\n        <div class=\"col-md-3\">\n            <input type=\"text\" class=\"form-control\" data-ng-model=\"newItem.id\"\n                   placeholder=\"ID\">\n        </div>\n    </div>\n    <div class=\"row\">\n        <div class=\"col-md-6\">\n            <input type=\"text\" class=\"form-control\" data-ng-model=\"newItem.title\"\n                   placeholder=\"New item name\">\n        </div>\n    </div>\n    <div class=\"row\">\n        <div class=\"col-md-12\">\n            <textarea class=\"form-control edit-workspace-description\" rows=\"5\"\n                      data-ng-model=\"newItem.description\"\n                      placeholder=\"Description\"></textarea>\n        </div>\n    </div>\n    <div class=\"row form-footer\">\n        <div class=\"col-md-8\">\n            <button class=\"btn btn-default btn-submit btn-success\"\n                    data-ng-click=\"createItem(newItem)\">Create\n            </button>\n        </div>\n    </div>\n</form>");}]);