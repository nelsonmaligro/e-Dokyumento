///For Branch Signing Documnent
var brscanner = new Instascan.Scanner({ video: document.getElementById('preview') });
brscanner.addListener('scan', function (content, image) {
      brsubmitQRPass(content);
});
var brtogglecam = false; var brvalPass = false;
function openCamBranch(){
        if ($('#toggleButCamRoyal').prop('checked')){
          if (!brtogglecam){
            Instascan.Camera.getCameras().then(function (cameras) {
                   if (cameras.length > 0) {
                     brscanner.start(cameras[0]);$('#passapproyal').hide();
                     $('#app').show();brtogglecam=true;brvalPass = false;
                   }
                 });
          }
        }else {
          if (!brvalPass){
            $('#passapproyal').show(); $('#verPassroyal').focus(); brvalPass = true;$('#app').hide();brscanner.stop();brtogglecam = false;
          }
        }
}
function brsubmitQRPass(content){
  $('#overlay').show();
  var hash = new Hashes.SHA512().b64(content);
  var fileroute = $('#fileroute');
  var realpath = getCookie('realpath');
  var user = getCookie('me');
  //let buffCont = new Buffer(content);
  var todo = {hashval:hash, filepath:$('#disPath').val(), crtx:window.btoa(content), realpath:realpath, num:parseInt($('#selPageSign').val(),10)-1,fileroute: fileroute.val(), user:user};
  if (fileroute.val()!='empty'){
    $.ajax({
      type: 'POST',
      url: '/mergesigndoc',
      data: todo,
      success: function(data){
        if (data!='fail'){
            closeDialog();$('#routemodClose').click();
            setCookie('fileOpn','/drive/PDF-temp/'+data,1);
            setCookie('fileAI',data,1); $('#passapproyal').hide();
            $('#app').hide();sleep(10000);
            triggerButFile();$('#butCancelSign').click();
        } else {alert('QR Code or Password Invalid!'); $('#verPassroyal').val('');}
        $('#overlay').hide();
      }
    });
  }
}

//For routing slip
var togglecam = false; var qrClick = false;var valPass = false;
var scanner = new Instascan.Scanner({ video: document.getElementById('preview') });
      scanner.addListener('scan', function (content, image) {
          submitQRPass(content);
            scanner.stop();$('#app').hide();togglecam=false;
      });

function openCam(){
  if ($('#toggleButCam').prop('checked')){
    if (!togglecam){
      Instascan.Camera.getCameras().then(function (cameras) {
             if (cameras.length > 0) {
               scanner.start(cameras[0]);$('#app').show();togglecam=true;
             }
           });
    }else {
        scanner.stop();$('#app').hide();togglecam=false;
    }
  }else {
    if (!valPass){
        $('#passapp').show(); valPass = true; $('#verPass').focus();
      } else {
        $('#passapp').hide(); valPass = false;
      }
  }
}

function submitQRPass(content){
  let viewBr = 'incoming';
  if (window.location.toString().includes("/fileopen")) viewBr = 'openroute';
  var hash = new Hashes.SHA512().b64(content);
  var todo = {view:viewBr, filename:$('#fileroute').val(),monitfile:$('#lbltmp').val(),user:getCookie('me'),hashval:hash, action:$('#routeselAct').val(),remark:$('#routeRemark').val(), branch:$('#routeselBr').val(),subject:$('#routeSubject').val()};
  $.ajax({
    type: 'POST',
    url: '/scancode',
    data: todo,
    success: function(data){
      if (data=='successful') {
        setCookie('tempPass',hash,1);
        var options = {
          height: "400px",
        };
      PDFObject.embed('/drive/PDF-temp/route-'+$('#fileroute').val()+'.pdf', "#routeattachPage",options);
      qrClick = true;
    } else alert('QR Code or Password Fail!');
    }
  });
}
function closeDialog(){
  brscanner.stop();scanner.stop();$('#app').hide();togglecam=false;brtogglecam=false;
}
//handle function for routing to branch
function routetoBranchApp(branch){
  brscanner.stop();scanner.stop();$('#app').hide();togglecam=false;brtogglecam=false;
  //check for file extension
  if (!$('#newfile').val().includes('.')) {alert ('File extension not recognized!'); return false;}
  //initialize objects to hide and show
  $('#routeBody').show();$('#routeattachPage').show();$('#disrouteTitle').hide();
  $('#divroyalCam').hide();$('#royalbutConfirm').hide();$('#routebutConfirm').show();
  //alert(getCookie('viewBr'));
  if (window.location.toString().includes("/incoming")) {
    if (getCookie('viewBr') != "incomingroute") {
      alert('Multiple session opened! Repeat changes on metadata upon reloading...'); window.location.reload(); return;
    }
  } else if (window.location.toString().includes("/fileopen")) {
    if (getCookie('viewBr') != "openroute") {
      alert('Multiple session opened! Repeat changes on metadata upon reloading...'); window.location.reload(); return;
    }
  }
  setCookie('tempPass','',1);
  //alert(branch);
  $('#routeselBr').val(branch);
//  $('#routeselBr').prop('value')==branch;

  var arrRef = getCookie('arrRef');
  var arrEnc = getCookie('arrEnc');
  var todo = {filename:$('#fileroute').val(), refs:arrRef,encs:arrEnc};
  $('#disContRout').hide();


  $.ajax({
    type: 'POST',
    url: '/searchrefmonitor',
    data: todo,
    success: function(data){

      resData = JSON.parse(data);
      //alert(resData.result);
      if (resData.result=='found') {
        $('#disContRout').show();$('#lbltmp').val(resData.file);setCookie('tmpRoutFile',resData.file,1);
        document.getElementById('chkboxRout').checked= true; $('#divSubject').hide();
        $('#lblContRout').html('Continue Previous Routing ? [Yes]');
        document.getElementById('divCamPass').style.top="-20px";
        document.getElementById('routeBody').style="margin-top:-10px;";
      } else if (resData.result == 'routed') {
          $('#disContRout').hide();$('#lbltmp').val($('#fileroute').val());
          document.getElementById('chkboxRout').checked= true; $('#divSubject').hide();
          document.getElementById('divCamPass').style.top="-20px";
          document.getElementById('routeBody').style="margin-top:-10px;";
      } else {
        $('#disContRout').hide();$('#lbltmp').val($('#fileroute').val());
        $('#divSubject').show();
        document.getElementById('divCamPass').style.top="-5px";
        document.getElementById('routeBody').style="margin-top:-20px;";
      }
      //alert(data);
      if (!$('#newfile').val().includes('.')) {alert ('File extension not recognized!'); return false;}
      $('#routeSubject').val($('#newfile').val().split('.')[0]);

      var options = {
        height: "400px",
      };

      PDFObject.embed('/drive/PDF-temp/route-'+$('#fileroute').val()+'.pdf', "#routeattachPage",options);
      $('#routeselBr').trigger("chosen:updated");
    }
  });
}


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
        var options = {
          height: "400px",
        };
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
//handle validate password click for routing slip
$('#verPass').keypress(function(e){
  if (e.which==13) {
    $('#passapp').hide(); valPass = false;
    submitQRPass($('#verPass').val()); $('#verPass').val('');
  }
})
$('#validatePass').on('click', function (event){
    $('#passapp').hide(); valPass = false;
    submitQRPass($('#verPass').val()); $('#verPass').val('');
});
//handle validate password click for OIC signature
$('#verPassroyal').keypress(function(e){
  if (e.which==13) {
    brvalPass = false;brsubmitQRPass($('#verPassroyal').val()); $('#verPassroyal').val('');
  }
})
$('#validatePassroyal').on('click', function (event){
    brvalPass = false;brsubmitQRPass($('#verPassroyal').val()); $('#verPassroyal').val('');
});

$('#routeButCanc').on('click', function(event){
  closeDialog();
});
$('#routingTopClose').on('click', function(event){
  closeDialog();
});

  //$('#routeselAct').trigger("chosen:updated");
});
