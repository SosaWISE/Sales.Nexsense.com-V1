<?php
	ini_set('session.gc_maxlifetime', 5*60);
	session_set_cookie_params(5*60);
	session_start();
	error_reporting(0);
	date_default_timezone_set('UTC');

	require('global_vars.php');
	require('controller/ngController.php');

	require('lib/db.inc');

	$mode = 'page';
	$page_str = '';
	
	if (!isset($_REQUEST['page']) && !isset($_REQUEST['class'])) {
		$mode = 'page';
		$page_str = '404';
	}
	elseif (isset($_REQUEST['page'])) {
		$mode = 'page';
		$page_str = $_REQUEST['page'];
	}
	elseif (isset($_REQUEST['class'])) {
		$mode = 'action';
		$class = $_REQUEST['class'];
		$method = $_REQUEST['method'];
	}
	
	if ($mode == 'page') {
		$page_str = preg_replace('/[^a-z0-9_\-]/i', '', $page_str);

		if ($page_str == '')
			$page_str = 'signin';

		$_page_title = preg_replace('/[_\-]/', ' ', $page_str);
		
		if (!ngController::page_exists($page_str)) {
			$page_str = '404';
			$_page_title = 'File not found';
		}

		// Everything on this site requires a sign in except the sign-in page
		//if ($page_str != 'signin')
		//	ngController::require_sign_in();

		//$_js_includes_arr = ngController::get_js_includes($page_str);
		//$_css_includes_arr = ngController::get_css_includes($page_str);

		//$_with_nav = true;
		
		//ngController::output_header($page_str);

		ngController::output_page($page_str);

		//ngController::output_footer($page_str);
	}
	else if ($mode == 'action') {
		header('Content-Type: text/json');
		$response = array('success'=>0, 'message'=>'Invalid method attempted.');
		if (class_exists($class)) {
			if (method_exists($class, $method)) {
				
				// read raw data from std in
				$json = file_get_contents('php://input');
				$data = json_decode($json);

				$reflector = new ReflectionClass($class);
				$req_parameters = $reflector->getMethod($method)->getParameters();
				
				$supplied_parameters = array();
				$i = 0;
				foreach ($req_parameters as $param) {
					$supplied_parameters[$i] = null;
					if (isset($data->{$param->name}))
						$supplied_parameters[$i] = $data->{$param->name};
					else if (isset($_REQUEST[$param->name]))
						$supplied_parameters[$i] = $_REQUEST[$param->name];
					$i++;
				}
				try {
					$response['results'] = call_user_func_array("$class::$method", $supplied_parameters);
					$response['success'] = 1;
					$response['message'] = 'OK';
				} catch (Exception $ex) {
					$response['success'] = 0;
					$response['message'] = $ex->getMessage();
					if ($ex->getCode() == 40)
						$response['require_signin'] = true;
				}
			}
		}
		echo json_encode($response);
	}

	require('lib/db_close.inc');
?>

