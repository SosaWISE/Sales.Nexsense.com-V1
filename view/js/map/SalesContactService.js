window.app.factory("SalesContactService", ['$http', '$timeout', '$compile', 'Messaging', 'Site',
  function($http, $timeout, $compile, $msg, $site) {
    "use strict";

    // The SalesContact class
    function SalesContact() {
      this.id = 0;
      this.categoryId = '0';
      this.currentSystemId = '0';
      this.firstName = '';
      this.lastName = '';
      this.address = '';
      this.city = '';
      this.state = '';
      this.zip = '';
      this.fullAddress = '';
      this.notes = '';
      this.followup = undefined;
      this.lat = '';
      this.lng = '';
      this.marker = undefined;
      this.salesRepId = '0';

      this.resetCategoryId = function() {
        this.categoryId = '0';
      };
      this.clone = function() {
        var sc = new SalesContact();
        for (var prop in this) {
          sc[prop] = this[prop];
        }
        return sc;
      };
    }

    function SalesCategory() {
      this.id = '';
      this.icon = '';
      this.name = 'New category';
    }

    function SalesContactService() {
      // method to instantiate a SalesContact object
      this.SalesContact = SalesContact;

      // whether or not the new contact form is being displayed to the user
      this.newContactFormIsDisplayed = false;

      // the list of contacts currently presented on the screen
      this.contacts = [];
      this.newContact = new SalesContact();
      this.selectedContact = null;
      this.newCategory = new SalesCategory();
      this.selectNewCategory = function(filename) {
        this.newCategory.filename = filename;
        this.newCategory.icon = {
          url: window.IMG_PATH + 'map/markers/categories/' + this.newCategory.filename,
          scaledSize: new google.maps.Size(24, 24),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(12, 12),
        };
      };

      // a reusable infowindow to be displayed when a marker is clicked
      this.infowindow = new google.maps.InfoWindow({
        content: '',
      });
      var infowindowContent = '';
      // load the infowindow template
      $http.get(window.SITE_PATH + 'view/templates/infowindow.html')
        .success(function(data) {
          infowindowContent = data;
        }).error(function( /*data*/ ) {
          console.log("Couldn't load InfoWindow template");
        });
      var compiledInfoWindowContent;

      var self = this;

      // Handle clicks on the map
      this.handleClick = function($scope, event, latLng) {
        if ( /*!this.newContact || */ this.newContact.marker == null) {
          this.placeMarker($scope, latLng);
        } else {
          this.moveMarker($scope, latLng);
        }
      };

      // Places a marker on the map so the user can input a new contact
      this.placeMarker = function($scope, location) {
        //this.newContact = new SalesContact();
        this.newContact.lat = location.lat();
        this.newContact.lng = location.lng();
        console.log(this.newContact);

        var self = this;

        this.newContact.marker = new google.maps.Marker({
          position: location,
          map: $scope.map,
          icon: window.newContactIcon,
          zIndex: 99,
        });
        addInfoBox($scope, this.newContact);

        $scope.reverseGeocode(location);

        $scope.$apply(function() {
          self.newContactFormIsDisplayed = true;
        });
      };

      function addInfoBox($scope, ct) {
        if (!compiledInfoWindowContent) {
          compiledInfoWindowContent = $compile(infowindowContent)($scope);
        }

        google.maps.event.addListener(ct.marker, 'click', function() {
          self.selectedContact = ct;
          $scope.$apply();

          self.infowindow.setContent(compiledInfoWindowContent[0]);
          self.infowindow.open($scope.map, ct.marker);
        });
      }

      // Moves the current contact marker to a new location
      this.moveMarker = function($scope, location) {
        this.newContact.marker.setPosition(location);
        $scope.reverseGeocode(location);
      };

      // Cancel the input of a new contact and hide the new contact panel
      this.cancelNewContact = function( /*$scope*/ ) {
        console.log('cancel');
        if (this.newContact.marker && !this.newContact.id) {
          this.newContact.marker.setMap(null);
        }
        var self = this;
        this.newContactFormIsDisplayed = false;
        window.setTimeout(function() {
          //self.newContact = null; // why is this on a timeout?  because the browser otherwise will whine about the required form fields missing when the two-way binding tries to clear their values.  putting it on any sort of timeout ensures it's placed after the form is gone in the code execution
          self.newContact = new SalesContact(); // blank it out
        }, 5);
      };

      // edit a contact
      this.editSelectedContact = function( /*$scope*/ ) {
        this.newContact = this.selectedContact;
        this.newContact.backup = this.selectedContact.clone();
        this.newContact.notes = ''; // blank out the notes

        this.infowindow.close();
        this.selectedContact = undefined;
        this.newContactFormIsDisplayed = true;
      };

      // Save a new contact
      this.saveNewContact = function($scope) {
        var self = this;
        // try to get lat lon
        if (!navigator.geolocation) {
          return;
        }

        function save(ct, lat, lng) {
          $http.post(window.SITE_PATH + 'ng/Contact/save_contact', {
            id: ct.id,
            firstName: ct.firstName,
            lastName: ct.lastName,
            address: ct.address,
            city: ct.city,
            state: ct.state,
            zip: ct.zip,
            categoryId: ct.categoryId,
            currentSystemId: ct.currentSystemId,
            notes: ct.notes,
            followup: ct.followup == null ? '' : ct.followup.formatTimestamp(),
            latitude: ct.lat,
            longitude: ct.lng,
            salesRepLatitude: lat,
            salesRepLongitude: lng,
          }).success(function(data /*, status, headers*/ ) {
            if (!data.success && data.require_signin) {
              $site.displaySignInDialog(function() {
                self.saveNewContact($scope);
              });
              return;
            }

            if (self.newContact.id) {
              /*for (var i=0; i<self.contacts.length; i++) {
								if (self.contacts[i].id == self.newContact.id) {
									// remove the old version and splice in the new one
									self.contacts.splice(i, 1, self.newContact);
									break;
								}
							}*/
            } else {
              // set the id of the new contact
              self.newContact.id = data.results;
              // add it to the contacts array
              self.contacts.push(self.newContact);
            }
            // hide the new contact form
            self.newContactFormIsDisplayed = false;
            //self.newContact = null;
            self.newContact = new SalesContact(); // blank it out
          }).error(function( /*data, status, headers*/ ) {
            $msg.displayMessage("There was an error while trying to save this contact.  Try again", true);
          });
        }

        navigator.geolocation.getCurrentPosition(function(position) {
          save(self.newContact, position.coords.latitude, position.coords.longitude);
        }, function( /*positionError*/ ) {
          save(self.newContact);
        }, {
          timeout: 10000
        });
      };

      // Loads all of the company's contacts within the bounds of the current map
      this.loadVisibleContacts = function($scope) {
        var zm = $scope.map.getZoom();
        if (zm >= 15) {
          // get bounds of map
          var bounds = $scope.map.getBounds();
          var ne = bounds.getNorthEast();
          var sw = bounds.getSouthWest();

          var self = this;

          // check permissions and request the right amount of data.
          // Don't get excited, hackers, the server double checks your authorization
          var sr_id = $site.user.userId;
          var o_id = $site.user.officeId;
          if ($site.hasPermission(['OFFICE_STATS', 'COMPANY_STATS'])) {
            sr_id = 0;
          }
          if ($site.hasPermission(['COMPANY_STATS'])) {
            o_id = 0;
          }

          // load from server
          console.log('get_contacts_in_area');
          $http.get(window.SITE_PATH + 'ng/Contact/get_contacts_in_area/salesRepId=' + sr_id + '&officeId=' + o_id + '&minlat=' + sw.lat() + '&maxlat=' + ne.lat() + '&minlng=' + sw.lng() + '&maxlng=' + ne.lng()).success(function(data) {
            if (!data.success && data.require_signin) {
              $site.displaySignInDialog(function() {
                self.loadVisibleContacts($scope);
              });
              return;
            }

            if (data.results) {
              //console.log(data.results);
              var i, j, is_found;

              // iterate through self.contacts and remove any that aren't in data.results
              for (i = 0; i < self.contacts.length; i++) {
                is_found = false;
                for (j = 0; j < data.results.length; j++) {
                  if (self.contacts[i].id === data.results[j].id) {
                    is_found = true;
                    break;
                  }
                }
                if (!is_found) {
                  if (self.contacts[i].marker) {
                    self.contacts[i].marker.setMap(null);
                  }
                  self.contacts.splice(i, 1);
                }
              }

              // iterate through data.results and add to the map any that aren't in self.contacts
              for (j = 0; j < data.results.length; j++) {
                is_found = false;
                for (i = 0; i < self.contacts.length; i++) {
                  if (self.contacts[i].id === data.results[j].id) {
                    is_found = true;
                    break;
                  }
                }
                if (!is_found) {
                  // add to map
                  var ct = new SalesContact();
                  ct.id = data.results[j].id;
                  ct.categoryId = data.results[j].categoryId;
                  ct.currentSystemId = data.results[j].systemId;
                  ct.firstName = data.results[j].firstName;
                  ct.lastName = data.results[j].lastName;
                  ct.latitude = data.results[j].latitude;
                  ct.longitude = data.results[j].longitude;
                  ct.notes = data.results[j].note;
                  ct.salesRepId = data.results[j].salesRepId;
                  ct.address = data.results[j].address;
                  ct.address2 = data.results[j].address2 ? data.results[j].address2 : '';
                  ct.city = data.results[j].city;
                  ct.state = data.results[j].state;
                  ct.zip = data.results[j].zip;
                  ct.fullAddress = data.results[j].fullAddress;
                  var location = new google.maps.LatLng(ct.latitude, ct.longitude);
                  var theicon = window.genericContactIcon;
                  if ($scope.iconmode === 'category') {
                    var cat = $scope.getCategoryById(ct.categoryId);
                    if (cat) {
                      theicon = cat.icon;
                    }
                  } else {
                    var systype = $scope.getSystemById(ct.currentSystemId);
                    if (systype) {
                      theicon = systype.icon;
                    }
                  }
                  ct.marker = new google.maps.Marker({
                    position: location,
                    map: $scope.map,
                    icon: theicon,
                    zIndex: 97,
                  });
                  addInfoBox($scope, ct);
                  self.contacts.push(ct);
                }
              }
            }
            self.filterVisibleContacts($scope);
          }).error(function( /*data*/ ) {
            console.log('unable to load contacts');
          });
        } else {
          for (var i = 0; i < this.contacts.length; i++) {
            if (this.contacts[i].marker) {
              this.contacts[i].marker.setMap(null);
            }
          }
          this.contacts = [];
        }
      };

      this.filterVisibleContacts = function($scope) {
        for (var i = 0; i < this.contacts.length; i++) {
          if (this.contacts[i].marker) {
            var display = true;

            // filter out if the wrong office is checked
            var rep = $scope.getSalesRepById(this.contacts[i].salesRepId);
            if (!(rep && rep.officeId === $scope.officeId) && $scope.officeId !== 0) {
              display = false;
            }

            // filter out if the wrong sales rep is checked
            if (this.contacts[i].salesRepId !== $scope.salesRepId && $scope.salesRepId !== 0) {
              display = false;
            }

            // filter out if the category or systemType is unchecked
            var ct = $scope.getCategoryById(this.contacts[i].categoryId);
            if (!ct || !ct.visible) {
              display = false;
            }

            var st = $scope.getSystemById(this.contacts[i].currentSystemId);
            if (!st || !st.visible) {
              display = false;
            }

            if (display) {
              this.contacts[i].marker.setMap($scope.map);
            } else {
              this.contacts[i].marker.setMap(null);
            }
          }
        }
      };

      this.updateIcons = function($scope) {
        var theicon = window.genericContactIcon;
        if (this.contacts) {
          for (var i = 0; i < this.contacts.length; i++) {
            if ($scope.iconmode === 'category') {
              var cotype = $scope.getCategoryById(this.contacts[i].categoryId);
              if (cotype) {
                theicon = cotype.icon;
              }
            } else {
              var systype = $scope.getSystemById(this.contacts[i].currentSystemId);
              if (systype) {
                theicon = systype.icon;
              }
            }

            this.contacts[i].marker.setIcon(theicon);
          }
        }
      };

      this.saveCategory = function($scope) {
        $http.post('ng/Contact/save_category', {
          id: this.newCategory.id,
          name: this.newCategory.name,
          filename: this.newCategory.filename,
        }).success(function(data) {
          if (!data.success && data.require_signin) {
            $site.displaySignInDialog(function() {
              self.saveCategory($scope);
            });
            return;
          }

          if (data && data.results) {
            console.log(data.results);
            data.results.visible = true;
            data.results.icon = {
              url: window.IMG_PATH + 'map/markers/categories/' + data.results.filename,
              scaledSize: new google.maps.Size(24, 24),
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(12, 12),
            };
            // close the dialog box
            $scope.hideNewCategoryDialog();

            var inserted, i;
            if (self.newCategory.id) {
              inserted = false;
              $scope.displayEditCategoriesDialog();
              for (i = 0; i < $scope.categories.length; i++) {
                if ($scope.categories[i].id === self.newCategory.id) {
                  $scope.categories.splice(i, 1, self.newCategory);
                  inserted = true;
                }
              }
              if (!inserted) {
                $scope.categories.push(self.newCategory);
              }

              // if iconmode == category
              if ($scope.iconmode === 'category') {
                // iterate through all contacts on the map and change the marker for any of them that have this category id
                for (i = 0; i < self.contacts.length; i++) {
                  if (self.contacts[i].categoryId === self.newCategory.id) {
                    if (self.contacts[i].marker) {
                      self.contacts[i].marker.setIcon(self.newCategory.icon);
                    }
                  }
                }
              }
            } else {
              // push the new category onto the categories array (try to alphabetize)
              inserted = false;
              for (i = 0; i < $scope.categories.length; i++) {
                if ($scope.categories[i].name.localeCompare(data.results.name) > 0) {
                  $scope.categories.splice(i, 0, data.results);
                  inserted = true;
                  break;
                }
              }
              if (!inserted) {
                $scope.categories.push(data.results);
              }

              // select it
              $timeout(function() {
                self.newContact.categoryId = String(data.results.id);
                $scope.categoryChanged();
              }, 5);
            }
          }
        }).error(function( /*data*/ ) {
          $msg.displayMessage("Sorry, I couldn't save that new category");
        });
      };


      // Deletes a category for the current user
      this.deleteCategory = function($scope, category) {
        $http.post('ng/Contact/delete_category', {
          id: category.id,
        }).success(function(data) {
          if (!data.success && data.require_signin) {
            $site.displaySignInDialog(function() {
              self.deleteCategory($scope, category);
            });
            return;
          }

          if (data && data.results) {
            $msg.displayNotification("Category " + category.name + " deleted.");

            // remove the category from all lists
            for (var i = 0; i < $scope.categories.length; i++) {
              if ($scope.categories[i].id === category.id) {
                $scope.categories.splice(i, 1);
              }
            }

            // update any markers with this category to have a generic one instead
            for (i = 0; i < self.contacts.length; i++) {
              if (self.contacts[i].categoryId === category.id) {
                if (self.contacts[i].marker) {
                  self.contacts[i].marker.setIcon(window.genericContactIcon);
                }
              }
            }
          }
        }).error(function( /*data*/ ) {
          $msg.displayMessage("Sorry, I couldn't delete that category for you.  Something went all janky on me.");
        });
      };
    }

    return new SalesContactService();
  }
]);
