var drivetmp = "/drive/PDF-temp/";
var mousePressed = false;
var lastX, lastY, lastXTxt;
var ctx, lastPosX, lastPosY;
let pattern;
var mode = 'draw';

window.addEventListener("storage", message_receive);
//Load the PDF
pdfjsLib.getDocument( drivetmp + getCookie('me') + '.pdf')
.then(function(pdf){
  return pdf.getPage(1);
}).then(function(page){
  renderPage(page)
});
canvas = document.getElementById('canvasPDF');
ctx = canvas.getContext("2d");
ctx.globalCompositeOperation = "source-atop";

// For Touhscreen script
var touchX,touchY;
if (ctx) {
    // React to touch events on the canvas
    canvas.addEventListener('touchstart', sketchpad_touchStart, false);
    canvas.addEventListener('touchmove', sketchpad_touchMove, false);
    canvas.addEventListener('touchend', sketchpad_touchEnd, false);
}
function sketchpad_touchStart(e) {
  getTouchPos(e);
  mousePressed = true;
  Draw(touchX, touchY, false);
  // Prevents an additional mousedown event being triggered
  event.preventDefault();
}
function sketchpad_touchEnd() {
    mousePressed = false;
    if (mode == 'text') {
      if ($('#inputText').val().trim()!=''){

        ctx.fillStyle = "white";
        ctx.fillRect(lastPosX - 2, lastPosY + 3, ($('#inputText').width() * 1.08), 26);
        ctx.fillStyle = "blue";
        ctx.font = "18px Arial";
        ctx.fillText($('#inputText').val(), lastPosX, lastPosY + 22);
        $('#floatText').hide();
        submitSign(drivetmp + getCookie('me') + '.pdf');
      }
      $('#inputText').val('');  $('#inputText').width(1);
      $('#floatText').css({top: touchY, left: touchX - $('#inputText').width()});
      $('#floatText').width($('#inputText').width());
      //alert(lastXTxt);
      $('#floatText').show();$('#inputText').focus();
      lastPosX = $('#floatText').position().left; lastPosY = $('#floatText').position().top;

    } else submitSign(drivetmp + getCookie('me') + '.pdf');
}

function sketchpad_touchMove(e) {
  getTouchPos(e);
  Draw(touchX, touchY, true);
  // Prevent a scrolling action as a result of this touchmove triggering.
  event.preventDefault();
}

function getTouchPos(e) {
  if (!e)
  var e = event;
  if (e.touches) {
    if (e.touches.length == 1) { // Only deal with one finger
      var touch = e.touches[0]; // Get the information for finger #1
      touchX=touch.pageX-touch.target.offsetLeft;
      touchY=touch.pageY-touch.target.offsetTop;
    }
  }
}


//for mouse pointer
$('#canvasPDF').mousedown(function (e) {
  mousePressed = true;
  Draw(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top, false);
});

$('#canvasPDF').mousemove(function (e) {
  if (mousePressed) {
    Draw(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top, true);
  } //else  moveAt(e.pageX, e.pageY);
});

$('#canvasPDF').mouseup(function (e) {
  mousePressed = false;
  if (mode == 'text') {
    if ($('#inputText').val().trim()!=''){
      ctx.fillStyle = "white";
      ctx.fillRect(lastPosX - 2, lastPosY + 3, ($('#inputText').width() * 1.08), 26);
      ctx.fillStyle = "blue";
      ctx.font = "18px Arial";
      ctx.fillText($('#inputText').val(), lastPosX, lastPosY + 22);
      $('#floatText').hide();
      submitSign(drivetmp + getCookie('me') + '.pdf');
    }
    $('#inputText').val('');  $('#inputText').width(0);
    $('#floatText').css({top: e.pageY, left: e.pageX - $('#inputText').width()});
    $('#floatText').width($('#inputText').width());
    //alert(lastXTxt);
    $('#floatText').show();$('#inputText').focus();
    lastPosX = $('#floatText').position().left; lastPosY = $('#floatText').position().top;

  } else submitSign(drivetmp + getCookie('me') + '.pdf');
});
$('#canvasPDF').mouseleave(function (e) {
  mousePressed = false;
});
//handle delete file
$('#inputText').keypress(function(e){
  if (e.which != 13) {
    let lenVal = $('#inputText').val().length;
    //$('#inputText').width((lenVal + 2)*8);
  } else {
    //alert($('#floatText').position().left);
    ctx.fillStyle = "white";
    ctx.fillRect($('#floatText').position().left - 2, $('#floatText').position().top + 3, ($('#inputText').width() * 1.08), 26);
    ctx.fillStyle = "blue";
    ctx.font = "18px Arial";
    ctx.fillText($('#inputText').val(), $('#floatText').position().left, $('#floatText').position().top + 22);
    $('#floatText').hide();
    submitSign(drivetmp + getCookie('me') + '.pdf');
    //alert($('#inputText').val());
  }
});


function Draw(x, y, isDown) {
  if (isDown) {
    ctx.beginPath();
    if (mode == 'draw') {
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = '5';
    } else if (mode == 'erase') {
      ctx.strokeStyle = pattern;
      ctx.lineWidth = '15';
    }
    if (mode!='text'){
      ctx.lineJoin = "round";
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.closePath();
      ctx.stroke();
    }

  }
  lastX = x; lastY = y;
}
function message_receive(ev) {
  //alert(ev.newValue);
  if (ev.key == 'message') {
    if (ev.newValue=='draw') {
      mode = 'draw';document.getElementById('canvasPDF').style.cursor = "url('/images/pen.cur'),auto";
    } else if (ev.newValue=='erase') {
      mode = 'erase';document.getElementById('canvasPDF').style.cursor = "url('/images/eraser.cur'),auto";
    } else if (ev.newValue=='text') {
      mode = 'text';document.getElementById('canvasPDF').style.cursor = "text";
    }
  }
}


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
function b64ToUint8Array(b64Image) {
  var img = atob(b64Image.split(',')[1]);
  var img_buffer = [];
  var i = 0;
  while (i < img.length) {
    img_buffer.push(img.charCodeAt(i));
    i++;
  }
  return new Uint8Array(img_buffer);
}
//Send drawing to server
function submitSign(filepath) {
  var canvas = document.getElementById('canvasPDF');
  var b64Image = canvas.toDataURL('image/png');
  b64Image.replace(/^data:image\/(png|jpg);base64,/, "");
  //var u8Image  = b64Image.replace(/^data:image\/(png|jpg);base64,/, "");
  window.localStorage.setItem("drawimage",b64Image);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


//AUTO RESIZE
$.fn.textWidth = function(_text, _font){//get width of text with font.  usage: $("div").textWidth();
  var fakeEl = $('<span>').hide().appendTo(document.body).text(_text || this.val() || this.text()).css({font: _font || this.css('font'), whiteSpace: "pre"}),
  width = fakeEl.width();
  fakeEl.remove();
  return width;
};

$.fn.autoresize = function(options){//resizes elements based on content size.  usage: $('input').autoresize({padding:10,minWidth:0,maxWidth:100});
  options = $.extend({padding:10,minWidth:0,maxWidth:10000}, options||{});
  $(this).on('input', function() {
    $(this).css('width', Math.min(options.maxWidth,Math.max(options.minWidth,$(this).textWidth() + options.padding)));
  }).trigger('input');
  return this;
}
$(document).ready(function(){
  $('#overlay').show();
  if (getCookie('drawtool')=='draw') {
    mode = 'draw'; document.getElementById('canvasPDF').style.cursor = "url('/images/pen.cur'),auto";
  } else if (getCookie('drawtool')=='erase') {
    mode = 'erase';document.getElementById('canvasPDF').style.cursor = "url('/images/eraser.cur'),auto";
  }  else if (getCookie('drawtool')=='text') {
    mode = 'text';document.getElementById('canvasPDF').style.cursor = "text";
  }

  sleep(5000).then(()=>{
    $('#overlay').hide();
    pattern = ctx.createPattern(document.getElementById('canvasPDF'), "no-repeat");
  });
  //}
  //initialize input text
  $("#inputText").autoresize({padding:2,minWidth:0,maxWidth:5000});
});
