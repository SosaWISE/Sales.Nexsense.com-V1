var app = angular.module("MySite", []);

app.factory("Site", ['$http', '$window', '$timeout', 'Messaging',
  function($http, $window, $timeout, $msg) {
    "use strict";
    /*if (navigator.geolocation) {
		setInterval(function() {
		    navigator.geolocation.getCurrentPosition(function(position) {
		    	// track
		    	$http.post(SITE_PATH + 'ng/Tracking/track_location', {salesRepId:1, latitude:position.coords.latitude, longitude:position.coords.longitude});
		    }, function(positionError) {
		    	console.log('error getting current position: ' + positionError.message);
		    }, {timeout: 10000});
		}, 900000); // 15 minutes = 900000 seconds
	}
	else {
		$msg.displayMessage("You can't use the app without location services enabled", true);
	}*/

    var sessionId = 'j3e8';
    // var timezoneoffset = -Math.round((new Date()).getTimezoneOffset() / 60);

    function SiteObject() {
      this.user = {
        userId: null,

        username: null,
        password: null,
        PIN: null,

        permissions: [],

        officeId: null,
        officeName: null,
        photoUrl: null,
        email: null,
        firstName: null,
        lastName: null,
      };
      this.sessionId = sessionId;
      this.isSigningIn = false;
      this.isSignedIn = undefined;
      this.isTimeOut = false;

      var functionQueue = [];
      var self = this;

      this.navigateTo = function(page) {
        $window.location.href = page;
      };

      this.signOut = function() {
        document.cookie = "SessionId=; expires=" + (new Date()).toString() + "; path=/";
        document.cookie = "UserId=; expires=" + (new Date()).toString() + "; path=/";
        document.cookie = "OfficeId=; expires=" + (new Date()).toString() + "; path=/";
        document.cookie = "Email=; expires=" + (new Date()).toString() + "; path=/";
        document.cookie = "FirstName=; expires=" + (new Date()).toString() + "; path=/";
        document.cookie = "LastName=; expires=" + (new Date()).toString() + "; path=/";
        document.cookie = "Permissions=; expires=" + (new Date()).toString() + "; path=/";
        self.isSignedIn = false;

        $http.post('ng/User/sign_out', {})
          .success(function( /*data*/ ) {
            var url = $window.location.pathname;
            var page = url.substring(url.lastIndexOf('/') + 1);
            if (page !== 'signin') {
              self.navigateTo('signin');
            }
          }).error(function( /*data*/ ) {
            $msg.displayMessage("Sorry, we couldn't sign you out right now.", true);
          });
      };

      this.signIn = function(cb) {
        //if (sessionId) {
        if (self.user.username && (self.user.password || self.user.PIN)) {
          if (!self.isSigningIn) {
            self.isSigningIn = true;
            $http.post('ng/User/sign_in', {
              username: self.user.username,
              password: self.user.password,
              PIN: self.user.PIN,
              /*SessionID: self.sessionId,*/
            }).success(function(data) {
              self.isSigningIn = false;

              if (data.success) {
                self.user.userId = data.results.id;
                self.user.officeId = data.results.officeId;
                self.user.email = data.results.email;
                self.user.firstName = data.results.firstName;
                self.user.lastName = data.results.lastName;
                self.user.permissions = data.results.permissions;
                document.cookie = "UserId=" + self.user.userId + "; path=/";
                document.cookie = "OfficeId=" + self.user.officeId + "; path=/";
                document.cookie = "Email=" + self.user.email + "; path=/";
                document.cookie = "FirstName=" + self.user.firstName + "; path=/";
                document.cookie = "LastName=" + self.user.lastName + "; path=/";
                document.cookie = "Permissions=" + JSON.stringify(self.user.permissions) + "; path=/";
                self.isSignedIn = true;
                self.isTimeOut = false;
                cb(data);
              } else {
                $msg.displayMessage("Invalid username or password.  Try again", true);
              }
            }).error(function( /*data*/ ) {
              self.isSigningIn = false;
              $msg.displayMessage("There was an error while trying to sign in.", true);
            });
          }
        }
        //}
        /*else {
		        	if (!isGettingSession)
		        		getSession(function() { self.authenticate(username, password); });
		        }*/
      };

      this.displaySignInDialog = function(callback) {
        // show the sign in directive
        this.isSignedIn = false;
        if (callback) {
          functionQueue.push(callback);
        }
      };

      // set the signIn promise to the callback that was passed into this function
      this.signInDialogOnClick = function() {
        self.signIn(function( /*data*/ ) {
          while (functionQueue.length) {
            if (functionQueue[0]) {
              functionQueue[0]();
              functionQueue.splice(0, 1);
            }
          }
        });
      };

      // check if a user has a specific permission
      this.hasPermission = function(valid_perms) {
        valid_perms.push('DEV');
        for (var vp = 0; vp < valid_perms.length; vp++) {
          for (var p = 0; p < this.user.permissions.length; p++) {
            if (valid_perms[vp] === this.user.permissions[p].permission) {
              return true;
            }
          }
        }
        //////////////TESTING//////////////
        return true;
        //////////////TESTING//////////////
      };
    }

    var siteobj = new SiteObject();

    // get the session and user from cookies
    if (document.cookie) {
      console.log(document.cookie);
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        cookies[i] = cookies[i].replace(/^[\s]+/, '').replace(/[\s]+$/, ''); // trim
        var pairs = cookies[i].split('=');
        if (pairs[0] === 'SessionId') {
          sessionId = pairs[1];
        } else if (pairs[0] === 'UserId') {
          siteobj.user.userId = pairs[1];
        } else if (pairs[0] === 'OfficeId') {
          siteobj.user.officeId = pairs[1];
        } else if (pairs[0] === 'Email') {
          siteobj.user.email = pairs[1];
          siteobj.user.username = pairs[1];
        } else if (pairs[0] === 'FirstName') {
          siteobj.user.firstName = pairs[1];
        } else if (pairs[0] === 'LastName') {
          siteobj.user.lastName = pairs[1];
        } else if (pairs[0] === 'Permissions') {
          var v = pairs[1];
          console.log("pairs[1]", v);
          siteobj.user.permissions = v ? JSON.parse(v) : [];
        }
      }
    }

    // var isGettingSession = false;
    // start a new session
    /*function getSession(callback) {
	    if (!sessionId) {
	        console.log('getting a session...');
	        isGettingSession = true;
	        $http({
	            url:'http://cs1.dev.nexsense.com/AuthSrv/SessionStart',
	            method:"POST",
	            data: {
	                AppToken: 'NXS_CONNEXT_CORS',
	                TimeZoneOffset: timezoneoffset,
	            }
	        }).success(function(data) {
	        	isGettingSession = false;
	            console.log(data);
	            sessionId = data.SessionId;
	            document.cookie = "SessionId=" + sessionId + "; path=/";
	            if (callback)
	            	callback();
	        }).error(function(data) {
	        	isGettingSession = false;
	            console.log(data);
	        });
	    }
	}
	getSession();*/

    return siteobj;
  }
]);

/***
 * This factory service is used just to broadcast a message to a Graph directive
 ***/
app.factory("GraphMessage", function() {
  "use strict";

  return {
    data: null
  };
});

/***
 * The attribute-only BarGraph Directive which is directly tied to the BarGraph object found in BarGraph.js
 ***/
app.directive("barGraph", ['$timeout', 'GraphMessage',
  function($timeout, graphMessage) {
    "use strict";
    return {
      restrict: 'A',
      scope: {
        graphData: '=',
        graphOptions: '=',
        graphId: '='
      },
      controller: function($scope /*, $attrs*/ ) {
        $scope.$on('update', function() {
          if (graphMessage.data === $scope.graphId) {
            if ($scope.graph) {
              $timeout($scope.graph.fillParent, 0); // we do this on a timeout so it gets thrown to the back of the execution queue (that is, AFTER the display of the new graph element)
            }
          }
        });
        $scope.$on('setData', function() {
          if ($scope.graph) {
            $timeout(function() {
              $scope.graph.setData(graphMessage.data);
            }, 0); // we do this on a timeout so it gets thrown to the back of the execution queue (that is, AFTER the display of the new graph element)
          }
        });
      },
      link: function($scope, element /*, attrs*/ ) {
        var cvs = document.createElement("CANVAS");
        cvs.width = "1";
        cvs.height = "1";
        element.append(cvs);

        // This directive is executed before the rest of the DOM loads - we need to wait until the flexbox sizes are calculated so we can fill the parent's available space with the bar graph
        angular.element(window).bind('load', function() {
          $scope.graph = new BarGraph(cvs, $scope.graphData, $scope.graphOptions);
        });
        angular.element(window).bind('resize', function() {
          $timeout($scope.graph.fillParent, 0);
        });
      }
    };
  }
]);


app.factory("Messaging", [

  function() {
    "use strict";
    var screenBlocks = 0;
    var __notificationTimeout = null;

    return {
      blockScreen: function() {
        var shadowEl = document.getElementById('_shadowOverlay_');
        if (shadowEl == null) {
          shadowEl = document.createElement("DIV");
          shadowEl.id = "_shadowOverlay_";
          shadowEl.style.margin = "0";
          shadowEl.style.padding = "0";
          shadowEl.style.opacity = "0.6";
          shadowEl.style.filter = "alpha(opacity=60)";
          shadowEl.style.backgroundColor = "#808080";
          shadowEl.style.position = "fixed";
          shadowEl.style.top = "0";
          shadowEl.style.left = "0";
          shadowEl.style.right = "0";
          shadowEl.style.bottom = "0";
          shadowEl.style.width = "100%";
          shadowEl.style.height = "100%";
          shadowEl.style.zIndex = "99";
          document.body.appendChild(shadowEl);
        }
        shadowEl.style.display = "block";
        screenBlocks++;
      },
      unblockScreen: function() {
        screenBlocks--;
        if (screenBlocks === 0) {
          var shadowEl = document.getElementById('_shadowOverlay_');
          if (shadowEl != null) {
            shadowEl.style.display = "none";
          }
        }
      },
      blockForMessage: function() {
        var shadowEl = document.getElementById('_shadowMessageOverlay_');
        if (shadowEl == null) {
          shadowEl = document.createElement("DIV");
          shadowEl.id = "_shadowMessageOverlay_";
          shadowEl.style.height = "100%";
          document.body.appendChild(shadowEl);
        }
        shadowEl.style.display = "block";
      },
      unblockForMessage: function() {
        var shadowEl = document.getElementById('_shadowMessageOverlay_');
        if (shadowEl != null) {
          shadowEl.style.display = "none";
        }
      },
      displayMessage: function(msg, isWarning, callbackFunction, isCancellable) {
        var $site = this;

        if (isCancellable == null) {
          isCancellable = false;
        }
        this.blockForMessage();
        var dFromTop = document.body.scrollTop;
        if (dFromTop === 0) {
          if (document.documentElement.scrollTop != null) {
            dFromTop = document.documentElement.scrollTop;
          }
        }
        var msgBox = document.getElementById('_messageBox_');
        var msgContainer = document.getElementById('_messageContainer_');
        var msgOkButton = document.getElementById('_messageOkayButton_');
        var msgCancelButton = document.getElementById('_messageCancelButton_');
        var msgElementContainer = document.getElementById('_messageElementContainer_');
        if (msgBox == null) {
          msgBox = document.createElement("DIV");
          msgBox.id = "_messageBox_";

          msgContainer = document.createElement("DIV");
          msgContainer.id = "_messageContainer_";
          msgContainer.style.minHeight = "70px";
          msgBox.appendChild(msgContainer);

          msgElementContainer = document.createElement("DIV");
          msgElementContainer.id = "_messageElementContainer_";
          msgElementContainer.style.display = "none";
          msgBox.appendChild(msgElementContainer);

          var okDiv = document.createElement("DIV");
          okDiv.className = "_messageBox_ok_div_";

          msgCancelButton = document.createElement("INPUT");
          msgCancelButton.id = "_messageCancelButton_";
          msgCancelButton.type = "button";
          msgCancelButton.className = "button cancel";
          msgCancelButton.name = "_messageCancelButton_";
          msgCancelButton.value = "cancel";
          msgCancelButton.onclick = function() {
            $site.hideMessage.call($site);
          };
          okDiv.appendChild(msgCancelButton);
          okDiv.appendChild(document.createTextNode(" "));

          msgOkButton = document.createElement("INPUT");
          msgOkButton.id = "_messageOkayButton_";
          msgOkButton.type = "button";
          msgOkButton.className = "button";
          msgOkButton.name = "_messageOkayButton_";
          msgOkButton.value = "okay";
          okDiv.appendChild(msgOkButton);
          msgBox.appendChild(okDiv);

          document.body.appendChild(msgBox);
        }

        if (callbackFunction != null) {
          msgOkButton.onclick = function() {
            $site.hideMessage.call($site);
            if (callbackFunction != null) {
              callbackFunction();
            }
          };
        } else {
          isCancellable = false;
          msgOkButton.onclick = function() {
            $site.hideMessage();
          };
        }

        msgCancelButton.style.display = (isCancellable) ? "inline" : "none";

        msgContainer.innerHTML = "";
        msgElementContainer.innerHTML = "";
        msgElementContainer.style.display = "none";
        msgContainer.appendChild(document.createTextNode(msg));
        msgContainer.className = (isWarning) ? "warning" : "message";
        msgBox.style.top = '20px';
        msgBox.style.display = "block";
      },
      hideMessage: function() {
        var el = document.getElementById('_messageBox_');
        var msgEl = document.getElementById('_messageContainer_');
        if (el != null && msgEl != null) {
          msgEl.innerHTML = "";
          el.style.display = "none";
        }
        this.unblockForMessage();
      },
      appendElementToMessage: function(el) {
        var container = document.getElementById('_messageElementContainer_');
        container.style.display = "block";
        container.appendChild(el);
      },
      displayWaitMessage: function(msg) {
        this.blockForMessage();
        var msgBox = document.getElementById('_waitmessageBox_');
        var msgContainer = document.getElementById('_waitmessageText_');
        // var msgButton = document.getElementById('_waitmessageOkayButton_');
        // var waitImg = document.getElementById('_waitImage_');
        var waitImgContainer = document.getElementById('_waitImgContainer_');
        if (msgBox == null) {
          msgBox = document.createElement("DIV");
          msgBox.id = "_waitmessageBox_";
          msgBox.className = "_waitmessageBox_";

          waitImgContainer = document.createElement("DIV");
          waitImgContainer.id = "_waitImgContainer_";
          waitImgContainer.style.textAlign = "center";
          waitImgContainer.style.padding = "0px 0px 20px 0px";

          var waiter = new WaitIndicatorSpinner(waitImgContainer, 40, 40, {
            color: "#222",
            type: WaitIndicators.RoundPetalFlower,
            petals: 12,
            sizeDecay: 1,
            alphaDecay: 0.82,
            rotationSpeed: (Math.PI * 2) / 1700, // radians per ms
            pulseInterval: 350,
            display: true
          });
          waiter = waiter; //
          msgBox.appendChild(waitImgContainer);


          msgContainer = document.createElement("DIV");
          msgContainer.id = "_waitmessageText_";
          msgContainer.style.minHeight = "70px";
          msgContainer.style.textAlign = "center";
          msgBox.appendChild(msgContainer);

          document.body.appendChild(msgBox);
        }
        msgContainer.innerHTML = "";
        if (msg) {
          msgContainer.appendChild(document.createTextNode(msg));
        }
        msgContainer.className = "message";
        msgBox.style.display = "block";
      },
      hideWaitMessage: function() {
        var el = document.getElementById('_waitmessageBox_');
        var msgEl = document.getElementById('_waitmessageText_');
        if (el != null && msgEl != null) {
          msgEl.innerHTML = "";
          el.style.display = "none";
        }
        this.unblockForMessage();
      },
      /***
       * Displays a notification message to the user.  It disappears automatically after a few seconds or it can be clicked to dismiss
       * @@param {string} messageText - the text to display to the user
       * @returns {}
       */
      displayNotification: function(messageText) {
        var $site = this;
        var msgBoxEl = document.getElementById('__notificationElement__');
        var msgText = document.getElementById('__notificationTextElement__');
        if (!msgBoxEl) {
          msgBoxEl = document.createElement("DIV");
          msgBoxEl.id = "__notificationElement__";
          msgBoxEl.onclick = $site.hideNotification;

          msgText = document.createElement("DIV");
          msgText.id = "__notificationTextElement__";
          msgBoxEl.appendChild(msgText);

          document.body.appendChild(msgBoxEl);
        }
        msgText.innerHTML = messageText;
        msgBoxEl.style.display = "block";
        __notificationTimeout = window.setTimeout($site.hideNotification, 5000);
      },
      /***
       * Hides any displayed notification from the screen
       * @returns {}
       */
      hideNotification: function() {
        var msgBoxEl = document.getElementById('__notificationElement__');
        if (msgBoxEl) {
          msgBoxEl.style.display = "none";
        }
      },
    };
  }
]);

app.factory("States", function() {
  "use strict";
  return {
    statelist: [{
        code: 'AL',
        name: 'Alabama'
      }, {
        code: 'AK',
        name: 'Alaska'
      }, {
        code: 'AZ',
        name: 'Arizona'
      }, {
        code: 'AR',
        name: 'Arkansas'
      }, {
        code: 'CA',
        name: 'California'
      }, {
        code: 'CO',
        name: 'Colorado'
      }, {
        code: 'CT',
        name: 'Connecticut'
      }, {
        code: 'DE',
        name: 'Delaware'
      }, {
        code: 'FL',
        name: 'Florida'
      }, {
        code: 'GA',
        name: 'Georgia'
      },

      {
        code: 'HI',
        name: 'Hawaii'
      }, {
        code: 'ID',
        name: 'Idaho'
      }, {
        code: 'IL',
        name: 'Illinois'
      }, {
        code: 'IN',
        name: 'Indiana'
      }, {
        code: 'IA',
        name: 'Iowa'
      }, {
        code: 'KS',
        name: 'Kansas'
      }, {
        code: 'KY',
        name: 'Kentucky'
      }, {
        code: 'LA',
        name: 'Louisiana'
      }, {
        code: 'ME',
        name: 'Maine'
      }, {
        code: 'MD',
        name: 'Maryland'
      },

      {
        code: 'MA',
        name: 'Massachusetts'
      }, {
        code: 'MI',
        name: 'Michigan'
      }, {
        code: 'MN',
        name: 'Minnesota'
      }, {
        code: 'MS',
        name: 'Mississippi'
      }, {
        code: 'MO',
        name: 'Missouri'
      }, {
        code: 'MT',
        name: 'Montana'
      }, {
        code: 'NE',
        name: 'Nebraska'
      }, {
        code: 'NV',
        name: 'Nevada'
      }, {
        code: 'NH',
        name: 'New Hampshire'
      }, {
        code: 'NJ',
        name: 'New Jersey'
      },

      {
        code: 'NM',
        name: 'New Mexico'
      }, {
        code: 'NY',
        name: 'New York'
      }, {
        code: 'NC',
        name: 'North Carolina'
      }, {
        code: 'ND',
        name: 'North Dakota'
      }, {
        code: 'OH',
        name: 'Ohio'
      }, {
        code: 'OK',
        name: 'Oklahoma'
      }, {
        code: 'OR',
        name: 'Oregon'
      }, {
        code: 'PA',
        name: 'Pennsylvania'
      }, {
        code: 'RI',
        name: 'Rhode Island'
      }, {
        code: 'SC',
        name: 'South Carolina'
      },

      {
        code: 'SD',
        name: 'South Dakota'
      }, {
        code: 'TN',
        name: 'Tennessee'
      }, {
        code: 'TX',
        name: 'Texas'
      }, {
        code: 'UT',
        name: 'Utah'
      }, {
        code: 'VT',
        name: 'Vermont'
      }, {
        code: 'VA',
        name: 'Virginia'
      }, {
        code: 'WA',
        name: 'Washington'
      }, {
        code: 'WV',
        name: 'West Virginia'
      }, {
        code: 'WI',
        name: 'Wisconsin'
      }, {
        code: 'WY',
        name: 'Wyoming'
      },
    ]
  };
});



// var stdWaitIndicatorWidth = 40;
// var stdWaitIndicatorHeight = 40;
var stdWaitIndicatorOpts = {
  color: "#fff",
  type: WaitIndicators.RoundPetalFlower,
  petals: 12,
  sizeDecay: 1,
  alphaDecay: 0.82,
  rotationSpeed: (Math.PI * 2) / 1700, // radians per ms
  pulseInterval: 350,
  display: true
};

app.factory("FormValidation", function() {
  "use strict";
  return {
    phone: /^([0-9]{3}|\([0-9]{3}\))[\-\.\s]?[0-9]{3}[\-\.\s]?[0-9]{4}$/,
    email: /^[a-zA-Z0-9\-_\.]+@[a-zA-Z0-9\-_\.]+\.[a-zA-Z]+$/,
    zip: /^[0-9]{5}$/,
  };
});

app.filter('dollars', function() {
  "use strict";
  return function(input) {
    var prefix = String(Math.floor(Math.abs(input)));
    for (var i = prefix.length - 3; i > 0; i -= 3) {
      prefix = prefix.substring(0, i) + ',' + prefix.substring(i);
      i--;
    }

    var retval = input < 0 ? '-$' + prefix : '$' + prefix;
    return retval;
  };
});
app.filter('cents', function() {
  "use strict";
  return function(input) {
    var dolly = Math.floor(Math.abs(input));
    dolly = Math.abs(input) - dolly;
    if (dolly === 0) {
      return '.00';
    }
    var cents = String(Math.round(dolly * 100));
    while (cents.length < 2) {
      if (dolly < 10) {
        cents = '0' + cents;
      } else {
        cents += '0';
      }
    }
    return '.' + cents;
  };
});

app.directive("header", ['Site', '$window',
  function($site, $window) {
    "use strict";
    return {
      restrict: 'E',
      templateUrl: window.SITE_PATH + 'view/templates/header.html',
      link: function($scope /*, element, attrs*/ ) {
        $scope.$site = $site;
        $scope.getMenuIsDisplayed = function() {
          if (window.innerWidth >= 768) {
            $scope.menuIsDisplayed = true;
          }
          return $scope.menuIsDisplayed;
        };

        $scope.toggleMenu = function() {
          $scope.menuIsDisplayed = !$scope.menuIsDisplayed;
        };

        angular.element($window).bind('resize', function() {
          $scope.$apply(function() {
            $scope.menuIsDisplayed = (window.innerWidth >= 768);
          });
        });
        angular.element($window).bind('load', function() {
          $scope.menuIsDisplayed = (window.innerWidth >= 768);
        });
      },
    };
  }
]);

app.directive("footer", ['Site',
  function( /*$site*/ ) {
    "use strict";
    return {
      restrict: 'E',
      templateUrl: window.SITE_PATH + 'view/templates/footer.html',
    };
  }
]);


app.directive("signindialog", ['Site', '$window', 'Messaging',
  function($site /*, $window, $msg*/ ) {
    "use strict";
    return {
      restrict: 'E',
      templateUrl: window.SITE_PATH + 'view/templates/signindialog.html',
      link: function($scope /*, element, attrs*/ ) {
        $scope.$site = $site;

        $scope.pin = '';
        $scope.press = function(num) {
          $scope.pin += num;
          if ($scope.pin.length === 4) {
            // attempt sign in
            $site.user.PIN = $scope.pin;
            $scope.pin = '';
            $site.signInDialogOnClick();
          }
        };
      },
    };
  }
]);

app.directive("footer", ['Site',
  function( /*$site*/ ) {
    "use strict";
    return {
      restrict: 'E',
      templateUrl: window.SITE_PATH + 'view/templates/footer.html',
    };
  }
]);


/*** Google Analytics ***/
/*(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-53740805-1', 'auto');
ga('send', 'pageview');
*/

// Standardized options for wait indicators
var stdWaitIndicatorOpts = {
  color: "#62259d",
  type: WaitIndicators.Circles,
  petals: 5,
  sizeDecay: 0.75,
  alphaDecay: 1,
  pulseInterval: 150,
  display: true
};
stdWaitIndicatorOpts = stdWaitIndicatorOpts;
