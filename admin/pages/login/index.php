<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * Login - Entry point
 */

class Pages_Login_Index {
   public static $description = "Login";
   public static $isOptional = false;
   public static $showOnMenu = false;

   public static function loginAction() {
      $GLOBALS['update_activated'] = false;

      $template = new liteTemplate();
      $template->showPage('login');
      $template->view();
   }

   public static function validateAction() {
      global $adm_pwd;
      $pwd = Controller::getParameter('adm_pwd', false);
      if(!$pwd) {
         Pages_Login_Index::loginAction();
      } else {
         if(sha1($pwd) != $adm_pwd) {
            die('Incorrect pwd');
         } else {
            $_SESSION['logged_in'] = true;
            $_SESSION['random_sid'] = rand();
            session_write_close();
            header('Location: index.php');
         }
      }
   }

   public static function logoutAction() {
      unset($_SESSION['logged_in']);
      session_write_close();
      header('Location: index.php');
   }
};

