<!DOCTYPE HTML>
<html>
	<head>
		<meta http-equiv="content-Type" content="text/html; charset=windows-1252" />
		<title>Admin</title>
		<script type="text/javascript" src="common/scripts/jquery.min.js"></script>
		<script type="text/javascript" src="common/scripts/jquery.tmpl.js"></script>
      <script type="text/javascript" src="common/scripts/utils.js"></script>
		<script type="text/javascript" src="common/scripts/lang/{$lang}.js"></script>
      <script type="text/javascript" src="common/scripts/lang/common.js"></script>

      <script type="text/javascript" src="pages/update/scripts/codemirror.js"></script>
		<script type="text/javascript" src="pages/update/scripts/clike.js"></script>
		<script type="text/javascript" src="pages/update/scripts/xml.js"></script>
		<script type="text/javascript" src="pages/update/scripts/css.js"></script>
		<script type="text/javascript" src="pages/update/scripts/javascript.js"></script>
		<script type="text/javascript" src="pages/update/scripts/htmlmixed.js"></script>
		<script type="text/javascript" src="pages/update/scripts/php.js"></script>

      <script type="text/javascript" src="pages/update/scripts/main.js"></script>
      <script type="text/javascript">
         var random_sid = '{$RANDOM_SID}';
      </script>

		<link media="all" type="text/css" href="common/css/utils.css" rel="stylesheet">
		<link media="all" type="text/css" href="pages/update/css/codemirror.css" rel="stylesheet">
   </head>
	<body>
		<center>
			<div id="info" style="text-align:left"></div>
			<div style="margin-top:45px;background-color:#EAEAD7;padding:10px;border:1px solid #CCCCCC;width:400px;font-family:Tahoma,Geneva,sans-serif;color:#555;text-align:left">
				<div>Please wait while the gallery is updating...</div>
				<div id="step1" style="color:#888">1. Downloading patch (this might take a while)</div>
				<div id="step2" style="color:#888">2. Applying patches</div>
				<div id="step3" style="color:#888">3. Replacing files</div>
			</div>
			<div id="editorstip" style="display:none;margin-top:10px;margin-bottom:10px;width:100%; text-align:left; color:#555;font-family:Tahoma,Geneva,sans-serif;font-size:12px;border:1px solid #CCCCCC;">The gallery cannot automatically update the following files. Please update them by hand and submit the changes. Tip: search for '&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;'. You will find lines such as:<br/>
&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br/>
<i>The new code of the gallery.</i><br/>
=========<br/>
<i>The code you changed by hand.</i><br/>
&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;<br/>
When not sure, use the "new code of the gallery" version.
         </div>
			<div id="editors" style="text-align:left"></div>
         <div id="changelog" style="margin-top:45px;background-color:#EAEAD7;padding:10px;border:1px solid #CCCCCC;width:900px;font-family:Tahoma,Geneva,sans-serif;color:#555;text-align:left;display:none"></div>
		</center>
	</body>
</html>
