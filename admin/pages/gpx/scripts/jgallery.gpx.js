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

function jGPX(data) {
  var maxNbPoints = 400;
  var alwaysUseGMapsElevation = true;
  var minMeaningfulElevationDiff = 40;

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
           ret[i] = [distances[i], 0];
     } else {
        ret[0] = [0, 0];
        for(var i = 1; i < len; i++) {
           var newSpan = times[i] - times[i-1];
           if(newSpan == 0)
              ret[i] = [ret[i-1][0], 100];
           else
              ret[i] = [distances[i], (distances[i] - distances[i-1]) / (newSpan / 1000 / 3600)];
           if(ret[i][1] > max) //store max
              max = ret[i][1];
        }
     }
     return [min, max, ret];
  }

  function elevation(el, distances) {
     var ret = [];
     var min = 100000;
     var max = 0;
     var len = distances.length;
     ret[0] = [100000,0];
     for(var i = 1; i < len; i++) {
        ret[i] = [distances[i], el[i].elevation];
        if(ret[i][1] > max) //store max
           max = ret[i][1];
        if(ret[i][1] < min) //store min
           min = ret[i][1];
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
  
  function makeHash(distances, points) {
     var ret = {};
     var len = distances.length;
     for(var i = 0; i < len; i++) {
        ret[distances[i]] = points[i];
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

  function dateTextToDate(ttimes) {
     var times = null;
     if(ttimes) {
        var times = [];
        var len = ttimes.length;
        for(var i = 0; i < ttimes.length; i++) {
           times[i] = new Date().setISO8601(ttimes[i]).getTime();
        }
     }
     return times;
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

  function drawElevation(elev, points, ttimes, map, segments) {
     function drawChart() {
        var times = dateTextToDate(ttimes);
        var distances = distance(points, segments);
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

        var tooltipPoints = makeHash(distances, points);
        var tooltipTimes= times?makeHash(distances, times):[];
        var pwnMarker;
        var elevationName = '<span>'+jGalleryModel.translate('Altitude - Total Elevation: ')+'</span>'+totalElevation(elev, segments)+'m';
        var speedName = '<span>'+jGalleryModel.translate('Speed - Average: ')+'</span>'+averageSpeed(distances, times, segments)+'km/h (<span>'+jGalleryModel.translate('during')+'</span> '+totalTime(times, segments, true)+' <span>'+jGalleryModel.translate('hours')+'</span>)';

        var chart = new Highcharts.Chart({
           chart: {
              renderTo: 'chart_div',
              zoomType: 'xy',
              backgroundColor:'transparent',
              animation:false,
           },
           title: { text: jGalleryModel.translate('Statistics') },
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
              min:Math.floor(minHeight*100)/100,
              max:Math.floor(maxHeight*100)/100,
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
              min:0,
              max:Math.floor(maxSpeed*10)/10,
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
                 if(!pwnMarker)
                    pwnMarker = new google.maps.Marker({
                       position: tooltipPoints[this.x],
                       map: map,
                       icon: 'themes/_common/here.png'
                    });
                 else
                    pwnMarker.setPosition(tooltipPoints[this.x]);

                 var unith = { };
                 unith[elevationName] = 'm';
                 unith[speedName] = 'km/h';
                 var unit = unith[this.series.name];
                 var ret = ''+(Math.round(this.y*10)/10)+' '+unit;
                 if(times != null) {
                    var time_s = Math.round((tooltipTimes[this.x]-times[0])/1000);
                    var time_min = Math.floor(time_s / 60);
                    var time_h = Math.floor(time_min / 60);
                    var time_d = Math.floor(time_h / 24);
                    time_s = time_s - time_min * 60;
                    time_min = time_min - time_h * 60;
                    time_h = time_h - time_d * 24;
                    if(time_d > 0) {
                       ret += '<br/>'+time_d+'d:'+time_h+'h:'+time_min+'m:'+time_s+'s';
                    } else {
                       ret += '<br/>'+time_h+'h:'+time_min+'m:'+time_s+'s';
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
         options['mapTypeControlOptions'] = {
            mapTypeIds: ['IGN', google.maps.MapTypeId.TERRAIN, google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.ROADMAP],
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
         };
     }
     return _GPX_ignMapType;
  }

  function showMap(xmls) {
     var map;
     $('#map_canvas').removeClass('canvas_loading');

     var options = {
        center: new google.maps.LatLng(-34.397, 150.644),
        zoom: 8,
        scaleControl: true,
        mapTypeId: data.gpxtype?data.gpxtype:'satellite',
     };
     var ign = addIGN(options);
     map = new google.maps.Map(document.getElementById("map_canvas"), options);
     if(ign)
         map.mapTypes.set('IGN', ign);


     var points = [];
     var polypoints = [];
     var times = [];
     var elevations = [];
     var segments = {};
     var nbsegments = 0;
     var bounds = new google.maps.LatLngBounds ();

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
          if(time.length) 
             times.push(time.text());

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

     /* Draw start / stop of track */
     var start = new google.maps.Marker({
        map:map,
        animation: google.maps.Animation.DROP,
        position: points[0],
        icon:'themes/_common/flag_green.png'
     });
     var end = new google.maps.Marker({
        map:map,
        animation: google.maps.Animation.DROP,
        position: points[points.length - 1],
        icon:'themes/_common/flag_red.png'
     });

     
     var first_chart_show = true;
     var chart_shown = false;
     $('.gpsadvanced').css('display', 'block').unbind('click').click(function() {
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

        /* Only consider a subset of the points for the graph */
        if(points.length > maxNbPoints) {
           var len = points.length;
           points = reduce(points, segments);
           times = reduce(times, segments);
           elevations = reduce(elevations, segments);
           segments = reduceSegments(segments, len);
        }

        if(times.length != points.length)
           times = null;
        if(alwaysUseGMapsElevation || elevations.length != points.length)  { 
           getElevations(points, 0, function(args) {
              drawElevation(args.result, args.points, args.times, args.map, segments);
           }, { result:[], points:points, times:times, map:map });
        } else {
           drawElevation(elevations, points, times, map, segments);
        }
     });

     $('.gpsbigger').css('display', 'block').unbind('click').click(function() {
        if($('#map_canvas').hasClass('gpscanvasbig')) {
           $('#map_canvas').removeClass('gpscanvasbig');
        } else {
           $('#map_canvas').addClass('gpscanvasbig');
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
  }
  $script('http://maps.google.com/maps/api/js?sensor=false&callback=realShowGPX', 'gmaps', window.realShowGPX);
}
