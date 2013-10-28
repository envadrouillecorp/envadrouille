known_sentences.concat({
   'configure_face':'Veuillez v�rifier la configuration de l\'API de reconnaissance faciale. Il manque probablement la clef priv�e, publique ou le namespace. Si vous voulez reconna�tre les visages en utilisant les metadonn�es des photos uniquement, ne sp�cifiez pas d\'API de reconnaissance faciale.',
   'analyse_dir': 'Rechercher des visages',
   'analyse_dir_p': 'Recherche... ({0} images analys�es / {1}; {2} visages trouv�s)',
   'expand_dir':'Afficher les sous-r�pertoires',
   'people_d':'{0} ({1} visages(s))',
   'advanced_b':'Options avanc�es',
   'expl_tick':'Le r�pertoire a d�j� �t� analys�',
   'expl_cross':'Le r�pertoire n\'a jamais �t� analys�',
   'rem_cache_orig':'Vider le cache',
   'clean_descr':'Enlever les visages qui ne sont plus utilis�s',
   'gen_missing_faces':'D�tecter tous les visages',
   'gen_descr':'Recherche dans tous les r�pertoires pour trouver des images non analys�es',
   'unknown':'Iconnu',
   'face_help':function() {
      return 'Pour reconna�tre des visages:<br/>'
      +'<ul>'
      +'<li>Cliquez sur un bouton "rechercher des visages" d\'un r�pertoire. Des visages apparaitront normalement sur votre �cran.</li>'
      +'<li>Cliquez dans le champ texte sous un visage et indiquez le nom de la personne. Validez avec les touches TAB ou ENTREE.</li>'
      +'<li>Vous pouvez supprimer un visage en appuyant sur la touche SUPPR.</li>'
      +'<li>Une fois des visages reconnus, utilisez le menu d�roulant pour voir les visages des diff�rentes personnes.</li>'
      +'</ul>'
      +'Lorsque vous aurez ajout� suffisamment de visages, la galerie tentera de reconna�tre automatiquement les personnes connues.<br/>'
      +'Pour rechercher un visage dans la galerie, tapez "face:nom-de-la-personne" dans le champ de recherche.';
	},
   'help':'Aide',
   'empty_trash':'Vider la corbeille',
   'empty_trash_descr':'Supprime tous les visages de la corbeille.',
   'waiting_update':'D�tection... ({0}/{1} r�pertoires analys�s, {2}/{3} images analys�es, {4} visages trouv�s)',
   'waiting_clean':'Nettoyage... ({0}/{1} r�pertoires analys�s)',
});
