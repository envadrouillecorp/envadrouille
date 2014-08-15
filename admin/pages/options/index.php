<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * Options - Entry point
 */

class Pages_Options_Index {
   public static $description = "Options";
   public static $isOptional = false;
   public static $showOnMenu = true;

   public static function setupAutoload() {
      AutoLoader::$autoload_path[] = "./pages/options/php/";
   }

   public static function getOptions() {
      return array(
         array('id' => 'adm_pwd', 'type' => 'password', 'cat' => 'Global', 'default' => ''),
         array('id' => 'lang', 'type' => 'select', 'cat' => 'Global', 'default' => 'en', 'vals' => Options::getAdminLangs()),
         array('id' => 'utheme', 'type' => 'select', 'cat' => 'UserOpt', 'default' => 'default', 'vals' => UserOptions::getThemesOpt()),
         array('id' => 'ulang', 'type' => 'select', 'cat' => 'UserOpt', 'default' => 'en', 'vals' => UserOptions::getLangsOpt()),
         array('id' => 'picpath', 'type' => 'text', 'cat' => 'GlobalPath', 'default' => '../pics'),
         array('id' => 'cachepath', 'type' => 'text', 'cat' => 'GlobalPath', 'default' => '../cache'),
      );
   }

   public static function mainAction($action=null) {
      $template = new liteTemplate();

      $permissions = Options::checkRights();
      if($permissions['failure'])
         Controller::notifyUser('error', 'permission', $permissions['rights']);

      $options = Options::getOptions();
      $pages = Options::getPages(false);

      $descr = array();
      $heads = array();
      $inputs = array();
      $last_head = '';
      foreach($options as $meta) {
         $inputs[] = $template->createInput($meta);
         if($meta['cat'] != $last_head) {
            $heads[] = '<h2 class="translate">'.$meta['cat'].'</h2>';
            $last_head = $meta['cat'];
         } else {
            $heads[] = '';
         }
         $descr[] = $meta['id'];
      }

      foreach($pages as $page=>$meta) 
         $template->extraJS[] = './pages/'.$page.'/scripts/lang/option_{$lang}.js';

      $template->showPage('options');
      $template->assignTag('BALISE', '2', array(
         'HEAD' => $heads,
         'DESCR' => $descr,
         'INPUT' => $inputs,
      ));
      $template->assign(array('DISPLAY_CHANGED' => ($action == 'changed')?'block':'none'));
      $template->assign(array('DISPLAY_UPDATE' => ($action == 'update')?'block':'none'));
      $template->assign(array('DISPLAY_FAIL' => ($action == 'fail')?'block':'none'));
      $template->assign(array('DISPLAY_FAIL2' => ($action == 'fail2')?'block':'none'));
      $template->view();
   }

   public static function updateAction() {
      Pages_Options_Index::mainAction('update');
   }

   public static function changedAction() {
      Pages_Options_Index::mainAction('changed');
   }



   public static function changeAction() {

      $new_values = Options::getNewOptions();
      try {
         Options::writeOptions($new_values);
      } catch (Exception $e) {
         Pages_Options_Index::mainAction($e->getMessage());
      }

      /* We actually do a redirect so that options really get reread from the config.php file */
      Controller::redirect('options.changed');
   }
};

