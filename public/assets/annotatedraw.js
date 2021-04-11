//populate the page selector and updaet the iframe for document signing
var drawclick = false; var mainfiledis = true; var togglepage = false;
function updateSelectPageAnno(){
  //populate select page
  loadPDF($('#disPath').val()).then(function(res){
    $('#selPageDraw').empty();
    for (var i=1; i<=res; i++){
      $('#selPageDraw').append("<option value='"+i.toString()+"'>"+i.toString()+"</option>");
    }
    $("#selPageDraw").chosen({
        no_results_text: "Oops, nothing found!",
        width: "60px"
    });
    $('#selPageDraw').trigger("chosen:updated");
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
  var disID = getCookie('me');setCookie('newpathdraw',$('#disPath').val(), 1);
    updateSelectPageAnno();

  //handle click on line annotate
  function invokeAnnotate(){
    if (!drawclick) {
      if (togglepage) {
        loadPDF(getCookie('newpathdraw')).then(function(res){
          $('#selPageDraw').empty();
          for (var i=1; i<=res; i++){ $('#selPageDraw').append("<option value='"+i.toString()+"'>"+i.toString()+"</option>");}
          $("#selPageDraw").chosen({width: "60px"}); $('#selPageDraw').trigger("chosen:updated");
        });
       //get first page and load to Canvas PDF
       var todo = {num:0,filepath: $('#disPath').val(),user:getCookie('me')};
       $.ajax({
           type: 'GET',
           url: '/signpdf',
           data: todo,
           success: function(data){
             document.getElementById('canvasPDF').src = "/assets/drawcanvas.html";
             $('#disAnnotate2').show();drawclick = true;
             $('#disContent').hide();$('#disFrame').show();
           }
         });
      } else {
        document.getElementById('canvasPDF').src = "/assets/drawcanvas.html";
        $('#disAnnotate2').show();drawclick = true;
        $('#disContent').hide();$('#disFrame').show();
      }
      $('#butReturn').hide();$('#butRelease2').hide();$('#divToggleSign').hide();$('#butApprove').hide();
    }
  }
  //handle annotate draw click
    $('#annoDraw').on('click',function(event){
      setCookie('drawtool','draw',1);
      invokeAnnotate();  $('#disContentMobile').hide();
      window.localStorage.setItem('message','draw');
    });
    //handle annotate text click
    $('#annoText').on('click',function(event){
      setCookie('drawtool','text',1);
      invokeAnnotate();  $('#disContentMobile').hide();
      window.localStorage.setItem('message','text');
    });
    //handle annotate erase click
    $('#annoErase').on('click',function(event){
      setCookie('drawtool','erase',1);
      invokeAnnotate();  $('#disContentMobile').hide();
      window.localStorage.setItem('message','erase');
    });
    //cancel draw incoming branch
    $('#butDrawCancel').on('click', function(event){
      $.ajax({
         type: 'POST',
         url: '/cancelsign',
         success: function(data) {
           if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))  {
             $('#disAnnotate2').hide();drawclick = false;
             $('#disContentMobile').show();$('#disContent').hide();$('#disFrame').hide();
               if (mainfiledis) {
                 $('#butReturn').show();$('#butRelease2').show();$('#divToggleSign').show();$('#butApprove').show();
               }
           } else {
             $('#disAnnotate2').hide();drawclick = false;
             $('#disContent').show();$('#disFrame').hide();
               if (mainfiledis) {
                 $('#butReturn').show();$('#butRelease2').show();$('#divToggleSign').show();$('#butApprove').show();
               }
           }
         }
       });
    });
    //Send drawing to server
    $('#butDrawSave').on('click', function(event) {
      $('#overlay').show();
        let dataImage = window.localStorage.getItem("drawimage");
        //let b64image = "data:image/png;base64," + dataImage;
        var formData = new FormData();
        formData.append("image", new Blob([ dataImage ], {type: "image/png"}),getCookie('me')+'.drw.png');
        $.ajax({
          type: 'POST',
          url: '/drawpdf',
          processData: false,
          contentType: false,
          async:false,
          cache:false,
          mimeTypes: "multipart/form-data",
          data: formData,
          success: function(data){
            if (mainfiledis) { //if main file
              var fileroute = $('#fileroute');
              var user = getCookie('me');
              var todo = {num:parseInt($('#selPageDraw').val(),10)-1,fileroute: fileroute.val(), user:user};
                $.ajax({
                  type: 'POST',
                  url: '/mergedrawdoc',
                  data: todo,
                  success: function(data){
                        setCookie('fileOpn','/drive/PDF-temp/'+data,1);
                        setCookie('fileAI',data,1);
                        $('#disAnnotate2').hide();drawclick = false;
                        $('#disContent').show();$('#disFrame').hide();
                        $('#butReturn').show();$('#butRelease2').show();$('#divToggleSign').show();
                        location.replace('/incoming/'+data);
                    $('#overlay').hide();
                  }
                });
            } else { //if enclosure
              let splitFile = $('#disPath').val().split('/'); let fileroute = splitFile[splitFile.length-1];
              var realpath = getCookie('realpath');
              var user = getCookie('me');
              var todo = {filepath:$('#disPath').val(), origenc:getCookie('origEncFile'), origfile: $('#fileroute').val(), realpath:realpath, num:parseInt($('#selPageDraw').val(),10)-1, user:user};
                $.ajax({
                  type: 'POST',
                  url: '/mergedrawdocenc',
                  data: todo,
                  success: function(data){
                    if (data=='failref')  alert('Sorry! Annotation is only allowed for Enclosures.');
                    else {
                        $('#disPath').val('/drive/PDF-temp/'+data);
                        PDFObject.embed('/drive/PDF-temp/'+data, "#pdf_view",{page:parseInt($('#selPageDraw').val(),10)-1});
                        revFile = getCookie('origEncFile');
                        revFile = revFile.replace(/ /g,"___");revFile = revFile.replace(/\./g,'---');
                        delEncRef('enc',revFile,'arrEnc');
                        updRefEncCookie('arrEnc', data, realpath);
                        newdata = data.replace(/ /g,"___");newdata = newdata.replace(/\./g,'---');
                        newpath = realpath.replace(/ /g,"___");newpath=newpath.replace(/\./g,"z--");
                        $('#divEnc').append("<div id='enc-"+newdata+"'>&nbsp;&nbsp;&nbsp;&nbsp;<button type='button' onclick=delEncRef('enc','"+newdata+"','arrEnc') class='btn btn-danger btn-sm fa fa-times'></button><button type='button' class='btn btn-link btn-sm' onclick=dispAttach('"+newpath+"','"+newdata+"')>"+data+"</button></div>");
                        $('#disAnnotate2').hide();drawclick = false;
                        $('#disContent').show();$('#disFrame').hide();
                        //$('#butReturn').show();$('#butRelease2').show();$('#divToggleSign').show();
                      }
                      $('#overlay').hide()
                  }
                });
            }
          }
        });




    });
    //select page
    $('#selPageDraw').on('change', function(event){
      pointMainPDF(parseInt($('#selPageDraw').val(),10));
      var todo = {num:parseInt($('#selPageDraw').val(),10)-1,filepath: $('#disPath').val(),user:getCookie('me')};
        $.ajax({
          type: 'GET',
          url: '/signpdf',
          data: todo,
          success: function(data){
            document.getElementById('canvasPDF').src = "/assets/drawcanvas.html";
          }
        });
    });
});
