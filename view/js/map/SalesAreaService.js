window.app.factory("SalesAreaService", ['$http', 'Messaging', 'Site',
  function($http, $msg, $site) {
    "use strict";

    // The SalesArea class
    function SalesArea(map) {
      this.id = 0;
      this.salesRepId = 0;
      this.officeId = 0;
      this.startTimestamp = null;
      this.endTimestamp = null;

      var polygon = new google.maps.Polygon(polygonOptions);
      polygon.setOptions({
        clickable: false
      });
      var polyline = new google.maps.Polyline(highlightedPolylineOptions);
      polyline.setOptions({
        clickable: false
      });

      var self = this;

      var _paths = [];

      function addPath(path) {
        _paths.push(path);
      }
      this.getPaths = function() {
        return _paths;
      };
      this.setPaths = function(p) {
        _paths = p;
        polygon.setOptions(polygonOptions);
        polygon.setPaths(p.slice(0));
        polygon.setMap(map);
      };

      // updates the private paths array to contain the changes made to the native Google Path
      this.commitPathChanges = function() {
        var new_paths = [];
        var ps = polygon.getPaths();
        for (var i = 0; i < ps.getLength(); i++) {
          var p = ps.getAt(i).getArray();
          var new_path = [];
          for (var j = 0; j < p.length; j++) {
            new_path.push({
              lat: p[j].lat(),
              lng: p[j].lng()
            });
          }
          new_paths.push(new_path);
        }
        self.setPaths(new_paths);
      };

      this.setClickHandler = function($scope, callback) {
        google.maps.event.addListener(polygon, 'click', function() {
          callback.call(self, $scope);
        });
        var ps = polygon.getPaths();

        function polyChanged() {
          console.log('polygon changed');
        }
        for (var i = 0; i < ps.getLength(); i++) {
          google.maps.event.addListener(ps.getAt(i), 'set_at', polyChanged);
        }
      };

      var currentPath = null;
      this.addPoint = function(latLng) {
        if (!currentPath) {
          currentPath = [latLng];
        } else {
          currentPath.push(latLng);
        }
        this.updateUI();
      };

      this.updateUI = function(latLng) { // latLng is an optional paramter used to show a temporary point at the end of the currentPath
        var all_paths = this.getPaths().slice(0);
        var currentPath_amended = null;
        if (currentPath) {
          currentPath_amended = currentPath.slice(0);
          if (latLng) {
            currentPath_amended.push(latLng);
          }
          all_paths.push(currentPath_amended);
        }

        //polyline.setMap(map);

        polygon.setPaths(all_paths);
        if (currentPath_amended) {
          polyline.setPath(currentPath_amended);
        }
      };

      this.endPath = function() {
        polyline.setMap(null);
        addPath(currentPath);
        currentPath = null;
        this.updateUI();
        //console.log(this.getPaths());
      };

      this.setAreaClickable = function(clickable) {
        polygon.setOptions({
          clickable: clickable
        });
      };
      this.setOutlineClickable = function(clickable) {
        polyline.setOptions({
          clickable: clickable
        });
      };
      this.setAreaEditable = function(editable) {
        polygon.setOptions({
          editable: editable
        });
      };
      this.hideOutline = function() {
        polyline.setMap(null);
      };
      this.showOutline = function() {
        polyline.setMap(map);
      };
      this.hideArea = function() {
        polygon.setMap(null);
        this.hideOutline();
      };
      this.showArea = function() {
        polygon.setMap(map);
      };
      this.setHighlight = function(highlight) {
        if (highlight) {
          polygon.setOptions(highlightedPolygonOptions);
        } else {
          polygon.setOptions(polygonOptions);
        }
      };

      this.getCentroid = function() {
        var centroid = {
          lat: 0,
          lng: 0,
          pts: 0,
        };
        var pd = this.getPaths();
        // TODO: This only gets the centroid of the first path - we should probably get all of them and make an array

        var minlat;
        var maxlat;
        var minlng;
        var maxlng;
        for (var c = 0; c < pd[0].length; c++) {
          if (minlat == null || pd[0][c].lat < minlat) {
            minlat = pd[0][c].lat;
          }
          if (maxlat == null || pd[0][c].lat > maxlat) {
            maxlat = pd[0][c].lat;
          }
          if (minlng == null || pd[0][c].lng < minlng) {
            minlng = pd[0][c].lng;
          }
          if (maxlng == null || pd[0][c].lng > maxlng) {
            maxlng = pd[0][c].lng;
          }
          //centroid.lat += Number(pd[0][c].lat);
          //centroid.lng += Number(pd[0][c].lng);
          //centroid.pts++;
        }
        centroid.lat += 3 * minlat + 3 * maxlat;
        centroid.lng += 3 * minlng + 3 * maxlng;
        centroid.lat /= centroid.pts + 6;
        centroid.lng /= centroid.pts + 6;
        //console.log("centroid: " + centroid.lng + ", " + centroid.lat);
        return centroid;
      };
    }


    var polygonOptions = {
      strokeColor: '#62259D',
      strokeOpacity: 0.25,
      strokeWeight: 2,
      fillColor: '#62259D',
      fillOpacity: 0.1,
    };
    var highlightedPolygonOptions = {
      strokeColor: '#FFC627',
      strokeOpacity: 0.75,
      strokeWeight: 2,
      fillColor: '#FFC627',
      fillOpacity: 0.2,
    };
    var highlightedPolylineOptions = {
      strokeColor: '#FFC627',
      strokeOpacity: 1,
      strokeWeight: 3,
    };



    function SalesAreaServiceObj() {
      // the SalesArea mode select/new/edit
      this.mode = 'select';

      // method to instantiate a SalesArea object
      this.SalesArea = SalesArea;

      // the list of defined sales areas presented on the screen
      this.salesAreas = [];
      this.currentArea = null;

      var self = this;

      // method to handle clicks on the map
      this.handleClick = function($scope, event, latLng) {
        if (self.mode === 'new') {
          if (self.currentArea) {
            var pt = {
              lat: latLng.lat(),
              lng: latLng.lng()
            };
            self.currentArea.addPoint(pt);
            self.currentArea.setClickHandler($scope, self.handleSalesAreaClick);
          }
        }
      };

      // Handles double click events on the map
      this.handleDoubleClick = function($scope, event /*, latLng*/ ) {
        if (self.mode === 'new') {
          if (self.currentArea) {
            event.stop();
            self.currentArea.endPath();
          }
        }
      };

      // Handles mousemove events on the map
      this.handleMouseMove = function($scope, event, latLng) {
        if (self.mode === 'new') {
          if (self.currentArea) {
            self.currentArea.updateUI(latLng);
          }
        }
      };

      // Handles clicks on sales areas (polygons)
      this.handleSalesAreaClick = function($scope) {
        console.log('sales area was clicked (polygon)');
        console.log(this);
        self.currentArea = this;
        self.setSalesAreaMode($scope, 'edit');
        $scope.$apply(); // This whole method is always called through a click that didn't originate from angular so it needs a $scope.$apply
      };

      // This method defines the attributes of all the sales areas on the map for each possible mode
      this.setSalesAreaMode = function($scope, mode) {
        console.log('set sales area mode');
        self.mode = mode;
        switch (self.mode) {
          case 'new':
            // create currentArea
            self.currentArea = new SalesArea($scope.map);
            self.currentArea.setHighlight(true);
            self.currentArea.showArea(true);
            self.currentArea.showOutline(true);
            $scope.map.setOptions({
              draggableCursor: 'crosshair'
            });
            for (var i = 0; i < self.salesAreas.length; i++) {
              self.salesAreas[i].setAreaClickable(false);
              self.salesAreas[i].hideOutline();
              self.salesAreas[i].setHighlight(false);
            }
            break;
          case 'edit':
            $scope.map.setOptions({
              draggableCursor: null
            });
            for (i = 0; i < self.salesAreas.length; i++) {
              self.salesAreas[i].setAreaClickable(false);
              self.salesAreas[i].setHighlight(false);
            }
            self.currentArea.setAreaEditable(true);
            self.currentArea.setHighlight(true);
            break;
          default:
          case 'select':
            self.currentArea = null;
            $scope.map.setOptions({
              draggableCursor: null
            });
            for (i = 0; i < self.salesAreas.length; i++) {
              self.salesAreas[i].setAreaClickable(true);
              self.salesAreas[i].hideOutline();
              self.salesAreas[i].setHighlight(false);
            }
            break;
        }
      };

      // This method cancels any new sales area that was being edited and returns to the 'select' sub-mode of the 'areas' mode
      this.cancelCurrentSalesArea = function($scope) {
        if (self.currentArea) {
          if (self.mode === 'new') {
            self.currentArea.hideArea();
            self.currentArea.hideOutline();
            self.currentArea = null;
          } else {
            self.currentArea.updateUI();
            self.currentArea.setAreaEditable(false);
            self.currentArea.setHighlight(false);
          }
        }
        self.setSalesAreaMode($scope, 'select');
      };

      // This method closes down SalesArea edit mode
      this.cancelSalesAreaMode = function($scope) {
        $scope.setMapMode('knocking');

        for (var i = 0; i < self.salesAreas.length; i++) {
          self.salesAreas[i].setAreaClickable(false);
          self.salesAreas[i].setHighlight(false);
        }

        // TODO hide all areas except my own
      };

      // method to save a SalesArea to the database
      this.saveCurrentSalesArea = function($scope) {
        if (self.mode === 'edit') {
          self.currentArea.commitPathChanges();
          self.currentArea.setAreaEditable(false);
          self.currentArea.setHighlight(false);
        }
        // try to get lat lon
        $http.post(window.SITE_PATH + 'ng/SalesArea/save_area', {
          areaId: self.currentArea.id,
          officeId: self.currentArea.officeId,
          salesRepId: self.currentArea.salesRepId,
          startTimestamp: self.currentArea.startTimestamp,
          areaData: self.currentArea.getPaths(),
        }).success(function(data /*, status, headers*/ ) {
          if (!data.success && data.require_signin) {
            $site.displaySignInDialog(function() {
              self.saveCurrentSalesArea($scope);
            });
            return;
          }

          // set the id of the new area
          self.currentArea.id = data.results;
          // add it to the areas array
          self.salesAreas.push(self.currentArea);
          var salesRepObj = $scope.getSalesRepById(self.currentArea.salesRepId);
          var areaLabel = '';
          if (salesRepObj && (salesRepObj.firstName || salesRepObj.lastName)) {
            areaLabel = salesRepObj.firstName + ' ' + salesRepObj.lastName + "'s Area";
          }
          makeSalesAreaLabel($scope, self.currentArea, areaLabel);
          self.setSalesAreaMode($scope, 'select');
        }).error(function( /*data, status, headers*/ ) {
          $msg.displayMessage("There was an error while trying to save this sales area.  Try again", true);
        });
      };

      // method to delete a sales area
      this.deleteCurrentSalesArea = function($scope) {
        var sa = self.currentArea;

        function deleteArea() {
          $http.post(window.SITE_PATH + "ng/SalesArea/delete_sales_area", {
            areaId: sa.id
          }).success(function(data) {
            if (!data.success && data.require_signin) {
              $site.displaySignInDialog(function() {
                self.deleteCurrentSalesArea($scope);
              });
              return;
            }

            // remove from DOM and map
            removeSalesAreaLabel(sa);
            for (var i = 0; i < self.salesAreas.length; i++) {
              if (self.salesAreas[i].id === sa.id) {
                self.salesAreas[i].hideArea();
                self.salesAreas.splice(i, 1);
                break;
              }
            }
            $msg.displayNotification("The sales area was removed.");
            self.setSalesAreaMode($scope, 'select');
          }).error(function( /*data*/ ) {
            $msg.displayMessage("There was an error while trying to delete the sales area", true);
          });
        }
        $msg.displayMessage("Are you sure you want to delete the highlighted sales area?", true, deleteArea, true);
      };

      // Loads all of the company's sales areas within the bounds of the current map
      this.loadVisibleAreas = function($scope) {
        var zm = $scope.map.getZoom();
        if (zm >= 13) {
          // get bounds of map
          var bounds = $scope.map.getBounds();
          var ne = bounds.getNorthEast();
          var sw = bounds.getSouthWest();

          var self = this;

          // check permissions and request the right amount of data.
          // Don't get excited, hackers, the server double checks your authorization
          var sr_id = 0;
          var o_id = $site.user.officeId;
          if ($site.hasPermission(['COMPANY_STATS'])) {
            o_id = 0;
          }

          // load from server
          $http.get(window.SITE_PATH + 'ng/SalesArea/get_sales_areas/salesRepId=' + sr_id + '&officeId=' + o_id + '&minlat=' + sw.lat() + '&maxlat=' + ne.lat() + '&minlng=' + sw.lng() + '&maxlng=' + ne.lng())
            .success(function(data) {
              if (!data.success && data.require_signin) {
                $site.displaySignInDialog(function() {
                  self.loadVisibleAreas($scope);
                });
                return;
              }

              var is_found, i, j;
              if (data.results && data.results.length) {
                // iterate through self.salesAreas and remove any that aren't in data.results
                for (i = 0; i < self.salesAreas.length; i++) {
                  is_found = false;
                  for (j = 0; j < data.results.length; j++) {
                    if (self.salesAreas[i].id === data.results[j].id) {
                      is_found = true;
                      break;
                    }
                  }
                  if (!is_found) {
                    removeSalesAreaLabel(self.salesAreas[i]);
                    self.salesAreas[i].hideArea();
                    self.salesAreas.splice(i, 1);
                  }
                }

                // iterate through data.results and add to the map any that aren't in self.contacts
                for (j = 0; j < data.results.length; j++) {
                  is_found = false;
                  for (i = 0; i < self.salesAreas.length; i++) {
                    if (self.salesAreas[i].id === data.results[j].id) {
                      is_found = true;
                      break;
                    }
                  }
                  if (!is_found) {
                    // add to map
                    //console.log("add sales area to map: " + data.results[j].id);
                    var sa = new SalesArea($scope.map);
                    sa.id = data.results[j].id;
                    var pd = JSON.parse(data.results[j].pointData);
                    sa.setPaths(pd);
                    sa.setClickHandler($scope, self.handleSalesAreaClick);

                    if (data.results[j].salesRepName) {
                      makeSalesAreaLabel($scope, sa, data.results[j].salesRepName + "'s Area");
                    }

                    sa.salesRepId = data.results[j].salesRepId;
                    sa.officeId = data.results[j].officeId;
                    sa.startTimestamp = new Date(data.results[j].startTimestamp);

                    self.salesAreas.push(sa);
                  }
                }
              }
            }).error(function( /*data*/ ) {
              console.log('unable to load contacts');
            });
        } else {
          for (var i = 0; i < this.salesAreas.length; i++) {
            this.salesAreas[i].hideArea();
          }
          this.salesAreas = [];
        }
      };


      this.handleDrag = function($scope /*, event*/ ) {
        for (var i = 0; i < this.salesAreas.length; i++) {
          var centroid = this.salesAreas[i].getCentroid();
          var labelXY = convertLatLngToXY($scope.map, centroid);
          var div = document.getElementById('areaid' + this.salesAreas[i].id);
          if (div) {
            div.style.left = labelXY.x + "px";
            div.style.bottom = labelXY.y + "px";
          }
        }
      };


      function convertLatLngToXY(map, latLng) {
        var bounds = map.getBounds();
        var ne = bounds.getNorthEast();
        var sw = bounds.getSouthWest();

        var lng_d = ne.lng() - sw.lng();
        var lat_d = ne.lat() - sw.lat();

        //console.log("dimensions- lng:" + lng_d + ", lat:" + lat_d);
        var map_div = document.getElementById('map-canvas');
        var x_px = map_div.offsetWidth;
        var y_px = map_div.offsetHeight;
        //console.log("dimensions- x:" + x_px + ", y:" + y_px);

        var x = (latLng.lng - sw.lng()) / lng_d * x_px;
        //console.log("lng pct: " + (latLng.lng - sw.lng()) / lng_d);
        var y = (latLng.lat - sw.lat()) / lat_d * y_px;
        //console.log("lat pct: " + (latLng.lat - sw.lat()) / lat_d);
        //console.log(x + ", " + y);

        return {
          x: x,
          y: y
        };
      }

      function makeSalesAreaLabel($scope, sa, labelText) {
        console.log('makeSalesAreaLabel');
        var div = document.getElementById('areaid' + sa.id);
        if (!div) {
          div = document.createElement("DIV");
          div.className = "map-label";
          div.id = "areaid" + sa.id;
          div.innerHTML = labelText;
          var map_div = document.getElementById('map-canvas');
          map_div.appendChild(div);
          console.log('added to DOM');
        }
        var centroid = sa.getCentroid();
        var xy = convertLatLngToXY($scope.map, centroid);
        div.style.left = xy.x + "px"; // this only works in the Western Hemisphere
        div.style.bottom = xy.y + "px"; // this only works in the Northern Hemisphere
      }

      function removeSalesAreaLabel(sa) {
        console.log('removeSalesLabel');
        var div = document.getElementById('areaid' + sa.id);
        if (div) {
          div.parentNode.removeChild(div);
        }
      }

    }

    return new SalesAreaServiceObj();
  }
]);
