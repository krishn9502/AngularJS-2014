/**
 * @Author: Krishna Kumar (krishna_aim24@yahoo.com)
 */
var application = angular.module("guestDetails", ["ngSanitize", "ui.bootstrap", "ngAnimate", "ngRoute"]).constant("PageItems", {
    "testname": "testname"
}).constant("GlobalConst", {
    "flight": "flightInformation",
    "hotel": "hotelInformation",
    "flightInformationVisible": "flyingOut",
    "hotelInformationVisible": "hotelNeeds",
    "flightInformationShow": "displayFlightInformation",
    "hotelInformationShow": "displayHotelInformation",
    "flightInformationAddNew": "flightDisabledAddNew",
    "hotelInformationAddNew": "hotelDisabledAddNew",
    "flightInformationCopyToAll": "flightDisabledCopyToAll",
    "hotelInformationCopyToAll": "hotelDisabledCopyToAll",
    "flightInformation": {
        "airline": "",
        "flight": "",
        "arrivalCity": "",
        "arrivalDateTime": "",
        "departureCity": "",
        "departureDateTime": ""
    },
    "hotelInformation": {
        "name": "",
        "city": "",
        "checkInDate": "",
        "checkOutDate": ""
    },
    "airlineJsonToText": "Airline",
    "flightJsonToText": "Flight",
    "arrivalCityJsonToText": "Arrival City",
    "arrivalDateTimeJsonToText": "Arrival Date Time",
    "departureCityJsonToText": "Departure City",
    "departureDateTimeJsonToText": "Departure Date Time",
    "nameJsonToText": "Name",
    "cityJsonToText": "City",
    "checkInDateJsonToText": "Check In Date",
    "checkOutDateJsonToText": "Check Out Date",
    "insertSuccessMessage": "Changes have been added",
    "updateSuccessMessage": "Changes have been updated"
}).factory("Application", ["PageItems", function(items) {
    return {
        images: "/images/",
        views: "/views/",
        viewPath: function(view) {
            return this.views + view;
        },
        imagePath: function(image) {
            return this.views + image ? image : "";
        },
        getEmptyArray: function(array) {
            return "";
        },
        getEmptyString: function(string) {
            return "";
        },
        getValue: function(name, items, type) {
            return name ? type ? "#" + items[name] : items[name] : "";
        },
        isDefined: function(object) {
            return typeof object !== 'undefined';
        },
        sayMessage: function(result) {
            apex.custom[(result.status === 'Y' ? 'success' : 'error') + 'Message'](result.msg);
        },
        asyncRequest: function(prcs, itms, funs, type) {
            apex.custom.processAsync({
                appprocess: prcs,
                requestpara: itms
            }, function(data) {
                funs.call({}, apex.custom.toJson(data.replace(/(?:\r\n|\r|\n)/g, "")));
            });
        },
        queryString: (function() {
            var params = {};
            return angular.forEach(window.location.search.substring(1).split("&"), function(obj, key) {
                var param = obj.split("=");
                "undefined" === typeof params[param[0]] ? params[param[0]] = param[1] : "string" === typeof params[param[0]] ? params[param[0]] = [params[param[0]], param[1]] : params[param[0]].push(param[1]);
            }), params;
        }())
    };
}]).factory("DetailsSections", ['Application', function DetailsSections(apps) {
    var tempData = null,
        guestList;
    return {
        setSharedData: function setSharedData(data) {
            tempData = data;
        },
        getSharedData: function getSharedData(data) {
            return tempData;
        },
        getSelectedRow: function getSelectedRow(index) {
            return index ? $(index).closest("tr[data-index]") : $();
        },
        getSelectedIndex: function getSelectedIndex(index) {
            return index ? +$(index).closest("tr[data-index]").attr("data-index") : NaN;
        },
        getSelectedData: function getSelectedData(scope, name, prop) {
            return "undefined" !== typeof prop ? scope[name][prop] : scope[name];
        },
        setGuestList: function(data) {
            guestList = data;
        },
        getGuestList: function(prop) {
            return apps.isDefined(prop) ? guestList[prop] : guestList;
        }
    };
}]).factory("GuestDetails", ["Application", "DetailsSections", "PageItems", "GlobalConst", function userFactory(apps, details, items, global) {
    var $actions = {
        $ifValid: function ifvalid(parent, object, diff) {
            var init = {
                sp: 0,
                ep: 0,
                fi: []
            };
            angular.forEach(object, function loop(obj, key) {
                init.sp++, !!obj ? init.ep++ : init.fi.push(key);
            });
            return diff ? {
                total: init.sp,
                valid: init.ep,
                status: init.sp === init.ep,
                fields: init.fi
            } : init.sp === init.ep;
        },
        $getList: function getGuestListScope(scope) {
            var getDetails = $actions.$listitems(null, {
                collection: apps.queryString,
                property: ["singleVoyno", "singleStateroom", "singleAuthno"]
            });
            apps.asyncRequest("getSingleRowData", getDetails, function getSingleRowData(data) {
                scope.$apply(function applyScope(args) {
                    var msg = !data.join ? "Not A valid data, try again.<br>Redirect to search page?<br>Error: <p style='color:red;'>'" + (data.split(',').join('<br>')) + "'</p>" : "Not A valid data, try again";
                    data.join ? (scope.guestList = data[0].data, scope.stateroom = data[0].global.stateroom, angular.forEach(scope.guestList, function(object, key) {
                        angular.extend(object, {
                            flightDisabledCopyToAll: object.flightInformation.length ? "" : "Y",
                            hotelDisabledCopyToAll: object.hotelInformation.length ? "" : "Y",
                            flightDisabledAddNew: "",
                            hotelDisabledAddNew: ""
                        });
                    }), (details.setGuestList(scope.guestList))) : apex.custom.confirm({
                        body: msg,
                        okay: function(object) {
                            apex.custom.gotoPage(1);
                        }
                    });
                });
            }, !0);
        },
        $listitems: function listItems(coltr, object) {
            coltr = coltr || [];
            return angular.forEach(object.property, function objectProperty(obj, key) {
                obj && angular.element(apps.getValue(obj.join ? obj[0] : obj, items, !0)).val(obj.join ? obj[1] : object.collection[obj] || ""), apps.getValue(obj.join ? obj[0] : obj, items) && coltr.push(apps.getValue(obj.join ? obj[0] : obj, items));
            }), coltr;
        },
        $getitems: function getitems(obj, pobj, seg, blnk) {
            var _items = [],
                inputs = ["voyno", "bookno", "seqno"];
            seg = seg || 0;
            seg && inputs.push.apply(inputs, [
                ["flightSegment", seg],
                ["hotelSegment", seg]
            ]);
            blnk ? _items.push.apply(_items, [apps.getValue('voyno', items), apps.getValue('bookno', items), apps.getValue('seqno', items)]) :
                _items = $actions.$listitems(null, {
                    collection: pobj || obj,
                    property: inputs
                }), angular.forEach(obj, function loopObj(obj, key) {
                    angular.element(apps.getValue(key, items, !0)).val(obj.toString().toUpperCase()), apps.getValue(key, items) && _items.push(apps.getValue(key, items));
                });
            return _items;
        },
        $validate: function validate(sec, row, col, obj, action, flag) {
            var output = $actions.$ifValid(obj.data, obj.data[sec][col], !0);
            output.status ? action.call({}) : flag ? apex.custom.getDelay(function() {
                apex.custom.errorMessage(apps.getValue(output.fields[0] + "JsonToText", global) + " must be filled!");
            }) : "";
        },
        $add: function add(sec, row, col, obj) {
            obj.data[apps.getValue(sec + "CopyToAll", global)] = "Y";
            $actions.$validate.apply(this, Array.prototype.slice.call(arguments).concat(function() {
                return void 0;
            }));
        },
        $insert: function insert(sec, scp, objt) {
            angular.forEach(objt.data, function objtData(obj, key) {
                objt.row !== key && (obj[sec] = angular.copy(details.getSelectedData(scp, "guestList", objt.row)[sec]));
            });
            angular.forEach(objt.data, function(pobj, pkey) {
                var seg = 0,
                    copyAll = sec + "CopyToAllType";
                angular.element(apps.getValue(copyAll, items, !0)).val(objt.row === pkey ? "C" : "D");
                angular.forEach(pobj[sec], function propSec(obj, key) {
                    apps.asyncRequest(sec + "CopyToAll", $actions.$getitems(obj, pobj, ++seg).concat(apps.getValue(copyAll, items)),
                        function getItem(data) {
                            pobj[apps.getValue(sec + "Visible", global)] = pobj[sec].length ? "Y" : "N";
                            objt.success && objt.success(data.join ? data[0] : {
                                status: 'N',
                                msg: 'Error :- ' + data
                            });
                        }, !0);
                });
            });
        },
        $delete: function deleteg(sec, row, col, obj) {
            apps.asyncRequest(sec + "Delete", $actions.$getitems(obj.data[sec][col], obj.data, col + 1), function deleteGuest(data) {
                obj.success && obj.success(data.join ? data[0] : {
                    status: 'N',
                    msg: 'Error :- ' + data
                });
            }, !0);
        },
        $save: function save(sec, row, col, obj) {
            $actions.$validate.apply(this, Array.prototype.slice.call(arguments).concat(function() {
                apps.asyncRequest(sec, $actions.$getitems(obj.data[sec][col], obj.data, col + 1),
                    function asyncRequest(data) {
                        obj.success && obj.success(data.join ? data[0] : {
                            status: 'N',
                            msg: 'Error :- ' + data
                        });
                    }, !0);
            }, !0));
        },
        $specialNeeds: function specialNeeds(sec, row, col, obj, set) {
            var allCodes = [],
                itms = $actions.$getitems(obj.data, obj.data, null, !0);
            set && (angular.forEach(obj.scope.items, function(obj, key) {
                    'Y' === obj.status && allCodes.push(obj.code);
                }),
                angular.element('#iiems').val(allCodes.toString()),
                angular.element('#iiems2').val(set.comment),
                angular.element('#iiems3').val(set.addSpecialComments));
            apps.asyncRequest(sec, set ? itms.concat(['iiems', 'iiems2', 'iiems3']) : itms, function asyncRequest(data) {
                !data.join ? apex.custom.errorMessage('Data is not in valid format') : obj.success && obj.success(data);
            }, !0);
        },
        $validateAll: function validateAll(data, action) {
            for (var rows = 0, cols = 0, prop, info = []; rows < data.length; rows++) {
                for (info.push.apply(info, data[rows].flightInformation.concat(data[rows].hotelInformation)); cols < info.length; cols++) {
                    for (prop in info[cols]) {
                        if (!info[cols][prop]) return rows = data[rows], apex.custom.getDelay(function() {
                            apex.custom.errorMessage(rows.title + " " + rows.firstName + " " + rows.lastName + ':- "' + apps.getValue(prop + "JsonToText", global) + '", is not in valid format, column: (' + (cols + 1) + ")");
                        });
                    }
                }
            }
            return action(info);
        },
        $commitToServer: function save(object) {
            $actions.$validateAll(object.data, function validateAll(res) {
                var data = object.data,
                    count = 0,
                    scope = object.scope,
                    msg = [],
                    all = 0,
                    saveinfo = function saveinfo(obj, key, dkey) {
                        var section = apps.isDefined(obj.airline) && !apps.isDefined(obj.checkInDate) ? "flightInformation" : "hotelInformation";
                        $actions.$save(section, dkey, key, {
                            scope: scope,
                            data: details.getSelectedData(scope, "guestList", dkey),
                            success: function successResult(res) {
                                msg.push(res);
                                scope.$apply(function scopeApply() {
                                    var list = details.getSelectedData(object.scope, "guestList", dkey),
                                        len = list[section].length;
                                    list[apps.getValue(section + "Visible", global)] = len ? "Y" : "N";
                                    list[apps.getValue(section + "CopyToAll", global)] = len ? "" : "Y";
                                });
                            }
                        });
                    };

                angular.forEach(object.data || [], function forEach(value, dkey) {
                    all += value.flightInformation.length + value.hotelInformation.length;
                    angular.forEach(value.flightInformation, function flightInformationSave(obj, key) {
                        saveinfo.apply(null, Array.prototype.slice.call(arguments).concat(dkey));
                    });
                    angular.forEach(value.hotelInformation, function hotelInformationSave(obj, key) {
                        saveinfo.apply(null, Array.prototype.slice.call(arguments).concat(dkey));
                    });
                });
                (function onComplete() {
                    setTimeout(function() {
                        msg.length === all ? (function(msgs) {
                            apex.custom.confirm({
                                body: (function() {
                                    var msgstr = '<span>Total (' + msgs.length + ') records updated / saved</span></br>';
                                    return angular.forEach(msgs, function(val, key) {
                                        msgstr += val.msg + '</br>';
                                    }), msgstr;
                                }()),
                                okay: function() {}
                            });
                        })(msg) : 50 > ++count && onComplete();
                    }, 100);
                })();
            });
        }
    };
    return {
        getGuestList: function approveValidateData(scope) {
            $actions.$getList.apply(this, arguments);
        },
        guestValidate: function approveValidateData(args) {
            $actions.$validate.apply(this, arguments);
        },
        guestAdd: function approveAddData(args) {
            $actions.$add.apply(this, arguments);
        },
        guestInsert: function approveInsertData(args) {
            $actions.$insert.apply(this, arguments);
        },
        guestDelete: function approveDeleteData(args) {
            $actions.$delete.apply(this, arguments);
        },
        guestSave: function approveDeleteData(args) {
            $actions.$save.apply(this, arguments);
        },
        getSpecialNeeds: function getSpecialNeeds(args) {
            $actions.$specialNeeds.apply(this, arguments);
        },
        setSpecialNeeds: function setSpecialNeeds(args) {
            $actions.$specialNeeds.apply(this, arguments);
        },
        commitToServer: function commitToServer(args) {
            $actions.$commitToServer.apply(this, arguments);
        }
    };
}]);
