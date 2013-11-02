<?php

class AutoLoader {
   public static $autoload_path = array("../../../common/php/", "./");
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

require_once('../../../config.php');


if(!isset($_GET['dir']) || is_array($_GET['dir']))
   die("Wrong parameters");

$path = File::simplifyPath($picpath.'/'.$_GET['dir']);
if(strpos($path, $picpath) !== 0)
   die("Wrong directory");
if($path[0] !== '/')
   $path = File::simplifyPath('../../../'.$path);
if(!is_dir($path)) {
   $path = utf8_decode($path);
   if(!is_dir($path))
      die("Wrong directory");
}

$dir = new File_Dir($path);
$pics = $dir->getPics();
$vids = $dir->getMovies();
if(count($pics) === 0 && count($vids) === 0)
   die("Empty directory");


$temp = tempnam(sys_get_temp_dir(), 'zip');
$zip = new Zip();
$zip->setZipFile($temp);

$zip->addDirectory($dir->name);
foreach($pics as $pic) {
   $zip->addFile(file_get_contents($pic->completePath), $dir->name.'/'.$pic->name);
}

foreach($vids as $vid) {
   $zip->addFile(file_get_contents($vid->completePath), $dir->name.'/'.$vid->name);
}

$zip->sendZip($dir->name.'.zip');
