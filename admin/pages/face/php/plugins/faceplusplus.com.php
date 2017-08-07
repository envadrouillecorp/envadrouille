<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * animetrics.com API
 * Strongly inspired by the face.com php API.
 */

define ("API_SERVER", "https://apius.faceplusplus.com/v2/");

if(!isset($GLOBALS['face_namespace']) || $GLOBALS['face_namespace'] === ''
   || !isset($GLOBALS['face_pub']) || $GLOBALS['face_pub'] === ''
   || !isset($GLOBALS['face_key']) || $GLOBALS['face_key'] === '')
   Pages_Face_Index::failAction();

if (!function_exists('curl_init'))  throw new Exception('kairos.com API Client Library requires the CURL PHP extension.');

class FaceAPI
{
   private $apiKey;
   private $apiSecret;
   private $format;
   private $usage = '';
   private $userAuth = array();
   static public $name = 'faceplusplus';
   static public $detectrate = 2; // max 2 request in //
   static public $recorate = 1; // max 1 request in //

   public function __construct($apiKey, $apiSecret = "")
   {
      $this->apiKey    = $apiKey;
      $this->apiSecret = $apiSecret;
      $this->format    = 'json';
   }


   // *************
   // Faces Methods
   // *************

   public function faces_detect($url = null)
   {
      $json = $this->call_method(
         "detection/detect",
         array(
            "url" => str_replace(' ', '%20', $url),
            "selector" => "FACE",
         )
      );
      if(!is_array($json))
         throw new Exception("face_detect: Unexpected answer ".print_r($json, true));

      if(isset($json['error']))
         throw new Exception("Error: ".print_r($json, true));

      $faces = array();

      if(!isset($json['face']))
         return $faces;

      foreach($json['face'] as $face) {
         $faces[] = array(
            'x' => $face['position']['center']['x'] - $face['position']['width']/2,
            'y' => $face['position']['center']['y'] - $face['position']['height']/2,
            'width' => $face['position']['width'],
            'height' => $face['position']['height'],
            'scaled' => true,
            'uid' => $face['face_id'],
         );
      }
      return $faces;
   }

   public function faces_enroll($url, $name, $face_id, $uid = null)
   {
      global $face_namespace;

      if($uid == null)
         $uid = $this->get_face_uid($url, $face_id);
      if($uid == null)
         return;

      $nameuid = $this->get_name_uid($name);

      $json = $this->call_method(
         "/person/add_face",
         array(
            "person_id" => $nameuid,
            "face_id" => $uid,
         )
      );

      if(!is_array($json)
         || !isset($json['success']))
         throw new Exception("Cannot enroll $name ".print_r($json, true));

      $json = $this->call_method(
         "/train/identify",
         array(
            "group_name" => $face_namespace,
         )
      );

      return;
   }

   public function faces_trydetect($url, $face_id)
   {
      global $face_namespace;
      $bestmatch = Face::$default_name;

      $json = $this->call_method(
         "recognition/identify",
         array(
            "url" => str_replace(' ', '%20', $url),
            "group_name" => $face_namespace,
         )
      );


      if(!is_array($json)
         || !isset($json['face'])
         || !isset($json['face'][$face_id])
         || !isset($json['face'][$face_id]['candidate']))
         return $bestmatch;

      $best = 0;
      foreach($json['face'][$face_id]['candidate'] as $c) {
         if($c['confidence'] > $best) {
            $best = $c['confidence'];
            $bestmatch = $c['person_name'];
         }
      }

      return $bestmatch;
   }

   public function getUsage() {
      return $this->usage;
   }


   // ***************
   // Private methods
   // ***************

   protected function get_name_uid($name) {
      global $face_namespace;
      $json = $this->call_method(
         "/person/get_info",
         array(
            "person_name" => $name,
            "group_name" => $face_namespace,
         )
      );

      if(!is_array($json)
         || !isset($json['person_id'])) {
            $json = $this->call_method(
            "/group/create",
            array(
               "group_name" => $face_namespace,
            )
         );

         $json = $this->call_method(
            "/person/create",
            array(
               "person_name" => $name,
               "group_name" => $face_namespace,
            )
         );
         if(!is_array($json)
            || !isset($json['person_id']))
            throw new Exception("Cannot enroll $name ".print_r($json, true));
         return $json['person_id'];
      } else {
         return $json['person_id'];
      }
   }

   protected function get_face_uid($url, $face_id) {
      $json = $this->call_method(
         "detection/detect",
         array(
            "url" => str_replace(' ', '%20', $url),
            "selector" => "FACE",
         )
      );
      if(!is_array($json) || !isset($json['face']) || !isset($json['face'][$face_id]))
         return null;

      return $json['face'][$face_id]['face_id'];
   }

   protected function call_method($method, $params = array(), $get = true)
   {
      foreach ($params as $key => $value)
      {
         if (empty($value))
            unset($params[$key]);
      }

      $request = "$method";

      $authParams = array();

      if (!empty($this->apiKey))
         $authParams['api_key'] = $this->apiKey;

      if (!empty($this->apiSecret))
         $authParams['api_secret'] = $this->apiSecret;

      $params = array_merge($authParams, $params);

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

      curl_setopt($ch, CURLOPT_TIMEOUT, 20);
      if(isset($GLOBALS['face_disable_ssl']) && $GLOBALS['face_disable_ssl'] !== '')
         curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
      $rawData = curl_exec($ch);
      if(curl_errno($ch))
         throw new Exception("Curl error (if this is a SSL certificate error, see the options or configure certificates on your server):\n".curl_error($ch));
      curl_close($ch);

      return $this->toObject($rawData);
   }

   protected function toObject($rawData)
   {
      return json_decode($rawData, true);
   }
}
?>




