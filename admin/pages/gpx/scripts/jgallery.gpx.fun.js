
    config.showGPX = function(data) {
       if(!data.gpx)
           return;
       if($('.gps').length == 0)
          $("#gpsTpl").tmpl().appendTo('#content');
       $script('admin/pages/gpx/scripts/jgallery.gpx.js', 'gpx', function() {
          jGPX(data);
       });
    };
    config.contentPlugins['gpx'] = config.showGPX;
