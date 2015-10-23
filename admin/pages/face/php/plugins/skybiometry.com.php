<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * skybiometry.com API
 * Strongly inspired by the face.com php API.
 */

define ("API_SERVER", "http://api.skybiometry.com/fc/");
define ("API_DEBUG", false);

if(!isset($GLOBALS['face_namespace']) || $GLOBALS['face_namespace'] === ''
   || !isset($GLOBALS['face_pub']) || $GLOBALS['face_pub'] === ''
   || !isset($GLOBALS['face_key']) || $GLOBALS['face_key'] === '')
   Pages_Face_Index::failAction();


if (!function_exists('curl_init'))  throw new Exception('skybiometry.com API Client Library requires the CURL PHP extension.');

class FaceAPI
{
   private $apiKey;
   private $apiSecret;
   private $password;
   private $format;
   private $http_method;
   private $asRawData;
   private $usage = '';
   static public $name = 'skybiometry';
   static public $detectrate = 4; // max 4 request in //
   static public $recorate = 3; // max 3 request in //

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
      $json =  $this->call_method("faces/detect",
         array("urls" => $url)
      );
      if($json == NULL)
         throw new Exception("skybiometry.com did not respond!\n");

      $this->usage = $json['usage'];

      if(!isset($json['photos'])
         || !isset($json['photos'][0]['tags'])
         || count($json['photos'][0]['tags']) == 0)
         return $faces;

      foreach($json['photos'][0]['tags'] as $face) {
         $faces[] = array(
            'x' => $face['center']['x'] - $face['width']/2,
            'y' => $face['center']['y'] - $face['height']/2,
            'width' => $face['width'],
            'height' => $face['height'],
            'scaled' => true,
         );
      }

      return $faces;
   }

   public function faces_trydetect($url, $face_id)
   {
      global $face_namespace;
      $json =  $this->call_method("account/users",
         array("namespaces" => $face_namespace)
      );
      if($json == NULL
         || !isset($json['users'])
         || !isset($json['users'][$face_namespace])) {
            return Face::$default_name;
         }

      $uids = implode(',', $json['users'][$face_namespace]);

      $json2 =  $this->call_method("faces/recognize",
         array(
            "uids" => $uids,
            "urls" => $url
         )
      );

      if($json2 === NULL
         || !isset($json2['photos'])
         || !isset($json2['photos'][0])
         || !isset($json2['photos'][0]['tags'])
         || !isset($json2['photos'][0]['tags'][$face_id])
         || !isset($json2['photos'][0]['tags'][$face_id]['uids'])) {
            return Face::$default_name;
         }

      $best = 0;
      $bestmatch = Face::$default_name;
      foreach($json2['photos'][0]['tags'][0]['uids'] as $v) {
         if($v['confidence'] > $best) {
            $best = $v['confidence'];
            $bestmatch = str_replace('@'.$face_namespace, '', $v['uid']);
         }
      }

      return $bestmatch;
   }

   public function faces_enroll($url, $name, $face_id)
   {
      global $face_namespace;
      $json =  $this->call_method("faces/detect",
         array("urls" => $url)
      );
      if($json == NULL
         || !isset($json['photos'])
         || !isset($json['photos'][0]['tags'])
         || !isset($json['photos'][0]['tags'][$face_id]))
         return $json;

      $json2 =  $this->call_method("tags/save",
         array(
            'tids' => $json['photos'][0]['tags'][$face_id]['tid'],
            'uid' => $name.'@'.$face_namespace
         )
      );

      if($json2 == NULL || (is_array($json2) && isset($json2['failure'])))
         throw new Exception("Error enrolling $url $name".print_r($json2, true));

      $json3 =  $this->call_method("faces/train",
         array(
            'uids' => $name.'@'.$face_namespace
         )
      );
      return $json3;
   }

   public function getUsage() {
      return $this->usage;
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

      if (!empty($this->apiKey))
         $authParams['api_key'] = $this->apiKey;

      if (!empty($this->apiSecret))
         $authParams['api_secret'] = $this->apiSecret;

      $params = array_merge($authParams, $params);
      $request = "$method.$this->format";

      return $this->post_request($request, $params);
   }

   protected function post_request($request, $params)
   {
      $url = API_SERVER . "$request";

      if (API_DEBUG)
      {
         echo "REQUEST: $url?" .http_build_query($params);
      }

      $ch = curl_init();
      curl_setopt($ch, CURLOPT_URL, $url);
      curl_setopt($ch, CURLOPT_POST, 1);
      curl_setopt($ch, CURLOPT_POSTFIELDS, $params);
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

