<?php
/**
 * Classe LiteTemplate
 * Author : telnes
 * Version : V.1.9
 * Date : 23/03/2007
 * LastRelease : 15/07/2007
 * Contribution : ZBrian, Xhark
 *
 * (2013) Baptiste Lepers - Modified to meet EnVadrouille requirements
 */
class LiteTemplate{
	var $tplName;
	var $tpl;
	var $time;
	var $cache_folder;
	var $cache_life;
	var $cache_activate;
	var $cache_compression;
	var $cache_isExpired;
	var $debug;
	var $error;
    var $preserveDollar = false;
    var $version;
	function __construct(){
		$this->version = '1.9';
		$this->tpl = '';
		$this->tplName = '';
		$this->time = microtime();
		// cache
		$this->cache_folder = '_cache/';
		$this->cache_life = '60'; 
		$this->cache_activate = false; 
		$this->cache_compression = false;
		$this->debug = false;
		$this->cache_isExpired = true;
		$this->error = array();
	}

	function file($file){
		$this->tplName = $file;
		if($this->isExpiredCache()){
			$this->cache_isExpired = true;
			if (!$this->tpl = file_get_contents($file)){
				$this->error[] = 'Warning! problème lors de la récupération du fichier '.$file;
			}
		} else {
			$this->cache_isExpired = false;
		}
		return $this;
	}

	function assign($tag_array){
		if(!$this->cache_activate or $this->cache_isExpired){
			foreach( $tag_array as $key => $value){

            $this->tpl = str_replace('{$'.$key.'}', $value,$this->tpl);
            if($value == true) {
               $this->tpl = preg_replace('/{if '.$key.'}(.*?){fi}/si', '${1}', $this->tpl);
            } else {
               $this->tpl = preg_replace('/{if '.$key.'}(.*?){fi}/si', '', $this->tpl);
            }
			}
		}
	}

	function assignTag($tag,$id,$tag_array){
		if(!$this->cache_activate or $this->cache_isExpired){
			if( $this->checkArray($tag_array) ){

				reset($tag_array);
				$num_key = count($tag_array); 
				$num_value = count($tag_array[key($tag_array)]); 
				$tmp = $this->findTag($tag,$id); 

            $array = array('');
				for($i=0;$i<$num_value;$i++){
					$array[$i] = $tmp;
					reset($tag_array);
                    for( $j=0;$j<$num_key;$j++){
                        if($this->preserveDollar) {
                            $array[$i] = str_replace('{$'.key($tag_array).'}',$tag_array[key($tag_array)][$i],$array[$i]);
                        } else {
                            $array[$i] = str_replace('{$'.key($tag_array).'}',str_replace('&#36;&#36;', '$', str_replace('$','&#36;',$tag_array[key($tag_array)][$i])),$array[$i]);
                        }
						next($tag_array);
					}
				}

            if(isset($array)) {
               for ($i=1;$i<count($array);$i++){
                  $array[0] .= $array[$i];
               }

               $replace = '{'.$tag.' id='.$id.'}'.$tmp.'{/'.$tag.'}';
               $this->tpl = str_replace($replace,$array[0],$this->tpl);
            }
			} else {
				$this->error[]="Warning! Array size is wrong $tag id=$id";
			}
		}
	}

	function assignInclude($id,$file=""){
		if(!$this->cache_activate or $this->cache_isExpired){
			if( empty($file) ){

				$filename = $this->findTag("INCLUDE",$id,"FILE") or exit("erreur sur la balise $id");

				$tmp = $this->getIncludeContents($filename);
				$this->tpl = str_replace("{INCLUDE id=$id file=$filename}",$tmp,$this->tpl);
			}
			else{

				$tmp = $this->getIncludeContents($file);
				$this->tpl = str_replace("{INCLUDE id=$id}",$tmp,$this->tpl);
			}
		}
	}

	function htmlSelect($name,$array,$selected="",$htmlAttribut=""){
		if(!$this->cache_activate or $this->cache_isExpired){
			$select = $this->findTag("HTMLSELECT",$name,"SELECTED");

			if(!$select){
				if($this->findTag("HTMLSELECT",$name)){

					$tmp = $this->creatHtmlSelect($name,$array,$selected,$htmlAttribut);
					$this->tpl = str_replace("{HTMLSELECT id=$name}",$tmp,$this->tpl);
				}
				else{

					$this->error[] = "Warning : Impossible de trouver HTMLSELEC $name";
				}

			}
			else{
				$tmp = $this->creatHtmlSelect($name,$array,$select,$htmlAttribut);
				$this->tpl = str_replace("{HTMLSELECT id=$name selected=$select}",$tmp,$this->tpl);
			}
		}
	}


   function view(){
      $this->assign(array(
         'RANDOM_SID' => isset(Controller::$sid)?Controller::$sid:'rand_sid',
         'max_parallel_jobs' => (isset($GLOBALS['max_parallel_jobs']) && is_numeric($GLOBALS['max_parallel_jobs']) && $GLOBALS['max_parallel_jobs'] > 0)?$GLOBALS['max_parallel_jobs']:3,
		));

		if(!$this->cache_activate or $this->cache_isExpired){
			$this->assignAutoInclude();
			if(!$this->debug){ $this->clearTag(); }
		}
		if(!$this->cache_activate){
			echo $this->tpl;
		}
		elseif($this->cache_isExpired){
			$this->putCache($this->returnTpl());
			echo $this->tpl;
		}
		else{
			echo $this->getCache();
		}
		$this->time = $this->microTimeDiff($this->time,microtime());
	}

	function writeTo($file) {
		$fh = fopen($file, 'w');
		if(!$fh) {
			die("Cannot open $file for writing");
		}
		fwrite($fh, $this->tpl);
		fclose($fh);
	}

	function returnTpl(){
		return $this->tpl;
	}

	function getCache($filename=''){

		$filename = (empty($filename))?$this->tplName:$filename;

		$filename_md5 = md5($filename);
		$path_file = $this->cache_folder.$filename_md5;

		if(file_exists($path_file)){

			if(!$this->cache_compression){

				$handle = fopen ($path_file, "rb");
				$contents = fread ($handle, filesize ($path_file)+1);
				fclose ($handle);
			}
			else{

				$contents =  $this->getGzFile($path_file);
			}

			return $contents;

		} else {
			return false;
		}

	}

	function putCache($contents,$filename=''){
		$filename = (empty($filename))?$this->tplName:$filename;

		if(!is_dir($this->cache_folder)) {
			if(!mkdir($this->cache_folder, 0755)){
				$this->error[] = 'Warning! Cache folder "'.$this->cache_folder.'" cannot be created';
			}
		} 

		$filename_md5 = md5($filename);
		$path_file = $this->cache_folder.$filename_md5;

		if(!$this->cache_compression){
			$handle = fopen ($path_file, "w");
			if (fwrite($handle, $contents) === FALSE) {
				$this->error[] = "Warning :fwrite fail $path_file";
			}
			fclose ($handle);
		} else {
			$handle = gzopen ($path_file, "w");
			if (gzputs($handle, $contents) === FALSE) {
				$this->error[] = "Warning :gzputs fail ".$path;
			}
			gzclose ($handle);
		}

	}

	function version($value="0"){
		if($value){
			return array('autor'=>'telnes',
				'version'=>$this->version, 
			);
		} else {
			return 'Page généré avec LiteTemplate'.$this->version.', un moteur de template - création telnes';
		}
	}


	function getError(){
		return $this->error;
	}

	function getIncludeContents($filename) {
		if (is_file($filename)) {

			ob_start();
			include $filename;
			$contents = ob_get_contents();
			ob_end_clean();
			return $contents;
		}
	}


	function getGzFile($filename){
		if (is_file($filename)) {

			ob_start();
			readgzfile($filename);
			$contents = ob_get_contents();
			ob_end_clean();
			return $contents;
		}
	}

	function findTag($tag,$id,$option=""){
		if( empty($option) ){
			@preg_match("/(\{".$tag." id=)(".$id.")(})(.*?)(\{\/".$tag."})/ism",$this->tpl,$result);
			if(empty($result[4])){
            preg_match("/\{".$tag." id=(".$id.")}/ism",$this->tpl,$result);
            if(isset($result[1]))
               return $result[1];
            else
               return 0;

			}
			return $result[4];

		}
		elseif($option == "FILE"){
			@preg_match("/\{".$tag." id=".$id." file=(.*?)}/ism",$this->tpl,$result);
			return $result[1];
		}
		elseif($option == "SELECTED"){
			@preg_match("/\{".$tag." id=".$id." selected=(.*?)}/ism",$this->tpl,$result);
			return $result[1];
		}
		else{

			return 0;
		}
	}


	function checkArray($array){
		reset($array);
		$return = true;
		$num = count($array[key($array)]);

		for ($i = 0; $i < count($array); $i++) {

			if($num != count($array[key($array)])){

				$return=false;
			}

			next($array);
      }

		return $return;
	}

	function clearTag(){

		$tag = '[a-zA-Z0-9_]{1,}';
		$id = '[a-zA-Z0-9_]{1,}';

		$this->tpl = preg_replace('/\{\$'.$tag.'\}/i','',$this->tpl);
		$this->tpl = preg_replace('/(\{'.$tag.' id=)('.$id.')(})(.*?)(\{\/'.$tag.'})/ism','',$this->tpl);
		$this->tpl = preg_replace('/(\{'.$tag.' id=)('.$id.')(})/ism','',$this->tpl);
		$this->tpl = preg_replace('/(\{'.$tag.' id=)('.$id.') (file=(.*?)})/ism','',$this->tpl);
	}

	function microTimeDiff($time_begin,$time_end){
		$a=explode(' ',$time_begin);
		$b=explode(' ',$time_end);

		return $b[0]-$a[0]+$b[1]-$a[1];
	}

   function createInput($meta) {
      if($meta['type'] == 'select') {
          return $this->creatHtmlSelect($meta['id'], $meta['vals'], (empty($meta['val'])?$meta['default']:$meta['val']));
      } else if($meta['type'] == 'sortable') {
          return $this->createSortable($meta['id'], (empty($meta['val'])?$meta['default']:$meta['val']));
      } else {
         $val = (!isset($meta['val']) || $meta['val'] === null)?$meta['default']:$meta['val'];
         return '<input type="'.$meta['type'].'" name="'.$meta['id'].'" value="'.htmlspecialchars($val).'" '.(($meta['type'] == 'checkbox' && $val == true)?'checked':'').'/>';
      }
   }

   function createSortable($name,$array){
      $tmp = '<ul class="sortable" id="'.$name.'_ul">'."\n";
      foreach($array as $key=>$value){
         $tmp .= '<li id="'.$value.'" class="translate">'.$value.'</li>'."\n";
      }
      $tmp .= '</ul>';
      $tmp .= '<input type="hidden" id="'.$name.'" name="'.$name.'" value="'.join(',',$array).'" />';
      $tmp .= "<script>"
         . "$$('#${name}_ul').sortable().bind('sortupdate', function(e, ui) {"
         . "  var content=[];"
         . "  $$('#${name}_ul li').each(function(i, el) {"
         . "     content.push($$(el).attr('id'));"
         . "  });"
         . "  $$('#${name}').val(content.join(','));"
         . "});"
         . "</script>";
      return $tmp;
   }

	function creatHtmlSelect($name,$array,$selected,$attribut=''){
		$tmp = '<Select name="'.$name.'" '.$attribut.' >'."\n";

		foreach($array as $key=>$value){

			if( $key == $selected){
				$tmp .= '<option value="'.$key.'" SELECTED >'.$value.'</option>'."\n";
			}
			else{
				$tmp .= '<option value="'.$key.'">'.$value.'</option>'."\n";	
			}	
		}
		$tmp .= '</select>';
		return $tmp;	
	}

	function assignAutoInclude(){


		$patern = "@\{INCLUDE file=(.*)\}@";
		preg_match_all($patern,$this->tpl,$tmp);

		foreach($tmp[1] as $file){

			$tmp = $this->getIncludeContents($file);
			$this->tpl = str_replace("{INCLUDE file=$file}",$tmp,$this->tpl);

		}

	}

	function isExpiredCache($filename=''){

		$filename = (empty($filename))?$this->tplName:$filename;

		$filename_md5 = md5($filename);
		$path_file = $this->cache_folder.$filename_md5;

		if(file_exists($path_file)){
			clearstatcache();
			$diff = time() - filemtime($path_file);

			if( $diff < $this->cache_life)
				return false;
			else{
				return true;
			}
		}

		else{
			return true;
		}

	}


   public $extraJS = array();
	function showPage($name, $othertpl = null) {
		global $pages, $lang, $VERSION, $DEBUG;
		if(!isset($lang))
			$lang = 'en';

      $this->file('./common/tpl/header.tpl');
      $this->assignTag('BALISE', '2', array(
			'URL' => $this->extraJS,
		));

      $shown_version = $VERSION;
      if($DEBUG)
         $shown_version = rand();

		$innerpage = new liteTemplate();
		$this->assign(array(
			'VERSION' => $shown_version,
			'page' => $name,
         'lang' => $lang,
         'notifications' => File_JSON::myjson_encode(Controller::$notifications),
			'content' => $innerpage->file("./pages/$name/tpl/".(($othertpl!==null)?$othertpl:'main').".tpl")->returnTpl(),
         'CURRENT' => isset($pages[$name])?$pages[$name]['descr']:'',
		));

		$urls = array();
		$descrs = array();
		$names = array();
		foreach($pages as $p=>$meta) {
			if(!isset($meta['url']) || (isset($meta['show']) && !$meta['show']))
				continue;
			$urls[] = $meta['url'];
			$descrs[] = $meta['descr'];
			$names[] = $p;
		}
		$this->assignTag('BALISE', '1', array(
			'URL' => $urls,
			'DESCR' => $descrs,
			'NAME' => $names,
      ));

      $extraJSFinal = array();
      foreach($this->extraJS as $js) {
         $url = str_replace('{$lang}', $lang, $js);
         if(!file_exists($url)) 
            $url = str_replace('{$lang}', 'en', $js);
         if(file_exists($url)) 
            $extraJSFinal[] = $url;
      }

      $this->assignTag('SCRIPT', '1', array(
			'js_url' => $extraJSFinal,
      ));
   }
}



?>
