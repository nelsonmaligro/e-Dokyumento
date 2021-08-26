
//Auto refresh Notification....check released files (for secretary accounts)
function checkFilesRelease(){
  $.ajax({
    type: 'post',
    url: '/sendincomingrelease',
    success: function(data){
      arrFiles = JSON.parse(data);
      if (arrFiles.length > parseInt($('#releaseNr').html(),10)) {sound = document.getElementById('soundNoti'); sound.play();}
      $('#releaseNr').html(arrFiles.length);
      $('#releaseLabel').html('&nbsp;&nbsp;You have '+ arrFiles.length +' For-Release files pending');
      $('#addRelease').empty();
      arrFiles.forEach(function (file){ //iterate through files and append to the release notification
        $('#addRelease').append("<li><a class='dropdown-item media bg-flat-color-3' href='/incoming/release/"+file+"'><i class='fa fa-check'></i><p>"+ file +"</p></a></li>");
      });
    }
  });
}
//function for OCR scanning the document....this is for AI analysis in order to predict the branch for routing
function scanDoc(){
  var disID = getCookie('me');
  var fileroute = $('#fileroute');
  var disPath = $('#disPath');
  if (window.location.toString().includes("/release/")){ //if file selected is in the release folder
    queryDoc();//query document database to populate metadata
    document.getElementById("actBr").style.display = "none";
    $('#butScan').hide();    $("#butDiv").show();
    document.getElementById("selDiv").style.display = "none";
    $('#docArchive').show();$('#docTransN').show();$('#docRouteBr').show();$('#routebutBr').hide();$('#docSaveFile').hide();
  } else { //if file selected is in the incoming route folder
    $('#docArchive').hide();$('#docTransN').hide();$('#docRouteBr').hide();$('#routebutBr').show();$('#docSaveFile').show();
    var todo = {fileroute: fileroute.val(), id:disID, path:disPath.val()};
    //check if file is already selected to bypass scanning for loaded documents
    if ((fileroute.val()!='Empty File') && (fileroute.val()!='empty') && (!checkCookie())){ //if file is selected
      $('#butScan').show();
      setCookie('arrEnc',JSON.stringify([]),1);setCookie('arrRef',JSON.stringify([]),1);
      setCookie('arrComm',JSON.stringify([]),1);
      //instruct server to OCR scan the selected document
      $.ajax({
        type: 'POST',
        url: '/incoming/scanDoc',
        data: todo,
        success: function(data){
          //do something with the data via front-end framework
          document.getElementById("txtscan").innerHTML = "&nbsp;Analyzing document using AI...";
          setCookie('newPath',data);//set user Drive
          AIDoc(); //perform AI Analysis after OCR scanning
        }
      });

    }else{ //if file is only reloaded
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
  //instruct server to AI predict the current file to determine the branch
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
      $("#selBr").val(data).prop('selected', true); //select the branch from AI result
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
}
//handle to move the file from temp secretary folder to server 'incoming' folder
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
})
//handle move the released file to the server 'archive' folder
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
//Return document to orignating branch
$('#docRouteBr').on('click', function(event){
  var fileroute = $('#fileroute');$('#overlay').show()
  var user = getCookie('me');
  sleep(5000).then(()=>{ //set delay for synchronization
    var arrComm = getCookie('arrComm');
    var todo = {save:'return',fileroute: fileroute.val(), user:user, comments:arrComm};
    if (fileroute.val()!='empty'){
      $.ajax({
        type: 'POST',
        url: '/returnrelease',
        data: todo,
        success: function(data){
          location.replace('/incoming/release/');
          $('#overlay').hide()
        }
      });
    }
  });
});
//transfer the released file to the Server mapped drive (external drive)
$('#docTransN').on('click', function(event){
  var fileroute = $('#fileroute');
  var todo = {user:getCookie('me'),  fileroute: fileroute.val() };
  if (fileroute.val()!='empty'){
    $.ajax({
      type: 'POST',
      url: '/savemetatofile',
      data: todo,
      success: function(data){
        if (data=='success')  location.replace('/incoming');
        else {
          alert('Transfer Failed! Check mapped drive and write permission.');
          location.reload();
        }
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
  var disID = getCookie('me');
  //handle routing of temporary incoming documents to specific branch
  $('#routebutBr').on('click', function(event){
    routetoBranchApp($('#selBr').val());//process routing slip.....from app.js
  });
  //Start scanning document with the first document selected
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
      var todo = {save:'incomingroute', hashval:getCookie('tempPass'), monitfile:monitfile, fileroute: fileroute.val(), newfile:newfile.val(), branch:branch.val(), class:null, tag:JSON.stringify([]), user:user, refs:arrRef, encs:arrEnc, comments:arrComm};
      if (fileroute.val()!='empty'){
      //post route document to branch
        $.ajax({
          type: 'POST',
          url: '/incoming',
          data: todo,
          success: function(data){
            if (data=='successful')  location.replace('/incoming');
            else alert('Routing Failed! Make sure the file is not opened by other application');
          }
        });
      }
      closeDialog();
      $('#routeButCanc').click(); //invoke to close the modal dialog

    }else {
      alert('Please scan your QR Code to sign the routing slip');
    }
  });
  setInterval('checkFilesRelease();',30000); //continuesly check for release files every 30 sec
});
