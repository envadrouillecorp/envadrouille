<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * A directory containing pictures
 */
class IndexDir extends File_Dir {
   public $isUpdated;   // Are we updating thumbs/json of this dir?
                        // If true, info on the dir (description, etc.) will be read from $_POST and not from cache

   public function __construct($path, $name = '', $check_existence = false, $ignore_hidden = true) {
      parent::__construct($path, $name, $check_existence, $ignore_hidden);
      $this->isUpdated = (
         File::simplifyPath(Controller::getParameter('dir', '').'/'.Controller::getParameter('updated', '--')) === $this->completePath
      );
   }

   public function getURL() {
      global $picpath;
      $path_only = implode("/", (explode('/', $_SERVER["REQUEST_URI"], -1)));
      return 'http://'.$_SERVER['SERVER_NAME'].str_replace("admin", "", File::simplifyPath($path_only)).'#!'.str_replace($picpath."/", "", $this->completePath);
   }


   /*
    * JSON Related functions.
    */

   /* Directory holding the JSONs */
   public function getJSONCacheDir() {
      global $cachepath, $picpath;
      return new JSONDir(str_replace($picpath, $cachepath.'/json', $this->completePath), '', false, true, $this);
   }

   /* Get the JSON that stores publicly visible pics & dirs */
   public function getPublicJSON() {
      return new IndexJSON($this->getJSONCacheDir(), 'cache.json', false, $this);
   }

   /* Get the JSON that stores private pics & dirs                                            */
   /* Basically looks for a .json in the JSON cache dir that isn't the public cache.json file */
   public function getHiddenJSON() {
      $hidden_json = null;
      $cachedir = $this->getJSONCacheDir();
      if($cachedir->exists()) {
         $jsons = $cachedir->getJSONs();
         foreach($jsons as $json) {
            if($json->name != "cache.json") {
               $hidden_json = IndexJSON::fromFileJSON($json, $this);
               break;
            }
         }
      }

      if($hidden_json === null)
         $hidden_json = new IndexJSON($this->getJSONCacheDir(), sha1(rand()).".json", false, $this);
      $hidden_json->hidden = true;
      return $hidden_json;
   }

   /* Write all JSONs file of this directory */
   public function writeJSON() {
      global $plugins;

      $old_json = $this->getPublicJSON();
      $old_hidden_json = $this->getHiddenJSON();

      $json = array();
      $hidden_json = array();

      /* Directory parsing */
      $directories = File::sort($this->getDirs(), true);
      if(count($directories) > 0) {
         $i = 0;
         $dirs = array();
         $hidden_dirs = array();
         foreach($directories as $d) {
            $was_hidden = $old_hidden_json->containsSubdir($d);
            $was_public = $old_json->containsSubdir($d);
            if(!$d->isUpdated && !$was_hidden && !$was_public) // dir not added yet
               continue;

            $dir_json = ($was_public)?$old_json:$old_hidden_json;
            $js = array(
               'ID' => $i++,
               'url' => $d->name,
               'thumbs' => $dir_json->getThumbs(5, $d),
               'descr' => $dir_json->getDescription($d),
            );
            if($dir_json->isStarred($d))
               $js['starred'] = true;
            if(($d->isUpdated && Controller::getParameter('hidden', false) === "true") || (!$d->isUpdated && $was_hidden))
               $hidden_dirs[] = $js;
            else
               $dirs[] = $js;
         }
         $json['dirs'] = $dirs;
         $hidden_json['dirs'] = $hidden_dirs;
      } 

      if($this->isUpdated) {
         /* Pictures parsing */
         $pictures = File::sort($this->getPics());
         if(count($pictures) > 0) {
            $pics = array();
            foreach($pictures as $p) {
               $pics[] = array(
                  'url' => $p->name,
                  'original' => $p->isBiggerThanThumbnail()
               );
            }
            $json['pics'] = $pics;
         } 

         /* Video parsing */
         $movies = File::sort($this->getMovies());
         if(count($movies) > 0) {
            $movs = array();
            $previous_name = "";
            foreach($movies as $m) {
               $mov_ext = $m->extension;
               $current_name = preg_replace("/\.$mov_ext\$/", "", $m->name);
               if($current_name == $previous_name) {
                  $movs[count($movs) - 1]['url'][] = $m->name;
               } else {
                  $movs[] = array(
                     'url' => array($m->name),
                  );
               }
               $previous_name = $current_name;
            }
            $json['vids'] = $movs;
         }
      } else {
         if(isset($old_json['pics']))
            $json['pics'] = $old_json['pics'];
         if(isset($old_json['vids']))
            $json['vids'] = $old_json['vids'];
      }

      $args = array(
         'json' => &$json,
         'old_json' => &$old_json,
         'dir' => &$this,
      );
      foreach($plugins as $plugin) {
         require_once('./pages/'.$plugin.'/index.php');
         $writeFunction = "Pages_".$plugin."_Index::writeJSON";
         if(is_callable($writeFunction)) 
            call_user_func($writeFunction, $args);
      } 

      /* Description parsing */
      $json['descr'] = $old_json->getDescription();


      $old_json->setContent($json);
      $old_hidden_json->setContent($hidden_json);

      $old_json->writeContent();
      if(count($hidden_json) > 0) 
         $old_hidden_json->writeContent();
   }


  /*
   *  Thumb related functions
   */

   public function getThumbCacheDir() {
      global $cachepath, $picpath;
      return new ThumbDir(str_replace($picpath, $cachepath.'/thumbs', $this->completePath), '', false, true, $this);
   }

   private function getFailThumbPath() {
      $c = count(explode("/", $this->completePath));
      $path = '';
      for($i = 0; $i < $c; $i++) {
         $path .= '../';
      }
      $path .= 'themes/_common/fail.jpg';
      return $path;
   }

   private function hasDefaultThumb() {
      return file_exists($this->getThumbCacheDir()->completePath.'/index_m.jpg');
   }

   public function getThumbsPaths($limit = -1) {
      $thumb_dir = $this->getThumbCacheDir();
      if(!$thumb_dir->exists())
         return array($this->getFailThumbPath());

      $val = array();

      if($this->hasDefaultThumb())
         $val[] = 'index_m.jpg';
      foreach($thumb_dir->getPics() as $thumb) {
         if(count($val) == $limit)
            break;

         $count = strlen($thumb->name);
         if($count > 6 && $thumb->name[$count-5] == 'm' && $thumb->name[$count-6] == '_' && $thumb->name != 'index_m.jpg') 
            $val[] = $thumb->name;
      }
      
      if(count($val) == 0) 
         return array($this->getFailThumbPath());
      return $val;
   }

   public function getPicsWithMissingThumbs() {
      $ret = array();
      $pics = $this->getPics();
      foreach($pics as $pic) {
         if($pic->hasMissingThumbs())
            $ret[] = $pic;
      }
      return $ret;
   }

   public function setThumbFromPath($path) {
      $pic = new IndexPic($path);
      $pic->thumbdir = $this->getThumbCacheDir();
      $pic->setAsMainThumb();
   }


   /*
    * Maintenance functions
    */

   public function cleanCache() {
      $ret_a = array();

      $thumbs = $this->getThumbCacheDir()->getPics();
      foreach($thumbs as $thumb) {
         if(!$thumb->basepic->exists() && !$thumb->isMainThumb()) {
            $ret_a[] = $thumb;
            $thumb->remove();
         }
      }

      $dirs = $this->getThumbCacheDir()->getDirs();
      foreach($dirs as $dir) {
         if(!$dir->basedir->exists()) {
            $ret_a[] = $dir;
            $dir->remove();
         }
      }

      $dirs = $this->getJSONCacheDir()->getDirs();
      foreach($dirs as $dir) {
         if(!$dir->basedir->exists()) {
            $ret_a[] = $dir;
            $dir->remove();
         }
      }

      $this->writeJSON();
      return array('nb' => count($ret_a), 'files' => $ret_a);
   }

}
