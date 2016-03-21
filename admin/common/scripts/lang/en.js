/**
 * Make sure you write the file in latin1 
 */
var known_sentences = {
   /** Header **/
   'permission':function(arg) {
      var msg = 'Warning, the gallery cannot create or modify the following files ; changes will likely not be saved:<ul>';
      for(var id in arg) {
         if(arg[id]) continue;
         msg += '<li><img src="common/css/no.png" /> '+id+' (Permission denied)</li>';
      }
      msg += '</ul>';
      return msg;
   },
   'action_fail':action_fail_msg,
};
