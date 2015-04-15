app.controller("SignInPage", ['$scope', '$http', '$window', 'Site', 'Messaging', function($scope, $http, $window, $site, $msg) {
	$scope.$site = $site;


	$scope.$site.signOut();
	

	$scope.newPasswordFormIsDisplayed = false;
	$scope.createPINFormIsDisplayed = false;


	$scope.attemptSignIn = function() {
		$scope.$site.signIn().then(function(data) {
			$msg.displayNotification("You have successfully signed in.");

			if (data && data.results) {
				if (!data.results.hasPIN || data.results.hasPIN == '0') {
					// force the user to reset password and create a PIN
					$scope.newPasswordFormIsDisplayed = true;
				}
				else {
					$scope.$site.navigateTo('map');
				}
			}
			$scope.$apply();
		});
	}


	$scope.newPassword1 = '';
	$scope.newPassword2 = '';
	$scope.isSavingPassword = false;
	$scope.saveNewPassword = function() {
		if ($scope.newPassword1 != $scope.newPassword2) {
			$msg.displayNotification("Your passwords don't match!");
			$scope.newPassword1 = '';
			$scope.newPassword2 = '';
			return;
		}

		$scope.isSavingPassword = true;
		$http.post('ng/User/save_password', {
			userId: $site.user.userId,
			password1: $scope.newPassword1,
			password2: $scope.newPassword2,
		}).success(function(data) {
			$scope.isSavingPassword = false;

			if (data.results) {
				$msg.displayNotification("Your password was successfully reset.");
				$scope.newPasswordFormIsDisplayed = false;
				$scope.createPINFormIsDisplayed = true;
			}
			else {
				$msg.displayNotification("There was a mysterious problem saving your password.  This spells danger.  You'd better run for the hills.");
				$scope.newPassword1 = '';
				$scope.newPassword2 = '';
			}
		}).error(function(data) {
			$scope.isSavingPassword = false;
			$msg.displayMessage("There was an unknown error while trying to save your password.  Try again or quit and give up.", true);
		});
	}

    $scope.newPIN1 = '';
    $scope.newPIN2 = '';
    $scope.pin = '';
	$scope.isSavingPIN = false;
    $scope.press = function(val) {
        $scope.pin += String(val);
        if ($scope.pin.length == 4) {
        	if ($scope.newPIN1 == '') {
        		$scope.newPIN1 = $scope.pin;
	        	$scope.pin = '';
	        }
        	else {
        		$scope.newPIN2 = $scope.pin;

        		if ($scope.newPIN1 != $scope.newPIN2) {
		            $msg.displayNotification("I'm sorry, the two PINs you provided don't match.");
		            $scope.newPIN1 = '';
		            $scope.newPIN2 = '';
		            $scope.pin = '';
		            return;
        		}

        		// save new pin
				$scope.isSavingPIN = true;
				$http.post('ng/User/save_pin', {
					userId: $site.user.userId,
					pin1: $scope.newPIN1,
					pin2: $scope.newPIN2,
				}).success(function(data) {
					$scope.isSavingPIN = false;

					if (data.results) {
						$scope.createPINFormIsDisplayed = false;
						$msg.displayMessage("Thanks for creating a new password and PIN.  You can now access the app with these new credentials.", false, function() {
							$scope.$site.navigateTo('map');
						});
					}
					else {
			            $msg.displayMessage("I'm sorry, there was a problem saving your new PIN.  Don't give up.  Try again!");
			            $scope.newPIN1 = '';
			            $scope.newPIN2 = '';
			            $scope.pin = '';
					}
				}).error(function(data) {
					$scope.isSavingPIN = false;
					$msg.displayMessage("There was an unknown error while trying to save your PIN.  Try again or quit and give up.", true);
				});
	            // on success, redirect to dashboard
	            // on fail, reset pin and display notification
	            $scope.pin = '';
        	}
        }
    }

    angular.element(window).bind('load', function() {
        console.log('create wait spinner');
        $scope.wait = new WaitIndicatorSpinner(document.getElementById('signin-wait'), 50, 25, stdWaitIndicatorOpts);
    });

}]);