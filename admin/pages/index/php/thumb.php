<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * A thumb
 */

class Thumb extends File_Pic {
   public $width;
   public $height;
   public $crop;
   public $basepic;

   public function __construct($path, $name = '', $basepic = null, $width = 0, $height = 0, $crop = false, $_quality = 0) {
      global $quality;
      if($path != '-')
         parent::__construct($path, $name);
      else
         $this->completePath = '-';
      if($_quality != 0)
         $quality = $_quality;
      $this->basepic = $basepic;
      $this->width = $width;
      $this->height = $height;
      $this->crop = $crop;
   }

   public function isMainThumb() {
      return preg_match('/^index_.\./', $this->name);
   }

   public function create() {
      if(!$this->basepic->exists())
         throw new Exception("Cannot read file at ".$this->basepic->completePath);
      if($this->completePath != '-' && !$this->isWritable())
         throw new Exception("Cannot create file at $this->completePath (permission denied)");
      if($this->completePath != '-')
         $this->remove();

      if($this->width > 500 || $this->width > 500 || !function_exists("imagecreatefromjpeg")) {
         $this->createThumbImgmagick();
      } else {
         $this->createThumbGD();
      }

      if($this->completePath != '-')
         @chmod($this->completePath, 0744);
   }

   protected function getSourceImgGD() {
      $base_ext = strtolower($this->extension);
      if($base_ext == "jpg") {
         $source = @imagecreatefromjpeg($this->basepic->completePath);
      } else if ($base_ext == "gif") {
         $source = @imagecreatefromgif($this->basepic->completePath);
      } else if ($base_ext == "png") {
         $source = @imagecreatefrompng($this->basepic->completePath);
      } else {
         $source = @imagecreatefromjpeg($this->basepic->completePath);
      }
      if($source == NULL) {
         $err = error_get_last();
         throw new Exception("Error when working on ".$this->basepic->completePath.": ".$err['message']);
      }
      $exif = $this->basepic->readExif();
      if($exif !== FALSE && isset($exif['IFD0']['Orientation'])) {
         switch($exif['IFD0']['Orientation']) {
         case 8:
            $source = imagerotate($source,90,0);
            break;
         case 3:
            $source = imagerotate($source,180,0);
            break;
         case 6:
            $source = imagerotate($source,-90,0);
            break;
         }
      }
      return $source;
   }

   private function createThumbGD() {
      global $quality;

      if(!function_exists("imagecreatefromjpeg")) // GD support does not exists
         throw new Exception("PHP was compiled without GD support. Install GD or configure ImageMagick in the options.");

      $source = $this->getSourceImgGD();

      $orig_w = $src_width  = imagesx($source);
      $orig_h = $src_height = imagesy($source);

      $dest_width = $this->width;
      $dest_height = $this->height;
      $orig_x = $orig_y = 0;

      if($this->crop) {
         if(((int)(100*$src_width/$src_height)) < ((int)(100*$dest_width/$dest_height))) {
            $src_width = (int)($src_height*$dest_width/$dest_height);
         } else if(((int)(100*$src_width/$src_height)) > ((int)(100*$dest_width/$dest_height))) {
            $src_height = (int)($src_width*$dest_height/$dest_width);
         }

         if($src_width > $orig_w)
            $src_width = $orig_w;
         if($src_height > $orig_h)
            $src_height = $orig_h;

         if(((int)(100*$src_width/$src_height)) < ((int)(100*$dest_width/$dest_height))) {
            $src_height = (int)($src_width*$dest_height/$dest_width);
         } else if(((int)(100*$src_width/$src_height)) > ((int)(100*$dest_width/$dest_height))) {
            $src_width = (int)($src_height*$dest_width/$dest_height);
         }

         // Lets center the picture
         $orig_x = - ($src_width - $orig_w) / 2;
         $orig_y = - ($src_height - $orig_h) / 2;
      } else { // else reduce
         if ($src_width < $dest_width) {
            $dest_width = $src_width;
         }
         $tmp_dest_height = $src_height * $dest_width / $src_width;
         if($dest_height != 0 && $tmp_dest_height > $dest_height) {
            $dest_width = $src_width * $dest_height / $src_height;
         } else {
            $dest_height = $tmp_dest_height;
         }
      }

      $im = imagecreatetruecolor ($dest_width, $dest_height);
      imagecopyresampled($im, $source, 0, 0, $orig_x, $orig_y, $dest_width, $dest_height, $src_width, $src_height);

      if($this->completePath != '-')
         imagejpeg($im, $this->completePath, $quality);
      else
         imagejpeg($im, NULL, $quality);
      imagedestroy($im);
      imagedestroy($source);
   }

   private function createThumbImgmagick() {
      global $convert, $quality;
      if($convert == "" || @is_executable($convert) !== TRUE)
         return $this->createThumbGD();

      $dest_width = $this->width;
      $dest_height = $this->height;

      $size = $this->basepic->getSize();
      if($size === FALSE || $size[0] == 0 || $size[1] == 0) {
         $err = error_get_last();
         throw new Exception("Error when working on ".$this->basepic->completePath.": Cannot determine image size. Check that the picture is not corrupted.");
      }

      $src_width = $size[0];
      $src_height = $size[1];

      $exif = $this->basepic->readExif();
      if($exif !== FALSE && isset($exif['IFD0']['Orientation'])) {
         switch($exif['IFD0']['Orientation']) {
         case 6:
         case 8:
            $tmp = $src_height;
            $src_height = $src_width;
            $src_width = $tmp;
         }
      }

      if ($src_width < $dest_width)
         $dest_width = $src_width;

      $ret = 0;
      $output = array();
      if(!$this->crop) {
         $tmp_dest_height = $src_height * $dest_width / $src_width;
         if($dest_height != 0 && $tmp_dest_height > $dest_height) {
            $dest_width = $src_width * $dest_height / $src_height;
         } else {
            $dest_height = $tmp_dest_height;
         }
         if($this->completePath == "-") {
            $cmd = $convert.' -auto-orient -limit thread 1 "'.$this->basepic->completePath.'" -quality '.$quality.' -scale '.$dest_width.'x'.$dest_height.' -';
            passthru($cmd, $ret);
         } else {
            $cmd = $convert.' -auto-orient -limit thread 1 "'.$this->basepic->completePath.'" -quality '.$quality.' -resize '.$dest_width.'x'.$dest_height.' "'.$this->completePath.'"';
            exec($cmd, $output, $ret);
         }
      } else {
         if($dest_width > $src_width || $dest_height > $src_height) {
            exec($convert.' -auto-orient -limit thread 1 "'.$this->basepic->completePath.'" -quality '.$quality.' -gravity center -crop '.$dest_width.'x'.$dest_height.'+0+0 +repage "'.$this->completePath.'"', $output, $ret);
         } else {
            exec($convert.' -auto-orient -limit thread 1 "'.$this->basepic->completePath.'" -quality '.$quality.' -resize "'.$dest_width.'x'.$dest_height.'^" -gravity center -crop '.$dest_width.'x'.$dest_height.'+0+0 +repage "'.$this->completePath.'"', $output, $ret);
         }
      }
      if($this->completePath != '-' && !$this->exists())
         throw new Exception("Failed to create picture $this->completePath\nThis is probably due to temporary server overload.\nTry to update the directory again.\nImageMagick output (return value $ret):\n".implode("\n", $output)."\n");
   }


   function create_thumb($file, $thumb, $dest_width, $dest_height = 0) {
      if($dest_width > 500 || $dest_height > 500) {
         create_thumb_imagick($file, $thumb, $dest_width, $dest_height);
      } else {
         create_thumb_gd($file, $thumb, $dest_width, $dest_height);
      }
   }
};

