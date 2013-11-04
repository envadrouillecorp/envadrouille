/*
 * main.js
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 */

var oldTheme = {
    animateContent:false,
    changeThemeLang:function(l) {
       if(l == 'fr') {
          config.tr['Back to the index'] = 'Retour à l\'index';
          config.tr['Partial result(s):'] = 'Résultat(s) partiel(s)';
       }
    },

    showHeader:function(data) {
      if(!data)
         return;

      var defaultURL = data.realurl?data.realurl:jGallery.currentPage;
      var dirUrl = jGalleryModel.pageToUrl(defaultURL).split('/');
      document.title = 'Photos :: '+((dirUrl=='')?'Index':dirUrl[dirUrl.length-2]);
      if(dirUrl.length > 1) {
         dirUrl = dirUrl[dirUrl.length-2];
         var m = dirUrl.match( jGalleryModel.dirPattern );
         var title = dirUrl;
         if(m) 
            title = m[4];
         $('#content').append('<div class="subheader"><span class="title">'+title+'</span>'+(dirUrl!=''?'<span class="back"><a href="#!" class="translate">['+jGalleryModel.translate('Back to the index')+']</a></span>':'')+'</div>');
      }
       $('#searchbox').focus();
       if($('#searchbox')[0] && $('#searchbox')[0].selectionStart)
           $('#searchbox')[0].selectionStart = $('#searchbox')[0].selectionEnd = ($('#searchbox')[0].value)?$('#searchbox')[0].value.length:0;
   },

    centerPic:function(dir) {
       var img = dir.find('.imgc').find('img');
       img.css('opacity', 0).load(function() {
          $(this).css('position', 'relative').css('top', (dir.find('.imgc').height() - img.height() - 3) / 2).css('opacity', 1);
       });
    },
    showDirs:function(data) {
       if(!data.dirs)
          return;

       var defaultURL = data.realurl?data.realurl:jGallery.currentPage;
       var dirUrl = jGalleryModel.pageToUrl(defaultURL);
       for (var i in data.dirs) {
          var m = data.dirs[i].url.match( jGalleryModel.dirPattern );
          if(m) {  
             data.dirs[i].year = m[3]+((m[3]!='')?'-':'')+m[2]+'-'+m[1];
             data.dirs[i].title = m[4];
          } else {
             data.dirs[i].title = data.dirs[i].url;
          }

          data.dirs[i].thumb = dirUrl+data.dirs[i].url+'/'+data.dirs[i].thumbs[0];
          $("#dirTpl").tmpl(data.dirs[i]).appendTo('#content');
          oldTheme.centerPic($('#dir'+i));
       }
    },
    showPics:function(data) {
       if(!data.pics)
          return;
       var pics = [];
       var defaultURL = data.realurl?data.realurl:jGallery.currentPage;
       for (var i in data.pics) {
          pics[i] = {
             ID:i,
             url:(data.pics[i].fullpath?data.pics[i].fullpath:defaultURL),
             big:data.pics[i].url,
             thumb:data.pics[i].url.replace(/\.(.*)$/, "_b.$1"),
             original:data.pics[i].original,
             title:data.pics[i].title,
          };
       }
       $("#picsTpl").tmpl({Pics:pics, Num:3}).appendTo('#content');
       $script.ready(['colorbox'], function() {
          $("a[rel*='gal']").colorbox({slideshow:true, slideshowSpeed:3500, slideshowAuto:false, loop:false,maxWidth:'90%',maxHeight:'90%'});
       });

       for (var i in data.pics) {
          $('#pic'+i+' img').load(function() {
             $(this).animate({opacity:1}, 'slow');
          });
       }
    },
    showVids:function(data) {
       if(!data.vids)
          return;

       var defaultURL = data.realurl?data.realurl:jGallery.currentPage;
       var dirUrl = jGalleryModel.pageToUrl(defaultURL);
       var vids = [];
       for (var i in data.vids) {
          vids[i] = {
             ID:i,
             vid:data.vids[i].url,
             path:dirUrl,
             h:360,
             w:640
          };
          $("#vidTpl").tmpl(vids[i]).appendTo('#content');
       }
    },

    showError:function(data) {
       $("#errorTpl").tmpl(data).appendTo('#content');
    },
    showSearch:function(dataFull, dataPartial, regs) {
       if(dataFull.length) {
          oldTheme.showSearchResults(dataFull, regs);
          $('#search_results').append('<br/><br/>');   
       }
       if(dataPartial.length) {
          $('#search_results').append('<b class="translate">'+jGalleryModel.translate('Partial result(s):')+'</b>');
          oldTheme.showSearchResults(dataPartial, regs);
       }
    },
    showSearchResults:function(data, regs) {
       if(!data)
          return;
       for (var i in data) {
          var res = {};
          res.ID = data[i].ID;
          res.url = data[i].url;
          res.descr = data[i].descr;
          res.starred = data[i].starred;
          res.completeurl = data[i].url;

          var m = data[i].url.match( jGalleryModel.dirPattern );
          if(m) {  
             res.year = jGallery.highlightText(m[3]+'-'+m[2]+'-'+m[1], regs);
             res.title = jGallery.highlightText(m[4], regs);
          } else {
             res.title = jGallery.highlightText(data[i].url, regs);
          }

          res.thumb = data[i].url+'/'+data[i].thumbs[0];
          $("#dirTpl").tmpl(res).appendTo('#search_results');
          $('#dir'+res.ID+' .descr').html(jGallery.highlightText($('#dir'+res.ID+' .descr').text(), regs));
          $('#dir'+res.ID).click({url:res.url}, function(ev) {
             ev.preventDefault();
             jGallery.switchPage(ev.data.url);
          });
          oldTheme.centerPic($('#dir'+res.ID));
       }
    },
    showContent:function(content, json) {
        switch(content) {
            case 'dirs': return oldTheme.showDirs(json);
            case 'pics': return oldTheme.showPics(json);
            case 'vids': return oldTheme.showVids(json);
            default: return jGallery.defaultContent(content, json);
        }
    },

    init:function() {
       jGallery.addCss('./themes/_common/colorbox.css', 'colorbox');
    },
    clean:function() {
    },
};
config.loadedThemes['old'] = oldTheme;

