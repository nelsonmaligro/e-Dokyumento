//Load when html renders

$(document).ready(function(){
  //initialize
  togglePanelHide(true);$('#butScan').hide();
  $("#selBranch").chosen({
    //disable_search_threshold: 10,
    no_results_text: "Oops, nothing found!",
    width: "100%"
  });
  $("#selAccess").chosen({
    //disable_search_threshold: 10,
    no_results_text: "Oops, nothing found!",
    width: "100%"
  });

  //cascading multiple dropdown
  $('.dropdown-menu a.dropdown-toggle').on('click', function(e) {
    if (!$(this).next().hasClass('show')) {
      $(this).parents('.dropdown-menu').first().find('.show').removeClass("show");
    }
    var $subMenu = $(this).next(".dropdown-menu");
    $subMenu.toggleClass('show');


    $(this).parents('li.nav-item.dropdown.show').on('hidden.bs.dropdown', function(e) {
      $('.dropdown-submenu .show').removeClass("show");
    });
    return false;
  });

  var disID = getCookie('me');
  $('#selLogs').on('change',(e)=>{
    location.replace('/showlogs/'+$('#selLogs').val());
  })

  //handle add user account
  $('#butRegister').on('click',function(event){
    if ($('#userN').val().trim()=="") {alert ('User Name is empty!'); return;}
    if ($('#passW').val().trim()=="") {alert ('Password is empty!'); return;}
    if ($('#passW').val().trim()!=$('#passW2').val().trim()) {alert ('Password Mismatch!'); return;}
    if ($('#email').val().trim()=="") {alert ('Email is empty'); return;}
    if ($('#selBranch').val()==null) {alert ('Branch/Group is empty!'); return;}
    if ($('#selAccess').val()==null) {alert ('Access Level is empty!'); return;}
    let drivePath = 'Z:/';
    if ($('#drivePath').val().trim()!="") {
      if (($('#drivePath').val().trim().includes(':')) && ($('#drivePath').val().trim().includes('/'))) drivePath = $('#drivePath').val();
      else {alert('Invalid Path!'); return;}
    }
    let hash = new Hashes.SHA512().b64($('#passW2').val().trim());
    var todo = {action:'register', userN:$('#userN').val().trim(), hashval:hash, email:$('#email').val().trim(), branch:$('#selBranch').val(), access:$('#selAccess').val(), drive:drivePath};
    $.ajax({
      type: 'POST',
      url: '/reguser',
      data: todo,
      success: function(data){
        if (data=='successful'){
          $('#mstrmodDisp').html('User Added!')
          $('#mstrtoggleDialog').click();$('#mstrstaticModal').show();
        } else alert('Registration Failed!')
      }
    });
  });

  $('#butInfoOk').on('click', function(event){
    location.reload();

  });
  //handle save drive setting
  $('#butSaveDrive').on('click', function(event){
    var todo = {action:'editdrive', maindrive:$('#drivePath').val().trim(),publicdrive:$('#publicPath').val().trim(), publicstr:$('#publicStr').val().trim()};
    $.ajax({
      type: 'POST',
      url: '/updateserver',
      data: todo,
      success: function(data){
        if (data=='successful'){
          $('#mstrmodDisp').html('File Server Drive Updated!')
          $('#mstrtoggleDialog').click();$('#mstrstaticModal').show();
        } else alert('Updating Failed!')

      }
    });
  });
  //handle save AI setting
  $('#butSaveMgmt').on('click', function(event){
    var todo = {action:'edittopmgmt', mgmt:$('#topMgmt').val().trim()};
    $.ajax({
      type: 'POST',
      url: '/updateserver',
      data: todo,
      success: function(data){
        if (data=='successful'){
          $('#mstrmodDisp').html('Top Management Setting Updated!')
          $('#mstrtoggleDialog').click();$('#mstrstaticModal').show();
        } else alert('Updating Failed!')

      }
    });
  });
  //handle save AI setting
  $('#butSaveAI').on('click', function(event){
    let disAI = 'false';
    if (document.getElementById('enableAI').checked) disAI = 'true';
    var todo = {action:'editAI', ai:disAI};
    $.ajax({
      type: 'POST',
      url: '/updateserver',
      data: todo,
      success: function(data){
        if (data=='successful'){
          $('#mstrmodDisp').html('AI Setting Updated!')
          $('#mstrtoggleDialog').click();$('#mstrstaticModal').show();
        } else alert('Updating Failed!')

      }
    });
  });

  //handle clear Temp PDF clear
  $('#butClearPDF').on('click', function(event){
    var todo = {action:'clearpdf'};
    $.ajax({
      type: 'POST',
      url: '/updateserver',
      data: todo,
      success: function(data){
        if (data=='successful'){
          $('#mstrmodDisp').html('Temporary PDF Folder Cleared!')
          $('#mstrtoggleDialog').click();$('#mstrstaticModal').show();
        } else alert('Updating Failed!')

      }
    });
  });
  //handle retrain AI
  $('#butRetrainAI').on('click', function(event){
    var todo = {action:'retrainai'};$('#overlay').show();
    $.ajax({
      type: 'POST',
      url: '/updateserver',
      data: todo,
      success: function(data){
        if (data=='successful'){$('#overlay').hide();
        $('#mstrmodDisp').html('Machine Learning/ AI successfully retrained!')
        $('#mstrtoggleDialog').click();$('#mstrstaticModal').show();
      } else alert('Retraining Failed!')

    }
  });
});

//handle add classification
$('#butSaveClass').on('click', function(event){
  if ($('#newClass').val().trim()=='') return;
  var todo = {action:'addclass', class:$('#newClass').val().trim()};
  $.ajax({
    type: 'POST',
    url: '/updateserver',
    data: todo,
    success: function(data){
      if (data=='successful'){
        $('#selectClass').append("<option value= '"+ $('#newClass').val().trim() +"' id= '"+$('#newClass').val().trim()+"' >"+$('#newClass').val().trim()+"</option>");
        $('#newClass').val('');
      } else alert('Updating Failed!')
    }
  });
});
//handle delete classification
$('#butDelClass').on('click', function(event){
  if ($('#selectClass').val()==null) return;
  var todo = {action:'delclass', class:$('#selectClass').val()};
  $.ajax({
    type: 'POST',
    url: '/updateserver',
    data: todo,
    success: function(data){
      if (data=='successful'){
        $('#selectClass').val().forEach((value)=>{
          $("#selectClass option[value='"+value+"']").remove();
        });
      } else alert('Updating Failed!')

    }
  });
});
//handle add branch/group
$('#butSaveGroup').on('click', function(event){
  if ($('#newBranch').val().trim()=='') return;
  var todo = {action:'addgroup', group:$('#newBranch').val().trim()};
  $.ajax({
    type: 'POST',
    url: '/updateserver',
    data: todo,
    success: function(data){
      if (data=='successful'){
        $('#selectBranch').append("<option value= '"+ $('#newBranch').val().trim() +"' id= '"+$('#newBranch').val().trim()+"' >"+$('#newBranch').val().trim()+"</option>");
        $('#newBranch').val('');
      } else alert('Updating Failed!')
    }
  });
});

//handle delete branch/group
$('#butDelGroup').on('click', function(event){
  if ($('#selectBranch').val()==null) return;
  var todo = {action:'delgroup', group:$('#selectBranch').val()};
  $.ajax({
    type: 'POST',
    url: '/updateserver',
    data: todo,
    success: function(data){
      if (data=='successful'){
        $('#selectBranch').val().forEach((value)=>{
          $("#selectBranch option[value='"+value+"']").remove();
        });
      } else alert('Updating Failed!')

    }
  });
});
//handle button Certificate upload clicked
$('#butUploadCACert').on('click', function(e){
  let files = $('#cacertinput').val().split('\\'); let filename = files[files.length-1];
  $('#overlay').show();
  let upFiles = new FormData();setCookie('fileAI',filename,1);
  upFiles.append('cacertinput',$('#cacertinput')[0].files[0]);
  $.ajax({
    type: 'POST',
    url: '/cacertupload',
    processData: false,
    contentType: false,
    async:false,
    cache:false,
    mimeTypes: "multipart/form-data",
    data: upFiles,
    success: function(data){
      $('#overlay').hide();
      if (data=='successful') location.reload();
    }
  });
  return false;
});
});
