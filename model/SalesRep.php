<?php
class SalesRep {
	
	public static function get_sales_reps($officeId) {
		if (!$_SESSION['userid'])
			throw new Exception("Session timed out.", 40);
		$officeId = intval($officeId);

		$reps = array();

		// build the query
		$sql = "SELECT u.id, GPID, firstName, lastName, officeId, email 
			FROM salesReps AS sr
			INNER JOIN users AS u ON sr.userId=u.id
			where sr.status='A' ";
			if (!empty($officeId) && $officeId != 0)
				$sql .= " AND officeId='$officeId' ";
			$sql .= " ORDER BY firstName, lastName ";


		$result = db_query($sql);
		while ($row = db_fetch_assoc($result)) {
			$reps[] = $row;
		}
		return $reps;
	}

}