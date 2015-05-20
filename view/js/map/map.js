window.app.controller("MapPage", ['$scope', '$http', '$window', '$timeout', 'Site', 'Messaging', 'SalesContactService', 'SalesAreaService', 'SalesContactTimelineService',
  function($scope, $http, $window, $timeout, $site, $msg, SalesContact, SalesArea, ContactTimeline) {
    "use strict";

    $scope.$site = $site;
    $scope.SalesContact = SalesContact;
    $scope.SalesArea = SalesArea;
    $scope.ContactTimeline = ContactTimeline;

    // the marker for the sales rep's current location
    $scope.salesRepMarker = null;

    // the mode of the map
    $scope.mapMode = 'knocking';

    // data from server
    $scope.categories = [];
    $scope.categoryIcons = [];
    $scope.systemTypes = [];
    $scope.offices = [];
    $scope.salesReps = [];

    $scope.isLoading = true;
    $timeout(function() {
      $scope.isLoading = false;
    }, 1000); // lets the animated menus of the map load beneath a nice loading screen

    function loadMapData() {
      console.log('loadMapData');

      // load list of categories
      function get_categories() {
        console.log('get_categories');
        $http.get(window.SITE_PATH + 'ng/Contact/get_categories')
          .success(function(data) {
            if (!data.success && data.require_signin) {
              console.log('require_signin');
              $site.displaySignInDialog(get_categories);
              return;
            }

            if (data && data.results && data.results.length) {
              $scope.categories = data.results;
              for (var i = 0; i < $scope.categories.length; i++) {
                $scope.categories[i].visible = true;
                $scope.categories[i].icon = {
                  url: window.IMG_PATH + 'map/markers/categories/' + $scope.categories[i].filename,
                  scaledSize: new google.maps.Size(24, 24),
                  origin: new google.maps.Point(0, 0),
                  anchor: new google.maps.Point(12, 12),
                };
              }
            }
          }).error(function( /*data*/ ) {
            $msg.displayMessage('Could not load contact categories', true);
          });
      }
      get_categories();

      // load the icons (filenames) for all the possible category icons
      function get_category_icons() {
        $http.get(window.SITE_PATH + 'ng/Contact/get_category_icons')
          .success(function(data) {
            if (!data.success && data.require_signin) {
              console.log('require_signin');
              $site.displaySignInDialog(loadMapData);
              return;
            }
            if (data && data.results) {
              $scope.categoryIcons = data.results;
            }
          }).error(function( /*data*/ ) {
            $msg.displayMessage("There was a problem loading the category icons.", true);
          });

        // load list of alarm system types
        $http.get(window.SITE_PATH + 'ng/SystemType/get_system_types')
          .success(function(data) {
            if (!data.success && data.require_signin) {
              console.log('require_signin');
              $site.displaySignInDialog(get_category_icons);
              return;
            }
            if (data && data.results) {
              $scope.systemTypes = data.results;
              for (var i = 0; i < $scope.systemTypes.length; i++) {
                $scope.systemTypes[i].visible = true;
                $scope.systemTypes[i].icon = {
                  url: window.IMG_PATH + 'map/markers/systems/' + $scope.systemTypes[i].filename,
                  scaledSize: new google.maps.Size(24, 24),
                  origin: new google.maps.Point(0, 0),
                  anchor: new google.maps.Point(12, 12),
                };
              }
            }
          }).error(function( /*data*/ ) {
            console.log('Could not load system types');
          });
      }
      get_category_icons();

      // load list of offices
      function get_offices() {
        $http.get(window.SITE_PATH + 'ng/Office/get_offices')
          .success(function(data) {
            if (!data.success && data.require_signin) {
              console.log('require_signin');
              $site.displaySignInDialog(get_offices);
              return;
            }
            if (data && data.results) {
              data.results.push({
                id: 0,
                officeCity: 'All offices',
                officeState: ''
              });
              $scope.offices = data.results;
            }
          }).error(function( /*data*/ ) {
            console.log('Could not load offices');
          });
      }
      get_offices();

      // load list of sales reps
      function get_sales_reps() {
        $http.get(window.SITE_PATH + 'ng/SalesRep/get_sales_reps')
          .success(function(data) {
            if (!data.success && data.require_signin) {
              console.log('require_signin');
              $site.displaySignInDialog(get_sales_reps);
              return;
            }
            if (data && data.results) {
              data.results.push({
                id: 0,
                officeId: 0,
                firstName: 'All reps',
                lastName: ''
              });
              $scope.salesReps = data.results;
            }
          }).error(function( /*data*/ ) {
            console.log('Could not load sales reps');
          });
      }
      get_sales_reps();
    }

    $scope.getCategoryIconPath = function(ico) {
      return window.IMG_PATH + 'map/markers/categories/' + ico;
    };

    // These vars refer to the sales rep/office we're viewing
    // The current user's id and officeId are stored in the $site object.
    $scope.salesRepId = 0;
    $scope.officeId = 0;
    $scope.$watch('officeId', function() {
      $scope.salesRepId = 0;
    });
    $scope.iconmode = "category";
    $scope.$watch('iconmode', function() {
      SalesContact.updateIcons($scope);
    });

    // vars to handle the display of dialog boxes
    /*	$scope.dialogBoxIsDisplayed = false;
	$scope.newCategoryDialogIsDisplayed = false;
	$scope.displayNewCategoryDialog = function(optional_id) {
		$scope.newCategoryDialogIsDisplayed = true;
		$scope.dialogBoxIsDisplayed = true;
		$scope.editCategoriesDialogIsDisplayed = false;
		if (optional_id) {
			$scope.SalesContact.newCategory = $scope.getCategoryById(optional_id);
		}
		setTimeout(function() { document.getElementById('newCategoryName').select(); }, 5); // push this call to the end of the method queue with a setTimeout
	}
	$scope.hideNewCategoryDialog = function() {
		$scope.newCategoryDialogIsDisplayed = false;
		$scope.dialogBoxIsDisplayed = false;
		SalesContact.newContact.resetCategoryId();
	}
	$scope.editCategoriesDialogIsDisplayed = false;
	$scope.displayEditCategoriesDialog = function() {
		$scope.editCategoriesDialogIsDisplayed = true;
		$scope.dialogBoxIsDisplayed = true;
	}
	$scope.hideEditCategoriesDialog = function() {
		$scope.editCategoriesDialogIsDisplayed = false;
		$scope.dialogBoxIsDisplayed = false;
	}*/

    $scope.dialogBoxStack = [];
    $scope.isDialogDisplayed = function(dialogName) {
      // is there any dialog box displayed?
      if (!dialogName) {
        if ($scope.dialogBoxStack.length) {
          return true;
        }
      }

      // is the provided dialog box displayed?
      if ($scope.dialogBoxStack.length) {
        return $scope.dialogBoxStack[$scope.dialogBoxStack.length - 1] === dialogName;
      }

      return false;
    };
    $scope.showDialog = function(dialogName) {
      $scope.dialogBoxStack.push(dialogName);
    };
    $scope.hideDialog = function(dialogName) {
      for (var i = 0; i < $scope.dialogBoxStack.length; i++) {
        if ($scope.dialogBoxStack[i] === dialogName) {
          $scope.dialogBoxStack.splice(i, 1);
        }
      }
    };

    $scope.displayNewCategoryDialog = function(optional_id) {
      $scope.showDialog('newCategoryDialog');
      if (optional_id) {
        $scope.SalesContact.newCategory = $scope.getCategoryById(optional_id);
      }
      window.setTimeout(function() {
        document.getElementById('newCategoryName').select();
      }, 5); // push this call to the end of the method queue with a setTimeout
    };
    $scope.hideNewCategoryDialog = function() {
      $scope.hideDialog('newCategoryDialog');
      SalesContact.newContact.resetCategoryId();
    };
    $scope.displayEditCategoriesDialog = function() {
      $scope.showDialog('editCategoriesDialog');
    };
    $scope.hideEditCategoriesDialog = function() {
      $scope.hideDialog('editCategoriesDialog');
    };

    // when the user changes the drop down option for the system a new contact has, this method is called so the marker can be updated to match
    $scope.currentSystemChanged = function() {
      if ($scope.iconmode === 'systemType') {
        // change the icon of the new contact
        var theicon = window.genericContactIcon;
        var sys = $scope.getSystemById(SalesContact.newContact.currentSystemId);
        if (sys) {
          theicon = sys.icon;
        }
        SalesContact.newContact.marker.setIcon(theicon);
      }
    };

    $scope.categoryChanged = function() {
      if ($scope.iconmode === 'category') {
        // change the icon of the new contact
        var theicon = window.genericContactIcon;
        var ct = $scope.getCategoryById(SalesContact.newContact.categoryId);
        if (ct) {
          theicon = ct.icon;
        }
        SalesContact.newContact.marker.setIcon(theicon);
      }

      // special case - create a new category
      if (SalesContact.newContact.categoryId === 'new') {
        $scope.displayNewCategoryDialog();
      }
    };

    // Gets a SystemType by its id
    $scope.getSystemById = function(id) {
      for (var i = 0; i < $scope.systemTypes.length; i++) {
        if ($scope.systemTypes[i].id === id) {
          return $scope.systemTypes[i];
        }
      }
      return null;
    };

    // Gets a Category by its id
    $scope.getCategoryById = function(id) {
      for (var i = 0; i < $scope.categories.length; i++) {
        if ($scope.categories[i].id === id) {
          return $scope.categories[i];
        }
      }
      return null;
    };

    // Gets a SalesRep by its id
    $scope.getSalesRepById = function(id) {
      for (var i = 0; i < $scope.salesReps.length; i++) {
        if ($scope.salesReps[i].id === id) {
          return $scope.salesReps[i];
        }
      }
      return null;
    };

    // Gets an office by its id
    $scope.getOfficeById = function(id) {
      for (var i = 0; i < $scope.offices.length; i++) {
        if ($scope.offices[i].id === id) {
          return $scope.offices[i];
        }
      }
      return null;
    };

    // filter all contact types on
    $scope.selectAllCategories = function() {
      for (var i = 0; i < $scope.categories.length; i++) {
        $scope.categories[i].visible = true;
      }
      SalesContact.filterVisibleContacts($scope);
    };
    // filter all contact types off
    $scope.selectNoneCategories = function() {
      for (var i = 0; i < $scope.categories.length; i++) {
        $scope.categories[i].visible = false;
      }
      SalesContact.filterVisibleContacts($scope);
    };
    // filter all system types on
    $scope.selectAllSystemTypes = function() {
      for (var i = 0; i < $scope.systemTypes.length; i++) {
        $scope.systemTypes[i].visible = true;
      }
      SalesContact.filterVisibleContacts($scope);
    };
    // filter all system types off
    $scope.selectNoneSystemTypes = function() {
      for (var i = 0; i < $scope.systemTypes.length; i++) {
        $scope.systemTypes[i].visible = false;
      }
      SalesContact.filterVisibleContacts($scope);
    };

    // the all-important map object and default map options
    $scope.map = null;
    $scope.mapOptions = {
      center: window.defaultLocation,
      zoom: 14,
      styles: window.mapStyle,
      disableDefaultUI: true,
      disableDoubleClickZoom: true,
    };



    /***
     * This method initializes the Google Map and only needs to be run once.
     * It adds some important event handlers and also tries to center the map on the user's current location
     ***/
    function initialize() {
      console.log('initialize');

      // first load the map
      $scope.map = new google.maps.Map(document.getElementById('map-canvas'), $scope.mapOptions);

      // create a marker for the sales rep
      $scope.salesRepMarker = new google.maps.Marker({
        position: window.defaultLocation,
        map: $scope.map,
        icon: window.salesRepIcon,
        zIndex: 110,
      });

      // try to get lat lon
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          // re-center map to current location
          $scope.map.setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          $scope.salesRepMarker.setPosition(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
          $scope.map.setZoom(16);
        }, function(positionError) {
          console.log('Error getting initial position: ' + positionError.message);
        }, {
          timeout: 15000,
          enableHighAccuracy: true,
          maximumAge: 2000
        });
      }


      // load data for the map to display
      loadMapData();


      // add click event handling
      google.maps.event.addListener($scope.map, 'click', function(event) {
        switch ($scope.mapMode) {
          case 'areas':
            SalesArea.handleClick($scope, event, event.latLng);
            break;
          case 'knocking':
            SalesContact.handleClick($scope, event, event.latLng);
            break;
          default:
            //$scope.handleClick(event, event.latLng);
            break;
        }
      });

      // add double-click event handling
      google.maps.event.addListener($scope.map, 'dblclick', function(event) {
        switch ($scope.mapMode) {
          case 'areas':
            SalesArea.handleDoubleClick($scope, event, event.latLng);
            break;
          case 'knocking':
            break;
          default:
            //$scope.handleDoubleClick(event, event.latLng);
            break;
        }
      });

      // add a mousemove event handler
      google.maps.event.addListener($scope.map, 'mousemove', function(event) {
        switch ($scope.mapMode) {
          case 'areas':
            SalesArea.handleMouseMove($scope, event, event.latLng);
            break;
          case 'knocking':
            break;
          default:
            //$scope.handleMouseMove(event, event.latLng);
            break;
        }
      });

      // add a drage event handler
      google.maps.event.addListener($scope.map, 'drag', function(event) {
        SalesArea.handleDrag($scope, event);
      });

      // whenever the map's viewport comes to rest after panning or zooming...
      google.maps.event.addListener($scope.map, 'idle', function(ev) {
        switch ($scope.mapMode) {
          case 'areas':
            break;
          case 'knocking':
            SalesContact.loadVisibleContacts($scope);
            SalesArea.loadVisibleAreas($scope);
            break;
          default:
            //$scope.loadVisibleContacts();
            break;
        }
        SalesArea.handleDrag($scope, ev);
      });
    }
    google.maps.event.addDomListener(window, 'load', initialize);



    /***
     * Looks up the address of a given point on the map
     ***/
    $scope.geocoder = new google.maps.Geocoder();
    $scope.reverseGeocode = function(latlng) {
      $scope.geocoder.geocode({
        'latLng': latlng
      }, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          if (results[0]) {
            $scope.$apply(function() {
              SalesContact.newContact.fullAddress = results[0].formatted_address;

              var street_number = '';
              var street = '';
              for (var i = 0; i < results[0].address_components.length; i++) {
                var comp = results[0].address_components[i];
                if (comp.types.length) {
                  switch (comp.types[0]) {
                    case 'locality':
                      SalesContact.newContact.city = comp.long_name;
                      break;
                    case 'postal_code':
                      SalesContact.newContact.zip = comp.long_name;
                      break;
                    case 'administrative_area_level_1':
                      SalesContact.newContact.state = comp.short_name;
                      break;
                    case 'street_number':
                      street_number = comp.long_name;
                      break;
                    case 'route':
                      street = comp.short_name;
                      break;
                  }
                }
              }
              // combine street number and street to get address
              SalesContact.newContact.address = street_number + ' ' + street;
            });
          }
        } else {
          console.log('Geocoder failed due to: ' + status);
        }
      });
    };


    /***
     * Update the user's position on the map every so often
     ***/
    if (navigator.geolocation) {
      window.setInterval(function() {
        navigator.geolocation.getCurrentPosition(function(position) {
          $scope.salesRepMarker.setPosition(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
        }, function(positionError) {
          console.log('error getting current position: ' + positionError.message);
        }, {
          timeout: 9900,
          enableHighAccuracy: true,
          maximumAge: 2000
        });
      }, 12000); // 15 minutes = 900000 seconds
    } else {
      $msg.displayMessage("You can't use the app without location services enabled", true);
    }



    /***
     * This section deals with the settings panel
     ***/
    $scope.settingsAreDisplayed = false;
    // Opens the settings panel for the map
    $scope.displaySettings = function() {
      $scope.settingsAreDisplayed = true;
    };
    // Opens the settings panel for the map
    $scope.hideSettings = function() {
      $scope.settingsAreDisplayed = false;
    };
    $scope.toolsAreDisplayed = false;
    // Opens the tools panel for the map
    $scope.displayTools = function() {
      $scope.toolsAreDisplayed = true;
    };
    // Opens the tools panel for the map
    $scope.hideTools = function() {
      $scope.toolsAreDisplayed = false;
    };
    $scope.timelineIsDisplayed = false;
    $scope.displayContactTimeline = function() {
      $scope.hideTools();
      $scope.timelineIsDisplayed = true;
      ContactTimeline.refreshTimeline($scope);
    };
    $scope.hideContactTimeline = function() {
      $scope.timelineIsDisplayed = false;
    };


    /***
     * Set the map mode
     ***/
    $scope.setMapMode = function(mode) {
      $scope.mapMode = mode;
      switch ($scope.mapMode) {
        case 'areas':
          SalesArea.setSalesAreaMode($scope, 'select');
          break;
        default:
          $scope.map.setOptions({
            draggableCursor: null
          });
          break;
      }
      $scope.hideTools();
    };
  }
]);

window.app.filter('salesRepFilterByOffice', function() {
  "use strict";
  return function(incItems, value) {
    var out = [{}];

    if (value) {
      for (var x = 0; x < incItems.length; x++) {
        if (incItems[x].officeId === value || incItems[x].officeId === 0) {
          out.push(incItems[x]);
        }
      }
      return out;
    } else if (!value) {
      return incItems;
    }
  };
});
