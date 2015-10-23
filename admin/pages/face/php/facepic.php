<?php
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
      $thumbs = $this->getThumbList();
      $thumb = $thumbs[0];

      if(!$thumb->exists())
         throw new Exception("Cannot detect face on $this->completePath (missing thumbnail)");

      $faces = array();
      if(isset($GLOBALS['face_use_xmp']) && $GLOBALS['face_use_xmp'] !== '')
         $faces = $this->detectFacesXmp($thumb);
      if(count($faces) === 0 && isset($GLOBALS['face_plugin']) && $GLOBALS['face_plugin'] !== '') 
         $faces = $this->detectFacesApi($thumb);

      return $faces;
   }

   public function detectFacesXmp($thumb) {
      $facesrect = array();
      $dir = new FaceDir($this->path);

      ob_start();
      readfile($this->completePath);
      $source = ob_get_contents();
      ob_end_clean();

      $xmpdata_start = strpos($source,"<x:xmpmeta");
      $xmpdata_end = strpos($source,"</x:xmpmeta>");
      if($xmpdata_start === FALSE || $xmpdata_end === FALSE)
         return $facesrect;
      $xmplength = $xmpdata_end-$xmpdata_start;
      $xmpdata = substr($source,$xmpdata_start,$xmplength+12);

      $dom = new DOMDocument;
      $dom->loadXML($xmpdata);

      $xpath = new DOMXPath($dom);
      $xpath->registerNamespace('mwg-rs', "http://www.metadataworkinggroup.com/schemas/regions/");
      $xpath->registerNamespace('stDim', "http://ns.adobe.com/xap/1.0/sType/Dimensions#");

      $query = '//*[@mwg-rs:Type="Face"]';
      $elements = $xpath->query($query);
      foreach ($elements as $field) {
         $face = array(
            'peoplename' => $field->getAttribute('mwg-rs:Name'),
         );

         //for some reason getElementsByTagName does not work here...
         foreach($field->childNodes as $child) {
            if(!isset($child->tagName) || $child->tagName != 'mwg-rs:Area')
               continue;
            $face['width'] = $child->getAttribute('stArea:w') * 100;
            $face['height'] = $child->getAttribute('stArea:h') * 100;
            $face['x'] =  $child->getAttribute('stArea:x') * 100 - $face['width'] / 2;
            $face['y'] = $child->getAttribute('stArea:y') * 100 - $face['height'] / 2;
            $face['scaled'] = ($child->getAttribute('stArea:unit') === 'normalized');
            if(!$face['scaled'])
               throw new Exception("Unsupported XMP metadata - facerect is not scaled\n");
         }

         if(isset($face['x']))
            $facesrect[] = $face;
      }

      return $this->facesFromFacerect($thumb, $facesrect);
   }      

   public function detectFacesApi($thumb) {
      $api = $this->getFaceAPI();
      $facesrect = $api->faces_detect($thumb->getPublicUrl());
      return $this->facesFromFacerect($thumb, $facesrect);
   }

   private function facesFromFacerect($thumb, $facesrect) {
      $faces = array();

      $i = 0;
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
            isset($facerect['peoplename'])?$facerect['peoplename']:null,
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
