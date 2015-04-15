<?php
class User {
	

	public static function require_authentication() {
		if (!$_SESSION['userid'])
			throw new Exception("Session timed out.", 40);
		return true;
	}

	public static function sign_in($username, $password, $PIN) {
		$username = db_escape($username);

		if (!empty($password)) {
			// try with the password
			$sql = "SELECT users.id, firstName, lastName, email, GPID, sr.officeId,
				CASE WHEN users.PIN IS NOT NULL THEN true ELSE false END AS hasPIN
				FROM users
				LEFT JOIN salesReps AS sr ON users.id=sr.userId
				WHERE email='$username' AND password=MD5('$password')
				AND users.status='A'";
			$result = db_query($sql);
			if ($row = db_fetch_assoc($result)) {
				$row['permissions'] = User::get_permissions($row['id']);
				User::save_session_vars($row);
				return $row;
			}
		}

		if (!empty($PIN)) {
			// try with the PIN
			$sql = "SELECT users.id, firstName, lastName, email, GPID, sr.officeId
				FROM users
				LEFT JOIN salesReps AS sr ON users.id=sr.userId
				WHERE email='$username' AND PIN=MD5('$PIN')
				AND users.status='A'";
			$result = db_query($sql);
			if ($row = db_fetch_assoc($result)) {
				$row['permissions'] = User::get_permissions($row['id']);
				User::save_session_vars($row);
				return $row;
			}
		}

		throw new Exception("Invalid username/password");
	}

	private static function get_permissions($userid) {
		$userid = intval($userid);
		
		// store permission info in the session
		$perms = array();
		$sql = "SELECT permissionId AS permission FROM userPermissions
			WHERE userId=$userid";
		$presult = db_query($sql);
		while ($prow = db_fetch_assoc($presult)) {
			$perms[] = $prow;
		}
		$perms[] = array('permission'=>'BASIC'); // everyone starts with the BASIC permission
		return $perms;
	}

	private static function save_session_vars($row) {
		$_SESSION['userid'] = $row['id'];
		if ($row['officeId'])
			$_SESSION['officeid'] = $row['officeId'];
		$_SESSION['GPID'] = $row['GPID'];
		$_SESSION['email'] = $row['email'];

		if (empty($row['hasPIN']) || $row['hasPIN'] == 'false')
			$row['hasPIN'] = false;
		else
			$row['hasPIN'] = true;

		$_SESSION['permissions'] = $row['permissions'];
	}

	public static function sign_out() {
		$_SESSION['userid'] = null;
		$_SESSION['officeid'] = null;
		session_destroy();
		return true;
	}

	public static function save_password($userId, $password1, $password2) {
		if ($userId != $_SESSION['userid'])
			throw new Exception("You don't gots permission to change someone's password");

		if ($password1 != $password2)
			throw new Exception("Your passwords don't match, goofnut");

		$sql = "UPDATE users SET password=MD5('$password1') WHERE id='$userId'";
		$result = db_query($sql);

		return true;
	}

	public static function save_pin($userId, $pin1, $pin2) {
		if ($userId != $_SESSION['userid'])
			throw new Exception("You don't gots permission to change someone's PIN");

		if ($pin1 != $pin2)
			throw new Exception("Your passwords don't match, pinhead");

		$sql = "UPDATE users SET PIN=MD5('$pin1') WHERE id='$userId'";
		$result = db_query($sql);

		return true;
	}




}