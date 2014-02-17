(function(){var t=function(n,t,i){var r=n,f=t||0,u=0;this.getRawData=function(){return r},typeof n=="string"?(u=i||r.length,this.getByteAt=function(n){return r.charCodeAt(n+f)&255}):typeof n=="unknown"&&(u=i||IEBinary_getLength(r),this.getByteAt=function(n){return IEBinary_getByteAt(r,n+f)}),this.getLength=function(){return u},this.getSByteAt=function(n){var t=this.getByteAt(n);return t>127?t-256:t},this.getShortAt=function(n,t){var i=t?(this.getByteAt(n)<<8)+this.getByteAt(n+1):(this.getByteAt(n+1)<<8)+this.getByteAt(n);return i<0&&(i+=65536),i},this.getSShortAt=function(n,t){var i=this.getShortAt(n,t);return i>32767?i-65536:i},this.getLongAt=function(n,t){var f=this.getByteAt(n),u=this.getByteAt(n+1),e=this.getByteAt(n+2),r=this.getByteAt(n+3),i=t?(((f<<8)+u<<8)+e<<8)+r:(((r<<8)+e<<8)+u<<8)+f;return i<0&&(i+=4294967296),i},this.getSLongAt=function(n,t){var i=this.getLongAt(n,t);return i>2147483647?i-4294967296:i},this.getStringAt=function(n,t){for(var u=[],i=n,r=0;i<n+t;i++,r++)u[r]=String.fromCharCode(this.getByteAt(i));return u.join("")},this.getCharAt=function(n){return String.fromCharCode(this.getByteAt(n))},this.toBase64=function(){return window.btoa(r)},this.fromBase64=function(n){r=window.atob(n)}},i=function(){function i(){var n=null;return window.XMLHttpRequest?n=new XMLHttpRequest:window.ActiveXObject&&(n=new ActiveXObject("Microsoft.XMLHTTP")),n}function r(n,t,r){var u=i();u?(t&&(typeof u.onload!="undefined"?u.onload=function(){u.status=="200"?t(this):r&&r(),u=null}:u.onreadystatechange=function(){u.readyState==4&&(u.status=="200"?t(this):r&&r(),u=null)}),u.open("HEAD",n,!0),u.send(null)):r&&r()}function n(n,r,u,f,e,o){var s=i(),c,h;s?(c=0,f&&!e&&(c=f[0]),h=0,f&&(h=f[1]-f[0]+1),r&&(typeof s.onload!="undefined"?s.onload=function(){s.status=="200"||s.status=="206"||s.status=="0"?(this.binaryResponse=new t(this.responseText,c,h),this.fileSize=o||this.getResponseHeader("Content-Length"),r(this)):u&&u(),s=null}:s.onreadystatechange=function(){s.readyState==4&&(s.status=="200"||s.status=="206"||s.status=="0"?(this.binaryResponse=new t(s.responseBody,c,h),this.fileSize=o||this.getResponseHeader("Content-Length"),r(this)):u&&u(),s=null)}),s.open("GET",n,!0),s.overrideMimeType&&s.overrideMimeType("text/plain; charset=x-user-defined"),f&&e&&s.setRequestHeader("Range","bytes="+f[0]+"-"+f[1]),s.setRequestHeader("If-Modified-Since","Sat, 1 Jan 1970 00:00:00 GMT"),s.send(null)):u&&u()}return function(t,i,u,f){f?r(t,function(r){var s=parseInt(r.getResponseHeader("Content-Length"),10),h=r.getResponseHeader("Accept-Ranges"),e,o;e=f[0],f[0]<0&&(e+=s),o=e+f[1]-1,n(t,i,u,[e,o],h=="bytes",s)}):n(t,i,u)}}(),n;document.write("<script type='text/vbscript'>\r\nFunction IEBinary_getByteAt(strBinary, iOffset)\r\n\tIEBinary_getByteAt = AscB(MidB(strBinary,iOffset+1,1))\r\nEnd Function\r\nFunction IEBinary_getLength(strBinary)\r\n\tIEBinary_getLength = LenB(strBinary)\r\nEnd Function\r\n<\/script>\r\n"),n={},function(){function o(n,t,i){n.addEventListener?n.addEventListener(t,i,!1):n.attachEvent&&n.attachEvent("on"+t,i)}function r(n){return!!n.exifdata}function h(n,t){i(n.src,function(i){var r=e(i.binaryResponse);n.exifdata=r||{},t&&t()})}function e(n){var e=[],i,u,r;if(n.getByteAt(0)!=255||n.getByteAt(1)!=216)return!1;for(i=2,u=n.getLength();i<u;){if(n.getByteAt(i)!=255)return t&&console.log("Not a valid marker at offset "+i+", found: "+n.getByteAt(i)),!1;if((r=n.getByteAt(i+1),r==22400)||r==225)return t&&console.log("Found 0xFFE1 marker"),f(n,i+4,n.getShortAt(i+2,!0)-2);i+=2+n.getShortAt(i+2,!0)}}function u(n,i,r,u,f){for(var l=n.getShortAt(r,f),h={},e,s,o=0;o<l;o++)e=r+o*12+2,s=u[n.getShortAt(e,f)],!s&&t&&console.log("Unknown tag: "+n.getShortAt(e,f)),h[s]=c(n,e,i,r,f);return h}function c(n,t,i,r,u){var l=n.getShortAt(t+2,u),o=n.getLongAt(t+4,u),s=n.getLongAt(t+8,u)+i,c,h,e,f;switch(l){case 1:case 7:if(o==1)return n.getByteAt(t+8,u);for(h=o>4?s:t+8,e=[],f=0;f<o;f++)e[f]=n.getByteAt(h+f);return e;case 2:return c=o>4?s:t+8,n.getStringAt(c,o-1);case 3:if(o==1)return n.getShortAt(t+8,u);for(h=o>2?s:t+8,e=[],f=0;f<o;f++)e[f]=n.getShortAt(h+2*f,u);return e;case 4:if(o==1)return n.getLongAt(t+8,u);for(e=[],f=0;f<o;f++)e[f]=n.getLongAt(s+4*f,u);return e;case 5:if(o==1)return n.getLongAt(s,u)/n.getLongAt(s+4,u);for(e=[],f=0;f<o;f++)e[f]=n.getLongAt(s+8*f,u)/n.getLongAt(s+4+8*f,u);return e;case 9:if(o==1)return n.getSLongAt(t+8,u);for(e=[],f=0;f<o;f++)e[f]=n.getSLongAt(s+4*f,u);return e;case 10:if(o==1)return n.getSLongAt(s,u)/n.getSLongAt(s+4,u);for(e=[],f=0;f<o;f++)e[f]=n.getSLongAt(s+8*f,u)/n.getSLongAt(s+4+8*f,u);return e}}function f(i,r){var c,s,l,o,h,e;if(i.getStringAt(r,4)!="Exif")return t&&console.log("Not valid EXIF data! "+i.getStringAt(r,4)),!1;if(s=r+6,i.getShortAt(s)==18761)c=!1;else if(i.getShortAt(s)==19789)c=!0;else return t&&console.log("Not valid TIFF data! (no 0x4949 or 0x4D4D)"),!1;if(i.getShortAt(s+2,c)!=42)return t&&console.log("Not valid TIFF data! (no 0x002A)"),!1;if(i.getLongAt(s+4,c)!=8)return t&&console.log("Not valid TIFF data! (First offset not 8)",i.getShortAt(s+4,c)),!1;if(l=u(i,s,s+8,n.TiffTags,c),l.ExifIFDPointer){o=u(i,s,s+l.ExifIFDPointer,n.Tags,c);for(e in o){switch(e){case"LightSource":case"Flash":case"MeteringMode":case"ExposureProgram":case"SensingMethod":case"SceneCaptureType":case"SceneType":case"CustomRendered":case"WhiteBalance":case"GainControl":case"Contrast":case"Saturation":case"Sharpness":case"SubjectDistanceRange":case"FileSource":o[e]=n.StringValues[e][o[e]];break;case"ExifVersion":case"FlashpixVersion":o[e]=String.fromCharCode(o[e][0],o[e][1],o[e][2],o[e][3]);break;case"ComponentsConfiguration":o[e]=n.StringValues.Components[o[e][0]]+n.StringValues.Components[o[e][1]]+n.StringValues.Components[o[e][2]]+n.StringValues.Components[o[e][3]]}l[e]=o[e]}}if(l.GPSInfoIFDPointer){h=u(i,s,s+l.GPSInfoIFDPointer,n.GPSTags,c);for(e in h){switch(e){case"GPSVersionID":h[e]=h[e][0]+"."+h[e][1]+"."+h[e][2]+"."+h[e][3]}l[e]=h[e]}}return l}function s(){for(var i=document.getElementsByTagName("img"),t=0;t<i.length;t++)i[t].getAttribute("exif")=="true"&&(i[t].complete?n.getData(i[t]):o(i[t],"load",function(){n.getData(this)}))}var t=!1;n.Tags={36864:"ExifVersion",40960:"FlashpixVersion",40961:"ColorSpace",40962:"PixelXDimension",40963:"PixelYDimension",37121:"ComponentsConfiguration",37122:"CompressedBitsPerPixel",37500:"MakerNote",37510:"UserComment",40964:"RelatedSoundFile",36867:"DateTimeOriginal",36868:"DateTimeDigitized",37520:"SubsecTime",37521:"SubsecTimeOriginal",37522:"SubsecTimeDigitized",33434:"ExposureTime",33437:"FNumber",34850:"ExposureProgram",34852:"SpectralSensitivity",34855:"ISOSpeedRatings",34856:"OECF",37377:"ShutterSpeedValue",37378:"ApertureValue",37379:"BrightnessValue",37380:"ExposureBias",37381:"MaxApertureValue",37382:"SubjectDistance",37383:"MeteringMode",37384:"LightSource",37385:"Flash",37396:"SubjectArea",37386:"FocalLength",41483:"FlashEnergy",41484:"SpatialFrequencyResponse",41486:"FocalPlaneXResolution",41487:"FocalPlaneYResolution",41488:"FocalPlaneResolutionUnit",41492:"SubjectLocation",41493:"ExposureIndex",41495:"SensingMethod",41728:"FileSource",41729:"SceneType",41730:"CFAPattern",41985:"CustomRendered",41986:"ExposureMode",41987:"WhiteBalance",41988:"DigitalZoomRation",41989:"FocalLengthIn35mmFilm",41990:"SceneCaptureType",41991:"GainControl",41992:"Contrast",41993:"Saturation",41994:"Sharpness",41995:"DeviceSettingDescription",41996:"SubjectDistanceRange",40965:"InteroperabilityIFDPointer",42016:"ImageUniqueID"},n.TiffTags={256:"ImageWidth",257:"ImageHeight",34665:"ExifIFDPointer",34853:"GPSInfoIFDPointer",40965:"InteroperabilityIFDPointer",258:"BitsPerSample",259:"Compression",262:"PhotometricInterpretation",274:"Orientation",277:"SamplesPerPixel",284:"PlanarConfiguration",530:"YCbCrSubSampling",531:"YCbCrPositioning",282:"XResolution",283:"YResolution",296:"ResolutionUnit",273:"StripOffsets",278:"RowsPerStrip",279:"StripByteCounts",513:"JPEGInterchangeFormat",514:"JPEGInterchangeFormatLength",301:"TransferFunction",318:"WhitePoint",319:"PrimaryChromaticities",529:"YCbCrCoefficients",532:"ReferenceBlackWhite",306:"DateTime",270:"ImageDescription",271:"Make",272:"Model",305:"Software",315:"Artist",33432:"Copyright"},n.GPSTags={0:"GPSVersionID",1:"GPSLatitudeRef",2:"GPSLatitude",3:"GPSLongitudeRef",4:"GPSLongitude",5:"GPSAltitudeRef",6:"GPSAltitude",7:"GPSTimeStamp",8:"GPSSatellites",9:"GPSStatus",10:"GPSMeasureMode",11:"GPSDOP",12:"GPSSpeedRef",13:"GPSSpeed",14:"GPSTrackRef",15:"GPSTrack",16:"GPSImgDirectionRef",17:"GPSImgDirection",18:"GPSMapDatum",19:"GPSDestLatitudeRef",20:"GPSDestLatitude",21:"GPSDestLongitudeRef",22:"GPSDestLongitude",23:"GPSDestBearingRef",24:"GPSDestBearing",25:"GPSDestDistanceRef",26:"GPSDestDistance",27:"GPSProcessingMethod",28:"GPSAreaInformation",29:"GPSDateStamp",30:"GPSDifferential"},n.StringValues={ExposureProgram:{0:"Not defined",1:"Manual",2:"Normal program",3:"Aperture priority",4:"Shutter priority",5:"Creative program",6:"Action program",7:"Portrait mode",8:"Landscape mode"},MeteringMode:{0:"Unknown",1:"Average",2:"CenterWeightedAverage",3:"Spot",4:"MultiSpot",5:"Pattern",6:"Partial",255:"Other"},LightSource:{0:"Unknown",1:"Daylight",2:"Fluorescent",3:"Tungsten (incandescent light)",4:"Flash",9:"Fine weather",10:"Cloudy weather",11:"Shade",12:"Daylight fluorescent (D 5700 - 7100K)",13:"Day white fluorescent (N 4600 - 5400K)",14:"Cool white fluorescent (W 3900 - 4500K)",15:"White fluorescent (WW 3200 - 3700K)",17:"Standard light A",18:"Standard light B",19:"Standard light C",20:"D55",21:"D65",22:"D75",23:"D50",24:"ISO studio tungsten",255:"Other"},Flash:{0:"Flash did not fire",1:"Flash fired",5:"Strobe return light not detected",7:"Strobe return light detected",9:"Flash fired, compulsory flash mode",13:"Flash fired, compulsory flash mode, return light not detected",15:"Flash fired, compulsory flash mode, return light detected",16:"Flash did not fire, compulsory flash mode",24:"Flash did not fire, auto mode",25:"Flash fired, auto mode",29:"Flash fired, auto mode, return light not detected",31:"Flash fired, auto mode, return light detected",32:"No flash function",65:"Flash fired, red-eye reduction mode",69:"Flash fired, red-eye reduction mode, return light not detected",71:"Flash fired, red-eye reduction mode, return light detected",73:"Flash fired, compulsory flash mode, red-eye reduction mode",77:"Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected",79:"Flash fired, compulsory flash mode, red-eye reduction mode, return light detected",89:"Flash fired, auto mode, red-eye reduction mode",93:"Flash fired, auto mode, return light not detected, red-eye reduction mode",95:"Flash fired, auto mode, return light detected, red-eye reduction mode"},SensingMethod:{1:"Not defined",2:"One-chip color area sensor",3:"Two-chip color area sensor",4:"Three-chip color area sensor",5:"Color sequential area sensor",7:"Trilinear sensor",8:"Color sequential linear sensor"},SceneCaptureType:{0:"Standard",1:"Landscape",2:"Portrait",3:"Night scene"},SceneType:{1:"Directly photographed"},CustomRendered:{0:"Normal process",1:"Custom process"},WhiteBalance:{0:"Auto white balance",1:"Manual white balance"},GainControl:{0:"None",1:"Low gain up",2:"High gain up",3:"Low gain down",4:"High gain down"},Contrast:{0:"Normal",1:"Soft",2:"Hard"},Saturation:{0:"Normal",1:"Low saturation",2:"High saturation"},Sharpness:{0:"Normal",1:"Soft",2:"Hard"},SubjectDistanceRange:{0:"Unknown",1:"Macro",2:"Close view",3:"Distant view"},FileSource:{3:"DSC"},Components:{0:"",1:"Y",2:"Cb",3:"Cr",4:"R",5:"G",6:"B"}},n.getData=function(n,t){return n.complete?(r(n)?t&&t():h(n,t),!0):!1},n.getTag=function(n,t){if(r(n))return n.exifdata[t]},n.getAllTags=function(n){var i,u,t;if(!r(n))return{};i=n.exifdata,u={};for(t in i)i.hasOwnProperty(t)&&(u[t]=i[t]);return u},n.pretty=function(n){var i,u,t;if(!r(n))return"";i=n.exifdata,u="";for(t in i)i.hasOwnProperty(t)&&(u+=typeof i[t]=="object"?t+" : ["+i[t].length+" values]\r\n":t+" : "+i[t]+"\r\n");return u},n.readFromBinaryFile=function(n){return e(n)},jQuery(document).ready(s),jQuery.fn.exifLoad=function(t){return this.each(function(){n.getData(this,t)})},jQuery.fn.exif=function(t){var i=[];return this.each(function(){i.push(n.getTag(this,t))}),i},jQuery.fn.exifAll=function(){var t=[];return this.each(function(){t.push(n.getAllTags(this))}),t},jQuery.fn.exifPretty=function(){var t=[];return this.each(function(){t.push(n.pretty(this))}),t}}()})();
