<?php

class Permission {
	
	const COMPANY = 100;
	const OFFICE = 75;
	const SALES_REP = 50;
	const USER = 1;

	const DEV = 99;
	const OFFICE_STATS = 1;
	const COMPANY_STATS = 2;
	const OFFICE_AREAS = 3;
	const COMPANY_AREAS = 4;
	const BASIC = 0;

	public static $permissions = array(
		Permission::BASIC=>array(
			'name'=>'BASIC',
			'description'=>"This is generic permission to use the site and view information about oneself",
			'level'=>Permission::USER
		),
		Permission::DEV=>array(
			'name'=>'DEV',
			'description'=>'Developer access',
			'level'=>Permission::COMPANY
		),
		Permission::OFFICE_STATS=>array(
			'name'=>'OFFICE_STATS',
			'description'=>"View statistics for the user's office",
			'level'=>Permission::OFFICE
		),
		Permission::COMPANY_STATS=>array(
			'name'=>'COMPANY_STATS',
			'description'=>"View statistics for the entire company",
			'level'=>Permission::COMPANY
		),
		Permission::OFFICE_AREAS=>array(
			'name'=>'OFFICE_AREAS',
			'description'=>"View/edit areas for the user's office",
			'level'=>Permission::OFFICE
		),
		Permission::COMPANY_AREAS=>array(
			'name'=>'COMPANY_AREAS',
			'description'=>"View/edit areas for the entire company",
			'level'=>Permission::COMPANY
		)
	);


	public static function user_has_permission($valid_perms = array(), $userId, $salesRepId, $officeId) {
		$valid_perms[] = Permission::DEV;

		if (empty($_SESSION) || empty($_SESSION['permissions']))
			return false;

		foreach($valid_perms as $vp) {
			$req_perm = Permission::$permissions[$vp];

			if (empty($req_perm))
				return false;

			foreach($_SESSION['permissions'] as $sess_perm) {
				if ($sess_perm['permission'] == $req_perm['name']) {
					$level = $req_perm['level'];
					if ($level == Permission::COMPANY)
						return true;
					if ($level == Permission::OFFICE && $_SESSION['officeid'] == $officeId)
						return true;
					if ($level == Permission::SALES_REP && $_SESSION['userid'] == $salesRepId)
						return true;
					if ($level == Permission::USER && $_SESSION['userid'] == $userId)
						return true;
				}
			}
		}
		return false;
	}

}