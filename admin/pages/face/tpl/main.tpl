<div style="width:100%;position:relative;margin-top:10px;">
   <div id="API" style="display:none">{$FACE_API}</div>
   <div id="API_DETECTRATE" style="display:none">{$FACE_API_DETECTRATE}</div>
   <div id="API_RECORATE" style="display:none">{$FACE_API_RECORATE}</div>
   <div id="help-container" style="position:relative;width:100%;"></div>
   <table>
      <tr>
         <td>
            <div id="help" style="text-align:center"><input id='help' class='help translate' type="button" value="help" /></div>
         </td>
         <td width="100%" style="vertical-align:middle">
            <div id="people-container" style="position:relative;width:100%;">
               <select id="people-selector" type="select" style="width:100%"></select>
            </div>
         </td>
      </tr>
   </table>
   <div id="face-container" style="position:relative;margin-top:15px;width:100%;display:inline-block">
   </div>
   <div id="super-directory-container" style="overflow:hidden">
      <div id="directory-container" style="position:relative;margin-top:15px;width:100%;overflow:hidden" class="dircontainer">
      </div>
      <div id="directory-container-more" style="position:relative;width:100%;cursor:pointer;text-align:center;display:none">
         <img src="./pages/face/css/down_arrow.png"><span class="translate more">show_more</span><img src="./pages/face/css/down_arrow.png">
      </div>
   </div>
</div>

<div style="font-family:Tahoma,Geneva,sans-serif;font-size:9px;color:#777;text-align:right">
   <img src="./pages/face/css/tick19.png" style="padding-right:5px;vertical-align:bottom"><span class="translate">expl_tick</span><br/>
   <img src="./pages/face/css/cross.png" style="padding-right:5px;vertical-align:bottom"><span class="translate">expl_cross</span><br/>
</div>
<div>
<div id="advanced_bdiv" style="text-align:center"><input id='advanced_b' class='advanced translate' type="button" value="advanced_b" /></div>
<div id="advanced_adiv" style="font-family:Tahoma,Geneva,sans-serif;font-size:11px;color:#777;text-align:right;display:none;margin-top:20px;">
   <table>
      <tr>
         <td><input id='c_all' class='missingt translate' type="button" value="rem_cache_orig" /></td><td style="width:300px;text-align:left;padding-top:5px;"><div class="translate">clean_descr</div><div id="clean_content"></div></td>
         </tr><tr>
         <td><input id='u_all' class='genb translate' type="button" value="gen_missing_faces" /></td><td style="width:300px;text-align:left;padding-top:5px;" class="translate">gen_descr</td>
         </tr><tr>
         <td><input id='t_all' class='trash translate' type="button" value="empty_trash" /></td><td style="width:300px;text-align:left;padding-top:5px;"><div class="translate">empty_trash_descr</div><div id="trash_content"></div></td>
      </tr>
   </table>
</div>

<script id="dirTpl" type="text/x-jquery-tmpl">
   <div id="${id}" class="dirtable {{if !parsed}}to_parse{{/if}}">${name} <input id="expand_dir${id}" type="button" value="expand_dir" style="float:right;z-index:2" class='exp_dir translate' /> <input id="analyse_dir${id}" type="button" value="analyse_dir" style="float:right;z-index:2" class='an_dir translate' /></div>
   <div id="${id}_subdirs" style="margin-left:5px"></div>
</script>

<script id="faceTpl" type="text/x-jquery-tmpl">
	<div id="${id}_container" style="width:100px;height:120px;float:left;position:relative;margin-right:18px;margin-bottom:15px;border:0;">
		<span id="ok"><img src="pages/face/css/tick.png" /></span>
		<span id="pending"><img src="pages/face/css/wait_progress.gif" /></span>
		<div id="${id}_div" style="height:110px;"><img id="${id}" src="${thumb}" style="width:100px;height:100px;border:5px black solid;" class="face draggable"/></div>
      <input type="text" name="${id}_name" id="${id}_name" style="width:108px;text-align: center;" class="input_name defaultTextActive" />
      <div id="${id}_autocomplete" class="autocomplete"></div>
	</div>
</script>
<script id="loadTpl" type="text/x-jquery-tmpl">
	<center><img src="pages/face/css/wait_progress.gif" /></center>
</script>

<script id="peopleTpl" type="text/x-jquery-tmpl">
   <option value="${id}"></option>
</script>

