<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * A picture in a directory
 */
class IndexPic extends File_Pic { 
   public $thumbdir = null;
   public function getThumbList($optimize_basepic=false) {
      global $big_pic_width, $big_pic_height;
      $index_dir = new IndexDir($this->path);
      $dest_dir = ($this->thumbdir!==null)?($this->thumbdir->completePath):($index_dir->getThumbCacheDir()->completePath);
      $base_name = substr($this->name, 0, -(strlen($this->extension) + 1));

      $ret = array(
         new Thumb($dest_dir, $base_name.'_r.'.$this->extension, $this, $big_pic_width, $big_pic_height, false),
         new Thumb($dest_dir, $base_name.'_b.'.$this->extension, $this, 350, 0, false),
         new Thumb($dest_dir, $base_name.'_m.'.$this->extension, $this, 150, 0, false),
         new Thumb($dest_dir, $base_name.'_c.'.$this->extension, $this, 200, 150, true),
      );
      if(!$optimize_basepic)
         return $ret;

      /* Create thumbs from smaller version of the thumb --> Speed up things */
      $ret[1]->basepic = $ret[0];
      $ret[2]->basepic = $ret[1];

      $size = $this->getSize();
      if($size !== FALSE && isset($size[0]) && is_numeric($size[0]) && $size[0] > 0) {
         if($size[1]*350/$size[0] > 150)
            $ret[3]->basepic = $ret[1];
      }

      return $ret;
   }

   public function setAsMainThumb() {
      $thumbs = $this->getThumbList(true);
      $file_date = filemtime($this->completePath);
      foreach($thumbs as $thumb) {
         $new_name = preg_replace('/.*(_.)\..*?$/', 'index$1.jpg', $thumb->name);
         if(!$thumb->exists() || (filemtime($thumb->completePath) < $file_date)) {
            $thumb->name = $new_name;
            $thumb->completePath = File::simplifyPath("$thumb->path/$thumb->name");
            $thumb->create();
         } else {
            $thumb->copyTo($thumb->path.'/'.$new_name);
         }
      }
   }

   public function hasMissingThumbs() {
      $file_date = filemtime($this->completePath);
      foreach($this->getThumbList() as $thumb) {
         if(!$thumb->exists() || (filemtime($thumb->completePath) < $file_date))
            return true;
      }
      return false;
   }

   public function createMissingThumbs() {
      $file_date = filemtime($this->completePath);
      foreach($this->getThumbList(true) as $thumb) {
         if(!$thumb->exists() || (filemtime($thumb->completePath) < $file_date)) 
            $thumb->create();
      }
      return true;
   }

   public function isBiggerThanThumbnail() {
      global $big_pic_width, $big_pic_height;

      $size = $this->getSize();
      if(!$size)
         return false;

      return ($size[0] > $big_pic_width || $size[1] > $big_pic_height);
   }

};

