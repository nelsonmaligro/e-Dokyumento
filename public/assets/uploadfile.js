
//expand directory
function showUpDir(path){
  //return pre-formatted characters to its original characters
  classPath = path.replace(/___/g," ");classPath=classPath.replace(/u--/g,'(');classPath=classPath.replace(/v--/g,')');classPath = classPath.replace(/x--/g,":");classPath=classPath.replace(/z--/g,".");classPath = classPath.replace(/---/g,"/");
  classPath=classPath+"/";
  $('#disPath').val(classPath);
  var todo = {path:classPath};
  $.ajax({
    type: 'POST',
    url: '/browsedrive',
    data: todo,
    success: function(data){
      var arrObj = JSON.parse(data);
      var dirs = arrObj['dirs'];
      //update Modal
      $('#'+path+'').empty();
      for (var i=0; i < dirs.length; i++)
      {
        //replace special characters to prevent error in the html embedding
        classDirs = dirs[i].replace(/ /g,"___");classDirs=classDirs.replace(/\(/g,"u--");classDirs=classDirs.replace(/\)/g,"v--");classDirs=classDirs.replace(/\./g,"z--");
        $('#'+path+'').append("<li><a onclick=showUpDir('"+path+"---"+classDirs+"')  href='#'>" + dirs[i] +"</a><ul><div id='"+path+"---"+classDirs+"'></div></ul></li>");
      }
      $(".uploadTree").filetree();
    }
  });
}

//Load when html renders
$(document).ready(function(){
  path=$('#disPath').val();
  var todo = {path:path};
  //initialize directory container
  $.ajax({
    type: 'POST',
    url: '/browsedrive',
    data: todo,
    success: function(data){
      var arrObj = JSON.parse(data);
      var dirs = arrObj['dirs'];
      $('.uploadDrive').empty();
      //replace special characters to prevent error in the html embedding
      var classPath=path.replace(/\//g,"---");classPath=classPath.replace(/\(/g,'u--');classPath=classPath.replace(/\)/g,'v--');classPath=classPath.replace(/:/g,'x--');
        for (var i=0; i < dirs.length; i++)
        {
          //replace special characters to prevent error in the html embedding
          classDirs = dirs[i].replace(/ /g,"___");classDirs=classDirs.replace(/\(/g,"u--");classDirs=classDirs.replace(/\)/g,"v--");classDirs=classDirs.replace(/\./g,"z--");
          $('.uploadDrive').append("<li><a onclick=showUpDir('"+classPath+"---"+classDirs+"')  href='#'>" + dirs[i] +"</a><ul><div  id='"+classPath+"---"+classDirs+"'></div></ul></li>");
        }
        //alert(JSON.stringify($(".uploadTree")));
        $(".uploadTree").filetree();
        $('#overlay').hide();
      }
    });

    //handle button upload clicked
    $('#butUploadFile').on('click', function(e){
      if ($('#disPath').val().substring($('#disPath').val().length-1)!="/")
      $('#disPath').val($('#disPath').val()+'/');
      $('#overlay').show();
      filepath = $('#disPath').val();
      var files = $('#fileinput').val().split('\\'); var filename = files[files.length-1];
      setCookie('fileAI',filename,1);setCookie('realpath',filepath,1);
      let upFiles = new FormData();
      upFiles.append('fileinput',$('#fileinput')[0].files[0]); //attach file to the form data for JSON uploading
      $.ajax({
        type: 'POST',
        url: '/fileupload',
        processData: false,
        contentType: false,
        async:false,
        cache:false,
        mimeTypes: "multipart/form-data",
        data: upFiles,
        success: function(data){
          $('#overlay').hide();
          if (data=='successful') openDisFile(filepath+filename); //open the file when successful
          else alert('Upload Fail! Try renaming the file.');
        }
      });
      return false;
    });
  });
