<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * A Face
 * Functions to create the face thumb
 * Overloads toArray so that all faces are always stored with the same format in JSON files
 */

class Face extends Thumb {
   public static $default_name = 'unknown';
   public $face_rect = null;
   public $recognized_people = null;
   public $uid = null;
   public $face_id = 0; // # of the face if the picture contains multiple faces

   public function __construct($path, $name = '', $basepic = null, $people = null, $uid = null, $width = 0, $height = 0, $face_rect = null) {
      parent::__construct($path, $name, $basepic);
      $this->width = $width;
      $this->height = $height;
      if($face_rect !== null)
         $this->face_rect = $this->adaptRec($face_rect);

      $this->recognized_people = $people;
      $this->uid = $uid;
      if($this->recognized_people === null)
         $this->recognized_people = Face::$default_name;
      if($this->uid === null)
         $this->uid = base64_encode($this->completePath);

      $path_array = explode(".", $this->completePath);
      $this->face_id = $path_array[count($path_array) - 2]; // cache/face/path/picname.face_id.ext
   }

   public function toArray() {
      return array(
         'path' => $this->path,
         'name' => $this->name,
         'basepath' => $this->basepic->path,
         'basename' => $this->basepic->name,
         'people' => $this->recognized_people,
         'uid' => $this->uid,
      );
   }

   public function create() {
      if(!$this->isWritable())
         throw new Exception("Cannot write face thumbnail $this->completePath");

      $source = $this->getSourceImgGD();
      $thumb = imagecreatetruecolor($this->width, $this->height);
      imagecopyresampled($thumb, $source, 0, 0, $this->face_rect['x'], $this->face_rect['y'], $this->width, $this->height, $this->face_rect['width'], $this->face_rect['height']);
      imagejpeg($thumb, $this->completePath, 100);
      imagedestroy($thumb);
      imagedestroy($source);
   }

   public function recognize($people) {
      $old_people = new People($this->recognized_people);
      $old_people->rmFace($this);
      $old_people->writeContent();

      $this->recognized_people = $people->realname;
      $people->addFace($this);
      $people->writeContent();

   }

   public function train() {
      $api = FacePic::getFaceAPI();
      if($this->recognized_people !== Face::$default_name
         && $this->recognized_people !== 'trash')
         $api->faces_enroll($this->getPublicUrl(), $this->recognized_people, $this->face_id);
   }

   public function tryToRecognize() {
      $api = FacePic::getFaceAPI();
      return $api->faces_trydetect($this->getPublicUrl(), $this->face_id);
   }

   private function adaptRec($face_rect) {
      $extension_factor = 1.45; // We take a 45% border around the face

      if(!$this->basepic->exists())
         throw new Exception("Base picture $this->completePath does not exist");

      $orig_size = $this->basepic->getSize();

      $face_w = (int)($extension_factor*$face_rect['width']);
      $face_h = (int)($extension_factor*$face_rect['height']);

      // Check that the width/height ratio is the same as that of the thumb
      // Increase the size of $face_w or $face_h is required
      if(((int)(100*$face_w/$face_h)) < ((int)(100*$this->width/$this->height))) {
         $face_w = (int)($face_h*$this->width/$this->height);
      } else if(((int)(100*$face_w/$face_h)) > ((int)(100*$this->width/$this->height))) {
         $face_h = (int)($face_w*$this->height/$this->width);
      }

      $left_x = (int)($face_rect['x'] - ($face_w - $face_rect['width'])/2);
      $top_y = (int)($face_rect['y'] - ($face_h - $face_rect['height'])/2);

      if($left_x < 0)
         $left_x = 0;
      if($left_x + $face_w > $orig_size[0])
         $face_w = $orig_size[0] - $left_x;
      if($top_y < 0)
         $top_y = 0;
      if($top_y + $face_h > $orig_size[1])
         $face_h = $orig_size[1] - $top_y;

      // Redo the ratio but decrease this time
      if(((int)(100*$face_w/$face_h)) < ((int)(100*$this->width/$this->height))) {
         $face_h = (int)($face_w*$this->height/$this->width);
      } else if(((int)(100*$face_w/$face_h)) > ((int)(100*$this->width/$this->height))) {
         $face_w = (int)($face_h*$this->width/$this->height);
      }


      return array('x' => $left_x, 'y' => $top_y, 'width' => $face_w, 'height' => $face_h);
   }
};

