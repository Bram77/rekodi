rekodiApp.controller('rkAppCtrl', ['$scope', '$localStorage', '$timeout', 'kodiApiService', '$sessionStorage', 'rkNowPlayingService', 'rkKodiPropertiesService',
  function($scope, $localStorage, $timeout, kodiApiService, $sessionStorage, rkNowPlayingService, rkKodiPropertiesService) {
    $scope.storage = $localStorage;
    $scope.sessionStorage = $sessionStorage;
    $scope.isConfigured = true;
    $scope.isConnected = true;
    $scope.controllersLoaded = false;
    $scope.$root.rkRequiredControllers = {};
    var rkRequiredControllers = ['footer', 'now_playing', 'playback_controls', 'tabs', 'window'];
    
    for(var key in rkRequiredControllers) {
      $scope.$root.rkRequiredControllers[rkRequiredControllers[key]] = {
        loaded: false
      };
    }

    $scope.setActiveTab = function(tab, subTab) {
      $timeout(function() {
        angular.element('nav li[rel='+tab+']').trigger('click');
      });

      if(subTab) {
        $timeout(function() {
          angular.element('nav li[rel='+subTab+']').trigger('click');
        });
      }
    };
    
    function setIfConnectionConfigured() {
      $scope.isConfigured = (!$localStorage.settings ||
        $localStorage.settings.constructor !== Object ||
        !$localStorage.settings.serverAddress || 
        !$localStorage.settings.jsonRpcPort || 
        $localStorage.settings.serverAddress === '' || 
        $localStorage.settings.jsonRpcPort === '')? false : true;
    };

    function init() {
      setIfConnectionConfigured();

      if($scope.storage.tabs && $scope.storage.tabs.currentlyActiveTab) {
        $scope.storage.tabs.currentlyActiveTab = '';
      }
      
      $scope.$watchCollection(function() { 
        return $localStorage.settings; 
      }, function(newData, oldData) {
        setIfConnectionConfigured();
      });
      
      $scope.$root.$on('rkWsConnectionStatusChange', function (event, data) {
        $scope.isConnected = data.connected;
      });

      var loadRequiredControllersWatch = $scope.$root.$watch('rkRequiredControllers', function(newValue, oldValue) {
        var allInitialControllersLoaded = true;

        for(var key in newValue) {
          if(!newValue[key].loaded) {
            allInitialControllersLoaded = false;
            break;
          }
        }
        
        if(allInitialControllersLoaded) {
          $scope.controllersLoaded = true;
          kodiApiService.connect();
          loadRequiredControllersWatch(); //destroy watcher
        }
      }, true);
    }
    
    $timeout(function() {
      init();
    });
  }
]);