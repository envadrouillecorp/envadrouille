var plug_lang;
var installed_plugins;

function Plugin(data) {
   var self = this;
   self.id = getUID();
   self.version = getVersion(data) || 0;
   self.meta = data;
   self.installed = isInstalled(self.meta);
   self.toupdate = (self.version < parseInt(self.meta.version, 10));

   if(self.meta['descr-'+plug_lang])
      self.meta.descr = self.meta['descr-'+plug_lang];
   else
      self.meta.descr = self.meta['descr-en'];

   if(self.installed)
      $("#pluginInstalledTpl").tmpl(self).appendTo($('#installed_plugins'));
   else
      $("#pluginNewTpl").tmpl(self).appendTo($('#available_plugins'));

   self.div = $("#plug_"+self.id);
   self.descr = self.div.find('.descr');
   self.descr.translate();

   self.div.hover(function() {
         self.descr.stop().animate({opacity:1}, 'fast');
      }, function() {
         self.descr.stop().animate({opacity:0}, 'fast');
      });

   if(self.installed) {
      self.div.find('.remove').click(function() {
         $(this).unbind('click');
         self.div.unbind('mouseenter mouseleave');
         self.uninstall(true, function() {
            removeInstalledPlugin(self.meta);
            new Plugin(self.meta);
            self.remove();
         });
      });
      if(self.toupdate) {
         self.div.find('.update').click(function() {
            $(this).unbind('click');
            self.div.unbind('mouseenter mouseleave');
            self.uninstall(false, function() {
               self.install(function() {
                  updateVersion(self.meta);
                  new Plugin(self.meta);
                  self.remove();
               });
            });
         });
      }
   } else {
      self.div.find('.pdl').click(function() {
         $(this).unbind('click');
         self.div.unbind('mouseenter mouseleave');
         self.install(function() {
            installed_plugins.push(self.meta);
            new Plugin(self.meta);
            self.remove();
         });
      });
   }

   self.uninstall = function(remove_options, cb) {
      self.descr.html('<h2>'+t('rm_plug')+'</h2>').stop().css('opacity', '1');
      var batch = new Batch(ParallelBatch);
      batch.get({action:'plugins.rm_plugin', remove_options:remove_options, plugin:self.meta.name}, function(json) {
         if(json.success === true) {
            inform('plug_info', 'success', true, t('plug_rm')); 
            if(cb) cb();
         } else {
            self.descr.html('<h2>'+t('err_plug')+'<h2>');
         }
      });
      batch.launch();
   };

   self.install = function(cb) {
      self.descr.html('<h2>'+t('dl_plug')+'</h2>').stop().css('opacity', '1');
      var batch = new Batch(ParallelBatch);
      batch.get({action:'plugins.install_plugin', plugin:self.meta.name}, function(json) {
         if(json.success === true) {
            if(self.meta.noconf)
               inform('plug_info', 'success', true, t('plug_installed_noconf')); 
            else
               inform('plug_info', 'success', true, t('plug_installed_conf')); 
            if(cb) cb();
         } else {
            self.descr.html('<h2>'+t('err_plug')+'<h2>');
         }
      });
      batch.launch();
   };

   self.remove = function() {
      self.div.remove();
   };
}

function getInstalledPlugins(cb) {
   if(installed_plugins || !cb)
      return installed_plugins;

   var batch = new Batch(ParallelBatch);
   batch.get({action:'plugins.get_plugins'}, function(json) {
      installed_plugins = json;
      cb();
   });
   batch.launch();
}

function removeInstalledPlugin(meta) {
   var index = -1;
   var installed = getInstalledPlugins();
   for(p in installed) {
      if(installed[p].name == meta.name) {
         index = p;
         break;
      }
   }
   if(index == -1)
      return false;
   installed.splice(index, 1);
   return true;
}

function isInstalled(meta) {
   var installed = getInstalledPlugins();
   for(p in installed) {
      if(installed[p].name == meta.name) {
         return true;
      }
   }
   return false;
}

function updateVersion(meta) {
   var installed = getInstalledPlugins();
   for(p in installed) {
      if(installed[p].name == meta.name) {
         installed[p].version = meta.version;
         return true;
      }
   }
   return false;
}

function getVersion(meta) {
   var installed = getInstalledPlugins();
   for(p in installed) {
      if(installed[p].name == meta.name) {
         return installed[p].version;
      }
   }
}

function getAvailablePlugins() {
   var url = $('#pluginsurl').text() + 'PLUGINS';
   get_json(url, function(data) {
      $('#plugins_loading').css('display', 'none');
      $('#plugins_container').css('display', 'block');
      if(!data || !Array.isArray(data))
         return;

      for(var p in data) {
         new Plugin(data[p]);
      }
   });
}

$(document).ready(function() {
   plug_lang = $('#pluginslang').text();
   getInstalledPlugins(getAvailablePlugins); 
});
