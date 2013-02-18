<?
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * A directory containing pictures to be recognized
 */

class FaceDir extends IndexDir {
    private static function getPrivateJSON($name, $path=false) {
      global $cachepath;
      $fjson = null;
      $dir = new File_Dir(($path?$path:($cachepath.'/face')));
      $jsons = $dir->getJSONs();
      foreach($jsons as $json) {
         if(strpos($json->name, "$name.") === 0) {
            $fjson = new FaceJSON($json->path, $json->name);
            break;
         }
      }

      if($fjson === null)
         $fjson = new FaceJSON($path?$path:($cachepath.'/face'), "$name.".sha1(rand()).".json");
      if($path===false)
         $json->use_full_path = true;
      $fjson->hidden = true;
      return $fjson;
   }


   public function getFaceCacheDir() {
      global $cachepath, $picpath;
      return new JSONDir(str_replace($picpath, $cachepath.'/face', $this->completePath), '', false, true, $this);
   }

   public function getFaceJSON() {
      $json = new FaceJSON($this->getFaceCacheDir(), 'face.json', false, $this);
      return $json;
   }

   public function getFaceHiddenJSON() {
      $json = FaceDir::getPrivateJSON('face.hidden', $this->getFaceCacheDir()->completePath);
      return $json;
   }

   public function getPicsWithMissingFaces() {
      $ret = array();
      $json = $this->getFaceJSON();
      $pics = $this->getPics();

      foreach($pics as $pic) {
         if(!$json->containsPic($pic) && !$pic->hasMissingThumbs())
            $ret[] = $pic;	
      }
      return $ret;
   }

   public function getFaceFromUID($uid) {
      $json = $this->getFaceJSON();
      return $json->getFaceFromUID($uid);
   }

   public function writeJSONPartial($pic) {
      $unknown_faces = People::getUnknownFacesJSON();
      $json = $this->getFaceJSON();

      $json->addPic($pic);
      $faces = $pic->getDetectedFaces();
      foreach($faces as $face) {
         $face->recognized_people = $json->getFacePeople($face);
         $json->addFace($face);
         if($face->recognized_people == Face::$default_name)
            $unknown_faces->addFace($face);
      }
      $json->writeContent();
      $unknown_faces->writeContent();
   }


   public function writeJSON() {
      $parent = new FaceDir($this->completePath.'/..');
      $hidden = $parent->getHiddenJSON()->containsSubdir($this);
      $parent_json = $parent->getFaceHiddenJSON();
      if($hidden)
         $parent_json->addDir($this);
      else
         $parent_json->rmDir($this);
      $parent_json->writeContent();

      $parent_json = $parent->getFaceJSON();
      if(!$hidden)
         $parent_json->addDir($this);
      else
         $parent_json->rmDir($this);
      $parent_json->writeContent();
   }

   public function clean() {
      $ret = array();

      $ret['files'] = array();
      $cachedir = new File_Dir($this->getFaceCacheDir());
      $dirs = $cachedir->getDirs();
      foreach($dirs as $dir) {
         $d = new File_Dir(FaceDir::jsonPathToOrigPath($dir->completePath));
         if(!$d->exists()) {
            $ret['files'][] = $dir;
            $dir->remove();
         }
      }

      $pics = $cachedir->getPics();
      foreach($pics as $pic) {
         $p = new File_Pic(FaceDir::facePathToOrigPath($pic->completePath));
         if(!$p->exists()) {
            $ret['files'][] = $pic;
            $pic->remove();
         }
      }

      $json = $this->getFaceJSON();
      $ret['uselessjsonentries'] = $json->clean();

      return $ret;
   }

   private static function jsonPathToOrigPath($path) {
      global $cachepath, $picpath;
      return str_replace($cachepath.'/face', $picpath, $path);
   }

   private static function facePathToOrigPath($path) {
      global $cachepath, $picpath;
      $new_path = preg_replace('/\.\d+\.(.*?)$/', '.$1', $path);
      return str_replace($cachepath.'/face', $picpath, $new_path);
   }
};

