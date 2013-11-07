<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * Copyright notice at the end of the page
 */

class Pages_Copyright_Index {
   public static $description = "Copyright";
   public static $isOptional = true;
   public static $activatedByDefault = true;
   public static $showOnMenu = false;

   public static function setupAutoload() {
   }

   static public function getOptions() {
      return array(
         array('id' => 'copyright', 'type' => 'text', 'cat' => 'Copyright', 'default' => 'Powered by <a href="http://envadrouille.org">EnVadrouille</a>', 'export' => true),
      );
   }

   static public function getUserFunctions() {
       return array(
           file_get_contents('./pages/copyright/scripts/jgallery.copyright.fun.js')
       );
   }
};



