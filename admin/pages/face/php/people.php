<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * A recognized people, or a generic people (trash, unknown)
 */

class People extends FaceJSON {
   public $realname;

   public static function getAllJSONs() {
      global $cachepath;
      $dir = new File_Dir($cachepath.'/people');
      return $dir->getJSONs();
   }

   private static function getPrivateJSON($name) {
      global $cachepath;
      $dir = new File_Dir($cachepath.'/people');
      $fjson = null;
      $jsons = $dir->getJSONs();
      foreach($jsons as $json) {
         if(strpos($json->name, "$name.") === 0) {
            $fjson = new People($json->name);
            break;
         }
      }

      if($fjson === null)
         $fjson = new People("$name.".sha1(rand()).".json");
      $fjson->hidden = true;
      return $fjson;
   }
   public static function getUnknownFacesJSON() {
      return People::getPrivateJSON('unknown');
   }
   public static function getPeopleJSON() {
      return People::getPrivateJSON('people');
   }

   public function __construct($name) {
      global $cachepath;
      $name = str_replace('.json', '', $name);
      if($name == 'unknown' || $name == 'trash') {
         $me = People::getPrivateJSON($name);
         parent::__construct($cachepath.'/people', $me->name);
      } else {
         parent::__construct($cachepath.'/people', $name.'.json');
      }
      $this->use_full_path = true;
      $this->realname = $name;
   }
   
   static public function cleanPeople() {
      $ret = array();
      $jsons = People::getAllJSONs();
      foreach($jsons as $json) {
	$j = new FaceJSON($json->completePath);
        $ret = array_merge($ret, $j->clean());
      }
      return array('uselessjsonentries' => $ret);
   }

   static public function emptyTrash() {
      $ret = array();
      $dirs_to_clean = array();
      $trash = new People('trash');
      $container = $trash->get();
      if(isset($container['faces'])) {
         foreach($container['faces'] as $face=>$meta) {
            $f = new Face(
               $meta['path'],
               $meta['name'],
               new FacePic($meta['basepath'], $meta['basename']),
               $meta['people'],
               $meta['uid']
            );
            $dirs_to_clean[$meta['basepath']] = new FaceDir($meta['basepath']);
            if($f->exists())
               $f->remove();
            unset($container['faces'][$face]);
            $ret[] = $f;
         }
         $container['pics'] = array();
         $trash->setContent($container);
         $trash->writeContent();
      }
      foreach($dirs_to_clean as $path=>$dir) {
         $json = $dir->getFaceJSON();
         $json->clean();
      }
      return array('files' => $ret);
   }
};
