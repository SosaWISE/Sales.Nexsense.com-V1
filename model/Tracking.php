<?php
class Tracking {
	

	public static function track_location($salesRepId, $latitude, $longitude) {
		if (!$_SESSION['userid'])
			throw new Exception("Session timed out.", 40);
		
		if (!$latitude || !$longitude)
			return false;

		if (!is_numeric($latitude) || !is_numeric($longitude))
			return false;

		// if ($salesRepId != $_SESSION['userid'])
		// 	throw new Exception('Invalid user');
		$sql = "INSERT into salesTracking (salesRepId, latitude, longitude)
			VALUES($salesRepId, $latitude, $longitude)";
		db_query($sql);

		return true;
	}



}