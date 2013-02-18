/**
 * Make sure you write the file in latin1
 */
var known_sentences = {
   /** Header **/
   'update_gal':'Une mise à jour est disponible. Mettez à jour <a href="index.php?action=update&nversion={0}&oversion={1}">automatiquement</a> ou <a href="http://update.envadrouille.org/latest.zip">téléchargez</a> la dernière version.',
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
