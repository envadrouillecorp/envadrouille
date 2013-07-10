<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * Options - Entry point
 */

class Pages_Gpx_Index {
   public static $description = "GPX";
   public static $isOptional = true;
   public static $activatedByDefault = true;
   public static $showOnMenu = false;

   public static $userContentName = "gpx";
   public static $userContentDefaultPosition = 1;

   public static function setupAutoload() {
      AutoLoader::$autoload_path[] = "./pages/index/php/";
      AutoLoader::$autoload_path[] = "./pages/gpx/php/";
   }

   public static function getOptions() {
      return array(
         array('id' => 'gpx_type', 'type' => 'select', 'cat' => 'GPX', 'default' => 'terrain', 'vals' => array('satellitte' => 'Satellitte', 'roadmap' => 'Road Map', 'terrain' => 'Terrain', 'ign' => 'IGN (France)')),
         array('id' => 'ign_key', 'type' => 'text', 'cat' => 'GPX', 'default' => '', 'export' => true),

      );
   }

   static public function getUserFunctions() {
       return array(
           file_get_contents('./pages/gpx/scripts/jgallery.gpx.fun.js')
       );
   }

   static public function getTpl() {
      global $gpx_type;
      $template = new liteTemplate();
      $template->file('pages/gpx/tpl/gps.tpl');
      $template->assign(array('GPX_TYPE' => $gpx_type));
      return $template->returnTpl();
   }

   public static function writeJSON($new_json, $old_json) {
      Pages_Gpx_Index::setupAutoload();

      $o_json = GPXJson::fromIndexJSON($old_json);

      $json = array();
      $json['gpx'] = $o_json->getGPX();
      $json['gpxtype'] = $o_json->getGPXType();
      return $json;
   }

   public static function getContent() {
      Pages_Gpx_Index::setupAutoload();

      $dir = new GPXDir(Controller::getParameter('dir'), '', true);
      return array ('gpx' => $dir->getGPXURL());
   }

   static public function uploadGpxAction() {
      $dir = new GPXDir(Controller::getParameter('dir'), Controller::getParameter('updated'));
      if(!isset($_GET['upfile']))
         die("No GPX uploaded");
      $input = fopen("php://input", "r");
      $temp = tempnam(sys_get_temp_dir(), 'th').'.gpx';
      $tempf = fopen($temp, "w");
      $realSize = stream_copy_to_stream($input, $tempf);
      fclose($input);
      $dir->setGPXFromPath($temp);
      echo File_JSON::myjson_encode(array('success' => 'ok'));
   }

   static public function removeGpxAction() {
      File_Factory::registerExtension("dir", "GPXDir");
      $dir = new GPXDir(Controller::getParameter('dir'), Controller::getParameter('updated'));
      $dir->removeGPX();
      $dir->writeJSON();
      echo File_JSON::myjson_encode(array('success' => 'ok'));
   }
};

