
    config.showGPX = function(data) {
       var show = false;
       if(!data.gpx) {
           if(!config.geolocalization || !config.show_map_coord)
              return;
            if(!data.pics)   
              return;
            for(var i in data.pics)
               if(data.pics[i].coords && data.pics[i].coords.charAt(0) != '@') {
                  show = true;
                  break;
               }
       } else {
          show = true;
       }
       if(!show)
          return;

       if($('.gps').length == 0)
          $("#gpsTpl").tmpl().appendTo('#content');
       $script('admin/pages/gpx/scripts/jgallery.gpx.js', 'gpx', function() {
          jGPX(data);
       });
    };
    config.contentPlugins['gpx'] = config.showGPX;
