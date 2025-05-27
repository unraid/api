<?php
/* Copyright 2005-2024, Lime Technology
 * Copyright 2012-2024, Bergware International.
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License version 2,
 * as published by the Free Software Foundation.
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 */
?>
<?php
require_once "$docroot/plugins/dynamix/include/ThemeHelper.php";
$themeHelper = new ThemeHelper($display['theme'], $display['width']);
$theme   = $themeHelper->getThemeName(); // keep $theme, $themes1, $themes2 vars for plugin backwards compatibility for the time being
$themes1 = $themeHelper->isTopNavTheme();
$themes2 = $themeHelper->isSidebarTheme();
$themeHelper->updateDockerLogColor($docroot);

$display['font'] = filter_var($_COOKIE['fontSize'] ?? $display['font'] ?? '', FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);

$header  = $display['header']; // keep $header, $backgnd vars for plugin backwards compatibility for the time being
$backgnd = $display['background'];

$config  = "/boot/config";
$entity  = $notify['entity'] & 1 == 1;
$alerts  = '/tmp/plugins/my_alerts.txt';
$wlan0   = file_exists('/sys/class/net/wlan0');

$safemode = _var($var,'safeMode')=='yes';
$banner = "$config/webGui/banner.png";

$notes = '/var/tmp/unRAIDServer.txt';
if (!file_exists($notes)) {
    file_put_contents($notes, shell_exec("$docroot/plugins/dynamix.plugin.manager/scripts/plugin changes $docroot/plugins/unRAIDServer/unRAIDServer.plg"));
}

function resumeEvents(id,delay) {
  var startDelay = delay||50;
  $.each(timers, function(i,timer) {
    if (!id || i==id) timers[i] = setTimeout(i+'()', startDelay);
    startDelay += 50;
  });
}

function plus(value,single,plural,last) {
  return value>0 ? (value+' '+(value==1?single:plural)+(last?'':', ')) : '';
}

function updateTime() {
  var now = new Date();
  var days = parseInt(uptime/86400);
  var hour = parseInt(uptime/3600%24);
  var mins = parseInt(uptime/60%60);
  $('span.uptime').html(((days|hour|mins)?plus(days,"<?=_('day')?>","<?=_('days')?>",(hour|mins)==0)+plus(hour,"<?=_('hour')?>","<?=_('hours')?>",mins==0)+plus(mins,"<?=_('minute')?>","<?=_('minutes')?>",true):"<?=_('less than a minute')?>"));
  uptime += Math.round((now.getTime() - before.getTime())/1000);
  before = now;
  if (expiretime > 0) {
    var remainingtime = expiretime - now.getTime()/1000;
    if (remainingtime > 0) {
      days = parseInt(remainingtime/86400);
      hour = parseInt(remainingtime/3600%24);
      mins = parseInt(remainingtime/60%60);
      if (days) {
        $('#licenseexpire').html(plus(days,"<?=_('day')?>","<?=_('days')?>",true)+" <?=_('remaining')?>");
      } else if (hour) {
        $('#licenseexpire').html(plus(hour,"<?=_('hour')?>","<?=_('hours')?>",true)+" <?=_('remaining')?>").addClass('orange-text');
      } else if (mins) {
        $('#licenseexpire').html(plus(mins,"<?=_('minute')?>","<?=_('minutes')?>",true)+" <?=_('remaining')?>").addClass('red-text');
      } else {
        $('#licenseexpire').html("<?=_('less than a minute remaining')?>").addClass('red-text');
      }
    } else {
      $('#licenseexpire').addClass('red-text');
    }
  }
  setTimeout(updateTime,1000);
}

function refresh(top) {
  if (typeof top === 'undefined') {
    for (var i=0,element; element=document.querySelectorAll('input,button,select')[i]; i++) {element.disabled = true;}
    for (var i=0,link; link=document.getElementsByTagName('a')[i]; i++) { link.style.color = "gray"; } //fake disable
    location.reload();
  } else {
    $.cookie('top',top);
    location.reload();
  }
}

function initab(page) {
  $.removeCookie('one');
  $.removeCookie('tab');
  if (page != null) location.replace(page);
}

function settab(tab) {
<?switch ($myPage['name']):?>
<?case'Main':?>
  $.cookie('tab',tab);
<?if (_var($var,'fsState')=='Started'):?>
  $.cookie('one','tab1');
<?endif;?>
<?break;?>
<?case'Cache':case'Data':case'Device':case'Flash':case'Parity':?>
  $.cookie('one',tab);
<?break;?>
<?default:?>
  $.cookie('one',tab);
<?endswitch;?>
}

function done(key) {
  var url = location.pathname.split('/');
  var path = '/'+url[1];
  if (key) for (var i=2; i<url.length; i++) if (url[i]==key) break; else path += '/'+url[i];
  $.removeCookie('one');
  location.replace(path);
}

function chkDelete(form, button) {
  button.value = form.confirmDelete.checked ? "<?=_('Delete')?>" : "<?=_('Apply')?>";
  button.disabled = false;
}

function makeWindow(name,height,width) {
  var top = (screen.height-height)/2;
  if (top < 0) {top = 0; height = screen.availHeight;}
  var left = (screen.width-width)/2;
  if (left < 0) {left = 0; width = screen.availWidth;}
  return window.open('',name,'resizeable=yes,scrollbars=yes,height='+height+',width='+width+',top='+top+',left='+left);
}

function openBox(cmd,title,height,width,load,func,id) {
  // open shadowbox window (run in foreground)
  // included for legacy purposes, replaced by openPlugin
  var uri = cmd.split('?');
  var run = uri[0].substr(-4)=='.php' ? cmd+(uri[1]?'&':'?')+'done=<?=urlencode(_("Done"))?>' : '/logging.htm?cmd='+cmd+'&csrf_token='+csrf_token+'&done=<?=urlencode(_("Done"))?>';
  var options = load ? (func ? {modal:true,onClose:function(){setTimeout(func+'('+'"'+(id||'')+'")');}} : {modal:true,onClose:function(){location.reload();}}) : {modal:false};
  Shadowbox.open({content:run, player:'iframe', title:title, height:Math.min(screen.availHeight,800), width:Math.min(screen.availWidth,1200), options:options});
}

function openWindow(cmd,title,height,width) {
  // open regular window (run in background)
  // included for legacy purposes, replaced by openTerminal
  var window_name = title.replace(/ /g,"_");
  var form_html = '<form action="/logging.htm" method="post" target="'+window_name+'">'+'<input type="hidden" name="csrf_token" value="'+csrf_token+'">'+'<input type="hidden" name="title" value="'+title+'">';
  var vars = cmd.split('&');
  form_html += '<input type="hidden" name="cmd" value="'+vars[0]+'">';
  for (var i = 1; i < vars.length; i++) {
    var pair = vars[i].split('=');
    form_html += '<input type="hidden" name="'+pair[0]+'" value="'+pair[1]+'">';
  }
  form_html += '</form>';
  var form = $(form_html);
  $('body').append(form);
  makeWindow(window_name,height,width);
  form.submit();
}

function openTerminal(tag,name,more) {
  if (/MSIE|Edge/.test(navigator.userAgent)) {
    swal({title:"_(Unsupported Feature)_",text:"_(Sorry, this feature is not supported by MSIE/Edge)_.<br>_(Please try a different browser)_",type:'error',html:true,animation:'none',confirmButtonText:"_(Ok)_"});
    return;
  }
  // open terminal window (run in background)
  name = name.replace(/[ #]/g,"_");
  tty_window = makeWindow(name+(more=='.log'?more:''),Math.min(screen.availHeight,800),Math.min(screen.availWidth,1200));
  var socket = ['ttyd','syslog'].includes(tag) ? '/webterminal/'+tag+'/' : '/logterminal/'+name+(more=='.log'?more:'')+'/';
  $.get('/webGui/include/OpenTerminal.php',{tag:tag,name:name,more:more},function(){setTimeout(function(){tty_window.location=socket; tty_window.focus();},200);});
}

function bannerAlert(text,cmd,plg,func,start) {
  $.post('/webGui/include/StartCommand.php',{cmd:cmd,pid:1},function(pid) {
    if (pid == 0) {
      if ($(".upgrade_notice").hasClass('done') || timers.bannerAlert == null) {
        forcedBanner = false;
        if ($.cookie('addAlert') != null) {
          removeBannerWarning($.cookie('addAlert'));
          $.removeCookie('addAlert');
        }
        $(".upgrade_notice").removeClass('alert done');
        timers.callback = null;
        if (plg != null) {
          if ($.cookie('addAlert-page') == null || $.cookie('addAlert-page') == '<?=$task?>') {
            setTimeout((func||'loadlist')+'("'+plg+'")',250);
          } else if ('Plugins' == '<?=$task?>') {
            setTimeout(refresh);
          }
        }
        $.removeCookie('addAlert-page');
      } else {
        $(".upgrade_notice").removeClass('alert').addClass('done');
        timers.bannerAlert = null;
        setTimeout(function(){bannerAlert(text,cmd,plg,func,start);},1000);
      }
    } else {
      $.cookie('addAlert',addBannerWarning(text,true,true,true));
      $.cookie('addAlert-text',text);
      $.cookie('addAlert-cmd',cmd);
      $.cookie('addAlert-plg',plg);
      $.cookie('addAlert-func',func);
      if ($.cookie('addAlert-page') == null) $.cookie('addAlert-page','<?=$task?>');
      timers.bannerAlert = setTimeout(function(){bannerAlert(text,cmd,plg,func,start);},1000);
      if (start==1 && timers.callback==null && plg!=null) timers.callback = setTimeout((func||'loadlist')+'("'+plg+'")',250);
    }
  });
}

function openPlugin(cmd,title,plg,func,start=0,button=0) {
  // start  = 0 : run command only when not already running (default)
  // start  = 1 : run command unconditionally
  // button = 0 : show CLOSE button (default)
  // button = 1 : hide CLOSE button
  nchan_plugins.start();
  $.post('/webGui/include/StartCommand.php',{cmd:cmd+' nchan',start:start},function(pid) {
    if (pid==0) {
      nchan_plugins.stop();
      $('div.spinner.fixed').hide();
      $(".upgrade_notice").addClass('alert');
      return;
    }
    swal({title:title,text:"<pre id='swaltext'></pre><hr>",html:true,animation:'none',showConfirmButton:button==0,confirmButtonText:"<?=_('Close')?>"},function(close){
      nchan_plugins.stop();
      $('div.spinner.fixed').hide();
      $('.sweet-alert').hide('fast').removeClass('nchan');
      setTimeout(function(){bannerAlert("<?=_('Attention - operation continues in background')?> ["+pid.toString().padStart(8,'0')+"]<i class='fa fa-bomb fa-fw abortOps' title=\"<?=_('Abort background process')?>\" onclick='abortOperation("+pid+")'></i>",cmd,plg,func,start);});
    });
    $('.sweet-alert').addClass('nchan');
    $('button.confirm').prop('disabled',button!=0);
  });
}

function openDocker(cmd,title,plg,func,start=0,button=0) {
  // start  = 0 : run command only when not already running (default)
  // start  = 1 : run command unconditionally
  // button = 0 : hide CLOSE button (default)
  // button = 1 : show CLOSE button
  nchan_docker.start();
  $.post('/webGui/include/StartCommand.php',{cmd:cmd,start:start},function(pid) {
    if (pid==0) {
      nchan_docker.stop();
      $('div.spinner.fixed').hide();
      $(".upgrade_notice").addClass('alert');
      return;
    }
    swal({title:title,text:"<pre id='swaltext'></pre><hr>",html:true,animation:'none',showConfirmButton:button!=0,confirmButtonText:"<?=_('Close')?>"},function(close){
      nchan_docker.stop();
      $('div.spinner.fixed').hide();
      $('.sweet-alert').hide('fast').removeClass('nchan');
      setTimeout(function(){bannerAlert("<?=_('Attention - operation continues in background')?> ["+pid.toString().padStart(8,'0')+"]<i class='fa fa-bomb fa-fw abortOps' title=\"<?=_('Abort background process')?>\" onclick='abortOperation("+pid+")'></i>",cmd,plg,func,start);});
    });
    $('.sweet-alert').addClass('nchan');
    $('button.confirm').prop('disabled',button==0);
  });
}

function openVMAction(cmd,title,plg,func,start=0,button=0) {
  // start  = 0 : run command only when not already running (default)
  // start  = 1 : run command unconditionally
  // button = 0 : hide CLOSE button (default)
  // button = 1 : show CLOSE button
  nchan_vmaction.start();
  $.post('/webGui/include/StartCommand.php',{cmd:cmd,start:start},function(pid) {
    if (pid==0) {
      nchan_vmaction.stop();
      $('div.spinner.fixed').hide();
      $(".upgrade_notice").addClass('alert');
      return;
    }
    swal({title:title,text:"<pre id='swaltext'></pre><hr>",html:true,animation:'none',showConfirmButton:button!=0,confirmButtonText:"<?=_('Close')?>"},function(close){
      nchan_vmaction.stop();
      $('div.spinner.fixed').hide();
      $('.sweet-alert').hide('fast').removeClass('nchan');
      setTimeout(function(){bannerAlert("<?=_('Attention - operation continues in background')?> ["+pid.toString().padStart(8,'0')+"]<i class='fa fa-bomb fa-fw abortOps' title=\"<?=_('Abort background process')?>\" onclick='abortOperation("+pid+")'></i>",cmd,plg,func,start);});
    });
    $('.sweet-alert').addClass('nchan');
    $('button.confirm').prop('disabled',button==0);
  });
}

function abortOperation(pid) {
  swal({title:"<?=_('Abort background operation')?>",text:"<?=_('This may leave an unknown state')?>",html:true,animation:'none',type:'warning',showCancelButton:true,confirmButtonText:"<?=_('Proceed')?>",cancelButtonText:"<?=_('Cancel')?>"},function(){
    $.post('/webGui/include/StartCommand.php',{kill:pid},function() {
      clearTimeout(timers.bannerAlert);
      timers.bannerAlert = null;
      timers.callback = null;
      forcedBanner = false;
      removeBannerWarning($.cookie('addAlert'));
      $.removeCookie('addAlert');
      $(".upgrade_notice").removeClass('alert done').hide();
    });
  });
}

function openChanges(cmd,title,nchan,button=0) {
  $('div.spinner.fixed').show();
  // button = 0 : hide CLOSE button (default)
  // button = 1 : show CLOSE button
  // nchan argument is not used, exists for backward compatibility
  $.post('/webGui/include/StartCommand.php',{cmd:cmd,start:2},function(data) {
    $('div.spinner.fixed').hide();
    swal({title:title,text:"<pre id='swalbody'></pre><hr>",html:true,animation:'none',showConfirmButton:button!=0,confirmButtonText:"<?=_('Close')?>"},function(close){
      $('.sweet-alert').hide('fast').removeClass('nchan');
      if ($('#submit_button').length > 0) $('#submit_button').remove();
    });
    $('.sweet-alert').addClass('nchan');
    $('pre#swalbody').html(data);
    $('button.confirm').text("<?=_('Done')?>").prop('disabled',false).show();
  });
}

function openAlert(cmd,title,func) {
  $.post('/webGui/include/StartCommand.php',{cmd:cmd,start:2},function(data) {
    $('div.spinner.fixed').hide();
    swal({title:title,text:"<pre id='swalbody'></pre><hr>",html:true,animation:'none',showCancelButton:true,closeOnConfirm:false,confirmButtonText:"<?=_('Proceed')?>",cancelButtonText:"<?=_('Cancel')?>"},function(proceed){
      if (proceed) setTimeout(func+'()');
    });
    $('.sweet-alert').addClass('nchan');
    $('pre#swalbody').html(data);
  });
}

function openDone(data) {
  if (data == '_DONE_') {
    $('div.spinner.fixed').hide();
    $('button.confirm').text("<?=_('Done')?>").prop('disabled',false).show();
    if (typeof ca_done_override !== 'undefined') {
      if (ca_done_override == true) {
        $("button.confirm").trigger("click");
        ca_done_override = false;
      }
    }
    return true;
  }
  return false;
}

function openError(data) {
  if (data == '_ERROR_') {
    $('div.spinner.fixed').hide();
    $('button.confirm').text("<?=_('Error')?>").prop('disabled',false).show();
    return true;
  }
  return false;
}

function showStatus(name,plugin,job) {
  $.post('/webGui/include/ProcessStatus.php',{name:name,plugin:plugin,job:job},function(status){$(".tabs").append(status);});
}

function showFooter(data, id) {
  if (id !== undefined) $('#'+id).remove();
  $('#copyright').prepend(data);
}

function showNotice(data) {
  $('#user-notice').html(data.replace(/<a>(.*)<\/a>/,"<a href='/Plugins'>$1</a>"));
}

function escapeQuotes(form) {
  $(form).find('input[type=text]').each(function(){$(this).val($(this).val().replace(/"/g,'\\"'));});
}

// Banner warning system
var bannerWarnings = [];
var currentBannerWarning = 0;
var osUpgradeWarning = false;
var forcedBanner = false;

function addBannerWarning(text, warning=true, noDismiss=false, forced=false) {
  var cookieText = text.replace(/[^a-z0-9]/gi,'');
  if ($.cookie(cookieText) == "true") return false;
  if (warning) text = "<i class='fa fa-warning fa-fw' style='float:initial'></i> "+text;
  if (bannerWarnings.indexOf(text) < 0) {
    if (forced) {
      var arrayEntry = 0; bannerWarnings = []; clearTimeout(timers.bannerWarning); timers.bannerWarning = null; forcedBanner = true;
    } else {
      var arrayEntry = bannerWarnings.push("placeholder") - 1;
    }
    if (!noDismiss) text += "<a class='bannerDismiss' onclick='dismissBannerWarning("+arrayEntry+",&quot;"+cookieText+"&quot;)'></a>";
    bannerWarnings[arrayEntry] = text;
  } else {
    return bannerWarnings.indexOf(text);
  }
  if (timers.bannerWarning==null) showBannerWarnings();
  return arrayEntry;
}

function dismissBannerWarning(entry,cookieText) {
  $.cookie(cookieText,"true",{expires:30}); // reset after 1 month
  removeBannerWarning(entry);
}

function removeBannerWarning(entry) {
  if (forcedBanner) return;
  bannerWarnings[entry] = false;
  clearTimeout(timers.bannerWarning);
  showBannerWarnings();
}

function bannerFilterArray(array) {
  var newArray = [];
  array.filter(function(value,index,arr) {
    if (value) newArray.push(value);
  });
  return newArray;
}

function showBannerWarnings() {
  var allWarnings = bannerFilterArray(Object.values(bannerWarnings));
  if (allWarnings.length == 0) {
    $(".upgrade_notice").hide();
    timers.bannerWarning = null;
    return;
  }
  if (currentBannerWarning >= allWarnings.length) currentBannerWarning = 0;
  $(".upgrade_notice").show().html(allWarnings[currentBannerWarning]);
  currentBannerWarning++;
  timers.bannerWarning = setTimeout(showBannerWarnings,3000);
}

function addRebootNotice(message="<?=_('You must reboot for changes to take effect')?>") {
  addBannerWarning("<i class='fa fa-warning' style='float:initial;'></i> "+message,false,true);
  $.post("/plugins/dynamix.plugin.manager/scripts/PluginAPI.php",{action:'addRebootNotice',message:message});
}

function removeRebootNotice(message="<?=_('You must reboot for changes to take effect')?>") {
  var bannerIndex = bannerWarnings.indexOf("<i class='fa fa-warning' style='float:initial;'></i> "+message);
  if (bannerIndex < 0) return;
  removeBannerWarning(bannerIndex);
  $.post("/plugins/dynamix.plugin.manager/scripts/PluginAPI.php",{action:'removeRebootNotice',message:message});
}

function showUpgradeChanges() { /** @note can likely be removed, not used in webgui or api repos */
  openChanges("showchanges /tmp/plugins/unRAIDServer.txt","<?=_('Release Notes')?>");
}

function showUpgrade(text,noDismiss=false) { /** @note can likely be removed, not used in webgui or api repos */
  if ($.cookie('os_upgrade')==null) {
    if (osUpgradeWarning) removeBannerWarning(osUpgradeWarning);
    osUpgradeWarning = addBannerWarning(text.replace(/<a>(.+?)<\/a>/,"<a href='#' onclick='openUpgrade()'>$1</a>").replace(/<b>(.*)<\/b>/,"<a href='#' onclick='document.rebootNow.submit()'>$1</a>"),false,noDismiss);
  }
}

function hideUpgrade(set) { /** @note can likely be removed, not used in webgui or api repos */
  removeBannerWarning(osUpgradeWarning);
  if (set)
    $.cookie('os_upgrade','true');
  else
    $.removeCookie('os_upgrade');
}

function confirmUpgrade(confirm) {
  if (confirm) {
    swal({title:"<?=_('Update')?> Unraid OS",text:"<?=_('Do you want to update to the new version')?>?",type:'warning',html:true,animation:'none',showCancelButton:true,closeOnConfirm:false,confirmButtonText:"<?=_('Proceed')?>",cancelButtonText:"<?=_('Cancel')?>"},function(){
      openPlugin("plugin update unRAIDServer.plg","<?=_('Update')?> Unraid OS");
    });
  } else {
    openPlugin("plugin update unRAIDServer.plg","<?=_('Update')?> Unraid OS");
  }
}

function openUpgrade() {
  hideUpgrade();
  $.get('/plugins/dynamix.plugin.manager/include/ShowPlugins.php',{cmd:'alert'},function(data) {
    if (data==0) {
      // no alert message - proceed with upgrade
      confirmUpgrade(true);
    } else {
      // show alert message and ask for confirmation
      openAlert("showchanges <?=$alerts?>","<?=_('Alert Message')?>",'confirmUpgrade');
    }
  });
}

function digits(number) {
  if (number < 10) return 'one';
  if (number < 100) return 'two';
  return 'three';
}

function openNotifier() {
  $.post('/webGui/include/Notify.php',{cmd:'get',csrf_token:csrf_token},function(msg) {
    $.each($.parseJSON(msg), function(i, notify){
      
    });
  });
}

function closeNotifier() {
  $.post('/webGui/include/Notify.php',{cmd:'get',csrf_token:csrf_token},function(msg) {
    $.each($.parseJSON(msg), function(i, notify){
      $.post('/webGui/include/Notify.php',{cmd:'archive',file:notify.file,csrf_token:csrf_token});
    });
    $('div.jGrowl').find('div.jGrowl-close').trigger('click');
  });
}

function viewHistory() {
  location.replace('/Tools/NotificationsArchive');
}

function flashReport() {
  $.post('/webGui/include/Report.php',{cmd:'config'},function(check){
    if (check>0) addBannerWarning("<?=_('Your flash drive is corrupted or offline').'. '._('Post your diagnostics in the forum for help').'.'?> <a target='_blank' href='https://docs.unraid.net/go/changing-the-flash-device/'><?=_('See also here')?></a>");
  });
}

$(function() {
  let tab;
<?switch ($myPage['name']):?>
<?case'Main':?>
  tab = $.cookie('tab')||'tab1';
<?break;?>
<?case'Cache':case'Data':case'Device':case'Flash':case'Parity':?>
  tab = $.cookie('one')||'tab1';
<?break;?>
<?default:?>
  tab = $.cookie('one')||'tab1';
<?endswitch;?>
  /* Check if the tab is 'tab0' */
  if (tab === 'tab0') {
    /* Set tab to the last available tab based on input[name$="tabs"] length */
    tab = 'tab' + $('input[name$="tabs"]').length;
  } else if ($('#' + tab).length === 0) {
    /* If the tab element does not exist, initialize a tab and set to 'tab1' */
    initab();
    tab = 'tab1';
  }
  $('#'+tab).attr('checked', true);
  updateTime();
  $.jGrowl.defaults.closeTemplate = '<i class="fa fa-close"></i>';
  $.jGrowl.defaults.closerTemplate = '<?=$notify['position'][0]=='b' ? '<div class="bottom">':'<div class="top">'?>[ <?=_("close all notifications")?> ]</div>';
  $.jGrowl.defaults.position = '<?=$notify['position']?>';
  $.jGrowl.defaults.theme = '';
  $.jGrowl.defaults.themeState = '';
  $.jGrowl.defaults.pool = 10;
<?if ($notify['life'] > 0):?>
  $.jGrowl.defaults.life = <?=$notify['life']*1000?>;
<?else:?>
  $.jGrowl.defaults.sticky = true;
<?endif;?>
  Shadowbox.setup('a.sb-enable', {modal:true});
// add any pre-existing reboot notices
  $.post('/webGui/include/Report.php',{cmd:'notice'},function(notices){
    notices = notices.split('\n');
    for (var i=0,notice; notice=notices[i]; i++) addBannerWarning("<i class='fa fa-warning' style='float:initial;'></i> "+notice,false,true);
  });
// check for flash offline / corrupted (delayed).
  timers.flashReport = setTimeout(flashReport,6000);
});

var mobiles=['ipad','iphone','ipod','android'];
var device=navigator.platform.toLowerCase();
for (var i=0,mobile; mobile=mobiles[i]; i++) {
  if (device.indexOf(mobile)>=0) {$('#footer').css('position','static'); break;}
}
$.ajaxPrefilter(function(s, orig, xhr){
  if (s.type.toLowerCase() == "post" && !s.crossDomain) {
    s.data = s.data || "";
    s.data += s.data?"&":"";
    s.data += "csrf_token="+csrf_token;
  }
});
</script>
<?include "$docroot/plugins/dynamix.my.servers/include/myservers1.php"?>
</head>
<body>
 <div id="displaybox">
  <div class="upgrade_notice" style="display:none"></div>
  <div id="header" class="<?=$display['banner']?>">
    <div class="logo">
      
      <unraid-i18n-host><unraid-header-os-version></unraid-header-os-version></unraid-i18n-host>
    </div>
    <?include "$docroot/plugins/dynamix.my.servers/include/myservers2.php"?>
  </div>
  <a href="#" class="move_to_end" title="<?=_('Move To End')?>"><i class="fa fa-arrow-circle-down"></i></a>
  <a href="#" class="back_to_top" title="<?=_('Back To Top')?>"><i class="fa fa-arrow-circle-up"></i></a>
<?
// Build page menus
echo "<div id='menu'>";
if ($themes2) echo "<div id='nav-block'>";
echo "<div class='nav-tile'>";
foreach ($tasks as $button) {
  $page = $button['name'];
  $play = $task==$page ? " active" : "";
  echo "<div class='nav-item{$play}'>";
  echo "<a href=\"/$page\" onclick=\"initab('/$page')\">"._(_var($button,'Name',$page))."</a></div>";
  // create list of nchan scripts to be started
  if (isset($button['Nchan'])) nchan_merge($button['root'], $button['Nchan']);
}
unset($tasks);
echo "</div>";
echo "<div class='nav-tile right'>";
if (isset($myPage['Lock'])) {
  $title = $themes2 ?  "" : _('Unlock sortable items');
  echo "<div class='nav-item LockButton util'><a href='#' class='hand' onclick='LockButton();return false;' title=\"$title\"><b class='icon-u-lock system green-text'></b><span>"._('Unlock sortable items')."</span></a></div>";
}
if ($display['usage']) my_usage();

foreach ($buttons as $button) {
  if (empty($button['Link'])) {
    $icon = $button['Icon'];
    if (substr($icon,-4)=='.png') {
      $icon = "<img src='/{$button['root']}/icons/$icon' class='system'>";
    } elseif (substr($icon,0,5)=='icon-') {
      $icon = "<b class='$icon system'></b>";
    } else {
      if (substr($icon,0,3)!='fa-') $icon = "fa-$icon";
      $icon = "<b class='fa $icon system'></b>";
    }
    $title = $themes2 ? "" : " title=\""._($button['Title'])."\"";
    echo "<div class='nav-item {$button['name']} util'><a href='"._var($button,'Href','#')."' onclick='{$button['name']}();return false;'{$title}>$icon<span>"._($button['Title'])."</span></a></div>";
  } else {
    echo "<div class='{$button['Link']}'></div>";
  }
  // create list of nchan scripts to be started
  if (isset($button['Nchan'])) nchan_merge($button['root'], $button['Nchan']);
}



if ($themes2) echo "</div>";
echo "</div></div>";
foreach ($buttons as $button) {
  annotate($button['file']);
  // include page specific stylesheets (if existing)
  $css = "/{$button['root']}/sheets/{$button['name']}";
  $css_stock = "$css.css";
  $css_theme = "$css-$theme.css";
  if (is_file($docroot.$css_stock)) echo '<link type="text/css" rel="stylesheet" href="',autov($css_stock),'">',"\n";
  if (is_file($docroot.$css_theme)) echo '<link type="text/css" rel="stylesheet" href="',autov($css_theme),'">',"\n";
  // create page content
  eval('?>'.parse_text($button['text']));
}
unset($buttons,$button);

// Build page content
// Reload page every X minutes during extended viewing?
if (isset($myPage['Load']) && $myPage['Load'] > 0) {
  ?>
    <script>
      function setTimerReload() {
        timers.reload = setInterval(function(){
          if (nchanPaused === false && ! dialogOpen() ) {
            location.reload();
          }
        },<?=$myPage['Load']*60000?>);
      }

      $(document).click(function(e) {
        clearInterval(timers.reload);
        setTimerReload();
      });

      function dialogOpen() {
          return ($('.sweet-alert').is(':visible') || $('.swal-overlay--show-modal').is(':visible') );
      }
      setTimerReload();

    </script>
  <?    
}  
echo "<div class='tabs'>";
$tab = 1;
$pages = [];
if (!empty($myPage['text'])) $pages[$myPage['name']] = $myPage;
if (_var($myPage,'Type')=='xmenu') $pages = array_merge($pages, find_pages($myPage['name']));

// nchan related actions
$nchan = ['webGui/nchan/notify_poller','webGui/nchan/session_check'];
if ($wlan0) $nchan[] = 'webGui/nchan/wlan0';
// build nchan scripts from found pages
$allPages = array_merge($taskPages, $buttonPages, $pages);
foreach ($allPages as $page) {
  if (isset($page['Nchan'])) nchan_merge($page['root'], $page['Nchan']);
}
// act on nchan scripts
if (count($pages)) {
  $running = file_exists($nchan_pid) ? file($nchan_pid,FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES) : [];
  $start   = array_diff($nchan, $running);  // returns any new scripts to be started
  $stop    = array_diff($running, $nchan);  // returns any old scripts to be stopped
  $running = array_merge($start, $running); // update list of current running nchan scripts
  // start nchan scripts which are new
  foreach ($start as $row) {
    $script = explode(':',$row)[0];
    exec("$docroot/$script &>/dev/null &");
  }
  // stop nchan scripts with the :stop option
  foreach ($stop as $row) {
    [$script,$opt] = my_explode(':',$row);
    if ($opt == 'stop') {
      exec("pkill -f $docroot/$script &>/dev/null &");
      array_splice($running,array_search($row,$running),1);
    }
  }
  if (count($running)) file_put_contents($nchan_pid,implode("\n",$running)."\n"); else @unlink($nchan_pid);
}

function is_localhost() {
  // Use the peer IP, not the Host header which can be spoofed
  return $_SERVER['REMOTE_ADDR'] === '127.0.0.1' || $_SERVER['REMOTE_ADDR'] === '::1';
}
function is_good_session() {
  return isset($_SESSION) && isset($_SESSION['unraid_user']) && isset($_SESSION['unraid_login']);
}
if (is_localhost() && !is_good_session()) {
  if (session_status() === PHP_SESSION_ACTIVE) {
    session_destroy();
  }
  session_start();
  $_SESSION['unraid_login'] = time();
  $_SESSION['unraid_user'] = 'root';
  session_write_close();
  my_logger("Unraid GUI-boot: created root session for localhost request.");
}
?>
<!DOCTYPE html>
<html <?=$display['rtl']?>lang="<?=strtok($locale, '_') ?: 'en'?>" class="<?= $themeHelper->getThemeHtmlClass() ?>">
<head>
<title><?=_var($var, 'NAME')?>/<?=_var($myPage, 'name')?></title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta http-equiv="Content-Security-Policy" content="block-all-mixed-content">
<meta name="format-detection" content="telephone=no">
<meta name="viewport" content="width=1300">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="same-origin">
<link type="image/png" rel="shortcut icon" href="/webGui/images/<?=_var($var, 'mdColor', 'red-on')?>.png">
<link type="text/css" rel="stylesheet" href="<?autov("/webGui/styles/default-fonts.css")?>">
<link type="text/css" rel="stylesheet" href="<?autov("/webGui/styles/default-cases.css")?>">
<link type="text/css" rel="stylesheet" href="<?autov("/webGui/styles/font-awesome.css")?>">
<link type="text/css" rel="stylesheet" href="<?autov("/webGui/styles/context.standalone.css")?>">
<link type="text/css" rel="stylesheet" href="<?autov("/webGui/styles/jquery.sweetalert.css")?>">
<link type="text/css" rel="stylesheet" href="<?autov("/webGui/styles/jquery.ui.css")?>">

<link type="text/css" rel="stylesheet" href="<?autov("/webGui/styles/default-color-palette.css")?>">
<link type="text/css" rel="stylesheet" href="<?autov("/webGui/styles/default-base.css")?>">
<link type="text/css" rel="stylesheet" href="<?autov("/webGui/styles/default-dynamix.css")?>">
<link type="text/css" rel="stylesheet" href="<?autov("/webGui/styles/themes/{$theme}.css")?>">

<style>
:root {
  --customer-header-background-image: url(<?= file_exists($banner) ? autov($banner) : autov('/webGui/images/banner.png') ?>);
  <?if ($header):?>
    --customer-header-text-color: #<?=$header?>;
  <?endif;?>
  <?if ($backgnd):?>
    --customer-header-background-color: #<?=$backgnd?>;
  <?endif;?>
  <?if ($display['font']):?>
    --custom-font-size: <?=$display['font']?>%;
  <?endif;?>
}

<?php
// Generate sidebar icon CSS if using sidebar theme
if ($themeHelper->isSidebarTheme()) {
    echo generate_sidebar_icon_css($taskPages, $buttonPages);
}
?>
</style>

<noscript>
<div class="upgrade_notice"><?=_("Your browser has JavaScript disabled")?></div>
</noscript>

<script src="<?autov('/webGui/javascript/dynamix.js')?>"></script>
<script src="<?autov('/webGui/javascript/translate.'.($locale?:'en_US').'.js')?>"></script>

<? require_once "$docroot/webGui/include/DefaultPageLayout/HeadInlineJS.php"; ?>

<?php
foreach ($buttonPages as $button) {
  annotate($button['file']);
  includePageStylesheets($button);
  eval('?>'.parse_text($button['text']));
}

foreach ($pages as $page) {
  annotate($page['file']);
  includePageStylesheets($page);
}
?>

function isValidURL(url) {
  try {
    var ret = new URL(url);
    return ret;
  } catch (err) {
    return false;
  }
}

$('body').on('click','a,.ca_href', function(e) {
  if ($(this).hasClass('ca_href')) {
    var ca_href = true;
    var href=$(this).attr('data-href');
    var target=$(this).attr('data-target');
  } else {
    var ca_href = false;
    var href = $(this).attr('href');
    var target = $(this).attr('target');
  }
  if (href) {
    href = href.trim();
    // Sanitize href to prevent XSS
    href = href.replace(/[<>"]/g, '');
    if (href.match('https?://[^\.]*.(my)?unraid.net/') || href.indexOf('https://unraid.net/') == 0 || href == 'https://unraid.net' || href.indexOf('http://lime-technology.com') == 0) {
      if (ca_href) window.open(href,target);
      return;
    }
    if (href !== '#' && href.indexOf('javascript') !== 0) {
      var dom = isValidURL(href);
      if (dom == false) {
        if (href.indexOf('/') == 0) return;  // all internal links start with "/"
      var baseURLpage = href.split('/');
        if (gui_pages_available.includes(baseURLpage[0])) return;
      }
      if ($(this).hasClass('localURL')) return;
      try {
        var domainsAllowed = JSON.parse($.cookie('allowedDomains'));
      } catch(e) {
        var domainsAllowed = new Object();
      }
      $.cookie('allowedDomains',JSON.stringify(domainsAllowed),{expires:3650}); // rewrite cookie to further extend expiration by 400 days
      if (domainsAllowed[dom.hostname]) return;
      e.preventDefault();
      swal({
        title: "<?=_('External Link')?>",
        text: "<span title='"+href+"'><?=_('Clicking OK will take you to a 3rd party website not associated with Lime Technology')?><br><br><b>"+href+"<br><br><input id='Link_Always_Allow' type='checkbox'></input><?=_('Always Allow')?> "+dom.hostname+"</span>",
        html: true,
        animation: 'none',
        type: 'warning',
        showCancelButton: true,
        showConfirmButton: true,
        cancelButtonText: "<?=_('Cancel')?>",
        confirmButtonText: "<?=_('OK')?>"
      },function(isConfirm) {
        if (isConfirm) {
          if ($('#Link_Always_Allow').is(':checked')) {
            domainsAllowed[dom.hostname] = true;
            $.cookie('allowedDomains',JSON.stringify(domainsAllowed),{expires:3650});
          }
          var popupOpen = window.open(href,target);
          if (!popupOpen || popupOpen.closed || typeof popupOpen == 'undefined') {
            var popupWarning = addBannerWarning("<?=_('Popup Blocked');?>");
            setTimeout(function(){removeBannerWarning(popupWarning);},10000);
          }
        }
      });
    }
  }
});

// Only include window focus/blur event handlers when live updates are disabled
// to prevent unnecessary page reloads when live updates are already handling data refreshes
// nchanPaused / blurTimer used elsewhere so need to always be defined

var nchanPaused = false;
var blurTimer = false;

<? if ( $display['liveUpdate'] == "no" ):?>
$(window).focus(function() {
  nchanFocusStart();
});

// Stop nchan on loss of focus
$(window).blur(function() {
  blurTimer = setTimeout(function(){
    nchanFocusStop();
  },30000);
});

document.addEventListener("visibilitychange", (event) => {
  if (document.hidden) {
    nchanFocusStop();
  } else {
    <? if (isset($myPage['Load']) && $myPage['Load'] > 0):?>
      if ( dialogOpen() ) {
        clearInterval(timers.reload);
        setTimerReload();
        nchanFocusStart();
      } else {
        window.location.reload();
      }
    <?else:?>
      nchanFocusStart();
    <?endif;?>
  }
});

function nchanFocusStart() {
  if ( blurTimer !== false ) {
    clearTimeout(blurTimer);
    blurTimer = false;
  }

  if (nchanPaused !== false ) {
    removeBannerWarning(nchanPaused);
    nchanPaused = false;

    try {
      pageFocusFunction();
    } catch(error) {}

    subscribers.forEach(function(e) {
      e.start();
    });
  }
}

function nchanFocusStop(banner=true) {
  if ( subscribers.length ) {
    if ( nchanPaused === false ) {
      var newsub = subscribers;
      subscribers.forEach(function(e) {
        try {
          e.stop();
        } catch(err) {
          newsub.splice(newsub.indexOf(e,1));
        }
      });
      subscribers = newsub;
      if ( banner && subscribers.length ) {
        nchanPaused = addBannerWarning("<?=_('Live Updates Paused');?>",false,true );
      }
    }
  }
}
<?endif;?>
</script>
<uui-toaster rich-colors close-button position="<?= ($notify['position'] === 'center') ? 'top-center' : $notify['position'] ?>"></uui-toaster>
</body>
</html>
