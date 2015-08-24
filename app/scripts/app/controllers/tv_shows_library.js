rekodiApp.controller('rkTvShowsLibraryCtrl', ['$scope', '$element', 'kodiApiService', 'rkTooltipsService', 'rkRemoteControlService', 'rkVideoLibraryService', 'rkSettingsService',
  function($scope, $element, kodiApiService, rkTooltipsService, rkRemoteControlService, rkVideoLibraryService, rkSettingsService) {
    var modal = {};
    var displayLimit = 5;
    var kodiApi = null;
    $scope.tvShowsCategorised = {};
    $scope.seasons = [];
    $scope.episodes = [];
    $scope.tvShowsIndex = [];
    $scope.scrollItems = [];
    $scope.isFiltering = false;
    $scope.isInitialized = false;
    $scope.currentLevel = null;
    $scope.currentTvShowId = null;
    $scope.currentSeason = null;
    $scope.currentSeasonId = null;
    $scope.settings = rkSettingsService.get({category: 'tvShowsLibrary'});
    $scope.resumeTvShow = {};
    $scope.guiModels = {
      filterValue: '',
      selectedIndex: null
    };

    $scope.showItems = function(options) {
      var _scrollItemsCount = 0;
      var _options = angular.extend({}, {
        key: null,
        reset: false, //optional
        data: null //required
      }, options);

      if($scope.isFiltering && !_options.reset) {
        _options.data = $scope.filteredItems;
      }

      if(_options.key !== null) {
        if(!$scope.scrollItems[_options.key] || _options.reset) {
          $scope.scrollItems[_options.key] = [];
        }
        
        _scrollItemsCount = $scope.scrollItems[_options.key].length;
      }
      else {
        if(_options.reset) {
          $scope.scrollItems = [];
        }
        
        _scrollItemsCount = $scope.scrollItems.length;
      }

      if(!_options.data || !_options.data[_scrollItemsCount]) {
        return;
      }
      
      for(var x = 0; x < displayLimit; x++) {
        var nextIndex = ((_scrollItemsCount)+x);

        if(_options.data[nextIndex]) {
          if(_options.key) {
            $scope.scrollItems[_options.key].push(_options.data[nextIndex]);
          }
          else {
            $scope.scrollItems.push(_options.data[nextIndex]);
          }
        }
      }

      if(!$scope.$$phase){
        $scope.$apply();
      }
    };
    
    function refreshData() {
      if($scope.currentLevel === 'tvShows') {
        $scope.tvShowsCategorised = {};
        $scope.getTvShowsCategorised();
      }
      else if ($scope.currentLevel === 'seasons'){
        $scope.seasons = [];
        $scope.getSeasons($scope.currentTvShowId);
      }
      else if($scope.currentLevel === 'episodes') {
        $scope.episodes = [];
        $scope.getEpisodes($scope.currentTvShowId, $scope.currentSeason);
      }
    }

    function getDefaultIndex(tvShowsIndex) {
      for(var key in tvShowsIndex) {
        if(tvShowsIndex[key].toLowerCase() !== tvShowsIndex[key].toUpperCase()) {
          return tvShowsIndex[key];
        }
      }
      
      return null;
    }
    
    function getUnwatchedTvShows(tvShowsCategorised) {
      var newCategorisedLibrary = {};
      
      for(var key in tvShowsCategorised) {
        var indexCollection = [];
        
        for(var index in tvShowsCategorised[key]) {
          if(tvShowsCategorised[key][index].episode !== 0 && tvShowsCategorised[key][index].episode !== tvShowsCategorised[key][index].watchedepisodes) {
            indexCollection.push(tvShowsCategorised[key][index]);
          }
        }

        if(indexCollection.length > 0) {
          newCategorisedLibrary[key] = indexCollection;
        }
      }
      
      return newCategorisedLibrary;
    }
    
    $scope.getTvShowsCategorised = function() {
      $scope.currentLevel = 'tvShows';
      $scope.currentTvShowId = null;
      $scope.currentSeason = null;
      $scope.currentSeasonId = null;
      $scope.clearFilter();
      
      if(Object.keys($scope.tvShowsCategorised).length === 0) {
        $scope.tvShowsCategorised = rkVideoLibraryService.getTvShowsCategorisedFromCache();
        
        if($scope.settings.hideWatched) {
          $scope.tvShowsCategorised = getUnwatchedTvShows($scope.tvShowsCategorised);
        }

        $scope.tvShowsIndex = Object.keys($scope.tvShowsCategorised);
        $scope.guiModels.selectedIndex = getDefaultIndex($scope.tvShowsIndex);
      }
      
      $scope.showItems({
        key: $scope.currentLevel,
        reset: true,
        data: $scope.tvShowsCategorised[$scope.guiModels.selectedIndex]
      });

      rkVideoLibraryService.getTvShowsCategorised(function(tvShowsCategorised) {
        if(tvShowsCategorised && $scope.settings.hideWatched) {
          tvShowsCategorised = getUnwatchedTvShows(tvShowsCategorised);
        }

        if(tvShowsCategorised && !angular.equals(tvShowsCategorised, $scope.tvShowsCategorised)) {
          $scope.tvShowsCategorised = tvShowsCategorised;
          $scope.tvShowsIndex = Object.keys(tvShowsCategorised);
          $scope.guiModels.selectedIndex = getDefaultIndex($scope.tvShowsIndex);

          $scope.showItems({
            key: $scope.currentLevel,
            reset: true,
            data: tvShowsCategorised[$scope.guiModels.selectedIndex]
          });
        }
      });
    };
    
    function getUnwatchedSeasons(seasons) {
      var newSeasons = [];
      
      for(var index in seasons) {
        if(seasons[index].episode !== 0 && seasons[index].episode !== seasons[index].watchedepisodes) {
          newSeasons.push(seasons[index]);
        }
      }

      return newSeasons;
    }

    $scope.getSeasons = function(tvShowId) {
      $scope.currentLevel = 'seasons';
      $scope.currentTvShowId = tvShowId;
      $scope.currentSeason = null;
      $scope.currentSeasonId = null;
      $scope.clearFilter();
      
      if(!$scope.seasons[tvShowId]) {
        $scope.seasons[tvShowId] = [];
      }
      
      if($scope.seasons[tvShowId].length === 0) {
        $scope.seasons[tvShowId] = rkVideoLibraryService.getSeasonsFromCache(tvShowId);
        
        if($scope.settings.hideWatched) {
          $scope.seasons[tvShowId] = getUnwatchedSeasons($scope.seasons[tvShowId]);
        }
      }
      
      if($scope.seasons[tvShowId].length === 1) {
        $scope.getEpisodes(tvShowId, $scope.seasons[tvShowId][0].season);
        return;
      }
      
      $scope.showItems({
        key: $scope.currentLevel,
        reset: true,
        data: $scope.seasons[tvShowId]
      });

      rkVideoLibraryService.getSeasons(tvShowId, function(seasons) {
        if(seasons && $scope.settings.hideWatched) {
          seasons = getUnwatchedSeasons(seasons);
        }

        if(seasons && !angular.equals(seasons, $scope.seasons[tvShowId])) {
          $scope.seasons[tvShowId] = seasons;

          if(seasons.length !== 1) {
            $scope.showItems({
              key: $scope.currentLevel,
              reset: true,
              data: $scope.seasons[tvShowId]
            });
          }
          
          if($scope.seasons[tvShowId].length === 1) {
            $scope.getEpisodes(tvShowId, $scope.seasons[tvShowId][0].season);
          }
        }
      });
    };
    
    function getUnwatchedEpisodes(episodes) {
      var newEpisodes = [];
      
      //console.dir(episodes);
      
      for(var index in episodes) {
        if(episodes[index].lastplayed === '') {
          newEpisodes.push(episodes[index]);
        }
      }

      return newEpisodes;
    }
    
    $scope.getEpisodes = function(tvShowId, season) {
      $scope.currentLevel = 'episodes';
      $scope.currentSeason = season;
      $scope.currentSeasonId = tvShowId+'_'+season;
      $scope.clearFilter();
      
      if(!$scope.episodes[$scope.currentSeasonId]) {
        $scope.episodes[$scope.currentSeasonId] = [];
      }
      
      if($scope.episodes[$scope.currentSeasonId].length === 0) {
        $scope.episodes[$scope.currentSeasonId] = rkVideoLibraryService.getEpisodesFromCache(tvShowId, season);
        
        if($scope.settings.hideWatched) {
          $scope.episodes[$scope.currentSeasonId] = getUnwatchedEpisodes($scope.episodes[$scope.currentSeasonId]);
        }
      }
      
      $scope.showItems({
        key: $scope.currentLevel,
        reset: true,
        data: $scope.episodes[$scope.currentSeasonId]
      });

      rkVideoLibraryService.getEpisodes(tvShowId, season, function(episodes) {
        console.dir(episodes);
        if(episodes && $scope.settings.hideWatched) {
          episodes = getUnwatchedEpisodes(episodes);
        }
        
        if(episodes && !angular.equals(episodes, $scope.episodes[$scope.currentSeasonId])) {
          $scope.episodes[$scope.currentSeasonId] = episodes;
          
          $scope.showItems({
            key: $scope.currentLevel,
            reset: true,
            data: $scope.episodes[$scope.currentSeasonId]
          });
        }
      });
    };
    
    $scope.applyFilter = function(filterValue) {
      if(filterValue.length < 2) {
        $scope.isFiltering = false;
        $scope.showItems({
          reset: true,
          data: $scope.tvShowsCategorised[$scope.guiModels.selectedIndex]
        });
        
        return;
      }

      $scope.isFiltering = true;
      $scope.filteredItems = [];
      var items = rkVideoLibraryService.getTvShowsFromCache();

      for(var key in items) {
        if(items[key].label && items[key].label.toLowerCase().indexOf(filterValue.toLowerCase()) !== -1) {
          $scope.filteredItems.push(items[key]);
        }
      }
      
      $scope.showItems({
        reset: true,
        data: $scope.filteredItems
      });
    };
    
    $scope.clearFilter = function() {
      $scope.isFiltering = false;
      $scope.filteredItems = [];
      $scope.guiModels.filterValue = '';
      
      $scope.showItems({
        index: $scope.guiModels.selectedIndex,
        reset: true,
        data: $scope.tvShowsCategorised[$scope.guiModels.selectedIndex]
      });
    };

    $scope.handlePlay = function(tvShow) {
      if(tvShow.resume.position > 0) {
        $scope.resumeTvShow = tvShow;
        modal.resumeTvShow = $('[data-remodal-id=resumeTvShowModal]').remodal();
        modal.resumeTvShow.open();
      }
      else {
        $scope.play(tvShow, false);
      }
    };
    
    $scope.play = function(tvShow, resume) {
      if(modal.resumeTvShow) {
        modal.resumeTvShow.close();
      }
      
      resume = (resume)? true : false;
      var options = {
        item: {
          tvShowid: tvShow.tvShowid
        },
        options: {
          resume: resume
        }
      };

      rkRemoteControlService.play(options);
    };
    
    function initConnectionChange() {
      kodiApi = kodiApiService.getConnection();

      if(kodiApi && Object.keys($scope.tvShowsCategorised).length === 0) {
        $scope.getTvShowsCategorised();
      }
    }

    $scope.init = function() {
      if($scope.isInitialized) {
        return;
      }
      
      initConnectionChange();

      $scope.$root.$on('rkWsConnectionStatusChange', function (event, connection) {
        initConnectionChange();
      });

      $(document).on('closed', '[data-remodal-id=resumeTvShowModal]', function(e) {
        $scope.resumeTvShow = {};
        modal.resumeTvShow = null;
      });
      
      $scope.$watchCollection('settings', function(newData, oldData) {
        for(var key in newData) {
          rkSettingsService.set({
            category: 'tvShowsLibrary',
            key: key,
            value: newData[key]
          });
        }
        
        if(newData.hideWatched !== oldData.hideWatched) {
          refreshData();
        }
      });

      $scope.isInitialized = true;
    };
  }
]);