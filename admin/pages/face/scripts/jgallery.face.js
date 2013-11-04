/*
 * jgallery.face.js
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 */
var FacePlugin = {
   pattern:/^face:([^#]+)(#?.*?)$/,
   oldSearch:null,
   realSearch:function(txt) {
      if(txt == null)
         txt = jGallery.searchedText;

      var m = txt.match(FacePlugin.pattern);
      if(m) {  
         FacePlugin.handle(txt);
         return;
      }
      return FacePlugin.oldSearch(txt);
   },

   savedJSON:[],
   getFaceJSON:function(name, cb, cbargs) {
      if(FacePlugin.savedJSON[name]) {
         cb(cbargs, FacePlugin.savedJSON[name]);
         return;
      }

      FacePlugin.savedJSON[name] = {
         SearchText:name,
         type:"partial"
      }
      cb(cbargs, FacePlugin.savedJSON[name]);

      $.ajax({ url:jGalleryModel.cacheDir+'/people/'+name+'.json',
         dataType: 'json',
         cache:false,
         success:function(data) {  
            var nbMatches = 0;
            var error = false;
            if(!data || !data.faces)
               error = true;
            if(!error) {
              for(var face in data.faces)
                  nbMatches++;
            }
            if(nbMatches == 0) {
               FacePlugin.savedJSON[name] = {
                  Error:'<span class="translate">'+jGalleryModel.translate('Search complete')+'</span> - 0 <span class="translate">'+jGalleryModel.translate('result found')+'</span>',
                  type:"error"
               };
            } else {
               FacePlugin.savedJSON[name] = {
                  json:data,
                  nbMatches:nbMatches,
                  type:"ok"
               };
            }
            cb(cbargs, FacePlugin.savedJSON[name]);
         },
         error:function(JSONHttpRequest, textStatus, errorThrown) {
            FacePlugin.savedJSON[name] = {
               Error:'<span class="translate">'+jGalleryModel.translate('Search complete')+'</span> - 0 <span class="translate">'+jGalleryModel.translate('result found')+'</span>',
               type:"error"
            };
            cb(cbargs, FacePlugin.savedJSON[name]);
         },
      });
   },
   
   showResults:function(action, data) {
      if(action != jGallery.searchedText)
         return;
      if(jGallery.lastSuccessfullSearch && jGallery.lastSuccessfullSearch.search == action)
         return;

      $("#searchTpl").tmpl().appendTo($('#content').empty());
      jGallery.theme.showHeader();
      $('#content').css('opacity',1);
      $('#searchbox').focus();
      $('#searchText').text(action);
      $('#permalink').html('<a href="http://'+jQuery.url.attr('host')+jQuery.url.attr('directory')+'#search-'+action+'">[Permalink]</a>');
      $('#search_infob').text('');
      $('#search_results').text('');
      $('#srt').translate();
      page.loaded = true;


      if(data.type == "partial") {
         $('#search_loading').css('display', 'block');
         $('#search_info').css('display', 'none');
         jGallery.lastSuccessfullSearch = null;
      } else if(data.type == "error") {
         $('#search_loading').css('display', 'none');
         $('#search_info').css('display', 'block');
         $('#search_info').html(data.Error);
         jGallery.lastSuccessfullSearch = {
            search:action,
            res:null,
         };
      } else {
         $('#search_info').css('display', 'block');
         $('#search_loading').css('display', 'none');
         $('#search_info').remove();
         
         jGallery.lastSuccessfullSearch = {
            search:action,
            res:data
         };

         var pics = [];
         for(var f in data.json.faces) {
            var face = data.json.faces[f];
            var pic = {
               fullpath:jGalleryModel.cacheDir+'/'+face.basepath.replace(jGalleryModel.picsDir, jGalleryModel.cacheDir+'/..'),
               url:face.basename,
            };
            pics.push(pic);
         }
         jGallery.theme.showContent('pics', {pics:pics});

         $('#content').append($('<br/><div id="search_info" class="search"><span class="translate">'+jGalleryModel.translate('Search complete')+'</span> - '+data.nbMatches+' <span class="translate">'+jGalleryModel.translate('result'+(data.nbMatches>1?'s':'')+' found')+'</span></div>'));

         jGallery.parseHash(window.location.hash.replace(/^#!?/, ''));
      }
   },

   handle:function(action) {
      var m = action.match(FacePlugin.pattern);
      if(!m) {
         jGallery.theme.showError({
            Error:"FacePlugin cannot handle "+action,
            type:"error"
         });
         return;
      }

      jGallery.searchedText = action;
      jGallery.switchPage('search');


      var name = m[1];
      FacePlugin.getFaceJSON(name, FacePlugin.showResults, action);
   },


   init:function() {
      FacePlugin.oldSearch = jGallery.realSearch;
      jGallery.realSearch = FacePlugin.realSearch;
   }
};
config.pluginsInstances.push(FacePlugin);
