/*
 * main.js
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 */

function showDetectedFaces() {
   var batch = new Batch(ParallelBatch, function() {
      People.getInstance({name:'unknown'}).show();
   }, null);
   batch.get({action:'face.get_people'}, function(peoplejson) {
      if(!peoplejson.people)
         return;
      $.each(peoplejson.people, function(p, facesjson) {
         if(!facesjson.faces)
            return;
         $.each(facesjson.faces, function(f, json) {
            People.getInstance({name:p}).addFaceToView(Face.getInstance(json));
         });
      });
   });
   batch.launch();
}

function showHelp() {
   inform('face_help', 'success', true);
}

function switch_all(show) {
   var css = show?'block':'none';
   $('#people-container').css('display', css);
   $('#face-container').css('display', show?'inline-block':'none');
   $('#super-directory-container').css('display', css);

   var disabled = show?null:true;
   $('#u_all').attr('disabled', disabled);
   $('#c_all').attr('disabled', disabled);
   $('#t_all').attr('disabled', disabled);
}
function update_all() {
   var donedirs = 0, totaldirs = 0;
   var donepics = 0, totalpics = 0, totalfaces = 0;
   function end() {
      switch_all(true);
      inform('general', 'waiting', false);
   }
   function show_wait() {
      inform('general', 'waiting', true, t('waiting_update', [Math.floor(donedirs / 2), totaldirs / 2, totalpics, donepics, totalfaces]));
      if(donedirs == totaldirs)
         end();
   }
   function processDir(dir) {
      totaldirs += 2; show_wait();
      var dirtotal = 0, dirdone = 0, dirfaces = 0;
      dir.detectFaces(
         function(total, done, faces) {
            totalpics += (total - dirtotal);
            donepics += (done - dirdone);
            totalfaces += (faces - dirfaces);
            dirtotal = total;
            dirdone = done;
            dirfaces = faces;
            show_wait();
         },
         function() {
            donedirs++; show_wait();
         }
      );
      dir.getDirs(function(json) {
         $.each(json.dirs, function(id, val) {
            processDir(Dir.getInstance({path:val.path,name:val.name}));
         });
         donedirs++; show_wait();
      });
   }

   switch_all(false);
   processDir(Dir.getInstance({path:'',name:''}));
}

function clean_all() {
   var donedirs = 0, totaldirs = 0;
   var deletedfiles = [];
   var deletedentries = [];
   function end() {
      switch_all(true);
      inform('general', 'waiting', false);
      if(deletedfiles.length + deletedentries.length > 0) {
	      var list = $('#clean_content').find('ul');
	      if(list.length == 0)
		      list = $("#clean_content").append('<ul></ul>').find('ul');
	      for(var i in deletedfiles)
		      list.append('<li>'+deletedfiles[i].path+'/'+deletedfiles[i].length+'</li>');
	      for(var i in deletedentries)
		      list.append('<li>'+deletedentries[i]+'</li>');
      }
   }
   function show_wait() {
      inform('general', 'waiting', true, t('waiting_clean', [Math.floor(donedirs / 2), totaldirs / 2]));
      if(donedirs == totaldirs) {
         var batch = new Batch(ParallelBatch);
         batch.get({action:'face.clean_people'}, function(json) {
            for(var i in json.uselessjsonentries)
               deletedentries.push(json.uselessjsonentries[i]);
            end();
         });
         batch.launch();
      }
   }
   function processDir(dir) {
      totaldirs +=2; show_wait();
      dir.clean(function(json) {
         donedirs++; show_wait();
         for(var i in json.files)
            deletedfiles.push(json.files[i]);
         for(var i in json.uselessjsonentries)
            deletedentries.push(json.uselessjsonentries[i]);
      });
      dir.getDirs(function(json) {
         $.each(json.dirs, function(id, val) {
            processDir(Dir.getInstance({path:val.path,name:val.name}));
         });
         donedirs++; show_wait();
      });
   }

   switch_all(false);
   processDir(Dir.getInstance({path:'',name:''}));
}

function trash_all() {
   var batch = new Batch(ParallelBatch);
   batch.get({action:'face.empty_trash'}, function(json) {
      var faces = [];
      var trash = People.getInstance({name:'trash'});
      for(var i in trash.view.orderedfaces)
         faces.push(trash.view.orderedfaces[i]);
      for(var i in faces)
         trash.rmFace(faces[i]);
      People.getInstance({name:'unknown'}).show(); // to force view update
      People.getInstance({name:'trash'}).show();
      switch_all(true);
      if(json.files.length > 0) {
         var list = $('#trash_content').find('ul');
         if(list.length == 0)
            list = $("#trash_content").append('<ul></ul>').find('ul');
         for(var i in json.files)
            list.append('<li>'+json.files[i].path+'/'+json.files[i].name+'</li>');
      }
   });
   batch.launch();
   switch_all(false);
}

$(document).ready(function() {
   if($('#advanced_b').length == 0)
      return;

   Dir.getInstance({path:'',name:''}).show();
   People.getInstance({name:'trash'});
   $('#people-selector').change(function() {
      People.instancesIDs[$('#people-selector').val()].show();
   }).customStyle();

   $('#help').click(showHelp);

   showDetectedFaces();

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
   $('#t_all').click(function() {
      trash_all();
   });
});





(function($){
    $.fn.extend({
    customStyle : function(options) {
       return this.each(function() {
          var currentSelected = $(this).find(':selected');
          $(this).after('<span class="customStyleSelectBox"><span class="customStyleSelectBoxInner">'+currentSelected.text()+'</span></span>').css({position:'absolute', opacity:0,fontSize:$(this).next().css('font-size')});
          var selectBoxSpan = $(this).next();
          var selectBoxSpanInner = selectBoxSpan.find(':first-child');
          selectBoxSpan.css({display:'inline-block'});
          selectBoxSpanInner.css({display:'inline-block'});
          var selectBoxHeight = 23;
          $(this).height(selectBoxHeight).change(function() {
             selectBoxSpanInner.text($(this).find(':selected').text());
          });
       });
    }
    });
})(jQuery);
