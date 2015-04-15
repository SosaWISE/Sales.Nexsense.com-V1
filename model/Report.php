<?php
class Report {
	

	/***
	* This method gets all credits and installations for a given date range and optional office
	***/
	public static function get_credits_and_installs($startTimestamp, $endTimestamp, $officeId = null) {
		if (!$_SESSION['userid'])
			throw new Exception("Session timed out.", 40);

		if ($officeId) {

		}

		$data = array();
		$sql = "SELECT TOP 10 * FROM AE_Customers";

		$result = ms_query($sql);
		if ($result) {
			while ($row = ms_fetch_assoc($result))
				$data[] = $row;
		}

		return $data;
	}


}