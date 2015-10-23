<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * kairos.com API
 * Strongly inspired by the face.com php API.
 */

define ("API_SERVER", "https://api.kairos.com/");

if(!isset($GLOBALS['face_namespace']) || $GLOBALS['face_namespace'] === ''
   || !isset($GLOBALS['face_pub']) || $GLOBALS['face_pub'] === ''
   || !isset($GLOBALS['face_key']) || $GLOBALS['face_key'] === '')
   Pages_Face_Index::failAction();

if (!function_exists('curl_init'))  throw new Exception('kairos.com API Client Library requires the CURL PHP extension.');

class FaceAPI
{
   private $apiID;
   private $apiKey;
   private $format;
   private $usage = '';
   static public $name = 'kairos';
   static public $detectrate = 4; // max 4 request in //
   static public $recorate = 3; // max 3 request in //

   private $userAuth = array();

   public function __construct($apiID, $apiKey = "")
   {
      $this->apiID    = $apiID;
      $this->apiKey    = $apiKey;
      $this->format    = 'json';
   }


   // *************
   // Faces Methods
   // *************

   public function faces_detect($url = null)
   {
      $json = $this->call_method(
         "detect",
         array(
            "image" => str_replace(' ', '%20', $url),
            "selector" => "FACE",
         )
      );
      if(!is_array($json))
         throw new Exception("face_detect: Unexpected answer ".print_r($json, true));

      $faces = array();

      if(isset($json['Errors']) && $json['Errors'][0]['Message'] === 'no faces found in the image')
         return $faces;

      foreach($json['images'][0]['faces'] as $face) {
         $faces[] = array(
            'x' => $face['topLeftX'],
            'y' => $face['topLeftY'],
            'width' => $face['width'],
            'height' => $face['height'],
         );
      }
      return $faces;
   }

   public function faces_enroll($url, $name, $face_id)
   {
      global $face_namespace;

      if($face_id != 0)
         return; // kairos only allows enrolling 1 face per pic!

      $json = $this->call_method(
         "enroll",
         array(
            "image" => str_replace(' ', '%20', $url),
            "subject_id" => "$name",
            "gallery_name" => "$face_namespace",
            "multiple_faces" => false,
            "selector" => "FACE",
         )
      );
      if($json == NULL
         || !isset($json['images']))
         throw new Exception("Cannot train kairos.com with picture of $name (face #$face_id of $url).".print_r($json, true));
   }

   public function faces_trydetect($url, $face_id)
   {
      global $face_namespace;
      $bestmatch = Face::$default_name;

      if($face_id != 0)
         return $bestmatch;

      $json = $this->call_method(
         "recognize",
         array(
            "image" => str_replace(' ', '%20', $url),
            "gallery_name" => "$face_namespace",
         )
      );
      if(!is_array($json) ||
         !isset($json['images'])
         || !isset($json['images'][0]))
         return Face::$default_name;

      if(!isset($json['images'][0]['transaction']) || $json['images'][0]['transaction']['status'] === 'failure')
         return Face::$default_name;

      return $json['images'][0]['transaction']['subject'];
   }

   public function getUsage() {
      return $this->usage;
   }


   // ***************
   // Private methods
   // ***************

   protected function call_method($method, $params = array(), $get = false)
   {
      foreach ($params as $key => $value)
      {
         if (empty($value))
            unset($params[$key]);
      }

      $request = "$method";
      if($get) {
         $request = "$method?".http_build_query($params);
         $params = array();
      }

      return $this->post_request($request, $params);
   }

   protected function post_request($request, $params)
   {
      $url = API_SERVER . "$request";
      $ch = curl_init();
      curl_setopt($ch, CURLOPT_URL, $url);
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
      curl_setopt($ch, CURLOPT_HEADER, FALSE);

      if(count($params) > 0) {
         curl_setopt($ch, CURLOPT_POST, TRUE);
         curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));
      }

      curl_setopt($ch, CURLOPT_HTTPHEADER, array(
         "Content-Type: application/json",
         "app_id: ".$this->apiID,
         "app_key: ".$this->apiKey
      ));

      curl_setopt($ch, CURLOPT_TIMEOUT, 20);
      $rawData = curl_exec($ch);
      curl_close($ch);

      return $this->toObject($rawData);
   }

   protected function toObject($rawData)
   {
      return json_decode($rawData, true);
   }
}
?>



