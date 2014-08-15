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

      $zip = zip_open($zipfile);
      while ($zip_entry = zip_read($zip))    {
         zip_entry_open($zip, $zip_entry);
         if (substr(zip_entry_name($zip_entry), -1) == '/') {
            $zdir = substr(zip_entry_name($zip_entry), 0, -1);
            if (file_exists($this->path.'/'.$zdir)) {
               trigger_error('Directory "<b>' . $zdir . '</b>" exists', E_USER_ERROR);
               return false;
            }
            mkdir($this->path.'/'.$zdir);
         }
         else {
            $name = zip_entry_name($zip_entry);
            if (file_exists($this->path.'/'.$name)) {
               trigger_error('File "<b>' . $name . '</b>" exists', E_USER_ERROR);
               return false;
            }
            $fopen = fopen($this->path.'/'.$name, "w");
            fwrite($fopen, zip_entry_read($zip_entry, zip_entry_filesize($zip_entry)), zip_entry_filesize($zip_entry));
         }
         zip_entry_close($zip_entry);
      }
      zip_close($zip);
      return true;
   }
}


