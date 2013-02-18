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
     cacheDir:'{$cachedir}',
     picsDir:'{$picsdir}',
	};
   {$TR}
   {BALISE id=3}
   config.plugins.push('{$PLUGIN_URL}');
   $script('{$PLUGIN_URL}', '{$PLUGIN_URL}');
   {/BALISE}
   </script>

