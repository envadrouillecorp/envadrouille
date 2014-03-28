var GPX = {
   preWriteJson:function(id, dir, cb) {
      GPX.upload_gpx(id, dir, cb);
   },
  	upload_gpx:function(id, dir, cb) {
      if(document.getElementById('gx_'+id).files.length) {
         $("#loadTplProgress").tmpl({descr:t('uploading_gpx'),done:0,total:'?'}).appendTo($('#rload_'+id).empty());
         var batch = new Batch(ParallelBatch);
         batch.get({
            params:{action:'gpx.upload_gpx', dir:dir.path, updated:dir.name},
            file:document.getElementById('gx_'+id).files[0],
            progress:function(done, total) {
               $("#loadTplProgress").tmpl({descr:t('uploading_gpx'),done:Math.round(done/1024)+'K',total:Math.round(total/1024)+'K'}).appendTo($('#rload_'+id).empty());
            },
         }, cb);
         batch.launch();
      } else {
         cb();
      }
	},

   getJsonParams:function(id, dir) {
      return { gpxtype:$('#sel_gps_type_'+id).val(), gxtdiff:$('#gxtdiff_'+id).val(), geo_use_time:$('#geo_use_time_'+id).is(':checked') };
   },

   postWriteJson:function(id, dir, cb) {
      cb();
   },

   addButtonActions:function(id, dir, data) {
      show_rm_gpx();
		function show_rm_gpx() {
			if($('#gxt_'+id).val()) {
				$('#gpx_rm_'+id).css('display', 'block');
            $('#gpx_'+id).css('width', ($('#gpx_'+id).parent()[0].offsetWidth - $('#gpx_rm_'+id)[0].offsetWidth - $('#sel_gps_type_'+id)[0].offsetWidth - 50)+'px');
            $('#gxt_'+id).css('width', ($('#gpx_'+id).parent()[0].offsetWidth - $('#gpxb_'+id)[0].offsetWidth - $('#gpx_rm_'+id)[0].offsetWidth - $('#sel_gps_type_'+id)[0].offsetWidth - 110)+'px');
			} else {
				$('#gpx_rm_'+id).css('display', 'none');
            $('#gpx_'+id).css('width', ($('#gpx_'+id).parent()[0].offsetWidth - $('#sel_gps_type_'+id)[0].offsetWidth - 40)+'px');
            $('#gxt_'+id).css('width', ($('#gpx_'+id).parent()[0].offsetWidth - $('#sel_gps_type_'+id)[0].offsetWidth - $('#gpxb_'+id)[0].offsetWidth - 90)+'px');
			}

			$('#gpx_rm_'+id).unbind('click').click(function() {
				$('#gxt_'+id).val(t('Please wait...'));
            $('#gpx_rm_'+id).attr('disabled', true);
            $('#u_'+id).attr('disabled', true);
            ParallelBatch.get({action:'gpx.remove_gpx',dir:dir.path, updated:dir.name, sel_gps:'gpx'}, function(data) {
               $('#gxt_'+id).val('');
               $('#gpx_rm_'+id).attr('disabled', null);
               $('#u_'+id).attr('disabled', null);
               show_rm_gpx();
            });
			});
		}
		show_rm_gpx();
		$('#gx_'+id).change(function() {
			$('#gxt_'+id).val($('#gx_'+id).val());
			$('#gxt_'+id).change();
		});
   },

   getHooks:function(dir, div) {
      return [$('#sel_gps_type_'+div), $('#gxt_'+div), $('#gxtdiff_'+div), $('#geo_use_time_'+div)];
   },

   getUnparsedDirTpl:function(dir, div, id) {
      var tpl = $("#gpxTpl").tmpl({id:id, gpx:t('t_added_gpx'), gpxtype:$('#default_gpx_type').text(), gpxtdiff:$('#default_geo_time_diff').text(), geo_use_time:true});
      var ret = $('<div></div>');
      tpl.appendTo(ret);
      return ret.html();
   },

   getParsedDirTpl:function(dir, div, data) {
      var tpl = $("#gpxTpl").tmpl({id:div,parsed:true,gps:data.json.gps, gpx:data.gpx,gpxtype:data.json.gpxtype?data.json.gpxtype:$('#default_gpx_type').text(),gpxtdiff:data.json.gxtdiff!==undefined?data.json.gxtdiff:$('#default_geo_time_diff').text(),geo_use_time:data.json.geo_use_time!==undefined?(data.json.geo_use_time==="true"):true});
      var ret = $('<div></div>');
      tpl.appendTo(ret);
      return ret.html();
   },

   getPluginHeight:function(dir, div) {
      if($('#geo_use_time_'+div).length) {
         return 60;
      } else {
         return 25;
      }
   }
};
plugins.push(GPX);
