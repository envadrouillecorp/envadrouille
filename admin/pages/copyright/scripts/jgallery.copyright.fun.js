var Copyright = {
   init:function() {
      $('<div class="customtheme" />').bind('themebeginevt', function() {
         $('.copyright').stop().animate({opacity:0}, 'slow', function() { $(this).remove() });
      }).bind('themeendevt', function() {
         $('#wrapper').append('<div class="copyright" style="position:absolute;bottom:5px;width:100%;text-align:center;opacity:0">'+config.copyright+'</div>');
         $('#wrapper').css({boxSizing:'border-box', paddingBottom: '20px', position:'relative'});
         $('.copyright').stop().animate({opacity:1}, 'slow');
      }).appendTo($('body'));
   }
};
config.pluginsInstances.push(Copyright);
