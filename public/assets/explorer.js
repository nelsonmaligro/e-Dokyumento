//function show file explorer on clicked
function showFiles(disFile, disDir){
  $('#overlay').show();
  newFile = disFile.replace(/___/g," ");newFile = newFile.replace(/---/g,'.');
  var olddisDir = disDir;
  disDir=disDir.replace(/x--/g,':');disDir=disDir.replace(/z--/g,'.');disDir=disDir.replace(/---/g,"/");disDir=disDir.replace(/___/g," ");
  if (disDir.substring(disDir.length - 1) != "/") disDir = disDir + '/';
  var todo = {path:disDir,file:newFile};
  setCookie('realpath',disDir,1);setCookie('fileAI',newFile,1);
    $.ajax({
      type: 'POST',
      url: '/explorershow',
      data: todo,
      success: function(data){
        $('#overlay').hide();
        let parseData = JSON.parse(data);
        parseData.forEach(function (disData){
          $('#metaAuthor').val(disData.disAuthor);
          $('#metaDeyt').val(disData.disDeyt);
          $('#metaSize').val(disData.disSize);
          $('#metaClass').val(disData.disClas);
          setCookie('clasAI',disData.disClas,1); //store classification to cookie
          //store tags to cookie and append to select option
          $('#metaTags').empty();
          setCookie('tagAI',JSON.stringify(disData.disTag),1);
          disData.disTag.forEach((item, i) => {
            $('#metaTags').append('<option value="'+item+'">'+item+'</option>');
          });
          //store reference to cookie and append to select option
          $('#metaRef').empty();let arrRef = [];
          disData.ref.forEach((item, i) => {
            $('#metaRef').append('<option value="'+item+'">'+item+'</option>');
            var names = item.split('/');
            path2 = item.substring(0,item.length-(names[names.length-1]).length);
            file = names[names.length-1];
            arrRef.push({file:file,path:path2});
          });
          setCookie('arrRef',JSON.stringify(arrRef),1);
          //store enclosure to cookie and append to select option
          $('#metaEnc').empty();let arrEnc = [];
          setCookie('arrEnc',disData.enc,1);
          disData.enc.forEach((item, i) => {
            $('#metaEnc').append('<option value="'+item+'">'+item+'</option>');
            var names = item.split('/');
            path2 = item.substring(0,item.length-(names[names.length-1]).length);
            file = names[names.length-1];
            arrEnc.push({file:file,path:path2});
          });
          setCookie('arrEnc',JSON.stringify(arrEnc),1);
          //store comments to cookie and append to select option
          $('#metaComment').empty();let arrComm = [];
          setCookie('arrComm',disData.disComm,1);
          disData.disComm.reverse().forEach((item, i) => {
            $('#metaComment').append('<option value="'+item.content+'">'+item.content+'</option>');
            arrComm.push({branch:item.branch,content:item.content});
          });
          setCookie('arrComm',JSON.stringify(arrComm),1);
          //Display Preview
          PDFObject.embed(disData.tempPath, "#pdf_view");
          //if mobile phone used
          if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))  {
            document.getElementById('pdf_view').style.display="none";
            document.getElementById('disContentMobile').style.display="";
            loadPDFtoCanvas(disData.tempPath);
          }
        });
      }
    });
}

//function to expand directory
function showDirs(path){
  classPath = path.replace(/___/g," ");classPath = classPath.replace(/x--/g,":");classPath=classPath.replace(/z--/g,".");classPath = classPath.replace(/---/g,"/");
  if (classPath.substring(classPath.length - 1) != "/") classPath = classPath + "/";
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
        try{
          $('#'+path+'').empty();
          for (var i=0; i < dirs.length; i++)
          {
             classDirs = dirs[i].replace(/ /g,"___");classDirs=classDirs.replace(/\./g,"z--");
             $('#'+path+'').append("<li><a onclick=showDirs('"+path+"---"+classDirs+"')  href='#'>" + dirs[i] +"</a><ul><div id='"+path+"---"+classDirs+"'></div></ul></li>");
          }
        } catch {}
        $('#disFileTree').empty();
        for (var i=0; i < files.length; i++)
        {
          disFile = files[i].replace(/ /g,"___");disFile = disFile.replace(/\./g,'---');
          let iconFile = outIconFile(disFile.substring(disFile.length-4));
          let colorFile = outColorFile(disFile.substring(disFile.length-4));
          $('#disFileTree').append("<div class='col-12'><a style='color:black;' class='btn-link' onclick=showFiles('"+disFile+"','"+path+"')  href='#'><i style='"+colorFile+"' class='"+iconFile+"'></i>&nbsp;&nbsp;" + files[i] +"</a></div>");
        }
        $('#disFolderTree').filetree();
        setCookie('fileAI','',1);
        setCookie('realpath',classPath,1);
      }
    });
}
//function select filetype and output icon fonts
function outIconFile(ext){
  if (ext.toLowerCase().includes('pdf')) {
    return 'fa fa-file-pdf-o';
  } else if (ext.toLowerCase().includes('doc')) {
    return 'fa fa-file-word-o';
  } else if (ext.toLowerCase().includes('xls')) {
    return 'fa fa-file-excel-o';
  } else if (ext.toLowerCase().includes('ppt')) {
    return 'fa fa-file-powerpoint-o';
  } else {
    return 'fa fa-file-o';
  }
}
//function select filetype and output icon fonts
function outColorFile(ext){
  if (ext.toLowerCase().includes('pdf')) {
    return 'color:red;';
  } else if (ext.toLowerCase().includes('doc')) {
    return 'color:blue;';
  } else if (ext.toLowerCase().includes('xls')) {
    return 'color:mediumseagreen;';
  } else if (ext.toLowerCase().includes('ppt')) {
    return 'color:violet;';
  } else {
    return 'color:darkslategray;';
  }
}
//function to load default folders
function loadFolders(path){
  var todo = {path:path + '/'};
    $.ajax({
      type: 'POST',
      url: '/browsedrive',
      data: todo,
      success: function(data){
        var arrObj = JSON.parse(data);
        var dirs = arrObj['dirs'];
        var files = arrObj['files'];
        $('#disFolderTree').empty();
        $('#disFileTree').empty();
        $('#disFolderTree').append("\ ");
        classPath=path.replace(/\//g,"---");classPath=classPath.replace(/:/g,'x--');classPath=classPath.replace(/ /g,"___");classPath=classPath.replace(/\./g,"z--");
        for (var i=0; i < dirs.length; i++)
        {
          classDirs = dirs[i].replace(/ /g,"___");classDirs=classDirs.replace(/\./g,"z--");
          $('#disFolderTree').append("<li><a onclick=showDirs('"+classPath+"---"+classDirs+"')  href='#'>" + dirs[i] +"</a><ul><div  id='"+classPath+"---"+classDirs+"'></div></ul></li>");
        }
        for (var i=0; i < files.length; i++)
        {
          disFile = files[i].replace(/ /g,"___");disFile = disFile.replace(/\./g,'---');
          let iconFile = outIconFile(disFile.substring(disFile.length-4));
          let colorFile = outColorFile(disFile.substring(disFile.length-4));
          $('#disFileTree').append("<div class='col-12'><a style='color:black;' class='btn-link' onclick=showFiles('"+disFile+"','"+classPath+"')  href='#'><i style='"+colorFile+"' class='"+iconFile+"'></i>&nbsp;&nbsp;" + files[i] +"</a></div>");
        }
        $('#disFolderTree').filetree();
      }
    });

}
//function send/share file to user
function sendExploreUser(userbranch){
  let fileclick = getCookie('fileAI');
  if ((fileclick!='Empty File') && (fileclick!='')){
    $('#overlay').show()//display spinner
    var branch = ''; //$('#selClas');
    var tag = getCookie('tagAI');
    var arrRef = getCookie('arrRef');
    var arrEnc = getCookie('arrEnc');
    var arrComm = getCookie('arrComm');
    var user = getCookie('me');
    let realPath = getCookie('realpath');
    var todo = {path: realPath, newfile:fileclick, send:userbranch, user:user, fileroute: fileclick, class:branch, tag:tag, refs:arrRef, encs:arrEnc, comments:arrComm};
      $.ajax({
        type: 'POST',
        url: '/senduser',
        data: todo,
        success: function(data){
          $('#overlay').hide()//display spinner
          if (data=='successful') $('#mstrmodDisp').html("<p>File Successfully Sent!</p>");
          else $('#mstrmodDisp').html("<p>File sending failed! Document is currently opened by another user. </p>");
          $('#mstrtoggleDialog').click();
        }
      });
  }

}
//handle function for routing to branch Explorer
function routetoBranchExplore(e, branch){
  let fileclick = getCookie('fileAI');
  if ((fileclick!='Empty File') && (fileclick!='')){
    brscanner.stop();scanner.stop();$('#app').hide();togglecam=false;brtogglecam=false;
    qrClick = false;
    //initialize objects to hide and show
    $('#routeBody').show();$('#routeattachPage').show();$('#disrouteTitle').hide();
    $('#divroyalCam').hide();$('#royalbutConfirm').hide();$('#routebutConfirm').show();
    setCookie('tempPass','',1);
    $('#routeselBr').val(branch);
    $('#disContRout').hide();
        $('#disContRout').hide();$('#lbltmp').val(getCookie('fileAI'));
          $('#divSubject').show();
          document.getElementById('divCamPass').style.top="-5px";
          document.getElementById('routeBody').style="margin-top:-20px;";
        $('#routeSubject').val(getCookie('fileAI').split('.')[0]);
        var options = {
          height: "400px",
        };
        PDFObject.embed('/drive/PDF-temp/route-'+getCookie('fileAI')+'.pdf', "#routeattachPage",options);
        $('#routeselBr').trigger("chosen:updated");
  } else {
    e.stopPropagation();
    //$('#routeButCanc').click();
    //closeDialog();

  }
}

//Page Loaded
$(document).ready(function(e){

  loadFolders('D:/drive');
  setCookie('fileAI','Empty File',1);
  //handle click view button
 $('#butExploreView').on('click', function(event) {
    if ((getCookie('fileAI')!='Empty File') && (getCookie('fileAI')!='')) {
      setCookie('showExploreFile','true',1);
      location.replace('/fileopen');
    } else alert ('Please Select a File!');

 });
 //handle click edit buttons
 $('#butExploreEdit').on('click', function(event){
      var newfile = getCookie('fileAI');
      if ((newfile!='Empty File') && (newfile!='')){
        if (!newfile.includes('.')) {alert ('File extension not recognized!'); return false;}
          event.preventDefault(); // Recommended to stop the link from doing anything else
          var newPath = getCookie('realpath');
          var splitChar = [];
          if (newPath.includes('/')) splitChar = newPath.split('/');
          else if (newPath.includes('\\')) splitChar = newPath.split('\\');
          var allPath = 'Z:/';
          if (splitChar[0].includes(':')) { for (x=2;x < splitChar.length-1; x++) {allPath = allPath + splitChar[x] + '/';}}
          else { for (x=1;x < splitChar.length-1; x++) {allPath = allPath + splitChar[x] + '/';}}
          disWindow = window.open("ie:"+allPath+newfile+"","disWindow","width=5px,heigh=5px");
          //start auto refresh Notification
          disClock = setInterval('closWindow()',20000);
      }
  });
 //handle click delete buttons
 $('#butExploreDelete').on('click',(event)=>{
   let fileclick = getCookie('fileAI');
    if ((fileclick!='Empty File') && (fileclick!='')){
     var filepath = getCookie('realpath') + fileclick; brcode = 'fileopen';
     todo = {filepath:filepath, branch:brcode, user:getCookie('me'),  filename:$('#fileroute').val()};
      $.ajax({
        type: 'POST',
        data: todo,
        url: '/deletedoc',
        success: function(data){
          if (data=='successful') {
           showDirs(getCookie('realpath'));
         } else alert("Deletion failed!");
        }
      });
  }
 });
 //handle click download buttons
 $('#butExploreDownload').on('click',(event)=>{
   let fileclick = getCookie('fileAI');
    if ((fileclick!='Empty File') && (fileclick!='')){
     var encode = window.btoa(getCookie('realpath')+fileclick);
     var brCode = window.btoa('fileopen');
     window.location.href = "/downloadfile/"+ encode + "/" + brCode;
   }

 });

 //stop close on selecting others
 $("#selExploreOthers").on('click', function (event){
     event.stopPropagation();
     //event.preventDefault();
 });
 //handle send Explorer file to other
 $("#othExploreSend").on('click', function(e){
     $('.dropdown-submenu .show').removeClass("show");
     sendExploreUser($('#selExploreOthers').val());
 });

 //handle click on confirm explorer routing button
       $('#routeExplorebutConfirm').on('click', function(event){
         if ($('#routeselBr').val()==null) {
           alert('Input Branch to Route!'); return;
         }
         if (qrClick){ //if routing slip is signed with password or QR Code
           $('#overlay').show()//display spinner
          $('#routemodClose').click();
           var fileroute = getCookie('fileAI');
           var branch = $('#routeselBr');
           var tag = getCookie('tagAI');
           var arrRef = getCookie('arrRef');
           var arrEnc = getCookie('arrEnc');
           var arrComm = getCookie('arrComm');
           var user = getCookie('me');
           var todo = {save: 'openroute', hashval:getCookie('tempPass'), monitfile:fileroute, fileroute: fileroute, path: getCookie('realpath'), newfile:fileroute, branch:branch.val(), class: getCookie('clasAI'), tag:tag, user:user, refs:arrRef, encs:arrEnc, comments:arrComm };
              $.ajax({
               type: 'POST',
               url: '/incoming',
               data: todo,
               success: function(data){
                 $('#overlay').hide()//display spinner
                 if (data=='successful') {
                   $('#mstrmodDisp').html("<p>File Successfully Routed!</p>");
                   $('#mstrtoggleDialog').click();
                 }
                 else alert('Routing Failed! Make sure the file is not opened by other application');
               }
             });
           closeDialog();
           $('#routeButCanc').click();
         }else {
           alert('Please scan your QR Code or type-in passwword to sign the routing slip');
         }
      });
      //if mobile phone used
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))  {
        document.getElementById('pdf_view').style.display="none";
        document.getElementById('disContentMobile').style.display="";
      }
});
