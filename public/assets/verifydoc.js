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
  var todo = {content:content};
  $.ajax({
    type: 'POST',
    url: '/scanqrdoc',
    data: todo,
    success: function(data){
      sound = document.getElementById('soundNoti'); sound.play();
      if (data!='fail') {
        let docRes = JSON.parse(data);
        $('#alert').html('<div class="alert alert-success" style="left:-300px;width:1120px;text-align:center;" role="alert"> Document Verified! Record Exist. <br>' +
        '<table cellspacing="15" cellpadding="5"><tr syle="padding:0;"><td style="border:1px solid black;">Timestamp:' + docRes.deyt + '</td><td style="border:1px solid black;">Signee:' + docRes.name + '</td><td style="border:1px solid black;">Document:' + docRes.file + '</td></tr></table></div>');

      } else {
        $('#alert').html('<div class="alert alert-danger" style="width:660px;text-align:center;" role="alert"> Invalid Document! No Record Exist.</div>');

      }
    }
  });
}
function closeDialog(){
  scanner.stop();
}

//Load when html renders
$(document).ready(function(){
  openCam();
});
