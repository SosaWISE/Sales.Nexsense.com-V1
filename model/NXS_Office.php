<?php
class NXS_Office {
	

	public static function get_offices() {

		$data = array();
		$sql = "SELECT DISTINCT RU_TeamLocations.TeamLocationID
			, RU_TeamLocations.Description AS TeamLocation
			FROM WISE_HumanResource.dbo.RU_Teams WITH(NOLOCK)
			-- RU_TeamLocations
			JOIN WISE_HumanResource.dbo.RU_TeamLocations WITH(NOLOCK) ON RU_Teams.TeamLocationId = RU_TeamLocations.TeamLocationID
            ORDER BY TeamLocation
			";
		$result = ms_query($sql);
		if ($result) {
			while ($row = ms_fetch_assoc($result))
				$data[] = $row;
		}

		return $data;
	}


}