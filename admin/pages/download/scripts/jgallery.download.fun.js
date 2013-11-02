
    config.firstDLAll = true;
    config.changeLangDLAll = function(lang) {
       if(config.firstDLAll) {
          config.firstDLAll = false;
          $('<div class="customtranslate"/>').bind('languagechangeevt', config.changeLangDLAll).appendTo($('body'));
          jGallery.addCss('./admin/pages/download/css/jgallery.css', 'dlallcss');
       }

       if(jGallery.lang == 'fr') {
          config.tr['dlall'] = 'Télécharger la galerie';
          config.tr['dlload'] = 'Patientez...';
       } else {
          config.tr['dlall'] = 'Download gallery';
          config.tr['dlload'] = 'Please wait...';
       }
    };

    config.showDLAll = function(data) {
       if(!data.pics || data.pics.length == 0)
          return;
       config.changeLangDLAll();

       var content = '<div style="text-align:right;width:100%" class="dlall"><a id="dlall" class="b-btn" href="./admin/pages/download/php/dl.php?dir='+encodeURIComponent(jGallery.currentPage)+'">'
				+'<span class="b-btn-text translate">'+jGalleryModel.translate('dlall')+'</span>'
            +'<span class="b-btn-icon-right"><span></span></span>';
      $('#content').append(content);
      $('#dlall').click(function() { $(this).find('.b-btn-text').text(jGalleryModel.translate('dlload')); });
    };
    config.contentPlugins['dlall'] = config.showDLAll;
