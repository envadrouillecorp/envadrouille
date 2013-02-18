/*
 * view.js
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 */

function View(people) {
   var self = this;
   self.uid = getUID();
   self.active = false;
   self.faces = {};
   self.orderedfaces = [];
   self.shownFaces = {};

   self.addFace = function(face) {
      if(self.faces[face.uid])
         return;
      self.faces[face.uid] = face;
      self.orderedfaces.push(face);
      if(self.active)
         self.show();
      self.updateTitle();
   };

   self.rmFace = function(face) {
      delete self.faces[face.uid];
      var index = 0;
      for(; index < self.orderedfaces.length; index++)
         if(self.orderedfaces[index].uid == face.uid)
            break;
      self.orderedfaces.splice(index, 1);
      $('#'+face.id+'_container').animate({opacity:0.2}, "fast", function() {
         //$('#'+face.id+'_container').remove();
      });
      self.updateTitle();
   }


   self.show = function() {
      if(View.currentView)
         View.currentView.active = false;

      self.active = true;
      
      if(View.currentView && View.currentView.uid == self.uid) {
         // view not changed
      } else {
         self.shownFaces = {};
         $('#face-container').empty();
      }

      View.currentView = self;

      $.each(self.orderedfaces, function(id, face) {
         if(self.shownFaces[face.id]) {
            // face already added
         } else {
            self.shownFaces[face.id] = true;
            face.show();
         }
      });

      self.updateTitle();
   };

   self.updateTitle = function() {
      var nb = self.orderedfaces.length;
      $('#people-selector').find('option[value="'+people.id+'"]').text(t('people_d', [t(people.name), nb]));
      if(self.active)
         $('#people-container').find('.customStyleSelectBoxInner').text(t('people_d', [t(people.name), nb]));
   }

   $("#peopleTpl").tmpl(people).appendTo($('#people-selector'));
   self.updateTitle();
};
View.currentView = null;
View.instances = {};
View.getInstance = function(people) {
   if(this.instances[people.name])
      return this.instances[people.name];
   return this.instances[people.name] = new View(people);
}

