<?php
// this is my change
class NXS_Report {
	/***
	* This method gets all credits and installations for a given date range and optional office
	***/
	public static function get_credits_and_installs($startTimestamp, $endTimestamp, $officeId = null) {
		//if (!$_SESSION['userid'])
		//	throw new Exception("Session timed out.", 40);

		//$do_rollup = false;
		if ($withRollup === 'true')
			$withRollup = true;
		else
			$withRollup = false;

		if ($officeId)
		  $officeId = intval($officeId);

		$startTimestamp = date('Y-m-d', strtotime($startTimestamp));
		$endTimestamp = date('Y-m-d 23:59:59', strtotime($endTimestamp));

		$data = array();
		//$sql = "SELECT TOP 10 * FROM AE_Customers";

		$sql = "
			DECLARE @begindate DATE
			DECLARE @enddate DATE

			SET @begindate = '$startTimestamp'
			SET @enddate = '$endTimestamp'

			SELECT
			RU_TeamLocations.TeamLocationID
			, RU_Teams.Description as TeamName
			, RU_TeamLocations.Description AS TeamLocation
			, RU_Users.GPEmployeeId AS SalesRepID
			, RU_Users.FullName as SalesRepName
			, CASE
				WHEN RU_Users.IsActive = 'TRUE' THEN 'Active'
				ELSE 'Inactive'
			END AS Active
			,ISNULL(Credits_qry.NumCredits,0) AS NumCredits
			,ISNULL(Installs_qry.NumInstalls,0) AS NumInstalls
			FROM
			-- RU_Users
			WISE_HumanResource.dbo.RU_Users WITH(NOLOCK)

			-- RU_Recruits
			JOIN WISE_HumanResource.dbo.RU_Recruits WITH(NOLOCK)
			ON
				RU_Users.UserID = RU_Recruits.UserId
				AND RU_Recruits.IsDeleted = 'FALSE'

			-- RU_Teams
			JOIN WISE_HumanResource.dbo.RU_Teams WITH(NOLOCK)
			ON
				RU_Recruits.TeamId = RU_Teams.TeamID

			-- RU_TeamLocations
			JOIN WISE_HumanResource.dbo.RU_TeamLocations WITH(NOLOCK)
			ON
				RU_Teams.TeamLocationId = RU_TeamLocations.TeamLocationID
			";


		if ($officeId)
		  $sql .= " AND RU_TeamLocations.TeamLocationID=$officeId ";
				   

		$sql .= "
			/**********************
			***  INSTALLATIONS  ***
			***********************/
			LEFT JOIN
			(
				SELECT
					MS_AccountSalesInformations.SalesRepId as SalesRepID
					,COUNT(*) AS NumInstalls
				FROM
					-- vwMS_AccountSalesInformations view
					dbo.MS_AccountSalesInformations
					JOIN MS_Accounts
						ON MS_AccountSalesInformations.AccountID = MS_ACCOUNTS.AccountID
						AND MS_Accounts.IsDeleted = 'FALSE'
				WHERE
				--MS_AccountSalesInformations.IsDeleted = 'FALSE'
				--AND
					(CONVERT(DATE,MS_AccountSalesInformations.InstallDate) BETWEEN @begindate AND @enddate)
				GROUP BY MS_AccountSalesInformations.SalesRepId
			) AS Installs_qry
			ON
			RU_Users.GPEmployeeId = Installs_qry.SalesRepId

			/********************
			***  CREDITS RUN  ***
			*********************/
			LEFT JOIN
			(
				SELECT
				QL_Leads.SalesRepId as SalesRepID
				, COUNT(DISTINCT QL_CreditReports.LeadId) AS NumCredits
				FROM
				-- QL_CreditReports
				WISE_CRM.dbo.QL_CreditReports WITH(NOLOCK)

				-- QL_Leads
				JOIN WISE_CRM.dbo.QL_Leads WITH(NOLOCK)
					ON QL_CreditReports.LeadId = QL_Leads.LeadID
					AND QL_Leads.IsDeleted = 'FALSE'

				-- Max CreatedOn date for each LeadId
				JOIN
				(
				SELECT
					LeadId
					,MIN(CreatedOn) AS MinCreatedOn
				FROM
					dbo.QL_CreditReports
				WHERE
					IsDeleted = 'FALSE'
				GROUP BY
					LeadId
			) AS MaxDate_qry
			ON
				QL_CreditReports.LeadID = MaxDate_qry.LeadID
				AND QL_CreditReports.CreatedOn = MaxDate_qry.MinCreatedOn
			WHERE
				QL_CreditReports.CreatedOn BETWEEN @begindate AND @enddate
				AND QL_CreditReports.IsDeleted = 'FALSE'
			GROUP BY
				QL_Leads.SalesRepId
			) AS Credits_qry
			ON
				RU_Users.GPEmployeeId = Credits_qry.SalesRepId
			WHERE
				RU_Users.UserEmployeeTypeId = 'SALESREP'
				AND RU_Users.IsDeleted = 'FALSE'
				AND
				(RU_Users.IsActive = 'TRUE' OR (Installs_qry.NumInstalls > 0 OR Credits_qry.NumCredits > 0))
			ORDER BY
			RU_Teams.Description,
			RU_TeamLocations.Description
			,RU_Users.FullName
			";

		$result = ms_query($sql);
		if ($result) {
			while ($row = ms_fetch_assoc($result))
				$data[] = $row;
		}

		return $data;

	}


}
