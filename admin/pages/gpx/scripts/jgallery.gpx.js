/*
 * jgallery.gpx.js
 * Copyright (c) 2013 Baptiste Lepers
 * Released under MIT License
 */

var DateISO8601Regex = new RegExp("([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?");
Date.prototype.setISO8601 = function (string) {
    var d = string.match(DateISO8601Regex);

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) { date.setMonth(d[3] - 1); }
    if (d[5]) { date.setDate(d[5]); }
    if (d[7]) { date.setHours(d[7]); }
    if (d[8]) { date.setMinutes(d[8]); }
    if (d[10]) { date.setSeconds(d[10]); }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    time = (Number(date) + (offset * 60 * 1000));
    this.setTime(Number(time));
   return this;
}
var ExifDateTimeOriginalRegex = new RegExp('([0-9]{4}):([0-9]{2}):([0-9]{2}) ([0-9]{2}):([0-9]{2}):([0-9]{2})');
Date.prototype.setExifDateTimeOriginal = function (string, diff) {
   var d = string.match(ExifDateTimeOriginalRegex);
   if(!d) {
      this.setTime(0);
      return this;
   }

   var date = new Date(d[1], d[2] - 1, d[3], d[4], d[5], d[6], 0);
   var offset = -date.getTimezoneOffset();
   offset -= diff * 60;
   time = (Number(date) + (offset * 60 * 1000));
   this.setTime(Number(time));
   return this;
}

function gpxChangeLang() {
   if(jGallery.lang == 'fr') {
      var tr = {
         'Elevation':'Dénivelé', 'Altitude - Total Elevation: ':'Altitude - Dénivelé positif : ',
         'Speed':'Vitesse','Speed - Average: ':'Vitesse - Moyenne : ',
         'Elapsed time':'Temps écoulé',
         'during':'pendant',
         'hours':'heures',
         'Statistics':'Statistiques',
      };
      config.tr = $.extend(config.tr, tr);
   }
}
$('<div class="customtranslate"/>').bind('languagechangeevt', gpxChangeLang).appendTo($('body'));

function map(data, options) {
   var self = this;

   self.map;
   self.bounds;
   self.xmls;
   self.layers = {};

   /* Default options */
   self.mapDiv = "map_canvas";
   self.charDiv = "chart_div";
   self.maxNbPoints = 400;
   self.fixElevation = (config.gpx_fix_elevation === '1');
   self.minMeaningfulElevationDiff = 40;
   if(options)
      $.extend(self, options);

   self.points = [];
   self.times = [];
   self.elevations = [];
   self.polypoints = [];
   self.segments = {};
   self.nbsegments = 0;

   var chart;
   var distances;

  function distance(points, segments) {
     var ret = [];
     var len = points.length;
     ret[0] = 0;
     for(var i = 1; i < len; i++) {
        if(segments[i] == 1) {
           ret[i] = ret[i-1];
        } else {
           ret[i] = ret[i-1] + self.map.distance(points[i-1], points[i]) / 1000; //km
        }
     }

     return ret;
  }

  function speed(distances, times) {
     var ret = [];
     var len = distances.length;
     var min = 0;
     var max = 0;

     if(!times) {
        for(var i = 0; i < len; i++)
           ret[i] = {x:distances[i], y:0, id:0};
     } else {
        ret[0] = {x:0, y:0, id:0};
        for(var i = 1; i < len; i++) {
           var newSpan = times[i] - times[i-1];
           if(newSpan == 0)
              ret[i] = {x:ret[i-1].x, y:ret[i-1].y, id:i};
           else
              ret[i] = {x:distances[i], y:(distances[i] - distances[i-1]) / (newSpan / 1000 / 3600), id:i};
           if(ret[i].y > max) //store max
              max = ret[i].y;
        }
     }
     return [min, max, ret];
  }

  function elevation(el, distances) {
     var ret = [];
     var min = 100000;
     var max = 0;
     var len = distances.length;
     ret[0] = {x:100000,y:0,id:0};
     for(var i = 1; i < len; i++) {
        ret[i] = {x:distances[i], y:el[i].elevation, id:i};
        if(ret[i].y > max) //store max
           max = ret[i].y;
        if(ret[i].y < min) //store min
           min = ret[i].y;
     }
     return [min, max, ret];
  }

  function shiftSegments(segments) {
     var ret = {};
     for(var i in segments) if (segments.hasOwnProperty(i)) {
        ret[parseInt(i, 10) - 1] = 1;
     }
     return ret;
  }

  function reduceSegments(segments, len) {
     var stripe = Math.floor(len / self.maxNbPoints);
     if(stripe==0)
        return segments;

     var ret = {};
     var newpoint = 0;
     for(var i = 0; i < len; i++) {
        if(i%(stripe+1)==0 || segments[i] == 1 || segments[i+1] == 1) 
           newpoint++;
        if(segments[i])
           ret[newpoint - 1] = 1;
     }
     return ret;
  }

  function indexesToReducedIndexes(points, segments) {
     var len = points.length;
     var stripe = Math.floor(len / self.maxNbPoints);
     var ret = [];
     var j = -1;
     for(var i = 0; i < len; i++) {
        if(i%(stripe+1)==0 || segments[i] == 1 || segments[i+1] == 1)
           j++;
        ret[i] = j;
     }
     return ret;
  }

  function reduce(points, segments) {
     var len = points.length;
     var stripe = Math.floor(len / self.maxNbPoints);
     if(stripe==0)
        return points;
     var ret = [];
     for(var i = 0; i < len; i++)
        if(i%(stripe+1)==0 || segments[i] == 1 || segments[i+1] == 1)
           ret.push(points[i]);
     return ret;
  }
  
  function makeHash(distances) {
     var ret = {};
     var len = distances.length;
     for(var i = 0; i < len; i++) {
        ret[distances[i]] = i;
     }
     return ret;
  }

  function averageSpeed(distances, times, segments) {
     if(times && times[0] != times[times.length - 1])
        return Math.round(10 * distances[distances.length-1] / totalTime(times, segments)) / 10;
     else
        return '?';
  }

  function totalTime(times, segments, round) {
     if(times) {
        //var total = ((times[times.length-1] - times[0]) / 1000 / 3600);
        var total = 0;
        var last_time = times[0];
        for(var i in segments) if (segments.hasOwnProperty(i) && i > 0 && i < times.length) {
           var ii = parseInt(i, 10);
           total += (times[ii-1] - last_time) / 1000 / 3600;
           last_time = times[ii];
        }
        total += (times[times.length -1] - last_time) / 1000 / 3600;
        if(round)
           return Math.round(10*total)/10;
        else
           return total;
     } else {
        return '?';
     }
  }

  function totalElevation(el, segments) {
     var total = 0;
     var lastElevation = el[0].elevation;
     for(var e in el) {
        if(segments[e] == 1) {
           lastElevation = el[e].elevation;
           continue;
        }
        if(Math.abs(el[e].elevation - lastElevation) > self.minMeaningfulElevationDiff) {
           if(lastElevation < el[e].elevation) {
              total += el[e].elevation - lastElevation;
           }
           lastElevation = el[e].elevation;
        }
     }
     return Math.round(total);
  }

  self.drawElevation = function(elev, points, times, segments) {
     function drawChart() {
        distances = distance(points, segments);
        var speeds = speed(distances, times);
        var elevations = elevation(elev, distances);

        var maxSpeed = speeds[1];
        speeds = speeds[2];

        var minHeight = elevations[0];
        var maxHeight = elevations[1];
        elevations = elevations[2];
        if(times)
           times.shift(); 
        distances.shift();
        speeds.shift();
        elevations.shift();
        segments = shiftSegments(segments);
       
        var ids = makeHash(distances);
        var pwnMarker;
        var elevationName = '<span>'+jGalleryModel.translate('Altitude - Total Elevation: ')+'</span>'+totalElevation(elev, segments)+'m';
        var speedName = '<span>'+jGalleryModel.translate('Speed - Average: ')+'</span>'+averageSpeed(distances, times, segments)+'km/h (<span>'+jGalleryModel.translate('during')+'</span> '+totalTime(times, segments, true)+' <span>'+jGalleryModel.translate('hours')+'</span>)';

        chart = new Highcharts.Chart({
           chart: {
              renderTo: self.charDiv,
              zoomType: 'xy',
              backgroundColor:'transparent',
              animation:false,
           },
           alignTicks:false,
           title: { useHTML:true, text: '<abbr style="border-bottom-width:0">'+jGalleryModel.translate('Statistics')+'</abbr>' },
           xAxis: { title: {text:jGalleryModel.translate('Distance')+' (km)'} },
           yAxis: [{
              labels: {
                 formatter: function() {
                    return this.value +'m';
                 },
                 style: { color: '#AA4643' }
              },
              title: {
                 text: jGalleryModel.translate('Altitude'),
                 style: { color: '#AA4643' }
              },
              tickInterval:Math.floor((maxHeight + 60 - minHeight) / 2),
              min:Math.floor(minHeight),
              max:Math.ceil(maxHeight + 60),
              endOnTick:false,
           }, { 
              gridLineWidth: 0,
              title: {
                 text: jGalleryModel.translate('Speed'),
                 style: { color: '#89A54E' }
              },
              labels: {
                 formatter: function() {   
                    return this.value +' km/h';
                 },
                 style: { color: '#89A54E'}
              },
              opposite: true,
              tickInterval:Math.floor(maxSpeed + 10) / 2,
              min:0,
              max:Math.ceil(maxSpeed + 10),
              endOnTick:false,
           }],
           plotOptions: {
               line: { animation: false, marker:{enabled:false} },
           },
           series: [{
              name:elevationName,
              type:'line',
              color: '#AA4643',
              data:elevations,
           }, {
              name:speedName,
              type:'line',
              color: '#89A54E',
              yAxis: 1,
              data:speeds,
           }],
           tooltip: {
               formatter: function() {
                 if(this.id === undefined)
                    this.id = ids[this.x];

                 if(!pwnMarker)
                    pwnMarker = new L.marker(points[this.id], {
                       icon: L.icon({iconUrl:'themes/_common/here.png', iconSize:[18, 18], iconAnchor:[9, 18]}),
                    }).addTo(self.map);
                 else
                    pwnMarker.setLatLng(points[this.id]);

                 var ret = jGalleryModel.translate('Altitude') + ': ' + (Math.round(elevations[this.id].y*10)/10) + 'm<br/>'
                    + jGalleryModel.translate('Speed') + ': '+ (Math.round(speeds[this.id].y*10)/10) + 'km/h<br/>'
                    + jGalleryModel.translate('Distance') + ': ' + (Math.round(distances[this.id]*10)/10) + 'km';
                 if(times != null) {
                    ret += '<br/>'+jGalleryModel.translate('Elapsed time')+': ';
                    var time_s = Math.round((times[this.id]-times[0])/1000);
                    var time_min = Math.floor(time_s / 60);
                    var time_h = Math.floor(time_min / 60);
                    var time_d = Math.floor(time_h / 24);
                    time_s = time_s - time_min * 60;
                    time_min = time_min - time_h * 60;
                    time_h = time_h - time_d * 24;
                    if(time_d > 0) {
                       ret += time_d+'d:'+time_h+'h:'+time_min+'m:'+time_s+'s';
                    } else {
                       ret += time_h+'h:'+time_min+'m:'+time_s+'s';
                    }
                 }

                 return ret;
              }
            },
           credits: { enabled: false },
        });

        for(var i in segments) if (segments.hasOwnProperty(i)) {
           var p = parseInt(i, 10);
           chart.xAxis[0].addPlotBand({
              from: distances[p-1],
              to: distances[p-1] + (distances[distances.length-1] / 400),
              color: '#FCFFC5',
              id: 'plot-band-'+i,
           });
        }

        $('#'+self.charDiv).removeClass('loading_chart');
     }
     $script('./scripts/highcharts.js', 'highcharts', drawChart);
  }

  function binSearch(needle, haystack) {
     if(needle < haystack[0])
        return -1;
     if(needle > haystack[haystack.length-1])
        return -1;

     var high = haystack.length - 1;
     var low = 0;
     while (low <= high) {
        var mid = parseInt((low + high) / 2);
        var element = haystack[mid];
        if (element > needle) {
           high = mid - 1;
        } else if (element < needle) {
           low = mid + 1;
        } else {
           return mid; 
        }
     }
     return high;
  }

  self.getPositionWithTime = function(coord, points, times, diff) {
     var date = new Date().setExifDateTimeOriginal(coord, diff).getTime();
     if(date === 0)
        return null;

     var index = binSearch(date, times);
     if(index == -1)
        return null;
     return index;
  }

   
   self.first_chart_show = true;
   self.chart_shown = false;
   self.showElevationChart = function() {
      if(self.chart_shown) {
         $('#'+self.charDiv).css('display', 'none');
         self.chart_shown = false;
         return;
      } else if(!self.first_chart_show) {
         $('#'+self.charDiv).css('display', 'block');
         self.chart_shown = true;
         return;
      }

      $('#'+self.charDiv).css('display', 'block').addClass('loading_chart');
      self.chart_shown = true;
      self.first_chart_show = false;

      var _points = self.points, _times = self.times, _elevations = self.elevations, _segments = self.segments;
      /* Only consider a subset of the points for the graph */
      if(self.points.length > self.maxNbPoints) {
         var len = _points.length;
         _points = reduce(_points, _segments);
         _times = reduce(_times, _segments);
         _elevations = reduce(_elevations, _segments);
         _segments = reduceSegments(_segments, len);
      }

      if(_times.length != _points.length)
         _times = null;
      self.drawElevation(_elevations, _points, _times, _segments);
   }

   self.showButtons = function() {
      $('.gpsadvanced').css({display:self.xmls?'block':'none',zIndex:8999}).unbind('click').click(function() {
         self.showElevationChart();
      });

      $('.gpsbigger').css({display:'block',zIndex:8999}).unbind('click').click(function() {
         if($('#'+self.mapDiv).hasClass('gpscanvasbig')) {
            $('#'+self.mapDiv).removeClass('gpscanvasbig');
            $('.gpsbigger').removeClass('gpssmaller');
         } else {
            $('#'+self.mapDiv).addClass('gpscanvasbig');
            $('.gpsbigger').addClass('gpssmaller');
         }
         self.map.invalidateSize();
         self.fitBounds();
      });

      $('.gpsdownload').css({display:self.xmls?'block':'none',zIndex:8999});
   }

   self.showClusters = function(pics, use_time, time_offset) {
      var geopics = [];
      /* Find coord of pics on map */
      for(var i in pics) {
         var pic = pics[i];
         if(!pic.coords)
            continue;
         if(pic.coords.charAt(0) !== '@') {
            var latlon = pic.coords.split(',');
            var p = new L.LatLng(latlon[0], latlon[1]);
            geopics.push([p, pic.url]);
         } else if(self.points.length && config.geo_use_time && use_time) {
            var p = self.getPositionWithTime(pic.coords, self.points, self.times, time_offset);
            if(p !== null)
               geopics.push([self.points[p], pic.url, p]);
         }
      }

      /* Add a bounce effect on clusters when images are hovered. */
      var mc = new L.markerClusterGroup({showCoverageOnHover:false, disableClusteringAtZoom:14});
      function bounce(div, bounce) {
         if(!div || !div._icon)
            return;
         var d = $(div._icon);
         if(bounce) {
            for(var i = 0; i < 5; i++)
               d.animate({top:(i%2==0)?-13:-3}, 100);
            d.animate({top:-8}, 100);
         } else {
            d.stop(true).animate({top:-8}, 100);
         }
      }
      $(geopics).each(function(i) {
         var marker = new L.marker(geopics[i][0], {
            icon: L.icon({iconUrl:'admin/pages/gpx/css/picture.png', iconSize:[16, 16], iconAnchor:[8, 8]}),
         });
         marker.on('click', function() {
            $('a[href$="'+geopics[i][1]+'"]').click();
         });
         $('a[href$="'+geopics[i][1]+'"]').find('img').mouseenter(function() {
            bounce(mc.getVisibleParent(marker), true);
         }).mouseout(function() {
            bounce(mc.getVisibleParent(marker), false);
         });
         mc.addLayer(marker);
         self.bounds.extend(geopics[i][0]);
      });
      self.map.addLayer(mc);
   }

   self.parseTracks = function(xmls) {
      var ret = [];
      /* Sort xmls by date */
      var sortedXmls = [];
      for(var i in xmls) {
         var firstPoint = $(self.xmls[i]).find("trkpt").first();
         var xmlTime = $(firstPoint).find('time');
         var pointTime = 0;
         try {
            if(time.length) 
               pointTime = new Date().setISO8601(xmlTime.text()).getTime();
         } catch(err) {
            pointTime = 0;
         };
         sortedXmls.push({ xml: i, time: pointTime });
      }
      sortedXmls.sort(function(a, b) { return a.time - b.time });

      /* Create polylines */
      for(var idx in sortedXmls) {
         var xml = sortedXmls[idx].xml;
         self.segments[self.points.length] = 1;
         self.nbsegments++;

         $(self.xmls[xml]).find("trkpt").each(function() {
            var lat = $(this).attr("lat");
            var lon = $(this).attr("lon");
            var p = new L.LatLng(lat, lon);
            self.points.push(p);
            self.bounds.extend(p);


            var time = $(this).find('time');
            try {
               if(time.length) 
                  self.times.push(new Date().setISO8601(time.text()).getTime());
            } catch(err) {};

            var ele = $(this).find('ele');
            if(ele.length && parseInt(ele.text(), 10) != 32768) 
               self.elevations.push({elevation:parseFloat(ele.text(),10)});

            if(($(this).is(':first-child')) && (self.segments[self.points.length - 1] != 1)) {
               self.segments[self.points.length - 1] = 1;
               self.nbsegments++;
            }
            if(!self.polypoints[self.nbsegments-1]) {
               self.polypoints[self.nbsegments-1] = [];
               ret.push(self.nbsegments-1);
            }
            self.polypoints[self.nbsegments-1].push(p);
         });
      }
      return ret;
   }

   self.drawTracks = function() {
      /* Draw track */
      for(var i in self.polypoints) {
         var poly = new L.Polyline(self.polypoints[i], {
            color: "#" + (0x1000000 | ((i%2)?(0x880be8):(0xFF00AA))).toString(16).substring(1),
            opacity: .7,
            weight: 4
         });
         poly.addTo(self.map);
      }

      /* Draw start / stop of track */
      if(self.points.length) {
         L.marker(self.points[0], {
            icon: L.icon({iconUrl:'admin/pages/gpx/css/flag_green.png', iconSize:[27, 16], iconAnchor:[13, 8]})
         }).addTo(self.map);
         L.marker(self.points[self.points.length - 1], {
            icon: L.icon({iconUrl:'admin/pages/gpx/css/flag_red.png', iconSize:[27, 16], iconAnchor:[13, 8]})
         }).addTo(self.map);
      }
   }

   self.fitBounds = function(world) {
      if(world) {
         self.map.fitBounds([[-60,180],[70,-180]]);
      } else {
			if(!self.bounds)
				self.bounds = new L.latLngBounds;
			else if(self.bounds.isValid())
				self.map.fitBounds(self.bounds);
      }
   }

   self.addWaypoints = function() {
      for(var i in self.xmls) {
         $(self.xmls[i]).find("wpt").each(function() {
            var lat = $(this).attr("lat");
            var lon = $(this).attr("lon");
            var p = new L.LatLng(lat, lon);
            self.bounds.extend(p);
            
            var content = $(this).find('name').text();
            if(content != '') content += '<br/>';
            content += $(this).find('desc').text();
            content = '<span style="color:#000">'+content+'</span>';

            var marker = new L.marker(p, {
               icon: L.icon({iconUrl:'admin/pages/gpx/css/waypoint_end.png', iconSize:[12, 21], iconAnchor:[6, 10]}),
            }).addTo(self.map).bindPopup(content);
         });
      }
   }

   self.addImages = function(cb) {
      /* Add images on map */
      if(config.geolocalization) {
         self.loadLeafletCluster(function() {
            self.showClusters(data.pics, data.geo_use_time!=="false", data.gxtdiff!==undefined?data.gxtdiff:config.default_geo_time_diff);
            if(cb)
               cb();
         });
      }
   }

   self.loadXmls = function(urls, cb) {
      self.xmls = [];
      if(urls.length) {
         for(var url in urls) {
            $.ajax({
               type: "GET",
               url: urls[url],
               success: function(xml) {
                  self.xmls.push(xml);
                  if(self.xmls.length == urls.length) {
                     cb();
                  }
               },
               error:function(e, f) {
                  $('#'+self.mapDiv).removeClass('canvas_loading').html('Error while loading '+urls[url]+' ('+f+')');
               },
            });
         }
      } else {
         $('#'+self.mapDiv).removeClass('canvas_loading');
         cb();
      }
   }

   self.addTiles = function(layer) {
      var layers = { };
      if(!config.gpx_tiles || config.gpx_tiles === '' || config.gpx_tiles === '[]') {
         $('#'+self.mapDiv).removeClass('canvas_loading').html('Please configure tiles in the administration.');
         return layers;
      }
      var tiles = JSON.parse(config.gpx_tiles);
      var first = undefined;
      for(var i in tiles) {
         var tile = tiles[i];
         if(tile['Enabled'] === true) {
            layers[tile['Name']] = L.tileLayer(tile['URL'], {attribution:tile['Attribution']});
            if(!first)
               first = layers[tile['Name']];
         }
      }
      if(layer && layers[layer])
         layers[layer].addTo(self.map);
      else if(first)
         first.addTo(self.map);
      L.control.layers.buttons(layers).addTo(self.map);

      if(!first)
         $('#'+self.mapDiv).removeClass('canvas_loading').html('Please configure tiles in the administration.');
      self.layers = layers;
      return layers;
   }

   self.getCurrentTileLayers = function() {
      var layers = [];
      self.map.eachLayer(function(layer) {
         if(layer instanceof L.TileLayer)
            layers.push(layer);
      });
      return layers;

   }
   self.showMap = function() {
      if(document.getElementById(self.mapDiv) == null)
         return;
      $('#'+self.mapDiv).addClass('canvas_loading');

      self.map = L.map(self.mapDiv).setView([44.33956524809713, 38.67187500000001], 2);
		self.fitBounds();
      self.addTiles(data?data.gpxtype:undefined);
      return self.map;
   }

   self.showDefault = function() {
      $('#'+self.mapDiv).addClass('canvas_loading');

      var urls = [];
      if(data.gpx)
         urls = [].concat(data.gpx);
      self.loadXmls(urls, function() {
         /* Show tracks and waypoints */
         self.bounds = new L.latLngBounds;
         self.parseTracks(self.xmls);
         self.showMap();
         $('#'+self.mapDiv).removeClass('canvas_loading');
         self.drawTracks();
         self.addWaypoints();
			self.fitBounds();

         self.addImages(self.fitBounds);

         self.showButtons();
      });
   }

   self.loadLeaflet = function(cb) {
      gpxChangeLang();
      jGallery.addCss("admin/pages/gpx/css/gpxmap.css", "leafletcss", function() {
         $script("admin/pages/gpx/scripts/leaflet.js", "leaflet", function() {
            $script("admin/pages/gpx/scripts/leaflet-control.js", "leafletcontrol", function() {
               cb();
            });
         });
      });
   }

   self.loadLeafletCluster = function(cb) {
      jGallery.addCss("admin/pages/gpx/css/cluster.css", "clustercss", function() {
         $script('admin/pages/gpx/scripts/leaflet.markercluster.js', 'clusters', function() {
            cb();
         });
      });
   }
}


