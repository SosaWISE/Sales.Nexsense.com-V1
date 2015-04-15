<?php
class SalesArea {
	

	/***
	* This method saves a sales area to the database
	***/
	public static function save_area($areaId, $areaName, $officeId, $salesRepId, $areaData, $startTimestamp) {
		if (!$_SESSION['userid'])
			throw new Exception("Session timed out.", 40);

		$areaId = intval($areaId);

		$areaName = db_null_or_string($areaName);
		$officeId = intval($officeId);
		$salesRepId = intval($salesRepId);

		$minlat = undefined;
		$maxlat = undefined;
		$minlng = undefined;
		$maxlng = undefined;
		if (is_array($areaData) && !empty($areaData)) {
			foreach ($areaData as $path) {
				foreach ($path as $point) {
					if ($minlat == undefined || $point->lat < $minlat)
						$minlat = $point->lat;
					if ($maxlat == undefined || $point->lat > $maxlat)
						$maxlat = $point->lat;
					if ($minlng == undefined || $point->lng < $minlng)
						$minlng = $point->lng;
					if ($maxlng == undefined || $point->lng > $maxlng)
						$maxlng = $point->lng;
				}
			}
		}
		$areaDataJSON = json_encode($areaData);

		if (!$areaId) {
			$sql = "INSERT into salesAreas (areaName, minLatitude, maxLatitude, minLongitude, maxLongitude, pointData)
				VALUES($areaName, $minlat, $maxlat, $minlng, $maxlng, '$areaDataJSON')";
			if(db_query($sql))
				$areaId = db_get_insert_id();
		}
		else {
			$sql = "UPDATE salesAreas
				SET areaName=$areaName,
				minLatitude=$minlat,
				maxLatitude=$maxlat,
				minLongitude=$minlng,
				maxLongitude=$maxlng,
				pointData='$areaDataJSON'
				WHERE id=$areaId";
			db_query($sql);
		}

		if ($areaId) {
			// update assignments
			SalesArea::save_area_assignment($areaId, $officeId, $salesRepId, $startTimestamp);
			return $areaId;
		}
		return false;
	}


	/***
	* This method obviously marks a sales area as deleted
	***/
	public static function delete_sales_area($areaId) {
		if (!$_SESSION['userid'])
			throw new Exception("Session timed out.", 40);
		$areaId = intval($areaId);
		$sql = "UPDATE salesAreas SET status='X' WHERE id='$areaId'";
		return db_query($sql);
	}


	/***
	* This method saves the assigned office or sales rep to the area id in the database
	***/
	public static function save_area_assignment($areaId, $officeId, $salesRepId, $startTimestamp) {
		if (!$_SESSION['userid'])
			throw new Exception("Session timed out.", 40);
		$areaId = intval($areaId);
		if (empty($areaId))
			throw Exception("Must provide an areaId");

		$officeId = intval($officeId);
		if (empty($officeId))
			$officeId = 'NULL';

		$salesRepId = intval($salesRepId);
		if (empty($salesRepId))
			$salesRepId = 'NULL';

		if (empty($startTimestamp))
			$startTimestamp = 'CURRENT_TIMESTAMP';
		else
			$startTimestamp = "'$startTimestamp'";

		// unassign the area in question
		$sql = "UPDATE salesAreaAssignments SET status='X' WHERE salesAreaId=$areaId";
		db_query($sql);

		// assign it to the rep and/or office mentioned
		$sql = "INSERT INTO salesAreaAssignments (salesAreaId, officeId, salesRepId, startTimestamp)
			VALUES($areaId, $officeId, $salesRepId, $startTimestamp)";
		if (db_query($sql))
			return true;
		return false;
	}


	/***
	* This method retrives all the sales areas from the database within a given viewport
	***/
	public static function get_sales_areas($salesRepId = 0, $officeId = 0, $minlat, $maxlat, $minlng, $maxlng) {
		if (!$_SESSION['userid'])
			throw new Exception("Session timed out.", 40);

		if (!is_numeric($minlat) || !is_numeric($maxlat) || !is_numeric($minlng) || !is_numeric($maxlng))
			throw new Exception("Invalid lat, lng values in function get_sales_areas");

		if (!is_numeric($salesRepId) || !is_numeric($officeId))
			throw new Exception("Invalid sales rep id or office id");

		$areas = array();
		$sql = "SELECT sa.id, sa.pointData, sa.minLatitude, sa.maxLatitude, sa.minLongitude, sa.maxLongitude,
			saa.officeId, saa.salesRepId, saa.startTimestamp, saa.endTimestamp, 
			CONCAT(u.firstName, ' ', u.lastName) AS salesRepName 
			FROM salesAreas sa
			LEFT JOIN salesAreaAssignments saa ON sa.id=saa.salesAreaId AND saa.status='A'
			LEFT JOIN users AS u ON saa.salesRepId=u.id
			WHERE sa.maxLatitude > $minlat AND sa.minLatitude < $maxlat AND sa.maxLongitude > $minlng AND sa.minLongitude < $maxlng
			AND sa.status='A'";
			if ($salesRepId != 0)
				$sql .= " AND saa.salesRepId=$salesRepId ";
			if ($officeId != 0)
				$sql .= " AND saa.officeId=$officeId";

		$result = db_query($sql);
		while ($row = db_fetch_assoc($result)) {
			$areas[] = $row;
		}
		return $areas;
	}


}