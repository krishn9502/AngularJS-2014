/**
 * @Author: Krishna Kumar (krishna_aim24@yahoo.com)
 */
"use strict";
angular.module("guestDetails").controller("cntrGuestDetails", ["$scope", "$rootScope", "GuestDetails", "GDUtility", "$timeout", function cntrGuestDetails(GDscope, ROOTScope, GDDetails, GDUtility, $timeout) {
    GDDetails.getGuestList(GDscope);

    // (extend guestMoreInformation) extendGuestDetails function to expand and collapse
    GDscope.extendGuestDetails = function(ind) {
        GDscope.ifExtendGuest(ind) 
			&& (GDscope.ifExtendGuestSelected = '', activeTabs.splice(activeTabs.indexOf(ind), 1)) 
			|| (activeTabs.push(ind), GDscope.ifExtendGuestSelected = ind);
    };

    // guestMoreInformation function to expand and collapse
    GDscope.guestMoreInformation = function(ind) {
        var guestList = GDUtility.getSelectedData(GDscope, "guestList", ind);
        GDUtility.setSharedData(guestList);
        angular.forEach(GDscope.guestList, function(object, key) {
            object.displayFlightInformation = "N";
            object.displayHotelInformation = "N";
        });
        guestList.displayFlightInformation = guestList["flyingOut"] === "Y" ? "Y" : "N";
        guestList.displayHotelInformation = guestList["hotelNeeds"] === "Y" ? "Y" : "N";
    };

    apex.custom.processAsync({
        appprocess: 'transportData'
    }, function(data) {
        ROOTScope.transportData = apex.custom.toJson(data.replace(/(?:\r\n|\r|\n)/g, ""));
    });
}])

// controller cntrFlightSection only applied to flight section in right part
.controller("cntrFlightSection", ["$scope", "GuestDetails", "GDUtility", function cntrFlightSection(FSscope, GDDetails, GDUtility) {
    FSscope.$watch(function() {
        return GDUtility.getSharedData();
    }, function() {
        FSscope.modelFlightInfo = GDUtility.getSharedData() ? GDUtility.getSharedData().flightInformation : [{}];
    });
}])

// controller cntrHotelSection only applied to hotel section in right part
.controller("cntrHotelSection", ["$scope", "GuestDetails", "GDUtility", function cntrHotelSection(HSscope, GDDetails, GDUtility) {
    HSscope.$watch(function() {
        return GDUtility.getSharedData();
    }, function() {
        HSscope.modelHotelInfo = GDUtility.getSharedData() ? GDUtility.getSharedData().hotelInformation : [{}];
    });
}])

// left part controller parent for left list
.controller("cntrLeftDetails", ["$scope", "$rootScope", "GuestDetails", "GDUtility", function cntrLeftDetails(LDscope, ROOTScope, GDDetails, GDUtility) {
    // no action
}])

// right part controller parent for both section flight and hotel
.controller("cntrRightDetails", ["$scope", "GuestDetails", "GDUtility", "GlobalConst",
    function cntrRightDetails(RDscope, GDDetails, GDUtility, global) {
        apex.custom.processAsync({ appprocess: 'getCityData' }, function(response) { });
        apex.custom.processAsync({ appprocess: 'getCarrierData' }, function(response) { });

        // get selected drop-down index and parent index to get the selected data
        RDscope.getInitIndex = function(event, index) {
            GDUtility.setSelectIndex(GDUtility.getSelectedIndex(event.target));
        };

        // save all changes in a single action for all the part (left, top, hotel and flight)
        RDscope.saveAllChanges = function saveAllChanges(event, index) {
            GDDetails.commitToServer('saveTransportMobileData', {
                scope: RDscope,
                data: GDUtility.getSelectedData(RDscope, "guestList")
            });
        };

        // cancel all changes in and redirect to search page
        RDscope.cancelAllChanges = function cancelAllChanges(page) {
            apex.custom.confirm({
                title: 'Cancel all changes?',
                body: "Are you sure?",
                okay: function() {
                    apex.custom.gotoPage(page || 1);
                },
                cancel: function(object) {}
            });
        };

        // (extend getInitIndex) get selected drop-down index and parent index to get the selected data
        // modifySelected ==> update selected data into root model
        RDscope.modifySelected = function(section, property, element, index) {
            var getProperty = GDUtility.getSelectIndex('object');
            getProperty.status && property 
				&& (RDscope.guestList[getProperty.value][GDUtility.getValue(section, global)][index][property] = element || '');
				
            getProperty.status && !property && (RDscope.guestList[getProperty.value][section] = element || '');
        };

        // add new guest functionality for both section (flight & hotel information)
        RDscope.addSection = function addGuest(section, event, object, column) {
            var selected = GDUtility.getSelectedIndex(event.target),
                selValue = GDUtility.getValue(section, global);
				
            GDUtility.getSelectedData.apply(null, [RDscope, "guestList", selected])[selValue]
                .push(angular.copy(GDUtility.getValue(selValue, global)));
				
            GDDetails.guestAdd(GDUtility.getValue(section, global), selected, column, {
                scope: RDscope,
                data: GDUtility.getSelectedData(RDscope, "guestList", selected),
                success: function(result) {
                    GDUtility.sayMessage(result);
                }
            });
        };

        // copy to all functionality for both section (flight & hotel information)
        RDscope.copySection = function copyGuest(section, event, object, column) {
            // if (RDscope.validateSaveSection(section,column)){
            GDDetails.guestInsert(GDUtility.getValue(section, global), RDscope, {
                scope: RDscope,
                data: GDUtility.getSelectedData(RDscope, "guestList"),
                row: GDUtility.getSelectedIndex(event.target),
                success: function callOnSuccess(result) {
                    GDDetails.getGuestList(GDUtility.getRootScope());
                    GDUtility.sayMessage(result);
                }
            });
            // }
        };

        // save, add or update new or pre inserted guest functionality for both section (flight & hotel information)
        // RDscope.validateSaveSection= function (section, column){
        RDscope.saveSection = function saveGuest(section, event, pIndex, column) {
            // if (RDscope.validateSaveSection(section,column)){
            var selected = GDUtility.getSelectedIndex(event.target);
            section = GDUtility.getValue(section, global);
            GDDetails.guestSave(section, selected, column, {
                scope: RDscope,
                data: GDUtility.getSelectedData(RDscope, "guestList", selected),
                success: function(result) {
                    RDscope.$apply(function() {
                        var colltr = GDUtility.getSelectedData(RDscope, "guestList", selected),
                            length = colltr[section].length;
                        colltr[GDUtility.getValue(section + "Visible", global)] = length ? "Y" : "N";
                        colltr[GDUtility.getValue(section + "CopyToAll", global)] = length ? "" : "Y";
                    });
                    GDUtility.sayMessage(result);
                }
            });
            // }
        };

        // remove or delete already listed guest functionality for both section (flight & hotel information)
        RDscope.removeSection = function deleteGuest(section, event, column) {
            section = GDUtility.getValue(section, global);
            var element = event.target;
            apex.custom.confirm({
                body: "Are you sure?",
                okay: function() {
                    RDscope.$apply(function() {
                        var selected = GDUtility.getSelectedIndex(element);
                        GDDetails.guestDelete(section, selected, column, {
                            scope: RDscope,
                            data: GDUtility.getSelectedData(RDscope, "guestList", selected),
                            success: function(result) {
                                RDscope.$apply(function() {
                                    var length = 0,
                                        colltr = GDUtility.getSelectedData(RDscope, "guestList", selected);
                                    colltr[section].splice(column, 1);
                                    length = colltr[section].length;
                                    colltr[GDUtility.getValue(section + "Visible", global)] = length ? "Y" : "N";
                                    colltr[GDUtility.getValue(section + "CopyToAll", global)] = length ? "" : "Y";
                                });
                                GDUtility.sayMessage(result);
                            }
                        });
                    });
                },
                cancel: function callOnCancel(object) {}
            });
        };

        // (extend guestMoreInformation) changeVisibleState function to expand and collapse
        RDscope.changeVisibleState = function changeVisibleState(section, value, event, column) {
            var section, target = angular.element(".expend-collapse-cell", GDUtility.getSelectedRow(event.target)).attr("class").split(" "),
                getSelectedIndex = GDUtility.getSelectedIndex(event.target),
                guestList = GDUtility.getSelectedData(RDscope, "guestList", getSelectedIndex),
                category, warning = "Selecting 'No' means, current user will lost all the data already stored in it.",
                fields = "A" === section ? "global" : /flight/i.test(section) ? "flight" : /hotel/i.test(section) ? "hotel" : null,
                action = /global/i.test(fields) ? null : value,

                stateUpdate = function stateUpdate() {
                    GDUtility.setSharedData(guestList);
                    angular.forEach(RDscope.guestList, function(obj, key) {
                        obj.displayFlightInformation = "N";
                        obj.displayHotelInformation = "N";
                    });
                    /global/i.test(fields) && RDscope.extendGuestDetails(column);
                    guestList[section] && !guestList[section].length && guestList[section].push(angular.copy(GDUtility.getValue(section, global)));
                    guestList.displayFlightInformation = "Y" === guestList.flyingOut ? "Y" : "N";
                    guestList.displayHotelInformation = "Y" === guestList.hotelNeeds ? "Y" : "N";
                    !RDscope.$$phase && RDscope.$apply();
                },

                confirmInput = function confirmInput() {
                    guestList[category] = action;
                    guestList[GDUtility.getValue(section + "Show", global)] = "Y" === guestList[category] ? guestList[category] : "";
                    GDDetails.deleteAllGuest('DeleteAllSection', {
                        section: section,
                        data: guestList,
                        success: function(response) {
                            GDDetails.getGuestList(GDUtility.getRootScope());
                        }
                    });

                    !RDscope.$$phase && RDscope.$apply();
                };

            target.join && target.unshift("");
            /global/i.test(fields) ? stateUpdate() : (section = GDUtility.getValue(section, global),
                category = GDUtility.getValue(section + "Visible", global),
                guestList[category] != action && "N" === action ? apex.custom.confirm({
                    body: warning,
                    okay: function() {
                        confirmInput();
                    },
                    cancel: function(a) {}
                }) : confirmInput());
        };
    }
])

// controller ModalDemoCtrl only applied to special needs section
.controller("ModalDemoCtrl", ["$scope", "GuestDetails", "GDUtility", "GlobalConst", "$modal", "$log",
    function ModalDemoCtrl(ModalDemoScope, GDDetails, GDUtility, global, $modal, $log) {
        ModalDemoScope.openSpecialNeeds = function(event, currentIndex, arrSize) {
            var selectedRow = GDUtility.getSelectedIndex(event.target);
            GDDetails.getSpecialNeeds('getSpecialNeeds', selectedRow, currentIndex, {
                scope: ModalDemoScope,
                data: GDUtility.getSelectedData(ModalDemoScope, "guestList", selectedRow),
                success: function(data) {
                    ModalDemoScope.$apply(function() {
                        var modalInstance = $modal.open({
                            templateUrl: "myModalContent.html",
                            controller: "ModalInstanceCtrl",
                            size: arrSize,
                            resolve: {
                                items: function() {
                                    return data[0].collection;
                                },
                                spComments: function() {
                                    return data[0].comments;
                                },
                                addSpecialComments: function() {
                                    return data[0].additional;
                                }
                            }
                        });
                        modalInstance.result.then(function(selectedItem) {
                            ModalDemoScope.selected = selectedItem;
                        }, function() {});
                    });
                }
            });
        };
    }
])

// (extend ModalDemoCtrl controller) controller ModalDemoCtrl only for extend functionality for special needs section
.controller("ModalInstanceCtrl", ["$scope", "GuestDetails", "GDUtility", "GlobalConst", "$modalInstance", "items", "spComments", "addSpecialComments", "$rootScope",
    function ModalInstanceCtrl(ModalInstanceScope, GDDetails, GDUtility, global, $modalInstance, items, spComments, addSpecialComments, parent) {
        var _selectedTabs = [];
        ModalInstanceScope.items = items;
        ModalInstanceScope.spComments = spComments;
        ModalInstanceScope.addSpecialComments = addSpecialComments;
        ModalInstanceScope.selected = {
            item: ModalInstanceScope.items[0]
        };
        ModalInstanceScope.twoColumnTable = ModalInstanceScope.items.length > 3;
        ModalInstanceScope.showAccordian = function(currentTab) {
            return _selectedTabs.indexOf(currentTab) > -1;
        };

        ModalInstanceScope.accordian = function(currentTab) {
            ModalInstanceScope.showAccordian(currentTab) ? _selectedTabs.splice(_selectedTabs.indexOf(currentTab), 1) : _selectedTabs.push(currentTab);
        };

        ModalInstanceScope.specialNeedsStatus = function(event, index) {
            ModalInstanceScope.items[index].status = angular.element(event.target)[0].checked ? 'Y' : 'N';
        };
        ModalInstanceScope.saveSpecialNeeds = function(event, index) {
            GDDetails.setSpecialNeeds('saveSpecialNeeds', null, index, {
                scope: ModalInstanceScope,
                data: GDUtility.getGuestList(null),
                success: function(data) {
                    $modalInstance.dismiss("cancel");
                    apex.custom.successMessage(data.length ? data[0].msg : data.msg);
                    GDDetails.getGuestList(GDUtility.getRootScope());
                }
            }, {
                comment: ModalInstanceScope.spComments,
                addSpecialComments: ModalInstanceScope.addSpecialComments
            });
        };

        ModalInstanceScope.resetModelSpecial = function() {
            $modalInstance.dismiss("cancel");
        };
        ModalInstanceScope.crossButton = function() {
            $modalInstance.dismiss("cancel");
        };
    }
]);
