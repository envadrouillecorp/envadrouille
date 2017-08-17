/*
 * main.js
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 */

function show_error_rights(data) {
   if(!data || !data.err) {
      inform('failup', 'error', true, "Failed to check files rights. That's all we know.");
   } else {
      inform('failup', 'error', true, "Failed to finish update. Do not have the right to modify files:<br/><ul></ul>");
      $.each(data.err, function(id, val) {
         $('#failup ul').append('<li>'+val.file+'</li>');
      });
   }
}

function end_update(files) {
	$('#step2').css('color', '#555');
	ParallelBatch.get({action:'update.finish_merge', files:JSON.stringify(files)}, function(data) {
		if(!data || !data.success) {
         show_error_rights(data);
			return;
		}
		$('#step3').css('color', '#555');
		inform('failup', 'success', true, "Update complete. <a href='index.php'>Go back to the index</a>.");
	});
}

function update_files(files) {
	var total_files = files.length;
	var total_done = 0;
	var total_conflict = 0;
	var batch = new Batch(ParallelBatch, function() {}, null);

	function end_file() {
		$('#step2').text('2. Applying patches ('+total_done+'/'+total_files+')');
		if(total_done == total_files)
			end_update(files);
	}

	function ext2mode(filename) {
		var ext = filename.split('.').pop().toLowerCase();
		switch(ext) {
			case "php":
				return "text/x-php";
			case "css":
				return "text/css";
			case "html":
				return "text/html";
			case "js":
				return "text/javascript";
			default:
				return "text/x-csrc";
		}
	}

	function send_file(file, content) {
		batch.get({'action':'update.update_file_manually','ufile':file.file,'ucontent':content}, function(data) {
				if(data && data.success) {
					total_done++;
					end_file();
				} else {
					inform('failup', 'error', true, "Failed to send changes for file "+file.file);
				}
		});
		batch.launch();
	}

	function add_conflict_editor(file, data) {
		var id = total_conflict;
		$('#editorstip').css('display', 'block');
		$('#editors').append('<div id="fileid'+id+'">'+file.file+':</div><div style="border:1px solid #CCCCCC;" id="ed'+id+'"><textarea id="code'+id+'"></textarea></div><div style="width:100%;display:inline-block"><input type="button" value="Use new file version (recommended)" id="new'+id+'" class="merge"/> <input type="button" value="Use your old file version" id="old'+id+'" class="merge"/> <input type="button" value="Merge changes (using the code in the textbox)" id="sub'+id+'" class="merge"/></div>');
		$('#code'+id).val(data);

		var editor = CodeMirror.fromTextArea($('#code'+id)[0], {
			lineNumbers: true,
			mode: ext2mode(file.file),
		});

        function resolveConflict(content) {
            send_file(file, content);
			$('#new'+id).css('display', 'none');
			$('#old'+id).css('display', 'none');
			$('#sub'+id).css('display', 'none');
			$('#ed'+id).css('display', 'none');
			$('#fileid'+id).text(file.file+': Sent');
			total_conflict--;
			if(total_conflict == 0)
				inform('failup', 'error', false, '');
        }
		$('#sub'+id).click(function() {
            resolveConflict(editor.getValue());
        });
        $('#new'+id).click(function() {
            resolveConflict('{new}');
        });
        $('#old'+id).click(function() {
            resolveConflict('{old}');
        });
	}
	
	$('#step2').text('2. Applying patches ('+total_done+'/'+total_files+')');
	for(var f in files) {
		batch.get({'action':'update.update_file','binary':files[f].binary,'ufile':files[f].file,'findex':f}, function(data) {
			if(data && data.success) {
				total_done++;
				end_file();
			} else {
				total_conflict++;
				inform('failup', 'error', true, "Failed to merge all files. ("+total_conflict+" conflict(s)). Waiting for manual merge.");
				add_conflict_editor(files[data.__params.findex], data.merge)
			}
		});
	}
	batch.launch();
}


function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  } 
  return '';
}

function showChangelog(h) {
   $('#changelog').css('display', 'block').append('<pre></pre>');
   $('#changelog pre').text(h['changelog']);
}

function start_update() {
   var nversion = getQueryVariable("nversion");
   var oversion = getQueryVariable("oversion");
   $.ajax({
		url: "https://update.envadrouille.org/CHANGELOG-stable-"+oversion+"-stable-"+nversion,
		dataType: 'jsonp',
		crossDomain:true,
		cache:true,
		success: function(data){
		},
		error: function(data) {
		}
	});

	ParallelBatch.get({action:'update.get_files_to_update'}, function(data) {
		if(!data || !data.success || !data.json) {
			inform('failup', 'error', true, "Failed to get update.");
			return;
		}

		$('#step1').css('color', '#555');
      ParallelBatch.get({action:'update.check_rights', files:JSON.stringify(data.json)}, function(data2) {
         if(!data2 || !data2.success) {
            show_error_rights(data2);
         } else {
            update_files(data.json);
         }
      });
	});
}

$(document).ready(function() {
	start_update();
});
