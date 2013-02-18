<?php

/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * Controller - Routes the request toward the correct function
 * Performs important security checks. Beyond this point no security is enforced.
 * Check in the global $pages variable if the user has the right to do the action.
 *    If the action is "pwdfree", then the action is performed.
 *    Otherwise the user has to be logged in. 
 *       If it is not logged in, it will be redirected to the login screen.
 *    To prevent hacking via a clicking on a malicious URL, we also check that a 'random_sid'
 *    has been passed for all actions that modify the system (basically everything except 'main'
 *    actions).
 */

class Controller {
   static private $logged_in = false;
   static private $sid_match = false;
   static private $sid = 'nosid';

   static public function getParameter($name, $default_value = '') {
      global $picpath;

      $ret_val = $default_value;
      if(isset($_GET[$name]))
         $ret_val = $_GET[$name];
      if(isset($_POST[$name]))
         $ret_val = $_POST[$name];

      if (get_magic_quotes_gpc()) 
         $ret_val = stripslashes_deep($ret_val);
      

      switch($name) {
      case 'dir':
         if($ret_val == '/' || $ret_val == '')
            $ret_val = $picpath.'/';
         if(!is_dir($ret_val)) {
            $ret_val = utf8_decode($ret_val);
            is_dir($ret_val) or die("$ret_val is not a valid directory");
         }
         $ret_val = File::simplifyPath($ret_val);
         break;
      case 'updated':
         if($ret_val === $default_value)
            return $default_value;
         $home_dir = Controller::getParameter('dir').'/';
         if(!is_dir($home_dir.$ret_val)) {
            $ret_val = utf8_decode($ret_val);
            is_dir($home_dir.$ret_val) or die("$ret_val is not a valid directory");
         }
         $ret_val = File::simplifyPath($ret_val);
         if(strpos($ret_val, '/') !== FALSE)
            die("$ret_val is not a valid directory");
         break;
      case 'img':
         if(strpos('/', $ret_val) !== FALSE)
            die("$ret_val is not a valid image");
         break;
      case 'limit':
         if(!is_numeric($ret_val))
            die("Invalid value '$ret_val' for parameter limit");
         break;
      }

      return $ret_val;
   }

   static public function route($route=null) {
      global $pages, $adm_pwd;

      session_start();
      if(isset($_SESSION['logged_in']))
         Controller::$logged_in = true;
      if(isset($_SESSION['random_sid']) && Controller::getParameter('random_sid') == $_SESSION['random_sid']) {
         Controller::$sid_match = true;
         Controller::$sid = $_SESSION['random_sid'];
      }

      $pages['login'] = array('descr' => 'Login', 'pwdfree' => array('login', 'validate', 'logout'));
      $pages['index']['pwdfree'] = array('get_file');

      if($route == null)
         $route = Controller::getParameter('action', 'index.main');
      if(!is_string($route)) 
         die("action not a string");

      $action = explode ('.', $route);
      if(!isset($pages[$action[0]]))
         die('Unauthorized');
      if(!isset($action[1]))
         $action[1] = 'main';

      if($adm_pwd!='' && (!isset($pages[$action[0]]['pwdfree']) || !in_array($action[1], $pages[$action[0]]['pwdfree']))) {
         if(!Controller::$logged_in) {
            if($action[1] !== "main" && $route !== "options.change" && $route !== "options.changed") {
               throw new Exception("Your session has expired, please reload the page");
            } else {
               require_once('pages/login/index.php');
               Pages_Login_Index::loginAction();
               return;
            }
         }
         if($action[1] !== "main" && !Controller::$sid_match)
            throw new Exception("Tried to perform AJAX request without providing the random SID");
         if($action[1] === "main" 
            && !Controller::$sid_match 
            && (!isset($_SESSION['random_sid']) || !is_numeric($_SESSION['random_sid']))) {
            $_SESSION['random_sid'] = rand();
         }
      }
      // Special case for options.main. When we change the options and are pwdfree, that means we just successfully finished
      // an install. Consider that the user is logged in that case.
      // (Otherwise the user might be prompted with a "please log in screen" after leaving the install, which is wierd.
      if($action[0] === "options"
         && $action[1] === "main"
         && (isset($pages[$action[0]]['pwdfree']) && in_array($action[1], $pages[$action[0]]['pwdfree']))) {
            if(!isset($_SESSION['random_sid']) || !is_numeric($_SESSION['random_sid']))
               $_SESSION['random_sid'] = rand();
            $_SESSION['logged_in'] = true;
      }

      if($action[0] != 'login')
         session_write_close(); // VERY IMPORTANT so that multiple request can be done in parallel! See http://www.php.net/manual/en/function.session-start.php#101452

      if(!file_exists('pages/'.$action[0].'/index.php'))
         die('Page does not exist');
      require_once('pages/'.$action[0].'/index.php');

      $autoload_function = "Pages_$action[0]_Index::setupAutoload";
      if(is_callable($autoload_function))
         call_user_func($autoload_function);

      $action[1] = preg_replace('/_([a-z])/e', 'strtoupper("$1")', $action[1]);
      $action_to_call = "Pages_$action[0]_Index::$action[1]Action";
      if(!is_callable($action_to_call))
         die('Action does not exist');
      call_user_func($action_to_call);
   }

   public static function redirect($route) {
      header('Location: index.php?action='.$route.'&random_sid='.Controller::$sid);
   }

   public static $notifications = array();
   public static function notifyUser($level, $msg, $arg) {
      Controller::$notifications[] = array(
         'level' => $level,
         'msg' => $msg,
         'arg' => $arg,
      );
   }
};

function stripslashes_deep($value) {
   $value = is_array($value) ?
      array_map('stripslashes_deep', $value) :
      stripslashes($value);
   return $value;
}


