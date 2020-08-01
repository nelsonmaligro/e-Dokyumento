
//send JSON to server for scanning the document
function scanDoc(){
  $('#txtscan').val('Machine Learning Successful!');

  var disID = getCookie('me');
  var fileroute = $('#fileroute');
  var disPath = $('#disPath');
  var boolRun = $('#disScanAI').val();
  //alert(boolRun);
  var todo = {fileroute: fileroute.val(), id:disID, path:disPath.val()};
  if ((fileroute.val()!='Empty File') && (fileroute.val()!='empty') && (!checkCookie()) && (boolRun=="true")){
      $('#commentToggle').show();$('#sideToggle').show();
      $('#txtscan').val('&nbsp;Scanning document using OCR...');setCookie('clasAI',null,1);setCookie('tagAI',null,1);
      setCookie('arrRef',JSON.stringify([]),1);setCookie('arrEnc',JSON.stringify([]),1);setCookie('arrComm',JSON.stringify([]),1);
      queryDoc();//query document database to populate metadata
      $.ajax({
        type: 'POST',
        url: '/incoming/scanDoc',
        data: todo,
        success: function(data){
          //do something with the data via front-end framework
          document.getElementById("txtscan").innerHTML = "&nbsp;Analyzing document using AI...";
          $('#txtscan').val('&nbsp;Analyzing document using AI...');
          setCookie('newPath',data);//set user Drive
          AIDoc();
        }
       });

  } else {
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
      //setCookie('viewBr','openroute',1); //assign open view for empty files
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
       //document.getElementById("selClas").value = data;
       //re-design select option
       $('#txtscan').val('Machine Learning Successful!');
       $('#selTag').val('[]');setCookie('tagAI',$('#selTag').val(),1);
      setCookie('fileAI',$('#newfile').val(),1);setCookie('clasAI',$('#selClas').val(),1);
      selChose();
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
//function route to branches
function routeBr(branch){
  qrClick = false;
  routetoBranchApp(branch);
}
//function send file to users on the same branch
function sendUser(userbranch){
  if (!$('#newfile').val().includes('.')) {alert ('File extension not recognized!'); return false;}
  if (($('#newfile').val().includes('(')) || ($('#newfile').val().includes(')')))  {alert ('Invalid Character'); return false;}
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
        if (($('#newfile').val().includes('(')) || ($('#newfile').val().includes(')')))  {alert ('Invalid Character'); return false;}

        if ($('#routeselBr').val()==null) {
          alert('Input Branch to Route!'); return;
        }
        if (qrClick){
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
            $.ajax({
              type: 'POST',
              url: '/incoming',
              data: todo,
              success: function(data){
                if (data=='fail') {
                  alert('Routing Failed! You may try again or delete to discard this document.');
                  togglePanelProc(false);
                } else if (data=='noroute') {
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
