(function() {
    'use strict';

    angular
        .module('manateeApp')
        .controller('TeamDetailController', TeamDetailController);

    TeamDetailController.$inject = ['$scope', '$rootScope', '$stateParams', 'previousState', 'entity', 'Team', 'EntityAuditService', 'DTOptionsBuilder', 'DTColumnBuilder', "$q", "Principal"];

    function zeroPad(num, places) {
      var zero = places - num.toString().length + 1;
      return Array(+(zero > 0 && zero)).join("0") + num;
    }

    function generate_table_data(audits, entity) {
        var array_records = [];
        var tmp_patient_team = {};
        for (var i in audits) {
            if (typeof audits[i] === "object")
                if ('id' in audits[i]) {
                    var entityValue = audits[i]['entityValue'];
                    var entityType = audits[i]['entityType'];
                    var action = audits[i]['action'];
                    if (entityType == "com.fangzhou.manatee.domain.Queue") {
                        var patient = entityValue['patient'];
                        var team = entityValue['team'];
                        var teamBefore = "";
                        var teamBeforeId = -1;
                        var utcDate = entityValue['lastModifiedDate']; // ISO-8601 formatted date returned from server
                        var localDate = new Date(utcDate);
                        if (patient['id'] in tmp_patient_team) {
                            teamBefore = tmp_patient_team[patient['id']]['name'];
                            teamBeforeId = tmp_patient_team[patient['id']]['id'];
                        }
                        var weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                        var dayOfWeek = weekday[localDate.getDay()];
                        // var modifiedDate = (localDate.getMonth() + 1) + '/' + localDate.getDate() + '/' + localDate.getFullYear() + ' ' + localDate.getHours() + ':' + (localDate.getMinutes()<10?'0':'') + localDate.getMinutes();
                        var modifiedDate = zeroPad(localDate.getMonth()+1, 2)+"/"+zeroPad(localDate.getDate(), 2)+"/"+zeroPad(localDate.getFullYear(), 4)+" "+zeroPad(localDate.getHours(),2)+":"+zeroPad(localDate.getMinutes(),2)+":"+zeroPad(localDate.getSeconds(),2);

                        var dischargeTransfer = "";
                        var status = entityValue['status'];
                        if (action == "DELETE") {
                            dischargeTransfer = "Discharge/Transfer";
                        } else if (action == "UPDATE") {
                            if (teamBefore == ((team!==null && "name" in team) ? team['name']:"") && status == "potentialdischarge") {
                                dischargeTransfer = "Possible Discharge/Transfer";
                            } else if (teamBefore == ((team!==null && "name" in team) ? team['name']:"") && status != "potentialdischarge") {
                                dischargeTransfer = "Recover";
                            } else {
                                dischargeTransfer = "";
                            }
                        } else if (action == "CREATE") {
                            dischargeTransfer = "";
                            teamBefore = "";
                        }

                        var tmp_one_record = {
                          'patientId': (patient!==null && "medicalReferralID" in patient) ? patient['medicalReferralID']:"",
                          'patientName': (patient!==null && "name" in patient) ? patient['name']:"",
                          'lastModifiedDate': localDate.toString(),
                          'lastModifiedBy': (entityValue!==null && "lastModifiedBy" in entityValue) ? entityValue['lastModifiedBy']:"",
                          'teamBefore': teamBefore,
                          'teamAfter': (team!==null && "name" in team) ? team['name']:"",
                          'dayOfWeek': dayOfWeek,
                          'modifiedDate': modifiedDate,
                          'dischargeTransfer': dischargeTransfer
                        }
                        tmp_patient_team[patient['id']] = team;
                        // console.log(tmp_one_record)
                        if (team['id'] === entity['id'] || teamBeforeId === entity['id']) {
                            array_records.push(tmp_one_record);
                        }
                    }
                }
        }
        return array_records;
    }

    function TeamDetailController($scope, $rootScope, $stateParams, previousState, entity, Team, EntityAuditService, DTOptionsBuilder, DTColumnBuilder, $q, Principal) {
        var vm = this;

        vm.team = entity;
        vm.previousState = previousState.name;

        var unsubscribe = $rootScope.$on('manateeApp:teamUpdate', function(event, result) {
            vm.team = result;
        });
        $scope.$on('$destroy', unsubscribe);

        vm.buttons = [{
            extend: "excelHtml5",
            filename: "master_log",
            title: "Master Log Report",
            exportOptions: {
                columns: ':visible'
            },
            //CharSet: "utf8",
            exportData: {
                decodeEntities: true
            }
        }, {
            extend: "csvHtml5",
            fileName: "master_log",
            exportOptions: {
                columns: ':visible'
            },
            exportData: {
                decodeEntities: true
            }
        }, {
            extend: "pdfHtml5",
            fileName: "master_log",
            title: "Master Log Report",
            exportOptions: {
                columns: ':visible'
            },
            exportData: {
                decodeEntities: true
            }
        }, {
            extend: 'print',
            //text: 'Print current page',
            autoPrint: false,
            exportOptions: {
                columns: ':visible'
            }
        }];

        Principal.hasAuthority("ROLE_ADMIN")
        .then(function (result) {
            if (result) {
              console.log("ROLE_ADMIN");
            } else {
              console.log("NOT ROLE_ADMIN");
              $scope.dtOptions.buttons = [];
            }
        });

        $scope.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
            return $q.when(EntityAuditService.findByEntity("com.fangzhou.manatee.domain.Queue", 9999).then(function(data) {
                var audits = data.map(function(it) {
                    it.entityValue = JSON.parse(it.entityValue);
                    return it;
                });
                return generate_table_data(audits, vm.team);
            }));
        }).withPaginationType('full_numbers').withDisplayLength(20).withButtons(vm.buttons);

        $scope.dtColumns = [
            DTColumnBuilder.newColumn('patientId').withTitle('MRN'),
            DTColumnBuilder.newColumn('patientName').withTitle('Patient Name'),
            DTColumnBuilder.newColumn('teamBefore').withTitle('Before'),
            DTColumnBuilder.newColumn('teamAfter').withTitle('After'),
            DTColumnBuilder.newColumn('dischargeTransfer').withTitle('Discharge/Transfer'),
            DTColumnBuilder.newColumn('dayOfWeek').withTitle('Day of Week'),
            DTColumnBuilder.newColumn('modifiedDate').withTitle('Time'),
            // DTColumnBuilder.newColumn('lastModifiedDate').withTitle('Timestamp'),
            DTColumnBuilder.newColumn('lastModifiedBy').withTitle('User')
            // .notVisible()
        ];



    }
})();
