<!DOCTYPE HTML>
<html>
	<head>
		<meta http-equiv="content-Type" content="text/html; charset=UTF-8" />
      <title>Admin</title>

      <script type="text/javascript">
      var random_sid = '{$RANDOM_SID}';
      var max_parallel_jobs = {$max_parallel_jobs};
      var plugins = [];
      var config = { VERSION:{$VERSION} };
      </script>

		<script type="text/javascript" src="common/scripts/jquery.min.js?{$VERSION}"></script>
		<script type="text/javascript" src="common/scripts/jquery.tmpl.js?{$VERSION}"></script>
      <script type="text/javascript" src="common/scripts/utils.js"></script>

      <script type="text/javascript" src="common/scripts/lang/{$lang}.js?{$VERSION}"></script>
      <script type="text/javascript" src="common/scripts/lang/common.js?{$VERSION}"></script>
      <script type="text/javascript" src="pages/{$page}/scripts/main.js?{$VERSION}"></script>
      <script type="text/javascript" src="pages/{$page}/scripts/lang/{$lang}.js?{$VERSION}"></script>
      {SCRIPT id=1}
      <script type="text/javascript" src="{$js_url}?{$VERSION}"></script>
      {/SCRIPT}
      {SCRIPT id=2}
      <script type="text/javascript" src="{$js_url}"></script>
      {/SCRIPT}

		<link media="all" type="text/css" href="common/css/utils.css?{$VERSION}" rel="stylesheet">
      <link media="all" type="text/css" href="pages/{$page}/css/main.css?{$VERSION}" rel="stylesheet">
      <script type="text/javascript">
		$(document).ready(function() {
			var __saved_current = $('#head #current').html();
			$('#head #menu').find('img').hover(function()  {
				var img = $(this);
            $('#head #current').stop().animate({opacity:0}, "fast", function() {
					$('#head #current').html((img.attr('alt'))).stop().animate({opacity:1}, "fast");
				});
			}, function() {
				var img = $(this);
				$('#head #current').stop().animate({opacity:0}, "fast", function() {
					$('#head #current').html(__saved_current).stop().animate({opacity:1}, "fast");
				});
			});
			$('#head #current').css('position', 'absolute').css('left', ($('#head #menu').find('img').length*39)+'px');


         var __notifications = {$notifications};
         $.each(__notifications, function(id, val) {
            inform(val.msg, val.level, true, val.arg);
         });

         $("#admin_content").css('display', '');
		});
		</script>
	</head>
   <body>
		  <center id="admin_content" style="display:none">
			  <div id="head">
				  <ul id="menu" style="text-align:left">
	{BALISE id=1}
					  <li><a href="{$URL}"><img src="pages/{$NAME}/css/main_button.png" alt="{$DESCR}" /></a></li>
	{/BALISE}
				  </ul>
              <div id="current" class="" style="text-indent:20px">{$CURRENT}</div>
              <div id="logout"><a href="index.php?action=login.logout"><img src="common/css/logout.png" alt="logout" /></a></div>
			  </div>
			  <div id="info" style="text-align:left"></div>
			  <div id="main_div" style="text-align:left">{$content}</div>
		  </center>
   </body>
</html>
