//initialize web cam settings for QR Code scanning
var valPass = false; var togglecam = false; var lastQRCode = ""; var disPass = ""; var releaseTo = 'Release';
var scanner = new Instascan.Scanner({ video: document.getElementById('preview') });
//detect QR Code perform validation
scanner.addListener('scan', function (content, image) {
  submitQRPass(content); //perform password or QR validation
});
//function for scanning QR using the webcam
function openCam(){
  if ($('#toggleButCam').prop('checked')){ //if toggled for QR scanning
    if (!togglecam){
      Instascan.Camera.getCameras().then(function (cameras) {
        if (cameras.length > 0) {
          scanner.start(cameras[0]);$('#app').show();togglecam=true;
          $('#passapp').hide(); valPass = false;
        }
      });
    }
  } else { //if password validation
    if (!valPass){
      $('#passapp').show(); valPass = true; scanner.stop();$('#app').hide();togglecam=false; $('#verPass').focus();
    }
  }
}
//toggle QR scanning or password validation
$('#toggleButCam').on('change', function(event){
  openCam();
});
//function for validating signature using QR code or password
function submitQRPass(content){
  //determine the next route of the document by identifying the level of access.....check whether GM or AGM... only the GM has release folder
  var hash = new Hashes.SHA512().b64(content); var branch= "N6"; var action= '6';
  if ($('#disLevel').val().toUpperCase()=='DEP') {branch = "N6"; action='1';}
  else if ($('#disLevel').val().toUpperCase()=='AGM') {branch = "GM"; action='1';}
  else if ($('#disLevel').val().toUpperCase()=='DUTYADMIN') branch = "Duty Admin";
  else branch = "Receiving";
  var todo = {filename:$('#fileroute').val(),monitfile:$('#fileroute').val(),user:getCookie('me'),hashval:hash, action:action,remark:'', branch:branch,subject:''};
  //post the equivalent hashed password and the file to be routed
  $.ajax({
    type: 'POST',
    url: '/scancode',
    data: todo,
    success: function(data){
      if (data=='successful') {
        lastQRCode = hash; disPass = content;
        $('#routeattachPage').hide();
        var options = {
          height: "400px",
        };
        //update routing slip
        PDFObject.embed('/drive/PDF-temp/route-'+$('#fileroute').val()+'.pdf', "#routeattachPage",options);
        scanner.stop();$('#app').hide();$('#passapp').hide(); valPass = false;togglecam=false;
        releasethisdoc(); //perform release of the document
      } else {
        alert('QR Code or Password Fail!');$('#verPass').val('');
      }
    }
  });
}
//close the modal dialog
function closeDialog(){
  scanner.stop();$('#app').hide();$('#passapp').hide();togglecam=false; valPass=false;
}
//handle function for routing to branch
function routetoBranchApp(){
  var arrRef = getCookie('arrRef');
  var arrEnc = getCookie('arrEnc');
  var todo = {filename:$('#fileroute').val(), refs:arrRef,encs:arrEnc};
  //post query to update the routing slip
  $.ajax({
    type: 'POST',
    url: '/searchrefmonitor',
    data: todo,
    success: function(data){
      resData = JSON.parse(data);
      var options = {
        height: "400px",
      };
      //display routing slip
      PDFObject.embed('/drive/PDF-temp/route-'+$('#fileroute').val()+'.pdf', "#routeattachPage",options);
    }
  });
}
//select page
$('#selPage').on('change', function(event){
  pointMainPDF(parseInt($('#selPage').val(),10)); //display selected page number
  var todo = {num:parseInt($('#selPage').val(),10)-1,filepath: $('#disPath').val(),user:getCookie('me')};
  if ($('#fileroute').val()!='empty'){
    $.ajax({
      type: 'GET',
      url: '/signpdf',
      data: todo,
      success: function(data){
        //update signing page
        document.getElementById('canvasPDF').src = "/assets/signcanvas.html";
      }
    });
  }
});
//hnadle switch for sign and Release
$('#toggleRelease').change(function(event){
  if ($('#toggleRelease').prop('checked')){
    $('#butApprove').show();$('#butRelease2').hide();
  } else {
    $('#butApprove').hide();$('#butRelease2').show();
  }
});
//hnadle switch for date and no date
$('#toggledate').change(function(event){
  if ($('#toggledate').prop('checked')){
    setCookie('noDate','true',1);
  } else {
    setCookie('noDate','false',1);
  }
});
//reload page upon clicking success button after signing
$('#successbut').on('click', function(event){
  location.replace('/incoming');
});
//function for releasing the document back to secretary folder
function releasethisdoc(){
  $('#overlay').show();
  //release or sign the main file or sign the enclosure and merge
  if (getCookie('realPath').toUpperCase()==$('#disPath').val().toUpperCase()) { //sign or release the main file
    var fileroute = $('#fileroute');
    var user = getCookie('me');
    var distime = 1000;
    if (($('#disLevel').val().toUpperCase()=="DEP") || ($('#disLevel').val().toUpperCase()=="AGM")) distime = 5000;
    sleep(distime).then(()=>{ //delay execution for synchronization
      var arrComm = getCookie('arrComm');
      var todo = {comments:arrComm, hashval:lastQRCode, filepath:$('#disPath').val(), num:parseInt($('#selPage').val(),10)-1,fileroute: fileroute.val(), branch:releaseTo, user:user};
      if (fileroute.val()!='empty'){
      //post sign the document for release using the stored hashed password
        $.ajax({
          type: 'POST',
          url: '/releasedoc',
          data: todo,
          success: function(data){
            closeDialog();$('#routemodClose').click();
            if (data=='successful'){
              $('#mstrmodDisp').html("<p>Document endorsed/released! </p>");
              $('#mstrtoggleDialog').click();
            } else alert('QR Code or Password Invalid!');
            $('#overlay').hide()
          }
        });
      }
    });
  } else { //sign the enclosure and merge
    let splitFile = $('#disPath').val().split('/'); let fileroute = splitFile[splitFile.length-1];
    var realpath = getCookie('realpath');
    var user = getCookie('me');
    let branch
    var todo = {hashval:lastQRCode, filepath:$('#disPath').val(), origenc:getCookie('origEncFile'), origfile: $('#fileroute').val(), realpath:realpath, num:parseInt($('#selPage').val(),10)-1, user:user};
    $.ajax({
      type: 'POST',
      url: '/mergesigndocenc',
      data: todo,
      success: function(data){
        closeDialog();$('#routemodClose').click();
        if (data=='fail') alert('QR Code or Password Invalid!');
        else if (data=='failref')  alert('Sorry! Signature is only allowed for Enclosures.');
        else {
          $('#disPath').val('/drive/PDF-temp/'+data);
          //display updated (signed) enclosure
          PDFObject.embed('/drive/PDF-temp/'+data, "#pdf_view",{page:parseInt($('#selPageSign').val(),10)-1});
          revFile = getCookie('origEncFile');
          //replace special characters to prevent error in the html embedding
          revFile = revFile.replace(/ /g,"___");revFile = revFile.replace(/\(/g,'u--');revFile = revFile.replace(/\)/g,'v--');revFile = revFile.replace(/\./g,'---');
          delEncRef('enc',revFile,'arrEnc');
          updRefEncCookie('arrEnc', data, realpath);
          newdata = data.replace(/ /g,"___");newdata = newdata.replace(/\(/g,'u--');newdata = newdata.replace(/\)/g,'v--');newdata = newdata.replace(/\./g,'---');
          newpath = realpath.replace(/ /g,"___");newpath=newpath.replace(/\(/g,"u--");newpath=newpath.replace(/\)/g,"v--");newpath=newpath.replace(/\./g,"z--");
          $('#divEnc').append("<div id='enc-"+newdata+"'>&nbsp;&nbsp;&nbsp;&nbsp;<button type='button' onclick=delEncRef('enc','"+newdata+"','arrEnc') class='btn btn-danger btn-sm fa fa-times'></button><button type='button' class='btn btn-link btn-sm' onclick=dispAttach('"+newpath+"','"+newdata+"')>"+data+"</button></div>");
          $('#butCancelSign').click();$('#divToggleSign').hide();$('#butReturn').hide();
        }
        $('#overlay').hide()
      }
    });
  }

}
//handle return to the originator
$('#butRelease3').on('click', async function(event){
  releaseTo = 'Originator'; //specify routing of document back to the originator
  $('#disrouteTitle').show();routetoBranchApp();//display routing slip
  togglecam=false; valPass=false;
  $('#divroyalCam').show();//$('#royalbutConfirm').show();
  openCam();$('#routeattachPage').hide();
});
//handle releasing of document ... no signature...the AGM routes document to GM without signature
$('#butRelease1').on('click', async function(event){
  //specify where to release.....if AGM then release to GM, if GM then release to secretary
  if (($('#disLevel').val().toUpperCase()=="DEP") || ($('#disLevel').val().toUpperCase()=="AGM")) releaseTo = 'Boss';
  else releaseTo = 'Release';
  $('#disrouteTitle').show();routetoBranchApp();togglecam=false; valPass=false;
  $('#divroyalCam').show();//$('#royalbutConfirm').show();
  openCam();$('#routeattachPage').hide();
});
//handle signing and releasing of document
$('#butRelease2').on('click', async function(event){
  //specify where to sign and release.....if AGM then release to GM, if GM then release to secretary
  if (($('#disLevel').val().toUpperCase()=="DEP") || ($('#disLevel').val().toUpperCase()=="AGM")) releaseTo = 'Boss';
  else releaseTo = 'Release';
  $('#disrouteTitle').show();routetoBranchApp();togglecam=false; valPass=false;
  $('#divroyalCam').show();//$('#royalbutConfirm').show();
  openCam();$('#routeattachPage').hide();
});
//Sign Document
$('#butApprove').on('click', function(event){
  var todo = {num:0,filepath: $('#disPath').val(),user:getCookie('me')};
  $.ajax({
    type: 'GET',
    url: '/signpdf',
    data: todo,
    success: function(data) {
      //update signing page
      document.getElementById('canvasPDF').src = "/assets/signcanvas.html";
      $('#disContent').hide();$('#disFrame').show();
      $('#butApprove').hide();$('#butRelease2').hide();
      $('#divSign').show();$('#butReturn').hide();
      $('#divToggleSign').hide();$('#divToggledate').show();
      document.getElementById('disContentMobile').style.display="none";
      $('#disAnnotate').hide();
      //Update html elements
      if (!$('#disPath').val().toUpperCase().includes($('#fileroute').val().toUpperCase())) $('#butRelease1').html("<i class='fa fa-save'></i>&nbsp; Save");
      else {
        $('#divretbranch').show();
        //update html elements for AGM and GM.....AGM will have release button without signature while GM will have signature for all releases
        if (($('#disLevel').val().toUpperCase()=="DEP") || ($('#disLevel').val().toUpperCase()=="AGM")) $('#butRelease1').html("<i class='fa fa-upload'></i>&nbsp;Release to Boss");
        else $('#butRelease1').html("<i class='fa fa-upload'></i>&nbsp;Release this");
      }
    }
  });
});
//handle cancel signing
$('#butCancelSign').on('click', function(event){
  $.ajax({
    type: 'POST',
    url: '/cancelsign',
    success: function(data) {
      //return to normal page and buttons
      $('#disAnnotate').show();
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))  {
        $('#disContentMobile').show();$('#disContent').hide();
      } else {
        $('#disContentMobile').hide();$('#disContent').show();
      }
      $('#disFrame').hide();$('#butRelease2').hide();
      $('#butApprove').show();
      $('#divretbranch').hide();$('#divSign').hide();
      if ($('#disPath').val().toUpperCase().includes($('#fileroute').val().toUpperCase())) {
        $('#butReturn').show();
        $('#divToggleSign').show();$('#divToggledate').hide();
      } else {
        $('#divToggleSign').hide();
        $('#butReturn').hide();
      }
      location.reload();
    }
  });
});
//handle password keypress..... perform validation when enter is pressed
$('#verPass').keypress(function(e){
  if (e.which==13) submitQRPass($('#verPass').val());
});
//handle validate password click
$('#validatePass').on('click', function (event){
  submitQRPass($('#verPass').val());
});
//close dialog when cancel button click
$('#routeButCanc').on('click', function(event){
  closeDialog();
});
//close dialog when X button clicked
$('#routingTopClose').on('click', function(event){
  closeDialog();
});
//handle routing slip button clicked
$('#butRoutSlip').on('click', function(event){
  $('#divroyalCam').hide();$('#disrouteTitle').hide();$('#routeattachPage').show();
  routetoBranchApp(); //display routing slip
});
//perform return to originator
$('#butReturn').on('click', function(event){
  returnToSender(true);
});
//function for returning document to the originator
function returnToSender(disBool){
  var fileroute = $('#fileroute');$('#overlay').show()
  var user = getCookie('me');
  sleep(5000).then(()=>{ //set delay for synchronization
    var arrComm = getCookie('arrComm');
    var todo = {save:'return',fileroute: fileroute.val(), user:user, comments:arrComm};
    if (fileroute.val()!='empty'){
      $.ajax({
        type: 'POST',
        url: '/incoming',
        data: todo,
        success: function(data){
          if (data=='successful')
          {
            $('#mstrmodDisp').html("<p>Document returned to originating branch!</p>");
            $('#mstrtoggleDialog').click();
          }
          $('#overlay').hide()
        }
      });
    }
  });
}
//function to update the main page and the page numbers
function updateSelectPage(){
  //populate select page
  loadPDF($('#disPath').val()).then(function(res){
    $('#selPage').empty();
    for (var i=1; i<=res; i++){
      $('#selPage').append("<option value='"+i.toString()+"'>"+i.toString()+"</option>");
    }
    $("#selPage").chosen({
      //disable_search_threshold: 10,
      no_results_text: "Oops, nothing found!",
      width: "60px"
    });
    $('#selPage').trigger("chosen:updated");
  });
  //get first page and load to Canvas PDF
  var todo = {num:0,filepath: $('#disPath').val(),user:getCookie('me')};
  if ($('#fileroute').val()!='empty'){
    $.ajax({
      type: 'GET',
      url: '/signpdf',
      data: todo,
      success: function(data){
        document.getElementById('canvasPDF').src = "/assets/signcanvas.html";
      }
    });
  }
}


//Load when html renders
$(document).ready(function(){

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
  //initialize qr scan and password buttons
  if ($('#toggleButCam').prop('checked')){
    $('#app').show();togglecam=true; $('#passapp').hide(); valPass = false;
  }
  else {
    $('#passapp').show(); valPass = true; scanner.stop();$('#app').hide();togglecam=false; $('#verPass').focus()
  }
  //initialize values
  setCookie('viewBr','incomingroute',1);
  if (window.location.toString().includes("/incoming")) setCookie('viewBr','incomingroute',1);
  else if (window.location.toString().includes("/fileopen")) setCookie('viewBr','openroute',1);
  setCookie('realPath',$('#disPath').val(),1);
  setCookie('fileAI',$('#newfile').val(),1);
  setCookie('noDate','true',1); setCookie('category',$('#disCateg').val(),1);
  //initialize release button for AGM and GM
  if (($('#disLevel').val().toUpperCase()=="DEP") || ($('#disLevel').val().toUpperCase()=="AGM")) {
    $('#butRelease2').html("<i class='fa fa-upload'></i>&nbsp;Release to Boss");
    $('#toggleRelease').bootstrapToggle('toggle');
    $('#butApprove').hide();$('#butRelease2').show();
  } else {
    $('#butApprove').show();$('#butRelease2').hide();
  }
  if ($('#disCateg').val().toUpperCase().includes('DISPOSITION') || $('#disCateg').val().toUpperCase().includes('DF')) //this may be removed
  $('#toggledate').bootstrapToggle('toggle');
  setCookie('arrRef',JSON.stringify([]));setCookie('arrEnc',JSON.stringify([]));setCookie('arrComm',JSON.stringify([]),1);
  queryDoc();//query document database to populate metadata
  if ($('#fileroute').val()=='empty') {
    togglePanelHide(true); $('#overlay').hide();//display spinner
  }

  updateSelectPage(); //render initial page

});
