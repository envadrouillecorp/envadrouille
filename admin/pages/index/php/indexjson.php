<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * A JSON describing an IndexDir
 */
class IndexJSON extends File_JSON {
   public $masterDirectory; // Directory that is represented by this JSON

   public function __construct($path, $name = '', $check_existence = '', $masterDirectory = null) {
      parent::__construct($path, $name, $check_existence);
      $this->masterDirectory = $masterDirectory;
   }

   public static function fromFileJSON($json, $masterDirectory) {
      return new IndexJSON($json->path, $json->name, false, $masterDirectory);
   }

   /* Get Description for dir or subdir; if the dir is updated, will get info from $_POST instead */
   public function getDescription($subdir=null) {
      return $this->getJSONEntry('descr', $subdir);
   }

   /* Idem for star */
   public function isStarred($subdir=null) {
      $val = $this->getJSONEntry('starred', $subdir);
      return $val === true || $val === "true";
   }

   /* Get the directory's thumbs. If dir is updated, reread thumbs dir, else use cache */
   public function getThumbs($limit = -1, $subdir='') {
      $dir = $subdir?$subdir:$this->masterDirectory;
      if($dir->isUpdated || $dir->thumbsChanged)
         return $dir->getThumbsPaths($limit);
      else
         return $this->getJSONEntry('thumbs', $subdir);
   }
   
   public function containsSubdir($subdir) {
      return $this->getJSONEntry('url', $subdir) != '';
   }

   public function getJSONEntry($key, $dir) {
      /* First, check if the value is to be updated */
      $updated = ($dir)?$dir->isUpdated:$this->masterDirectory->isUpdated;
      if($updated) {
         $val = Controller::getParameter($key, null);
         if($val !== null)
            return $val;
      }

      /* Next, parse the JSON */
      if($dir) {
         $dir_name = File_JSON::forceUTF8($dir->name);
         if(!isset($this->container['dirs']) || $this->container['dirs'] == null)
            return '';
         foreach($this->container['dirs'] as $d) {
            if($d['url'] != null && $d['url'] == $dir_name) {
               return (!isset($d[$key]) || $d[$key] == null) ? '' : $d[$key];
            }
         }
         return '';
      } else {
         if(!isset($this->container[$key]) || $this->container[$key] == null)
            return '';
         else
            return $this->container[$key];
      }
   }

   public function mergeWithHiddenJSON() {
      $json = $this->masterDirectory->getHiddenJSON();

      if($json->get('dirs') === null)
         return $this;

      if($this->get('dirs') === null) 
         $this->container['dirs'] = array();
      foreach($json->get('dirs') as $dir) {
         $dir['hidden'] = true;
         $this->container['dirs'][] = $dir;
      }

      return $this;
   }

};

