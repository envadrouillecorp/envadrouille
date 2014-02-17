<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * A picture
 */

class File_Pic extends File {
   private $exif = null;
   public function readExif() {
      if($this->exif !== null)
         return $this->exif;

      if(!is_callable('exif_read_data')) {
         $this->exif = FALSE;
         return $this->exif;
      }

      $this->exif = @exif_read_data($this->completePath, 'EXIF', true);
      return $this->exif;
   }

   public function getSize() {
      return @getimagesize($this->completePath);
   }
}

