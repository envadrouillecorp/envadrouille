/*
 * main.js
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 */

String.prototype.format = function(args) {
  return this.replace(/{(\d+)}/g, function(match, number) { 
    return typeof args[number] != 'undefined'
      ? args[number]
      : match
    ;
  });
};

known_sentences.concat = function(obj) {
   for (var key in obj) {
      this[key] = obj[key];
   }
   return this;
}


window.t = function(sentence, params) {
	var mesg = known_sentences[sentence];
	if(typeof sentence == 'function')
		return 'fun?';
	if(!mesg)
		if(sentence && params)
			return sentence.format(params);
		else if(sentence)
			return sentence;
		else 
			return 'bug';
	if(typeof mesg == 'function')
		return mesg(params);
	else if(params)
		return mesg.format(params);
	else
		return mesg;
};

(function( $ ){
  $.fn.translate = function(){
	  $.each(this, function(id, v) {
		  var obj= $(v);
        if(obj.hasClass('translate')) {
           if(obj.val && obj.val() != '') {
              obj.val(t(obj.val()));
           } else {
              obj.html(t(obj.html()));
           }
        } else {
           obj.find('.translate').translate();
        }
	  });
     return this;
  }
})(jQuery);

$(document).ready(function() {
	$('.translate').translate();
});

