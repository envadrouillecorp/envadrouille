known_sentences.concat({
   /** Index **/
	'updating': function(params) {
      if(params)
         return 'Mise à jour... ('+params[0]+'/'+params[1]+')';
      else
         return 'Mise à jour...';
   },
	'writing_cache': 'Ecriture du cache...',
	'gen_missing_thumbs':'Créer toutes les miniatures manquantes',
	'add_all':'Ajouter tous les dossiers',
	'wait_all':function(params) {
      if(!params) 
         return 'Merci de patienter, l\'ajout de tous les dossiers peut prendre un certain temps...';
      else
         return 'Merci de patienter, l\'ajout de tous les dossiers peut prendre un certain temps... (Fait: '+params[0]+'/'+params[1]+')';
   },
   'wait_thumb':function(params) {
      if(!params) 
         return 'Merci de patienter, la création des miniatures peut prendre un certain temps...';
      else
         return 'Merci de patienter, la création des miniatures peut prendre un certain temps... (Fait: '+params[0]+'/'+params[1]+')';
   },

	'wait_clean':function(params) {
      if(!params) 
         return 'Merci de patienter, le nettoyage du cache peut prendre un certain temps...';
      else
         return 'Merci de patienter, le nettoyage du cache peut prendre un certain temps... (Fait: '+params[0]+'/'+params[1]+')';
   },
	'rem_cache_orig':'Supprimer les données inutiles du cache',
	'rem_cache':'{0} entrées inutiles supprimées',
	'add_dir': 'Ajouter le répertoire',
	'up_dir': 'Mettre à jour le repertoire',
	'descr' : 'Descr&nbsp;:',
   'Uploading...': 'Envoi...',
	'starred': 'Étoile :',
	'hidden': 'Caché&nbsp;:',
	'up_thumb':'Téléverser une miniature',
	'drop_thumb':'Déposer l\'image ici',
	'th_dir':'Changer la miniature',
	'sending_thumb':'Envoi de la miniature...',
   'cancelt_dir':'Annuler',
	'index_button_descr':'Utilisez ces boutons pour effectuer des opérations sur tout le serveur. Ces opérations peuvent prendre quelques minutes (si vous n\'avez ajouté des photos que dans un dossier, il est préférable de mettre à jour ce dossier directement)',
   'expl_tick':'Le dossier a déjà été ajouté (pensez à le mettre à jour lorsque vous ajoutez/supprimez des images)',
   'expl_mod':'Les données associées au dossier ont été modifiées mais pas envoyées sur le serveur',
   'expl_cross':'Le dossier n\'a pas encore été ajouté, personne ne peut le voir.',
   'advanced_b':'Maintenance',
   'gen_descr':'Crée les miniatures manquantes pour toutes les galeries. N\'utilisez cette option que si vous avez mis à jour de nombreuses galeries.',
   'add_all_descr':'Ajoute tous les dossiers qui n\'ont pas encore été ajoutés.',
   'clean_descr':'Supprime les entrées inutiles du cache (ex: une miniature d\'une image supprimée).',
   'satellite':'satellite',
   'terrain':'relief',
   'roadmap':'plan',
   'no_dir':'Le répertoire photo ne contient aucun dossier. Ajoutez des dossiers dans le répertoire photo pour continuer (ou allez dans les options pour modifier l\'emplacement de ce répertoire)',
});
