Index: /app/src/unraid-api/unraid-file-modifier/modifications/__fixtures__/DefaultPageLayout.php
===================================================================
--- /app/src/unraid-api/unraid-file-modifier/modifications/__fixtures__/DefaultPageLayout.php
+++ /app/src/unraid-api/unraid-file-modifier/modifications/__fixtures__/DefaultPageLayout.php
@@ -557,14 +557,5 @@
   $.post('/webGui/include/Notify.php',{cmd:'get',csrf_token:csrf_token},function(msg) {
     $.each($.parseJSON(msg), function(i, notify){
-      $.jGrowl(notify.subject+'<br>'+notify.description,{
-        group: notify.importance,
-        header: notify.event+': '+notify.timestamp,
-        theme: notify.file,
-        sticky: true,
-        beforeOpen: function(e,m,o){if ($('div.jGrowl-notification').hasClass(notify.file)) return(false);},
-        afterOpen: function(e,m,o){if (notify.link) $(e).css('cursor','pointer');},
-        click: function(e,m,o){if (notify.link) location.replace(notify.link);},
-        close: function(e,m,o){$.post('/webGui/include/Notify.php',{cmd:'archive',file:notify.file,csrf_token:csrf_token});}
-      });
+      
     });
   });
@@ -680,6 +671,6 @@
 }
 
-echo "<div class='nav-user show'><a id='board' href='#' class='hand'><b id='bell' class='icon-u-bell system'></b></a></div>";
 
+
 if ($themes2) echo "</div>";
 echo "</div></div>";
@@ -886,20 +877,12 @@
 <?if ($notify['display']==0):?>
       if (notify.show) {
-        $.jGrowl(notify.subject+'<br>'+notify.description,{
-          group: notify.importance,
-          header: notify.event+': '+notify.timestamp,
-          theme: notify.file,
-          beforeOpen: function(e,m,o){if ($('div.jGrowl-notification').hasClass(notify.file)) return(false);},
-          afterOpen: function(e,m,o){if (notify.link) $(e).css('cursor','pointer');},
-          click: function(e,m,o){if (notify.link) location.replace(notify.link);},
-          close: function(e,m,o){$.post('/webGui/include/Notify.php',{cmd:'hide',file:"<?=$notify['path'].'/unread/'?>"+notify.file,csrf_token:csrf_token}<?if ($notify['life']==0):?>,function(){$.post('/webGui/include/Notify.php',{cmd:'archive',file:notify.file,csrf_token:csrf_token});}<?endif;?>);}
-        });
+        
       }
 <?endif;?>
     });
-    $('#bell').removeClass('red-orb yellow-orb green-orb').prop('title',"<?=_('Alerts')?> ["+bell1+']\n'+"<?=_('Warnings')?> ["+bell2+']\n'+"<?=_('Notices')?> ["+bell3+']');
-    if (bell1) $('#bell').addClass('red-orb'); else
-    if (bell2) $('#bell').addClass('yellow-orb'); else
-    if (bell3) $('#bell').addClass('green-orb');
+
+
+
+
     break;
   }
@@ -1204,4 +1187,5 @@
 });
 </script>
+<unraid-toaster rich-colors close-button position="<?= ($notify['position'] === 'center') ? 'top-center' : $notify['position'] ?>"></unraid-toaster>
 </body>
 </html>
