<?php
class Contact {
	
	/***
	* Saves a new contact
	***/
	public static function save_contact($id, $firstName, $lastName, $address, $city, $state, $zip, $categoryId, $systemId, $notes, $latitude, $longitude, $salesRepLatitude, $salesRepLongitude, $followup, $notes) {
		User::require_authentication();
		
		$contactId = intval($id);
		$salesRepId = $_SESSION['userid'];

		// track where the rep was
		Tracking::track_location($salesRepId, $salesRepLatitude, $salesRepLongitude);

		if (!$contactId) {
			// save the contact
			$sql = "INSERT into salesContacts (latitude, longitude)
				VALUES($latitude, $longitude)
				";
			$result = db_query($sql);
			if ($result)
				$contactId = db_get_insert_id();
		}

		if ($contactId) {
			// save notes if any
			$noteId = Contact::save_note($contactId, $salesRepLatitude, $salesRepLongitude, $firstName, $lastName, $categoryId, $systemId, $notes);

			// save the address if possible
			if ($address || $city || $state || $zip)
				$addressId = Contact::save_address($contactId, $address, null, $city, $state, $zip);

			// save the follow up if possible
			if ($followup)
				$followupId = Contact::save_followup($contactId, $salesRepId, $followup);

			return $contactId;
		}
		return false;
	}


	/***
	* Saves a note to an account
	***/
	public static function save_note($contactId, $salesRepLatitude, $salesRepLongitude, $firstName, $lastName, $categoryId, $systemId, $note) {
		User::require_authentication();

		$note = db_null_or_string($note);
		$salesRepId = $_SESSION['userid'];

		$categoryId = intval($categoryId);
		if (!$categoryId)
			$categoryId = 0;

		$systemId = intval($systemId);
		if (!$systemId)
			$systemId = 0;

		$firstName = db_null_or_string($firstName);
		$lastName = db_null_or_string($lastName);

		if (!$salesRepLatitude)
			$salesRepLatitude = 0;
		if (!$salesRepLongitude)
			$salesRepLongitude = 0;

		$sql = "INSERT INTO salesContactNotes (contactId, salesRepId, salesRepLatitude, salesRepLongitude, firstName, lastName, categoryId, systemId, note)
			VALUES($contactId, $salesRepId, $salesRepLatitude, $salesRepLongitude, $firstName, $lastName, $categoryId, $systemId, $note)";
		if (db_query($sql))
			return db_get_insert_id();
		return false;
	}


	/***
	* Saves an address for the contact
	***/
	public static function save_address($contactId, $address, $address2, $city, $state, $zip) {
		User::require_authentication();

		$contactId = intval($contactId);
		$address = db_null_or_string($address);
		$address2 = db_null_or_string($address2);
		$city = db_null_or_string($city);
		$state = db_null_or_string($state);
		$zip = db_null_or_string($zip);

		$sql = "SELECT id FROM salesContactAddresses WHERE salesContactId='$contactId'";
		$result = db_query($sql);
		if (($row = db_fetch_assoc($result)) !== false)
			return $row['id'];
		else {
			$sql = "INSERT INTO salesContactAddresses (salesContactId, address, city, state, zip)
				VALUES($contactId, $address, $city, $state, $zip)
				";
			$address_result = db_query($sql);
			if ($address_result)
				return db_get_insert_id();
		}

		return false;
	}


	/***
	* Gets an array of all contacts within a given latitude and longitude
	***/
	public static function get_contacts_in_area($salesRepId = 0, $officeId = 0, $minlat, $maxlat, $minlng, $maxlng, $toleranceLat, $toleranceLng) {
		User::require_authentication();

		if ($minlat > $maxlat) {
			$tmp = $minlat;
			$minlat = $maxlat;
			$maxlat = $tmp;
		}
		if ($minlng > $maxlng) {
			$tmp = $minlng;
			$minlng = $maxlng;
			$maxlng = $tmp;
		}

		// validate permissions
		if (!Permission::user_has_permission(array(Permission::BASIC, Permission::OFFICE_STATS, Permission::COMPANY_STATS), $_SESSION['userid'], $salesRepId, $officeId))
			throw new Exception("You ain't got permission");

		$contacts = array();
		$sql = "SELECT c.id, cn.salesRepId, cn.salesRepFirstName, cn.salesRepLastName,
			c.latitude, c.longitude,
			cn.noteTimestamp, cn.firstName, cn.lastName, cn.categoryId, cn.systemId, cn.note,
			ca.address, ca.address2, ca.city, ca.state, ca.zip, 
			REPLACE(CONCAT_WS(' ', ca.address, ca.address2, ca.city, ca.state, ca.zip), '  ', ' ') AS fullAddress
			FROM salesContacts AS c
			INNER JOIN (
			    SELECT cn.*, u.firstName AS salesRepFirstName, u.lastName AS salesRepLastName FROM salesContactNotes AS cn
			    INNER JOIN (SELECT id, MAX(noteTimestamp) AS latest FROM salesContactNotes GROUP BY id) AS u_cn ON cn.id=u_cn.id
			    INNER JOIN salesReps AS sr ON cn.salesRepId=sr.userId ";

				if ($officeId != 0)
					$sql .= " AND sr.officeId=$officeId ";
				if ($salesRepId != 0)
					$sql .= " AND sr.userId=$salesRepId ";

				$sql .= " INNER JOIN users AS u ON cn.salesRepId=u.id
			) AS cn ON c.id=cn.contactId
			LEFT JOIN salesContactAddresses AS ca ON c.id=ca.salesContactId
			WHERE latitude BETWEEN $minlat AND $maxlat
			AND longitude BETWEEN $minlng AND $maxlng";

		$result = db_query($sql);
		while ($row = db_fetch_assoc($result)) {
			$contacts[] = $row;
		}

		// TODO: group contacts according to tolerance
		// iterate through contacts
			// for each contact, iterate through the others and collect all within $tolerance distance
				// remove them from the array
				// change the current contact to a grouped type and increment the number it represents

		return $contacts;
	}


	/***
	* Gets an array of all the contacts a sales rep made in a given time period grouped into a histogram by the hour the contact was made
	***/
	public static function get_contacts_by_hour($salesRepId, $officeId, $startTimestamp, $endTimestamp) {
		User::require_authentication();

		$salesRepId = intval($salesRepId);
		$officeId = intval($officeId);
		$startTimestamp = date('Y-m-d', strtotime($startTimestamp));
		$endTimestamp = date('Y-m-d 23:59:59', strtotime($endTimestamp));

		// validate permissions
		if (!Permission::user_has_permission(array(Permission::OFFICE_STATS, Permission::COMPANY_STATS), null, $salesRepId, $officeId))
			throw new Exception("You ain't got permission");

		$contacts = array();
		$startDate = new DateTime($startTimestamp);
		$endDate = new DateTime($endTimestamp);
		$diff = $startDate->diff($endDate);
		if ($diff->days == 0) {
			$sql = "SELECT YEAR(cn.noteTimestamp) AS yr, MONTH(cn.noteTimestamp) AS mo, DAY(cn.noteTimestamp) AS dy, HOUR(cn.noteTimestamp) AS hr, cn.categoryId, cn.systemId, 
				COUNT(c.id) AS qty
				FROM salesContacts AS c
				INNER JOIN salesContactNotes AS cn ON c.id=cn.contactId
				INNER JOIN salesReps AS sr ON cn.salesRepId=sr.userId
				WHERE cn.noteTimestamp BETWEEN '$startTimestamp' AND '$endTimestamp'
				";
				if ($salesRepId)
					$sql .= " AND c.salesRepId=$salesRepId ";
				else if ($officeId)
					$sql .= " AND sr.officeId=$officeId ";
				$sql .= "GROUP BY yr, mo, dy, hr, categoryId, systemId";
		}
		else if ($diff->days <= 31) {
			$sql = "SELECT YEAR(cn.noteTimestamp) AS yr, MONTH(cn.noteTimestamp) AS mo, DAY(cn.noteTimestamp) AS dy, cn.categoryId, cn.systemId, 
				COUNT(c.id) AS qty
				FROM salesContacts AS c
				INNER JOIN salesContactNotes AS cn ON c.id=cn.contactId
				INNER JOIN salesReps AS sr ON cn.salesRepId=sr.userId
				WHERE cn.noteTimestamp BETWEEN '$startTimestamp' AND '$endTimestamp'
				";
				if ($salesRepId)
					$sql .= " AND c.salesRepId=$salesRepId ";
				else if ($officeId)
					$sql .= " AND sr.officeId=$officeId ";
				$sql .= " GROUP BY yr, mo, dy, categoryId, systemId";
		}
		else {
			$sql = "SELECT YEAR(cn.noteTimestamp) AS yr, MONTH(cn.noteTimestamp) AS mo, cn.categoryId, cn.systemId, 
				COUNT(c.id) AS qty
				FROM salesContacts AS c
				INNER JOIN salesContactNotes AS cn ON c.id=cn.contactId
				INNER JOIN salesReps AS sr ON cn.salesRepId=sr.userId
				WHERE cn.noteTimestamp BETWEEN '$startTimestamp' AND '$endTimestamp'
				";
				if ($salesRepId)
					$sql .= " AND c.salesRepId=$salesRepId ";
				else if ($officeId)
					$sql .= " AND sr.officeId=$officeId ";
				$sql .= " GROUP BY yr, mo, categoryId, systemId";
		}
		$result = db_query($sql);
		while ($row = db_fetch_assoc($result)) {
			$contacts[] = $row;
		}
		return $contacts;
	}


	/***
	* Gets an array including all contact types allowed
	***/
	public static function get_categories() {
		User::require_authentication();

		$userid = $_SESSION['userid'];

		$categories = array();
		$sql = "SELECT id, name, filename 
			FROM salesContactCategories
			WHERE (userId=0 OR userId='$userid')
			AND status='A'
			AND id NOT IN (
				SELECT categoryId FROM salesContactCategoriesBlacklist
				WHERE userId='$userid'
			)
			ORDER BY sequence, name";
		$result = db_query($sql);
		while ($row = db_fetch_assoc($result)) {
			$categories[] = $row;
		}

		return $categories;
	}


	/***
	* Saves a follow up appointment for a contact
	***/
	public static function save_followup($contactId, $salesRepId, $followupTimestamp) {
		User::require_authentication();

		$contactId = intval($contactId);
		$salesRepId = intval($salesRepId);
		$followupTimestamp = db_escape($followupTimestamp);

		$sql = "INSERT into salesContactFollowups (contactId, salesRepId, followupTimestamp)
			VALUES($contactId, $salesRepId, '$followupTimestamp')";

		$result = db_query($sql);
		if ($result)
			return $db_get_insert_id();

		return false;
	}


	/***
	* This method gets all the available icons for contacts
	***/
	public static function get_category_icons() {
		User::require_authentication();

		$images = array();

		$dh = opendir(IMG_PATH . '/map/markers/categories');
		while (($file = readdir($dh)) !== FALSE) {
			if (substr($file, 0, 1) != '.') {
				$path_parts = pathinfo(IMG_PATH . '/map/markers/categories/' . $file);
				if ($path_parts['extension'] == 'png')
					$images[] = $file;
			}
		}
		closedir($dh);

		sort($images);

		return $images;
	}



	/***
	* This method saves a new category for the current user
	***/
	public static function save_category($id, $name, $filename) {
		User::require_authentication();

		$userid = $_SESSION['userid'];
		$id = intval($id);

		$_name = db_escape($name);
		// check if the image exists
		$filename = preg_replace("/[^a-z0-9\.\-_]/i", '', $filename);
		if (!file_exists(IMG_PATH . '/map/markers/categories/' . $filename))
			throw Exception("Bad filename used for new category marker: $filename");

		if ($id) {
			$sql = "UPDATE salesContactCategories SET userId=$userid, name='$_name', filename='$filename'
				WHERE id=$id";
			if (db_query($sql))
				return array('id'=>$id, 'name'=>$name, 'filename'=>$filename);
		}
		else {
			$sql = "INSERT INTO salesContactCategories (userId, name, filename)
				VALUES($userid, '$_name', '$filename')";
			if (db_query($sql)) {
				$id = db_get_insert_id();
				return array('id'=>$id, 'name'=>$name, 'filename'=>$filename);
			}
		}
		return false;
	}


	/***
	* This method marks a category as deleted for the current user
	***/
	public static function delete_category($id) {
		User::require_authentication();

		$userid = $_SESSION['userid'];
		$id = intval($id);

		$sql = "SELECT userId FROM salesContactCategories
			WHERE id=$id";
		$result = db_query($sql);
		$row = db_fetch_assoc($result);
		if ($row) {
			if ($row['userId'] == 0) {
				// this generic category can't be deleted because it's used by all users.  Instead, we can add it to this user's blacklist
				$sql = "INSERT INTO salesContactCategoriesBlacklist
					(categoryId, userId) VALUES($id, $userid)";
				db_query($sql);
			}
			else if ($row['userId'] == $userid) {
				$sql = "UPDATE salesContactCategories SET status='X'
					WHERE id=$id AND userId=$userid";
				db_query($sql);
			}
			else
				throw new Exception("You don't have permission to delete that category, troll");
		}
		else
			throw new Exception("Invalid category identifier");

		return true;
	}

}







