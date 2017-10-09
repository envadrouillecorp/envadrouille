<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * Index - Entry point
 */

class Pages_Index_Index {
   public static $description = "Index";
   public static $isOptional = false;
   public static $showOnMenu = true;

   public static function setupAutoload() {
      File_Factory::registerExtension("png", "IndexPic");
      File_Factory::registerExtension("jpg", "IndexPic");
      File_Factory::registerExtension("gif", "IndexPic");
      File_Factory::registerExtension("dir", "IndexDir");
      AutoLoader::$autoload_path[] = "./pages/index/php/";
   }

   static public function getOptions() {
      return array(
         array('id' => 'big_pic_width', 'type' => 'text', 'cat' => 'Thumbs', 'default' => 900),
         array('id' => 'big_pic_height', 'type' => 'text', 'cat' => 'Thumbs', 'default' => 800),
         array('id' => 'quality', 'type' => 'text', 'cat' => 'Thumbs', 'default' => 96),
         array('id' => 'max_parallel_jobs', 'type' => 'text', 'cat' => 'Thumbs', 'default' => 4),
         array('id' => 'convert', 'type' => 'text', 'cat' => 'Thumbs', 'default' => '/usr/bin/convert'),
      );
   }

   static public function mainAction() {
      global $gpx_type, $plugins;
      $plugin_content = '';
      $template = new liteTemplate();
      foreach($plugins as $plugin) {
         if(!file_exists('./pages/'.$plugin.'/index.php'))
            continue;
         require_once('./pages/'.$plugin.'/index.php');
         $classn = Controller::getPluginIndex($plugin);
         $tplFunction = $classn."::getTpl";
         if(is_callable($tplFunction)) 
            $plugin_content .= call_user_func($tplFunction);

         $template->extraJS[] = './pages/'.$plugin.'/scripts/lang/index_{$lang}.js';
         $template->extraJS[] = './pages/'.$plugin.'/scripts/index.'.$plugin.'.js';
      }
      $template->showPage('index');
      $template->assign(array('PLUGIN_CONTENT' => $plugin_content));
      $template->view();
   }

   static public function getDirContentAction() {
      global $plugins;

      $dir = new IndexDir(Controller::getParameter('dir'), '', true);
      $thumb_dir = $dir->getThumbCacheDir()->completePath;
      $main_thumbs = $dir->getThumbsPaths(1);
      $main_thumb = $main_thumbs[0];
   
      $ret = array(
         'imgs' => File::sort($dir->getPics()),
         'dirs' => File::sort($dir->getDirs(), true),
         'thumb' => $thumb_dir.'/'.$main_thumb,
         'thumb_dir' => $thumb_dir,
         'json' => $dir->getPublicJSON()->mergeWithHiddenJSON()->get(),
         'url' => $dir->getURL(),
      );
      foreach($plugins as $plugin) {
         if(!file_exists('./pages/'.$plugin.'/index.php'))
            continue;
         require_once('./pages/'.$plugin.'/index.php');
         $classn = Controller::getPluginIndex($plugin);
         $contentFunction = $classn."::getContent";
         if(is_callable($contentFunction)) 
            $ret = array_merge($ret, call_user_func($contentFunction));
      }
      echo File_JSON::myjson_encode($ret);
   }

   static public function getTodoListAction() {
      $dir = new IndexDir(Controller::getParameter('dir'), '', true);
      echo File_JSON::myjson_encode(array(
         'imgs' => $dir->getPicsWithMissingThumbs(),
      ));
   }

   static public function createThumbsAction() {
      $pic = new IndexPic(Controller::getParameter('dir'), Controller::getParameter('img'), true);
      echo File_JSON::myjson_encode(array('success' => $pic->createMissingThumbs()));
   }

   static public function writeJsonAction() {
      $updated_dir = new IndexDir(Controller::getParameter('dir'), Controller::getParameter('updated'), true);
      $updated_dir->writeJSON();

      $parent_dir = new IndexDir(Controller::getParameter('dir'), '', true);
      $parent_dir->writeJSON(); 
      
      echo File_JSON::myjson_encode(array('success' => 'ok'));
   }

   static public function updateJsonAction() {
      $updated_dir = new IndexDir(Controller::getParameter('dir'), '', true);
      $updated_dir->writeJSON();

      echo File_JSON::myjson_encode(array('success' => 'ok'));
   }


   static public function cleanCacheAction() {
      $updated_dir = new IndexDir(Controller::getParameter('dir'), '', true);
      $del_files = $updated_dir->cleanCache();
      echo File_JSON::myjson_encode(array('deleted_files' => $del_files));
   }

   
   static public function setThumbAction() {
      $dir = new IndexDir(Controller::getParameter('dir'), Controller::getParameter('partialupdated'));
      if(isset($_GET['upfile'])) {
         $input = fopen("php://input", "r");
         $temp = tempnam(sys_get_temp_dir(), 'th').'.jpg';
         $tempf = fopen($temp, "w");
         $realSize = stream_copy_to_stream($input, $tempf);
         fclose($input);
         $dir->setThumbFromPath($temp);
      } else {
         $dir->setThumbFromPath($dir->completePath.'/'.Controller::getParameter('img'));
      }

      $parent_dir = new IndexDir(Controller::getParameter('dir'), '', true);
      $parent_dir->writeJSON(); 
      echo File_JSON::myjson_encode(array('success' => 'ok', 'path' => $dir->getThumbCacheDir()->completePath));
   }

   static public function getFileAction() {
      //SECURITY
      global $cachepath;
      $file = File::fromPublicUrl();
      if(!$file->exists() || strpos($file->path, $cachepath) !== 0)
         throw new Exception("Invalid file $file->completePath");

      $extension = strtolower($file->extension);
      if($extension === "png")
         header("Content-Type: image/png");
      else if($extension == "gif")
         header("Content-Type: image/gif");
      else
         header("Content-Type: image/jpg");
      readfile($file->completePath);
   }
};

?>
