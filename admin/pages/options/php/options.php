<?php
/*
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 * Automatically discover all configuration options of all pages
 */
class Options {
   public static $defaultContent = array('dirs', 'pics', 'vids');
   // Get a list of all pages in the pages/ dir
   public static function getPages($check_activation, $new_values = null) {
      $pages = array();
      $dir = new File_Dir("./pages");
      
      // Let index and options be the first two pages
      $pages['index'] = '';
      $pages['options'] = '';

      // Add a page for each directory in /pages
      foreach($dir->getDirs() as $d) {
         require_once ("$d->path/$d->name/index.php");
         $classn = Controller::getPluginIndex($d->name);
         $description = eval('return '.$classn.'::$description;');
         $include = eval('return '.$classn.'::$showOnMenu;');
         $optional = eval('return '.$classn.'::$isOptional;');
         $activated = false;
         if(!$optional) {
            $activated = true;
         } else {
            $activated = $new_values !== null && isset($new_values[$d->name.'_activated']) && $new_values[$d->name.'_activated'];
         }
         if($activated || !$check_activation) {
            $pages[$d->name] = array(
               'descr' => $description,
               'show' => $include,
               'url' => 'index.php?action='.$d->name,
            );
         }
      }
      return $pages;
   }

    public static function getPlugins($new_values) {
      $plugins = array();
      $dir = new File_Dir("./pages");
      
      foreach($dir->getDirs() as $d) {
         require_once ("$d->path/$d->name/index.php");
         $classn = Controller::getPluginIndex($d->name);
         $is_plugin = eval('return isset('.$classn.'::$userContentName);');
         $activated = isset($new_values[$d->name.'_activated']) && $new_values[$d->name.'_activated'];
         if($activated && $is_plugin) 
            $plugins[] = $d->name;
      }
      return $plugins;
   }


   // Get configuration hooks from all pages/ * /index.php files
   private static function optSort($a, $b) {
          if($a->name == "update")
              return -1;
          if($b->name == "update")
              return 1;
          if($a->name ==  "options")
              return -1;
          if($b->name ==  "options")
              return 1;
          return strcmp($a->name, $b->name);
      }

   public static function getOptions() {
      $options = array();
      $userContent = Options::$defaultContent;
      $oldUserContent = isset($GLOBALS['content_order'])?explode(',', $GLOBALS['content_order']):$userContent;

      $dir = new File_Dir("./pages");
      $dirs = $dir->getDirs();
      usort($dirs, 'Options::optSort');
      foreach($dirs as $d) {
         require_once ("$d->path/$d->name/index.php");
         $classn = Controller::getPluginIndex($d->name);
         $optionFunction = $classn."::getOptions";
         $optional = eval('return '.$classn.'::$isOptional;');
         $optional_default = false;
         if($optional && !isset($GLOBALS[$d->name.'_activated'])) {
             $optional_default = eval('return isset('.$classn.'::$activatedByDefault) && ('.$classn.'::$activatedByDefault);');
         }
         $description = eval('return '.$classn.'::$description;');
         if($optional) {
            $options[] = array('id' => $d->name.'_activated', 'type' => 'checkbox', 'cat' => $description, 'default' => $optional_default?$optional_default:false);
         }
         if(is_callable($optionFunction)) {
            $page_options = call_user_func($optionFunction);
            $options = array_merge($options, $page_options);
         }
         $userContentName = eval('return isset('.$classn.'::$userContentName)?('.$classn.'::$userContentName):false;');
         $hasUserContentPos = eval('return isset('.$classn.'::$userContentDefaultPosition)?('.$classn.'::$userContentDefaultPosition):0;');
         if($hasUserContentPos != -1 && $userContentName && !in_array($userContentName, $userContent)) 
            array_splice( $userContent, $hasUserContentPos, 0, $userContentName ); 
         if($hasUserContentPos != -1 && $userContentName && !in_array($userContentName, $oldUserContent)) 
            array_splice( $oldUserContent, $hasUserContentPos, 0, $userContentName ); 
      }
      foreach($options as &$opt) {
         $opt['val'] = isset($GLOBALS[$opt['id']])?$GLOBALS[$opt['id']]:null;
      }

      $content = array();
      foreach($oldUserContent as $c) {
         if(in_array($c, $userContent))
            $content[] = $c;
      }
      $options[] = array('id' => 'content_order', 'type' => 'sortable', 'cat' => 'Content', 'default' => $userContent, 'val' => $content, 'export' => true);

      return $options;
   }

   // Get values from config.php, but trimmed of unexistant plugins
   public static function getOldOptions() {
      $opts = Options::getOptions();
      $ret = array();
      foreach($opts as $opt) {
         if(isset($GLOBALS[$opt['id']]))
            $ret[$opt['id']] = $GLOBALS[$opt['id']];
         else if(isset($opt['default']))
            $ret[$opt['id']] = $opt['default'];
         else
            $ret[$opt['id']] = '';
      }
      return $ret;
   }


   // Get options from $_POST
   public static function getNewOptions() {
      $opts = Options::getOptions();
      $ret = array();
      foreach($opts as $opt) {
         if($opt['type'] == 'text' || $opt['type'] == 'select' || $opt['type'] == 'sortable') {
            $ret[$opt['id']] = Controller::getParameter($opt['id']);
         } else if($opt['type'] == 'password') {
            $ret[$opt['id']] = Controller::getParameter($opt['id']);
            if((!isset($opt['val']) || $ret[$opt['id']] != $opt['val']) && $ret[$opt['id']] != '')
               $ret[$opt['id']] = sha1($ret[$opt['id']]);
         } else if($opt['type'] == 'checkbox') {
            $ret[$opt['id']] = isset($_POST[$opt['id']]);
         } 
      }
      return $ret;
   }

   public static function writeOptions($new_values) {
      global $VERSION;

      $template = new liteTemplate();
      $template->file('pages/options/tpl/config.tpl');
      $template->assign(array('configv' => $VERSION));

      $params = array();
      $values = array();
      foreach($new_values as $id=>$v) {
         $params[] = $id;
         $values[] = str_replace("'", "\\'", $v);
      }
      $template->assignTag('BALISE', '1', array(
         'param' => $params,
         'value' => $values,
      ));


      $pages = File_JSON::myjson_encode(Options::getPages(true, $new_values));
      $template->assign(array('pages' => $pages));

      $plugins = File_JSON::myjson_encode(Options::getPlugins($new_values));
      $template->assign(array('plugins' => $plugins));

      @rename('config.php', 'config.php.bak');
      if(@file_put_contents('config.php', $template->returnTpl()) === FALSE) {
         throw new Exception('fail');
      }
      @chmod('config.php', 0600);

      $langs = UserOptions::getLangs();
      $template = new liteTemplate();
      $template->preserveDollar = true;
      $template->file('pages/options/tpl/index.tpl');
      $template->assign(
         array(
            'cachedir' => File::simplifyPath('./admin/'.$new_values['cachepath']),
            'picsdir' => File::simplifyPath('./admin/'.$new_values['picpath']),
            'content_order' => UserOptions::getContentPlugins($new_values['content_order'], $new_values),
            'TR' => UserOptions::getLangContent($langs['LANG'][0])
         )
      );
      $template->assignTag('BALISE', '1', UserOptions::getThemes());
      $template->assignTag('BALISE', '2', $langs);

      $plugins = UserOptions::getPlugins($new_values);
      $template->assignTag('BALISE', '3', $plugins['variables']);
      $template->assignTag('BALISE', '4', $plugins['scripts']);
      $template->assignTag('BALISE', '5', $plugins['functions']);

      $content = file_get_contents('../index.html');
      @rename('../index.html', '../index.html.bak');
      if(@file_put_contents('../index.html', preg_replace('/<!-- Autogenerated, do not modify by hand -->(.*?)<!-- Autogenerated -->/ms', "<!-- Autogenerated, do not modify by hand -->\n".$template->returnTpl()."\t<!-- Autogenerated -->", $content)) === FALSE) {
         throw new Exception('fail2');
      }
   }

   // Check that we can modify the configuration files
   public static function checkRights() {
      $config = new File('.', 'config.php');
      $index = new File('..', 'index.html');
      $rights = array(
         'config.php'      => $config->isWritable(),
         '../index.html'   => $index->isWritable(),
      );
      $failure = false;
      foreach($rights as $file=>$r) {
         if(!$r) {
            $failure = true;
            break;
         }
      }
      return array(
         'failure' => $failure,
         'rights' => $rights,
      );
   }

   // Hardcoded currently: get the admin langs.
   public static function getAdminLangs() {
      return array('en' => 'English', 'fr' => 'Fran&ccedil;ais');
   }
};

/*
 * Get the stuff that is injected in the ../index.html page: themes and user langs.
 * TODO: add a way for pages to inject data in index.html!
 */
class UserOptions {
   public static function getBGFG($file) {
      if(!file_exists($file))
         return NULL;
      $css = file_get_contents($file);
      if(!preg_match('/body {(.*?)}/ms', $css, $body_css_a))
         return NULL;
      $body_css = $body_css_a[1];
      if(!preg_match('/background-color:(.*?);/ms', $css, $bg_a))
         return NULL;
      if(!preg_match('/[^-]color:(.*?);/ms', $css, $fg_a))
         return NULL;
      return array('BG' => $bg_a[1], 'FG' => $fg_a[1]);
   }

   public static function getThemes() {
      global $utheme;
      if(Controller::getParameter('utheme') != '')
         $utheme = Controller::getParameter('utheme');

      $dir = new File_Dir('../themes');
      $files = $dir->getDirs();
      $ret = array(
         'NAME' => array(),
         'BG' => array(),
         'FG' => array(),
      );
      foreach($files as $file) {
         if($file->name[0] == '_')
            continue;
         $bgfg = UserOptions::getBGFG("$file->path/$file->name/main.css");
         if(!$bgfg)
            continue;

         if($utheme && $file->name == $utheme) { //default = first element
            array_unshift($ret['NAME'], $file->name);
            array_unshift($ret['BG'], $bgfg['BG']);
            array_unshift($ret['FG'], $bgfg['FG']);
         } else {
            $ret['NAME'][] = $file->name;
            $ret['BG'][] = $bgfg['BG'];
            $ret['FG'][] = $bgfg['FG'];
         }
      }

      return $ret;
   }

   public static function getThemesOpt() {
      $avail_themes_raw = UserOptions::getThemes();
      $avail_themes = array();
      foreach($avail_themes_raw['NAME'] as $t)
         $avail_themes[$t] = $t;
      return $avail_themes;
   }

   public static function getLangs() {
      global $ulang;
      if(Controller::getParameter('ulang') != '')
         $ulang= Controller::getParameter('ulang');

      $dir = new File_Dir('../scripts/lang');
      $files = $dir->getFiles();
      $ret = array( 'LANG' => array() );
      foreach($files as $file) {
         if($file->name[0] == '_')
            continue;
         if($ulang && $file->name == $ulang.'.js') { //default = first element
            array_unshift($ret['LANG'], str_replace('.js', '',$file->name));
         } else {
            $ret['LANG'][] = str_replace('.js', '', $file->name);
         }
      }
      return $ret;
   }

   public static function getLangContent($lang) {
      return file_get_contents('../scripts/lang/'.$lang.'.js');
   }

   public static function getLangsOpt() {
      $avail_lang_raw = UserOptions::getLangs();
      $avail_lang = array();
      foreach($avail_lang_raw['LANG'] as $l)
         $avail_lang[$l] = $l;
      return $avail_lang;
   }

   public static function getPlugins($new_values) {
      global $VERSION;

      $options = Options::getOptions();
      $scripts = array();
      $functions = array();
      $plugin_variables = array(
         'PLUGIN_VAR' => array(),
         'PLUGIN_VAL' => array(),
      );

      $dir = new File_Dir("./pages");
      foreach($dir->getDirs() as $d) {
         require_once ("$d->path/$d->name/index.php");
         $classn = Controller::getPluginIndex($d->name);
         $optional = eval('return '.$classn.'::$isOptional;');
         $activated = false;
         if(!$optional) {
            $activated = true;
         } else {
            $activated = isset($new_values[$d->name.'_activated']) && $new_values[$d->name.'_activated'];
         }
         if(!$activated)
            continue;

         $optionFunction = $classn."::getUserScripts";
         if(is_callable($optionFunction)) {
            $plugin_scripts = call_user_func($optionFunction);
            $scripts = array_merge($scripts, $plugin_scripts);
         }

         $optionFunction = $classn."::getUserFunctions";
         if(is_callable($optionFunction)) {
            $plugin_fun = call_user_func($optionFunction);
            $functions = array_merge($functions, $plugin_fun);
         }


         $optionFunction = $classn."::getOptions";
         if(is_callable($optionFunction)) {
            $plugin_options = call_user_func($optionFunction);
            foreach($plugin_options as $o) {
               if(isset($o['export'])) {
                  $plugin_variables['PLUGIN_VAR'][] = $o['id'];
                  if($o['type'] == 'sortable') {
                      $plugin_variables['PLUGIN_VAL'][] = '['. str_replace("'", "\\'", $new_values[$o['id']]).']';
                  } else {
                      $plugin_variables['PLUGIN_VAL'][] =  str_replace("'", "\\'", $new_values[$o['id']]);
                  }
               }
            }
         }
      }

      $plugin_variables['PLUGIN_VAR'][] = 'VERSION';
      $plugin_variables['PLUGIN_VAL'][] = $VERSION;

      return array(
         'scripts' => array('PLUGIN_URL' => $scripts),
         'variables' => $plugin_variables,
         'functions' => array('PLUGIN_FUN' => $functions),
      );
   }

   public static function getContentPlugins($new_value, $new_values) {
      $order = explode(',', $new_value);
      $content_activated = array();
      $ret = array();

      $dir = new File_Dir("./pages");
      $dirs = $dir->getDirs();
      foreach($dirs as $d) {
         require_once ("$d->path/$d->name/index.php");
         $classn = Controller::getPluginIndex($d->name);
         $optional = eval('return '.$classn.'::$isOptional;');
         $userContentName = eval('return isset('.$classn.'::$userContentName)?('.$classn.'::$userContentName):false;');
         if($userContentName) {
            if(!$optional)               
               $content_activated[$userContentName] = 1;
            else if(isset($new_values[$d->name.'_activated']))
               $content_activated[$userContentName] = 1;
         }
      }

      foreach($order as $o) {
         if(in_array($o, Options::$defaultContent) || isset($content_activated[$o]))
            $ret[] = $o;
      }
      return File_JSON::myjson_encode($ret);
   }
};
