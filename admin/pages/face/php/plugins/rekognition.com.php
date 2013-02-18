<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * rekognition.com API
 * Strongly inspired by the face.com php API.
 */

define ("API_SERVER", "http://rekognition.com/func/api/");
define ("API_DEBUG", false);


if(!isset($GLOBALS['face_pub']) || $GLOBALS['face_pub'] === ''
   || !isset($GLOBALS['face_key']) || $GLOBALS['face_key'] === '')
   Pages_Face_Index::failAction();

if (!function_exists('curl_init'))  throw new Exception('rekognition.com API Client Library requires the CURL PHP extension.');

class FaceAPI
{	
   private $apiKey;
   private $apiSecret;	
   private $password;
   private $format;
   private $http_method;
   private $asRawData;

   private $userAuth = array();

   public function __construct($apiKey, $apiSecret, $password = null, $asRawData = false, $format = 'json')
   {
      $this->apiKey    = $apiKey;
      $this->apiSecret = $apiSecret;				
      $this->password  = $password;
      $this->asRawData = $asRawData;

      if (!$asRawData)
         $this->format    = 'json';
   }


   public function faces_detect($url = null)
   {
      $faces = array();
      $json =  $this->call_method("face", 
         array("urls" => $url)
      );
      if($json == NULL 
         || !isset($json['face_detection'])
         || count($json['face_detection']) == 0)
         return $faces;

      foreach($json['face_detection'] as $face) {
         $faces[] = array(
            'x' => $face['boundingbox']['tl']['x'],
            'y' => $face['boundingbox']['tl']['y'],
            'width' => $face['boundingbox']['size']['width'],
            'height' => $face['boundingbox']['size']['height']
         );
      }

      return $faces;
   }

   public function faces_trydetect($url = null)
   {
      $json =  $this->call_method("face_recognize", 
         array("urls" => $url)
      );
      if($json == NULL 
         || !isset($json['face_detection'])
         || count($json['face_detection']) == 0)
         return Face::$default_name;

      $names = $json['face_detection'][0]['name'];
      $names = explode(':', $names);
      if(count($names) < 2)
         return Face::$default_name;

      return str_replace('_', ' ', $names[0]);
   }	

   public function faces_enroll($url, $name)
   {
      $json =  $this->call_method("face_add_[".str_replace(' ', '_', $name)."]", 
         array("urls" => $url)
      );
      $json =  $this->call_method("face_train", 
         array()
      );

      return;
   }

   // ***************
   // Private methods
   // ***************

   protected function call_method($method, $params = array())
   {
      foreach ($params as $key => $value)
      {
         if (empty($value))
            unset($params[$key]);
      }

      $authParams = array();

      $authParams['jobs'] = $method;

      if (!empty($this->apiKey))
         $authParams['api_key'] = $this->apiKey;

      if (!empty($this->apiSecret))
         $authParams['api_secret'] = $this->apiSecret;

      // Keep th auth keys first
      $params = array_merge($authParams, $params);    	    	

      return $this->post_request($params);
   }

   protected function post_request($params)
   {		
      $url = API_SERVER."?".http_build_query($params);

      if (API_DEBUG)
      {
         echo "REQUEST: $url?" .http_build_query($params);			
      }		

      $ch = curl_init();
      curl_setopt($ch, CURLOPT_URL, $url);
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
      curl_setopt($ch, CURLOPT_TIMEOUT, 20);
      $rawData = curl_exec($ch);
      curl_close($ch);    

      return $this->toObject($rawData);    	
   }

   protected function prep_lists()
   {
      $result = array();
      foreach (func_get_args() as $arg)
      {
         if (isset($arg))
         {
            if (is_array($arg))
               $arg = join(",", $arg);
            $result[] = $arg;
         }
         else
            $result[] = "";
      }

      return $result;
   }

   protected function toObject($rawData)
   {
      $result = null;

      if (!empty($rawData))
      {
         $result = json_decode($rawData, true);
      }

      return $result;
   }
}
?>


