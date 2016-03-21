$(document).ready(function() {
   var installed_plugins = {}, nb_outdated = 0, latest_plugin = 0;
   var config;

   function get_last_plugins() {
      var url = config.plugin_url + 'PLUGINS';
      get_json(url, function(data) {
         if(!data || !Array.isArray(data))
            return;

         for(var p in data) {
            var name = data[p].name;
            if(installed_plugins[name]) {
               var version = parseInt(installed_plugins[name].version, 10);
               if(version < data[p].version)
                  nb_outdated++;
            }
            if(data[p].version > latest_plugin)
               latest_plugin = data[p].version;
         }
         if(nb_outdated && config.check_plugin_updates)
            $('img[alt="Plugins"]').attr('src', 'pages/plugins/css/main_button_update.png');
         else if(config.last_visit_plugin < latest_plugin && config.check_new_plugin)
            $('img[alt="Plugins"]').attr('src', 'pages/plugins/css/main_button_new.png');
      });
   }

   var batch = new Batch(ParallelBatch);
   batch.get({action:'plugins.get_plugins'}, function(json) {
      var nb_versionned = 0;
      for(plugin in json.plugins) {
         installed_plugins[json.plugins[plugin].name] = json.plugins[plugin];
         if(parseInt(json.plugins[plugin].version, 10) != 0)
            nb_versionned++;
      }
      config = json;
      if(!config.check_new_plugin && !config.check_plugin_updates)
         return;
      if(nb_versionned || config.check_new_plugin) // no versionned plugin == no plugin installed, only classical pages
         get_last_plugins();
   });
   batch.launch();
});
