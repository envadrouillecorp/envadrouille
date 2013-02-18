<?
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * Factory to return an object of the correct class depending on the extension
 * Can be extended / modified using the registerExtension function.
 */

class File_Factory {
   static public $known_extensions = array();

   static public function registerExtension($ext, $class) {
      File_Factory::$known_extensions[$ext] = $class;
   }

   static public function getFile($path, $name) {
      $array_path = explode(".", $name);
      $extension = strtolower(end($array_path));

      if(is_dir($path.'/'.$name)) {
         if(isset(File_Factory::$known_extensions['dir']))
            return new File_Factory::$known_extensions['dir']($path, $name);
         return new File_Dir($path, $name);
      }

      foreach(File_Factory::$known_extensions as $ext=>$class) {
         if($ext == $extension)
            return new $class($path, $name);
      }

      if(in_array($extension, array("jpg", "png", "gif"))) {
         return new File_Pic($path, $name);
      } else if(in_array($extension, array("mp4", "ogg", "ogv", "avi"))) {
         return new File_Movie($path, $name);
      } else if(in_array($extension, array("gpx"))) {
         return new File_GPX($path, $name);
      } else if(in_array($extension, array("json"))) {
         return new File_JSON($path, $name);
      } 
      
      return new File($path, $name);
   }
};

