<?php
define('SITE_PATH', '');
define('DOMAIN', 'sales.nexsense.com');
define('SECURE_URL', 'https://sales.nexsense.com');
define('BASE_URL', '//sales.nexsense.com');
define('AJAX_URL', '//sales.nexsense.com');
define('IMG_PATH', 'view/images');
define('DB_CONNECT_FILE', '/var/www/sales.nexsense.db.config');
define('MSDB_CONNECT_FILE', '/var/www/sales.nexsense.msdb.config');

function __autoload($class_name) {
   include 'model/' . $class_name . '.php';
}
