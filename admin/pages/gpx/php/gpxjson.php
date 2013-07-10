<?

class GPXJson extends IndexJson {
   public static function fromIndexJSON($json) {
      $dir = new GPXDir(
         $json->masterDirectory->path,
         $json->masterDirectory->name,
         false,
         true
      );
      return new GPXJson($json->path, $json->name, false, $dir);
   }

   public function getGPX() {
      if($this->masterDirectory->isUpdated) {
         $gpx = $this->masterDirectory->getGPX();
         if(!count($gpx))
            return '';
         $ret = array();
         foreach($gpx as $g) 
            $ret[] = File::simplifyPath('admin/'.$g->completePath);
         return $ret;
      }
      return isset($this->container['gpx'])?$this->container['gpx']:'';
   }

   public function getGPXType($subdir=null) {
      return $this->getJSONEntry('gpxtype', $subdir);
   }
};
