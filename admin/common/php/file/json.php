<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * A JSON
 */

class File_JSON extends File implements ArrayAccess, Iterator{
   protected $container = array();
   protected $position = 0;

   //TODO: Acquire lock on file
   public function __construct($path, $name = '', $check_existence = false) {
       parent::__construct($path, $name, $check_existence);
       if($this->exists())
          $this->container = File_JSON::myjson_decode($this->getContent(), true);
   }

   public function get($entry=null) {
      if($entry === null)
         return $this->container;

      if(isset($this->container[$entry]))
         return $this->container[$entry];
      else
         return null;
   }

   public function setContent($_container) {
      $this->container = $_container;
   }

   public function writeContent() {
      parent::writeContent(File_JSON::myjson_encode($this->container));
   }

   /**
    * JSON manipulation.
    * For some reason json_encode expects utf-8 strings, but we might be working with a windows-1251 charset.
    * myjson_encode returns a correct json, no matter the encoding. The other functions getting data from the json
    * have to convert the data back to the correct charset before using it.
    */
   public static function forceUTF8($text){
      if(is_numeric($text))
         return $text;
      if($text===true)
         return true;
      if($text===false)
         return false;
      if($text=='')
         return '';

      if(is_object($text)) {
         echo get_class($text)."<br>";
         debug_print_backtrace();
      }
      $max = strlen($text);
      $buf = "";
      for($i = 0; $i < $max; $i++){
         $c1 = $text{$i};
         if($c1>="\xc0"){ //Should be converted to UTF8, if it's not UTF8 already
            $c2 = $i+1 >= $max? "\x00" : $text{$i+1};
            $c3 = $i+2 >= $max? "\x00" : $text{$i+2};
            $c4 = $i+3 >= $max? "\x00" : $text{$i+3};
            if($c1 >= "\xc0" & $c1 <= "\xdf"){ //looks like 2 bytes UTF8
               if($c2 >= "\x80" && $c2 <= "\xbf"){ //yeah, almost sure it's UTF8 already
                  $buf .= $c1 . $c2;
                  $i++;
               } else { //not valid UTF8.  Convert it.
                  $cc1 = (chr(ord($c1) / 64) | "\xc0");
                  $cc2 = ($c1 & "\x3f") | "\x80";
                  $buf .= $cc1 . $cc2;
               }
            } elseif($c1 >= "\xe0" & $c1 <= "\xef"){ //looks like 3 bytes UTF8
               if($c2 >= "\x80" && $c2 <= "\xbf" && $c3 >= "\x80" && $c3 <= "\xbf"){ //yeah, almost sure it's UTF8 already
                  $buf .= $c1 . $c2 . $c3;
                  $i = $i + 2;
               } else { //not valid UTF8.  Convert it.
                  $cc1 = (chr(ord($c1) / 64) | "\xc0");
                  $cc2 = ($c1 & "\x3f") | "\x80";
                  $buf .= $cc1 . $cc2;
               }
            } elseif($c1 >= "\xf0" & $c1 <= "\xf7"){ //looks like 4 bytes UTF8
               if($c2 >= "\x80" && $c2 <= "\xbf" && $c3 >= "\x80" && $c3 <= "\xbf" && $c4 >= "\x80" && $c4 <= "\xbf"){ //yeah, almost sure it's UTF8 already
                  $buf .= $c1 . $c2 . $c3;
                  $i = $i + 2;
               } else { //not valid UTF8.  Convert it.
                  $cc1 = (chr(ord($c1) / 64) | "\xc0");
                  $cc2 = ($c1 & "\x3f") | "\x80";
                  $buf .= $cc1 . $cc2;
               }
            } else { //doesn't look like UTF8, but should be converted
               $cc1 = (chr(ord($c1) / 64) | "\xc0");
               $cc2 = (($c1 & "\x3f") | "\x80");
               $buf .= $cc1 . $cc2;				
            }
         } elseif(($c1 & "\xc0") == "\x80"){ // needs conversion
            $cc1 = (chr(ord($c1) / 64) | "\xc0");
            $cc2 = (($c1 & "\x3f") | "\x80");
            $buf .= $cc1 . $cc2;				
         } else { // it doesn't need convesion
            $buf .= $c1;
         }
      }
      return $buf;
   }


   private static function r_array_convert(&$val, &$key, $userdata) {
      $key = File_JSON::recursive_convert($key, $userdata);
      $val = File_JSON::recursive_convert($val, $userdata);
   }

   private static function recursive_convert($arr, $out_charset) {
      if ($arr instanceof File)
         return File_JSON::recursive_convert($arr->toArray(), $out_charset);
      if (!is_array($arr))
         return File_JSON::forceUTF8($arr);
      $ret = $arr;
      array_walk_recursive($ret, "File_JSON::r_array_convert", $out_charset);
      return $ret;
   } 

   public static function myjson_encode($arr) {
      return json_encode(File_JSON::recursive_convert($arr, "utf-8"));
   }

   public static function myjson_decode($content) {
      return json_decode($content, true);
   }

   /* AccessArray and Iterator implementation */
   public function offsetSet($offset, $value) {
      if (is_null($offset)) {
         $this->container[] = $value;
      } else {
         $this->container[$offset] = $value;
      }
   }
   public function offsetExists($offset) {
      return isset($this->container[$offset]);
   }
   public function offsetUnset($offset) {
      unset($this->container[$offset]);
   }
   public function offsetGet($offset) {
      return isset($this->container[$offset]) ? $this->container[$offset] : null;
   }
   public function rewind() {
      $this->position = 0;
   }
   public function current() {
      return $this->container[$this->position];
   }
   public function key() {
      return $this->position;
   }
   public function next() {
      ++$this->position;
   }
   public function valid() {
      return isset($this->container[$this->position]);
   }

}

