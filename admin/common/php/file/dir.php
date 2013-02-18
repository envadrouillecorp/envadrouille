<?
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * A directory
 */

class File_Dir extends File {
   private $files = null;
   private $_ignore_hidden_files;

   public function __construct($path, $name = '', $check_existence = false, $ignore_hidden = true) {
      parent::__construct($path, $name, $check_existence);
      $this->_ignore_hidden_files = $ignore_hidden;
      $this->extension = '';
   }

   public function getFiles() {
      if($this->files !== null)
         return $this->files;

      $this->files = array();

      if(!$this->exists())
         return $this->files;

      $d = opendir($this->completePath);
      while ($file = readdir($d)){
         if(($this->_ignore_hidden_files && $file[0] == "."))                  // ignore hidden files
            continue;
         if((!$this->_ignore_hidden_files && ($file == "." || $file == ".."))) // always ignore . and ..
            continue;
         $this->files[] = File_Factory::getFile($this->completePath, $file);
      }

      return $this->files;
   }

   protected function _getFilesFiltered($filter, $limit) {
      $this->getFiles();

      $ret = array();
      $count = 0;

      foreach($this->files as $file) {
         if($file instanceof $filter) {
            $ret[] = $file;
            $count++;
            if($count == $limit)
               break;
         }
      }

      return $ret;
   }

   public function getDirs($limit=0) {
      return $this->_getFilesFiltered('File_Dir', $limit);
   }

   public function getPics($limit = 0) {
      return $this->_getFilesFiltered('File_Pic', $limit);
   }

   public function getMovies($limit = 0) {
      return $this->_getFilesFiltered('File_Movie', $limit);
   }

   public function getGPXs($limit = 0) {
      return $this->_getFilesFiltered('File_GPX', $limit);
   }

   public function getJSONs($limit = 0) {
      return $this->_getFilesFiltered('File_JSON', $limit);
   }

   public function remove() {
      //TODO: Remove getJsonCacheDir and getThumbCacheDir directories as well

      if($this->_ignore_hidden_files) {
         $this->_ignore_hidden_files = false;
         $this->files = null;
         $this->getFiles();
      }

      foreach ($this->files as $file) {
         $file->remove();
      }
      rmdir($this->completePath);
	}
}

