/*
 * main.js
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 *
 *
 * How it works:
 * - Each dir is composed of:
 *   * A .title that show the content of the dir when clicked
 *   * A <tr id='content_xxx'> that contains the various inputs and is hidden (display:none) when loading occurs (this way all information remain on the DOM)
 *   * A <tr id='load_xxx'> that contains the loading information or the list of available thumbnail; display:none'd when content_xxx is visible.
 * - IMPORTANT: always show content_xxx before hidding load_xxx (and vice versa). Otherwise the height of the page is reduced and the browser scrollbar might change value
 * - IMPORTANT: modify the boxheight class to increase the height of the directories boxes
 *
 * All requests are sent via ajax calls using the ParallelBatch utility (or SequentialBatch when writing common files).
 */
$(document).ready(function() {
	function switch_loading(id, loading) {
		if(loading) {
			$('#rload_'+id).addClass('boxheight');
			$('#load_'+id).css('display', 'block');
			$('#content_'+id).css('display', 'none');
		} else {
			$('#content_'+id).css('display', 'block');
			$('#load_'+id).css('display', 'none');
		}
	}

	/*
	 * Update a directory = get the todo_list of a folder and send orders to:
    * - Call the plugins preWrite actions
	 * - Create thumbnails
	 * - Write json
    * - Call the plugins postWrite actions.
	 */
	function write_json(id, dir) {
		$("#loadTplProgress").tmpl({descr:t('writing_cache'),done:0,total:1}).appendTo($('#rload_'+id).empty());
		$('#rload_'+id).addClass('boxheight');

		dir.is_starred = $('#c_'+id).is(':checked');
		dir.is_hidden = $('#h_'+id).is(':checked');

      var nb_done = 0;
      function end(data) { 
         nb_done++;
         if(nb_done >= plugins.length)
            show_dir(dir, id); 
      }

		var batch = new Batch(SequentialBatch, function() {
         if(plugins.length == 0)
            end();
         else for(var p in plugins)
            plugins[p].postWriteJson(id, dir, end);
      }, null);
      var jsonParams = {action:'index.write_json', 'dir':dir.path, 'updated':dir.name, 'descr':$('#d_'+id).val(), 'starred':$('#c_'+id).is(':checked'),'hidden':$('#h_'+id).is(':checked') };
      for(var p in plugins)
         $.extend(jsonParams, plugins[p].getJsonParams(id, dir));
		batch.get(jsonParams, function() {});
		batch.launch();
	}

	function create_thumbs(data) {
		function show_progress(done, total, div) {
			$("#loadTplProgress").tmpl({descr:t('updating'),done:done,total:total}).appendTo($('#rload_'+div).empty());
		}

		var id = data.__params.__id;
		var dir = data.__params.__dir;

		var done = 0;
		var total = data.imgs.length;

		// We launch very action in a Batch object which ensures that at most N expensive operations
		// are launched in parallel on the server.
		var batch = new Batch(ParallelBatch, function(data2) { 
			write_json(id,dir);
		}, null);

		// foreach picture...
		$.each(data.imgs, function(key, val) {
			batch.get({action:'index.create_thumbs', 'img':val.name, 'dir':val.path}, function(data) {
				show_progress(++done,total, id);
			});
		});
	
		show_progress(done, total, id);
		batch.launch();
	}
	
	function update_directory(id, dir) {
		$("#loadTpl").tmpl().appendTo($('#rload_'+id).empty());
		switch_loading(id, true);
      var nb_done = 0;
      function end() {
         nb_done++;
         if(nb_done >= plugins.length)
            ParallelBatch.get({action:'index.get_todo_list', dir:dir.path+'/'+dir.name, __id:id, __dir:dir}, create_thumbs);
      };
      if(plugins.length == 0)
         end();
      else for(var p in plugins)
         plugins[p].preWriteJson(id, dir, end);
	}	


   /***
    * Functions to change the main thumbnail (upload / choose)
    ***/
   function upload_new_thumb(id, dir) {
      switch_loading(id, true);
			$("#loadTplProgress").tmpl({descr:t('sending_thumb'),done:'0',total:'?'}).appendTo($('#rload_'+id).empty());

         var batch = new Batch(ParallelBatch);
         batch.get({
               params:{action:'index.set_thumb', dir:dir.path, updated:dir.name},
               file:document.getElementById('up_thumb_'+id).files[0],
               progress:function(done, total) {
                  $("#loadTplProgress").tmpl({descr:t('sending_thumb'),done:Math.round(done/1024)+'K',total:Math.round(total/1024)+'K'}).appendTo($('#rload_'+id).empty());
               }
            },
				function(data) {
					switch_loading(id, false);
					$('#thumbd_'+id).html('<img src="'+data.path+'/index_c.jpg?'+new Date().getTime()+'" class="thumb"/>');
				}
			);
         batch.launch();
   }

   function show_choose_new_thumb(id, data, dir) {
      $("#thumbsTpl").tmpl({id:id}).appendTo($('#rload_'+id).empty());
				$('#rload_'+id).removeClass('boxheight');
				$('#thumbs_'+id+' .translate').translate();
				$('#load_'+id).css('display', 'block');
				$('#content_'+id).css('display', 'none');

				for(var img in data.imgs) {
					var uid = getUID();
					$("#thumbTpl").tmpl({id:uid,img:data.thumb_dir+'/'+data.imgs[img]['name'].replace(/^(.*)\.(.*?)$/,'$1_c.$2')}).appendTo($('#thumb_container_'+id));
					$('#'+uid).click({img:img}, function(evtd) {
						var ii = evtd.data.img;
						$("#loadTpl").tmpl().appendTo($('#rload_'+id).empty());
						$('#rload_'+id).addClass('boxheight');
						ParallelBatch.get({action:'index.set_thumb', dir:dir.path, updated:dir.name, img:basename(data.imgs[ii]['name'].replace('_m', ''))}, function() {
							switch_loading(id, false);
							$('#thumbd_'+id).html('<img src="'+data.thumb_dir+'/'+data.imgs[ii]['name'].replace(/^(.*)\.(.*?)$/,'$1_c.$2')+'?'+new Date().getTime()+'" class="thumb"/>');
						});
					});
				}

				$('#cancelt_'+id).unbind('click').click(function() {
					switch_loading(id, false);
				});
   }


   /***
    * Big ugly function to set the actions of all buttons inside a directory box
    */
	function add_buttons_actions(id, dir, data) {
		$('#u_'+id).click(function() {
			update_directory(id, dir, false);
		});

		$('#'+id+' .title').unbind('click').click(function() {
			if($('#content_'+id).css('display') == 'none') {
				$('#content_'+id).css('display', 'block');
				$('#load_'+id).css('display', 'none');
			} else {
				$('#content_'+id).css('display', 'none');
			}
		});

		$('#up_thumb_'+id).change(function() {
            upload_new_thumb(id, dir);
      });

		if(data && data.imgs) {
			$('#tc_'+id).unbind('click').click(function() {
            show_choose_new_thumb(id, data, dir);
         });
		} else {
			$('#tc_'+id).css('display', 'none');
		}

      for(var p in plugins)
         plugins[p].addButtonActions(id, dir, data);
   }	

   function add_form_hooks(dir, div) {
      var elts = [ $('#d_'+div) , $('#c_'+div), $('#h_'+div) ];
      for(var p in plugins)
         elts = elts.concat(plugins[p].getHooks(dir, div));

      var orig_values = [];
      $('#'+div).removeClass('to_update');

      function add_update_icon() {
         var changed = false;
         for(var i in elts) {
            if(orig_values[i] != (elts[i].is(':checkbox')?elts[i].is(':checked'):elts[i].val())) {
               changed = true;
               break;
            }
         }
         if(changed)
            $('#'+div).addClass('to_update');
         else
            $('#'+div).removeClass('to_update');
      }
      for(var i in elts) {
         orig_values[i] = (elts[i].is(':checkbox')?elts[i].is(':checked'):elts[i].val());
         elts[i].change(add_update_icon).keyup(add_update_icon);
      }
   }


	function show_subdir(dir, div, key) {
		var id = 'dir'+key;
		$("#dirTpl").tmpl({dir:dir.name, has_json:dir.json, id:id}).appendTo('#'+div);
		$('#'+div+' .translate').translate();
		if(dir.json) { //Directory has already been added
			$('#'+id+' .title').click(function() {
				show_dir(dir, id);
			});
		} else {
         var plugin_content = '';
         for(var p in plugins)
            plugin_content += plugins[p].getUnparsedDirTpl(dir, div, id);
			$("#dirContentTpl").tmpl({id:id, parsed:false, plugin_content:plugin_content}).appendTo($('#rcontent_'+id).empty());
			$('#content_'+id).css('display', 'block');
			add_buttons_actions(id, dir, null);
			$('#rcontent_'+id+' .translate').translate();
			add_form_hooks(dir, id);
		}
	}

   function json2hash(json) {
      var r = {};
		for(d in json.dirs) {
         r[json.dirs[d].url] = json.dirs[d];
      }
      return r;
   }
	function json_contains_dir(data, json) {
		return json[data.name] != undefined;
	}
	function json_dir_is_starred(data, json) {
		return (json[data.name] != undefined) && (json[data.name].starred);
	}
	function json_dir_is_hidden(data, json) {
		return (json[data.name] != undefined) && (json[data.name].hidden == true);
	}

	function show_dir(dir, div) {
		$("#loadTpl").tmpl().appendTo($('#rload_'+div).empty());
		switch_loading(div, true);
		ParallelBatch.get({action:'index.get_dir_content',dir:dir.path+'/'+dir.name, limit:10}, function(data) {
			if(dir.path != '') {
            var plugin_content = '';
            for(var p in plugins)
               plugin_content += plugins[p].getParsedDirTpl(dir, div, data);

				$('#'+div).find('.title').animate({color:'#999'}, 'slow');
				$('#'+div).removeClass('to_parse');
				$("#dirContentTpl").tmpl({id:div,parsed:true,imgs:data.imgs,thumb:data.thumb+'?'+(new Date().getTime()),descr:(data.json.descr), starred:dir.is_starred,hidden:dir.is_hidden,url:data.url,plugin_content:plugin_content}).appendTo($('#rcontent_'+div).empty());
				$('#content_'+div).css('display', 'block');
				add_buttons_actions(div, dir, data);				
				$('#'+div+' .translate').translate();
				add_form_hooks(dir, div);
			} else if(data.dirs.length == 0) {
            inform('no_dir', 'warning', true);
         }

			$('#j_'+div).text('JSON:\n').click(function() {
				if($(this).text() == 'JSON:\n')
					$(this).text('JSON:'+dump(data.json));
				else
					$(this).text('JSON:\n');
			});
			$('#n_'+div).empty();
			var nb_dirs = data.dirs.length;
			var js = json2hash(data.json);
			for(var d = 0; d < nb_dirs; d++) {
				if(json_contains_dir(data.dirs[d], js)) {
					data.dirs[d].json = true;
					data.dirs[d].is_starred = json_dir_is_starred(data.dirs[d], js);
					data.dirs[d].is_hidden = json_dir_is_hidden(data.dirs[d], js);
				}
				show_subdir(data.dirs[d], 'n_'+div, getUID());
			}
			$('#load_'+div).css('display', 'none');
		});
	}



	/*
	 * Advanced functions
	 */
   function apply_action_on_all_dirs(action, button, text, cb, sequential, update_all_dirs) {
		var batch = new Batch(sequential?SequentialBatch:ParallelBatch, function(data) {
			cb();
			show_dir({path:'',name:''}, 'directories');
		}, null);
		var total = 2;
		var done = 0;
	
		inform('general', 'waiting', true, t(text, [done, total]), $('#n_directories').empty());
		function show_load(_total, _done) {
         total += _total; done += _done;
			$(button).val(t('updating', [done,total]));
         inform('general', 'waiting', true, t(text, [done, total]), $('#n_directories'));
		}
		function update_dir(dir) {
			batch.get({action:'index.get_dir_content',dir:dir.path+'/'+dir.name, limit:10}, function(data) {
				show_load(0, 1);
				$.each(data.dirs, function(key, val) {
					if(update_all_dirs || json_contains_dir(val, json2hash(data.json))) {
						show_load(2, 0);
						update_dir(val);
					}
				});
            action(dir, batch, show_load);
				batch.launch();
			});
			batch.launch();
		}
      disable_all_global_actions();
		update_dir({path:'',name:''});
   }
   function disable_all_global_actions() {
		$('#u_all').attr("disabled", true);
		$('#c_all').attr("disabled", true);
		$('#a_all').attr("disabled", true);
   }
   function enable_all_global_actions() {
		$('#u_all').attr("disabled", null).val(t('gen_missing_thumbs'));
		$('#c_all').attr("disabled", null).val(t('rem_cache_orig'));
		$('#a_all').attr("disabled", null).val(t('add_all'));
   }
   function update_all() {
      function dir_work(dir, batch, show_load) {
         batch.get({action:'index.get_todo_list', dir:dir.path+'/'+dir.name}, function(data) {
            var batch2 = new Batch(ParallelBatch, function() {
               batch.get({action:'index.update_json', 'dir':dir.path+'/'+dir.name}, function() {
                  show_load(0, 1);
               });
               batch.launch();
            });
            $.each(data.imgs, function(key, val) {
               show_load(1, 0);
               batch2.get({action:'index.create_thumbs', 'img':val.name, 'dir':val.path}, function(data) { show_load(0, 1); });
               batch2.launch();
            });
            batch2.launch();
         });
      }
      apply_action_on_all_dirs(dir_work, '#u_all', 'wait_thumb', enable_all_global_actions);
   }
   function add_all() {
      function dir_work(dir, batch, show_load) {
         if(dir.path === "") {
            batch.launch();
            return;
         }

         batch.get({action:'index.get_todo_list', dir:dir.path+'/'+dir.name}, function(data) {
            var batch2 = new Batch(ParallelBatch, function() {
               var jsonParams = {action:'index.write_json', 'dir':dir.path, 'updated':dir.name, 'descr':'', 'starred':false,'hidden':false };
               batch.get(jsonParams, function() {
                  show_load(0, 1);
               });
               batch.launch();
            });
            $.each(data.imgs, function(key, val) {
               show_load(1, 0);
               batch2.get({action:'index.create_thumbs', 'img':val.name, 'dir':val.path}, function(data) { show_load(0, 1); });
               batch2.launch();
            });
            batch2.launch();
         });
      }
      apply_action_on_all_dirs(dir_work, '#a_all', 'wait_all', enable_all_global_actions, true, true);
   }


   function clean_all() {
      var nb_del = 0;
      var deleted_files = [];
      function dir_work(dir, batch, show_load) {
         batch.get({action:'index.clean_cache', dir:dir.path+'/'+dir.name}, function(data) { 
            show_load(0,1); 
            if(data.deleted_files) {
               nb_del += data.deleted_files.nb;
               for(var i in data.deleted_files.files) {
                  deleted_files.push(data.deleted_files.files[i].path+'/'+data.deleted_files.files[i].name);
               }
            }
         });
      }
      function end() {
         enable_all_global_actions();
         $('#c_all').val(t('rem_cache', [nb_del]));
         if(nb_del > 0) {
            var list = $('#clean_all_d').find('ul');
            if(list.length == 0)
               list = $("#clean_all_d").append('<br/><ul></ul>').find('ul');
            for(var i in deleted_files)
               list.append('<li>'+deleted_files[i]+'</li>');
         }
      }
      apply_action_on_all_dirs(dir_work, '#c_all', 'wait_clean', end);
   }



   /**
	* Do that now
	*/
	show_dir({path:'',name:''}, 'directories');
   $('#advanced_b').click(function() {
       $('#advanced_bdiv').css('display', 'none');
       $('#advanced_adiv').css('display', 'block');
   });
	$('#u_all').click(function() {
		update_all();
	});
	$('#c_all').click(function() {
      clean_all();
   });
	$('#a_all').click(function() {
      add_all();
   });
	
});
