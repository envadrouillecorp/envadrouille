known_sentences.concat({
   'configure_face':'Veuillez vérifier la configuration de l\'API de reconnaissance faciale. Il manque probablement la clef privée, publique ou le namespace. Si vous voulez reconnaître les visages en utilisant les metadonnées des photos uniquement, ne spécifiez pas d\'API de reconnaissance faciale.',
   'analyse_dir': 'Rechercher des visages',
   'analyse_dir_p': 'Recherche... ({0} images analysées / {1}; {2} visages trouvés)',
   'expand_dir':'Afficher les sous-répertoires',
   'people_d':'{0} ({1} visages(s))',
   'advanced_b':'Options avancées',
   'expl_tick':'Le répertoire a déjà été analysé',
   'expl_cross':'Le répertoire n\'a jamais été analysé',
   'rem_cache_orig':'Vider le cache',
   'clean_descr':'Enlever les visages qui ne sont plus utilisés',
   'gen_missing_faces':'Détecter tous les visages',
   'gen_descr':'Recherche dans tous les répertoires pour trouver des images non analysées',
   'unknown':'Iconnu',
   'face_help':function() {
      return 'Pour reconnaître des visages:<br/>'
      +'<ul>'
      +'<li>Cliquez sur un bouton "rechercher des visages" d\'un répertoire. Des visages apparaitront normalement sur votre écran.</li>'
      +'<li>Cliquez dans le champ texte sous un visage et indiquez le nom de la personne. Validez avec les touches TAB ou ENTREE.</li>'
      +'<li>Vous pouvez supprimer un visage en appuyant sur la touche SUPPR.</li>'
      +'<li>Une fois des visages reconnus, utilisez le menu déroulant pour voir les visages des différentes personnes.</li>'
      +'</ul>'
      +'Lorsque vous aurez ajouté suffisamment de visages, la galerie tentera de reconnaître automatiquement les personnes connues.<br/>'
      +'Pour rechercher un visage dans la galerie, tapez "face:nom-de-la-personne" dans le champ de recherche.';
	},
   'help':'Aide',
   'empty_trash':'Vider la corbeille',
   'empty_trash_descr':'Supprime tous les visages de la corbeille.',
   'waiting_update':'Détection... ({0}/{1} répertoires analysés, {2}/{3} images analysées, {4} visages trouvés)',
   'waiting_clean':'Nettoyage... ({0}/{1} répertoires analysés)',
});
