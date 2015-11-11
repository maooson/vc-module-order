﻿angular.module('virtoCommerce.orderModule')
.controller('virtoCommerce.orderModule.customerOrderListController', ['$scope', 'virtoCommerce.orderModule.order_res_customerOrders', 'platformWebApp.bladeNavigationService', 'platformWebApp.dialogService', 'platformWebApp.authService', 'uiGridConstants', 'platformWebApp.uiGridHelper',
function ($scope, order_res_customerOrders, bladeNavigationService, dialogService, authService, uiGridConstants, uiGridHelper) {
    //pagination settings
    $scope.pageSettings = {};
    $scope.pageSettings.totalItems = 0;
    $scope.pageSettings.currentPage = 1;
    $scope.pageSettings.numPages = 5;
    $scope.pageSettings.itemsPerPageCount = 20;

    $scope.filter = { searchKeyword: undefined };

    $scope.selectedAll = false;
    var selectedNode = null;

    $scope.blade.refresh = function () {
        $scope.blade.isLoading = true;

        var criteria = {
            keyword: $scope.filter.searchKeyword,
            start: ($scope.pageSettings.currentPage - 1) * $scope.pageSettings.itemsPerPageCount,
            count: $scope.pageSettings.itemsPerPageCount
        };
        searchOrders(criteria);
    };

    function searchOrders(criteria) {
        order_res_customerOrders.search(criteria, function (data) {
            $scope.blade.isLoading = false;
            $scope.selectedAll = false;

            $scope.pageSettings.totalItems = angular.isDefined(data.totalCount) ? data.totalCount : 0;
            $scope.objects = data.customerOrders;
            uiGridHelper.onDataLoaded($scope.gridOptions, $scope.objects);

            if (selectedNode != null) {
                //select the node in the new list
                angular.forEach(data.customerOrders, function (node) {
                    if (selectedNode.id === node.id) {
                        selectedNode = node;
                    }
                });
            }
        },
	   function (error) {
	       bladeNavigationService.setError('Error ' + error.status, $scope.blade);
	   });
    };

    $scope.$watch('pageSettings.currentPage', function (newPage) {
        $scope.blade.refresh();
    });

    $scope.selectNode = function (node) {
        selectedNode = node;
        $scope.selectedNodeId = selectedNode.id;

        var newBlade = {
            id: 'operationDetail',
            title: selectedNode.customer + '\'s Customer Order',
            subtitle: 'Edit order details and related documents',
            customerOrder: selectedNode,
            controller: 'virtoCommerce.orderModule.operationDetailController',
            template: 'Modules/$(VirtoCommerce.Orders)/Scripts/blades/customerOrder-detail.tpl.html'
        };

        bladeNavigationService.showBlade(newBlade, $scope.blade);
    };

    $scope.checkAll = function (selected) {
        angular.forEach($scope.objects, function (item) {
            item.selected = selected;
        });
    };

    function deleteChecked() {
        var dialog = {
            id: "confirmDeleteItem",
            title: "Delete confirmation",
            message: "Are you sure you want to delete selected customer orders?",
            callback: function (remove) {
                if (remove) {
                    closeChildrenBlades();

                    var selection = $scope.gridApi.selection.getSelectedRows();
                    var itemIds = _.pluck(selection, 'id');
                    order_res_customerOrders.remove({ ids: itemIds }, function (data, headers) {
                        $scope.blade.refresh();
                    },
                    function (error) { bladeNavigationService.setError('Error ' + error.status, $scope.blade); });
                }
            }
        }
        dialogService.showConfirmationDialog(dialog);
    }

    function closeChildrenBlades() {
        angular.forEach($scope.blade.childrenBlades.slice(), function (child) {
            bladeNavigationService.closeBlade(child);
        });
    }

    $scope.blade.headIcon = 'fa-file-text';

    $scope.blade.toolbarCommands = [
          {
              name: "Refresh", icon: 'fa fa-refresh',
              executeMethod: function () {
                  $scope.blade.refresh();
              },
              canExecuteMethod: function () {
                  return true;
              }
          },
          {
              name: "Delete", icon: 'fa fa-trash-o',
              executeMethod: function () {
                  deleteChecked();
              },
              canExecuteMethod: function () {
                  return $scope.gridApi && _.any($scope.gridApi.selection.getSelectedRows());
              },
              permission: 'order:delete'
          }
    ];

    // ui-grid
    uiGridHelper.initialize($scope, {
        data: 'objects',
        rowTemplate: "<div ng-click=\"grid.appScope.selectNode(row.entity)\" ng-repeat=\"(colRenderIndex, col) in colContainer.renderedColumns track by col.uid\" ui-grid-one-bind-id-grid=\"rowRenderIndex + '-' + col.uid + '-cell'\" class=\"ui-grid-cell\" ng-class=\"{ 'ui-grid-row-header-cell': col.isRowHeader, '__selected': row.entity.id === grid.appScope.selectedNodeId }\" role=\"{{col.isRowHeader ? 'rowheader' : 'gridcell'}}\" ui-grid-cell style='cursor:pointer'></div>",
        rowHeight: 59,
        columnDefs: [
                    {
                        name: 'customColumn', displayName: 'Description', field: 'number',
                        width: '*', cellTemplate: 'order-list-name.cell.html'
                    },
                    { name: 'isApproved', displayName: 'Confirmed', width: 87, cellClass: '__blue' },
                    { name: 'customColumn2', displayName: 'Total', width: 76, field: 'sum', cellTemplate: 'total-list-name.cell.html' },
                    { name: 'createdDate', displayName: 'Created', width: 82, cellClass: 'table-date', cellFilter: 'date', cellTooltip: function (row, col) { return ' '+row.entity.createdDate; }, sort: { direction: uiGridConstants.DESC } }
                    //{ name: 'site', displayName: 'Store', cellTooltip: true }
        ]
    });

    // actions on load
    //No need to call this because page 'pageSettings.currentPage' is watched!!! It would trigger subsequent duplicated req...
    //$scope.blade.refresh();
}]);