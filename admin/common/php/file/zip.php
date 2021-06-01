<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * A zip file
 */

class File_Zip extends File {
   public function unzip() {
      $zipfile = $this->completePath;

      $zip = new ZipArchive();
      $res = $zip->open($zipfile, ZipArchive::RDONLY);
      if($res !== true)
         throw new Exception("Cannot open Zip archive");
      $res = $zip->extractTo($this->path.'/');
      if($res !== true)
         throw new Exception("Cannot extract Zip archive to ".$this->path." (check permissions?)");
      $zip->close();
      return true;
   }
}


