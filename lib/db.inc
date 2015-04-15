<?php
	
	try {
		$connect = array();
		$str = file_get_contents(DB_CONNECT_FILE);
		$lines = explode("\n", $str);
		foreach ($lines as $line) {
			$line = trim($line);
			$pos = strpos($line, ':');
			$field = substr($line, 0, $pos);
			$value = substr($line, $pos+1);
			$connect[$field] = $value;
		}
		$mysqli = new mysqli($connect['server'], $connect['username'], $connect['password'], $connect['database']);
	} catch (Exception $ex) {
		echo $ex->getMessage();
		exit();
	}
		
	function db_query($sql) {
		global $mysqli;
		$success = $mysqli->query($sql);
		if (!$success) {
			$backtrace = debug_backtrace();
			if (!empty($backtrace) && count($backtrace) > 1) {
				$class = $backtrace[1]['class'];
				$method = $backtrace[1]['function'];
				$debugstr = $class . '::' . $method;
			}
			throw new Exception("Invalid SQL query ($debugstr): $sql");
		}
		return $success;
	}
	
	function db_fetch_assoc($result) {
		if ($result === FALSE)
			return FALSE;
		return $result->fetch_assoc();
	}
	
	function db_get_insert_id() {
		global $mysqli;
		return $mysqli->insert_id;
	}
	
	function db_free($result) {
		$result->free();
	}
	
	function db_escape($str) {
		global $mysqli;
		return $mysqli->real_escape_string($str);
	}

	function db_get_last_error() {
		global $mysqli;
		return $mysqli->error;
	}

	function db_null_or_string($str) {
		if (!$str || $str == '')
			return 'NULL';
		else
			return "'" . db_escape($str) . "'";
	}




//phpinfo();
//exit();

	try {
		$connect = array();
		$str = file_get_contents(MSDB_CONNECT_FILE);
		$lines = explode("\n", $str);
		foreach ($lines as $line) {
			$line = trim($line);
			$pos = strpos($line, ':');
			$field = substr($line, 0, $pos);
			$value = substr($line, $pos+1);
			$connect[$field] = $value;
		}
		$mssql = mssql_connect($connect['server'], $connect['username'], $connect['password']);
		mssql_select_db($connect['database'], $mssql);
	} catch (Exception $ex) {
		echo $ex->getMessage();
		exit();
	}
		
	function ms_query($sql) {
		global $mssql;
		$success = mssql_query($sql, $mssql);
		if (!$success) {
			$backtrace = debug_backtrace();
			if (!empty($backtrace) && count($backtrace) > 1) {
				$class = $backtrace[1]['class'];
				$method = $backtrace[1]['function'];
				$debugstr = $class . '::' . $method;
			}
			throw new Exception("Invalid MSSQL query ($debugstr)");
		}
		return $success;
	}
	
	function ms_fetch_assoc($result) {
		if ($result === FALSE)
			return FALSE;
		return mssql_fetch_assoc($result);
	}
	
	function ms_get_insert_id() {
		global $mssql;
		$sql = "SELECT @@IDENTITY AS ins_id";
		$result = ms_query($sql, $mssql);
		if ($result) {
			$row = ms_fetch_assoc($result);
			if ($row) {
				return $row['ins_id'];
			}
		}
		return null;
	}
	
	function ms_escape($str) {
		return str_replace("'", "''", $str);
	}

	function ms_get_last_error() {
		return mssql_get_last_message();
	}

	function ms_null_or_string($str) {
		if (!$str || $str == '')
			return 'NULL';
		else
			return "'" . ms_escape($str) . "'";
	}
?>
