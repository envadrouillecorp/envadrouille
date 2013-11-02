<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * Download gallery entry point
 */

class Pages_Download_Index {
   public static $description = "Galery download";
   public static $isOptional = true;
   public static $showOnMenu = false;
   public static $userContentName = "dlall";
   public static $userContentDefaultPosition = 10;


   public static function setupAutoload() {
   }

   static public function getOptions() {
      return array(
      );
   }

   static public function getUserFunctions() {
       return array(
           file_get_contents('./pages/download/scripts/jgallery.download.fun.js')
       );
   }

   static public function mainAction() {
   }
};



