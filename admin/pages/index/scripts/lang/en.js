known_sentences.concat({
    /** Index **/
	'updating': function(params) {
      if(params)
         return 'Updating... ('+params[0]+'/'+params[1]+')';
      else
         return 'Updating...';
   },
	'writing_cache': 'Writing cache...',
	'gen_missing_thumbs':'Generate Missing Thumbs',
	'wait_thumb':function(params) {
      if(!params) 
         return 'Please wait, generating thumbs might take a long time...';
      else
         return 'Please wait, generating thumbs might take a long time... (Done: '+params[0]+'/'+params[1]+')';
   },
	'wait_clean':function(params) {
      if(!params) 
         return 'Please wait, cleaning cache might take a long time...';
      else
         return 'Please wait, cleaning cache might take a long time... (Done: '+params[0]+'/'+params[1]+')';
   },
	'rem_cache_orig':'Remove useless cached entries',
	'rem_cache':'{0} useless cache entries removed',
	'add_dir': 'Add directory',
	'up_dir': 'Update directory',
	'descr' : 'Descr:',
	'Uploading...': 'Uploading...',
   'starred': 'Starred:',
	'hidden': 'Hidden:',
	'up_thumb':'Upload a new thumbnail',
	'drop_thumb':'Drop picture here',
	'th_dir':'Choose a new thumbnail',
	'sending_thumb':'Sending thumbnail...',
   'cancelt_dir':'Cancel',
	'index_button_descr':'Use these buttons to perform global maintenance on the server. Since these operation parse all directories, they might take a long time (if you have added pictures in only one directory, it is faster to update the directory alone)',
   'expl_tick':'The directory has already been added (you may still want to update it if you have added/removed pictures)',
   'expl_mod':'The directory information has been modified but not sent on the server',
   'expl_cross':'The directory has not yet been added. Nobody can access it.',
   'advanced_b':'Advanced Options',
   'gen_descr':'Look in all directories for missing thumbnails and create them if needed. Use this option if you have added pictures in multiple directories',
   'clean_descr':'Look in the cache directories for entries that are no longer required (e.g., thumbnails of deleted pictures) and remove them',
   'no_dir':'Your picture directory does not contain any gallery. Upload directories with photos in your "picture directory" to continue. (See options to modify the picture directory.)',
});
