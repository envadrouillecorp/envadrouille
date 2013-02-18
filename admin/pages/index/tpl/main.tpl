<div id="load_directories"><div id="rload_directories"></div></div>
<div id="n_directories"><div id='content_directories'></div></div>
<pre id='j_directories' style='display:none'></pre>
<div style="font-family:Tahoma,Geneva,sans-serif;font-size:9px;color:#777;text-align:right">
   <img src="./pages/index/css/tick19.png" style="padding-right:5px;vertical-align:bottom"><span class="translate">expl_tick</span><br/>
   <img src="./pages/index/css/warning.png" style="padding-right:5px;vertical-align:bottom"><span class="translate">expl_mod</span><br/>
   <img src="./pages/index/css/cross.png" style="padding-right:5px;vertical-align:bottom"><span class="translate">expl_cross</span><br/>
</div>
<br/>
<div>
   <div id="advanced_bdiv" style="text-align:center"><input id='advanced_b' class='advanced translate' type="button" value="advanced_b" /></div>
   <div id="advanced_adiv" style="display:none">
      <br/>
      <div class="translate" style="font-family: Tahoma,Geneva,sans-serif;">index_button_descr</div>
      <table>
         <tr>
            <td><input id='c_all' class='missingt translate' type="button" value="rem_cache_orig" /></td><td class="translate" id="clean_all_d">clean_descr</td>
         </tr><tr>
            <td><input id='u_all' class='genb translate' type="button" value="gen_missing_thumbs" /></td><td class="translate">gen_descr</td>
         </tr>
      </table>
   </div>
</div>

<script id="dirTpl" type="text/x-jquery-tmpl">
    <table class='dir {{if !has_json}}to_parse{{/if}}' id='${id}'>
		<tr>
			<td class='title dirtable'>${dir}</td>
		</tr>
		<tr id='content_${id}' style="display:none;" >
			<td class='dirtable boxheight' id='rcontent_${id}'></td>
		</tr>
		<tr id='load_${id}' style="display:none;" >
			<td class='dirtable boxheight' id='rload_${id}' style="vertical-align:top"></td>
		</tr>
	</table>
	<div id='n_${id}' style='margin-left:20px;'></div>
</script>

<script id="dirContentTpl" type="text/x-jquery-tmpl">
	<table>
      <tr>
         {{if parsed}}
         <td width="206px" id="dir_${id}"><div id="thumbd_${id}" style="text-align:center"><img src="${thumb.replace('_m', '_c')}" class="thumb"/></div></td>
         {{/if}}
			<td>
            <table>
               {{if parsed}}
					<tr>
						<td>URL:</td>
						<td width="100%"><a href="${url}">${url}</a></td>
               </tr>
               {{/if}}
					<tr>
						<td class="translate">descr</td>
						<td width="100%"><textarea id='d_${id}' rows="3" style="width:100%;float:right">${descr}</textarea></td>
					</tr>
					<tr style="height:40px">
						<td class="translate">gps</td>
						<td width="100%">
                     <select id="sel_gps_type_${id}" name="sel_gps_type" style="float:left;height:23px;margin-right:2px;box-sizing:border-box;-moz-box-sizing:border-box;"><option value="satellite" {{if gpxtype=='satellite'}}selected{{/if}}>Satellite</option><option value="roadmap" {{if gpxtype=='roadmap'}}selected{{/if}}>Road Map</option><option value="terrain" {{if gpxtype=='terrain'}}selected{{/if}}>Terrain</option></select>
                     <input id='gpx_rm_${id}' class='rm translate' style="float:right;position:relative;box-sizing:border-box;-moz-box-sizing:border-box;" type="button" value="rm_gpx" />
                     <div id="gpx_${id}" style="overflow:hidden;position:relative; float:right">
                        <input type="file" id="gx_${id}" style="font-size: 118px;height: 23px;opacity: 0;position: absolute;right: 0; z-index:10" />
                        <input id='gpxb_${id}' class='gpx translate' type="button" value="up_gpx" style="float:right;box-sizing:border-box;-moz-box-sizing:border-box;"/>
                        <div style="">
                             <input type="text" id='gxt_${id}' type="input" value="${gpx}" style="height:25px;box-sizing:border-box;-moz-box-sizing:border-box;" disabled="true" />
                        </div>
                     </div>
						</td>
					</tr>
					<tr>
						<td class="translate">starred</td>
						<td width="100%">
							<input id='c_${id}' type="checkbox" {{if starred}}checked{{/if}}/>
						</td>
					</tr>
					<tr>
						<td class="translate">hidden</td>
						<td width="100%" class="lasttd">
							<input id='h_${id}' type="checkbox" style="position:relative;top:9px" {{if hidden}}checked{{/if}}/>

                     <input id='u_${id}' class='update translate' type="button" value="{{if parsed}}up_dir{{else}}add_dir{{/if}}" />
                     {{if parsed}}
                     <span id="uth_${id}" style="overflow:hidden;position:relative; float:right;height:33px;">
								<input type="file" id="up_thumb_${id}" style="font-size: 118px;height: 33px;opacity: 0;position: absolute;right: 0; z-index:10"/>
                        <div style="">
                             <input id='thumb_${id}' class='tc translate' type="button" value="up_thumb"  s/>
                        </div>
                     </span>
							<input id='tc_${id}' class='tc translate' type="button" value="th_dir" />
                     <pre id='j_${id}' style='display:none'></pre>
                     {{/if}}
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</script>

<script id="thumbsTpl" type="text/x-jquery-tmpl">
<table id="thumbs_${id}" style="width:100%;display:block" class="" >
	<tr style="position:relative">
		<td><div id="thumb_container_${id}" style="position:relative;vertical-align:top"></div></td>
   </tr>
   <tr><td><input id='cancelt_${id}' class='cancel translate' type="button" value="cancelt_dir" /></td></tr>
</table>
</script>

<script id="thumbTpl" type="text/x-jquery-tmpl">
<img src="${img}" class="thumb" style="margin-right: 5px;cursor:pointer;" id="${id}"/>
</script>

<script id="loadTpl" type="text/x-jquery-tmpl">
	<center><div class='loader boxheight'></div></center>
</script>

<script id="loadTplProgress" type="text/x-jquery-tmpl">
   <div class="boxheight"><div style="height:30px"></div><center><img src="pages/index/css/ajax-loader.gif" /> (${descr} - ${done}/${total})</center></div>
</script>

<div id="default_gpx_type" style="display:none">{$DEFAULT_GPX}</div>
