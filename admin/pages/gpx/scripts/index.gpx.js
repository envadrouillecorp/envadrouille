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
      return { gpxtype:$('#sel_gps_type_'+id).val() };
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
      return [$('#sel_gps_type_'+div), $('#gxt_'+div)];
   },

   getUnparsedDirTpl:function(dir, div, id) {
      var tpl = $("#gpxTpl").tmpl({id:id, gpx:t('t_added_gpx'), gpxtype:$('#default_gpx_type').text()});
      return tpl.html();
   },

   getParsedDirTpl:function(dir, div, data) {
      return $("#gpxTpl").tmpl({id:div,parsed:true,gps:data.json.gps, gpx:data.gpx,gpxtype:data.json.gpxtype?data.json.gpxtype:$('#default_gpx_type').text()}).html();
   },
};
plugins.push(GPX);
