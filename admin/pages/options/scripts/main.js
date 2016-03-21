$(document).ready(function(){
   $('[type=password]').attr('autocomplete', 'off');
   $('[type=password]').each(function(id, field) {
      var name = $(field).attr('name');
      var val = $(field).val();
      var div = $(field).parent();
      if(val == '')
         return;
      div.html('<a id="clik_modify_passwd'+id+'" class="passwd">'+t('clik_modify_passwd')+'</a><input type="hidden" name="'+name+'" value="'+val+'" />');
      div.find('a').click(function() {
         div.html('<input type="password" name="'+name+'" value="'+val+'" />');
      });
   });
});
