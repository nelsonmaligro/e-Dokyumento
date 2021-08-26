var _PDF_DOC,
_CURRENT_PAGE,
_TOTAL_PAGES,
_PAGE_RENDERING_IN_PROGRESS = 0,
_CANVAS = document.querySelector('#pdfPage');

//Function for deleting files from References and enclosures
async function delEncRef(paramDiv,file, paramCookie){
  $('#'+paramDiv+'-'+file+'').remove(); //delete the file from the html sidebar (references and enclosure)
  //return pre-formatted characters to its original characters
  newEnc = file.replace(/___/g," ");newEnc = newEnc.replace(/u--/g,'(');newEnc = newEnc.replace(/v--/g,')');newEnc = newEnc.replace(/---/g,'.');
  var arrEnc = []; var disEnc = JSON.parse(getCookie(paramCookie));
  if (disEnc.length > 0) arrEnc = disEnc;
  //remove from the array and update enclosure cookie
  var obj = arrEnc.find(({file})=> file === newEnc);
  var resArr = arrEnc.filter(function(res) {return res!=obj; });
  await setCookie(paramCookie,JSON.stringify(resArr),1);
  return;
};
//function to display attachments into the pdf viewer
function dispAttach(disDir, disFile){
  selChose();
  //if Directory selected is not any of the page numbers in the main page....the path of the attachment (ref and enc) is selected
  if (disDir!='Page'){
    togglePanelHide(true);$('#overlay').show()//display spinner
    //return pre-formatted characters to its original characters
    disDir=disDir.replace(/x--/g,':');disDir=disDir.replace(/u--/g,'(');disDir=disDir.replace(/v--/g,')');disDir=disDir.replace(/z--/g,'.');disDir=disDir.replace(/---/g,"/");disDir=disDir.replace(/___/g," ");
    newFile = disFile.replace(/___/g," ");newFile = newFile.replace(/u--/g,'(');newFile = newFile.replace(/v--/g,')');newFile = newFile.replace(/---/g,'.');setCookie('origEncFile',newFile,1);
    setCookie('realpath',disDir + '/',1);
    var todo = {path:disDir + '/',file:newFile};
    //query server to display the selected attachment file
    $.ajax({
      type: 'POST',
      url: '/showfile',
      data: todo,
      success: function(data){
        let newData = JSON.parse(data);
        PDFObject.embed(newData.filepath, "#pdf_view"); //display attachment file to PDF
        setCookie('newpathdraw',newData.filepath, 1);
        togglePanelHide(false);$('#overlay').hide()//display spinner
        //if AGM ang GM (executive branches) reload the main page for signing and approval
        if (newData.level.toUpperCase()=='EXECUTIVE') {
          $('#divToggleSign').hide();
          $('#butApprove').show();$('#butRelease2').hide();$('#butReturn').hide();
          $('#selPage').empty();$('#butCancelSignEnc').show();
          loadPDF(newData.filepath).then(function(res){
            $('#selPage').empty();
            for (var i=1; i<=res; i++) {$('#selPage').append("<option value='"+i.toString()+"'>"+i.toString()+"</option>");}
            $('#selPage').trigger("chosen:updated");
          });
          $('#disPath').val(newData.filepath);
          var todo = {num:0,filepath: newData.filepath,user:getCookie('me')};
          //query the server to update the signing canvas page
          $.ajax({
            type: 'GET',
            url: '/signpdf',
            data: todo,
            success: function(data){
              document.getElementById('canvasPDF').src = "/assets/signcanvas.html";
            }
          });
        }
        //check if mobile browser
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))  {
          document.getElementById('disContent').style.display="none";
          document.getElementById('disContentMobile').style.display="";
          loadPDFtoCanvas(newData.filepath);
        }
      }
    });
    //determine of page is toggled for main or attachment. This is for the annotation
    if (mainfiledis) togglepage = true; //variable is in annotate draw js
    else togglepage = false;
    mainfiledis = false;
    //hide annotation option if not executive branch...only the executive branch can annotate attachment files
    if ($('#disLevel').val().toUpperCase()!="EXECUTIVE") $('#disAnnotate').hide();
  } else { //else if the page number is selected then display the specific page
    var num = disFile.replace('Page_','');
    PDFObject.embed(getCookie('fileOpn'), "#pdf_view",{page:num});
  }

}
//Function for adding files from modal to Reference and Enclosure
function showFile(disFile, disDir, flag){
  //return pre-formatted characters to its original characters
  newFile = disFile.replace(/___/g," ");newFile = newFile.replace(/u--/g,'(');newFile = newFile.replace(/v--/g,')');newFile = newFile.replace(/---/g,'.');
  var olddisDir = disDir;
  disDir=disDir.replace(/x--/g,':');disDir=disDir.replace(/u--/g,'(');disDir=disDir.replace(/v--/g,')');disDir=disDir.replace(/z--/g,'.');disDir=disDir.replace(/---/g,"/");disDir=disDir.replace(/___/g," ");
  if (flag=='refenc'){//if adding of file is clicked from the attachment (reference and enclosuse) add button
    if (!newFile.includes('~')) {
      if ($('#refTrue').val()==='true'){
        updRefEncCookie('arrRef', newFile, disDir); //update reference cookie
        $('#divRef').append("<div id='ref-"+disFile+"'>&nbsp;&nbsp;&nbsp;&nbsp;<button type='button' onclick=delEncRef('ref','"+disFile+"','arrRef') class='btn btn-danger btn-sm fa fa-times'></button><button type='button' class='btn btn-link btn-sm' onclick=dispAttach('"+olddisDir+"','"+disFile+"')>"+newFile+"</button></div>");
      } else {
        updRefEncCookie('arrEnc', newFile, disDir); //update enclosurer cookie
        $('#divEnc').append("<div id='enc-"+disFile+"'>&nbsp;&nbsp;&nbsp;&nbsp;<button type='button' onclick=delEncRef('enc','"+disFile+"','arrEnc') class='btn btn-danger btn-sm fa fa-times'></button><button type='button' class='btn btn-link btn-sm' onclick=dispAttach('"+olddisDir+"','"+disFile+"')>"+newFile+"</button></div>");
      }
    } else {
      alert('Invalid File');
    }

  }else {//if opening of file is clicked from "File Open" command
    togglePanelHide(true);$('#overlay').show()//display spinner
    if (disDir.substring(disDir.length - 1) != "/") disDir = disDir + '/';
    var todo = {path:disDir,file:newFile};
    //query server to open the file and store metadata
    $.ajax({
      type: 'POST',
      url: '/fileopen',
      data: todo,
      success: function(data){
        togglePanelHide(false);$('#overlay').hide()//display spinner
        handleOpenFile(data); //go to openfile.js
        //toggle digital signature verification
        let parseData = JSON.parse(data);
        parseData.forEach(function (disData){
          let signature = disData.signres;
          if (signature){
            if (signature.message!='signed'){
              $('#disDigCert').hide();
            } else {
              //display certificate information
              $('#disDigCert').show();
              setCookie('digitalcert', JSON.stringify(signature),1);
              if (signature.verified) {
                $('#disDigCert').html('<button  id="digcertDraw" class="btn btn-sm btn-success" type="button" onclick="displaycertinfo()" > <i class="fa fa-check"></i> Valid Digital Signature </button>&nbsp;');
              } else {
                $('#disDigCert').html('<button  id="digcertDraw" class="btn btn-sm btn-danger" type="button" onclick="displaycertinfo()" > <i class="fa fa-times"></i> Invalid Digital Signature </button>&nbsp;');
              }
            }
          }
        });
        //check if mobile browser
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))  {
          document.getElementById('disContent').style.display="none";
          document.getElementById('disContentMobile').style.display="";
          loadPDFtoCanvas($('#disPath').val());
        }
      }
    });
  }
  $("#butmodClose").click();
}
//expand directory
function showDir(path,flag){
  //return pre-formatted characters to its original characters
  classPath = path.replace(/___/g," ");classPath = classPath.replace(/u--/g,"(");classPath = classPath.replace(/v--/g,")");classPath = classPath.replace(/x--/g,":");classPath=classPath.replace(/z--/g,".");classPath = classPath.replace(/---/g,"/");
  classPath=classPath+"/";
  var todo = {path:classPath};
  $.ajax({
    type: 'POST',
    url: '/browsedrive',
    data: todo,
    success: function(data){
      var arrObj = JSON.parse(data);
      var dirs = arrObj['dirs'];
      var files = arrObj['files'];
      //update Modal
      $('#'+path+'').empty();
      for (var i=0; i < dirs.length; i++) //update directory container
      {
        //replace special characters to prevent error in the html embedding
        classDirs = dirs[i].replace(/ /g,"___");classDirs=classDirs.replace(/\(/g,"u--");classDirs=classDirs.replace(/\)/g,"v--");classDirs=classDirs.replace(/\./g,"z--");
        $('#'+path+'').append("<li><a onclick=showDir('"+path+"---"+classDirs+"','"+flag+"')  href='#'>" + dirs[i] +"</a><ul><div id='"+path+"---"+classDirs+"'></div></ul></li>");
      }
      for (var i=0; i < files.length; i++) //update file container
      {
        //replace special characters to prevent error in the html embedding
        disFile = files[i].replace(/ /g,"___");disFile = disFile.replace(/\(/g,'u--');disFile = disFile.replace(/\)/g,'v--');disFile = disFile.replace(/\./g,'---');
        $('#'+path+'').append("<li><a onclick=showFile('"+disFile+"','"+path+"','"+flag+"')  href='#'>" + files[i] +"</a></li>");
      }
      $(".file-tree").filetree(); //effect on the directory
    }
  });
}
function updateModalTabPage(){
  var options = {
    height: "400px",
    page:1
  };
  //load the main document into the modal page.....if adding attachment (ref and enc) is selected
  loadPDF($('#disPath').val()).then(function(res){
    $('#selPage').empty();
    for (var i=1; i<=res; i++){ //update page numbers
      $('#selPage').append("<option value='"+i.toString()+"'>"+i.toString()+"</option>");
    }
    PDFObject.embed($('#disPath').val(), "#attachPage", options);
  });
}
//function initialize modal dialog
function modalDisplay(flag, path){
  //Update Page if attachment adding (ref and enc) is selected
  if (flag=="refenc"){
    updateModalTabPage();
  }
  //upate browse files
  var todo = {path:path + '/'};
  $.ajax({
    type: 'POST',
    url: '/browsedrive',
    data: todo,
    success: function(data){
      var arrObj = JSON.parse(data);
      var dirs = arrObj['dirs'];
      var files = arrObj['files'];
      $('.driveList').empty();
      //replace special characters to prevent error in the html embedding
      classPath=path.replace(/\//g,"---");classPath=classPath.replace(/\(/g,'u--');classPath=classPath.replace(/\)/g,'v--');classPath=classPath.replace(/:/g,'x--');classPath=classPath.replace(/ /g,"___");classPath=classPath.replace(/\./g,"z--");
        for (var i=0; i < dirs.length; i++) //update directory container
        {
          classDirs = dirs[i].replace(/ /g,"___");classDirs=classDirs.replace(/\(/g,"u--");classDirs=classDirs.replace(/\)/g,"v--");classDirs=classDirs.replace(/\./g,"z--");
          $('.driveList').append("<li><a onclick=showDir('"+classPath+"---"+classDirs+"','"+flag+"')  href='#'>" + dirs[i] +"</a><ul><div  id='"+classPath+"---"+classDirs+"'></div></ul></li>");
        }
        for (var i=0; i < files.length; i++) //update file container
        {
          disFile = files[i].replace(/ /g,"___");disFile = disFile.replace(/\(/g,'u--');disFile = disFile.replace(/\)/g,'v--');disFile = disFile.replace(/\./g,'---');
          $('.driveList').append("<li><a onclick=showFile('"+disFile+"','"+classPath+"','"+flag+"')  href='#'>" + files[i] +"</a></li>");
        }
        $(".file-tree").filetree(); //effect on directory tree
      }
    });
  };
  //function update ref and enc cookies
  function updRefEncCookie(param, paramFile, paramDir){
    var arrRef = [];
    try{
      var disRef = JSON.parse(getCookie(param));
      if (disRef.length > 0) arrRef = disRef;
    }catch{}
    arrRef.push({file:paramFile, path:paramDir});
    setCookie(param,JSON.stringify(arrRef),1);
  }
  // initialize and load the PDF
  async function loadPDF(pdf_url) {
    // get handle of pdf document
    try {
      _PDF_DOC = await pdfjsLib.getDocument({ url: pdf_url });
    }
    catch(error) {}
    // total pages in pdf
    _TOTAL_PAGES = _PDF_DOC.numPages;
    return _TOTAL_PAGES;
  }
  //Point to the selected Page of the attachment
  function pointPage(){
    var num = document.getElementById("selPage").selectedIndex;
    var options = {
      height: "400px",
      page:num + 1
    };
    PDFObject.embed($('#disPath').val(), "#attachPage",options);
  };
  //Point to the specific page number on the main document
  function pointMainPDF(num){
    var options = {
      page:num
    };
    PDFObject.embed($('#disPath').val(), "#pdf_view",options);
  }
  //Load when html renders
  $(document).ready(function(){

    //assign picture based on id ME
    var disID = getCookie('me');let origpath = 'D:/drive';
    //handle reference button click
    $('#butRef').on('click', function(){
      $('#refTrue').val('true');
      document.getElementById("largeModalLabel").innerHTML = "Attachments";
      document.getElementById("Page").style.display = "block";
      if ($('#realdrive').val().substring($('#realdrive').val().length-1) =='/') origpath = $('#realdrive').val().substring(0,$('#realdrive').val().length-1);
      else origpath = $('#realdrive').val();
      modalDisplay('refenc',origpath);
    });
    //handle enclosure button click
    $('#butEnc').on('click', function(){
      $('#refTrue').val('false');
      document.getElementById("largeModalLabel").innerHTML = "Attachments";
      document.getElementById("Page").style.display = "block";
      if ($('#realdrive').val().substring($('#realdrive').val().length-1) =='/') origpath = $('#realdrive').val().substring(0,$('#realdrive').val().length-1);
      else origpath = $('#realdrive').val();
      //else if (getCookie('realpath').substring(0,8).toUpperCase() != origpath.toUpperCase()) origpath = getCookie('realpath').substring(0,2);

      modalDisplay('refenc',origpath);
    });
    //cancel button clicked
    $('#modButCanc').on('click', function(){
      if (document.getElementById('newfile').style.display=='none') togglePanelHide(true);
      selChose();$('#overlay').hide()//display spinner

    });
    // X button clicked
    $('#topClose').on('click', function(){
      if (document.getElementById('newfile').style.display=='none') togglePanelHide(true);
      selChose();$('#overlay').hide()//display spinner

    });
    //handle confirm when selecting specific page number for the attachment
    $('#butConfirm').on('click', function(event){
      event.preventDefault();
      var disFile = document.getElementById("selPage").selectedIndex + 1;
      //update reference or enclosure
      if ($('#refTrue').val()=='true'){
        updRefEncCookie('arrRef', 'Page_'+disFile, 'Page');
        $('#divRef').append("<div id='ref-Page_"+disFile+"'>&nbsp;&nbsp;&nbsp;&nbsp;<button type='button' onclick=delEncRef('ref','Page_"+disFile+"','arrRef') class='btn btn-danger btn-sm fa fa-times'></button><button type='button' class='btn btn-link btn-sm' onclick=pointMainPDF('"+disFile+"')>Page_"+disFile+"</button></div>");
      } else {
        updRefEncCookie('arrEnc', 'Page_'+disFile, 'Page');
        $('#divEnc').append("<div id='enc-Page_"+disFile+"'>&nbsp;&nbsp;&nbsp;&nbsp;<button type='button' onclick=delEncRef('enc','Page_"+disFile+"','arrEnc') class='btn btn-danger btn-sm fa fa-times'></button><button type='button' class='btn btn-link btn-sm' onclick=pointMainPDF('"+disFile+"')>Page_"+disFile+"</button></div>");
      }
      $("#butmodClose").click(); //invoke to close the modal dialog
    });
  });
