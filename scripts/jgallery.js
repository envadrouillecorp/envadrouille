/*
 * jgallery.js
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 */

var jGalleryModel = {
   cacheDir:'./cache',
   picsDir:'./pics',
   dirPattern:/(\d+)[-_\.\s](\d+)[-_\.\s]((?:\d+-?)?\d*)[-_\.\s]*(.*?)$/,
   
   urlToJSON: function(dir) {
      return jGalleryModel.cacheDir+'/json/'+dir+'cache.json';
   },

   /* Read a JSON object. We maintain a cache because current browsers caches don't deal very well with the TTL of JSON objects... (JSONs are often not cached at all) */
   savedJSON : [],
   currentDir: '',
   alternateURL:function(url, number) {
      switch(number) {
         case 0:
            return url;
         case 1:
            return encodeURI(url);
         case 2:
            return decodeURIComponent(escape(url));
         case 3:
            return decodeURIComponent(escape(url.replace(/\+/g, ' ')));
         case 4:
            return url.replace(/&#x?(.*?);/g, function(s, m) {
                var unicode_code = parseInt(m, 10);
                if (unicode_code < (1 << 16)) {
                  return String.fromCharCode(unicode_code);
                } else {
                  var first = ((unicode_code - (1 << 16)) / (1 << 10)) + 0xD800;
                  var second = (unicode_code % (1 << 10)) + 0xDC00;
                  return String.fromCharCode(first) + String.fromCharCode(second);
                }
            });
         default:
            return null;
      }
   },
   stripModifiers:function(hash) {
      return hash.replace(/([^&])#.*$/, '$1');
   },
   getJSON:function(dir, callback, attemptNumber) {
      var url;
      if(dir == null || dir == '')
         url = '';
      else
         url = jGalleryModel.stripModifiers(dir)+'/';

      if(jGalleryModel.savedJSON[url]) 
         return jGalleryModel.savedJSON[url];

      if(attemptNumber == undefined)
         attemptNumber = 0;

      if(!callback)
         callback = function() { jGallery.switchPage(dir); /* reload */ };

      var realurl = jGalleryModel.alternateURL(url, attemptNumber);
      if(realurl == null) {
         jGalleryModel.savedJSON[url] = {
            Error:"URL: "+jGalleryModel.urlToJSON(url)+" cannot be accessed.",
            type:"error"
         };
         callback();
	 return;
      } else {
         jGalleryModel.currentDir = realurl.replace(/\/$/, '');
      }

      $.ajax({ url:jGalleryModel.urlToJSON(realurl), 
         dataType: 'json',
         cache:false,
         success:function(data) {  
            if(data === null) {
               jGalleryModel.getJSON(dir, callback, attemptNumber + 1);
               return;
            }
            if(data.dirs) {
               for(var i in data.dirs) {
                  data.dirs[i].completeurl = realurl+data.dirs[i].url;
                  data.dirs[i].ID = i;
                  data.dirs[i].descr = data.dirs[i].descr.replace(/\n/g, "<br/>");
               }
            }
            if(data.descr)
               data.descr = data.descr.replace(/\n/g, "<br/>");
            data.realurl = realurl.replace(/\/$/,'');

            jGalleryModel.savedJSON[url] = {
               json:data,
               type:"ok"
            };
            callback();
         },
         error:function(JSONHttpRequest, textStatus, errorThrown) {
            var doAction = true;
            if(url == '') {
               jGalleryModel.savedJSON[url] = {
                  Error:"No gallery has been added yet. Please go in the administration and add some galleries.",
                  type:"error"
               };
            } else {
               doAction = false;
               jGalleryModel.getJSON(dir, callback, attemptNumber + 1);
            }
            if(doAction) 
               callback();
         }
      }); 
      return undefined;
   },

   /* Fun RegExp manipulation. Return all directories matchings words in 'txt'. */
   getSearchResults:function(txt) {
      var json = jGalleryModel.getJSON('', jGallery.search); 
      if(!json) {
         return {
            SearchText:txt,
            type:"partial"
         };
      } else if(json.type == "error") {
         return {
            SearchText:txt,
            type:"error",
            error:jGalleryModel.translate("An error has occured in your search :(")+'<br/>'+json.Error
         };
      } else {
         json = json.json;

         var regX = /"([^"]+)"|([^\s"]+)/g;
         var words = txt.match(regX);
         if(!words) {
            return {
               SearchText:txt,
               type:"error",
               error:jGalleryModel.translate((txt=='"')?'Please enter a search term':"An error has occured in your search :(<br/>(Invalid search query)")
            };
         }
         var searchReg = [];
         for(var w = 0; w < words.length; w++) {
            /* When searching for a "quoted text", force regex to match beginning of a word */
            try {
               if(words[w][0] == '"' && words[w][words[w].length-1] == '"') {
                  words[w] = words[w].slice(1, words[w].length - 1);
                  searchReg.push(new RegExp('(\\b'+words[w]+')', "gi"));
               } else {
                  searchReg.push(new RegExp('('+words[w]+')', "gi"));
               }
            } catch(err) {
               return {
                  SearchText:txt,
                  type:"error",
                  error:jGalleryModel.translate("Invalid regular expression")
               };
            }
         }


         var searchResults = []; /* [i] = [i, number of matches, number of terms matched] */
                           /* e.g. [i] = [i, 3, 2] with search "toto titi" = both word found (2) ; total of (3) matches */   
         for (var i in json.dirs) {
            var d = json.dirs[i];
            for(var w in searchReg) {
               var match = false;
               var m = d.url.match(searchReg[w]);
               if(m) {
                  if(!searchResults[i])
                     searchResults[i] = [i, 0, 0];
                  searchResults[i][1] += m.length;
                  searchResults[i][2] += 1;
                  match = true;
               }

               m = d.descr.match(searchReg[w]);
               if(m) {
                  if(!searchResults[i])
                     searchResults[i] = [i, 0, 0];
                  searchResults[i][1] += m.length;
                  searchResults[i][2] += match?0:1;
                  match = true;
               }
            }
         }

         /* Sort results by number of terms matched and then by absolute number of matches */
         searchResults.sort(function sortByOccurrence(a,b) {
            if(a[2] == b[2])
               return b[1] - a[1];
            else
               return b[2] - a[2];
         });

         var fullResults = [];
         var partialResults = [];
         for (var i in searchResults) {
            if(searchResults[i][2] == searchReg.length)
               fullResults.push(json.dirs[searchResults[i][0]]);
            else
               partialResults.push(json.dirs[searchResults[i][0]]);
         }

         return {
            Regs: searchReg,
            Words: words,
            FullResults: fullResults,
            PartialResults: partialResults,
            SearchText:txt,
            type:"complete"
         };
      }
   },

   pageToUrl:function (p) {
      var dirUrl = '';
      if(p != '' && p != 'search')
         dirUrl = p+'/';
      return dirUrl;
   },

   origContent: {},
   translate:function(v) {
      var o = jGalleryModel.origContent[v];
      var t = config.t(o?o:v);
      if(!jGalleryModel.origContent[t]) {
         jGalleryModel.origContent[t] = v;
      }
      return t;
   },
};

var jGallery = {
   currentPage:-1,
   canReload:0,
   searchedText:'',
   lastSuccessfullSearch:null,
   firstThemeSwitch:1,
   themeName:'default',
   theme:null,
   lang:'en',
   plugins:[],
   isMobile:/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),

   replaceHash:function(hash) {
      var i = 0, url;
      while(url = jGalleryModel.alternateURL(hash, i++)) {
         if(url == window.location.hash || url == unescape(window.location.hash))
            return;
      }
      window.location.hash = hash;
   },

   switchLang:function(l) {
      $('#language').attr('disabled', true);
      if(jGallery.lang != l) {
         jGallery.lang = l;
         $script.loaded['langjs'] = false;
         $script('scripts/lang/'+l+'.js', 'langjs', function() {
            if(jGallery.theme && jGallery.theme.changeThemeLang) jGallery.theme.changeThemeLang(l);
            $('.customtranslate').trigger('languagechangeevt');
            $('.translate').translate();
            $('tspan').translate();
            $('#language').attr('disabled', false);
         });
      } else {
         if(jGallery.theme && jGallery.theme.changeThemeLang) jGallery.theme.changeThemeLang(l);
         $('#language').attr('disabled', false);
      }
   },

   /* Change theme and set cookies accordingly */
   switchTheme: function(t) {
      if(jGallery.themeName == t && !jGallery.firstThemeSwitch)
         return;

      jGallery.themeName = t;
      $('#theme').attr('disabled', true);
      $('.customtheme').trigger('themebeginevt');
      $('#l').css('backgroundColor', config.getThemes()[t]['FG']);
      /* If the internal representation of the bgcolor is wrong, then animate won't work... */
      $('body').css('backgroundColor', $('body').css('backgroundColor')); // ^Stupid bug fix !
      page.loaded = false;
      page.showLoading();
      $('#m').stop().animate({opacity:0}, jGallery.firstThemeSwitch?0:'slow', function() {
         $('#m').children().remove();
      $('body').stop().animate({ backgroundColor: config.getThemes()[t]['BG'] }, jGallery.firstThemeSwitch?0:'slow', function() {
         function showT() {
            jGallery.theme = config.loadedThemes[jGallery.themeName];
            page.loaded = true;
            if(jGallery.theme.changeThemeLang) jGallery.theme.changeThemeLang(jGallery.lang);
            jGallery.addHeader();
            jGallery.firstThemeSwitch = 0;
            $('#m').animate({'opacity':1}, 'slow');
            $('#theme').attr('disabled', false);
            $('.customtheme').trigger('themeendevt');
            jGallery.canReload = 1;
            jGallery.switchPage(jGallery.currentPage);
         }
         var done = 0;
         function tryShowT() {
            if(++done == 2)
               showT();
         }
         if(!jGallery.firstThemeSwitch) {
            /*if(navigator.appName == 'Microsoft Internet Explorer') 
               window.location.reload();*/
            jGallery.addCss('themes/'+t+'/main.css', 'themecss', tryShowT);
            $('#themejs').remove();
            $script.loaded['themejs'] = false;
            $script('themes/'+t+'/main.js', 'themejs', function() { tryShowT(); });
         } else {
            showT();
            jGallery.firstThemeSwitch = 0;
         }
      });
      });
      return false;
   },

   loadedCss:{},
   loadedCssCb:{},
   cssReady:function(name, cb) {
      if(jGallery.loadedCss[name]) cb();
      else (jGallery.loadedCssCb[name])?jGallery.loadedCssCb[name].push(cb):(jGallery.loadedCssCb[name]=[cb]);
   },
   addCss:function(url, name, cb) {
      url = url + '?' + config.VERSION;

      var link = document.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.id = name+'_tmp';
      link.href = url;

      document.getElementsByTagName('head')[0].appendChild(link);

      var img = document.createElement('img');
      img.onerror = function(){
         $('#'+name).remove();
         $('#'+name+'_tmp').attr('id', name);
         jGallery.loadedCss[name] = true;
         every(jGallery.loadedCssCb[name], function(cb) { cb(); });
         jGallery.loadedCssCb[name] = [];
         if(cb) cb();
      }
      img.src = url;
   },

   /* Common search stuff between all themes. */
   search: function(txt) {
      if(txt != null)
         jGallery.searchedText = txt;

      // set the hash
      if(txt != '') {
          if(!(location.hash && location.hash.match( /^.{0,2}search/ ))) {
             if(window.history && window.history.replaceState) { 
                jGallery.replaceHash('#!search-'+jGallery.searchedText);
             } else {
                jGallery.replaceHash('#!search');
             }
          } else if(window.history && window.history.replaceState) {
             history.replaceState('', '', '#!search-'+jGallery.searchedText);
          }
          document.title = 'Photos :: '+jGallery.searchedText;
      }

      $.doTimeout( 'searchID', 50, function(){
         jGallery.realSearch(txt);
      });
   },
   realSearch: function(txt) {
      txt = jGallery.searchedText;
      if(txt == '') {
         jGallery.switchPage('');
         return;
      } else
         jGallery.switchPage('search');

      var data;
      if(jGallery.lastSuccessfullSearch && jGallery.lastSuccessfullSearch.search == txt)
         return;
      else
         data = jGalleryModel.getSearchResults(txt); 

      $('#searchbox').focus();
      $('#searchText').text(txt);
      $('#permalink').html('<a href="'+jQuery.url.attr("protocol")+'://'+jQuery.url.attr('host')+jQuery.url.attr('directory')+'#!search-'+txt+'">[Permalink]</a>');
      $('#search_infob').text('');
      $('#search_results').text('');
      page.loaded = true;
      
      $('#pics').remove();
      $('.pic').remove();

      if(data.type == "partial") {
         $('#search_loading').css('display', 'block');
         $('#search_info').css('display', 'none');
      } else if(data.type == "error") {
         $('#search_loading').css('display', 'none');
         $('#search_info').css('display', 'block');
         $('#search_info').html(data.error);
      } else {
         $('#search_loading').css('display', 'none');
         jGallery.lastSuccessfullSearch = {
            search:txt,
            res:data
         };
         var nbMatches = data.FullResults.length + data.PartialResults.length; 
         if(nbMatches > 0) {
            $('#search_info').css('display', 'block');
            $('#search_info').html('<span class="translate">'+jGalleryModel.translate('Search complete')+'</span> - '+nbMatches+' <span class="translate">'+jGalleryModel.translate('result'+(nbMatches>1?'s':'')+' found')+'</span>');
            if(!data.FullResults.length) 
               $('#search_infob').text(jGalleryModel.translate('(No item matching search exactly found)'));
         } else {
            $('#search_info').css('display', 'none');
            $('#search_infob').text(jGalleryModel.translate('(No search result)'));
         }
         jGallery.theme.showSearch(data.FullResults, data.PartialResults, data.Words);
         $('#srt').translate();
      }
   },
   highlightText: function(txt, regs){
      var regex = new RegExp('(<[^>]*>)|('+ regs.join('|') +')', 'ig');
      return txt.replace(regex, function(a, b, c){
         return (a.charAt(0) == '<') ? a : '<span class="highlight">' + c + '</span>';
      });
   },

   parseHash: function(hash) {
      var currP = jGallery.currentPage;
      jGallery.cssReady('colorbox', function() {
         if(jGallery.currentPage != currP)
            return;

         /* Open pic when url is #!dir#pic */
         var selectors = hash.match(/#[^#]+/g);
         jGallery.currentPage = jGalleryModel.stripModifiers(jGallery.currentPage);

         $("a[rel*='gal']").each(function(id, pic) {
            var href = $(pic).attr('href').replace(/^.*\/([^\/]+)$/, '$1');
            for(var i in selectors) {
               var sel = selectors[i].replace(/#/, '');
               if(sel == href) {
                  $(pic).click();
                  break;
               }
            }
         });
      });
   },

   scrollTo:0,
   pop:function(e) {
      if(e.state && e.state.scroll)
         jGallery.scrollTo = e.state.scroll;
      else
         jGallery.scrollTo = 0;
   },

   /* Change view */
   switchPage:function(action) {
      if(action==jGallery.currentPage && !jGallery.canReload)
         return;
      jGallery.canReload = 0;
      
      if(action==null || action == -1) {
         jGallery.currentPage = action = '';
      } else {
         jGallery.currentPage = action;
      }

      $('#content').text('');
      $('#content').stop().css('opacity', 0);
      if($.fn && $.fn.colorbox)
         $.fn.colorbox.close();

      var m = jGallery.currentPage.match( /^search-(.*)$/ );
      if(m) {  
         action = 'search';
         jGallery.searchedText = m[1];
         jGallery.switchPage(action);
         return;
      }

      if(action != 'search') {
         $.doTimeout( 'searchID' ); // cancel pending searches
         jGallery.replaceHash('#!'+jGallery.currentPage); // for search the hash is changed in search()
      } 

      if($.browser.msie && jQuery.browser.version.substring(0, 2) == "8.") 
         $('#m').css('height', null); 

      jGallery.lastSuccessfullSearch = null;
      for(var plugin in jGallery.plugins) {
         if(jGallery.plugins[plugin].want(action)) {
            jGallery.plugins[plugin].handle(action);
            return;
         }
      }

      switch(action) {
         case 'search':
            $("#searchTpl").tmpl().appendTo('#content');
            jGallery.theme.showHeader();
            jGallery.search(jGallery.searchedText); //No, this is not an infinite loop :-O
            $('#content').css('opacity',1);
            break;
         default:
            var data = jGalleryModel.getJSON(action);
            if(!data) {
               page.loaded = false;
               page.showLoading();
               jGallery.canReload = 1;
            } else {
               page.loaded = true;
               $('#l').animate({opacity:0}, "fast");
               if(jGallery.theme.animateContent)
                  $('#content').animate({opacity:1}, "fast");
               else
                  $('#content').stop().css('opacity', 1);

               if(data.type == "error") {
                  jGallery.theme.showError(data);
                  break;
               }
               
               jGallery.theme.showHeader(data.json);
               
               for (var content in config.content_order) {
                   jGallery.theme.showContent(config.content_order[content], data.json);
               }
            }
      }
      jGallery.parseHash(jGallery.currentPage);

      if(!config.noScroll || config.noScroll === true)
         $(window).scrollTop(jGallery.scrollTo);
   },

   addHeader: function() {
      $("#headerTpl").tmpl().appendTo('#m');
      $('#m').css('opacity',0);

      if(jGallery.firstThemeSwitch) {
         $("#optionTpl").tmpl().appendTo('#o');
         function optclick() {
             $('#opt').unbind('click').click(function() {
                 $('#optcontent').remove();
                 $('#opt').click(optclick);
             });
             $("#optionsContentTpl").tmpl({Theme:config.getThemes(), selectedT:jGallery.theme, Lang:config.getLang(), selectedL:jGallery.lang}).appendTo('#o');
             $('#optcontent').find('.translate').translate();
             $('#theme').val(jGallery.themeName);
             $('#theme').change(function() {
                 var theme = $('#theme').val();
                 $.cookie('theme', theme);
                 jGallery.switchTheme(theme);
             });
             $('#language').change(function() {
                 var langs = config.getLang();
                 var lang = $('#language').val();
                 $.cookie('language', lang);
                 jGallery.switchLang(lang);
             });
         }
         $('#opt').click(optclick);
      }

      /* Add Search Box */
      var lastSearchboxVal = '';
      $('#searchbox').val(lastSearchboxVal);
      $('#searchbox').example(function() { return jGalleryModel.translate('Type here to search for a gallery...') }, {className: 'example'});
      function searchboxChange(val, force) {
         if((force && val != '') || (val != lastSearchboxVal && val != jGalleryModel.translate('Type here to search for a gallery...'))) {
            lastSearchboxVal = val;
            jGallery.search(val);
         }
      }
      $('#searchbox').change(function() {
         searchboxChange($(this).val(), false);
      });
      $('#searchbox').keyup(function(ev) {
         searchboxChange($(this).val(), ev.keyCode == 13);
      });
      colorbox(jQuery, window);
      jGallery.theme.init();
      jGallery.theme.showHeader();
   },

   defaultContent:function(content, json) {
       if(config.contentPlugins[content])
           return config.contentPlugins[content](json);
   },
};

$script.ready(['jquery', 'colorbox', 'themejs'],function() {
   if(window.history && window.history.replaceState) {
      window.onpopstate = jGallery.pop;
      $(document).scroll(function() {
         var scrollTop = $(document).scrollTop();
         window.history.replaceState({
            scroll: scrollTop
         }, 'scroll', location.hash);
      });
   }


   if(config.picsDir)
      jGalleryModel.picsDir = config.picsDir;
   if(config.cacheDir)
      jGalleryModel.cacheDir = config.cacheDir;

   function show() {
      (function( $ ){
         $.fn.translate = function(){
            $.each(this, function(id, v) {
               var obj= $(v);
               if(obj.val && obj.val() != '') {
                  obj.val(jGalleryModel.translate(obj.val()));
               } else {
                  if(obj[0].tagName != 'tspan') {
                     obj.html(jGalleryModel.translate(obj.html()));
                  } else {
                     obj.text(jGalleryModel.translate(obj.text()));
                  }
               }
            });
         }
      })(jQuery);

      $(document).ready(function() {
         if(config.pluginsInstances)
            for(var p in config.pluginsInstances)
               config.pluginsInstances[p].init();

         page.loaded = true;
         $('#l').css('opacity',0);

         /* And... show the theme. */
         var language;
         if($.cookie('language') && config.getLang().indexOf($.cookie('language')) != -1) {
           language = $.cookie('language');
         } else {
           language = window.navigator.userLanguage || window.navigator.language; 
           language = language.replace(/-.*$/, '');
         }
         jGallery.lang = config.getLang()[0];
         var currentUrl = window.location.href, matchUrl;
         if(matchUrl = currentUrl.match(/_escaped_fragment_=(.*)/)) { // search engine crawling
            jGallery.currentPage = unescape(decodeURIComponent(matchUrl[1]));
            var tmp = window.onhashchange;
            window.onhashchange = null;
            if(window.history && window.history.replaceState)
               window.history.replaceState('', '', window.location.pathname+'#!'+matchUrl[1]);
            jGallery.replaceHash(matchUrl[1]);
            window.onhashchange = tmp;
         } else {
            jGallery.currentPage = unescape(decodeURIComponent(location.hash)).replace(/#!?/,'');
         }
         jGallery.switchLang(config.getLang().indexOf(language)!=-1?language:config.getLang()[0]);
         jGallery.switchTheme(
            $.cookie('theme')?$.cookie('theme'):first(config.getThemes())
         );
      });
   }

   if(config.plugins && config.plugins.length) {
      $script.ready(config.plugins, show);
   } else {
      show();
   }

});

window.onhashchange = function(){
   var str = location.hash;
   var s = unescape(str).replace(/#!?/,'');
   if(s!=jGallery.currentPage) {
      jGallery.switchPage(s);
   }
};

