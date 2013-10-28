<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * The thumb cache direcory of an IndexDir
 */

class ThumbDir extends File_Dir {
   public $basedir = null;
   public function __construct($path, $name = '', $check_existence = false, $ignore_hidden = true, $basedir = null) {
      parent::__construct($path, $name, $check_existence, $ignore_hidden);
      $this->basedir = $basedir;
   }

   public function getPics($limit = 0) {
      $pics = $this->_getFilesFiltered('File_Pic', $limit);
      $thumbs = array();
      foreach($pics as $p) {
         $thumbs[] = new Thumb($p->path, $p->name, new File_Pic(ThumbDir::thumbPathToOrigPath($p->completePath)));
      }
      return $thumbs;
   }

   public function getDirs($limit = 0) {
      $dirs = $this->_getFilesFiltered('File_Dir', $limit);
      $thumbdirs = array();
      foreach($dirs as $d) {
         $thumbdirs[] = new ThumbDir($d->path, $d->name, false, true, new IndexDir(ThumbDir::thumbPathToOrigPath($d->completePath)));
      }
      return $thumbdirs;
   }

   private static function thumbPathToOrigPath($path) {
      global $cachepath, $picpath;
      $new_path = preg_replace('/_.\.(.*?)$/', '.$1', $path);
      return str_replace($cachepath.'/thumbs', $picpath, $new_path);
   }
}

