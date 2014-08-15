<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * Face recognition - Entry point
 */

class Pages_Plugins_Index {
   public static $description = "Plugins";
   public static $isOptional = false;
   public static $showOnMenu = true;
   public static $pluginsurl = "http://plugins.envadrouille.org/";

   public static function setupAutoload() {
      AutoLoader::$autoload_path[] = "./pages/options/php/";
      AutoLoader::$autoload_path[] = "./pages/plugins/php/";
   }


   static public function mainAction() {
      global $lang;
      $template = new liteTemplate();
      $template->showPage('plugins');
      $template->assign(array('PLUGURL' => Pages_Plugins_Index::$pluginsurl));
      $template->assign(array('PLUGLANG' => $lang));
      $template->view();
   }

   static public function getPluginsAction() {
      $dir = new File_Dir('./pages/');
      $plugins = $dir->getDirs();
      $ret = array();
      foreach($plugins as $p) {
         $version_num = 0;
         $version = new File($p, 'VERSION');
         if($version->exists())
            $version_num = $version->getContent();
         $ret[] = array('name' => $p->name, 'version' => $version_num);
      }
      echo File_JSON::myjson_encode($ret);
   }


   static public function installPluginAction() {
      $rights = Options::checkRights();
      if($rights['failure'])
         throw new Exception('Cannot modify configuration. Details:'.print_r($rights, true));

      $plugin = Controller::getParameter('plugin');

      $plugin_dir = './pages';
      $dir = new File_Dir($plugin_dir);
      if(!$dir->isWritable())
         throw new Exception("Cannot write the ./admin/pages/ directory!");

      if(!copy(Pages_Plugins_Index::$pluginsurl.$plugin.'.zip', "$plugin_dir/$plugin.zip"))
         throw new Exception("Cannot download $plugin!");


      $plugin_file = new File_Zip("$plugin_dir/$plugin.zip");
      $plugin_file->unzip();
      $plugin_file->remove();

      $new_values = options::getoldoptions();
      options::writeoptions($new_values);

      echo File_JSON::myjson_encode(array('success' => TRUE));
   }

   static public function rmPluginAction() {
      $rights = Options::checkRights();
      if($rights['failure'])
         throw new Exception('Cannot modify configuration. Details:'.print_r($rights, true));

      $plugin = Controller::getParameter('plugin');
      $dir = new File_Dir('./pages/'.$plugin);
      $dir->remove();

      if(Controller::getParameter('remove_options') !== "false") {
         $new_values = options::getoldoptions();
         options::writeoptions($new_values);
      }

      echo File_JSON::myjson_encode(array('success' => TRUE));
   }
};



