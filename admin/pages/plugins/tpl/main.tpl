<div id="pluginsurl" style="display:none">{$PLUGURL}</div>
<div id="pluginslang" style="display:none">{$PLUGLANG}</div>
<div style="width:100%;position:relative;margin-top:10px;">
   <div id="plugins_loading" class="translate title_plug" style="display:block">load_plug</div>
   <div id="plugins_container" style="display:none">
      <div class="translate title_plug">avail_plug</div>
      <ul id="available_plugins" class="plugins">
      </ul>

      <div class="translate title_plug">installed_plug</div>
      <ul id="installed_plugins" class="plugins">
      </ul>

      <div class="translate title_plug">create_plug</div>
   </div>
</div>

<script id="pluginNewTpl" type="text/x-jquery-tmpl">
   <li id="plug_${id}"><span class="img"><img src="${meta.thumb}" /></span><span class="descr"><h2>${meta.title}</h2><p>${meta.descr}</p></span><div class="meta"><span class="icon"></span><span class="name">${meta.title}</span><span class="pdl">DL</span></div></li>
</script>
<script id="pluginInstalledTpl" type="text/x-jquery-tmpl">
   <li id="plug_${id}">{{if toupdate}}<div style="position:absolute;left:35px;top:-12px;background-color:transparent;"><img src="./pages/plugins/css/warning-icon.png" style="width:230px;height:230px" /></div>{{/if}}<span class="img"><img src="${meta.thumb}" /></span><span class="descr"><h2>${meta.title}</h2><p>${meta.descr}</p><br/><i class="activate remove translate">remove_plug</i>{{if toupdate}}<br/><br/><i class="activate update translate">update_plug</i>{{/if}}</span><div class="meta"><span class="icon"></span><span class="namebig">${meta.title}</span></div></li>
</script>
