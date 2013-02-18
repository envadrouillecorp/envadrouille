/*
 * view.js
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 */

function People(json) {
   var self = this;
   self.id = getUID();
   self.name = json.name;
   self.view = View.getInstance(self);
   People.instancesIDs[self.id] = self;

   self.addFaceToView = function(face) {
      face.name = self.name;
      self.view.addFace(face);
   };

   self.addFace = function(face) {
      self.addFaceToView(face);
      face.cancelRecognition();
      face.showLoading();
      var batch = new Batch(SequentialBatch, function() {
         face.showLoaded();
      }, null);
      batch.get({action:'face.add_face', dir:face.basepath, face:face.uid, people:self.name}, function() {
         var batchTrain = new Batch(Face.BatchContainer, function() { }, null);
         batchTrain.get({action:'face.train', dir:face.basepath, face:face.uid});
         batchTrain.launch(true); //boost priority
      }, null);
      batch.launch();
   };

   self.rmFace = function(face) {
      self.view.rmFace(face);
   };

   self.show = function() {
      $('#people-selector').val(self.id);
      self.view.show();
   }

   if(json.faces) {
      $.each(json.faces, function(id, fjson) {
         self.addFaceToView(Face.getInstance(fjson));
      });
   }
};
People.instances = {};
People.instancesIDs = {};
People.getInstance = function(json) {
   if(!json.name || json.name == '')
      json.name = 'unknown';
   if(this.instances[json.name])
      return this.instances[json.name];
   return this.instances[json.name] = new People(json);
}
People.getKnownPeople = function() {
   return $.keys(People.instances);
}

