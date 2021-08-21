
//function for OCR scanning the document....this is for AI analysis in order to predict the classification of the document
function scanDoc(){
  $('#txtscan').val('Machine Learning Successful!');

  var disID = getCookie('me');
  var fileroute = $('#fileroute');
  var disPath = $('#disPath');
  var boolRun = $('#disScanAI').val();
  var todo = {fileroute: fileroute.val(), id:disID, path:disPath.val()};
  //check if file is already selected to bypass scanning for loaded documents
  if ((fileroute.val()!='Empty File') && (fileroute.val()!='empty') && (!checkCookie()) && (boolRun=="true")){ //if file is selected
    $('#commentToggle').show();$('#sideToggle').show();
    $('#txtscan').val('&nbsp;Scanning document using OCR...');setCookie('clasAI',null,1);setCookie('tagAI',null,1);
    setCookie('arrRef',JSON.stringify([]),1);setCookie('arrEnc',JSON.stringify([]),1);setCookie('arrComm',JSON.stringify([]),1);
    queryDoc();//query document database to populate metadata
    //instruct server to OCR scan the selected document
    $.ajax({
      type: 'POST',
      url: '/incoming/scanDoc',
      data: todo,
      success: function(data){
        //do something with the data via front-end framework
        document.getElementById("txtscan").innerHTML = "&nbsp;Analyzing document using AI...";
        $('#txtscan').val('&nbsp;Analyzing document using AI...');
        setCookie('newPath',data);//set user Drive
        AIDoc(); //perform AI Analysis after OCR scanning
      }
    });

  } else { //if file is only reloaded
    //unhide elements
    document.getElementById("actBr").style.display = "block";
    document.getElementById("butScan").style.display = "none";
    document.getElementById("selDiv").style.display = "block";
    document.getElementById("butDiv").style.display = "block";
    document.getElementById("actTag").style.display = "block";
    document.getElementById("divTag").style.display = "block";

    if (boolRun!="true") $('#txtscan').val('Machine Learning Successful!');
    if (window.location.toString().includes("/incoming")){
      if (!checkCookie()) {
        setCookie('clasAI',null,1);setCookie('tagAI',null,1);
        setCookie('arrRef',JSON.stringify([]));setCookie('arrEnc',JSON.stringify([]));setCookie('arrComm',JSON.stringify([]),1);
      }
      queryDoc();//query document database to populate metadata
    }
    if (fileroute.val()=='empty') {
      togglePanelHide(true);$('#overlay').hide()//display spinner
    }
    if (fileroute.val()=='Empty File'){
      togglePanelHide(true);//$('#overlay').hide()//display spinner
    }
  }
};

//Send JSON to server for analyzing document using AI and predict the classification of the document
function AIDoc(){
  var disID = getCookie('me');
  var fileroute = $('#fileroute');
  var todo = {fileroute: fileroute.val(), id:disID};
  $.ajax({
    type: 'POST',
    data: todo,
    url: '/incoming/analyzeClass',
    success: function(data){
      //unhide elements
      document.getElementById("actBr").style.display = "block";
      document.getElementById("butScan").style.display = "none";
      document.getElementById("selDiv").style.display = "block";
      document.getElementById("butDiv").style.display = "block";
      document.getElementById("actTag").style.display = "block";
      document.getElementById("divTag").style.display = "block";
      $("#selClas").val(data).prop('selected', true);
      //re-initiate select option
      $('#txtscan').val('Machine Learning Successful!');
      $('#selTag').val('[]');setCookie('tagAI',$('#selTag').val(),1);
      setCookie('fileAI',$('#newfile').val(),1);setCookie('clasAI',$('#selClas').val(),1);
      selChose(); //re-initiate bootstrap select element
      queryDoc();//query document database to populate metadata

    }
  });
};

//check checkCookie
function checkCookie() {
  var disFile=getCookie('fileAI');
  var disClas=getCookie('clasAI');
  var disTag=getCookie('tagAI');
  if (disFile==$('#newfile').val()){
    $("#selClas").val(disClas); $("#selTag").val(disTag);
    return true;
  }else{
    return false;
  }

}
//handle routing of temporary incoming documents to specific branch
function routeBr(branch){
  qrClick = false;
  routetoBranchApp(branch);//process routing slip.....from app.js
}
//function send file to users on the same branch
function sendUser(userbranch){
  if (!$('#newfile').val().includes('.')) {alert ('File extension not recognized!'); return false;}
  togglePanelHide(true);$('#overlay').show()//display spinner
  var fileroute = $('#fileroute');
  var newfile = $('#newfile');
  var branch = $('#selClas');
  var tag = $('#selTag').val(); if (tag===null) tag = [];
  var arrRef = getCookie('arrRef');
  var arrEnc = getCookie('arrEnc');
  var arrComm = getCookie('arrComm');

  var user = getCookie('me');
  var realPath = $('#disPath').val();
  if (window.location.toString().includes("/incoming")) realPath = $('#disPath').val();
  else if (window.location.toString().includes("/fileopen")) realPath = getCookie('realpath');
  var todo = {path: realPath, newfile:newfile.val(), send:userbranch, user:user, fileroute: fileroute.val(), class:branch.val(), tag:JSON.stringify(tag), refs:arrRef, encs:arrEnc, comments:arrComm};
  //send copy of the file to user
  $.ajax({
    type: 'POST',
    url: '/senduser',
    data: todo,
    success: function(data){
      togglePanelHide(false);$('#overlay').hide()//display spinner
      if (data=='successful') $('#mstrmodDisp').html("<p>File Successfully Sent!</p>");
      else $('#mstrmodDisp').html("<p>File sending failed! Document is currently opened by another user. </p>");
      $('#mstrtoggleDialog').click();
      //location.replace('/incoming');
    }
  });
}
//Load when html renders
$(document).ready(function(){
  setCookie('viewBr','incomingroute',1);
  if (window.location.toString().includes("/incoming")) setCookie('viewBr','incomingroute',1);
  else if (window.location.toString().includes("/fileopen")) setCookie('viewBr','openroute',1);

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
  //handle button butAction
  $('#butAction').on('click', function(){
    $('.dropdown-submenu .show').removeClass("show");
  });

  //handle select Classification
  $('#selClas').on('change', function(){
    setCookie('clasAI', $('#selClas').val(),1);
  });
  //handle select tag
  $('#selTag').on('change', function(){
    setCookie('tagAI',JSON.stringify($('#selTag').val()),1);
  });
  //handle send file to other
  $("#othSend").on('click', function(e){
    $('.dropdown-submenu .show').removeClass("show");
    sendUser($('#selOthers').val());
  });
  //stop close on selecting others
  $("#othSelect").on('click', function (event){
    event.stopPropagation();
    //event.preventDefault();
  });
  //Start scanning document
  scanDoc();
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
      var arrRef = getCookie('arrRef');
      var arrEnc = getCookie('arrEnc');
      var tag = $('#selTag').val(); if (tag===null) tag = [];
      var user = getCookie('me');
      var disBranch = $('#routeselBr').val();
      var arrComm = getCookie('arrComm');
      var monitfile = $('#lbltmp').val();

      var viewBr = "incomingroute";
      var realPath = $('#disPath').val();
      if (window.location.toString().includes("/incoming")) {realPath = $('#disPath').val(); viewBr = "incomingroute";}
      else if (window.location.toString().includes("/fileopen")) {realPath = getCookie('realpath'); viewBr = "openroute";}
      var todo = {save: viewBr, hashval:getCookie('tempPass'), monitfile:monitfile, fileroute: fileroute.val(), path: realPath, newfile:newfile.val(), branch:disBranch, class: $('#selClas').val(), tag:JSON.stringify(tag), user:user, refs:arrRef, encs:arrEnc, comments:arrComm};
      if (fileroute.val()!='empty'){
        //post route document to branch
        $.ajax({
          type: 'POST',
          url: '/incoming',
          data: todo,
          success: function(data){
            if (data=='fail') {
              alert('Routing Failed! You may try again or delete to discard this document.');
              togglePanelProc(false);
            } else if (data=='noroute') { //this is to prevent duplicate routing of document
              alert('Simultaneous routing detected. You may delete this document if you are not the action branch.');
              togglePanelProc(false);
            } else location.replace('/incoming');
            //togglePanelProc(false);
          }
        });
      }
    }else {
      alert('Please scan your QR Code to sign the routing slip');
    }
  });
});
