<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * Entry point
 */

error_reporting(E_ALL ^ E_STRICT);
ini_set('display_errors', '1');
ini_set('session.use_trans_sid', 0);
ini_set('session.use_only_cookies', 1);


$VERSION = '131109';

/* 1/ Set up autoloading */
class AutoLoader {
   public static $autoload_path = array("./common/php/");
   public static function loadClass($class) {
      $file = str_replace('_', '/', strtolower($class)) . '.php';

      if(strpos($class, '.') !== false)
         die("Forbidden class name $class");

      foreach (AutoLoader::$autoload_path as $path) {
         if (file_exists($path.$file) && is_readable($path.$file)) {
            include_once $path.$file;
            return;
         }
      }
   }
};
spl_autoload_register('AutoLoader::loadClass');




/* 2/ Set custom error handler */
function myErrorHandler($errno, $errstr, $errfile, $errline) {
   if (!(error_reporting() & $errno)) 
      return;
   if($errno == 2048)
      return;
   $route = 'index.main';
   if(isset($_POST) && isset($_POST['action']))
      $route = $_POST['action'];
   if(isset($_GET) && isset($_GET['action']))
      $route = $_GET['action'];
   if(!is_string($route)) {
      echo "action not a string";
      exit(1);
   }
   $action = explode ('.', $route);
   if(!isset($action[1]) || substr($action[1], -4) === "main") {
      echo "Error - $errfile line $errline<br>\n";
      echo "[$errno] $errstr<br>\n";
   } else {
      echo json_encode(array(
         'error' => true,
         'file' => $errfile,
         'line' => $errline,
         'error' => $errno,
         'msg' => $errstr,
      ));
   }
   exit(1);
}
set_error_handler("myErrorHandler");
function exception_handler($exception) {
   myErrorHandler(-1, $exception->getMessage(), '', '');
}
set_exception_handler('exception_handler');
function shutdown() {
    $isError = false;

    if ($error = error_get_last()){
    switch($error['type']){
        case E_ERROR:
        case E_CORE_ERROR:
        case E_COMPILE_ERROR:
        case E_USER_ERROR:
            $isError = true;
            break;
        }
    }

    if ($isError){
        myErrorHandler($error['type'], $error['message'], $error['file'], $error['line']);
    }
}
register_shutdown_function('shutdown');


/* 3/ Load config.php file (or create it) and route request */
if(file_exists("config.php")) {
   require_once("config.php");
}

if(isset($plugins))
   $plugins = File_JSON::myjson_decode($plugins);
else
   $plugins = array();

// no config.php file or invalid file, route to the installer 
if(!isset($CONFIG_VERSION)) {
   $pages = array(
      'options' => array(
         'descr' => "Installation",
         'pwdfree' => array('main', 'change'),
         'url' => "index.php?action=options",
      )
   );
   Controller::route(Controller::getParameter('action', 'options'));
// config is outdated
} else if($CONFIG_VERSION < $VERSION) {
      $pages = array(
         'options' => array(
            'descr' => "Update",
            'url' => "index.php?action=options.update",
         )
      );
      Controller::route(Controller::getParameter('action', 'options.update'), true);
// everything looks ok, route the request 
} else {
   $pages = File_JSON::myjson_decode($pages);
   Controller::route();
}
 
?>
