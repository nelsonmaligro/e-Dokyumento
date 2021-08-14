
var valPass = false; var togglecam = false; var lastQRCode = "";
var scanner = new Instascan.Scanner({ video: document.getElementById('preview') });
scanner.addListener('scan', function (content, image) {
  submitQRPass(content);
});

function openCam(){
  if ($('#toggleButCam').prop('checked')){
    if (!togglecam){
      Instascan.Camera.getCameras().then(function (cameras) {
        if (cameras.length > 0) {
          scanner.start(cameras[0]);$('#app').show();togglecam=true;
          $('#passapp').hide(); valPass = false;
        }
      });
    }
  }else {
    if (!valPass){
      $('#passapp').show(); valPass = true; scanner.stop();$('#app').hide();togglecam=false;
    }
  }
}
$('#toggleButCam').on('change', function(event){
  openCam();
});
function submitQRPass(content){
  var hash = new Hashes.SHA512().b64(content); var branch= "N6"; var action= '6';
  if ($('#disLevel').val().toUpperCase()=='DEP') {branch = "N6"; action='1';}
  else branch = "Duty Admin";
  var todo = {filename:$('#fileroute').val(),monitfile:$('#fileroute').val(),user:getCookie('me'),hashval:hash, action:action,remark:'', branch:branch,subject:''};
  $.ajax({
    type: 'POST',
    url: '/scancode',
    data: todo,
    success: function(data){
      if (data=='successful') {
        lastQRCode = hash;
        $('#routeattachPage').hide();
        var options = {
          height: "400px",
        };
        PDFObject.embed('/drive/PDF-temp/route-'+$('#fileroute').val()+'.pdf', "#routeattachPage",options);
        scanner.stop();$('#app').hide();$('#passapp').hide(); valPass = false;togglecam=false;
        releasethisdoc();
      } else {
        alert('QR Code or Password Fail!');$('#verPass').val('');
      }
    }
  });
}
function closeDialog(){
  scanner.stop();$('#app').hide();$('#passapp').hide();togglecam=false; valPass=false;
}
//handle function for routing to branch
function routetoBranchApp(){
  var arrRef = getCookie('arrRef');
  var arrEnc = getCookie('arrEnc');
  var todo = {filename:$('#fileroute').val(), refs:arrRef,encs:arrEnc};
  $.ajax({
    type: 'POST',
    url: '/searchrefmonitor',
    data: todo,
    success: function(data){
      resData = JSON.parse(data);
      var options = {
        height: "400px",
      };
      PDFObject.embed('/drive/pdf-temp/route-'+$('#fileroute').val()+'.pdf', "#routeattachPage",options);
    }
  });
}
//select page
$('#selPage').on('change', function(event){
  pointMainPDF(parseInt($('#selPage').val(),10));
  var todo = {num:parseInt($('#selPage').val(),10)-1,filepath: $('#disPath').val(),user:getCookie('me')};
  if ($('#fileroute').val()!='empty'){
    $.ajax({
      type: 'GET',
      url: '/signpdf',
      data: todo,
      success: function(data){
        //alert(data);
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
//hnadle switch for sign and Release
$('#toggledate').change(function(event){
  if ($('#toggledate').prop('checked')){
    setCookie('noDate','true',1);
  } else {
    setCookie('noDate','false',1);
  }
});
//handle success buttons
$('#successbut').on('click', function(event){
  location.replace('/incoming');
});
function releasethisdoc(){
  var branch = 'Release';$('#overlay').show()
  if ($('#disLevel').val().toUpperCase()=="DEP") branch = 'N6'
  var fileroute = $('#fileroute');
  var user = getCookie('me');
  var arrComm = getCookie('arrComm');
  var todo = {comments:arrComm, hashval:lastQRCode, filepath:$('#disPath').val(), num:parseInt($('#selPage').val(),10)-1,fileroute: fileroute.val(), branch:branch, user:user};
  if (fileroute.val()!='empty'){
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
}
$('#butRelease1').on('click', async function(event){
  $('#disrouteTitle').show();routetoBranchApp();togglecam=false; valPass=false;
  $('#divroyalCam').show();//$('#royalbutConfirm').show();
  openCam();$('#routeattachPage').hide();
});
$('#butRelease2').on('click', async function(event){
  $('#disrouteTitle').show();routetoBranchApp();togglecam=false; valPass=false;
  $('#divroyalCam').show();//$('#royalbutConfirm').show();
  openCam();$('#routeattachPage').hide();
});
$('#butApprove').on('click', function(event){
  document.getElementById('canvasPDF').src = "/assets/signcanvas.html";
  $('#disContent').hide();$('#disFrame').show();
  $('#butApprove').hide();$('#butRelease2').hide();
  $('#divSign').show();$('#butReturn').hide();
  $('#divToggleSign').hide();$('#divToggledate').show();
});
$('#butCancelSign').on('click', function(event){
  $('#disContent').show();$('#disFrame').hide();
  $('#butApprove').show();$('#butRelease2').hide();
  $('#divSign').hide();$('#butReturn').show();
  $('#divToggleSign').show();$('#divToggledate').hide();
});
$('#verPass').keypress(function(e){
  if (e.which==13) submitQRPass($('#verPass').val());
});
//handle validate password click
$('#validatePass').on('click', function (event){
  submitQRPass($('#verPass').val());
});
$('#routeButCanc').on('click', function(event){
  closeDialog();
});
$('#routingTopClose').on('click', function(event){
  closeDialog();
});
//handle routing slip button clicked
$('#butRoutSlip').on('click', function(event){
  $('#divroyalCam').hide();$('#disrouteTitle').hide();$('#routeattachPage').show();
  routetoBranchApp();//$('#royalbutConfirm').hide();
});

$('#butReturn').on('click', function(event){
  returnToSender(true);
});
function returnToSender(disBool){
  var fileroute = $('#fileroute');$('#overlay').show()
  var user = getCookie('me');
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
}
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
        //alert(data);
        document.getElementById('canvasPDF').src = "/assets/signcanvas.html";
        //if (data=='successful')
        //  location.replace('/incoming');
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

  //initialize for DEP and CO
  setCookie('viewBr','incomingroute',1);
  if (window.location.toString().includes("/incoming")) setCookie('viewBr','incomingroute',1);
  else if (window.location.toString().includes("/fileopen")) setCookie('viewBr','openroute',1);
  //initialize
  setCookie('realPath',$('#disPath').val(),1);
  setCookie('fileAI',$('#newfile').val(),1);
  setCookie('noDate','true',1); setCookie('category',$('#disCateg').val(),1);
  if ($('#disLevel').val().toUpperCase()=="DEP"){
    $('#toggleRelease').bootstrapToggle('toggle');
    $('#butApprove').hide();$('#butRelease2').show();
  } else {
    $('#butApprove').show();$('#butRelease2').hide();
  }
  if ($('#disCateg').val().toUpperCase().includes('DISPOSITION') || $('#disCateg').val().toUpperCase().includes('DF'))
  $('#toggledate').bootstrapToggle('toggle');
  setCookie('arrRef',JSON.stringify([]));setCookie('arrEnc',JSON.stringify([]));setCookie('arrComm',JSON.stringify([]),1);
  queryDoc();//query document database to populate metadata
  if ($('#fileroute').val()=='empty') {
    togglePanelHide(true); $('#overlay').hide();//display spinner
  }

  updateSelectPage();

});
