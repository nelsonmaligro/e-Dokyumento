var selecSearch = ''; var selectVal ='';
function emptyAllbox(exField){
  let arrField =['selCusClas','selCusTag','selCusFilename','datepick','selCusSize','selCusAuthor','selCusCont']
  arrField = arrField.filter(el => el != exField);
  arrField.forEach((item, i) => {
    $('#'+item).val('');
  });
}
//if classification selected for searching
$('#selCusClas').change((e)=>{
  selectSearch = 'class';
  emptyAllbox('selCusClas');
});
//if classification selected for searching
$('#selCusTag').change((e)=>{
  selectSearch = 'tag';
  emptyAllbox('selCusTag');
});
//if filename entered for searching
$('#selCusFilename').keypress((e)=>{
  selectSearch = 'filename';
  emptyAllbox('selCusFilename');
});

//if Author entered for searching
$('#selCusAuthor').keypress((e)=>{
  selectSearch = 'author';
  emptyAllbox('selCusAuthor');
});
//if size entered for searching
$('#selCusSize').keypress((e)=>{
  selectSearch = 'size';
  emptyAllbox('selCusSize');
});
//handle click delete buttons
$('#butCustSearch').on('click', function(event){
    $('#overlay').show();let grtr = '>';
    switch (selectSearch) {
      case 'class': selectVal=$('#selCusClas').val(); break;
      case 'tag': selectVal=$('#selCusTag').val(); break;
      case 'author': selectVal=$('#selCusAuthor').val(); break;
      case 'filename': selectVal=$('#selCusFilename').val(); break;
      case 'size':
        let sizeVal = selectVal=$('#selCusSize').val();
        if (sizeVal.includes('<')) grtr = '<' ;
        selectVal = sizeVal.match(/[0-9]*\.[0-9]*/);
        if (selectVal==null) selectVal = sizeVal.match(/[0-9]*/);
       break;
      case 'datepick':
        let arrDate = $('#datepick').val().split('-');
        selectVal = arrDate[0].trim(); grtr = arrDate[1].trim();
        break;
    }
    todo = {user:getCookie('me'), class:selectVal, select:selectSearch, grtr:grtr};
    $.ajax({
      type: 'POST',
      data: todo,
      url: '/searchadv',
      success: function(data) {
          $('#overlay').hide();
        var arrObj = JSON.parse(data);
        $('#disFileTree').empty();
        $('#disFileTree').append("<table style='width:100%;>");
        arrObj.forEach((item, i) => {
          $('#disFileTree').append("<tr style='border: 1px solid black;'>");
          disFile = item.title.replace(/ /g,"___");disFile = disFile.replace(/\(/g,'u--');disFile = disFile.replace(/\)/g,'v--');disFile = disFile.replace(/\./g,'---');
          classPath=item.filename.replace(/\//g,"---");classPath=classPath.replace(/\(/g,'u--');classPath=classPath.replace(/\)/g,'v--');classPath=classPath.replace(/:/g,'x--');classPath=classPath.replace(/ /g,"___");classPath=classPath.replace(/\./g,"z--");
          let iconFile = outIconFile(disFile.substring(disFile.length-4));
          let colorFile = outColorFile(disFile.substring(disFile.length-4));
          $('#disFileTree').append("<td style='border-bottom: 1px solid black;'><div class='col-1 pl-0 pr-0'><a class='btn-link' onclick=editFiles('"+classPath+"','"+disFile+"')  href='#'style='color:blue'><i class='fa fa-eye'></i></a></div></td> \
          <td style='border-bottom: 1px solid black;'><div class='col-6' style='width:420px;'><a style='color:black;font-size:14px;' class='btn-link' onclick=showFiles('"+classPath+"','"+disFile+"')  href='#'><i style='"+colorFile+"' class='"+iconFile+"'></i>&nbsp;&nbsp;" + item.title +"</a></div></td> \
          <td style='border-bottom: 1px solid black;'><div class='col-5' style='width:420px;'><a class='pl-2' style='color:gray;font-size:10px;background-color:white;'>"+item.filename+"</a></div></td>");
          $('#disFileTree').append("</tr>")
        });
        $('#disFileTree').append("</table>");
      }
    });
});
//function open file on clicked
function editFiles(disDir, disFile){
  newFile = disFile.replace(/___/g," ");newFile = newFile.replace(/u--/g,'(');newFile = newFile.replace(/v--/g,')');newFile = newFile.replace(/---/g,'.');
  var olddisDir = disDir;
  disDir=disDir.replace(/x--/g,':');disDir=disDir.replace(/u--/g,'(');disDir=disDir.replace(/v--/g,')');disDir=disDir.replace(/z--/g,'.');disDir=disDir.replace(/---/g,"/");disDir=disDir.replace(/___/g," ");
  disDir=disDir.substring(0,disDir.length-newFile.length);
  setCookie('realpath',disDir,1);setCookie('fileAI',newFile,1)
  //setCookie('realpath',classPath,1);
    setCookie('showExploreFile','true',1);
    location.replace('/fileopen');
}
//function show file on clicked
function showFiles(disDir,disFile){
  $('#overlay').show();
  newFile = disFile.replace(/___/g," ");newFile = newFile.replace(/u--/g,'(');newFile = newFile.replace(/v--/g,')');newFile = newFile.replace(/---/g,'.');
  var olddisDir = disDir;
  disDir=disDir.replace(/x--/g,':');disDir=disDir.replace(/u--/g,'(');disDir=disDir.replace(/v--/g,')');disDir=disDir.replace(/z--/g,'.');disDir=disDir.replace(/---/g,"/");disDir=disDir.replace(/___/g," ");
  var todo = {path:disDir,file:newFile};
  $.ajax({
    type: 'POST',
    url: '/searchshow',
    data: todo,
    success: function(data){
      $('#overlay').hide();
      let parseData = JSON.parse(data);
      parseData.forEach(function (disData){
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
  classPath = path.replace(/___/g," ");classPath=classPath.replace(/\(/g,'u--');classPath=classPath.replace(/\)/g,'v--');classPath = classPath.replace(/x--/g,":");classPath=classPath.replace(/z--/g,".");classPath = classPath.replace(/---/g,"/");
  if (classPath.substring(classPath.length - 1) != "/") classPath = classPath + "/";
  var todo = {path:classPath};
  $.ajax({
    type: 'POST',
    url: '/browsedrive',
    data: todo,
    success: function(data){
      var arrObj = JSON.parse(data);
      //update folder tree
      try{
        $('#'+path+'').empty();
        for (var i=0; i < dirs.length; i++)
        {
          classDirs = dirs[i].replace(/ /g,"___");classDirs=classDirs.replace(/\(/g,"u--");classDirs=classDirs.replace(/\)/g,"v--");classDirs=classDirs.replace(/\./g,"z--");
          $('#'+path+'').append("<li><a onclick=showDirs('"+path+"---"+classDirs+"')  href='#'>" + dirs[i] +"</a><ul><div id='"+path+"---"+classDirs+"'></div></ul></li>");
        }
      } catch {}
      $('#disFolderTree').filetree();
      //setCookie('fileAI','',1);
      //setCookie('realpath',classPath,1);
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
      classPath=path.replace(/\//g,"---");classPath=classPath.replace(/\(/g,'u--');classPath=classPath.replace(/\)/g,'v--');classPath=classPath.replace(/:/g,'x--');classPath=classPath.replace(/ /g,"___");classPath=classPath.replace(/\./g,"z--");
        for (var i=0; i < dirs.length; i++)
        {
          classDirs = dirs[i].replace(/ /g,"___");classDirs=classDirs.replace(/\./g,"z--");classDirs=classDirs.replace(/\(/g,"u--");classDirs=classDirs.replace(/\)/g,"v--");
          $('#disFolderTree').append("<li><a onclick=showDirs('"+classPath+"---"+classDirs+"')  href='#'>" + dirs[i] +"</a><ul><div  id='"+classPath+"---"+classDirs+"'></div></ul></li>");
        }
        $('#disFolderTree').filetree();
      }
    });

  }
//Page Loaded
$(document).ready(function(e){

  loadFolders('D:/drive');
  setCookie('fileAI','Empty File',1);
  //if mobile phone used
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))  {
    document.getElementById('pdf_view').style.display="none";
    document.getElementById('disContentMobile').style.display="";
  }
});
