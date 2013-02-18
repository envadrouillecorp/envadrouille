/*
 * Face.js
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 */

function Face(json) {
   var self = this;
   self.id = getUID();
   self.uid = json.uid;
   self.name = json.people;
   self.basename = json.people;
   self.basepath = json.basepath;
   self.thumb = json.thumb = json.path+'/'+json.name;
   self.focused = false;
   self.autocompleteSelection = -1;
   self.matchs = [];
   self.savedVal = null;
   self._showLoading = false;

   self.recognized = (self.name !== 'unknown');
   self.recognitionInProgress = false;
   self.batch = new Batch(Face.BatchContainer, function() {
   }, null);
   
   self.changeName = function(name) {
      if(name == self.basename || name == '' || name == 'unknown')
         return;

      self.recognized = true;
      self.focused = false;
      self.cancelRecognition();
      self.basename = name;

      People.getInstance(self).rmFace(self);
      People.getInstance({name:name}).addFace(self);
   }

   self.addActions = function() {
      $('#'+self.id+'_name').val(t(self.name)).attr('title', t(self.name)).focus(function() {
         if(self.recognized && self.name != 'unknown') {
            this.select();
            if($(this).val() == $(this).attr('title')) {
               $(this).removeClass("defaultTextActive");
            }
         } else {
            if($(this).val() == $(this).attr('title') || self.name == 'unknown' || self.name == 'trash') {
               $(this).removeClass("defaultTextActive");
               $(this).val("");
            }
         }
         self.focused = true;
         self.autocompleteSelection = -1;
         self.showAutocomplete();
      }).keydown(function(evt) {
         if(evt.keyCode == 13 || evt.keyCode == 9) {
            var n = $('#'+self.id+'_name').val();
            if(n != '' && n != 'unknown')
               self.changeName($('#'+self.id+'_name').val());
            self.closeAutocomplete();
         } else if(evt.keyCode == 46 && $('#'+self.id+'_name').val() == "") {
            self.focused = false;
            self.changeName('trash');
            self.closeAutocomplete();
         } else if(evt.keyCode == 40) {
            self.autocompleteSelection++;
            $('#'+self.id+'_name').val(self.getAutocompleteName());
         } else if(evt.keyCode == 38) {
            self.autocompleteSelection--;
            $('#'+self.id+'_name').val(self.getAutocompleteName());
         } else {
            self.savedVal = $('#'+self.id+'_name').val();
            self.autocompleteSelection = -1;
         }
      }).keyup(function() {
         if(self.focused)
            self.showAutocomplete();
      }).blur(function() {
         if ($(this).val() == "") {
            $(this).addClass("defaultTextActive");
            $(this).val($(this).attr('title'));
         }
         self.closeAutocomplete();
         self.focused = false;
         self.autocompleteSelection = -1;
      });
   }
   
   self.sanitizeAutocompleteSelection = function() {
       if(self.autocompleteSelection < -1)
         self.autocompleteSelection = -1;
      if(self.autocompleteSelection >= self.matchs.length)
         self.autocompleteSelection = self.matchs.length - 1;
   }

   self.showAutocomplete = function() {
      if(self.autocompleteSelection <= -1) {
         var people = People.getKnownPeople();
         self.matchs = [];
         self.savedVal = $('#'+self.id+'_name').val();
         var regexp = new RegExp('('+self.savedVal+')', "i");
         for(var p in people) {
            if(people[p].match(regexp) && people[p] != 'unknown' && people[p] != 'trash')
               self.matchs.push(people[p]);
         }
      }
      self.sanitizeAutocompleteSelection();
      if(self.matchs.length == 0) {
         self.closeAutocomplete();
         return;
      }
   
     
      $('#divResult').remove();
      var res = $('<div id="divResult" class="triangle-border top"></div>');
      var reg = new RegExp('('+self.savedVal+')', "i");
      for(var m in self.matchs) {
         res.append($('<p'+((m==self.autocompleteSelection)?' class="selected" ':'')+'>'+self.matchs[m].replace(reg, "<b class='selected'>$1</b>")+'</p>'));
      }
      $('#'+self.id+'_autocomplete').html(res);
   }

   self.closeAutocomplete = function() {
      self.autocompleteSelection = -1;
      $('#divResult').remove();
   }

   self.getAutocompleteName = function() {
      self.sanitizeAutocompleteSelection();
      if(self.autocompleteSelection != -1)
         return self.matchs[self.autocompleteSelection];
      else
         return self.savedVal!==null?self.savedVal:$('#'+self.id+'_name').val();
   }

   self.show = function() {
      $("#faceTpl").tmpl(self).appendTo($('#face-container'));
      if(self._showLoading)
         self.showLoading();

      self.addActions();

      if(self.recognized && self.name != 'unknown') {
         $('#'+self.id+'_name').val(self.name);
         return;
      }
      if(!self.recognitionInProgress) {
         self.batch.get({action:'face.recognize', dir:self.basepath, face:self.uid}, function(json) {
            if(self.recognized)
               return;
            self.name = json.name;
            self.recognized = true;
            if(!self.focused) 
               $('#'+self.id+'_name').val(t(self.name)).attr('title', t(self.name));
         });
         self.batch.launch();
      }
      self.recognitionInProgress = true;
   }

   self.showLoading = function() {
      $('#'+self.id+'_container').find('#ok').css('display', 'none');
      $('#'+self.id+'_container').find('#pending').css('display', 'block');
      self._showLoading = true;
   }

   self.showLoaded = function() {
      $('#'+self.id+'_container').find('#pending').css('display', 'none');
      $('#'+self.id+'_container').find('#ok').css('display', 'block');
      self._showLoading = false;
   }

   self.cancelRecognition = function() {
      if(self.recognitionInProgress) {
         self.batch.cancel();
         self.recognitionInProgress = false;
      }
   }
};
Face.BatchContainer = new BatchContainer(3);
Face.instances = {};
Face.getInstance = function(json) {
   if(this.instances[json.uid])
      return this.instances[json.uid];
   return this.instances[json.uid] = new Face(json);
}

