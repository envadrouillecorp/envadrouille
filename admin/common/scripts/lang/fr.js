/**
 * Make sure you write the file in latin1
 */
var known_sentences = {
   /** Header **/
   'permission':function(arg) {
      var msg = 'Attention, le serveur n\'a pas les droits pour modifier certains fichiers ; les modifications ne seront pas enregistrées:<ul>';
      for(var id in arg) {
         if(arg[id]) continue;
         msg += '<li><img src="common/css/no.png" /> '+id+' (Problème de permission)</li>';
      }
      msg += '</ul>';
      return msg;
   },
   'action_fail':action_fail_msg,
};
