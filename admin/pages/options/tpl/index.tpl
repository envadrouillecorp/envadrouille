	<script type="text/javascript">
	var config = {
	  getThemes:function(name) {
		return {
		  {BALISE id=1}'{$NAME}':{BG:'{$BG}',FG:'{$FG}'},{/BALISE}
		};
	  },
	  getLang:function(name) {
		return [ {BALISE id=2}'{$LANG}',{/BALISE}];
	  },
     t:function(v) { return config.tr[v]?config.tr[v]:v; },
     plugins:[],
     pluginsInstances:[],
     contentPlugins:[],
     cacheDir:'{$cachedir}',
     picsDir:'{$picsdir}',
     loadedThemes:[],
     content_order:{$content_order},
	};
   {$TR}
   {BALISE id=3}config.{$PLUGIN_VAR} = '{$PLUGIN_VAL}';{/BALISE}
   {BALISE id=4}config.plugins.push('{$PLUGIN_URL}');
   $script('{$PLUGIN_URL}', '{$PLUGIN_URL}');{/BALISE}
   {BALISE id=5}{$PLUGIN_FUN}{/BALISE}
   </script>

