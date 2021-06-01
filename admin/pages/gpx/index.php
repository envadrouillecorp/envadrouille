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
      File_Factory::registerExtension("gpx", "GPX");
   }

   public static function getOptions() {
      return array(
         array('id' => 'gpx_tiles', 'type' => 'sortables', 'cat' => 'GPX', 'fields' => array('Name' => 'text', 'URL' => 'text', 'Attribution' => 'text', 'Enabled'=>'checkbox'), 'export' => 'true', 'default' => array(
            array('Name' => 'CartoDB', 'URL' => 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', 'Attribution' => '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', 'Enabled'=>true),
            array('Name' => 'OSM', 'URL' => 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 'Attribution' => '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors', 'Enabled'=>true),
            array('Name' => 'Refuges.info', 'URL' => 'https://maps.refuges.info/hiking/{z}/{x}/{y}.png', 'Attribution' => '&copy; <a href="https://www.refuges.info">Refuges.info</a>', 'Enabled'=>true),
         )),
         array('id' => 'geolocalization', 'type' => 'checkbox', 'cat' => 'GPX', 'default' => true, 'export' => true),
         array('id' => 'show_map_coord', 'type' => 'checkbox', 'cat' => 'GPX', 'default' => false, 'export' => true),
         array('id' => 'geo_use_time', 'type' => 'checkbox', 'cat' => 'GPX', 'default' => true, 'export' => true),
         array('id' => 'default_geo_time_diff', 'type' => 'text', 'cat' => 'GPX', 'default' => 0, 'export' => true),
      );
   }

   static public function getUserFunctions() {
       return array(
           file_get_contents('./pages/gpx/scripts/jgallery.gpx.fun.js')
       );
   }

   static public function getTpl() {
      global $gpx_type, $geolocalization, $geo_use_time, $default_geo_time_diff, $gpx_tiles;
      $template = new liteTemplate();
      $template->file('pages/gpx/tpl/gps.tpl');
      $template->assign(array('GPX_TYPE' => $gpx_type));
      $template->assign(array('TILES' => $gpx_tiles));
      if($geolocalization === '1' && $geo_use_time === '1') {
         $template->assign(array('GEOLOCALIZATION_BEG' => ''));
         $template->assign(array('GEOLOCALIZATION_END' => ''));
         $template->assign(array('GPX_TIME_DIFF' => $default_geo_time_diff));
      } else {
         $template->assign(array('GEOLOCALIZATION_BEG' => '<!--'));
         $template->assign(array('GEOLOCALIZATION_END' => '-->'));
         $template->assign(array('GPX_TIME_DIFF' => ''));
      }
      return $template->returnTpl();
   }

   public static function writeJSON($args) {
      global $gpx_type, $geolocalization, $geo_use_time, $default_geo_time_diff;
      Pages_Gpx_Index::setupAutoload();

      $o_json = GPXJson::fromIndexJSON($args['old_json']);

      $new_json = &$args['json'];
      $new_json['gpx'] = $o_json->getGPX();
      $new_json['gpxtype'] = $o_json->getGPXType();

      $dir = &$args['dir'];
      if($geolocalization === '1') {
         if($geo_use_time === '1') {
            if($dir->isUpdated) {
               $new_json['gxtdiff'] = Controller::getParameter('gxtdiff');
               $new_json['geo_use_time'] = Controller::getParameter('geo_use_time');
            } else {
               if(isset($old_json['gxtdiff']))
                  $new_json['gxtdiff'] = $old_json['gxtdiff'];
               if(isset($old_json['geo_use_time']))
                  $new_json['geo_use_time'] = $old_json['geo_use_time'];
            }
         }
         if(isset($new_json['pics'])) {
            $old_json_date = $o_json->exists()?filemtime($o_json->completePath):0;

            $hash = array();
            $pics = $o_json->get('pics');
            if($pics) {
               foreach($pics as &$pic)
                  $hash[$pic['url']] = $pic;
            }

            foreach($new_json['pics'] as &$pic) {
               $gpspic = new GpxPic($dir->completePath, $pic['url']);
               if($dir->isUpdated) {
                  if(!isset($hash[$gpspic->name]) || !isset($hash[$gpspic->name]['coords']) || (filemtime($gpspic->completePath) > $old_json_date)) {
                     $coords = $gpspic->getCoords();
                     if($coords !== '')
                        $pic['coords'] = $coords;
                  } else {
                     if(isset($hash[$gpspic->name]) && isset($hash[$gpspic->name]['coords']))
                        $pic['coords'] = $hash[$gpspic->name]['coords'];
                  }
               } else {
                  if(isset($hash[$gpspic->name]) && isset($hash[$gpspic->name]['coords']))
                     $pic['coords'] = $hash[$gpspic->name]['coords'];
               }
            }
         }
      }
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
      File_Factory::registerExtension("png", "GpxPic");
      File_Factory::registerExtension("jpg", "GpxPic");
      File_Factory::registerExtension("gif", "GpxPic");

      $dir = new GPXDir(Controller::getParameter('dir'), Controller::getParameter('updated'));
      $dir->removeGPX();
      $dir->writeJSON();
      echo File_JSON::myjson_encode(array('success' => 'ok'));
   }
};

