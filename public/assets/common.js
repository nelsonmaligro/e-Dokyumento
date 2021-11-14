var disWindow = null;
var disClock = null;

//populate the page selector and updaet the iframe for document signing
function updateSelectPage(){
  //populate select page
  loadPDF($('#disPath').val()).then(function(res){
    $('#selPageSign').empty();
    for (var i=1; i<=res; i++){
      $('#selPageSign').append("<option value='"+i.toString()+"'>"+i.toString()+"</option>");
    }
    $("#selPageSign").chosen({
      no_results_text: "Oops, nothing found!",
      width: "60px"
    });
    $('#selPageSign').trigger("chosen:updated");
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
//handle click on signing
$('#signDocBut').on('click',function(event){
  document.getElementById('canvasPDF').src = "/assets/signcanvas.html";
  $('#divSign').show(); $('#origButtons').hide();$('#disAnnotate').hide();
  $('#disContent').hide();$('#disFrame').show();
  document.getElementById('disContentMobile').style.display="none";
  updateSelectPage();
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))  {
    if (window.matchMedia("(orientation: portrait)").matches) document.getElementById('avatarHere').style.top="-70px";
  }
});
//handle clicking cancel button during signing
$('#butCancelSign').on('click', function(event){
  $.ajax({
    type: 'POST',
    url: '/cancelsign',
    success: function(data) { //return to normal page
      $('#divSign').hide(); $('#origButtons').show();
      $('#disContent').show();$('#disFrame').hide();
      //check if mobile browser
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))  {
        document.getElementById('disContent').style.display="none";
        document.getElementById('disContentMobile').style.display="";
      }
      location.reload();
    }
  });
});
//handle save button after signing
$('#butRelease1').on('click', function(event){
  $('#routeBody').hide();$('#routeattachPage').hide();$('#disrouteTitle').show();
  $('#divroyalCam').show();$('#routebutConfirm').hide();$('#disContRout').hide();$('#passapp').hide();
  openCamBranch(); //validation using QR code or password
});
//hnadle switch for date on signing
$('#toggledate').change(function(event){
  if ($('#toggledate').prop('checked')){
    setCookie('noDate','true',1);
  } else {
    setCookie('noDate','false',1);
  }
});
//toggle QR code scanning option during validation of signature
$('#toggleButCamRoyal').on('change', function(event){
  openCamBranch(); //validation using QR code or password
});

//selecting page
$('#selPageSign').on('change', function(event){
  pointMainPDF(parseInt($('#selPageSign').val(),10)); //point to the selected page number
  var todo = {num:parseInt($('#selPageSign').val(),10)-1,filepath: $('#disPath').val(),user:getCookie('me')};
  //query the server to update the signing page
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
});

//function to display certification information in a modal dialog box
function displaycertinfoparam(data) {
  digicert = data;
  if (!Array.isArray(data)) digicert = JSON.parse(data);
  //[signres.authenticity,signres.integrity,signres.expired,signres.meta.certs[0].issuedBy,signres.meta.certs[0].issuedTo, signres.meta.certs[0].validityPeriod]
  $('#certmodDisp').html('<h6>Trusted CA Verified:&nbsp;&nbsp;' + JSON.stringify(digicert[0]) + '</h6>' +
    '<h6> Document Integrity             :  ' + JSON.stringify(digicert[1]) + '</h6>' +
    '<hr />' +
    '<h6>Certificate Details :</h6>' +
    'Issued By:&nbsp;' + JSON.stringify(digicert[3]) +
    '<br>Issued To:&nbsp;' + JSON.stringify(digicert[4]) +
    '<br>Validity Period:&nbsp;' + JSON.stringify(digicert[5])
  );
  $('#certtoggleDialog').click();
}
//query document database to populate metadata
function queryDoc() {
  let disPath = '';
  if (window.location.toString().includes("/incoming")) disPath = 'public/drive/' + $('#disBranch').val() + '/' + $('#newfile').val();
  else disPath = getCookie('realpath') + $('#newfile').val();
  var todo = {
    path: disPath
  };
  $.ajax({
    type: 'POST',
    url: '/docquery',
    data: todo,
    success: function(data) {
      returnDocQuery(data);
    }
  });
};
//handle JSON return from document DB query
function returnDocQuery(data) {
  //Load all file metadata
  var arrData = JSON.parse(data);
  arrData.forEach(function(disData) {
    //update classification
    setCookie('fileOpn', $('#disPath').val(), 1);
    if (disData.disClas) {
      $("#selClas").val(disData.disClas);
      setCookie('clasAI', $("#selClas").val(), 1);
      //$("#selClas").trigger("chosen:updated");
      sleep(3000).then(() => {
        selChose();
        $("#selClas").trigger("chosen:updated");
      });
    } else {
      if (document.cookie.indexOf('clasAI=') != -1) $("#selClas").val(getCookie('clasAI'));
      $("#selClas").trigger("chosen:updated");
    }
    //update tags
    if (disData.disTag.length > 0) {
      $("#selTag").val(disData.disTag);
      setCookie('tagAI', JSON.stringify(disData.disTag), 1);
      $("#selTag").trigger("select2:updated");
    } else {
      if (document.cookie.indexOf('tagAI=') != -1) $('#selTag').val(JSON.parse(getCookie('tagAI')));
      $("#selTag").trigger("select2:updated");
    }

    if ($('#txtscan').val() == 'Machine Learning Successful!') selChose(); //assign select2 and chosen

    //update reference
    var arrRef = [];
    disData.ref.forEach(function(ref) {
      var names = ref.split('/');
      path2 = ref.substring(0, ref.length - (names[names.length - 1]).length - 1);
      file = names[names.length - 1];
      arrRef.push({
        file: file,
        path: path2
      });
    });
    if (arrRef.length > 0) setCookie('arrRef', JSON.stringify(arrRef), 1);

    //update enclosure
    arrEnc = [];
    disData.enc.forEach(function(enc) {
      var names = enc.split('/');
      path2 = enc.substring(0, enc.length - (names[names.length - 1]).length - 1);
      file = names[names.length - 1];
      arrEnc.push({
        file: file,
        path: path2
      });
    });
    if (arrEnc.length > 0) setCookie('arrEnc', JSON.stringify(arrEnc), 1);

    //update comments
    arrComm = [];
    disData.disComm.forEach(function(comment) {
      arrComm.push({
        branch: comment.branch,
        content: comment.content
      });
    });
    if (arrComm.length > 0) setCookie('arrComm', JSON.stringify(arrComm), 1);

    loadRefEnc(); //load reference and enclosure into the html modal box
  });
}

//function toggle hide Panel
function togglePanelHide(disBool) {
  //unhide elements
  if (!disBool) {
    $('#newfile').show();
    $('#butDiv').show();
    if (!window.location.toString().includes("/release/")) {
      $('#actBr').show();
      $('#selDiv').show();
    }
    $('#actTag').show();
    $('#divTag').show();
    $('#selBr').trigger("chosen:updated");
    $('#selClas').trigger("chosen:updated");
    $('#selTag').trigger("select2:updated");
    $('#butScan').hide();
    $('#commentToggle').show();
    $('#sideToggle').show();
  } else { //hide elements
    $('#newfile').hide();
    $('#actBr').hide();
    $('#selDiv').hide();
    $('#butDiv').hide();
    $('#actTag').hide();
    $('#divTag').hide();
    $('#commentToggle').hide();
    $('#sideToggle').hide();
  }
}
//function toggle processing Panel
function togglePanelProc(disBool) {
  //unhide elements
  if (!disBool) {
    $('#newfile').show();
    $('#actBr').show();
    $('#selDiv').show();
    $('#butDiv').show();
    $('#actTag').show();
    $('#divTag').show();
    $('#selBr').trigger("chosen:updated");
    $('#selClas').trigger("chosen:updated");
    $('#selTag').trigger("select2:updated");
    $('#butScan').hide();
    $('#commentToggle').show();
    $('#sideToggle').show();
    //$('#disAnnotate').show();
  } else { //hide elements
    $('#newfile').show();
    $('#actBr').hide();
    $('#selDiv').hide();
    $('#butDiv').hide();
    $('#actTag').hide();
    $('#divTag').hide();
    $('#butScan').show();
    $('#butScan').html("&nbsp;Processing...");
    $('#commentToggle').hide();
    $('#sideToggle').hide();
    //$('#disAnnotate').hide();
  }
}
//Auto refresh Notification
function checkFiles() {
  //send request for incoming and pending files
  $.ajax({
    type: 'post',
    url: '/sendincoming',
    success: function(data) {
      if (data != 'null') {
        arrOut = JSON.parse(data);
        //populate incoming
        arrFiles = arrOut.incoming;
        if (arrFiles != 'null') {
          if (arrFiles.length > parseInt($('#notiNr').html(), 10)) {
            sound = document.getElementById('soundNoti');
            sound.play();
          }

          $('#notiNr').html(arrFiles.length);
          $('#notiLabel').html('&nbsp;&nbsp;You have ' + arrFiles.length + ' incoming files pending');
          $('#addHere').empty();
          arrFiles.forEach(function(item) {
            let file = item.file;
            let info = item.action;
            if (info != 'yes') $('#addHere').append("<li><a style='background-color:DimGray;color:white;' class='dropdown-item media ' href='/incoming/" + file + "'><i class='fa fa-info'></i><p style='color:white;'>" + file + "</p></a></li>");
            else $('#addHere').append("<li><a style='background-color:Red;color:white;' class='dropdown-item media' href='/incoming/" + file + "'><i class='fa fa-check'></i><p style='color:white;'>" + file + "</p></a></li>");
          });
        }
        //populate mailfiles
        arrMails = arrOut.mail;
        if (arrMails.length > parseInt($('#countPix').html(), 10)) {
          sound = document.getElementById('soundNoti');
          sound.play();
        }

        $('#countMail').html(arrMails.length);
        $('#countPix').html(arrMails.length);
        arrMails.reverse();
        $('#addMailHere').empty();
        arrMails.forEach(function(file) {
          let fileArr = file.split('/');
          let filename = fileArr[fileArr.length - 1].substring(0, 20);
          file = file.replace(/ /g, "___");file = file.replace(/\(/g, 'u--');file = file.replace(/\)/g, 'v--');
          file = file.replace(/\./g, '---');
          $('#addMailHere').append("<li><button type='button' onclick=delNotiFile('" + file + "') class='btn btn-danger btn-sm fa fa-times' href='#'></button><button button type='button' class='btn btn-link btn-sm' onclick=openDisFile('" + file + "') href='#'>" + filename + "</button></li>");
        });
      }
    }
  });
  //reload page if the file in the incoming is removed
  if (($('#fileroute').val() == 'empty') && (document.getElementById("notiNr").innerHTML != '0')) {
    location.replace('/incoming');
  }
}

//function load Reference and Enclosures
function loadRefEnc() {
  try {
    var arrRef = [];
    var arrEnc = [];
    arrComm = [];
    //Update reference sidebar
    var disRef = JSON.parse(getCookie('arrRef'));
    if (disRef.length > 0) arrRef = disRef;
    $('#divRef').empty();
    arrRef.forEach(function(ref) {
      var newRef = ref.file.replace(/ /g, "___");
      newRef = newRef.replace(/\(/g, 'u--');newRef = newRef.replace(/\)/g, 'v--');
      newRef = newRef.replace(/\./g, '---');
      disDir = ref.path.replace(/:/g, 'x--');
      disDir = disDir.replace(/\./g, 'z--');
      disDir = disDir.replace(/\//g, "---");
      disDir = disDir.replace(/ /g, "___");
      $('#divRef').append("<div id='ref-" + newRef + "'>&nbsp;&nbsp;&nbsp;&nbsp;<button type='button' onclick=delEncRef('ref','" + newRef + "','arrRef') class='btn btn-danger btn-sm fa fa-times'></button><button type='button' class='btn btn-link btn-sm' onclick=dispAttach('" + disDir + "','" + newRef + "')>" + ref.file + "</button></div>");
    });
    //Update enclosure sidebar
    var disEnc = JSON.parse(getCookie('arrEnc'));
    if (disEnc.length > 0) arrEnc = disEnc;
    $('#divEnc').empty();
    arrEnc.forEach(function(enc) {
      var newEnc = enc.file.replace(/ /g, "___");
      newEnc = newEnc.replace(/\(/g, 'u--');newEnc = newEnc.replace(/\)/g, 'v--');
      newEnc = newEnc.replace(/\./g, '---');
      disDir = enc.path.replace(/:/g, 'x--');
      disDir = disDir.replace(/\./g, 'z--');
      disDir = disDir.replace(/\//g, "---");
      disDir = disDir.replace(/ /g, "___");
      $('#divEnc').append("<div id='enc-" + newEnc + "'>&nbsp;&nbsp;&nbsp;&nbsp;<button type='button' onclick=delEncRef('enc','" + newEnc + "','arrEnc') class='btn btn-danger btn-sm fa fa-times'></button><button type='button' class='btn btn-link btn-sm' onclick=dispAttach('" + disDir + "','" + newEnc + "')>" + enc.file + "</button></div>");
    });
    //Update comment sidebar
    var disComm = JSON.parse(getCookie('arrComm'));
    if (disComm.length > 0) arrComm = disComm;
    $('#allComments').empty();
    arrComm.reverse().forEach(function(comm) {
      var name = comm.branch.split('---');
      $('#allComments').append(" " +
        "<div id='" + comm.branch + "' class='box'> " +
        "<a style='color:black;font-family:arial;'><i class='fa fa-tag'></i>&nbsp;" + name[0] +
        "<i onclick=removeComment('" + comm.branch + "') style='margin-top:-8px;color:black;' class='btn btn-lg float-right fa fa-times'></i></i></a>" +
        "<div id='commContent'><p>" + comm.content + "</p></div></div><br id='br-" + comm.branch + "'>");
    });
  } catch {}
}
//handle bootstrap select and chosen
function selChose() {

  $("#selClas").chosen({
    //disable_search_threshold: 10,
    no_results_text: "Oops, nothing found!",
    width: "100%"
  });
  $("#selTag").select2({
    tags: true,
    width: "100%",
    tokenSeparators: [',', '\n']
  });


  $("#selBr").chosen({
    //disable_search_threshold: 10,
    no_results_text: "Oops, nothing found!",
    width: "100%"
  });
}
//handle main file onclick
function gotoMain() {
  location.reload();
  /*
  $('#disPath').val(getCookie('fileOpn'));
  PDFObject.embed(getCookie('fileOpn'), "#pdf_view"); //reload the main page
  setCookie('newpathdraw', getCookie('fileOpn'), 1);
  $('#divToggleSign').show();
  $('#butReturn').show();
  //if AGM ang GM (executive branches) reload the main page for signing and approval
  if ($('#disLevel').val().toUpperCase() == "EXECUTIVE") {
    $('#selPage').empty();
    loadPDF(getCookie('fileOpn')).then(function(res) { //load the main page for signing
      $('#selPage').empty();
      for (var i = 1; i <= res; i++) {
        $('#selPage').append("<option value='" + i.toString() + "'>" + i.toString() + "</option>");
      }
      $('#selPage').trigger("chosen:updated");
    });
    $('#disContent').show();
    $('#disFrame').hide();
    $('#divSign').hide();
    //return release and approve button for the AGM and GM respectively
    if ($('#disLevel').val().toUpperCase()== "EXECUTIVE") {
      $('#butApprove').hide();$('#butCancelSignEnc').hide();
      $('#butRelease2').show();
    } else {
      $('#butApprove').show();$('#butCancelSignEnc').show();
      $('#butRelease2').hide();
    }
  }
  //determine of page is toggled for main or attachment. This is for the annotation
  if (!mainfiledis) togglepage = true;
  else togglepage = false;
  mainfiledis = true; //variable is in annotate draw js
  $('#disAnnotate').show();
  //check if mobile browser
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    document.getElementById('disContent').style.display = "none";
    document.getElementById('disContentMobile').style.display = "";
    loadPDFtoCanvas($('#disPath').val());
  }
  */
}
//function to display QR Code
function popUpQR(){
  let todo = {user: getCookie('me')};
  $.ajax({
    type: 'POST',
    url: '/showqrcode',
    data: todo,
    success: function(data) {
       qrwindow = window.open("/drive/PDF-temp/"+getCookie('me')+".login.qr.png","My QR Code",'resizable=yes,top=0,width=100,heigh=300');
       let loop = setInterval(function() {
         if(qrwindow.closed) {
           $.ajax({
            type: 'POST',
            url: '/delqrcode',
            data: todo,
            success: function(data) {
            }
          });
          clearInterval(loop);
         }
       },2000);
    }
  });
}

//handle close popup disWindow
function closWindow() {
  disWindow.close();
  clearInterval(disClock);
}
//handle open file on mail Notification
function openDisFile(filepath) {
  filepath = filepath.replace(/___/g, " ");filepath = filepath.replace(/u--/g, '(');filepath = filepath.replace(/v--/g, ')');filepath = filepath.replace(/---/g, '.');
  setCookie('mailnoti', 'true');
  arrStr = filepath.split('/');
  mailfile = arrStr[arrStr.length - 1];
  mailpath = filepath.substring(0, filepath.length - mailfile.length);
  setCookie('mailpath', mailpath, 1);
  setCookie('mailfile', mailfile, 1);
  location.replace('/fileopen');
}
//function forr deleting mail notification file
function delNotiFile(filepath) {
  this.event.stopPropagation();
  filepath = filepath.replace(/___/g, " ");filepath = filepath.replace(/u--/g, '(');filepath = filepath.replace(/v--/g, ')');filepath = filepath.replace(/---/g, '.');
  var user = getCookie('me');
  var todo = {path: filepath,user: user};
  $.ajax({
    type: 'POST',
    url: '/delnotifile',
    data: todo,
    success: function(data) {
      if (getCookie('realpath').toUpperCase() + getCookie('fileAI').toUpperCase() == filepath.toUpperCase()) {
        setCookie('fileAI', '', 1);
        location.replace('/explorer');
      } else {
        location.reload();
      }
    }
  });
}
//handle add comment
function addComment() {
  let page = 'open';
  if (window.location.toString().includes("/incoming")) page = 'incoming';
  if ($('#commentinput').val() != "") {
    $('#addCommentBut').hide();
    var disID = getCookie('me');
    disBranch = disID + '---' + Date.now().toString();
    //update cookie
    var arrComment = [];
    try {
      var disComment = JSON.parse(getCookie('arrComm'));
      if (disComment.length > 0) arrComment = disComment;
    } catch {}
    arrComment.push({
      branch: disBranch,
      content: $('#commentinput').val()
    });
    setCookie('arrComm', JSON.stringify(arrComment), 1);
    //send to server the all comments for updating
    var todo = {page:page, realpath:getCookie('realpath'), fileroute:$('#fileroute').val(),user: disID, comments:JSON.stringify(arrComment)};
    $.ajax({
      type: 'POST',
      url: '/updatecomment',
      data: todo,
      success: function(data) {
        sleep(1000).then(() => { //delay then prepend (apppend at the beggining) to comment side bar
          $('#allComments').prepend(" " +
            "<div id='" + disBranch + "' class='box'> " +
            "<a style='color:black;font-family:arial;'><i class='fa fa-tag'></i>&nbsp;" + disID +
            "<i onclick=removeComment('" + disBranch + "') style='margin-top:-8px;color:black;' class='btn btn-lg float-right fa fa-times'></i></i></a>" +
            "<div id='commContent'><p>" + $('#commentinput').val() + "</p></div></div><br id='br-" + disBranch + "'>");
        }).then(() => {
          $('#commentinput').val('');
          $('#addCommentBut').show();
        });
      }
    });
  }
}
//handle remove comment
async function removeComment(disBranch) {
  let page = 'open';
  if (window.location.toString().includes("/incoming")) page = 'incoming';
  var disID = getCookie('me');
  var arrComment = [];
  var disComment = JSON.parse(getCookie('arrComm'));
  if (disComment.length > 0) arrComment = disComment;
  var found = arrComment.find(({
    branch
  }) => branch === disBranch);
  var resArr = arrComment.filter(function(res) { //remove  item from the array of comments
    return res != found;
  });
  await setCookie('arrComm', JSON.stringify(resArr), 1);
  var todo = {page:page, realpath:getCookie('realpath'), fileroute:$('#fileroute').val(),user: disID, comments:JSON.stringify(resArr)};
  $.ajax({
    type: 'POST',
    url: '/updatecomment',
    data: todo,
    success: function(data) {
      sleep(1000).then(() => { //delay and remove from the comment sidebar
        $('#' + disBranch).remove();
        $('#br-' + disBranch).remove();
      });
    }
  });

}

//handle delete documents
function deleteDocu() {
  var filepath = getCookie('realpath') + $('#fileroute').val();
  if (window.location.toString().includes("/fileopen")) {
    filepath = getCookie('realpath') + $('#fileroute').val();
    brcode = 'fileopen';
  } else if (window.location.toString().includes("/incoming")) {
    filepath = $('#fileroute').val();
    brcode = $('#disBranch').val();
  }
  todo = {filepath: filepath, branch: brcode, user: getCookie('me'), filename: $('#fileroute').val()};
  //send to server the filename to be deleted
  $.ajax({
    type: 'POST',
    data: todo,
    url: '/deletedoc',
    success: function(data) {
      if (data == 'successful') {
        $('#lblResult').html("Deleted Successfully!");
        location.replace('/incoming');;
        $('#lblResult').html("");
        $('#passwstaticModal').hide();
      } else if (data == 'lastbranch') alert("Deletion denied! Please route this to the originator or to other branch.");
    }
  });
}
//delay function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//Load when html renders
$(document).ready(function() {
  //assign picture based on id ME
  var disID = getCookie('me');
  $('#pixID').attr("src", "/images/" + disID + ".jpg");
  //handle click open file menu
  $('#menuOpen').on('click', function() {
    setCookie('fileAI', "Empty File", 1);
  });
  //handle click incoming menu
  $('#menuIncoming').on('click', function() {
    setCookie('fileAI', "Empty", 1);
  });
  //show dropdown when user profile icon is clicked
  $('#userProf').on('click', function() {
    $('.dropdown-submenu .show').removeClass("show");
  });
  //handle load user drive
  $('#disCheckDrive').on('click', function() {
    //get the mapped drive
    let newPath = 'Z:/';
    newPath = getCookie('newPath');
    newPath = newPath.substring(0, 3);
    if ((newPath.substring(0, 1).toUpperCase() == 'D') || (newPath.substring(0, 1).toUpperCase() == '/')) newPath = 'Z:/';
    //opens the mapped drive.....run the registry file to enable the ie option
    disWindow = window.open("ie:" + newPath + "", "disWindow", "width=5px,heigh=5px");
    disClock = setInterval('closWindow()', 10000); //close the dialog box after 10 seconds
  });
  //Logout click
  $('#disLogout').on('click', function() {
    $.ajax({
      type: 'get',
      url: '/logout',
      success: function(data) {
        location.replace('/'); //return to login page
      }
    });
    return false;
  });
  //handle toggle switching position or duty from regular staff to secretary (secretary allows receiving of all external documents)
  $('#switchDuty').on('click', function(e) {
    todo = {user: getCookie('me')};
    $.ajax({
      type: 'POST',
      data: todo,
      url: '/switchduty',
      success: function(data) {
        if (data == 'successful') {
          location.replace('/incoming');
        }
      }
    });
  });

  //handle download of document
  $('#docDownload').on('click', function(event) {
    //event.preventDefault();
    if (window.location.toString().includes("/fileopen")) {
      var encode = window.btoa(getCookie('realpath') + $('#fileroute').val());
      var brCode = window.btoa('fileopen');
      window.location.href = "/downloadfile/" + encode + "/" + brCode;
    } else if (window.location.toString().includes("/incoming")) {
      var encode = window.btoa($('#fileroute').val());
      if ($('#disBranch').val() == 'RELEASE') $('#disBranch').val('Release');
      var brCode = window.btoa($('#disBranch').val());
      window.location.href = "/downloadfile/" + encode + "/" + brCode;
    }
  });
  //execute delete function when keypressed is entered
  $('#passwmodPass').keypress(function(e) {
    if (e.which == 13) deleteDocu();
  });
  //handles delete document when button clicked
  $('#docDelete').on('click', function(event) {
    //event.preventDefault();
    deleteDocu();
  });


  //start auto refresh Notification
  checkFiles();
  setInterval('checkFiles();', 20000); //continuesly check for incoming files every 20 seconds
  //For mobile browser Load the PDF to Convas
  loadPDFtoCanvas($('#disPath').val());

});
//function to validate digital certificate in the signature when reference and enclosure is clicked
let mainnfo = [];
function validateDigiSignDoc(signres){
  if (JSON.stringify(signres)!='[]') { //with digital signature
    if (signres.message=='signed') { //single signature
      mainnfo = [signres.authenticity.toString().toUpperCase(),signres.integrity.toString().toUpperCase(),signres.expired,signres.meta.certs[0].issuedBy.commonName,signres.meta.certs[0].issuedTo.commonName, signres.meta.certs[0].validityPeriod.notAfter];
      //setCookie('digitalcert',JSON.stringify(mainnfo),1);
      if (signres.verified) { //with valid CA certificate
        if (window.location.toString().includes("/incoming")) { //if attachment is openned in web temp folder(/incoming)
          $('#digcertDrawAttach').attr('class', 'btn btn-sm btn-success');
          $('#digcertDrawAttach').html("<i class='fa fa-check'></i> Verified Digital Cerificate");$('#disDigCertAttach').show();
        } else { //if attachment is openned in server drive
          $('#disDigCert').html("<button  id='digcertDraw' class='btn btn-sm btn-success' type='button' onclick='displaycertinfoparam("+JSON.stringify(mainnfo)+")'> <i class='fa fa-check'></i> Verified Digital Certificate </button>");
          $('#disDigCert').show();
        }
      } else {
        if (window.location.toString().includes("/incoming")) { //if attachment is openned in web temp folder(/incoming)
          $('#digcertDrawAttach').attr('class', 'btn btn-sm btn-danger');
          $('#digcertDrawAttach').html("<i class='fa fa-times'></i> Unverified Digital Certificate");$('#disDigCertAttach').show();
        } else { //if attachment is openned in server drive
          $('#disDigCert').html("<button  id='digcertDraw' class='btn btn-sm btn-danger' type='button' onclick='displaycertinfoparam("+JSON.stringify(mainnfo)+")'> <i class='fa fa-times'></i> Unverified Digital Cerificate </button>");
          $('#disDigCert').show();
        }
      }
    } else { //multiple signature
      mainnfo = [signres.signRange.toString() + ' Valid Digital Signatures', 'TRUE', 'Multiple Date', 'Multiple Certificate','Originator: '+ signres.meta.name, 'Multiple Validity'];
      if (window.location.toString().includes("/incoming")) { //if attachment is openned in web temp folder(/incoming)
        $('#digcertDrawAttach').attr('class', 'btn btn-sm btn-success');
        $('#digcertDrawAttach').html("<i class='fa fa-check'></i> Verified Digital Cerificate");$('#disDigCertAttach').show();
      } else { //if attachment is openned in server drive
        $('#disDigCert').html("<button  id='digcertDraw' class='btn btn-sm btn-success' type='button' onclick='displaycertinfoparam("+JSON.stringify(mainnfo)+")'> <i class='fa fa-check'></i> Verified Digital Certificate </button>");
        $('#disDigCert').show();
      }
    }

  } else { //if no attached digital certificate
    mainnfo = [];$('#disDigCert').hide();$('#disDigCertAttach').hide(); //hide validation info button
  }
}
//handle digital certificate info button clicked
$('#digcertDrawAttach').on('click', (event)=>{
  if (mainnfo)  displaycertinfoparam(JSON.stringify(mainnfo));
});

//function to Load the PDF to the canvas
function loadPDFtoCanvas(url) {
  //populate page numbers SelectionBox
  if (url != undefined) {
    $('#overlay').show() //display spinner
    loadPDF(url).then(function(res) {
      $('#selPageMobile').empty();
      for (var i = 1; i <= res; i++) {
        $('#selPageMobile').append("<option value='" + i.toString() + "'>" + i.toString() + "</option>");
      }
      //$('#selPage').trigger("chosen:updated
      $('#overlay').hide() //display spinner
    });
    //render the document to the page
    pdfjsLib.getDocument(url)
      .then(function(pdf) {
        return pdf.getPage(1);
      }).then(function(page) {
        renderPage(page)
      });
  }

}
// For Mobile handle render page into canvasPDF
function renderPage(page) {
  var scale = 2;
  var viewport = page.getViewport({
    scale: scale,
  });

  var canvas = document.getElementById('canvasPDFMobile');
  var context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  var renderContext = {
    canvasContext: context,
    viewport: viewport
  };
  page.render(renderContext);
}

//For Mobile select page
$('#selPageMobile').on('change', function(event) {
  pdfjsLib.getDocument($('#disPath').val())
    .then(function(pdf) {
      return pdf.getPage(parseInt($('#selPageMobile').val(), 10));
    }).then(function(page) {
      renderPage(page)
    });
});
