angular.module("pouchapp", ["ui.router"])

.run(function($pouchDB) {
    $pouchDB.setDatabase("nutrition");
    $pouchDB.sync("http://localhost:4984/test-database");
})

.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state("list", {
            "url": "/list",
            "templateUrl": "templates/list.html",
            "controller": "MainController"
        })
        .state("item", {
            "url": "/item/:documentId/:documentRevision",
            "templateUrl": "templates/item.html",
            "controller": "MainController"
        })
        .state("add", {
            "url": "/item",
            "templateUrl": "templates/add.html",
            "controller": "AddController"
        });
    $urlRouterProvider.otherwise("list");
})

.controller("MainController", function($scope, $rootScope, $state, $stateParams, $pouchDB) {

    $scope.items = {};
    
    $pouchDB.startListening();

    // Listen for changes which include create or update events
    $rootScope.$on("$pouchDB:change", function(event, data) {
        $scope.items[data.doc._id] = data.doc;
        $scope.$apply();
    });

    // Listen for changes which include only delete events
    $rootScope.$on("$pouchDB:delete", function(event, data) {
        delete $scope.items[data.doc._id];
        $scope.$apply();
    });

    // Look up a document if we landed in the info screen for editing a document
    if($stateParams.documentId) {
        $pouchDB.get($stateParams.documentId).then(function(result) {
            $scope.inputForm = result;
        });
    }

    // Save a document with either an update or insert
    $scope.save = function() {
        var jsonDocument = {
            "itemname": $scope.inputForm.itemname,
            "protein": $scope.inputForm.protein,
            "fat": $scope.inputForm.fat,
            "carbs": $scope.inputForm.carbs,
            "energy": $scope.inputForm.energy,
            "sodium": $scope.inputForm.sodium          
        };
        // If we're updating, provide the most recent revision and document id
        if($stateParams.documentId) {
            jsonDocument["_id"] = $stateParams.documentId;
            jsonDocument["_rev"] = $stateParams.documentRevision;
        }
        $pouchDB.save(jsonDocument).then(function(response) {
            $state.go("list");
        }, function(error) {
            console.log("ERROR Saving data---> " + error);
        });
    }

    $scope.delete = function(id, rev) {
        $pouchDB.delete(id, rev);
    }

})

.controller("AddController", function($scope, $rootScope, $state, $stateParams, $pouchDB) {

    $scope.search = function(){
        var query = $scope.query;
        console.log("this is called",query);
        $pouchDB.find(query);      
    }

})

.service("$pouchDB", ["$rootScope", "$q", function($rootScope, $q) {

    var database;
    var changeListener;
    var db;

    this.setDatabase = function(databaseName) {
        database = new PouchDB(databaseName);        
    }

    this.startListening = function() {
        changeListener = database.changes({
            live: true,
            include_docs: true
        }).on("change", function(change) {
            if(!change.deleted) {
                $rootScope.$broadcast("$pouchDB:change", change);
            } else {
                $rootScope.$broadcast("$pouchDB:delete", change);
            }
        });
    }

    this.stopListening = function() {
        changeListener.cancel();
    }

    this.sync = function(remoteDatabase) {
        database.sync(remoteDatabase, {live: true, retry: true});
    }

    this.save = function(jsonDocument) {
        var deferred = $q.defer();
        if(!jsonDocument._id) {
            database.post(jsonDocument).then(function(response) {
                deferred.resolve(response);
            }).catch(function(error) {
                deferred.reject(error);
            });
        } else {
            database.put(jsonDocument).then(function(response) {
                deferred.resolve(response);
            }).catch(function(error) {
                deferred.reject(error);
            });
        }
        return deferred.promise;
    }
    
    this.delete = function(documentId, documentRevision) {
        return database.remove(documentId, documentRevision);
    }

    this.get = function(documentId) {
        return database.get(documentId);
    }

    this.destroy = function() {
        database.destroy();
    }

    this.find = function(query) {
        database.createIndex({
            index : {fields: ['itemname']}
        }).then(function(){
            return database.find({
                selector: {"itemname": query}
            });
        }).then(function(result){
            console.log("result is********",result);
        })
    }

}]);
