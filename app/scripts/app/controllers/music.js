rekodiApp.controller('rkMusicCtrl', ['$scope', '$timeout', 'rkKodiWsApiService',
  function($scope, $timeout, rkKodiWsApiService) {
    $scope.libraryData = {};
    $scope.filesData = {};
    var sourcePaths = [];
    var kodiWsApiConnection = null;
    
    function isLoadSources(directory) {
      for(var key in sourcePaths) {
        if(sourcePaths[key].indexOf(directory) > -1 && directory.length <= sourcePaths[key].length) {
          return true;
        }
      }
      
      return false;
    }
    
    $scope.getLibraryData = function() {
      
    };
    
    $scope.getSourcesData = function() {
        kodiWsApiConnection = rkKodiWsApiService.getConnection();
        var promise = kodiWsApiConnection.Files.GetSources({
          media: 'music',
          sort: {
            order: 'ascending',
            method: 'label'
          }
        });
        
        promise.then(function(data) {
          sourcePaths = [];
          
          for(var i=0; i<data.sources.length; i++) {
            sourcePaths[i] = data.sources[i].file;
          }

          $scope.filesData = data.sources;
          $scope.$apply();
        }, function(error) {});
    };
    
    $scope.getDirectoryData = function(directory) {
      if(directory === 'LOAD_SOURCES') {
        $scope.getSourcesData();
        return;
      }

      var directoryUp = directory.split('/').slice(0, -2).join('/')+'/';
      
      for(var key in sourcePaths) {
        if(sourcePaths[key].indexOf(directoryUp) > -1 && directoryUp.length < sourcePaths[key].length) {
          directoryUp = 'LOAD_SOURCES';
        }
      }
      
      kodiWsApiConnection = rkKodiWsApiService.getConnection();
      var promise = kodiWsApiConnection.Files.GetDirectory({
        directory: directory,
        media: 'music',
        sort: {
            order: 'ascending',
            method: 'label'
          }
      });

      promise.then(function(data) {
        data.files = (data.files === undefined)? [] : data.files;
        $scope.filesData = data.files;
        $scope.filesData.unshift({
          label: '..',
          filetype: 'directory',
          file: directoryUp
        });
        $scope.$apply();
      }, function(error) {});
    };
    
    $scope.getData = function() {
      $scope.getSourcesData();
    };
    
    $scope.$root.$on('rkWsConnectionStatusChange', function(event, data) {
      if(data.connected) {
        $scope.getSourcesData();
      }
      else {
        $scope.sourcesData = {};
      }
    });
    
    $scope.$evalAsync(function() { 
      if(rkKodiWsApiService.isConnected()) {
        $timeout(function() {
          $scope.getSourcesData();
        });
      }
    });
  }
]);