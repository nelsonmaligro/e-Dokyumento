//function show file explorer on clicked
function showFiles(disFile, disDir){
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
        let parseData = JSON.parse(data);
        parseData.forEach(function (disData){
          $('#metaAuthor').val(disData.disAuthor);
          $('#metaDeyt').val(disData.disDeyt);
          $('#metaSize').val(disData.disSize);
          $('#metaClass').val(disData.disClas);
          $('#metaTags').empty();
          disData.disTag.forEach((item, i) => {
            $('#metaTags').append('<option value="'+item+'">'+item+'</option>');
          });
          $('#metaRef').empty();
          disData.ref.forEach((item, i) => {
            $('#metaRef').append('<option value="'+item+'">'+item+'</option>');
          });
          $('#metaEnc').empty();
          disData.enc.forEach((item, i) => {
            $('#metaEnc').append('<option value="'+item+'">'+item+'</option>');
          });
          $('#metaComment').empty();
          disData.disComm.forEach((item, i) => {
            $('#metaComment').append('<option value="'+item.content+'">'+item.content+'</option>');
          });
          //setCookie('realpath',disData.realpath,1);setCookie('fileAI',disData.disp,1);
        });
      }
    });
}

//function to expand directory
function showDirs(path){
  classPath = path.replace(/___/g," ");classPath = classPath.replace(/x--/g,":");classPath=classPath.replace(/z--/g,".");classPath = classPath.replace(/---/g,"/");
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
        for (var i=0; i < dirs.length; i++)
        {
           classDirs = dirs[i].replace(/ /g,"___");classDirs=classDirs.replace(/\./g,"z--");
           $('#'+path+'').append("<li><a onclick=showDirs('"+path+"---"+classDirs+"')  href='#'>" + dirs[i] +"</a><ul><div id='"+path+"---"+classDirs+"'></div></ul></li>");
        }
        $('#disFileTree').empty();
        for (var i=0; i < files.length; i++)
        {
          disFile = files[i].replace(/ /g,"___");disFile = disFile.replace(/\./g,'---');
          let iconFile = outIconFile(disFile.substring(disFile.length-4));
          let colorFile = outColorFile(disFile.substring(disFile.length-4));
          $('#disFileTree').append("<div class='col-12'><a style='color:chocolate;' class='btn-link' onclick=showFiles('"+disFile+"','"+path+"')  href='#'><i style='"+colorFile+"' class='"+iconFile+"'></i>&nbsp;&nbsp;" + files[i] +"</a></div>");
        }
        $('#disFolderTree').filetree();
        $('#disFolderTree').width="100%";

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
          $('#disFileTree').append("<div class='col-12'><a style='color:chocolate;' class='btn-link' onclick=showFiles('"+disFile+"','"+classPath+"')  href='#'><i style='"+colorFile+"' class='"+iconFile+"'></i>&nbsp;&nbsp;" + files[i] +"</a></div>");
        }
        $('#disFolderTree').filetree();
        $('#disFolderTree').width="100%";


      }
    });

}
$(document).ready(function(e){

  loadFolders('D:/drive');
  setCookie('fileAI','Empty File',1);
  //handle click view button
 $('#butExploreView').on('click', function(event) {
    if (getCookie('fileAI')!='Empty File'){
      setCookie('showExploreFile','true',1);
      location.replace('/fileopen');
    } else alert ('Please Select a File!');

 });
 //handle click edit buttons
 $('#butExploreEdit').on('click', function(event){
      var newfile = getCookie('fileAI');
      if (!newfile.includes('.')) {alert ('File extension not recognized!'); return false;}
        event.preventDefault(); // Recommended to stop the link from doing anything else
        var newPath = getCookie('realpath');
        var splitChar = [];
        if (newPath.includes('/')) splitChar = newPath.split('/');
        else if (newPath.includes('\\')) splitChar = newPath.split('\\');
        var allPath = 'Z:/';
        if (splitChar[0].includes(':')) { for (x=2;x < splitChar.length-1; x++) {allPath = allPath + splitChar[x] + '/';}}
        else { for (x=1;x < splitChar.length-1; x++) {allPath = allPath + splitChar[x] + '/';}}
        //if (newPath.toUpperCase().includes('D:/DRIVE')) newPath = newPath.toUpperCase().replace('D:/DRIVE','Z:');
        //if (newPath.toUpperCase().substring(0,2)=='D:') newPath = newPath.toUpperCase().replace(newPath.substring(0,2),'Z:');
        disWindow = window.open("ie:"+allPath+newfile+"","disWindow","width=5px,heigh=5px");
        //start auto refresh Notification
        disClock = setInterval('closWindow()',20000);
 });

});
