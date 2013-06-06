/**
 * Make sure you write the file in latin1 
 */
var known_sentences = {
   /** Header **/
   'update_gal':'Your gallery is outdated. <a href="index.php?action=update&nversion={0}&oversion={1}">Update</a> automatically or <a href="http://update.envadrouille.org/latest.zip">download</a> the lastest version.',
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
