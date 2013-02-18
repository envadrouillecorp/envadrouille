<?
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * animetrics.com API
 * Strongly inspired by the face.com php API.
 */

define ("API_SERVER", "http://api.animetrics.com/v1/");

if(!isset($GLOBALS['face_namespace']) || $GLOBALS['face_namespace'] === ''
   || !isset($GLOBALS['face_pub']) || $GLOBALS['face_pub'] === '')
   Pages_Face_Index::failAction();

if (!function_exists('curl_init'))  throw new Exception('animetrics.com API Client Library requires the CURL PHP extension.');

class FaceAPI
{	
   private $apiKey;
   private $apiSecret;	
   private $format;

   private $userAuth = array();

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
         "detect", 
         array(
            "url" => $url,
            "selector" => "FACE"
         )
      );
      if(!is_array($json) || !isset($json['images']))
         throw new Exception("face_detect: Unexpected answer ".print_r($json, true));

      $faces = array();
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

   public function faces_enroll($url, $name)
   {
      global $face_namespace;
      $json = $this->call_method(
         "detect", 
         array(
            "url" => $url,
            "selector" => "FACE"
         )
      );
      if(!is_array($json) || !isset($json['images']))
         return;

      //var_dump($json);
      if(!isset($json['images'])
         || !isset($json['images'][0])
         || !isset($json['images'][0]['faces'])
         || !isset($json['images'][0]['faces'][0]))
         return;

      $json2 = $this->call_method(
         "enroll", 
         array(
            "url" => $url,
            "subject_id" => "$name",
            "gallery_id" => "$face_namespace",
            'image_id' => $json['images'][0]['image_id'],
            'topLeftX' => $json['images'][0]['faces'][0]['topLeftX'],
            'topLeftY' => $json['images'][0]['faces'][0]['topLeftY'],
            'width' => $json['images'][0]['faces'][0]['width'],
            'height' => $json['images'][0]['faces'][0]['height'],
         ),
         true
      );
      if($json2 == NULL
         || !isset($json2['images']))
         return;
   }

   public function faces_trydetect($url)
   {
      global $face_namespace;
      $json = $this->call_method(
         "detect", 
         array(
            "url" => $url,
            "selector" => "FACE"
         )
      );
      if(!is_array($json) || !isset($json['images']))
         return;


      if(!isset($json['images'])
         || !isset($json['images'][0])
         || !isset($json['images'][0]['faces'])
         || !isset($json['images'][0]['faces'][0]))
         return Face::$default_name;

      $json2 = $this->call_method(
         "recognize", 
         array(
            "url" => $url,
            "gallery_id" => "$face_namespace",
            'image_id' => $json['images'][0]['image_id'],
            'topLeftX' => $json['images'][0]['faces'][0]['topLeftX'],
            'topLeftY' => $json['images'][0]['faces'][0]['topLeftY'],
            'width' => $json['images'][0]['faces'][0]['width'],
            'height' => $json['images'][0]['faces'][0]['height'],
         ),
         true
      );
      if($json2 == NULL
         || !isset($json2['images']))
         return Face::$default_name;
      if(count($json2['images'][0]['candidates']) == 0)
         return Face::$default_name;

      $best = 0;
      $bestmatch = Face::$default_name;
      foreach($json2['images'][0]['candidates'] as $c=>$v) {
         if($v > $best) {
            $best = $v;
            $bestmatch = $c;
         }
      }
      return $bestmatch;
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

      $authParams = array();

      if (!empty($this->apiKey))
         $authParams['api_key'] = $this->apiKey;

      $params = array_merge($authParams, $params);    	    	

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
      if(count($params) > 0) {
         curl_setopt($ch, CURLOPT_POST, 1);    	
         curl_setopt($ch, CURLOPT_POSTFIELDS, $params);
      }
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
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


