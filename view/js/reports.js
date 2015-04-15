app.controller("ReportsPage", ['$scope', '$http', 'Site', 'Messaging', function($scope, $http, $site, $msg) {
	$scope.$site = $site;


	//$scope.officeId = 0;
	$scope.offices = [];
	function get_offices() {
		$http.get('ng/NXS_Office/get_offices')
		.success(function(data) {
			if (!data.success && data.require_signin) {
				$site.displaySignInDialog(get_offices);
				return;
			}

			if (data && data.results)
				$scope.offices = data.results;
		}).error(function(data) {
			console.log("error retrieving offices");
		});
	}
	get_offices();


	$scope.salesReps = [];
	$scope.officeData = [];

	var today = new Date();
	$scope.startDate = new Date(today.getFullYear(), today.getMonth(), 1);
	$scope.endDate = new Date();
	$scope.groupByOffice = true;

	$scope.get_credits_and_installs = function(officeId) {
		$http.get('ng/NXS_Report/get_credits_and_installs/startTimestamp=' + $scope.startDate.formatTimestamp() + '&endTimestamp=' + $scope.endDate.formatTimestamp() + '&officeId=' + officeId)
		.success(function(data) {
			if (!data.success && data.require_signin) {
				$site.displaySignInDialog($scope.get_credits_and_installs);
				return;
			}
			console.log(data);

			if (data && data.results) {
				// create the array of all data
				$scope.salesReps = data.results;

				// create the roll-ups
				$scope.officeData = [];
				for (var i=0; i<data.results.length; i++) {
					var is_found = false;

					// check if this office is already in the rollup array
					for (var j=0; j<$scope.officeData.length; j++) {
						// if so, sum the values
						if ($scope.officeData[j]['TeamLocationID'] == data.results[i]['TeamLocationID']) {
							$scope.officeData[j]['NumCredits'] += data.results[i]['NumCredits'];
							$scope.officeData[j]['NumInstalls'] += data.results[i]['NumInstalls'];
							if (!$scope.officeData[j].salesReps)
								$scope.officeData[j].salesReps = [];
							$scope.officeData[j].salesReps.push(data.results[i]);
							$scope.officeData[j].expanded = false;
							is_found = true;
						}
					}

					// if not, push it onto the array
					if (!is_found) {
						$scope.officeData.push({
							TeamLocationID:data.results[i]['TeamLocationID'],
							TeamLocation:data.results[i]['TeamLocation'],
							NumCredits:data.results[i]['NumCredits'],
							NumInstalls:data.results[i]['NumInstalls'],
							expanded:false,
							salesReps:[ data.results[i] ]
						});
					}
				}
			}
		}).error(function(data) {
			$msg.displayMessage("There was an error loading the report data.", true);
		});
	}
	$scope.get_credits_and_installs(0);

	$scope.toggleRollup = function(officeId) {
		console.log('toggleRollup');
		for (var i=0; i<$scope.officeData.length; i++) {
			if ($scope.officeData[i].TeamLocationID == officeId) {
				if ($scope.officeData[i].expanded) {
					$scope.officeData[i].expanded = false;
				}
				else {
					$scope.officeData[i].expanded = true;
				}
			}
		}
	}

}]);