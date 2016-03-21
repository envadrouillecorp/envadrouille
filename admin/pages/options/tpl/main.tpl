<div id="changed" style="width:1051px;display:{$DISPLAY_CHANGED}" class="success translate">opt_change_success</div>
<div id="update" style="width:1051px;display:{$DISPLAY_UPDATE}" class="warning translate">opt_change_required</div>
<div id="fail" style="width:1051px;display:{$DISPLAY_FAIL}" class="error translate">opt_change_fail</div>
<div id="fail2" style="width:1051px;display:{$DISPLAY_FAIL2}" class="error translate">opt_change_fail2</div>

<form class="cmxform" id="commentForm" method="post" action="index.php?action=options.change" style="margin-top:15px;background-color:#EAEAD7;padding:10px;border:1px solid #CCCCCC">
	{BALISE id=2}
	{$HEAD}
   <div class="inp">
      <table>
         <tr style="display:{$DISPLAY}">
            <td valign="middle">
               <label for="{$DESCR}" style="width:220px;display:inline-block;text-align:right;font-weight:bold;" class="translate">{$DESCR}</label>
               </td><td valign="middle">
                  {$INPUT}
               </td><td valign="middle">
               <span id="{$DESCR}_err" style="paddin-left:5px;color:red"></span>
               </td>
         </tr>
      </table>
	</div>
   {/BALISE}
   <input type="hidden"  name="random_sid"  value="{$RANDOM_SID}">
   <input class="submit translate" type="submit" value="Submit" style="position:relative;left:1013px" />
 </form>


