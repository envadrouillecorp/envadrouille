<div id="default_gpx_type" style="display:none">{$GPX_TYPE}</div>

<script id="gpxTpl" type="text/x-jquery-tmpl">
               <tr style="height:40px">
						<td class="translate">gps</td>
						<td width="100%">
                     <select id="sel_gps_type_${id}" name="sel_gps_type" style="float:left;height:23px;margin-right:2px;box-sizing:border-box;-moz-box-sizing:border-box;"><option value="satellite" {{if gpxtype=='satellite'}}selected{{/if}}>Satellite</option><option value="roadmap" {{if gpxtype=='roadmap'}}selected{{/if}}>Road Map</option><option value="terrain" {{if gpxtype=='terrain'}}selected{{/if}}>Terrain</option><option value="terrain" {{if gpxtype=='ign'}}selected{{/if}}>IGN</option></select>
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
</script>
