// jQuery doTimeout plugin  Copyright (c) 2010 "Cowboy" Ben Alman MIT License
(function($){var a={},c="doTimeout",d=Array.prototype.slice;$[c]=function(){return b.apply(window,[0].concat(d.call(arguments)))};$.fn[c]=function(){var f=d.call(arguments),e=b.apply(this,[c+f[0]].concat(f));return typeof f[0]==="number"||typeof f[1]==="number"?this:e};function b(l){var m=this,h,k={},g=l?$.fn:$,n=arguments,i=4,f=n[1],j=n[2],p=n[3];if(typeof f!=="string"){i--;f=l=0;j=n[1];p=n[2]}if(l){h=m.eq(0);h.data(l,k=h.data(l)||{})}else{if(f){k=a[f]||(a[f]={})}}k.id&&clearTimeout(k.id);delete k.id;function e(){if(l){h.removeData(l)}else{if(f){delete a[f]}}}function o(){k.id=setTimeout(function(){k.fn()},j)}if(p){k.fn=function(q){if(typeof p==="string"){p=g[p]}p.apply(m,d.call(n,i))===true&&!q?o():e()};o()}else{if(k.fn){j===undefined?e():k.fn(j===false);return true}else{e()}}}})(jQuery);

/*
 * Multiple stuff copy/pasted from various site
 * Copyright (c) xxxx authors of the various functions
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 */
var jGallery = {};

/*
 * JS Data::Dumper. Essential to debug the unknown.
 */
function dump(arr,level) {
	var dumped_text = "";
	if(!level) level = 0;
	if(level > 10)
		return;
	//The padding given at the beginning of the line.
	var level_padding = "";
	for(var j=0;j<level+1;j++) level_padding += "    ";

	if(typeof(arr) == 'object') { //Array/Hashes/Objects 
		for(var item in arr) {
			var value = arr[item];

			if(typeof(value) == 'object') { //If it is an array,
				dumped_text += level_padding + "'" + item + "' ...\n";
				dumped_text += dump(value,level+1);
			} else {
				dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
			}
		}
	} else { //Stings/Chars/Numbers etc.
		dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
	}
	return dumped_text;
}


function stripslashes(str) {
   if(!str)
      return '';
	str=str.replace(/\\'/g,'\'');
	str=str.replace(/\\"/g,'"');
	str=str.replace(/\\0/g,'\0');
	str=str.replace(/\\\\/g,'\\');
	return str;
}

function basename (path, suffix) {
    var b = path.replace(/^.*[\/\\]/g, '');
     if (suffix && typeof(suffix) == 'string' && b.substr(b.length - suffix.length) == suffix) {
        b = b.substr(0, b.length - suffix.length);
    }
    return b;
}

function dirname (path) {
    return path.replace(/\\/g, '/').replace(/\/[^\/]*\/?$/, '');
}

function get_json(url, cb) {
      $.ajax({
			url: url,
			type: 'POST',
			dataType: 'json',
			cache:false,
			success:cb,
         error:cb,
     });
   }

/*
 * Simple utility to get and send data to PHP.
 * Usage: ParallelBatch.get({post params}, {cb(data)}); cb is called once the request has completed.
 *
 * It is possible to send a batch of requests using the ParallelBatch.Batch object.
 * var b = new Batch(ParallelBatch, end_cb, end_cb_params); 
 * b.get(paramsN, cbN);			// Do that multiple times, same syntax as ParallelBatch.get
 * b.launch();				// When b has finished all requests, end_cb is called
 *
 * All ParallelBatch.Batch objects share a common global queue, so that at most maxPending tasks
 * are launched in parallel.
 */
var failed_actions = {};
var past_failed_msg = [];
function action_fail_msg(params) {
   if(params[5] === undefined) {
      params[5] = past_failed_msg.length;
      past_failed_msg.push(params);
      index = past_failed_msg.length - 1;
   } else {
      index = params[5];
   }

   var tag = params[0].replace(/./g, '');
   var show_explain = $('#explain_'+tag).css('display') || 'none';
   var msg = '<span>Action '+params[0]+' failed (<a href="#" onclick="javascript:if($(\'#explain_'+tag+'\').css(\'display\') == \'block\') $(\'#explain_'+tag+'\').css(\'display\', \'none\'); else $(\'#explain_'+tag+'\').css(\'display\', \'block\');return false;" style="text-decoration:none;border-bottom:1px dotted black;color:#D8000C;">details</a>)</span><span style="float:right">';

   if(index > 0) {
      msg += '<a href="#" onclick="javascript:inform(\'action_fail\', \'error\', true, past_failed_msg['+(index-1)+'])" style="text-decoration:none;">&#x25C0;</a>';
   }
   msg += ' (Error '+(index+1)+'/'+past_failed_msg.length+') ';
   if(index != past_failed_msg.length - 1) {
      msg += '<a href="#" onclick="javascript:inform(\'action_fail\', \'error\', true, past_failed_msg['+(index+1)+'])" style="text-decoration:none;">&#9654;</a>';
   }
   msg += '</span>';

   //Details
   msg += '<div id="explain_'+tag+'" style="display:'+show_explain+'"><pre>This action has failed '+params[3]+' time(s).\nLast params:\n'+dump(params[1])+'\nLast answer:\n</pre>';
   var answer = '<pre>'+params[2].responseText+'</pre>';
   try {
      json = jQuery.parseJSON(params[2].responseText);
      answer = "<b>Error :</b><pre>"+json['msg']+"</pre><br/>"
         + "<b>File :</b> "+json['file']+"<br/>"
         + "<b>Line :</b> "+json['line']+"<br/>";
      answer += '<pre>';
      if(json['msg'] == "Your session has expired, please reload the page")
         return json['msg'];
   } catch(err) {};
   msg += answer+'</div>';

   return msg;
}
function BatchContainer(nbParallelTasks) {
	this.failed_actions = {};
	this.maxPending = nbParallelTasks;
	this.batchPending = 0;
	this.batchWaiting = [];

	this.get = function (params, callback) {
      params.random_sid = random_sid;
		$.ajax({
			url: "index.php",
			type: 'POST',
			data:params,
			dataType: 'json',
			cache:false,
			success: function(data){
				if(!data)
					data = {};

            if(data.error) {
               if(!failed_actions[params.action])
                  failed_actions[params.action] = 0;
               failed_actions[params.action]++;
               inform('action_fail', 'error', true, [params.action, params, {'responseText':JSON.stringify(data)}, failed_actions[params.action]]);
            }

				data.__params = params;
            if(callback)
               callback(data);
			},
			error: function(data) {
            if(!data)
					data = {};

				if(!failed_actions[params.action])
					failed_actions[params.action] = 0;
			   failed_actions[params.action]++;
				inform('action_fail', 'error', true, [params.action, params, data, failed_actions[params.action]]);

				data.__params = params;
            if(callback)
               callback(data);
	      }
		});
	};
	
	this.upload = function(options, callback) {
      options.params.random_sid = random_sid;
		var xhr = new XMLHttpRequest(),
		    upload = xhr.upload;
		if(options.progress) {
			upload.addEventListener("progress", function (ev) {
					if (ev.lengthComputable) {
					options.progress(ev.loaded, ev.total);
					}
					}, false);
		}
		if(callback) {
			function end(ev, success) {
				var data;
				if(success) {
					try {
						data = jQuery.parseJSON(xhr.responseText);
					} catch(err) {
						success = false;
					}
				}
				if(!success) {
					if(!failed_actions[options.params.action])
						failed_actions[options.params.action] = 0;
					failed_actions[options.params.action]++;
					inform('action_fail', 'error', true, [options.params.action, options.params, xhr, failed_actions[options.params.action]]);
				}
				if(!data) 
					data = {};
				data.params = options.params;
				callback(data);
			}
			xhr.addEventListener("load", function(ev) {end(ev, true);}, false);
			xhr.addEventListener("error", function(ev) {end(ev, false);}, false);
		}

		xhr.open("POST","index.php?upfile=true&"+jQuery.param(options.params || {}));
		xhr.setRequestHeader("Cache-Control", "no-cache");
		xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		xhr.setRequestHeader("X-File-Name", options.file.name);
		xhr.send(options.file);
	},

	this.batchDo = function() {
		if(this.batchPending >= this.maxPending)
			return;
		var batch = this.batchWaiting.shift();
		if(!batch)
			return;
		batch.exec();
	};
}

function Batch(BatchContainer, callback, data) {
   this.parent = BatchContainer;
   this.cb = callback;
   this.data = data;
   this.pendingcb = 0;
   this.waiting = [];
   this.cancelled = false;

   this.exec = function() {		
      var elt = this.waiting.shift();
      if(!elt || this.cancelled) {
         this.parent.batchDo();
         return;
      }

      var self = this;
      this.parent.batchPending++;
      this.pendingcb++;

      var f = this.parent.get;
      if(elt.params.file)
         f = this.parent.upload;
      f(elt.params, function(data) {
            if(elt.callback)
               elt.callback(data);
            self.parent.batchPending--;
            self.pendingcb--;
            if(self.pendingcb == 0 && self.waiting.length == 0 && self.cb)
               self.cb(this.data);
            self.parent.batchDo();
      });			
   }

   this.get = function(params, callback) {
      this.waiting.push({params:params, callback:callback});
   }

   this.launch = function(prio) {
      if(this.pendingcb == 0 && this.waiting.length == 0) {
         if(this.cb)
            this.cb(this.data);
      } else {
         var task_count = this.waiting.length;
         for(var i = 0; i < task_count; i++) {
            if(prio != undefined && prio)
               this.parent.batchWaiting.unshift(this);
            else
               this.parent.batchWaiting.push(this);
            this.parent.batchDo();
         }
      }
   }

   this.cancel = function() {
      this.cancelled = true;
   }
}
var SequentialBatch = new BatchContainer(1);
var ParallelBatch = new BatchContainer(window.max_parallel_jobs?window.max_parallel_jobs:3);





var UID = 0;
function getUID() {
	return UID++;
}

$.extend({
   keys: function(obj){
      var a = [];
      $.each(obj, function(k){ a.push(k) });
      return a;
   }
});

function remote_check_version(data) {
	var curr_version = $('#version_update #version').text();
	var last_version = data?data.version:0;
	if(curr_version < last_version) {
		inform('update_gal', 'warning-small', true, [last_version, curr_version], $('#version_update #update'));
		var min_left = ($('#head #current').position().left + $('#head #current').width() + 130);
		$('#version_update #update').css('position', 'absolute').css('top', '-5px').css('left', min_left + "px").css('right', "50px").css('opacity', 0).animate({opacity:1}, "5000");
	}
}

function check_new_version() {
   if(window.update_activated) {
      $.ajax({
         url: "http://update.envadrouille.org/VERSION",
         dataType: 'jsonp',
         crossDomain:true,
         cache:true,
         success: function(data){
         },
         error: function(data) {
         }
      });
   }
}

/********************************/
/** Info toolbar               **/
function plural(times) {
	if(times > 1)
		return 's';
	else
		return '';
}
function inform(tag, type, add, params, div) {
   var message = tag!='general'?t(tag, params):params;
   if(message == tag && params)
	message = params;
   if(!div)
      div = $('#info');
   if(!add)
      div.find('#'+tag).remove();
   else if(div.find('#'+tag).length > 0)
      div.find('#'+tag).html(message);
   else
      div.prepend('<div id="'+tag+'" class="'+type+'">'+message+'</div>');
}

if(!console)
	var console = {
		log:function() {}
	};

