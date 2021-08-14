//handle click delete buttons
$('#butCustSearch').on('click', function(event){
    todo = {user:getCookie('me'), class:$('#selCusClas').val()};
    $.ajax({
      type: 'POST',
      data: todo,
      url: '/searchadv',
      success: function(data) {
        var arrObj = JSON.parse(data);
        $('#disFileTree').empty();
        $('#disFileTree').append("<table style='width:100%'>");
        arrObj.forEach((item, i) => {
          $('#disFileTree').append("<tr>");
          disFile = item.title.replace(/ /g,"___");disFile = disFile.replace(/\./g,'---');
          let iconFile = outIconFile(disFile.substring(disFile.length-4));
          let colorFile = outColorFile(disFile.substring(disFile.length-4));
          $('#disFileTree').append("<td><div class='col-7'><a style='color:black;' class='btn-link' onclick=showFiles('"+disFile+"')  href='#'><i style='"+colorFile+"' class='"+iconFile+"'></i>&nbsp;&nbsp;" + item.title +"</a></div></td><td><div class='col-5'><a style='color:black;'>"+item.filename+"</a></div></td>");
          $('#disFileTree').append("</tr>")
        });
        $('#disFileTree').append("</table>");
      }
    });
});
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
