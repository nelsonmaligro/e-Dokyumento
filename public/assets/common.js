var disWindow = null; var disClock = null;

function displaycertinfo(){
  let digicert = JSON.parse(getCookie('digitalcert'));
  alert("Digital Signature Status: " +digicert.message + "\n" +
        "Verified:"+digicert.verified + "     Authenticity:"+digicert.verified + "     Integrity:" +digicert.integrity + "\n" + 
        "=======================================" + "\n" +
        "Issued By: " + digicert.meta.certs[0].issuedBy.commonName+','+digicert.meta.certs[0].issuedBy.organizationName + '\n' +
        "Issued By: " + digicert.meta.certs[0].issuedTo.commonName+','+digicert.meta.certs[0].issuedTo.organizationName + '\n' +
        "Validity Period: " + digicert.meta.certs[0].validityPeriod.notAfter);
}
function displaycertinfoparam(data){
  let digicert = JSON.parse(data);
  //[signres.authenticity,signres.integrity,signres.expired,signres.meta.certs[0].issuedBy,signres.meta.certs[0].issuedTo, signres.meta.certs[0].validityPeriod]
  $('#certmodDisp').html('<h6>Intermediate/Signing CA Verified:&nbsp;&nbsp;'+ JSON.stringify(digicert[0]).toUpperCase()+'</h6>' +
                         '<h6> Document Integrity             :  '+ JSON.stringify(digicert[1]).toUpperCase()+'</h6>' +
                         '<hr />' +
                         '<h6>Certificate Details :</h6>' +
                         '<br>Issued By:&nbsp;' + JSON.stringify(digicert[3].commonName) +',' + JSON.stringify(digicert[3].organizationName) +
                         '<br>Issued To:&nbsp;' + JSON.stringify(digicert[4].commonName) +',' + JSON.stringify(digicert[4].organizationName) +
                         '<br>Validity Period:&nbsp;' + JSON.stringify(digicert[5].notAfter)
                       );
  $('#certtoggleDialog').click();
}
//query document database to populate metadata
function queryDoc(){
  let disPath = '';
  if (window.location.toString().includes("/incoming")) disPath ='public/drive/'+ $('#disBranch').val() + '/'+$('#newfile').val();
  else disPath = getCookie('realpath')+$('#newfile').val();
  var todo = {path:disPath};
      $.ajax({
        type: 'POST',
        url: '/docquery',
        data: todo,
        success: function(data){
          returnDocQuery(data);
        }
      });
};
//handle JSON return from document DB query
function returnDocQuery(data){
  //Load all file metadata
  var arrData = JSON.parse(data);
  arrData.forEach(function (disData){
    //update classification
    setCookie('fileOpn',$('#disPath').val(),1);
     if (disData.disClas) {
       $("#selClas").val(disData.disClas);
       setCookie('clasAI',$("#selClas").val(),1);
       //$("#selClas").trigger("chosen:updated");
       sleep(3000).then(()=>{ selChose(); $("#selClas").trigger("chosen:updated");});
     }else {
       if (document.cookie.indexOf('clasAI=') != -1) $("#selClas").val(getCookie('clasAI'));
       $("#selClas").trigger("chosen:updated");
     }
     //update tags
     if (disData.disTag.length > 0) {
       $("#selTag").val(disData.disTag);
       setCookie('tagAI',JSON.stringify(disData.disTag),1);
       $("#selTag").trigger("select2:updated");
     } else {
       if (document.cookie.indexOf('tagAI=') != -1) $('#selTag').val(JSON.parse(getCookie('tagAI')));
       $("#selTag").trigger("select2:updated");
     }

     if ($('#txtscan').val()=='Machine Learning Successful!') selChose(); //assign select2 and chosen

    //update reference
      var arrRef = [];
      disData.ref.forEach(function (ref){
        var names = ref.split('/');path2 = ref.substring(0,ref.length-(names[names.length-1]).length-1);
        file = names[names.length-1];
        arrRef.push({file:file,path:path2});
      });
      if (arrRef.length > 0) setCookie('arrRef',JSON.stringify(arrRef),1);

      //update enclosure
      arrEnc = [];
      disData.enc.forEach(function (enc){
        var names = enc.split('/');path2 = enc.substring(0,enc.length-(names[names.length-1]).length-1);
        file = names[names.length-1];
        arrEnc.push({file:file,path:path2});
      });
      if (arrEnc.length>0) setCookie('arrEnc',JSON.stringify(arrEnc),1);

      //update comments
      arrComm = [];
      disData.disComm.forEach(function (comment){
        arrComm.push({branch:comment.branch, content:comment.content});
      });
      if (arrComm.length>0) setCookie('arrComm',JSON.stringify(arrComm),1);

      loadRefEnc();//go to common.js
  });
}

//function toggle hide Panel
function togglePanelHide(disBool){
  //unhide elements
  if (!disBool){
    $('#newfile').show();$('#butDiv').show();
    if (!window.location.toString().includes("/release/")){
      $('#actBr').show();$('#selDiv').show();
    }
    $('#actTag').show();$('#divTag').show();
    $('#selBr').trigger("chosen:updated");
    $('#selClas').trigger("chosen:updated");
    $('#selTag').trigger("select2:updated");
    $('#butScan').hide();
    $('#commentToggle').show();$('#sideToggle').show();
    //$('#disAnnotate').show();
    //$('#overlay').hide()//display spinner
  } else {
    $('#newfile').hide();$('#actBr').hide();
    $('#selDiv').hide();$('#butDiv').hide();
    $('#actTag').hide();$('#divTag').hide();
    $('#commentToggle').hide();$('#sideToggle').hide();
    //$('#disAnnotate').hide();
    //$('#overlay').show()//display spinner
  }
}
//function toggle processing Panel
function togglePanelProc(disBool){
  //unhide elements
  if (!disBool){
    $('#newfile').show();$('#actBr').show();
    $('#selDiv').show();$('#butDiv').show();
    $('#actTag').show();$('#divTag').show();
    $('#selBr').trigger("chosen:updated");
    $('#selClas').trigger("chosen:updated");
    $('#selTag').trigger("select2:updated");
    $('#butScan').hide();
    $('#commentToggle').show();$('#sideToggle').show();
    //$('#disAnnotate').show();
  } else {
    $('#newfile').show();$('#actBr').hide();
    $('#selDiv').hide();$('#butDiv').hide();
    $('#actTag').hide();$('#divTag').hide();
    $('#butScan').show();$('#butScan').html("&nbsp;Processing...");
    $('#commentToggle').hide();$('#sideToggle').hide();
    //$('#disAnnotate').hide();
  }
}
//Auto refresh Notification
function checkFiles(){
  let todo = {cntMail:$('#countMail').html(), cntComm:$('#notiNr').html()};
  $.ajax({
    type: 'post',
    data: todo,
    url: '/sendincoming',
    success: function(data){
      arrOut = JSON.parse(data);
      //populate incoming
      arrFiles = arrOut.incoming;
      if (arrFiles.length > parseInt($('#notiNr').html(),10)) {sound = document.getElementById('soundNoti'); sound.play();}

      $('#notiNr').html(arrFiles.length);
      $('#notiLabel').html('&nbsp;&nbsp;You have '+ arrFiles.length +' incoming files pending');
      $('#addHere').empty();
      arrFiles.forEach(function (item){
        let file = item.file; let info = item.action;
        if (info!='yes') $('#addHere').append("<li><a style='background-color:DimGray;color:white;' class='dropdown-item media ' href='/incoming/"+file+"'><i class='fa fa-info'></i><p style='color:white;'>"+ file +"</p></a></li>");
        else $('#addHere').append("<li><a style='background-color:Red;color:white;' class='dropdown-item media' href='/incoming/"+file+"'><i class='fa fa-check'></i><p style='color:white;'>"+ file +"</p></a></li>");
      });
      //populate mailfiles
      arrMails = arrOut.mail;
      if (arrMails.length > parseInt($('#countPix').html(),10)) {sound = document.getElementById('soundNoti'); sound.play();}

      $('#countMail').html(arrMails.length);$('#countPix').html(arrMails.length);
      arrMails.reverse(); $('#addMailHere').empty();
      arrMails.forEach (function (file){
        let fileArr = file.split('/'); let filename = fileArr[fileArr.length - 1].substring(0,20);
        file = file.replace(/ /g,"___");file = file.replace(/\./g,'---');
        $('#addMailHere').append("<li><button type='button' onclick=delNotiFile('"+file+"') class='btn btn-danger btn-sm fa fa-times' href='#'></button><button button type='button' class='btn btn-link btn-sm' onclick=openDisFile('"+file+"') href='#'>"+ filename +"</button></li>");
      });


    }
  });
  //$("#notifyme").load(location.href+" #notifyme");
  if (($('#fileroute').val()=='empty') && (document.getElementById("notiNr").innerHTML!='0')){
    location.replace('/incoming');
  }
}

//function load Reference and Enclosures
function loadRefEnc(){
  try{
    var arrRef = [];var arrEnc = []; arrComm = [];
    var disRef = JSON.parse(getCookie('arrRef'));//Update reference sidebar
    if (disRef.length > 0) arrRef = disRef;
    $('#divRef').empty();
    arrRef.forEach(function (ref){
      var newRef = ref.file.replace(/ /g,"___");newRef = newRef.replace(/\./g,'---');
      disDir=ref.path.replace(/:/g,'x--');disDir=disDir.replace(/\./g,'z--');disDir=disDir.replace(/\//g,"---");disDir=disDir.replace(/ /g,"___");
      $('#divRef').append("<div id='ref-"+newRef+"'>&nbsp;&nbsp;&nbsp;&nbsp;<button type='button' onclick=delEncRef('ref','"+newRef+"','arrRef') class='btn btn-danger btn-sm fa fa-times'></button><button type='button' class='btn btn-link btn-sm' onclick=dispAttach('"+disDir+"','"+newRef+"')>"+ref.file+"</button></div>");
    });
    //setCookie('arrRef',JSON.stringify(arrRef),1);
    var disEnc = JSON.parse(getCookie('arrEnc'));//Update enclosure sidebar
    if (disEnc.length > 0) arrEnc = disEnc;
    $('#divEnc').empty();
    arrEnc.forEach(function (enc){
      var newEnc = enc.file.replace(/ /g,"___");newEnc = newEnc.replace(/\./g,'---');
      disDir=enc.path.replace(/:/g,'x--');disDir=disDir.replace(/\./g,'z--');disDir=disDir.replace(/\//g,"---");disDir=disDir.replace(/ /g,"___");
      $('#divEnc').append("<div id='enc-"+newEnc+"'>&nbsp;&nbsp;&nbsp;&nbsp;<button type='button' onclick=delEncRef('enc','"+newEnc+"','arrEnc') class='btn btn-danger btn-sm fa fa-times'></button><button type='button' class='btn btn-link btn-sm' onclick=dispAttach('"+disDir+"','"+newEnc+"')>"+enc.file+"</button></div>");
    });
    //setCookie('arrEnc',JSON.stringify(arrEnc),1);
    //setCookie('arrRef',JSON.stringify(arrRef),1);
    var disComm = JSON.parse(getCookie('arrComm'));//Update enclosure sidebar
    if (disComm.length > 0) arrComm = disComm;
      $('#allComments').empty();
    arrComm.reverse().forEach(function (comm){
      var name = comm.branch.split('-');
      $('#allComments').append(" " +
      "<div id='"+ comm.branch +"' class='box'> "+
      "<a style='color:black;font-family:arial;'><i class='fa fa-tag'></i>&nbsp;"+ name[0] +
      "<i onclick=removeComment('"+ comm.branch +"') style='margin-top:-8px;color:black;' class='btn btn-lg float-right fa fa-times'></i></i></a>" +
      "<div id='commContent'><p>"+ comm.content+"</p></div></div><br id='br-"+ comm.branch +"'>");
    });
  }catch{}
}
//handle bootstrap select and chosen
function selChose(){

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
    $("#selOthers").chosen({
        //disable_search_threshold: 10,
        no_results_text: "Oops, nothing found!",
        width: "100%"
    });
    $("#selBr").chosen({
        //disable_search_threshold: 10,
        no_results_text: "Oops, nothing found!",
        width: "100%"
    });
}
//handle main file onclick
function gotoMain(){
  $('#disPath').val(getCookie('fileOpn'));
  PDFObject.embed(getCookie('fileOpn'), "#pdf_view");
  setCookie('newpathdraw',getCookie('fileOpn'), 1);
  $('#divToggleSign').show();$('#butReturn').show();
  if (($('#disLevel').val().toUpperCase()=="DEP") || ($('#disLevel').val().toUpperCase()=="CO") || ($('#disLevel').val().toUpperCase()=="EAGM") || ($('#disLevel').val().toUpperCase()=="GM")) {
    $('#selPage').empty();
    loadPDF(getCookie('fileOpn')).then(function(res) {
      $('#selPage').empty();
      for (var i=1; i<=res; i++) {$('#selPage').append("<option value='"+i.toString()+"'>"+i.toString()+"</option>");}
      $('#selPage').trigger("chosen:updated");
    });
    $('#disContent').show();$('#disFrame').hide();
    $('#divSign').hide();
    if (($('#disLevel').val().toUpperCase()=="DEP") || ($('#disLevel').val().toUpperCase()=="EAGM")) {
      $('#butApprove').hide();$('#butRelease2').show();
    } else {
      $('#butApprove').show();$('#butRelease2').hide();
    }
  }
  //determine of page is toggled for main or attachment. This is for the annotation
  if (!mainfiledis) togglepage = true;
  else togglepage = false;
  mainfiledis = true; //variable is in annotate draw js
  $('#disAnnotate').show();
}
//handle close popup disWindow
function closWindow(){
  disWindow.close();
  clearInterval(disClock);
}
//handle open file on mail Notification
function openDisFile(filepath){
  filepath = filepath.replace(/___/g," ");filepath = filepath.replace(/---/g,'.');
  setCookie('mailnoti','true');
  arrStr = filepath.split('/');
  mailfile = arrStr[arrStr.length -1];
  mailpath = filepath.substring(0,filepath.length-mailfile.length);
  setCookie('mailpath',mailpath, 1);
  setCookie('mailfile',mailfile, 1);
  location.replace('/fileopen');
}
function delNotiFile(filepath){
  this.event.stopPropagation();
  filepath = filepath.replace(/___/g," ");filepath = filepath.replace(/---/g,'.');
  var user = getCookie('me');
  var todo = {path: filepath, user:user};
    $.ajax({
      type: 'POST',
      url: '/delnotifile',
      data: todo,
      success: function(data){
        setCookie('fileAI','',1);
        location.replace('/incoming');
        //location.replace('/incoming');
      }
    });
}
//handle add comment
function addComment(){

  if ($('#commentinput').val()!=""){
    $('#addCommentBut').hide();
    var disID = getCookie('me');
    disBranch = disID + '-' + Date.now().toString();

    //update cookie
    var arrComment = [];
    try{
      var disComment = JSON.parse(getCookie('arrComm'));
      if (disComment.length > 0) arrComment = disComment;
    }catch{}
    arrComment.push({branch:disBranch, content:$('#commentinput').val()});
    setCookie('arrComm',JSON.stringify(arrComment),1);
    sleep(3000).then(() => {
      $('#allComments').prepend(" " +
      "<div id='"+ disBranch +"' class='box'> "+
      "<a style='color:black;font-family:arial;'><i class='fa fa-tag'></i>&nbsp;"+ disID +
      "<i onclick=removeComment('"+ disBranch +"') style='margin-top:-8px;color:black;' class='btn btn-lg float-right fa fa-times'></i></i></a>" +
      "<div id='commContent'><p>"+ $('#commentinput').val()+"</p></div></div><br id='br-"+ disBranch +"'>");
    }).then(()=>{ $('#commentinput').val('');$('#addCommentBut').show();});
  }


}
//handle remove comment
async function removeComment(disBranch){
  var arrComment = [];
  var disComment = JSON.parse(getCookie('arrComm'));
  if (disComment.length > 0) arrComment = disComment;
  var found = arrComment.find(({branch})=> branch === disBranch);
  var resArr = arrComment.filter(function(res) {return res!=found; });
  await setCookie('arrComm',JSON.stringify(resArr),1);
 sleep(2000).then(() => {
   $('#'+disBranch).remove();$('#br-'+disBranch).remove();
  });
}

//handle delete documents
function deleteDocu(){
  var filepath = getCookie('realpath') + $('#fileroute').val();
  if (window.location.toString().includes("/fileopen")) {
    filepath = getCookie('realpath') + $('#fileroute').val(); brcode = 'fileopen';
  } else if (window.location.toString().includes("/incoming")) {
    filepath = $('#fileroute').val(); brcode = $('#disBranch').val();
  }
  todo = {filepath:filepath, branch:brcode, user:getCookie('me'),  filename:$('#fileroute').val()};
   $.ajax({
     type: 'POST',
     data: todo,
     url: '/deletedoc',
     success: function(data){
       if (data=='successful') {
        $('#lblResult').html("Deleted Successfully!"); location.replace('/incoming');;
        $('#lblResult').html("");$('#passwstaticModal').hide();
      } else if (data=='lastbranch') alert("Deletion denied! Please route this to the originator or to other branch.");
     }
   });
}
//delay
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//Load when html renders
$(document).ready(function(){
    //assign picture based on id ME
  var disID = getCookie('me');
  $('#pixID').attr("src","/images/"+disID+".jpg");
  //handle click open file menu
  $('#menuOpen').on('click', function(){
    setCookie('fileAI',"Empty File",1);
  });
//handle click incoming menu
$('#menuIncoming').on('click', function(){
  setCookie('fileAI',"Empty",1);
});
//handle button butAction
$('#userProf').on('click', function(){
  $('.dropdown-submenu .show').removeClass("show");
});
//handle load user drive

$('#disCheckDrive').on('click', function(){
  let newPath = 'Z:/';
  newPath = getCookie('newPath'); newPath = newPath.substring(0,3);
  //alert(getCookie('newPath'));
  if ((newPath.substring(0,1).toUpperCase()=='D') || (newPath.substring(0,1).toUpperCase()=='/'))  newPath = 'Z:/';
  disWindow = window.open("ie:"+newPath+"","disWindow","width=5px,heigh=5px");
  disClock = setInterval('closWindow()',10000);
});
//Logout click
$('#disLogout').on('click', function(){
      $.ajax({
        type: 'get',
        url: '/logout',
        success: function(data){
          //do something with the data via front-end framework
          location.replace('/');
        }
      });
    return false;
  });
  //handle toggle DUTYADMIN
  $('#switchDuty').on('click', function(e){
    todo = {user:getCookie('me')};
     $.ajax({
       type: 'POST',
       data: todo,
       url: '/switchduty',
       success: function(data){
         if (data=='successful'){
           location.replace('/incoming');
          }
        }
     });
  });

  //handle download
  $('#docDownload').on('click', function(event){
    //event.preventDefault();
    if (window.location.toString().includes("/fileopen")) {
      var encode = window.btoa(getCookie('realpath')+$('#fileroute').val());
      var brCode = window.btoa('fileopen');
      window.location.href = "/downloadfile/"+ encode + "/" + brCode;
    } else if (window.location.toString().includes("/incoming")) {
      var encode = window.btoa($('#fileroute').val());
      if ($('#disBranch').val()=='RELEASE') $('#disBranch').val('Release');
      var brCode = window.btoa($('#disBranch').val());
      window.location.href = "/downloadfile/"+ encode + "/" + brCode;
    }
  });
  //handle delete file
  $('#passwmodPass').keypress(function(e){
    if (e.which==13) deleteDocu();
  });
  $('#docDelete').on('click', function (event){
    //event.preventDefault();
    deleteDocu();
  });


//start auto refresh Notification
checkFiles();
setInterval('checkFiles();',20000);
});
