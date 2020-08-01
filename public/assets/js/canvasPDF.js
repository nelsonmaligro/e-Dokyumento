var drivetmp = "/drive/PDF-temp/";
//Load the PDF
pdfjsLib.getDocument( drivetmp + getCookie('me') + '.pdf')
  .then(function(pdf){
    return pdf.getPage(1);
  }).then(function(page){
    renderPage(page)
  });
//handle render page into canvasPDF
function renderPage(page){
  var scale = 1.5;
  var viewport = page.getViewport({ scale: scale, });

  var canvas = document.getElementById('canvasPDF');
  var context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  var renderContext = {
    canvasContext: context,
    viewport: viewport
  };
  page.render(renderContext);
}
//Send Signature to Server
function submitSign(filepath,disX, disY){
  //var hash = new Hashes.SHA512().b64(pass);
  var canvas = document.getElementById('canvasPDF');
  var todo = {filepath:filepath, user:getCookie('me'), nodate:getCookie('noDate'), width:canvas.width, height:canvas.height, disX:disX, disY:disY};
  $.ajax({
    type: 'POST',
    url: '/signpdf',
    data: todo,
    success: function(data){
      if (data=='successful') {
        pdfjsLib.getDocument(drivetmp + getCookie('me') + '.res.pdf')
          .then(function(pdf){
            return pdf.getPage(1);
          }).then(function(page){
            renderPage(page)
          });
    } else alert('QR Code or Password Fail!');
    }
  });
}



//handle canvas signing
  let shiftX = 0;
  let shiftY = 0;
  ball.style.position = 'absolute';
  ball.style.zIndex = 1000;
  document.body.append(ball);

  document.addEventListener('mousedown',onDocMouseDown);
  document.addEventListener('mousemove',onDocMouseMove);

  function onDocMouseDown(event) {
    //moveAt(event.pageX, event.pageY);
    $('#ballImg').show();
    shiftX = event.clientX - ball.getBoundingClientRect().left;
    shiftY = event.clientY - ball.getBoundingClientRect().top;
    $('#disX').val(event.pageX.toString());  $('#disY').val(event.pageY.toString());
    document.removeEventListener('mousemove', onDocMouseMove);
    //submitSign('pass','/drive/PDF-temp/NOC DF_page-1.pdf',event.pageX, event.pageY);
  }

  function onDocMouseMove(event) {

    docMoveAt(event.pageX, event.pageY);
  }
  function docMoveAt(pageX, pageY) {
    ball.style.left = pageX - shiftX + 'px';
    ball.style.top = pageY - shiftY + 'px';
  }

  ball.onmousedown = function(event) {
    let shiftX = event.clientX - ball.getBoundingClientRect().left;
    let shiftY = event.clientY - ball.getBoundingClientRect().top;

    function moveAt(pageX, pageY) {
      ball.style.left = pageX - shiftX + 'px';
      ball.style.top = pageY - shiftY + 'px';
    }
    moveAt(event.pageX, event.pageY);

    function onMouseMove(event) {
      moveAt(event.pageX, event.pageY);
      ball.hidden = false;
    }
    document.addEventListener('mousemove', onMouseMove);

    ball.onmouseup = function(event) {
      submitSign( drivetmp + getCookie('me') + '.pdf',event.pageX - shiftX, event.pageY - shiftY);
      $('#ballImg').hide();
      document.removeEventListener('mousemove', onMouseMove);
      ball.onmouseup = null;
    };

  };
  ball.ondragstart = function() {
    return false;
  };
 $(document).ready(function(){
   $('#ballImg').prop('src',"/images/"+getCookie('me')+".svg");
 });
