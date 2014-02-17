known_sentences.concat({
   /** Index **/
	'updating': function(params) {
      if(params)
         return 'Mise � jour... ('+params[0]+'/'+params[1]+')';
      else
         return 'Mise � jour...';
   },
	'writing_cache': 'Ecriture du cache...',
	'gen_missing_thumbs':'Cr�er toutes les miniatures manquantes',
	'add_all':'Ajouter tous les dossiers',
	'wait_all':function(params) {
      if(!params) 
         return 'Merci de patienter, l\'ajout de tous les dossiers peut prendre un certain temps...';
      else
         return 'Merci de patienter, l\'ajout de tous les dossiers peut prendre un certain temps... (Fait: '+params[0]+'/'+params[1]+')';
   },
   'wait_thumb':function(params) {
      if(!params) 
         return 'Merci de patienter, la cr�ation des miniatures peut prendre un certain temps...';
      else
         return 'Merci de patienter, la cr�ation des miniatures peut prendre un certain temps... (Fait: '+params[0]+'/'+params[1]+')';
   },

	'wait_clean':function(params) {
      if(!params) 
         return 'Merci de patienter, le nettoyage du cache peut prendre un certain temps...';
      else
         return 'Merci de patienter, le nettoyage du cache peut prendre un certain temps... (Fait: '+params[0]+'/'+params[1]+')';
   },
	'rem_cache_orig':'Supprimer les donn�es inutiles du cache',
	'rem_cache':'{0} entr�es inutiles supprim�es',
	'add_dir': 'Ajouter le r�pertoire',
	'up_dir': 'Mettre � jour le repertoire',
	'descr' : 'Descr&nbsp;:',
   'Uploading...': 'Envoi...',
	'starred': '�toile :',
	'hidden': 'Cach�&nbsp;:',
	'up_thumb':'T�l�verser une miniature',
	'drop_thumb':'D�poser l\'image ici',
	'th_dir':'Changer la miniature',
	'sending_thumb':'Envoi de la miniature...',
   'cancelt_dir':'Annuler',
	'index_button_descr':'Utilisez ces boutons pour effectuer des op�rations sur tout le serveur. Ces op�rations peuvent prendre quelques minutes (si vous n\'avez ajout� des photos que dans un dossier, il est pr�f�rable de mettre � jour ce dossier directement)',
   'expl_tick':'Le dossier a d�j� �t� ajout� (pensez � le mettre � jour lorsque vous ajoutez/supprimez des images)',
   'expl_mod':'Les donn�es associ�es au dossier ont �t� modifi�es mais pas envoy�es sur le serveur',
   'expl_cross':'Le dossier n\'a pas encore �t� ajout�, personne ne peut le voir.',
   'advanced_b':'Maintenance',
   'gen_descr':'Cr�e les miniatures manquantes pour toutes les galeries. N\'utilisez cette option que si vous avez mis � jour de nombreuses galeries.',
   'add_all_descr':'Ajoute tous les dossiers qui n\'ont pas encore �t� ajout�s.',
   'clean_descr':'Supprime les entr�es inutiles du cache (ex: une miniature d\'une image supprim�e).',
   'satellite':'satellite',
   'terrain':'relief',
   'roadmap':'plan',
   'no_dir':'Le r�pertoire photo ne contient aucun dossier. Ajoutez des dossiers dans le r�pertoire photo pour continuer (ou allez dans les options pour modifier l\'emplacement de ce r�pertoire)',
});
