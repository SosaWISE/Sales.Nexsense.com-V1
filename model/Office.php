<?php
class Office {
	
	public static function get_offices() {
		User::require_authentication();

		$offices = array();
		$sql = "SELECT id, officeCity, officeState, address FROM salesOffices where status='A'
			ORDER BY officeCity, officeState";
		$result = db_query($sql);
		while ($row = db_fetch_assoc($result)) {
			$offices[] = $row;
		}
		return $offices;
	}

}