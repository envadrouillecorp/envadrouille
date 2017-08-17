<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * Automatic gallery update - Entry point
 */


class Pages_Update_Index {
   public static $description = "Update";
   public static $isOptional = true;
   public static $activatedByDefault = true;
   public static $showOnMenu = false;
   public static $isContentPlugin = true;

   public static $updateUrl = "https://update.envadrouille.org/VERSION-JSON";

   public static function setupAutoload() {
      require_once('./pages/update/php/update.php');
   }

   public static function mainAction($action=null) {
      global $lang;
      if(!isset($lang))
         $lang = 'en';
      $template = new liteTemplate();
      $template->file('./pages/update/tpl/update.tpl');
      $template->assign(array('lang' => $lang));
      $template->view();
   }

   public static function getUpdateInfoAction() {
      echo json_encode(array(
         'update_activated' => (isset($GLOBALS['update_activated']) && $GLOBALS['update_activated'])?'true':'false',
         'update_url' => Pages_Update_Index::$updateUrl,
         'VERSION' => $GLOBALS['VERSION'],
      ));
   }

   public static function getFilesToUpdateAction() {
      echo json_encode(get_update_zip());
   }

   public static function updateFileAction() {
      echo json_encode(update_file(Controller::getParameter('ufile'), Controller::getParameter('binary')));
   }

   public static function updateFileManuallyAction() {
      echo json_encode(update_file_manually(Controller::getParameter('ufile'), Controller::getParameter('ucontent')));
   }

   public static function finishMergeAction() {
      $res = finish_merge(json_decode(Controller::getParameter('files'), true));
      echo json_encode(array(
         'success' => (count($res) == 0),
         'err' => $res
      ));
   }

   public static function checkRightsAction() {
      $res = check_rights(json_decode(Controller::getParameter('files'), true));
      echo json_encode(array(
         'success' => (count($res) == 0),
         'err' => $res
      ));
   }
};
