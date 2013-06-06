/*
 * main.js
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 */
var animateContent = false;
var jGallery_default_show_all = false;
var _month = ['', 'Jan', 'Fev', 'Mar', 'Avr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function changeThemeLang(l) {
	if(l == 'fr') {
		config.tr['SHOW ALL PICTURES'] = 'AFFICHER TOUTES LES GALERIES';
		config.tr['Partial result(s):'] = 'Résultat(s) partiel(s)';
	}
}

function showHeader(data) {
	$('#breadcrumbs').remove();
	$('#header').prepend('<ul id="breadcrumbs"><li><a href="#!">.</a></li></ul>');

   if(data) {
      var defaultURL = data.realurl?data.realurl:jGallery.currentPage;
      var dirUrl = jGalleryModel.pageToUrl(defaultURL).split('/');
      document.title = 'Photos :: '+((dirUrl=='')?'Index':dirUrl[dirUrl.length-2]);
      for(var i = 0; i < dirUrl.length - 1; i++) {
         var link = '';
         for(var j = 0; j <= i; j++) {
            link += dirUrl[j]+((j==i)?'':'/');
         }
         $('#breadcrumbs').append('<li><a href="#'+link+'">'+dirUrl[i]+'</a></li>');
      }
   }

	$('#search input').css('width', $('#header').width()-$('#breadcrumbs').width() - 90);
	$('#search').css('left', $('#breadcrumbs').width() + 30);

	$('#main_descr').remove();
	if(data && data.descr) {
		$('#content').append('<div id="main_descr" class="search">'+data.descr+'</div>');
	}
}
function showDirs(data, all, div, height) {
	if(!data.dirs)
		return;

	var nbDirs = data.dirs.length;
	if(nbDirs > 4 || height)
		nbDirs = 4;
	$(div?('#'+div):'#content').html('<div style="width:'+(nbDirs*220)+'px; margin:auto"><div id="'+(div?div:'')+'contentb" class="dir_container" style="height:'+(height?height:(data.pics?(164*Math.ceil(data.dirs.length/4)+5):($(window).height()-50)))+'px;'+(data.pics?"vertical-align:top;":"")+'"></div></div>');

	var defaultURL = data.realurl?data.realurl:jGallery.currentPage;
	var dirUrl = jGalleryModel.pageToUrl(defaultURL);

	var previousYear = null;
	var toLoad = [];
	for (var i in data.dirs) {
		if(i >= 4 && !jGallery_default_show_all && !all)
			break;

		if(!data.dirs[i].isSearchResult) {
			var m = data.dirs[i].url.match( jGalleryModel.dirPattern );
			if(m) {  
				data.dirs[i].day = m[3];
				data.dirs[i].month = parseInt(m[3], 10)+' '+_month[parseInt(m[2], 10)];
				data.dirs[i].year = m[1];
				data.dirs[i].title = m[4];
				if(previousYear === null)
					previousYear = m[1];
				if(previousYear != m[1] && (all || jGallery_default_show_all)) {
					data.dirs[i].separator = "<span>"+(m[1].substring(0,2))+"</span><span class='last_digit'>"+(m[1].substring(2,4))+"</span><hr />";
					previousYear = m[1];
				} else {
					data.dirs[i].separator = undefined;
				}
			} else {
				data.dirs[i].title = data.dirs[i].url;
				data.dirs[i].month = '';
         }

         if(data.dirs[i].title.length > 18)
            data.dirs[i].title = data.dirs[i].title.substr(0,14)+"...";
		}
      if(!data.dirs[i].completeurl)
         data.dirs[i].completeurl = dirUrl+data.dirs[i].url;

		
		if(data.dirs[i].thumbs[0])
			data.dirs[i].thumb = dirUrl+data.dirs[i].url+'/'+(data.dirs[i].thumbs[0].replace('_m', '_c'));
		$("#dirTpl").tmpl(data.dirs[i]).appendTo('#'+(div?div:'')+'contentb');
		if(!div) {
			toLoad.push({
				img:$('#dir'+data.dirs[i].ID+' img'),
				div:$('#dir'+data.dirs[i].ID),
				url:data.dirs[i].url
			});
		} else {
			$('#dir'+data.dirs[i].ID).css('opacity', 1);
			$('#dir'+data.dirs[i].ID+' img').css('opacity', 1);
			$('#dir'+data.dirs[i].ID).click({url:data.dirs[i].url}, function(ev) {
				ev.preventDefault();
				jGallery.switchPage(dirUrl+ev.data.url);
			});
		}
	}
	
	if(data.dirs.length > 4 && !jGallery_default_show_all && !all) {
		$('#contentb').append("<div id='show' style='width:100%;text-align:center;cursor:pointer;margin-top:173px;opacity:0;'><a style='border-bottom:1px dotted #EEE;' class='translate'>"+jGalleryModel.translate('SHOW ALL PICTURES')+"</a></div>");
	}
	if(!div) {
		for(var k in toLoad) {
         k = parseInt(k);
         toLoad[k].img.load({div:toLoad[k].div, img:toLoad[k].img},function(ev) {
            ev.data.img.css('opacity', 1);
            ev.data.div.animate({opacity:1}, 'slow');
         });

			toLoad[k].div.click({url:toLoad[k].url}, function(ev) {
				ev.preventDefault();
				jGallery.switchPage(dirUrl+ev.data.url);
			});
         
			if((k != toLoad.length -1) && data.dirs[k+1].separator) {
				$('#sep'+(k+1)).animate({opacity:1}, 'fast');
			}
      }
      if(data.dirs.length > 4 && !jGallery_default_show_all && !all) {
         $('#show').animate({opacity:1}, 'fast').click({json:data}, function(e) {
            jGallery_default_show_all = true;
            showDirs(e.data.json, true);
         });
      }
	}
}
function showGps(data) {
	if(data.gps) {
		$("#everytrailTpl").tmpl({gps:data.gps}).appendTo('#content');
	} else if(data.gpx) {
		$("#gpsTpl").tmpl().appendTo('#content');
		jGallery.showGPX(data);
	}
}
function showPics(data) {
	if(!data.pics)
		return;
	var pics = [];
	var defaultURL = data.realurl?data.realurl:jGallery.currentPage;
	for (var i in data.pics) {
		pics[i] = {
			ID:i,
			url:(data.pics[i].fullpath?data.pics[i].fullpath:defaultURL),
			big:data.pics[i].url,
			thumb:data.pics[i].url.replace(/\.([^\.]+)$/, "_c.$1"),
			original:data.pics[i].original
		};
	}
	var num = parseInt($(window).width()*0.9/220, 10);
	if(num < 1)
		num = 1;
	$('#content').append('<div id="pics"></div>');
	$("#picsTpl").tmpl({Pics:pics, Num:num}).appendTo('#pics');
	$('#pics').css('width', (num*220));

	$("a[rel*='gal']").colorbox({slideshow:true, slideshowSpeed:3500, slideshowAuto:false, loop:false,maxWidth:'90%',maxHeight:'90%'});

	for (var i in data.pics) {
		$('#pic'+i+' img').load(function() {
			$(this).parent().animate({opacity:1}, 'slow');
		});
	}

	/* IE8 does not show scrollbars... */
	if($.browser.msie && jQuery.browser.version.substring(0, 2) == "8.") {
		$('#m').css('height', (500+170*pics.length/num)+"px");
	}
}
function showError(data) {
	$("#errorTpl").tmpl(data).appendTo('#content');
}
function showVids(data) {
	if(!data.vids)
		return;

	$('#content').append('<div id="vids"></div>');
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
		$("#vidTpl").tmpl(vids[i]).appendTo('#vids');
	}
}
function showSearch(dataFull, dataPartial, regs) {
	if(dataFull.length) {
		$('#search_results').append('<div id="search_full"></div>');
		showDirs({dirs:showSearchResults(dataFull, regs)}, true, 'search_full', 1);
	}
	if(dataPartial.length) {
		$('#search_results').append('<div color="#FFF"><b class="translate">'+jGalleryModel.translate('Partial result(s):')+'</b></div><div id="search_part"></div>');
		showDirs({dirs:showSearchResults(dataPartial, regs)}, true, 'search_part', 1);
	}
}
function showSearchResults(data, regs) {
	if(!data)
		return;

	var ret = [];
	for (var i in data) {
		var res = {};
		res.ID = data[i].ID;
		res.url = data[i].url;
		res.descr = data[i].descr;
		res.starred = data[i].starred;
		res.thumbs = data[i].thumbs;
		res.isSearchResult = true;

		var m = data[i].url.match( jGalleryModel.dirPattern );
		if(m) {  
			res.month = jGallery.highlightText(parseInt(m[3], 10)+' '+_month[parseInt(m[2], 10)], regs);
			res.title = jGallery.highlightText(m[4], regs);
      } else {
         res.title = jGallery.highlightText(data[i].url, regs);
         res.month = '';
      }
      // Strip the title so that it is not more than 15 chars.
      // Because it contains divs, we have to parse each 'subtext' individually.
      var title_len = 0;
      res.title = $('<div>'+res.title+'</div>').contents().each(function(k,v) { 
            title_len += v.textContent.length;
            v.textContent = v.textContent.substr(0,v.textContent.length-(title_len-15));
      }).parent().html();
      if(title_len > 15)
         res.title = res.title+"...";
		
		ret[i] = res;
	}
	return ret;
}
