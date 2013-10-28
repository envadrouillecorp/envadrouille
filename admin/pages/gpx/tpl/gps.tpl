<div id="default_gpx_type" style="display:none">{$GPX_TYPE}</div>
<div id="default_geo_time_diff" style="display:none">{$GPX_TIME_DIFF}</div>

<script id="gpxTpl" type="text/x-jquery-tmpl">
               <tr style="height:40px">
						<td class="translate">gps</td>
						<td width="100%">
                     <select id="sel_gps_type_${id}" name="sel_gps_type" style="float:left;height:23px;margin-right:2px;box-sizing:border-box;-moz-box-sizing:border-box;"><option value="satellite" {{if gpxtype=='satellite'}}selected{{/if}}>Satellite</option><option value="roadmap" {{if gpxtype=='roadmap'}}selected{{/if}}>Road Map</option><option value="terrain" {{if gpxtype=='terrain'}}selected{{/if}}>Terrain</option><option value="IGN" {{if gpxtype=='ign'}}selected{{/if}}>IGN</option><option value="refuges.info" {{if gpxtype=='refuges.info'}}selected{{/if}}>Refuges.info</option></select>
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
               {$GEOLOCALIZATION_BEG}
               <tr style="height:40px">
                  <td colspan="2" style="border:0;margin:0;padding:0">
                     <table style="border:0;margin:0;padding:0"><tr style="border:0;margin:0;padding:0">
                        <td class="translate" style="border:0;margin:0;padding:0">geo_all_pics</td>
                        <td>
                           <input id='geo_use_time_${id}' type="checkbox" {{if geo_use_time}}checked{{/if}}/>
                        </td>
                        <td style="width:20px"></td>
                        <td class="translate">gps_time_diff</td>
                        <td width="100%">
                           <input type="text" id='gxtdiff_${id}' type="input" value="${gpxtdiff}" style="height:25px;box-sizing:border-box;-moz-box-sizing:border-box;padding-left:5px" />
                        </td>
                     </tr></table>
                  </td>
               </tr>
               {$GEOLOCALIZATION_END}
</script>
