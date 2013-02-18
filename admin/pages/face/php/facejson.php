<?
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * JSON containing information about faces and pictures of a directory.
 *
 * Format:
 * [dirs] = hash(FaceDirs->name => empty array)
 * [pics] = hash(FacePic->name => array(FacesUID))
 * [faces] = (UID => Face)
 *
 * If $use_full_path is set to true, dirs, pics, faces are full path (e.g., ../pics/whatever/foo)
 * Else the name is used (e.g., foo)
 */
class FaceJSON extends File_JSON {
   public $use_full_path = false;
   public $masterDirectory = null; // Directory that is represented by this JSON

   public function __construct($path, $name = '', $check_existence = '', $masterDirectory = null) {
      parent::__construct($path, $name, $check_existence);
      $this->masterDirectory = $masterDirectory;
   }

   public function getPicFaces($pic) {
      if(!isset($this->container['pics']))
         return array();

      $selector = $this->use_full_path?$pic->completePath:$pic->name;
      if(!isset($this->container['pics'][$selector]))
         return array();

      $ret = array();
      foreach($this->container['pics'][$selector] as $faceuid=>$bool) {
         $face = $this->container['faces'][$faceuid];
         $ret[] = new Face(
            $face['path'],
            $face['name'],
            new FacePic($face['basepath'], $face['basename']),
            $face['people'],
            $face['uid']
         );
      }
      return $ret;
   }

   public function containsPic($pic) {
      $selector = $this->use_full_path?$pic->completePath:$pic->name;
      return (isset($this->container['pics']) && isset($this->container['pics'][$selector]));
   }

   public function containsFace($face) {
      return (isset($this->container['faces']) && isset($this->container['faces'][$face->uid]));
   }

   public function getFaceFromUID($uid) {
      if(!(isset($this->container['faces']) && isset($this->container['faces'][$uid])))
         return null;
      $face = $this->container['faces'][$uid];
      return new Face(
         $face['path'],
         $face['name'],
         new FacePic($face['basepath'], $face['basename']),
         $face['people'],
         $face['uid']
      );
   }

   public function addPic($pic) {
      $selector = $this->use_full_path?$pic->completePath:$pic->name;
      if(!isset($this->container['pics']))
         $this->container['pics'] = array();
      if(!isset($this->container['pics'][$selector]))
         $this->container['pics'][$selector] = array();
   }

   public function addFace($face) {
      $selector = $this->use_full_path?$face->basepic->completePath:$face->basepic->name;
      $this->addPic($face->basepic);
      $this->container['pics'][$selector][$face->uid] = true;

      if(!isset($this->container['faces']))
         $this->container['faces'] = array();
      $this->container['faces'][$face->uid] = $face;
   }

   public function rmFace($face) {
      $selector = $this->use_full_path?$face->basepic->completePath:$face->basepic->name;
      if(isset($this->container['pics'])
        && isset($this->container['pics'][$selector])
        && isset($this->container['pics'][$selector][$face->uid])) {
         unset($this->container['pics'][$selector][$face->uid]);
      }

      if(isset($this->container['faces'])
         && isset($this->container['faces'][$face->uid]))
         unset($this->container['faces'][$face->uid]);
   }

   public function getFacePeople($face) {
      if(!isset($this->container['faces'])
         || !isset($this->container['faces'][$face->uid]))
         return Face::$default_name;
      return $this->container['faces'][$face->uid]['people'];
   }

   public function addDir($dir) {
      $selector = $this->use_full_path?$dir->completePath:$dir->name;
      if(!isset($this->container['dirs']))
         $this->container['dirs'] = array();
      if(!isset($this->container['dirs'][$selector]))
         $this->container['dirs'][$selector] = array();
   }

   public function rmDir($dir) {
      $selector = $this->use_full_path?$dir->completePath:$dir->name;
      if(!isset($this->container['dirs']))
         $this->container['dirs'] = array();
      if(isset($this->container['dirs'][$selector]))
         unset($this->container['dirs'][$selector]);
   }


   public function containsDir($dir) {
      $selector = $this->use_full_path?$dir->completePath:$dir->name;
      return (isset($this->container['dirs']) && isset($this->container['dirs'][$selector]));
   }

   public function mergeWithHiddenJSON() {
      $json = $this->masterDirectory->getFaceHiddenJSON();

      if($json->get('dirs') === null)
         return $this;

      if($this->get('dirs') === null) 
         $this->container['dirs'] = array();
      foreach($json->get('dirs') as $dir=>$meta) {
         $meta['hidden'] = true;
         $this->container['dirs'][$dir] = $meta;
      }

      return $this;
   }

   public function clean() {
      $ret = array();
      if(isset($this->container['dirs'])) {
         foreach($this->container['dirs'] as $dir=>$v) {
            $d = new FaceDir($this->masterDirectory->completePath, $dir);
            if(!$d->exists()) {
               $ret[] = $this->completePath.' [dir:'.$dir.']';
               unset($this->container['dirs'][$dir]);
            }
         }
      }
      if(isset($this->container['faces'])) {
         foreach($this->container['faces'] as $face=>$meta) {
            $p = new FacePic($meta['basepath'], $meta['basename']);
            $f = new File($meta['path'], $meta['name']);
            if(!$p->exists()) {
               if($f->exists())
                  $f->remove();
               $ret[] = $this->completePath.' [face:'.$face.']';
               unset($this->container['faces'][$face]);
            } else if(!$f->exists()) {
               $ret[] = $this->completePath.' [face:'.$face.']';
               unset($this->container['faces'][$face]);
            }
         }
      }
      if(isset($this->container['pics'])) {
         foreach($this->container['pics'] as $pic=>$faces) {
            $p = new FacePic(
               $this->masterDirectory!==null?$this->masterDirectory->completePath.'/'.$pic:$pic
            );
            if(!$p->exists()) {
               $ret[] = $this->completePath.' [pic:'.$pic.']';
               unset($this->container['pics'][$pic]);
            } else {
               foreach($faces as $f=>$bool) {
                  if(!isset($this->container['faces'])
                    || !isset($this->container['faces'][$f]))
                     unset($this->container['pics'][$pic][$f]);
               }
            }
         }
      }
      $this->writeContent();
      return $ret;
   }
};

