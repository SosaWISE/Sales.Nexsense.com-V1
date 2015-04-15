<?php
class ngController {

	public static function page_exists($page_str) {
		if (file_exists(SITE_PATH . '/view/pages/' . $page_str . '.html'))
			return true;
		return false;
	}
	public static function get_js_includes($page_str) {
		$js_includes_arr = array('common-1.3.0', 'angular/angular.min', 'standard');

		if (file_exists(SITE_PATH . '/view/js/' . $page_str . '.js')):
			$js_includes_arr[] = $page_str;
		endif;
	
		return $js_includes_arr;
	}

	public static function get_css_includes($page_str) {
		$css_includes_arr = array('standard');

		if (file_exists(SITE_PATH . '/view/css/' . $page_str . '.css')):
			$css_includes_arr[] = $page_str;
		endif;

		return $css_includes_arr;
	}

	public static function output_header($page_str) {
		include(SITE_PATH . '/view/templates/header.php');
	}

	public static function output_page($page_str) {
		if (file_exists(SITE_PATH . '/view/pages/' . $page_str . '.html')) {
			include(SITE_PATH . '/view/pages/' . $page_str . '.html');
		}
	}

	public static function output_footer($page_str) {
		include(SITE_PATH . '/view/templates/footer.php');
	}
  
  
	public static function get_page_url($include_querystring) {
		if (!$include_querystring) {
		 $page_name = '';
		 $str = $_SERVER['QUERY_STRING'];
		 $args = split('&', $str);
		 for ($i=0; $i<count($args); $i++) {
			 $parts = split('=', $args[$i]);
			 if (strtolower($parts[0]) == 'page') {
				 $page_name = $parts[1];
				 break;
			 }
		 }
		 return '/?page=' . $page_name;
		}

		return '/?' . $_SERVER['QUERY_STRING'];
	}
  
  
	public static function require_sign_in() {
		$User = User::get_logged_in_user();
		if ($User == null):
			header("location: /signin/redirect=" . urlencode(ngController::get_page_url(true)));
		  exit();
		endif;
	}

}
?>
