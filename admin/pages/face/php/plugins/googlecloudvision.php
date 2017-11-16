<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * animetrics.com API
 * Strongly inspired by the face.com php API.
 */

define ("API_SERVER", "https://vision.googleapis.com/v1/");

if(!isset($GLOBALS['face_namespace']) || $GLOBALS['face_namespace'] === ''
   || !isset($GLOBALS['face_pub']) || $GLOBALS['face_pub'] === '')
   Pages_Face_Index::failAction();

if (!function_exists('curl_init'))  throw new Exception('google cloud vision API Client Library requires the CURL PHP extension.');

class FaceAPI
{
   private $apiKey;
   private $format;
   private $usage = '';
   private $userAuth = array();
   static public $name = 'googlecloudvision';
   static public $detectrate = 4; // max 4 request in //
   static public $recorate = 4; // max 4 request in //

   public function __construct($apiKey, $apiSecret = "")
   {
      $this->apiKey    = $apiKey;
      $this->format    = 'json';
   }


   // *************
   // Faces Methods
   // *************

   public function faces_detect($url = null)
   {
      $json = $this->call_method(
         "images:annotate",
         array(
            "requests" => array(
               array(
                  "image" => array(
                     "source" => array(
                        "imageUri" => str_replace(' ', '%20', $url)
                     )
                  ),
                  "features" => array(
                     array(
                        "type" => "FACE_DETECTION",
                        "maxResults" => 10
                     )
                  )
               )
            )
         )
      );
      if(!is_array($json))
         throw new Exception("face_detect: Unexpected answer from Google Cloud vision:".print_r($json, true));

      if(isset($json['responses'][0]['error']) || isset($json['error']))
         throw new Exception("Error: ".print_r($json, true));

      
      $faces = array();
      if(!isset($json['responses'][0]['faceAnnotations'][0]['boundingPoly']))
         return $faces;

      foreach($json['responses'][0]['faceAnnotations'] as $face) {
         // Google has a bug... sometimes the array is only partially filled, and the default value doesn't seem to be 0, so well, ignore buggy faces...
         if(!isset($face['boundingPoly']['vertices'][0]['x'])
            || !isset($face['boundingPoly']['vertices'][0]['y'])
            || !isset($face['boundingPoly']['vertices'][2]['x'])
            || !isset($face['boundingPoly']['vertices'][2]['y']))
            continue;
         $faces[] = array(
            'x' => $face['boundingPoly']['vertices'][0]['x'],
            'y' => $face['boundingPoly']['vertices'][0]['y'],
            'width' => $face['boundingPoly']['vertices'][2]['x'] - $face['boundingPoly']['vertices'][0]['x'],
            'height' => $face['boundingPoly']['vertices'][2]['y'] - $face['boundingPoly']['vertices'][0]['y'],
         );
      }
      return $faces;
   }

   public function faces_enroll($url, $name, $face_id, $uid = null)
   {
      // Google does not support recognition
      return;
   }

   public function faces_trydetect($url, $face_id)
   {
      // Google does not support recognition
      global $face_namespace;
      $bestmatch = Face::$default_name;
      return $bestmatch;
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

      $request = "$method?key=".$this->apiKey;
      return $this->post_request($request, $params);
   }

   protected function post_request($request, $params)
   {
      $url = API_SERVER . "$request";
      $ch = curl_init();
      curl_setopt($ch, CURLOPT_URL, $url);
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
      curl_setopt($ch, CURLOPT_HEADER, FALSE);
      curl_setopt($ch, CURLOPT_HTTPHEADER,
         array('Content-Type: application/json')
      );
      curl_setopt($ch, CURLOPT_POST, TRUE);
      curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));

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




