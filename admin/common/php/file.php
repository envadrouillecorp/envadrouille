<?php

/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * A generic class that represents a file
 */

class File {
   public $path;
   public $name;
   public $completePath;
   public $extension;
   private $_is_dir = NULL;
   public $hidden = false;

   public function __construct($path, $name = '', $check_existence = false) {
      if($path instanceof File)
         $path = $path->completePath;
      $this->completePath = File::simplifyPath("$path/$name");
      $this->path = dirname($this->completePath);
      $this->name = basename($this->completePath);
      $path_array = explode(".", $this->completePath);
      $this->extension = end($path_array);
      if($check_existence && !$this->exists()) 
         throw new Exception("File $this->completePath does not exist");
   }

   public function exists() {
      return file_exists($this->completePath);
   }

   public function isWritable($create_if_unexistant = true) {
      if($this->exists()) {
         if(is_writable($this->completePath))
            return true;
         //@chmod($this->completePath, 0600);
         //return is_writable($this->completePath);
         return false;
      }
      if(!$create_if_unexistant)
         return false;
      return $this->tryCreate();
   }

   public function tryCreate() {
      // Create the directory containing the file if it does not exists
      // Also create an index.html file in this directory to prevent listing
      if(!file_exists($this->path)) {
         $ret = @mkdir($this->path, 0755, true);
         if($ret === FALSE)
            return $ret;
         @touch("$this->path/index.html");
         //@chmod("$this->path/index.html", 0644);
      }
      $ret = @touch($this->completePath);
      //@chmod($this->completePath, 0600);
      return $ret;
   }

   public function getContent($create_if_unexistant = true) {
      if(!file_exists($this->completePath)) {
         if($this->create_if_unexistant)
            return null;
         else
            throw new Exception("Failed to read from non existant file $this->completePath");
      }
      return file_get_contents($this->completePath);
   }

   public function writeContent($data) {
      if(!$this->isWritable())
         throw new Exception("Cannot write file $this->completePath");
      if($this->hidden) {
         $index = new File($this->path, 'index.html');
         if(!$index->exists())
            $index->tryCreate();
      }
      return file_put_contents($this->completePath, $data);
   }

   public static function simplifyPath($path) {
      $r = array();
      foreach(explode('/', $path) as $p) {
         if($p == '..') {
            if(count($r) == 0 || $r[count($r) - 1] == '..') 
               $r[] = $p;
            else
               array_pop($r);
         } else if($p != '.' && strlen($p))
            $r[] = $p;
      }
      $r = implode('/', $r);
      if($path[0] == '/') $r = "/$r";
      if($r == "") $r = ".";
      return $r;
   }

   public function copyTo($dest) {
      copy($this->completePath, $dest);
   }

   public function remove() {
      unlink($this->completePath);
   }

   public function toArray() {
      return array('path' => $this->path, 'name' => $this->name);
   }

   public static function toArrays($fileArray) {
      $ret = array();
      foreach($fileArray as $f) {
         $ret[] = $f->toArray();
      }
      return $ret;
   }

   private static function fileSort1($a, $b) {
      return strcmp($b->name, $a->name);
   }
   private static function fileSort2($a, $b) {
      return strcmp($a->name, $b->name);
   }
   public static function sort($fileArray, $reverse=false) {
      usort($fileArray, $reverse?'File::fileSort1':'File::fileSort2');
      return $fileArray;
   }

   public static function base64Encode($path) {
      return strtr(base64_encode($path), '+/', '-_');
   }

   public static function base64Decode($path) {
      return base64_decode(strtr($path, '-_', '+/'));
   }

   public function getPublicUrl() {
      $paths = explode('?', $_SERVER['REQUEST_URI'], 2);
      return 'http://'.$_SERVER['SERVER_NAME'].$paths[0].'?action=index.get_file&pubdir='.File::base64Encode(File_JSON::forceUTF8($this->path)).'&pubimg='.File::base64Encode(File_JSON::forceUTF8($this->name));
   }

   /* Get a file from GET or POST base64 parameters. Used to communicate URLs to services that do not undertand special characters properly */
   public static function fromPublicUrl() {
      $file = new File(
         File::base64Decode(Controller::getParameter('pubdir')),
         File::base64Decode(Controller::getParameter('pubimg'))
      );
      if(!$file->exists())
         return new File(
            utf8_decode(File::base64Decode(Controller::getParameter('pubdir'))),
            utf8_decode(File::base64Decode(Controller::getParameter('pubimg')))
         );
      else
         return $file;
   }
}


