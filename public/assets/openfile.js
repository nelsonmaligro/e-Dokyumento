
//load modal when opening file
function triggerButFile(){
  if (getCookie('mailnoti')=='true'){ //if opened from mail notification
    selChose();togglePanelHide(true);$('#overlay').show();
    var todo = {path:getCookie('mailpath'),file:getCookie('mailfile')};
    $.ajax({
      type: 'POST',
      url: '/fileopen',
      data: todo,
      success: function(data){
        togglePanelHide(false);selChose();$('#overlay').hide();
        if (data!="notfound") {
          handleOpenFile(data); //perform function for opening of file
        }
        //toggle digital signature verification
        let parseData = JSON.parse(data);
        parseData.forEach(function (disData){
          openfilevalidatecert(disData.signres);
        });
        //check if mobile browser
        displayforMobile();
      }
    });
    setCookie('mailnoti','false');
  } else { //if standard opening of file through the menu
    if (($('#newfile').val()=='Empty File') && (getCookie('fileAI')=='Empty File')) { //no file is selected....not reloaded
      $('#butFileopen').click(); //invoke opening of modal dialog box for file opening
      document.getElementById("largeModalLabel").innerHTML = "Browse File to Open";
      document.getElementById("Page").style.display = "none";
      modalDisplay('fileopen','D:/drive'); //perform function when opening file.....initialize directory
    } else { //if file is already selected.....the page is only reloaded
      //assign element values for the opened file
      $('#fileroute').val(getCookie('fileAI'));selChose();$('#overlay').show();
      $('#newfile').val(getCookie('fileAI'));$("#selClas").val(getCookie('clasAI'));
      $('#disPath').val(getCookie('fileOpn'));$('#selTag').val(JSON.parse(getCookie('tagAI')));
      //query updated file to be loaded
      var todo = {path:getCookie('realpath'),file:$('#newfile').val()};
      $.ajax({
        type: 'POST',
        url: '/fileopen',
        data: todo,
        success: function(data){
          $('#overlay').hide();
          PDFObject.embed(getCookie('fileOpn'), "#pdf_view"); //load file on the canvas
          queryDoc(); //store metadata of the document...go to common.js
          //toggle digital signature verification
          let parseData = JSON.parse(data);
          parseData.forEach(function (disData){
            openfilevalidatecert(disData.signres);
          });
          displayforMobile(); //display for mobile browser
        }
      });
    }
  }
}
//function to match the display for the mobile browser
function displayforMobile(){
  //for mobile phone users
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))  {
    document.getElementById('disContent').style.display="none";
    document.getElementById('disContentMobile').style.display="";
    loadPDFtoCanvas($('#disPath').val());
  }
}
//function for validating attched digital certificate of the file openned
function openfilevalidatecert(signres){
  if (signres){
    if (signres.message!='signed'){
      $('#disDigCert').hide();
    } else {
      $('#disDigCert').show();
      mainnfo = [signres.authenticity,signres.integrity,signres.expired,signres.meta.certs[0].issuedBy,signres.meta.certs[0].issuedTo, signres.meta.certs[0].validityPeriod];
      if (signres.verified) {
        $('#disDigCert').html("<button  id='digcertDraw' class='btn btn-sm btn-success' type='button' onclick='displaycertinfoparam("+JSON.stringify(mainnfo)+")'> <i class='fa fa-check'></i> Verified Digital Certificate </button>&nbsp;");
      } else {
        $('#disDigCert').html("<button  id='digcertDraw' class='btn btn-sm btn-danger' type='button' onclick='displaycertinfoparam("+JSON.stringify(mainnfo)+")'> <i class='fa fa-times'></i> Unverified Digital Certificate </button>&nbsp;");
      }
    }
  }
}
//handle opening of file
function handleOpenFile(data){
  //Load all file metadata
  var arrData = JSON.parse(data);
  arrData.forEach(function (disData){
    PDFObject.embed(disData.path, "#pdf_view");
    var newPath =disData.realpath;
    if (newPath.toUpperCase().includes('D:/DRIVE/')) newPath = newPath.toUpperCase().replace('D:/DRIVE/', disData.openpath);
    else newPath = newPath.toUpperCase().replace(newPath.substring(0,3), disData.openpath);
    setCookie('realpath', disData.realpath,1);
    setCookie('newPath', newPath,1);
    $('#disPath').val(disData.path);
    setCookie('fileOpn',disData.path,1);
    updateSelectPage();
    //update filename textbox
    $('#newfile').val(disData.disp);
    $('#fileroute').val(disData.disp);
    setCookie('fileAI',$('#newfile').val(),1);
    setCookie('pathAI',disData.path,1);
    //update select classification
    $("#selClas").val(disData.disClas);
    setCookie('clasAI',$('#selClas').val(),1);
    //update select tags
    $("#selTag").val(disData.disTag)
    setCookie('tagAI',JSON.stringify($('#selTag').val()),1);
    selChose(); //trigger jquery for select2 and chosen
    //update reference
    $('#divRef').empty();var arrRef = [];
    disData.ref.forEach(function (ref){
      $('#refTrue').val('true');
      var names = ref.split('/');
      path = ref.substring(0,ref.length-(names[names.length-1]).length-1);path2 = ref.substring(0,ref.length-(names[names.length-1]).length);
      //replace special characters to prevent error in the html embedding
      classPath=path.replace(/\//g,"---");classPath=classPath.replace(/\(/g,'u--');classPath=classPath.replace(/\)/g,'v--');classPath=classPath.replace(/:/g,'x--');classPath=classPath.replace(/ /g,"___");classPath=classPath.replace(/\./g,"z--");
        file = names[names.length-1];
        disFile = file.replace(/ /g,"___");disFile = disFile.replace(/\(/g,'u--');disFile = disFile.replace(/\)/g,'v--');disFile = disFile.replace(/\./g,'---');
        showFile(disFile, classPath, "refenc");//adding of files to the reference sider bar......from modal.js
        arrRef.push({file:file,path:path2});
      });
      setCookie('arrRef',JSON.stringify(arrRef),1);
      //update enclosure
      $('#divEnc').empty();arrEnc = [];
      disData.enc.forEach(function (enc){
        $('#refTrue').val('false');
        var names = enc.split('/');
        path = enc.substring(0,enc.length-(names[names.length-1]).length-1);path2 = enc.substring(0,enc.length-(names[names.length-1]).length);
        //replace special characters to prevent error in the html embedding
        classPath=path.replace(/\//g,"---");classPath=classPath.replace(/\(/g,'u--');classPath=classPath.replace(/\)/g,'v--');classPath=classPath.replace(/:/g,'x--');classPath=classPath.replace(/ /g,"___");classPath=classPath.replace(/\./g,"z--");
          file = names[names.length-1];
          disFile = file.replace(/ /g,"___");disFile = disFile.replace(/\(/g,'u--');disFile = disFile.replace(/\)/g,'v--');disFile = disFile.replace(/\./g,'---');
          showFile(disFile, classPath, "refenc"); //adding of files to the enclosure sidebar....from modal.js
          arrEnc.push({file:file,path:path2});
        });
        setCookie('arrEnc',JSON.stringify(arrEnc),1);
        //update comments
        $('#allComments').empty();arrComm = [];
        disData.disComm.reverse().forEach(function (comm){
          var name = comm.branch.split('-');
          $('#allComments').append(" " +
          "<div id='"+ comm.branch +"' class='box'> "+
          "<a style='color:black;font-family:arial;'><i class='fa fa-tag'></i>&nbsp;"+ name[0] +
          "<i onclick=removeComment('"+ comm.branch +"') style='margin-top:-8px;color:black;' class='btn btn-lg float-right fa fa-times'></i></i></a>" +
          "<div id='commContent'><p>"+ comm.content+"</p></div></div><br id='br-"+ comm.branch +"'>");
          arrComm.push({branch:comm.branch,content:comm.content});
        });
        setCookie('arrComm',JSON.stringify(arrComm),1); //set comments
      });
    }


    //Load when html renders
    $(document).ready(function(){
      //initialize....check if file already selected from explorer page
      if (getCookie('showExploreFile')=='true'){
        setCookie('showExploreFile','false',1);
        showFile(getCookie('fileAI'), getCookie('realpath'), 'fileopen'); //load the file selected from the explorer page.....from modal.js
        displayforMobile();
      } else triggerButFile(); //fire up opening of file with modal dialog

      //initialize elements in the page
      var disID = getCookie('me');
      document.getElementById('docSave').innerHTML = "Save Metadata";
      document.getElementById('docEdit').style.display = "block";
      document.getElementById('docSend').style.display = "block";
      $('#signDocBut').show();
      //document.getElementById('signDocBut').style.display = "block";
      setCookie('noDate','true',1);

      //handle doocument edit in file Server
      $('#docEdit').on('click', function(event){
        if (window.location.toString().includes("/fileopen")) {
          if (!$('#newfile').val().includes('.')) {alert ('File extension not recognized!'); return false;}
          event.preventDefault(); // Recommended to stop the link from doing anything else
          var newPath = getCookie('newPath');
          var splitChar = [];
          //replace the drive from the absolute path with the mapped drive
          if (newPath.includes('/')) splitChar = newPath.split('/');
          else if (newPath.includes('\\')) splitChar = newPath.split('\\');
          var allPath = 'Z:/';
          if (splitChar[0].includes(':')) { for (x=2;x < splitChar.length; x++) {allPath = allPath + splitChar[x] + '/';}}
          else { for (x=1;x < splitChar.length; x++) {allPath = allPath + splitChar[x] + '/';}}
          var newfile = $('#newfile').val();
          //opens the mapped drive.....run the registry file to enable the ie option
          disWindow = window.open("ie:"+newPath+newfile+"","disWindow","width=5px,heigh=5px");
          //start auto refresh Notification
          disClock = setInterval('closWindow()',20000); //automatically close the window after 20 sec
        }
      });
      //handle document saving in open file
      $('#docSave').on('click', function(event){
        if (!$('#newfile').val().includes('.')) {alert ('File extension not recognized!'); return false;}
        if (window.location.toString().includes("/fileopen")) {
          if (getCookie('viewBr') != "openroute") { //this is to establish exclusivity of the file and prevent error during saving
            alert('Multiple session opened! Repeat changes on metadata upon reloading...'); window.location.reload(); return;
          }
        }
        event.preventDefault();
        $('#overlay').show();
        var fileroute = $('#fileroute');
        var branch = $('#selClas');
        var tag = $('#selTag').val(); if (tag===null) tag = [];
        var arrRef = getCookie('arrRef');
        var arrEnc = getCookie('arrEnc');
        var realPath = getCookie('realpath');

        var arrComm = getCookie('arrComm');
        var user = disID;
        var todo = {fileroute: fileroute.val(), path: realPath, class:branch.val(), tag:JSON.stringify(tag), user:user, refs:arrRef, encs:arrEnc, comments:arrComm};
        //setCookie('fileAI',newfile.val());
        if (fileroute.val()!='empty'){
          //return cookie
          setCookie('fileAI',$('#newfile').val());
          setCookie('fileOpn',$('#disPath').val());
          $('#selTag').val(JSON.parse(getCookie('tagAI')));
          //send metadata to update information about the file
          $.ajax({
            type: 'POST',
            url: '/savemetadata',
            data: todo,
            success: function(data){
              $('#overlay').hide();
              if (data!='fail') location.replace('/fileopen');
              else alert('Update Failed! Document is currently opened by another user.')
            }
          });
        }
        return false;
      });
      updateSelectPage();


    });
