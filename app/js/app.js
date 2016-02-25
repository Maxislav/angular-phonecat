'use strict';

/* App Module */

var phonecatApp = angular.module('phonecatApp', [
    'ngRoute',
    'phonecatAnimations',
    'ui.router',
    'phonecatControllers',
    'phonecatFilters',
    'phonecatServices'
]);

phonecatApp.config(
    function ($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.otherwise('/phones');
        $stateProvider
            .state('phones', {
                url: '/phones',
                templateUrl: 'partials/phone-list.html',
                controller: 'PhoneListCtrl',
                resolve: {
                    $wares: function ($q, $timeout) {
                        return $q(function (resolve, reject) {
                            $timeout(function () {
                                resolve('wares')
                            }, 500)
                        })
                    }
                }

            })
            .state('phonesId', {
                url: '/phones/:phoneId',
                templateUrl: 'partials/phone-detail.html',
                controller: 'PhoneDetailCtrl',
                resolve: {}
            });


    })
    .run(function ($state, $q, $timeout, $injector, $rootScope, $urlRouter, PermitsFactory) {
        var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
        var ARGUMENT_NAMES = /([^\s,]+)/g;
        var states = $state.get();
        PermitsFactory.getPermits();

        function getParamNames(func) {
            var fnStr = func.toString().replace(STRIP_COMMENTS, '');
            var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
            if (result === null)
                result = [];
            return result;
        }

        angular.forEach(states, function (state, i) {
            if (!state.abstract) {
                if (state.resolve) {
                    if (isEmpty(state.resolve)) {
                        state.resolve.p = function () {
                            return $q(function (resolve, reject) {

                                PermitsFactory.getPermits().then(function(permits){
                                    console.log(permits)
                                    resolve();
                                })

                            })
                        }
                    } else {
                        for (var opt in state.resolve) {
                            var _resolveCurrent = state.resolve[opt];
                            var _resolveSum = function () {
                                return $q(function (resolve, reject) {
                                    var argumentsName = getParamNames(_resolveCurrent); //получаем имена аргументов
                                    var services = [];
                                    angular.forEach(argumentsName, function (name) {
                                        services.push($injector.get(name)); // заполняем массив сервисами
                                    });

                                    PermitsFactory.getPermits().then(function(permits){
                                        console.log(permits);

                                        _resolveCurrent.apply(_resolveCurrent, services).then(function (data) {
                                            resolve(data)
                                        });
                                    });

                                })
                            };
                            state.resolve[opt] = _resolveSum;

                        }
                    }

                }
            }
        });

        console.log($state.get())

    })
    .factory('PermitsFactory', function ($timeout, $q) {

        var permits;
        var promise;

        function getPromise(){
            return $q(function(resolve, reject){
                $timeout(function(){
                    permits = ['admin'];
                    resolve(permits);
                }, 2000)
            })
        }

        function getPermits() {
             if(permits){
                 return $q(function(resolve, reject){
                     resolve(permits)
                 })
             }else if(promise && promise.$$state.status==0){
                 return promise;
             }else{
                 promise = getPromise();
                 return promise;
             }
        }

        return {
            getPermits: getPermits
        }

    });


function isEmpty(obj) {
    for (var i in obj) if (obj.hasOwnProperty(i)) return false;
    return true;
};
