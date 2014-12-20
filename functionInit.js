/**
 * @Author: Krishna Kumar (krishna_aim24@yahoo.com)
 */
application.controller("cntrGuestDetails", ["$scope", "Application", "GuestDetails", "DetailsSections",
    function cntrGuestDetails(scope, apps, details, sections) {
        scope.test = "okay";
        scope.images = apps.images;
        scope.views = apps.views;
        details.getGuestList(scope);
        scope.insertView = function(view) {
            return scope.views + view;
        };
        scope.extendGuestDetails = function(ind) {
            scope.ifExtendGuestSelected = ind;
        };
        scope.ifExtendGuest = function(ind) {
            return scope.ifExtendGuestSelected == ind;
        };
        scope.guestMoreInformation = function(evt, ind) {
            var guestList = sections.getSelectedData(scope, "guestList", ind);
            sections.setSharedData(guestList);
            angular.forEach(scope.guestList, function(object, key) {
                object.displayFlightInformation = "N";
                object.displayHotelInformation = "N";
            });
            guestList.displayFlightInformation = guestList["flyingOut"] === "Y" ? "Y" : "N";
            guestList.displayHotelInformation = guestList["hotelNeeds"] === "Y" ? "Y" : "N";
        };
    }
]).controller("cntrFlightSection", ["$scope", "Application", "GuestDetails", "DetailsSections",
    function cntrFlightSection(scope, apps, details, sections) {
        scope.$watch(function() {
            return sections.getSharedData();
        }, function() {
            scope.modelFlightInfo = sections.getSharedData() ? sections.getSharedData().flightInformation : [{}];
        });
    }
]).controller("cntrHotelSection", ["$scope", "Application", "GuestDetails", "DetailsSections",
    function cntrHotelSection(scope, apps, details, sections) {
        scope.$watch(function() {
            return sections.getSharedData();
        }, function() {
            scope.modelHotelInfo = sections.getSharedData() ? sections.getSharedData().hotelInformation : [{}];
        });
    }
]).controller("cntrLeftDetails", ["$scope", "Application", "GuestDetails", "DetailsSections",
    function cntrLeftDetails(scope, apps, details, sections) {}
]).controller("cntrRightDetails", ["$scope", "Application", "GuestDetails", "DetailsSections", "GlobalConst",
    function cntrRightDetails(scope, apps, details, sections, global) {
        scope.addSection = function addGuest(section, event, object, column) {
            var selected = sections.getSelectedIndex(event.target),
                selValue = apps.getValue(section, global);
            sections.getSelectedData.apply(null, [scope, "guestList", selected])[selValue].push(angular.copy(apps.getValue(selValue, global)));
            details.guestAdd(apps.getValue(section, global), selected, column, {
                scope: scope,
                data: sections.getSelectedData(scope, "guestList", selected),
                success: function(result) {
                    apps.sayMessage(result);
                }
            });
        };
        scope.copySection = function copyGuest(section, event, object, column) {
            details.guestInsert(apps.getValue(section, global), scope, {
                scope: scope,
                data: sections.getSelectedData(scope, "guestList"),
                row: sections.getSelectedIndex(event.target),
                success: function callOnSuccess(result) {
                    apps.sayMessage(result);
                }
            });
        };
        scope.removeSection = function deleteGuest(section, event, column) {
            section = apps.getValue(section, global);
            var element = event.target;
            apex.custom.confirm({
                body: "Are you sure?",
                okay: function() {
                    scope.$apply(function() {
                        var selected = sections.getSelectedIndex(element);
                        details.guestDelete(section, selected, column, {
                            scope: scope,
                            data: sections.getSelectedData(scope, "guestList", selected),
                            success: function(result) {
                                scope.$apply(function() {
                                    var length = 0,
                                        colltr = sections.getSelectedData(scope, "guestList", selected);
                                    colltr[section].splice(column, 1);
                                    length = colltr[section].length;
                                    colltr[apps.getValue(section + "Visible", global)] = length ? "Y" : "N";
                                    colltr[apps.getValue(section + "CopyToAll", global)] = length ? "" : "Y";
                                });
                                apps.sayMessage(result);
                            }
                        });
                    });
                },
                cancel: function callOnCancel(object) {}
            });
        };
        scope.saveSection = function saveGuest(section, event, pIndex, column) {
            var selected = sections.getSelectedIndex(event.target);
            section = apps.getValue(section, global);
            details.guestSave(section, selected, column, {
                scope: scope,
                data: sections.getSelectedData(scope, "guestList", selected),
                success: function(result) {
                    scope.$apply(function() {
                        var colltr = sections.getSelectedData(scope, "guestList", selected),
                            length = colltr[section].length;
                        colltr[apps.getValue(section + "Visible", global)] = length ? "Y" : "N";
                        colltr[apps.getValue(section + "CopyToAll", global)] = length ? "" : "Y";
                    });
                    apps.sayMessage(result);
                }
            });
        };
        scope.saveAllChanges = function saveAllChanges(event, index) {
            details.commitToServer({
                scope: scope,
                data: sections.getSelectedData(scope, "guestList")
            });
        };
        scope.cancelAllChanges = function cancelAllChanges(page) {
            apex.custom.confirm({
                body: "Are you sure?",
                okay: function() {
                    apex.custom.gotoPage(page || 1);
                },
                cancel: function(object) {}
            });
        };
        scope.changeVisibleState = function changeVisibleState(section, value, event, column) {
            var section, target = angular.element(".expend-collapse-cell", sections.getSelectedRow(event.target)).attr("class").split(" "),
                guestList = sections.getSelectedData(scope, "guestList", sections.getSelectedIndex(event.target)),
                category, warning = "Selecting 'No' means, current user will lost all the data already stored in it.",
                fields = "A" === section ? "global" : /flight/i.test(section) ? "flight" : /hotel/i.test(section) ? "hotel" : null,
                action = /global/i.test(fields) ? null : value,
                stateUpdate = function stateUpdate() {
                    sections.setSharedData(guestList);
                    angular.forEach(scope.guestList, function(obj, key) {
                        obj.displayFlightInformation = "N";
                        obj.displayHotelInformation = "N";
                    });
                    guestList[section] && guestList[section].length && guestList[section].push(angular.copy(apps.getValue(section, global)));
                    //angular.element("span", target.join(".")).text("+");
                    guestList.displayFlightInformation = "Y" === guestList.flyingOut ? "Y" : "N";
                    guestList.displayHotelInformation = "Y" === guestList.hotelNeeds ? "Y" : "N";
                    //angular.element(event.target).text("Y" === guestList.displayFlightInformation || "Y" === guestList.displayHotelInformation ? "-" : "+");
                    !scope.$$phase && scope.$apply();
                },
                confirmInput = function confirmInput() {
                    guestList[category] = action;
                    guestList[apps.getValue(section + "Show", global)] = "Y" === guestList[category] ? guestList[category] : "";
                    stateUpdate();
                    !scope.$$phase && scope.$apply();
                };
            target.join && target.unshift("");
            /global/i.test(fields) ? stateUpdate() : (section = apps.getValue(section, global), category = apps.getValue(section + "Visible", global), guestList[category] != action && "N" === action ? apex.custom.confirm({
                body: warning,
                okay: function() {
                    confirmInput();
                },
                cancel: function(a) {}
            }) : confirmInput());
        };
    }
]).controller("ModalDemoCtrl", ["$scope", "Application", "GuestDetails", "DetailsSections", "GlobalConst", "$modal", "$log",
    function ModalDemoCtrl($scope, apps, details, sections, global, $modal, $log) {
        $scope.openSpecialNeeds = function(event, currentIndex, arrSize) {
            var selectedRow = sections.getSelectedIndex(event.target);
            details.getSpecialNeeds('getSpecialNeeds', selectedRow, currentIndex, {
                scope: $scope,
                data: sections.getSelectedData($scope, "guestList", selectedRow),
                success: function(data) {
                    $scope.$apply(function() {
                        var modalInstance = $modal.open({
                            templateUrl: "myModalContent.html",
                            controller: "ModalInstanceCtrl",
                            size: arrSize,
                            resolve: {
                                items: function() {
                                    return data;
                                }
                            }
                        });
                        modalInstance.result.then(function(selectedItem) {
                            $scope.selected = selectedItem;
                        }, function() {});
                    });
                }
            });
        };
    }
]).controller("ModalInstanceCtrl", ["$scope", "Application", "GuestDetails", "DetailsSections", "GlobalConst", "$modalInstance", "items", "$rootScope",
    function ModalInstanceCtrl($scope, apps, details, sections, global, $modalInstance, items, parent) {
        var activeTabs = [];
        $scope.items = items;
        $scope.selected = {
            item: $scope.items[0]
        };
        $scope.showAccordian = function(tab) {
            return activeTabs.indexOf(tab) > -1;
        };
        $scope.accordian = function(tab) {
            $scope.showAccordian(tab) ? activeTabs.splice(activeTabs.indexOf(tab), 1) : activeTabs.push(tab);
        };
        $scope.specialNeedsStatus = function(event, index) {
            $scope.items[index].status = angular.element(event.target)[0].checked ? 'Y' : 'N';
        };
        $scope.saveSpecialNeeds = function(event, index) {
            details.setSpecialNeeds('saveSpecialNeeds', null, index, {
                scope: $scope,
                data: sections.getGuestList(null),
                success: function(data) {
                    $modalInstance.dismiss("cancel");
                    apex.custom.successMessage(data.length ? data[0].msg : data.msg);
                }
            }, {
                comment: $scope.spComments,
                specialAdd: $scope.addSpecialComments
            });
        };
        $scope.cancelSpecialNeeds = function() {
            $modalInstance.dismiss("cancel");
        };
    }
]);
