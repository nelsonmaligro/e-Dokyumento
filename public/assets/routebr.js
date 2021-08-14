
//Auto refresh Notification
function checkFilesRelease(){
  //alert('here');
  $.ajax({
    type: 'post',
    url: '/sendincomingrelease',
    success: function(data){
      arrFiles = JSON.parse(data);
      if (arrFiles.length > parseInt($('#releaseNr').html(),10)) {sound = document.getElementById('soundNoti'); sound.play();}
      $('#releaseNr').html(arrFiles.length);
      $('#releaseLabel').html('&nbsp;&nbsp;You have '+ arrFiles.length +' For-Release files pending');
      $('#addRelease').empty();
      arrFiles.forEach(function (file){
        $('#addRelease').append("<li><a class='dropdown-item media bg-flat-color-3' href='/incoming/release/"+file+"'><i class='fa fa-check'></i><p>"+ file +"</p></a></li>");
      });
    }
  });
}
//send JSON to server for scanning the document
function scanDoc(){
  var disID = getCookie('me');
  var fileroute = $('#fileroute');
  var disPath = $('#disPath');
  //setCookie('viewBr','incomingroute');
  if (window.location.toString().includes("/release/")){
    queryDoc();//query document database to populate metadata
    document.getElementById("actBr").style.display = "none";
    $('#butScan').hide();    $("#butDiv").show();
    document.getElementById("selDiv").style.display = "none";
    $('#docArchive').show();$('#routebutBr').hide();$('#docSaveFile').hide();
  } else {
    $('#docArchive').hide();$('#routebutBr').show();$('#docSaveFile').show();
    var todo = {fileroute: fileroute.val(), id:disID, path:disPath.val()};
    if ((fileroute.val()!='Empty File') && (fileroute.val()!='empty') && (!checkCookie())){
      $('#butScan').show();
      setCookie('arrEnc',JSON.stringify([]),1);setCookie('arrRef',JSON.stringify([]),1);
      setCookie('arrComm',JSON.stringify([]),1);
      $.ajax({
        type: 'POST',
        url: '/incoming/scanDoc',
        data: todo,
        success: function(data){
          //do something with the data via front-end framework
          document.getElementById("txtscan").innerHTML = "&nbsp;Analyzing document using AI...";
          setCookie('newPath',data);//set user Drive
          AIDoc();
        }
      });

    }else{
      //unhide elements
      document.getElementById("actBr").style.display = "block";
      $('#butScan').hide();
      document.getElementById("selDiv").style.display = "block";
      document.getElementById("butDiv").style.display = "block";
      $("#selBr").chosen({ disable_search_threshold: 10, width: "100%" });
      if (fileroute.val()=='empty') { togglePanelHide(true);$('#overlay').hide();}
      loadRefEnc();
    }
  }
};
//Send JSON to server for analyzing document using AI
function AIDoc(){
  var disID = getCookie('me');
  var fileroute = $('#fileroute');
  var todo = {fileroute: fileroute.val(), id:disID};
  $.ajax({
    type: 'POST',
    data: todo,
    url: '/incoming/analyzeBranch',
    success: function(data){
      //unhide elements
      document.getElementById("actBr").style.display = "block";
      document.getElementById("butScan").style.display = "none";
      document.getElementById("selDiv").style.display = "block";
      document.getElementById("butDiv").style.display = "block";
      $("#selBr").val(data).prop('selected', true);
      setCookie('fileAI',$('#newfile').val(),1);setCookie('branchAI',$('#selBr').val(),1);
      $('#butScan').hide();
      //re-design select option
      $("#selBr").chosen({
        disable_search_threshold: 10,
        width: "100%"
      });

    }
  });
};

//check checkCookie
function checkCookie() {
  var disFile=getCookie('fileAI');
  var disBranch=getCookie('branchAI');
  if (disFile==$('#newfile').val()){
    $("#selBr").val(disBranch).prop('selected', true);
    return true;
  }else{
    return false;
  }

}//handle delet file and save to incoming
$('#docSaveFile').on('click', function(e){
  if (!$('#newfile').val().includes('.')) {alert ('File extension not recognized!'); return false;}
  togglePanelProc(true);
  var fileroute = $('#fileroute');
  var newfile = $('#newfile');
  var todo = {user:getCookie('me'), save:'transfer', fileroute: fileroute.val(), newfile:newfile.val()};
  if (fileroute.val()!='empty'){
    $.ajax({
      type: 'POST',
      url: '/incoming',
      data: todo,
      success: function(data) {
        if (data.toUpperCase()!='FAIL') {togglePanelProc(true);location.replace('/incoming');}
        else {alert('Transfer Fail! The file may be opened by another application.');togglePanelProc(false);}
      }
    });
  }
  //return false;
})
//handle save to archive button clicked
$('#docArchive').on('click', function(event){
  if (!$('#newfile').val().includes('.')) {alert ('File extension not recognized!'); return false;}
  togglePanelProc(true);
  var fileroute = $('#fileroute');
  var newfile = $('#newfile');
  var todo = {user:getCookie('me'), save:'archive', fileroute: fileroute.val(), newfile:newfile.val()};
  if (fileroute.val()!='empty'){
    $.ajax({
      type: 'POST',
      url: '/incoming',
      data: todo,
      success: function(data){
        togglePanelProc(true);
        location.replace('/incoming');
      }
    });
  }
  return false;
});
//Load when html renders
$(document).ready(function(){
  setCookie('viewBr','incomingroute',1);
  if (window.location.toString().includes("/incoming")) setCookie('viewBr','incomingroute',1);
  else if (window.location.toString().includes("/fileopen")) setCookie('viewBr','openroute',1);
  //handle form submit
  var disID = getCookie('me');
  $('#routebutBr').on('click', function(event){
    routetoBranchApp($('#selBr').val());
  });
  //Start scanning document
  scanDoc();
  //cascading multiple dropdown
  $('.dropdown-menu a.dropdown-toggle').on('click', function(e) {
    if (!$(this).next().hasClass('show')) {
      $(this).parents('.dropdown-menu').first().find('.show').removeClass("show");
    }
    var $subMenu = $(this).next(".dropdown-menu");
    $subMenu.toggleClass('show');


    $(this).parents('li.nav-item.dropdown.show').on('hidden.bs.dropdown', function(e) {
      $('.dropdown-submenu .show').removeClass("show");
    });
    return false;
  });
  //handle click on confirm routing button
  $('#routebutConfirm').on('click', function(event){
    if (!$('#newfile').val().includes('.')) {alert ('File extension not recognized!'); return false;}
    if (($('#newfile').val().includes('(')) || ($('#newfile').val().includes(')')))  {alert ('Invalid Character'); return false;}

    if ($('#routeselBr').val()==null) {
      alert('Input Branch to Route!'); return;
    }
    if (qrClick){ //if routing slip is signed with password or QR Code
      $('#routemodClose').click();
      togglePanelProc(true);

      var fileroute = $('#fileroute');
      var newfile = $('#newfile');
      var branch = $('#routeselBr');
      var arrRef = getCookie('arrRef');
      var arrEnc = getCookie('arrEnc');
      var arrComm = getCookie('arrComm');
      var monitfile = $('#lbltmp').val();
      var user = disID;
      //  alert(getCookie('tempPass'));
      var todo = {save:'incomingroute', hashval:getCookie('tempPass'), monitfile:monitfile, fileroute: fileroute.val(), newfile:newfile.val(), branch:branch.val(), class:null, tag:JSON.stringify([]), user:user, refs:arrRef, encs:arrEnc, comments:arrComm};
      if (fileroute.val()!='empty'){
        $.ajax({
          type: 'POST',
          url: '/incoming',
          data: todo,
          success: function(data){
            if (data=='successful')  location.replace('/incoming');
            else alert('Routing Failed! Make sure the file is not opened by other application');
            //togglePanelProc(false);
          }
        });
      }
      closeDialog();
      $('#routeButCanc').click();

    }else {
      alert('Please scan your QR Code to sign the routing slip');
    }
  });
  setInterval('checkFilesRelease();',30000);
});
