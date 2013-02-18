<?
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * A picture that is going to be recognized
 */

class FacePic extends IndexPic {
   public static function getFaceAPI() {
      return new FaceAPI($GLOBALS['face_pub'], isset($GLOBALS['face_key'])?$GLOBALS['face_key']:'');
   }

   private function getFaceName($i) {
      $base_name = substr($this->name, 0, -(strlen($this->extension) + 1));
      return $base_name.'.'.$i.'.'.$this->extension;
   }

   public function detectFaces() {
      $api = $this->getFaceAPI();
      $thumbs = $this->getThumbList();
      $thumb = $thumbs[0];

      if(!$thumb->exists())
         throw new Exception("Cannot detect face on $this->completePath (missing thumbnail)");

      $i = 0;
      $facesrect = $api->faces_detect($thumb->getPublicUrl());
      $faces = array();
      foreach($facesrect as $facerect) {
         if(isset($facerect['scaled']) && $facerect['scaled']) {
            $size = $thumb->getSize();
            $facerect['x'] = (int)($size[0] * $facerect['x'] / 100);
            $facerect['y'] = (int)($size[1] * $facerect['y'] / 100);
            $facerect['width'] = (int)($size[0] * $facerect['width'] / 100);
            $facerect['height'] = (int)($size[1] * $facerect['height'] / 100);
         }
         $dir = new FaceDir($this->path);
         $f = new Face(
            $dir->getFaceCacheDir(),
            $this->getFaceName($i),
            $thumb,
            null,
            null,
            150,
            150,
            $facerect
         );
         $f->create();

         $f->basepic = $this;
         $faces[] = $f;

         $i++;
      }
      
      return $faces;
   }

   public function getCachedDetectedFaces() {
      $dir = new FaceDir($this->path);
      $json = $dir->getFaceJSON();
      return $json->getPicFaces($this);
   }

   public function getDetectedFaces() {
      $faces = array();
      for($i =0; ; $i++) {
         $dir = new FaceDir($this->path);
         $face = new Face(
            $dir->getFaceCacheDir(),
            $this->getFaceName($i),
            $this
         );
         if(!$face->exists())
            break;
         $faces[] = $face;
      }
      return $faces;
   }
};
