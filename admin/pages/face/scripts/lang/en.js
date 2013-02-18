known_sentences.concat({
   'configure_face':'Please check the facial recognition configuration options in the "options" menu. Either the facial API provider is incorrect or you miss the API namespace, private or public keys.',
   'analyse_dir': 'Detect faces in directory',
   'analyse_dir_p': 'Detecting faces... ({0} pictures analysed / {1}; {2} faces found)',
   'expand_dir':'Show subdirectories',
   'people_d':'{0} ({1} face(s))',
   'advanced_b':'Advanced options',
   'expl_tick':'The directory has already been scanned',
   'expl_cross':'The directory has never been scanned',
   'rem_cache_orig':'Clean cache',
   'clean_descr':'Remove faces that are no longer used',
   'gen_missing_faces':'Detect All Faces',
   'gen_descr':'Look in all directories for faces that have not yet been recognized',
   'unknown':'Unrecognized',
	'face_help':function() {
      return 'To recognize faces:<br/>'
      +'<ul>'
      +'<li>Click on the "detect faces" button of a directory. Faces will appear on your screen.</li>'
      +'<li>Click on the text box under a face to type its name. Validate using the ENTER or TAB keys.</li>'
      +'<li>You can also press the SUPPR key to remove the face.</li>'
      +'<li>Use the menu next to the help button to see people\'s faces.</li>'
      +'</ul>'
      +'Once you have added enough faces, the gallery will try to recognize known people automatically.<br/>'
      +'To search for faces in the main gallery, type for "face:people-name" in the search box';
	},
   'help':'Help',
   'empty_trash':'Empty trash',
   'empty_trash_descr':'Remove all faces in the bin',
   'waiting_update':'Please wait... ({0}/{1} directories analysed, {2}/{3} pictures analysed, {4} faces found)',
   'waiting_clean':'Please wait... ({0}/{1} directories analysed)',
});
