<?
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * A picture
 */

class File_Pic extends File {
   public function getSize() {
      return @getimagesize($this->completePath);
   }
}

