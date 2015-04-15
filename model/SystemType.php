<?php
class SystemType {
	
	public static function get_system_types() {
		if (!$_SESSION['userid'])
			throw new Exception("Session timed out.", 40);

		$officeid = 1;
		if ($_SESSION['officeid'])
			$officeid = $_SESSION['officeid'];

		$system_types = array();
		$sql = "SELECT id, companyName, filename
			FROM systemTypes
			WHERE (officeId=0 OR officeId='$officeid')
			ORDER BY sequence, companyName";
		$result = db_query($sql);
		while ($row = db_fetch_assoc($result)) {
			$system_types[] = $row;
		}

		return $system_types;
	}

}