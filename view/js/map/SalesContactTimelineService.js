window.app.factory("SalesContactTimelineService", ['$http', '$rootScope', 'GraphMessage', 'Messaging', 'Site',
  function($http, $rootScope, graphMessage, $msg, $site) {
    "use strict";

    function ContactTimeline() {

      this.startTimestamp = new Date();
      this.endTimestamp = new Date();

      var self = this;

      //this.data = [];
      this.rawData = [];

      this.options = {
        bgColor: "transparent",
        barFillColor: "rgba(98,37,157,0.2)", //#62259D
        barBorderColor: "#62259D",
        gridColor: "#eee",
        color: "#d0d2d0",
        labelFontSize: "12",
        labelFontFamily: "'Open Sans', sans-serif",
        barFontFamily: "'Open Sans', sans-serif",
        barSpacing: 0.15,
        barLabelPosition: 'bottom',
      };


      this.loadReport = function($scope) {

        $http.get('ng/Contact/get_contacts_by_hour/salesRepId=' + $scope.salesRepId + '&officeId=' + $scope.officeId + '&startTimestamp=' + this.startTimestamp.formatTimestamp() + '&endTimestamp=' + this.endTimestamp.formatTimestamp())
          .success(function(data) {
            if (!data.success && data.require_signin) {
              $site.displaySignInDialog(function() {
                self.loadReport($scope);
              });
              return;
            }

            var d;
            if (data && data.results) {
              self.rawData = data.results;

              var histogram = [];

              // First, let's get the range.
              console.log(self.startTimestamp + ' to ' + self.endTimestamp);
              console.log(Math.abs(self.endTimestamp - self.startTimestamp));
              var days = Math.floor(Math.abs(self.endTimestamp - self.startTimestamp) / 1000 / 60 / 60 / 24);
              // If the date range is just one day, we'll use hours for the histogram
              if (days === 0) {
                histogram = [{
                  name: '12pm - 1pm',
                  hour: 12,
                  value: 0
                }, {
                  name: '1pm - 2pm',
                  hour: 13,
                  value: 0
                }, {
                  name: '2pm - 3pm',
                  hour: 14,
                  value: 0
                }, {
                  name: '3pm - 4pm',
                  hour: 15,
                  value: 0
                }, {
                  name: '4pm - 5pm',
                  hour: 16,
                  value: 0
                }, {
                  name: '5pm - 6pm',
                  hour: 17,
                  value: 0
                }, {
                  name: '6pm - 7pm',
                  hour: 18,
                  value: 0
                }, {
                  name: '7pm - 8pm',
                  hour: 19,
                  value: 0
                }, ];
              }
              // If the date range is 31 days or less we'll use days for the histogram
              else if (days <= 31) {
                // fill time frame with empty values for each date
                histogram = [];
                d = new Date(self.startTimestamp.getFullYear(), self.startTimestamp.getMonth(), self.startTimestamp.getDate());
                while (d <= self.endTimestamp) {
                  histogram.push({
                    name: window.MONTHS[d.getMonth()].abbr + " " + d.getDate(),
                    day: d.getDate(),
                    month: d.getMonth() + 1,
                    year: d.getFullYear(),
                    value: 0
                  });
                  d.setTime(d.getTime() + 1 * 86400000);
                }
              }
              // Otherwise we'll use months for the histogram
              else {
                // fill time frame with empty values for each date
                histogram = [];
                d = new Date(self.startTimestamp.getFullYear(), self.startTimestamp.getMonth(), self.startTimestamp.getDate());
                d.setDate(1);
                while (d <= self.endTimestamp) {
                  histogram.push({
                    name: window.MONTHS[d.getMonth()].abbr + " " + d.getFullYear(),
                    year: d.getFullYear(),
                    month: d.getMonth() + 1,
                    value: 0
                  });
                  //d.setTime(d.getTime() + 1 * 86400000);
                  var y = d.getFullYear();
                  var m = d.getMonth() + 1;
                  if (m > 11) {
                    m -= 12;
                    y++;
                    d.setYear(y);
                  }
                  d.setMonth(m);
                }
              }

              // filter the data based on the wide variety of categories and systemTypes the user has selected
              histogram = filterData($scope, histogram);
              // tell the graph to update its darn self
              graphMessage.data = histogram;
              $rootScope.$broadcast('setData');
            }

          }).error(function( /*data*/ ) {
            $msg.displayMessage("There was an error loading the timeline data from the server.  My apologies, good sir.");
          });
      };


      this.displayFilters = function( /*$scope*/ ) {
        this.timelineFiltersAreDisplayed = true;
      };

      this.applyFilters = function($scope) {
        this.timelineFiltersAreDisplayed = false;
        this.loadReport($scope);
      };

      // updates the CANVAS to fit the screen and reloads data
      this.refreshTimeline = function($scope) {
        //console.log('broadcast message');
        //graphMessage.data = 'contact-timeline';
        //$rootScope.$broadcast('update');

        // get the data
        this.loadReport($scope);
      };

      // filter based on $scope.categories and $scope.systemTypes
      // at this point we have to assume that the correct data was loaded for the active office and sales rep - we're just filtering types of contacts on the client to avoid too much web traffic
      function filterData($scope, filteredData) {
        if (self.rawData) {
          for (var i = 0; i < self.rawData.length; i++) {
            var display = true;

            // filter out if the category or systemType is unchecked
            var ct = $scope.getCategoryById(self.rawData[i].categoryId);
            if (!ct || !ct.visible) {
              display = false;
            }

            var st = $scope.getSystemById(self.rawData[i].currentSystemId);
            if (!st || !st.visible) {
              display = false;
            }

            if (display) {
              // add the values together so we don't differentiate between different categoryIds and currentSystemIds
              var found = false;
              for (var j = 0; j < filteredData.length; j++) {
                if ((!filteredData[j].year || (filteredData[j].year === self.rawData[i].yr)) && (!filteredData[j].month || (filteredData[j].month === self.rawData[i].mo)) && (!filteredData[j].day || (filteredData[j].day === self.rawData[i].dy)) && (!filteredData[j].hour || (filteredData[j].hour === self.rawData[i].hr))) {
                  filteredData[j].value = Number(filteredData[j].value) + Number(self.rawData[i].qty);
                  found = true;
                }
              }
            }
          }
        }

        return filteredData;
      }


      // Takes all of the current filters on the map and converts them to a string
      this.getFiltersAsString = function($scope) {
        var str = '';
        if ($scope.officeId === 0) {
          str += 'Offices: All';
        } else {
          var office = $scope.getOfficeById($scope.officeId);
          str += "Office: " + office.officeCity + ', ' + office.officeState;
        }
        str += ', ';

        if ($scope.salesRepId === 0) {
          str += 'Reps: All';
        } else {
          var rep = $scope.getSalesRepById($scope.salesRepId);
          str += "Rep: " + rep.firstName + ' ' + rep.lastName;
        }
        str += ', ';

        str += 'Contacts: ';
        var cts = [];
        for (var i = 0; i < $scope.categories.length; i++) {
          if ($scope.categories[i].visible) {
            cts.push($scope.categories[i].name);
          }
        }
        if (cts.length === $scope.categories.length) {
          str += 'All';
        } else {
          str += cts.join(', ');
        }
        str += ', ';

        str += 'Systems: ';
        var sys = [];
        for (i = 0; i < $scope.systemTypes.length; i++) {
          if ($scope.systemTypes[i].visible) {
            sys.push($scope.systemTypes[i].companyName);
          }
        }
        if (sys.length === $scope.systemTypes.length) {
          str += 'All';
        } else {
          str += sys.join(', ');
        }

        return str;
      };

    }

    return new ContactTimeline();

  }
]);
