function get_last_version(url, curr_version) {
   get_json(url, function(data) {
      if(!data || !Array.isArray(data))
         return;

      var last_version = data[0]?data[0]:0;
      if(curr_version < last_version) {
         inform('update_gal', 'warning-small', true, [last_version, curr_version]);
         var min_left = ($('#head #current').position().left + $('#head #current').width() + 130);
         $('#version_update #update').css('position', 'absolute').css('top', '-5px').css('left', min_left + "px").css('right', "50px").css('opacity', 0).animate({opacity:1}, "5000");
      }
   });
}

function check_update() {
   var batch = new Batch(ParallelBatch);
   batch.get({action:'update.get_update_info'}, function(json) {
      if(!json || !json.update_activated)
         return;
      get_last_version(json.update_url, json.VERSION);
   });
   batch.launch();
}

$(document).ready(function() {
   check_update();
});
