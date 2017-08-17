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
   public static $isContentPlugin = true;

   public static $pluginsUrl = "https://plugins.envadrouille.org/";

   public static function setupAutoload() {
      AutoLoader::$autoload_path[] = "./pages/options/php/";
      AutoLoader::$autoload_path[] = "./pages/plugins/php/";
   }

   public static function getOptions() {
      $last_visit_plugin = isset($GLOBALS['last_visit_plugin'])?$GLOBALS['last_visit_plugin']:0;
      return array(
         array('id' => 'check_plugin_updates', 'type' => 'checkbox', 'cat' => 'Plugins', 'default' => true, 'export' => true),
         array('id' => 'check_new_plugin', 'type' => 'checkbox', 'cat' => 'Plugins', 'default' => true, 'export' => true),
         array('id' => 'last_visit_plugin', 'type' => 'hidden', 'cat' => 'Plugins', 'default' => $last_visit_plugin, 'export' => true),
      );
   }

   static public function mainAction() {
      global $lang;
      $template = new liteTemplate();
      $template->showPage('plugins');
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
      echo File_JSON::myjson_encode(array(
         'plugins' => $ret,
         'plugin_url' => Pages_Plugins_Index::$pluginsUrl,
         'check_plugin_updates' => isset($GLOBALS['check_plugin_updates']) && $GLOBALS['check_plugin_updates'] === '1',
         'check_new_plugin' => isset($GLOBALS['check_new_plugin']) && $GLOBALS['check_new_plugin'] === '1',
         'last_visit_plugin' => isset($GLOBALS['last_visit_plugin'])?$GLOBALS['last_visit_plugin']:0,
      ));
   }


   static public function updateLastVisitAction() {
      $new_values = options::getOldOptions();
      $new_values['last_visit_plugin'] = Controller::getParameter('last_version');
      options::writeoptions($new_values);
      echo File_JSON::myjson_encode(array('success' => TRUE));
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

      $plugin_file = fopen("$plugin_dir/$plugin.zip", "w");
      if(!$plugin_file)
         throw new Exception("Cannot create file $plugin_dir/$plugin.zip");
      fwrite($plugin_file, File::getSslPage(Pages_Plugins_Index::$pluginsUrl.$plugin.'.zip'));
      fclose($plugin_file);

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



