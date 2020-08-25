var scanner = new Instascan.Scanner({ video: document.getElementById('preview') });
scanner.addListener('scan', function (content, image) {
  submitQRPass(content);
});

function openCam(){
      Instascan.Camera.getCameras().then(function (cameras) {
        if (cameras.length > 0) {
          scanner.start(cameras[0]);
        }
      });
}

function submitQRPass(content){
  alert(content);
  /*
  var hash = new Hashes.SHA512().b64(content); var branch= "N6"; var action= '6';
  if ($('#disLevel').val().toUpperCase()=='DEP') {branch = "N6"; action='1';}
  else if ($('#disLevel').val().toUpperCase()=='EAGM') {branch = "G.M."; action='1';}
  else if ($('#disLevel').val().toUpperCase()=='DUTYADMIN') branch = "Duty Admin";
  else branch = "Receiving";
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
  */
}
function closeDialog(){
  scanner.stop();
}

//Load when html renders
$(document).ready(function(){
  openCam();
});
