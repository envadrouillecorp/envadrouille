<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * Functions to perform the automatic update of the gallery
 */

$GLOBALS['patch_dir'] = "./patch";

/* From Horde */
require_once("diff.php");
require_once("Diff/Op/Base.php");
require_once("Diff/Op/Add.php");
require_once("Diff/Op/Change.php");
require_once("Diff/Op/Copy.php");
require_once("Diff/Op/Delete.php");
require_once("Diff/Engine/Native.php");
require_once("Diff/ThreeWay/Op/Base.php");
require_once("Diff/ThreeWay/Op/Copy.php");
require_once("Diff/ThreeWay/BlockBuilder.php");
require_once("Diff/ThreeWay.php");

function unzip($zipfile) {
    $zip = zip_open($zipfile);
    while ($zip_entry = zip_read($zip))    {
        zip_entry_open($zip, $zip_entry);
        if (substr(zip_entry_name($zip_entry), -1) == '/') {
            $zdir = substr(zip_entry_name($zip_entry), 0, -1);
            if (file_exists($zdir)) {
                trigger_error('Directory "<b>' . $zdir . '</b>" exists', E_USER_ERROR);
                return false;
            }
            mkdir($zdir);
        }
        else {
            $name = zip_entry_name($zip_entry);
            if (file_exists($name)) {
                trigger_error('File "<b>' . $name . '</b>" exists', E_USER_ERROR);
                return false;
            }
            $fopen = fopen($name, "w");
            fwrite($fopen, zip_entry_read($zip_entry, zip_entry_filesize($zip_entry)), zip_entry_filesize($zip_entry));
        }
        zip_entry_close($zip_entry);
    }
    zip_close($zip);
    return true;
}

function get_update_zip() {
   global $VERSION, $patch_dir;

   $ret = new File_Dir($patch_dir);
   if($ret->exists())
      $ret->remove();

   $ret = @mkdir($patch_dir,0744,true);
   if($ret === FALSE)
      throw new Exception("Cannot create patch dir at $patch_dir (permission denied)");

   $NVERSION = file_get_contents("http://update.envadrouille.org/VERSION");
   if($NVERSION == FALSE)
      return array('success' => FALSE);
   $rev = preg_replace('/remote_check_version\({"version":(\d+)}\).*/s', "$1", $NVERSION);

   if(!copy("http://update.envadrouille.org/patch-stable-$VERSION-stable-$rev.zip", "$patch_dir/patch.zip"))
      return array('success' => FALSE);

   chdir($patch_dir);
   unzip("patch.zip");
   return array(
      'success' => TRUE,
      'json' => json_decode(file_get_contents("diff.json"), true),
   );
}

function update_file($file, $binary) {
   global $patch_dir;
   $curr_file = "../$file";
   if(!file_exists($curr_file) || $binary) {
      $ret = copy("$patch_dir/envadrouille/$file.last", "$patch_dir/envadrouille/$file.merged");
      return array('success' => $ret, 'reason' => "file does not exist $curr_file => create it");
   } else {
      $engine = new Horde_Text_Diff_ThreeWay(
         explode("\n", str_replace("\r", '', file_get_contents("$patch_dir/envadrouille/$file.orig"))),
         explode("\n", str_replace("\r", '', file_get_contents("$patch_dir/envadrouille/$file.last"))),
         explode("\n", str_replace("\r", '', file_get_contents($curr_file)))
      );
      if($engine->nbConflicts() > 0) {
         return array(
            'success' => false,
            'merge' => implode("\n", $engine->mergedOutput())
         );
      } else {
         $ret = file_put_contents("$patch_dir/envadrouille/$file.merged", implode("\n", $engine->mergedOutput()));
         return array(
            'success' => $ret,
            'reason' => "no conflict",
         );
      }
   }
}

function update_file_manually($file, $content) {
   global $patch_dir;
   if($content === '{new}') {
       $ret = copy("$patch_dir/envadrouille/$file.last", "$patch_dir/envadrouille/$file.merged");
   } else if($content === '{old}') {
       $ret = copy("../$file", "$patch_dir/envadrouille/$file.merged");
   } else {
       $ret = file_put_contents("$patch_dir/envadrouille/$file.merged", $content);
   }
   return array(
      'success' => $ret,
   );
}

function check_rights($files) {
   global $patch_dir;
   $err = array();
   //check write permission before destroying everything
   foreach($files as $f) {
      $file = new File('../'.$f['file']);
      if(!$file->isWritable()) {
         $err[] = $f;
      }
   }
   return $err;
}

function finish_merge($files) {
   global $patch_dir;
   $err = check_rights($files);
   if(count($err))
      return $err;

   foreach($files as $ff) {
      $f = $ff['file'];
      $ret = rename("$patch_dir/envadrouille/$f.merged", '../'.$f);
      if(!filesize('../'.$f))
         unlink('../'.$f);
   }

   $ret = new File_Dir($patch_dir);
   if($ret->exists())
      $ret->remove();

   return $err;
}
?>
