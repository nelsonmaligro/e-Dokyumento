///For Branch Signing Documnent
//initialize camera scanner for QR Code
var brscanner = new Instascan.Scanner({ video: document.getElementById('preview') });//initialize web cam scanner to validate signature when file opened
brscanner.addListener('scan', function (content, image) { //capture QR code to validate signature when file opened
  brsubmitQRPass(content);
});
var brtogglecam = false; var brvalPass = false;
//function for enabling web cam for scanning or display password box as alternative during file open
function openCamBranch(){
  if ($('#toggleButCamRoyal').prop('checked')){ //if qr scanning is selected then fire up the Cam for QR validation
    if (!brtogglecam){ // if cam is not currently open
      Instascan.Camera.getCameras().then(function (cameras) {
        if (cameras.length > 0) {
          brscanner.start(cameras[0]);$('#passapproyal').hide();
          $('#app').show();brtogglecam=true;brvalPass = false;
        }
      });
    }
  }else { // if not then open the password box for validation
    if (!brvalPass){
      $('#passapproyal').show(); $('#verPassroyal').focus(); brvalPass = true;$('#app').hide();brscanner.stop();brtogglecam = false;
    }
  }
}
//function for submitting password or QR validation in order to merge the signature into the original file
function brsubmitQRPass(hash){
  $('#overlay').show();
  var fileroute = $('#fileroute');
  var realpath = getCookie('realpath');
  var user = getCookie('me');
  let windowpage = 'open';
  if (window.location.toString().includes("/incoming")) windowpage = 'incoming';

  //let buffCont = new Buffer(content);
  var todo = {page:windowpage, hashval:hash, filepath:$('#disPath').val(), realpath:realpath, num:parseInt($('#selPageSign').val(),10)-1,fileroute: fileroute.val(), user:user};
  if (fileroute.val()!='empty'){
    $.ajax({
      type: 'POST',
      url: '/mergesigndoc',
      data: todo,
      success: function(data){
        if (data!='fail'){
          //return to original page with merged sign image
          closeDialog();$('#routemodClose').click();
          if (window.location.toString().includes("/incoming")) {
              window.location.reload(); return;
          } else {
            setCookie('fileOpn','/drive/PDF-temp/'+data,1);
            setCookie('fileAI',data,1); $('#passapproyal').hide();
            $('#app').hide();sleep(10000);
            triggerButFile(); //re-display the file and update cookies... refer to openfile.js
            $('#butCancelSign').click();
          }
        } else {alert('QR Code or Password Invalid!'); $('#verPassroyal').val('');}
        $('#overlay').hide();
      }
    });
  }
}

//For routing slip
//initialize camera scanner for QR Code
var togglecam = false; var qrClick = false;var valPass = false;
var scanner = new Instascan.Scanner({ video: document.getElementById('preview') }); //initialize web cam scanner to validate routing slip
scanner.addListener('scan', function (content, image) { //capture QR code to validate routing slip signature
  submitQRPass(content);
  scanner.stop();$('#app').hide();togglecam=false;
});
//function for enabling web cam for scanning or display password box as alternative during slip routing
function openCam(){
  if ($('#toggleButCam').prop('checked')){ //if qr scanning is selected then fire up the Cam for QR validation
    if (!togglecam){ // if cam is not currently open
      Instascan.Camera.getCameras().then(function (cameras) {
        if (cameras.length > 0) {
          scanner.start(cameras[0]);$('#app').show();togglecam=true;
        }
      });
    }else {
      scanner.stop();$('#app').hide();togglecam=false;
    }
  }else { // if not then open the password box for validation
    if (!valPass){
      $('#passapp').show(); valPass = true; $('#verPass').focus();
    } else {
      $('#passapp').hide(); valPass = false;
    }
  }
}
//function for submitting password or QR validation in order to merge the signature into the routing slip
function submitQRPass(hash){
  let viewBr = 'incoming';
  if (window.location.toString().includes("/fileopen")) viewBr = 'openroute';
  var todo = {view:viewBr, filename:$('#fileroute').val(),monitfile:$('#lbltmp').val(),user:getCookie('me'),hashval:hash, action:$('#routeselAct').val(),remark:$('#routeRemark').val(), branch:$('#routeselBr').val(),subject:$('#routeSubject').val()};
  $.ajax({
    type: 'POST',
    url: '/scancode',
    data: todo,
    success: function(data){
      if (data=='successful') {
        //store temporary hashed pass to prevent repeating the validation process
        setCookie('tempPass',hash,1);
        var options = {
          height: "400px",
        };
        //re-display the routing slip
        PDFObject.embed('/drive/PDF-temp/route-'+$('#fileroute').val()+'.pdf', "#routeattachPage",options);
        qrClick = true; //set signed routing slip to true
      } else alert('QR Code or Password Fail!');
    }
  });
}
//function for closing the routing dialog box
function closeDialog(){
  brscanner.stop();scanner.stop();$('#app').hide();togglecam=false;brtogglecam=false;
}
//handle function when route-to-branch is clicked or routing feature is invoked
function routetoBranchApp(branch){
  brscanner.stop();scanner.stop();$('#app').hide();togglecam=false;brtogglecam=false;
  //check for file extension
  if (!$('#newfile').val().includes('.')) {alert ('File extension not recognized!'); return false;}
  //initialize objects to hide and show
  $('#routeBody').show();$('#routeattachPage').show();$('#disrouteTitle').hide();
  $('#divroyalCam').hide();$('#royalbutConfirm').hide();$('#routebutConfirm').show();
  //this is to establish exclusivity of the session and prevent inconsistent metadata to be sent
  if (window.location.toString().includes("/incoming")) { //when routing documents
    if (getCookie('viewBr') != "incomingroute") {
      alert('Multiple session opened! Repeat changes on metadata upon reloading...'); window.location.reload(); return;
    }
  } else if (window.location.toString().includes("/fileopen")) { //when opening files
    if (getCookie('viewBr') != "openroute") {
      alert('Multiple session opened! Repeat changes on metadata upon reloading...'); window.location.reload(); return;
    }
  }
  setCookie('tempPass','',1); //clear password cache
  $('#routeselBr').val(branch); //assign branch
  var arrRef = getCookie('arrRef');
  var arrEnc = getCookie('arrEnc');
  var todo = {filename:$('#fileroute').val(), refs:arrRef,encs:arrEnc};
  $('#disContRout').hide();
  //determine if the the routed document was previously routed (documents may be saved into the drive for staff action and later re-routed)
  $.ajax({
    type: 'POST',
    url: '/searchrefmonitor',
    data: todo,
    success: function(data){
      resData = JSON.parse(data);
      if (resData.result=='found') { //if previously routed but was saved into the drive and removed in the workflow
        $('#disContRout').show();$('#lbltmp').val(resData.file);setCookie('tmpRoutFile',resData.file,1);
        document.getElementById('chkboxRout').checked= true; $('#divSubject').hide();
        $('#lblContRout').html('Continue Previous Routing ? [Yes]'); //continue the previous routing slip or create a new routing slip
        document.getElementById('divCamPass').style.top="-20px";
        document.getElementById('routeBody').style="margin-top:-10px;";
      } else if (resData.result == 'routed') { //if currently within the routing workflow but not the originator of the document
        $('#disContRout').hide();$('#lbltmp').val($('#fileroute').val());
        document.getElementById('chkboxRout').checked= true; $('#divSubject').hide();
        document.getElementById('divCamPass').style.top="-20px";
        document.getElementById('routeBody').style="margin-top:-10px;";
      } else { //if currently within the routing workflow and the originator of the document
        $('#disContRout').hide();$('#lbltmp').val($('#fileroute').val());
        $('#divSubject').show();
        document.getElementById('divCamPass').style.top="-5px";
        document.getElementById('routeBody').style="margin-top:-20px;";
      }
      //alert(data);
      if (!$('#newfile').val().includes('.')) {alert ('File extension not recognized!'); return false;}
      $('#routeSubject').val($('#newfile').val().split('.')[0]);
      //display new or existing routing slip
      var options = { height: "400px" };
      PDFObject.embed('/drive/PDF-temp/route-'+$('#fileroute').val()+'.pdf', "#routeattachPage",options);
      $('#routeselBr').trigger("chosen:updated");
    }
  });
}

//Load when html renders
$(document).ready(function(){
  var disID = getCookie('me');
  //initialize qr scan and password buttons
  if ($('#toggleButCam').prop('checked')){
    $('#qrCamBut').html("<i class='fa fa-camera'></i>&nbsp;&nbsp;Scan QR Code&nbsp;");
    $('#passapp').hide(); valPass = false;
  }
  else{
    $('#qrCamBut').html("<i class='fa fa-pencil'></i>&nbsp;Sign w/ Password");
    brscanner.stop();scanner.stop();$('#app').hide();togglecam=false;brtogglecam=false;
  }
  //initialize all fields
  $("#routeselBr").chosen({
    //disable_search_threshold: 10,
    no_results_text: "Oops, nothing found!",
    width: "150px"
  });
  $("#routeselAct").chosen({
    no_results_text: "Oops, nothing found!",
    width: "230px"
  });
  //handle previous routing checkbox toggle
  $('#chkboxRout').on('change',function(event){
    var todo = {toggle:$('#chkboxRout').prop('checked').toString(), filename:$('#fileroute').val()};
    $.ajax({
      type: 'POST',
      url: '/togglepdfrout',
      data: todo,
      success: function(data){
        if ($('#chkboxRout').prop('checked')) {
          $('#lbltmp').val(getCookie('tmpRoutFile'));
          $('#divSubject').hide();$('#lblContRout').html('Continue Previous Routing ? [Yes]');
        }else {
          $('#lbltmp').val($('#fileroute').val());
          $('#divSubject').show();$('#lblContRout').html('Continue Previous Routing ? [No]');
        }
        //re-display new or existing routing slip when toggled
        var options = {height: "400px"};
        PDFObject.embed('/drive/PDF-temp/route-'+$('#fileroute').val()+'.pdf', "#routeattachPage",options);
      }
    });

  });
  //handle routing slip button clicked
  $('#butRoutSlip').on('click', function(event){
    routetoBranchApp()
  });
  //handle toggle QR Cam button
  $('#toggleButCam').on('change', function(event){
    if ($(this).prop('checked')){
      $('#qrCamBut').html("<i class='fa fa-camera'></i>&nbsp;&nbsp;Scan QR Code&nbsp;");
      $('#passapp').hide(); valPass = false;
    }
    else{
      $('#qrCamBut').html("<i class='fa fa-pencil'></i>&nbsp;Sign w/ Password");
      brscanner.stop();scanner.stop();$('#app').hide();togglecam=false;brtogglecam=false;
    }
  });
  //When password box keypress hits enter
  $('#verPass').keypress(function(e){
    if (e.which==13) {
      $('#passapp').hide(); valPass = false;
      let hash = new Hashes.SHA512().b64($('#verPass').val());
      submitQRPass(hash); $('#verPass').val('');
    }
  })
  //handle validate password click for routing slip
  $('#validatePass').on('click', function (event){
    $('#passapp').hide(); valPass = false;
    let hash = new Hashes.SHA512().b64($('#verPass').val());
    submitQRPass(hash); $('#verPass').val('');
  });
  //When password box keypress hits enter
  $('#verPassroyal').keypress(function(e){
    if (e.which==13) {
      brvalPass = false;
      let hash = new Hashes.SHA512().b64($('#verPassroyal').val());
      brsubmitQRPass(hash); $('#verPassroyal').val('');
    }
  })
  //handle validate password click for Manager's signature
  $('#validatePassroyal').on('click', function (event){
    brvalPass = false;
    let hash = new Hashes.SHA512().b64($('#verPassroyal').val());
    brsubmitQRPass(hash); $('#verPassroyal').val('');
  });

  $('#routeButCanc').on('click', function(event){
    closeDialog();
  });
  $('#routingTopClose').on('click', function(event){
    closeDialog();
  });
});
