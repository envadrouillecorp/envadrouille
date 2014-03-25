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

function jGPX(data) {
  var maxNbPoints = 400;
  var alwaysUseGMapsElevation = true;
  var minMeaningfulElevationDiff = 40;
  var chartDetails = '';
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
           ret[i] = ret[i-1] + google.maps.geometry.spherical.computeDistanceBetween(points[i-1], points[i]) / 1000; //km
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
              ret[i] = {x:ret[i-1][0], y:100, id:i};
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
     var stripe = Math.floor(len / maxNbPoints);
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
     var stripe = Math.floor(len / maxNbPoints);
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
     var stripe = Math.floor(len / maxNbPoints);
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
        if(Math.abs(el[e].elevation - lastElevation) > minMeaningfulElevationDiff) {
           if(lastElevation < el[e].elevation) {
              total += el[e].elevation - lastElevation;
           }
           lastElevation = el[e].elevation;
        }
     }
     return Math.round(total);
  }

  function getElevations(points, i, cb, args) {
     /* Get the elevation from Google Elevation service. */
     /* Google cannot handle very long URLS => we send N requests of 200 points */
     var elevator = new google.maps.ElevationService();
     var subset = points.slice(i*200,(i+1)*200);
     elevator.getElevationForLocations({'locations':subset}, function(results, st) {
        if (st == google.maps.ElevationStatus.OK) {
           args.result = args.result.concat(results);
           if((i+1)*200 >= points.length) {
              cb(args);
           } else {
              getElevations(points, i+1, cb, args);
           }
        } else {
           $("map_canvas").css('opacity', 0);
        }
     });
  }

  function drawElevation(elev, points, times, map, segments) {
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
              renderTo: 'chart_div',
              zoomType: 'xy',
              backgroundColor:'transparent',
              animation:false,
           },
           alignTicks:false,
           title: { useHTML:true, text: '<abbr title="'+chartDetails+'" style="border-bottom-width:0">'+jGalleryModel.translate('Statistics')+'</abbr>' },
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
              tickInterval:Math.floor(maxHeight + 60 - minHeight) / 2,
              min:minHeight,
              max:maxHeight + 60,
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
              max:maxSpeed + 10,
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
                    pwnMarker = new google.maps.Marker({
                       position: points[this.id],
                       map: map,
                       icon: 'themes/_common/here.png'
                    });
                 else
                    pwnMarker.setPosition(points[this.id]);

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

        $('#chart_div').removeClass('loading_chart');
     }
     $script('./scripts/highcharts.js', 'highcharts', drawChart);
  }

  function binSearch(needle, haystack) {
     if(chartDetails == '')
        chartDetails = 'Track begins '+new Date(haystack[0])+' and ends '+new Date(haystack[haystack.length-1])+', first pic time (with offset) is '+new Date(needle)+'.';

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

  function getPositionWithTime(coord, points, times, diff) {
     var date = new Date().setExifDateTimeOriginal(coord, diff).getTime();
     if(date === 0)
        return null;

     var index = binSearch(date, times);
     if(index == -1)
        return null;
     return index;
  }

  function addRefugeInfo(options)  {
     var _Ref_MapType = null;
     if(config.allow_refugesinfo) {
        _Ref_MapType = new google.maps.ImageMapType({
           getTileUrl: function(coord, zoom) {
              return 'http://maps.refuges.info/hiking/'+zoom+'/'+coord.x+'/'+coord.y+'.png';
           },
           tileSize: new google.maps.Size(256,256),
           name: 'refuges.info',
           maxZoom: 18
        });
        options['mapTypeControlOptions'].mapTypeIds.unshift('refuges.info');
     }
     return _Ref_MapType;
  } 
  function addIGN(options) {
     var _GPX_ignMapType = null;
     if(config.ign_key && config.ign_key !== '') {
         var layer = "GEOGRAPHICALGRIDSYSTEMS.MAPS";
         _GPX_ignMapType = new google.maps.ImageMapType({
             getTileUrl: function(coord, zoom) {
                 return "http://gpp3-wxs.ign.fr/" + config.ign_key + "/geoportail/wmts?LAYER=" + layer + "&EXCEPTIONS=text/xml&FORMAT=image/jpeg&SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX=" +   zoom + "&TILEROW=" + coord.y + "&TILECOL=" + coord.x;
             },
             tileSize: new google.maps.Size(256,256),
             name: "IGN",
             maxZoom: 18
         });
         options['mapTypeControlOptions'].mapTypeIds.unshift('IGN');
     }
     return _GPX_ignMapType;
  }

  function showMap(xmls) {
     $('#map_canvas').removeClass('canvas_loading');

     var map;
     var options = {
        center: new google.maps.LatLng(-34.397, 150.644),
        zoom: 8,
        scaleControl: true,
        mapTypeId: data.gpxtype?data.gpxtype:'satellite',
        mapTypeControlOptions: {
           mapTypeIds: [google.maps.MapTypeId.TERRAIN, google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.ROADMAP],
           style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
        },
     };
     var ign = addIGN(options);
     var refuges = addRefugeInfo(options);
     var bounds = new google.maps.LatLngBounds ();

     /* Show map */
     map = new google.maps.Map(document.getElementById("map_canvas"), options);
     if(ign)
        map.mapTypes.set('IGN', ign);
     if(refuges)
        map.mapTypes.set('refuges.info', refuges);


     var points = [];
     var polypoints = [];
     var times = [];
     var elevations = [];
     var segments = {};
     var nbsegments = 0;

     /* Get points */
     function tag(x) { return x.tagName.toLowerCase(); }
     for(var i in xmls) {
        segments[points.length] = 1;
        nbsegments++;

        $(xmls[i]).find("trkpt").each(function() {
          var lat = $(this).attr("lat");
          var lon = $(this).attr("lon");
          var p = new google.maps.LatLng(lat, lon);
          points.push(p);
          bounds.extend(p);


          var time = $(this).find('time');
          try {
             if(time.length) 
                times.push(new Date().setISO8601(time.text()).getTime());
          } catch(err) {};

          var ele = $(this).find('ele');
          if(ele.length && parseInt(ele.text(), 10) != 32768) 
             elevations.push({elevation:parseFloat(ele.text(),10)});

          if(($(this).is(':first-child')) && (segments[points.length - 1] != 1)) {
             segments[points.length - 1] = 1;
             nbsegments++;
          }
          if(!polypoints[nbsegments-1])
             polypoints[nbsegments-1] = [];
          polypoints[nbsegments-1].push(p);
        });
     }

     /* Draw track */
     for(var i in polypoints) {
        var poly = new google.maps.Polyline({
          path: polypoints[i],
          strokeColor: "#" + (0x1000000 | ((i%2)?(0x880be8):(0xFF00AA))).toString(16).substring(1),
          strokeOpacity: .7,
          strokeWeight: 4
        });
        poly.setMap(map);
     }
     map.fitBounds(bounds);

     if(xmls) {
        /* Draw start / stop of track */
        var start = new google.maps.Marker({
           map:map,
           animation: google.maps.Animation.DROP,
           position: points[0],
           icon:'admin/pages/gpx/css/flag_green.png'
        });
        var end = new google.maps.Marker({
           map:map,
           animation: google.maps.Animation.DROP,
           position: points[points.length - 1],
           icon:'admin/pages/gpx/css/flag_red.png'
        });
     }

     if(config.geolocalization) {
        var reducedIndexes = null;
        $script('http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclustererplus/src/markerclusterer_packed.js', 'gmapsclusters', function() {
           var geopics = [];
           for(var i in data.pics) {
              var pic = data.pics[i];
              if(!pic.coords)
                 continue;
              if(pic.coords.charAt(0) !== '@') {
                 var latlon = pic.coords.split(',');
                 var p = new google.maps.LatLng(latlon[0], latlon[1]);
                 geopics.push([p, pic.url]);
                 bounds.extend(p);
              } else if(xmls && config.geo_use_time) {
                 var p = getPositionWithTime(pic.coords, points, times, data.gxtdiff!==undefined?data.gxtdiff:config.default_geo_time_diff);
                 if(p !== null) {
                    geopics.push([points[p], pic.url, p]);
                    bounds.extend(points[p]);
                 }
              }
           }

           var markers = [];
           function findCluster(marker) {
              var clusters = mc.getClusters();
              for(var i = 0; i < clusters.length;++i){
                 if(clusters[i].markers_.length > 1 && clusters[i].clusterIcon_.div_){
                    if(clusters[i].markers_.indexOf(marker)>-1){
                       return clusters[i].clusterIcon_.div_;
                    } 
                 }
              }
              return null;
           }
           function bounce(cluster) {
              if(cluster.attr('bounce') == "false")
                 return;

              cluster.stop().animate({marginTop: '-='+5},370)
                 .animate({marginTop: '+='+5},370, function() {
                    setTimeout(function() { bounce(cluster)}, 20);
                 });
           }

           for(var i in geopics) {
              var marker = new google.maps.Marker({
                 position: geopics[i][0],
                 icon:'admin/pages/gpx/css/picture.png'
              });
              marker.set('geopicid', i);
              google.maps.event.addListener(marker, 'click', function() {
                 $('a[href$="'+geopics[this.get('geopicid')][1]+'"]').click();
              });
              $('a[href$="'+geopics[i][1]+'"]').find('img').mouseenter({index:geopics[i][2],marker:marker}, function(event) {
                 event.data.marker.setAnimation(google.maps.Animation.BOUNCE);
                 var cluster = findCluster(event.data.marker);
                 if(cluster) {
                    cluster = $(cluster);
                    if(!cluster.attr('bounce') || cluster.attr('bounce') == "false") {
                       $(cluster).attr('bounce', "true");
                       bounce($(cluster));
                    }
                 }
                 if(chart && distances) {
                    if(reducedIndexes == null)
                       reducedIndexes = indexesToReducedIndexes(points, segments);
                    var index = reducedIndexes[event.data.index];
                    if(index >= 0 && (index + 1 < distances.length)) {
                       var from = distances[index];
                       var to = distances[index + 1];
                       chart.xAxis[0].addPlotBand({from:from, to:to, color:'#F00', id:'pichover'+event.data.index});
                    }
                 }
              }).mouseout({index:geopics[i][2],marker:marker}, function(event) {
                 event.data.marker.setAnimation(null);
                 var cluster = findCluster(event.data.marker);
                 if(cluster) {
                    cluster = $(cluster);
                    if(cluster.attr('bounce') == "true") {
                       $(cluster).attr('bounce', "false");
                       $(cluster).stop().stop().css('marginTop', '0');
                    }
                 }
                 if(chart && distances) {
                    chart.xAxis[0].removePlotBand('pichover'+event.data.index);
                 }
              });
              markers.push(marker);
           }
           var mc = new MarkerClusterer(map, markers);
           mc.setZoomOnClick(false);
           google.maps.event.addListener(mc, 'click', function(cluster) {
              var markers = cluster.getMarkers();
              google.maps.event.trigger(markers[0], 'click');
           });
           map.fitBounds(bounds);
        });
     }

     for(var i in xmls) {
        $(xmls[i]).find("wpt").each(function() {
           var lat = $(this).attr("lat");
           var lon = $(this).attr("lon");
           var p = new google.maps.LatLng(lat, lon);
           var marker = new google.maps.Marker({
              map:map,
              animation: google.maps.Animation.DROP,
              position: p,
              icon:'admin/pages/gpx/css/waypoint_end.png',
              optimized:false, /* so that it appears on top of clusters */
           });

           var content = $(this).find('name').text();
           if(content != '') content += '<br/>';
           content += $(this).find('desc').text();
           content = '<span style="color:#000">'+content+'</span>';

           var infowindow = new google.maps.InfoWindow({ content: content });
           google.maps.event.addListener(marker, 'click', function() {
              infowindow.open(map,marker);
           });
        });
     }


     
     var first_chart_show = true;
     var chart_shown = false;
     $('.gpsadvanced').css('display', xmls?'block':'none').unbind('click').click(function() {
        if(chart_shown) {
           $('#chart_div').css('display', 'none');
           chart_shown = false;
           return;
        } else if(!first_chart_show) {
           $('#chart_div').css('display', 'block');
           chart_shown = true;
           return;
        }

        $('#chart_div').css('display', 'block').addClass('loading_chart');
        chart_shown = true;
        first_chart_show = false;

        var _points = points, _times = times, _elevations = elevations, _segments = segments;
        /* Only consider a subset of the points for the graph */
        if(points.length > maxNbPoints) {
           var len = _points.length;
           _points = reduce(_points, segments);
           _times = reduce(_times, segments);
           _elevations = reduce(_elevations, segments);
           _segments = reduceSegments(_segments, len);
        }

        if(_times.length != _points.length)
           _times = null;
        if(alwaysUseGMapsElevation || _elevations.length != _points.length)  { 
           getElevations(_points, 0, function(args) {
              drawElevation(args.result, args.points, args.times, args.map, _segments);
           }, { result:[], points:_points, times:_times, map:map });
        } else {
           drawElevation(_elevations, _points, _times, map, _segments);
        }
     });

     $('.gpsbigger').css('display', 'block').unbind('click').click(function() {
        if($('#map_canvas').hasClass('gpscanvasbig')) {
           $('#map_canvas').removeClass('gpscanvasbig');
           $('.gpsbigger').removeClass('gpssmaller');
        } else {
           $('#map_canvas').addClass('gpscanvasbig');
           $('.gpsbigger').addClass('gpssmaller');
        }
        google.maps.event.trigger(map, "resize");
        map.fitBounds(bounds);
     });

  }

  window.realShowGPX = function(b) {
     if(b === true)
        return;
     if(document.getElementById("map_canvas") == null)
        return;

     $('#map_canvas').addClass('canvas_loading');

     if(data.gpx) {
        var urls = [].concat(data.gpx);
        var xmls = [];
        for(var url in urls) {
           $.ajax({
             type: "GET",
             url: urls[url],
             success: function(xml) {
                xmls.push(xml);
                if(xmls.length == urls.length)
                  showMap(xmls);
             },
             error:function(e, f) {
                $('#map_canvas').removeClass('canvas_loading').html('Error while loading '+urls[url]+' ('+f+')');
             },
           });
        }
     } else {
        showMap(null);
     }
  }
  gpxChangeLang();
  $script('http://maps.google.com/maps/api/js?sensor=false&callback=realShowGPX', 'gmaps', window.realShowGPX);
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
