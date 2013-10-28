<?php

class GPXDir extends IndexDir {
   /*
    * GPX related functions
    */
   public function getGPXs($limit = 0) {
      return $this->_getFilesFiltered('GPX', $limit);
   }


   private function getGPXUploadPath() {
      return $this->getJSONCacheDir()->completePath.'/data.gpx';
   }

   public function getGPX() {
      $ret = array();
      $uploaded_gpx = new File($this->getGPXUploadPath());
      if($uploaded_gpx->exists())
         $ret[] = $uploaded_gpx;

      $in_pics_gpx = $this->getGPXs();
      if(count($in_pics_gpx)) 
         $ret = array_merge($ret, $in_pics_gpx);

      return $ret;
   }

   public function getGPXURL() {
      global $picpath;
      $gpx = $this->getGPX();
      if(count($gpx) == 0)
         return null;
      $path_only = implode("/", (explode('/', $_SERVER["REQUEST_URI"], -1)));

      $ret = array();
      foreach($gpx as $g) {
         $ret[] = 'http://'.$_SERVER['SERVER_NAME'].str_replace("admin", "", File::simplifyPath($path_only)).str_replace('../', "", $g->completePath);
      }
      return implode(',', $ret);
   }

   public function setGPXFromPath($path) {
      $gpx = new File($this->getGPXUploadPath());
      if(!$gpx->isWritable())
         throw new Exception("Cannot create GPX file at $path");
      copy($path, $this->getGPXUploadPath());
   }

   public function removeGPX() {
      $gpx = $this->getGPX();
      foreach($gpx as $g)
         $g->remove();
   }
};

