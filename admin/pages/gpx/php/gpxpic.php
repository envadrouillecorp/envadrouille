<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * A geotagged picture
 */
class GpxPic extends IndexPic {
   private $exif;

   private function getGps($exifCoord, $hemi) {

       $degrees = count($exifCoord) > 0 ? $this->gps2Num($exifCoord[0]) : 0;
       $minutes = count($exifCoord) > 1 ? $this->gps2Num($exifCoord[1]) : 0;
       $seconds = count($exifCoord) > 2 ? $this->gps2Num($exifCoord[2]) : 0;

       $flip = ($hemi == 'W' or $hemi == 'S') ? -1 : 1;

       return $flip * ($degrees + $minutes / 60 + $seconds / 3600);

   }

   private function gps2Num($coordPart) {
       $parts = explode('/', $coordPart);
       if (count($parts) <= 0)
           return 0;

       if (count($parts) == 1)
           return $parts[0];

       return floatval($parts[0]) / floatval($parts[1]);
   }

   public function getCoords() {
      $ret = null;

      $exif = $this->readExif(); 
      if($exif === false)
         $ret = '';

      if($ret === null && isset($exif['GPS']) && isset($exif['GPS']["GPSLongitude"])) {
         $ret = $this->getGps($exif['GPS']["GPSLatitude"], $exif['GPS']['GPSLatitudeRef'])
               .','
               .$this->getGps($exif['GPS']["GPSLongitude"], $exif['GPS']['GPSLongitudeRef']);
      }

      if($ret === null && isset($exif['EXIF']['DateTimeOriginal'])) 
         $ret = '@'.$exif['EXIF']['DateTimeOriginal'];

      return ($ret === null)?'':$ret;
   }
}
