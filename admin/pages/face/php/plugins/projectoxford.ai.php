<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * projectoxford.ai API -- does not work well due to insane rate limits
 * Thus we disable face recognition and only allow face detection
 * Strongly inspired by the face.com php API.
 */

define ("API_SERVER", "https://api.projectoxford.ai/face/v0/");

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
   static public $name = 'projectoxford';
   static public $detectrate = 1; // max 1 request in //
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
         "detections",
         array(
            "url" => str_replace(' ', '%20', $url),
            "selector" => "FACE",
         )
      );
      $this->check_json('faces_detect', $json);

      $faces = array();

      foreach($json as $face) {
         $faces[] = array(
            'x' => $face['faceRectangle']['left'],
            'y' => $face['faceRectangle']['top'],
            'width' => $face['faceRectangle']['width'],
            'height' => $face['faceRectangle']['height'],
            'uid' => $face['faceId'],
         );
      }
      return $faces;
   }

   public function faces_enroll($url, $name, $face_id, $face_uid = null, $recurs = 0)
   {
      /*
      global $face_namespace;

      if($recurs > 2)
         throw new Exception("Infinite loop in faces_enroll! $url");

      if($recurs == 0)
         $this->create_persongroup();

      if($face_uid === null) {
         $face_uid = $this->get_face_uid($url, $face_id);
         if($face_uid === null)
            return;
         return $this->faces_enroll($url, $name, $face_id, $face_uid, $recurs + 1);
      }

      $json = $this->call_method(
         "persongroups/$face_namespace/persons",
         array(),
         true
      );
      $this->check_json('faces_enroll', $json);

      $uid = '';
      foreach($json as $person) {
         if($person['name'] === $name) {
            $uid = $person['personId'];
            break;
         }
      }

      if($uid === '') {
         $json = $this->call_method(
            "persongroups/$face_namespace/persons",
            array(
               "faceIds" => array(),
               "name" => $name,
               "userData" => "none",
            )
         );
         $this->check_json('faces_enroll', $json);
         if(!isset($json['personId']))
            throw new Exception("Cannot add $name ".print_r($json, true));
         $uid = $json['personId'];
      }

      $json = $this->call_method(
         "persongroups/$face_namespace/persons/$uid/faces/$face_uid",
         array("userData" => "none"),
         "PUT"
      );
      if(is_array($json)) {
         if(isset($json['code']) && $json['code'] === 'QuoteExceeded')
            return;
         if(isset($json['code']) && $json['code'] === 'FaceNotFound') {
            $face_uid = $this->get_face_uid($url, $face_id);
            if($face_uid === null)
               return;
            return $this->faces_enroll($url, $name, $face_id, $face_uid, $recurs + 1);
         }
         if(isset($json['message']))
            throw new Exception("Error in faces_enroll ".print_r($json, true));
      }

      $json = $this->call_method(
         "persongroups/$face_namespace/training"
      );
      */

      return;
   }

   public function faces_trydetect($url, $face_id, $face_uid = null, $recurs = 0)
   {
      return Face::$default_name;

      /*
      global $face_namespace;
      $bestmatch = Face::$default_name;

      if($recurs > 2)
         throw new Exception("Infinite loop in faces_trydetect! $url");

      if($recurs == 0)
         $this->create_persongroup();

      if($face_uid == null) {
         $face_uid = $this->get_face_uid($url, $face_id);
         if($face_uid === null)
            return $bestmatch;
         return $this->faces_trydetect($url, $face_id, $face_uid, $recurs + 1);
      }

      $json = $this->call_method(
         "identifications",
         array(
            "faceIds" => array($face_uid),
            "personGroupId" => $face_namespace,
            "maxNumOfCandidatesReturned" => 1,
         )
      );
      if(!is_array($json))
         throw new Exception("face_detect: Unexpected answer ".print_r($json, true));
      if(isset($json['code']) && $json['code'] == "FaceNotFound") // Face cache expired
         return $this->faces_trydetect($url, $face_id, null, $recurs + 1);
      if(isset($json['message']))
         throw new Exception("Error: ".print_r($json, true));

      if(!isset($json[0]) || !isset($json[0]['candidates']) || !isset($json[0]['candidates'][0]))
         return $bestmatch;
      $bestuid = $json[0]['candidates'][0]['personId'];


      $json2 = $this->call_method(
         "persongroups/$face_namespace/persons/$bestuid",
         array(),
         true
      );
      if(!is_array($json2))
         throw new Exception("face_detect: Unexpected answer ".print_r($json2, true));
      if(isset($json2['message']))
         throw new Exception("Error: ".print_r($json2, true));

      $bestmatch = $json2['name'];
      return $bestmatch;
       */
   }

   public function getUsage() {
      return $this->usage;
   }


   // ***************
   // Private methods
   // ***************

   protected function create_persongroup() {
      global $face_namespace;
      $json = $this->call_method(
         "persongroups",
         array(),
         true
      );
      $this->check_json('create_persongroup', $json);

      foreach($json as $persongroup) {
         if($persongroup['name'] === $face_namespace)
            return;
      }

      $json = $this->call_method(
         "persongroups/$face_namespace",
         array(
            "name" => "$face_namespace",
            "userData" => "none",
         ),
         "PUT"
      );
      if(is_array($json) && isset($json['message']))
         throw new Exception("Error creating person group ".print_r($json, true));
   }

   protected function get_face_uid($url, $face_id) {
      $json = $this->call_method(
         "detections",
         array(
            "url" => str_replace(' ', '%20', $url),
            "selector" => "FACE",
         )
      );
      $this->check_json('faces_trydetect', $json);
      if(!isset($json[$face_id]))
         return null;
      return $json[$face_id]['faceId'];
   }

   protected function check_json($func, $json) {
      if(!is_array($json))
         throw new Exception("$func - Unexpected answer ".print_r($json, true));
      if(isset($json['message']))
         throw new Exception("Error: ".print_r($json, true));
   }

   protected function call_method($method, $params = array(), $get = false)
   {
      foreach ($params as $key => $value)
      {
         if (empty($value))
            unset($params[$key]);
      }

      $request = "$method";

      if($get === true) {
         $request = "$method?".http_build_query($params);
         $params = array();
      }

      return $this->post_request($request, $params, $get);
   }

   protected function post_request($request, $params, $get)
   {
      $url = API_SERVER . "$request";
      $ch = curl_init();
      curl_setopt($ch, CURLOPT_URL, $url);
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
      curl_setopt($ch, CURLOPT_HEADER, FALSE);

      if($get === "PUT") {
         curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
      } else if($get === false) {
         curl_setopt($ch, CURLOPT_POST, TRUE);
      }
      if(count($params) > 0) {
         curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));
      }

       curl_setopt($ch, CURLOPT_HTTPHEADER, array(
          //"Content-Type: application/octet-stream",
         "Content-Type: application/json",
         "Ocp-Apim-Subscription-Key: ".$this->apiKey,
      ));


      curl_setopt($ch, CURLOPT_TIMEOUT, 20);
      if(isset($GLOBALS['face_disable_ssl']) && $GLOBALS['face_disable_ssl'] !== '')
         curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
      $rawData = curl_exec($ch);
      if(curl_errno($ch))
         throw new Exception("Curl error (if this is a SSL certificate error, see the options or configure certificates on your server):\n".curl_error($ch));
      
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

