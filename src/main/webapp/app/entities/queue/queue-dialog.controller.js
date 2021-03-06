(function() {
    'use strict';

    angular
        .module('manateeApp')
        .controller('QueueDialogController', QueueDialogController);

    QueueDialogController.$inject = ['$timeout', '$scope', '$stateParams', '$uibModalInstance', 'entity', 'Queue', 'Patient', 'Team', 'ChatService'];

    function QueueDialogController ($timeout, $scope, $stateParams, $uibModalInstance, entity, Queue, Patient, Team, ChatService) {
        var vm = this;

        vm.queue = entity;
        vm.clear = clear;
        vm.datePickerOpenStatus = {};
        vm.openCalendar = openCalendar;
        vm.save = save;
        vm.patients = Patient.query();
        vm.teams = Team.query();

        $timeout(function (){
            angular.element('.form-group:eq(1)>input').focus();
        });

        function clear () {
            $uibModalInstance.dismiss('cancel');
        }

        function save () {
            vm.isSaving = true;
            if (vm.queue.team !=null && vm.queue.patient !=null)
                if (vm.queue.id !== null) {
                    Queue.update(vm.queue, onSaveSuccess, onSaveError);
                } else {
                    Queue.save(vm.queue, onSaveSuccess, onSaveError);
                }
            else {
                onSaveError();
            }
        }

        function onSaveSuccess (result) {
            $scope.$emit('manateeApp:queueUpdate', result);
            $uibModalInstance.close(result);
            vm.isSaving = false;
            ChatService.send("send test message");
        }

        function onSaveError () {
            vm.isSaving = false;
        }

        vm.datePickerOpenStatus.timestampInitial = false;
        vm.datePickerOpenStatus.timestampFinal = false;

        function openCalendar (date) {
            vm.datePickerOpenStatus[date] = true;
        }
    }
})();
