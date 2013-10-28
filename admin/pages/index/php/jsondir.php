<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * The json cache directory of an IndexDir
 */

class JSONDir extends File_Dir {
   public $basedir = null;
   public function __construct($path, $name = '', $check_existence = false, $ignore_hidden = true, $basedir = null) {
      parent::__construct($path, $name, $check_existence, $ignore_hidden);
      $this->basedir = $basedir;
   }

   public function getDirs($limit = 0) {
      $dirs = $this->_getFilesFiltered('File_Dir', $limit);
      $jsondirs = array();
      foreach($dirs as $d) {
         $jsondirs[] = new JSONDir($d->path, $d->name, false, true, new IndexDir(JSONDir::jsonPathToOrigPath($d->completePath)));
      }
      return $jsondirs;
   }

   private static function jsonPathToOrigPath($path) {
      global $cachepath, $picpath;
      return str_replace($cachepath.'/json', $picpath, $path);
   }
}

