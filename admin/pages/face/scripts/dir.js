/*
 * dir.js
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 */

function Dir(json) {
   var self = this;
   self.id = json.id = getUID();
   self.json = json;
   self.div = $('#directory-container');
   self.subdiv = $('#directory-container');
   Dir.directories.push(this);

   self.getDirs = function(cb) {
      var batch = new Batch(ParallelBatch);
      batch.get({action:'face.get_dirs',dir:json.path+'/'+json.name}, cb);
      batch.launch();
   }

   self.getToDoList = function(cb) {
      var batch = new Batch(ParallelBatch);
      batch.get({action:'face.get_todo_list',dir:json.path+'/'+json.name}, cb);
      batch.launch();
   }

   self.clean = function(cb) {
      var batch = new Batch(ParallelBatch);
      batch.get({action:'face.clean',dir:json.path+'/'+json.name}, cb);
      batch.launch();
   }

   self.showSubdirs = function() {
      $('#expand_dir'+self.id).attr('disabled', true);
      self.getDirs(function(dirjson) {
         $('#expand_dir'+self.id).css('display', 'none');
         $.each(dirjson.dirs, function(id, json) {
            json.parsed = (dirjson.json.dirs != undefined && dirjson.json.dirs[json.name] != undefined);
            var dir = Dir.getInstance(json);
            dir.div = self.subdiv;
	    dir.show();
         });
      });
   }

   self.detectFaces = function(progresscb, endcb) {
      if(json.name == '') {
         if(endcb)
            endcb();
         return;
      }
         
      var total_pics = 0;
      var detected_faces = 0;
      var processed_pics = 0;
      var button = $('#analyse_dir'+self.id).attr('disabled', true);
      function end() {
         button.attr('disabled', null); 
         button.val(t('analyse_dir_p', [processed_pics, total_pics, detected_faces]));
         $('#'+self.id).removeClass('to_parse');
         if(endcb)
           endcb();
      }
      self.getToDoList(function(dirjson) {
         var batch = new Batch(ParallelBatch, function() {
            var writebatch = new Batch(SequentialBatch, end, null);
            writebatch.get({action:'face.write_faces_json',dir:self.json.path+'/'+self.json.name});
            writebatch.launch();
         }, null);
         total_pics = dirjson.faces.length;
         if(progresscb)
            progresscb(total_pics, processed_pics, detected_faces);
         button.val(t('analyse_dir_p', [processed_pics, total_pics, detected_faces]));
         $.each(dirjson.faces, function(id, face) {
            batch.get({action:'face.create_faces', dir:face.path, img:face.name}, function(json) {
               processed_pics++;
               detected_faces += json.faces.length;
               button.val(t('analyse_dir_p', [processed_pics, total_pics, detected_faces]));
               var writebatch = new Batch(SequentialBatch);
               writebatch.get({action:'face.write_faces_json_partial',dir:face.path, img:face.name}, function() {
                  if(progresscb)
                     progresscb(total_pics, processed_pics, detected_faces);
                  $.each(json.faces, function(id, json) {
                     People.getInstance({name:json.people}).addFaceToView(Face.getInstance(json));
                     People.getInstance({name:json.people}).show();
                  });
               }, null);
               writebatch.launch();
            });
         });
	 batch.launch();
      });
   }

   self.show = function() {
      if(json.name != '') {
         $("#dirTpl").tmpl(json).appendTo(self.div);
         self.subdiv = $('#'+self.id+'_subdirs');
         $('#'+self.id).translate();
         $('#analyse_dir'+self.id).click(function() { self.detectFaces() });
         $('#expand_dir'+self.id).click(function() { self.showSubdirs() });
         if(Dir.directories.length > 4) //4 because of index dir
            Dir.showExpand();
      } else {
         self.showSubdirs();
      }
   }
}
Dir.directories = [];
Dir.directoriesHash = [];
Dir.getInstance = function(json) {
   if(Dir.directoriesHash[json.path+'/'+json.name])
      return Dir.directoriesHash[json.path+'/'+json.name];
   return Dir.directoriesHash[json.path+'/'+json.name] = new Dir(json);
}
Dir.showExpand = function() {
   $('#directory-container-more').css('display', 'block');
   $('#directory-container-more').unbind('click').click(function() {
      $('#directory-container-more').remove();
      $('#directory-container').removeClass('dircontainer');
   });
}

