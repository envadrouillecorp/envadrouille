/*
 * main.js
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 */
var photoshowTheme = {
    animateContent:false,
    headerUID:0,
    changeThemeLang:function(l) {
       if(l == 'fr') {
          config.tr['Home'] = 'Accueil';
          config.tr['Partial result(s):'] = 'Résultat(s) partiel(s)';
       }
    },

    showHeader:function(data) {
       if(data) {
          var defaultURL = data.realurl?data.realurl:jGallery.currentPage;
          var dirUrl = jGalleryModel.pageToUrl(defaultURL).split('/');
          document.title = 'Photos :: '+((dirUrl=='')?'Index':dirUrl[dirUrl.length-2]);
       }

       var currentUID = ++photoshowTheme.headerUID;

       if($('.subheader').length) {
          $('.subheader').empty();
       } else {
          $('#m').append('<div class="subheader" style="opacity:0"></div>');
       }
       $('.subheader').append('<div class="bottom"></div><div class="elt selelt"><a href="#!" class="translate">'+jGalleryModel.translate('Home')+'</a></div>');

       var jsons_to_load = [""];
       var subdirs = [""];
       var jsons_loaded = [];
       if(jGallery.currentPage != "" && jGallery.currentPage != "search") {
          var defaultURL = jGallery.currentPage;
          var dirs = defaultURL.split('/');
          for(var i = 0; i < dirs.length; i++) {
             jsons_to_load.push((jsons_to_load[jsons_to_load.length-1]+'/'+dirs[i]).replace(/^\//, ''));
             subdirs.push(dirs[i]);
          }
       }

       function showMenu(pad) {
          if(!jsons_loaded[pad] || !jsons_loaded[pad].json || !jsons_loaded[pad].json.dirs)
             return;
          var json = jsons_loaded[pad].json;
          $.each(json.dirs, function(id, v) {
             var m = json.dirs[id].url.match( jGalleryModel.dirPattern );
             var title = json.dirs[id].url;
             if(m) 
             title = m[4];
          $('.subheader').append('<div class="elt" style="margin-left:'+(20*(pad+1))+'px"><a href="#!'+(jsons_to_load[pad]+'/').replace(/^\//, '')+json.dirs[id].url+'">'+title+'</a></div>');
          if(pad + 1 < subdirs.length && json.dirs[id].url == subdirs[pad+1]) {
             $('.subheader div').last().addClass('selelt');
             showMenu(pad+1);
          } 
          });
       }

       function showMenus(ljson) {
          if(currentUID != photoshowTheme.headerUID)
             return;
          if(ljson)
             jsons_loaded.push(ljson);
          if(jsons_loaded.length != jsons_to_load.length) {
             var json = jGalleryModel.getJSON(jsons_to_load[jsons_loaded.length], showMenus); 
             if(!json || !json.json)
                return;
             showMenus(json);
          } else {
             showMenu(0);
             $('.subheader').animate({opacity:1}, 'fast');
          }
       }
       showMenus();

       $('#main_descr').remove();
       if(data && data.descr) {
          $('#content').append('<div id="main_descr" class="search">'+data.descr+'</div>');
       }
       $('#searchbox').focus();
       if($('#searchbox')[0] && $('#searchbox')[0].selectionStart)
          $('#searchbox')[0].selectionStart = $('#searchbox')[0].selectionEnd = ($('#searchbox')[0].value)?$('#searchbox')[0].value.length:0;
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

          data.dirs[i].thumb = dirUrl+data.dirs[i].url+'/'+data.dirs[i].thumbs[0].replace(/_m\.([^\.]*)$/, '_c.$1');
          $("#dirTpl").tmpl(data.dirs[i]).appendTo('#content');
          $('#dir'+i).mousemove({index:i}, function(e){
             var i = data.dirs[e.data.index].thumbs;
             var x = Math.floor(i.length * (e.pageX - $(this).offset().left) / $(this).width());
             if(x >= i.length) x = i.length - 1;
             var img = "./cache/thumbs/"+dirUrl+data.dirs[e.data.index].url+'/'+data.dirs[e.data.index].thumbs[x].replace(/_m\.([^\.]*)$/, '_c.$1');
             e = $(this);
             if(e.find("img").attr('src') != img) {
                e.find("img").attr('src', img);
             }
          });

       }
    },
    showGps:function(data) {
       if(data.gpx && config.showGPX) {
          $("#gpsTpl").tmpl().appendTo('#content');
          $('.gps').css('width', ($('body').width() - 285)+'px');
          config.showGPX(data);
       }
    },
    showPics:function(data) {
       if(!data.pics)
          return;
       var pics = [];
       var width = $('body').width() - 300;
       var random_small = 0;
       var defaultURL = data.realurl?data.realurl:jGallery.currentPage;
       for (var i in data.pics) {
          if(i % 6 == 0) {
             $('#content').append('<div style="height:3px"></div>');
             random_small = Math.floor(Math.random()*6) % 6;
          }

          pics[i] = {
             ID:i,
             url:(data.pics[i].fullpath?data.pics[i].fullpath:defaultURL),
             big:data.pics[i].url,
             thumb:data.pics[i].url.replace(/\.([^\.]*)$/, "_b.$1"),
             original:data.pics[i].original,
             title:data.pics[i].title,
          };
          $("#picTpl").tmpl(pics[i]).appendTo('#content');
          if(data.pics.length % 6 != 0 && data.pics.length - i <= (data.pics.length % 6)) {
             $('#pic'+i).css('width', (width/(data.pics.length%6)) + (20 - ((data.pics.length % 6) - 0)*4)/(data.pics.length % 6));
          } else if(i % 6 == random_small) {
             $('#pic'+i).css('width', Math.floor(1*width/11)+'px');
          } else {
             $('#pic'+i).css('width', Math.floor(2*width/11)+'px');
          }
          $('#pic'+i+' img').css('opacity', 0).load({ID:i},function(e) {
             var ID=e.data.ID;
             $(this).hover(function() { $(this).css('opacity', 0.8); }, function() { $(this).css('opacity', 1) });
             $(this).animate({opacity:1}, 'slow');

             var pic_real_width, pic_real_height;
             $("<img/>") 
             .load(function() {
                pic_real_width = this.width;   // Note: $(this).width() will not
                pic_real_height = this.height; // work for in memory images.
                var expected_width = $('#pic'+ID).width();
                var expected_height = expected_width/pic_real_width*pic_real_height;
                if(expected_height < $('#pic'+ID).height()) {
                   expected_width = $('#pic'+ID).height()/expected_height*expected_width;
                   expected_height = $('#pic'+ID).height();
                }
                $('#pic'+ID+' img').css('width', expected_width).css('position', 'relative').css('top', -(expected_height - $('#pic'+ID).height()) / 2);
             }).attr("src", $(this).attr("src"));
          });
       }
       $script.ready(['colorbox'], function() {
          $("a[rel*='gal']").colorbox({slideshow:true, slideshowSpeed:3500, slideshowAuto:false, loop:false,maxWidth:'90%',maxHeight:'90%'});
       });
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
          photoshowTheme.showSearchResults(dataFull, regs);
          $('#search_results').append('<br/><br/>');   
       }
       if(dataPartial.length) {
          $('#search_results').append('<b class="translate">'+jGalleryModel.translate('Partial result(s):')+'</b>');
          photoshowTheme.showSearchResults(dataPartial, regs);
       }
       $('.search').css('width', ($('body').width() - 295)+'px');
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

          res.thumb = data[i].url+'/'+data[i].thumbs[0].replace(/_m\.([^\.]*)$/, '_c.$1');
          $("#dirTpl").tmpl(res).appendTo('#search_results');
          $('#dir'+res.ID+' .descr').html(jGallery.highlightText($('#dir'+res.ID+' .descr').text(), regs));
          $('#dir'+res.ID).click({url:res.url}, function(ev) {
             ev.preventDefault();
             jGallery.switchPage(ev.data.url);
          });
       }
    },
    showContent:function(content, json) {
        switch(content) {
            case 'dirs': return photoshowTheme.showDirs(json);
            case 'pics': return photoshowTheme.showPics(json);
            case 'vids': return photoshowTheme.showVids(json);
            case 'gpx': return photoshowTheme.showGps(json);
            default: return jGallery.defaultContent(content, json);
        }
    },

    init:function() {
       jGallery.addCss('./themes/_common/colorbox.css', 'colorbox');
    },
    clean:function() {
    },
};
config.loadedThemes['photoshow'] = photoshowTheme;

