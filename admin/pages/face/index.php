<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * Face recognition - Entry point
 */

class Pages_Face_Index {
   public static $description = "Facial Recognition";
   public static $isOptional = true;
   public static $showOnMenu = true;


   public static function setupAutoload() {
      File_Factory::registerExtension("png", "FacePic");
      File_Factory::registerExtension("jpg", "FacePic");
      File_Factory::registerExtension("gif", "FacePic");
      File_Factory::registerExtension("dir", "FaceDir");

      AutoLoader::$autoload_path[] = "./pages/index/php/";
      AutoLoader::$autoload_path[] = "./pages/face/php/";
      AutoLoader::$autoload_path[] = "./pages/face/php/plugins";

      if(isset($GLOBALS['face_plugin']) && $GLOBALS['face_plugin'] !== '') {
         if(!file_exists('./pages/face/php/plugins/'.$GLOBALS['face_plugin'].'.php'))
            throw new Exception('Invalid face plugin'.'./pages/face/php/plugins/'.$GLOBALS['face_plugin'].'.php');
         require_once('./pages/face/php/plugins/'.$GLOBALS['face_plugin'].'.php');
      }
   }

   static public function getOptions() {
      return array(
         array('id' => 'face_use_xmp', 'type' => 'checkbox', 'cat' => 'Facial Recognition', 'default' => true ),
         array('id' => 'face_plugin', 'type' => 'select', 'cat' => 'Facial Recognition', 'default' => '', 'vals' => array('' => '', 'googlecloudvision' => 'googlecloudvision', 'faceplusplus.com' => 'faceplusplus.com', 'skybiometry.com' => 'skybiometry.com', 'kairos.com' => 'kairos.com', 'projectoxford.ai' => 'projectoxford.ai' )),
         array('id' => 'do_recognition', 'type' => 'checkbox', 'cat' => 'Facial Recognition', 'default' => false),
         array('id' => 'face_namespace', 'type' => 'text', 'cat' => 'Facial Recognition', 'default' => ''),
         array('id' => 'face_pub', 'type' => 'text', 'cat' => 'Facial Recognition', 'default' => ''),
         array('id' => 'face_key', 'type' => 'text', 'cat' => 'Facial Recognition', 'default' => ''),
         array('id' => 'face_disable_ssl', 'type' => 'checkbox', 'cat' => 'Facial Recognition', 'default' => false),
      );
   }

   static public function getUserScripts() {
      return array('./admin/pages/face/scripts/jgallery.face.js');
   }

   static public function mainAction() {
      $template = new liteTemplate();
      $template->extraJS[] = './pages/face/scripts/dir.js';
      $template->extraJS[] = './pages/face/scripts/view.js';
      $template->extraJS[] = './pages/face/scripts/face.js';
      $template->extraJS[] = './pages/face/scripts/people.js';
      $template->showPage('face');
      $template->assign(array('FACE_API' => FaceAPI::$name));
      $template->assign(array('FACE_API_DETECTRATE' => FaceAPI::$detectrate));
      $template->assign(array('FACE_API_RECORATE' => FaceAPI::$recorate));
      $template->view();
   }

   static public function failAction() {
      $template = new liteTemplate();
      $template->showPage('face', 'fail');
      $template->view();
      exit(0);
   }

   static public function getPeopleAction() {
      $ret = array('people' => array());
      $jsons = People::getAllJSONs();
      foreach($jsons as $json) {
         $name = preg_replace('/\..*$/', '', $json->name);
         $ret['people'][$name] = $json->get();
      }
      echo File_JSON::myjson_encode($ret);
   }

   static public function getUnknownFacesAction() {
      echo File_JSON::myjson_encode(People::getUnknownFacesJSON()->get());
   }

   static public function getDirsAction() {
      $dir = new FaceDir(Controller::getParameter('dir'));
      echo File_JSON::myjson_encode(array(
         'dirs' => File::sort($dir->getDirs(), true),
         'json' => $dir->getFaceJSON()->mergeWithHiddenJSON()->get(),
      ));
   }

   static public function getTodoListAction() {
      $dir = new FaceDir(Controller::getParameter('dir'));
      echo File_JSON::myjson_encode(array(
         'faces' => $dir->getPicsWithMissingFaces(),
      ));
   }

   static public function createFacesAction() {
      $pic = new FacePic(Controller::getParameter('dir'), Controller::getParameter('img'));
      $faces = $pic->detectFaces(); //TOCORRECT
      //$faces = $pic->getCachedDetectedFaces();
      echo File_JSON::myjson_encode(array(
         'faces' => $faces,
      ));
   }

   static public function writeFacesJsonAction() {
      $dir = new FaceDir(Controller::getParameter('dir'));
      $dir->writeJSON();
      echo File_JSON::myjson_encode(array(
         'success' => true,
      ));
   }

   static public function writeFacesJsonPartialAction() {
      $dir = new FaceDir(Controller::getParameter('dir'));
      $facepic = new FacePic(Controller::getParameter('dir'), Controller::getParameter('img'));

      $farray = Controller::getParameter('faces', array());
      $fhash = array();
      foreach($farray as $f)
         $fhash[$f['uid']] = $f['people'];
      $dir->writeJSONPartial($facepic, $fhash);

      echo File_JSON::myjson_encode(array(
         'success' => true,
      ));
   }


   static function addFaceAction() {
      $dir = new FaceDir(Controller::getParameter('dir'));
      $face = $dir->getFaceFromUID(Controller::getParameter('face'));
      if(!$face)
         throw new Exception("Could not find face, try again");

      $people = new People(Controller::getParameter('people'));
      $face->recognize($people);

      $dirjson = $dir->getFaceJSON();
      $dirjson->addFace($face);
      $dirjson->writeContent();

      echo File_JSON::myjson_encode(array(
         'success' => true,
      ));
   }

   static function recognizeAction() {
      if(isset($GLOBALS['do_recognition']) && $GLOBALS['do_recognition']) {
         $dir = new FaceDir(Controller::getParameter('dir'));
         $face = $dir->getFaceFromUID(Controller::getParameter('face'));
         echo File_JSON::myjson_encode(array(
            'name' => $face!==NULL?$face->tryToRecognize():Face::$default_name
         ));
      } else {
         echo File_JSON::myjson_encode(array(
            'name' => Face::$default_name
         ));
      }
   }

   static function trainAction() {
      $dir = new FaceDir(Controller::getParameter('dir'));
      $face = $dir->getFaceFromUID(Controller::getParameter('face'));
      if($face !== NULL)
         $face->train();
      echo File_JSON::myjson_encode(array(
         'success' => true,
      ));
   }

   static public function cleanAction() {
      $dir = new FaceDir(Controller::getParameter('dir'));
      echo File_JSON::myjson_encode(
          $dir->clean()
      );
   }

   static public function cleanPeopleAction() {
      echo File_JSON::myjson_encode(
         People::cleanPeople()
      );
   }

   static public function emptyTrashAction() {
      echo File_JSON::myjson_encode(
         People::emptyTrash()
      );
   }
};

?>
