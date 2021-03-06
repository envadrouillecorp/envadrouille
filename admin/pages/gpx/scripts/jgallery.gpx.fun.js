
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

       if($('.gps').length == 0) {
          var urls = [].concat(data.gpx);
          $("#gpsTpl").tmpl({gpx:urls[0]}).appendTo('#content');
       }
       $script('admin/pages/gpx/scripts/jgallery.gpx.js', 'gpx', function() {
          var m = new map(data);
          m.loadLeaflet(m.showDefault);
       });
    };
    config.contentPlugins['gpx'] = config.showGPX;
