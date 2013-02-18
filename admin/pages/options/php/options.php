<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * Automatically discover all configuration options of all pages
 */
class Options {
   // Get a list of all pages in the pages/ dir
   public static function getPages($check_activation) {
      $pages = array();
      $dir = new File_Dir("./pages");
      
      // Let index and options be the first two pages
      $pages['index'] = '';
      $pages['options'] = '';

      // Add a page for each directory in /pages
      foreach($dir->getDirs() as $d) {
         require_once ("$d->path/$d->name/index.php");
         $description = eval('return Pages_'.$d->name.'_Index::$description;');
         $include = eval('return Pages_'.$d->name.'_Index::$showOnMenu;');
         $optional = eval('return Pages_'.$d->name.'_Index::$isOptional;');
         $activated = false;
         if(!$optional) {
            $activated = true;
         } else {
            $activated = isset($_POST[$d->name.'_activated']);
         }
         if($activated || !$check_activation) {
            $pages[$d->name] = array(
               'descr' => $description,
               'show' => $include,
               'url' => 'index.php?action='.$d->name,
            );
         }
      }
      return $pages;
   }

   // Get configuration hooks from all pages/ * /index.php files
   public static function getOptions() {
      $options = array();

      $dir = new File_Dir("./pages");
      foreach($dir->getDirs() as $d) {
         require_once ("$d->path/$d->name/index.php");
         $optionFunction = "Pages_".$d->name."_Index::getOptions";
         $optional = eval('return Pages_'.$d->name.'_Index::$isOptional;');
         $description = eval('return Pages_'.$d->name.'_Index::$description;');
         if($optional) {
            $options[] = array('id' => $d->name.'_activated', 'type' => 'checkbox', 'cat' => $description, 'default' => false);
         }
         if(is_callable($optionFunction)) {
            $page_options = call_user_func($optionFunction);
            $options = array_merge($options, $page_options);
         }
      }
      foreach($options as &$opt) {
         $opt['val'] = isset($GLOBALS[$opt['id']])?$GLOBALS[$opt['id']]:'';
      }

      return $options;
   }

   // Get options from $_POST
   function getNewOptions() {
      $opts = Options::getOptions();
      $ret = array();
      foreach($opts as $opt) {
         if($opt['type'] == 'text' || $opt['type'] == 'select') {
            $ret[$opt['id']] = Controller::getParameter($opt['id']);
         } else if($opt['type'] == 'password') {
            $ret[$opt['id']] = Controller::getParameter($opt['id']);
            if((!isset($opt['val']) || $ret[$opt['id']] != $opt['val']) && $ret[$opt['id']] != '')
               $ret[$opt['id']] = sha1($ret[$opt['id']]);
         } else if($opt['type'] == 'checkbox') {
            $ret[$opt['id']] = isset($_POST[$opt['id']]);
         }
      }
      return $ret;
   }

   // Check that we can modify the configuration files
   public static function checkRights() {
      $config = new File('.', 'config.php');
      $index = new File('..', 'index.html');
      $rights = array(
         'config.php'      => $config->isWritable(),
         '../index.html'   => $index->isWritable(),
      );
      $failure = false;
      foreach($rights as $file=>$r) {
         if(!$r) {
            $failure = true;
            break;
         }
      }
      return array(
         'failure' => $failure,
         'rights' => $rights,
      );
   }

   // Hardcoded currently: get the admin langs.
   public static function getAdminLangs() {
      return array('en' => 'English', 'fr' => 'Fran&ccedil;ais');
   }
};

/*
 * Get the stuff that is injected in the ../index.html page: themes and user langs.
 * TODO: add a way for pages to inject data in index.html!
 */
class UserOptions {
   public static function getBGFG($file) {
      if(!file_exists($file))
         return NULL;
      $css = file_get_contents($file);
      if(!preg_match('/body {(.*?)}/ms', $css, $body_css_a))
         return NULL;
      $body_css = $body_css_a[1];
      if(!preg_match('/background-color:(.*?);/ms', $css, $bg_a))
         return NULL;
      if(!preg_match('/[^-]color:(.*?);/ms', $css, $fg_a))
         return NULL;
      return array('BG' => $bg_a[1], 'FG' => $fg_a[1]);
   }

   public static function getThemes() {
      global $utheme;
      if(Controller::getParameter('utheme') != '')
         $utheme = Controller::getParameter('utheme');

      $dir = new File_Dir('../themes');
      $files = $dir->getDirs();
      $ret = array(
         'NAME' => array(),
         'BG' => array(),
         'FG' => array(),
      );
      foreach($files as $file) {
         if($file->name[0] == '_')
            continue;
         $bgfg = UserOptions::getBGFG("$file->path/$file->name/main.css");
         if(!$bgfg)
            continue;

         if($utheme && $file->name == $utheme) { //default = first element
            array_unshift($ret['NAME'], $file->name);
            array_unshift($ret['BG'], $bgfg['BG']);
            array_unshift($ret['FG'], $bgfg['FG']);
         } else {
            $ret['NAME'][] = $file->name;
            $ret['BG'][] = $bgfg['BG'];
            $ret['FG'][] = $bgfg['FG'];
         }
      }

      return $ret;
   }

   public static function getThemesOpt() {
      $avail_themes_raw = UserOptions::getThemes();
      $avail_themes = array();
      foreach($avail_themes_raw['NAME'] as $t)
         $avail_themes[$t] = $t;
      return $avail_themes;
   }

   public static function getLangs() {
      global $ulang;
      if(Controller::getParameter('ulang') != '')
         $ulang= Controller::getParameter('ulang');

      $dir = new File_Dir('../scripts/lang');
      $files = $dir->getFiles();
      $ret = array( 'LANG' => array() );
      foreach($files as $file) {
         if($file->name[0] == '_')
            continue;
         if($ulang && $file->name == $ulang.'.js') { //default = first element
            array_unshift($ret['LANG'], str_replace('.js', '',$file->name));
         } else {
            $ret['LANG'][] = str_replace('.js', '', $file->name);
         }
      }
      return $ret;
   }

   public static function getLangContent($lang) {
      return file_get_contents('../scripts/lang/'.$lang.'.js');
   }

   public static function getLangsOpt() {
      $avail_lang_raw = UserOptions::getLangs();
      $avail_lang = array();
      foreach($avail_lang_raw['LANG'] as $l)
         $avail_lang[$l] = $l;
      return $avail_lang;
   }

   public static function getPlugins($options) {
      $scripts = array();

      $dir = new File_Dir("./pages");
      foreach($dir->getDirs() as $d) {
         require_once ("$d->path/$d->name/index.php");
         $optional = eval('return Pages_'.$d->name.'_Index::$isOptional;');
         $activated = false;
         if(!$optional) {
            $activated = true;
         } else {
            $activated = isset($options[$d->name.'_activated']) && $options[$d->name.'_activated'];
         }
         if(!$activated)
            continue;

         $optionFunction = "Pages_".$d->name."_Index::getUserScripts";
         if(is_callable($optionFunction)) {
            $plugin_scripts = call_user_func($optionFunction);
            $scripts = array_merge($scripts, $plugin_scripts);
         }
      }

      return array('PLUGIN_URL' => $scripts);
   }
};
