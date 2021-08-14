const $tableID = $('#bootstrap-data-table-export');
var selectBut = null;
var options = {
  editableColumns: null,
  onEdit: function() {},          // Called after edition
  onBeforeDelete: function() {},  // Called before deletion
  onDelete: function() {},        // Called after deletion
  onAdd: function() {},
}

$tableID.on('click', '.table-remove', function () {
  $('#modDisp').html("<p class='h6'>Re-enter your password for validation:<input type='password' id='modPass' class='input-sm form-control-sm form-control'></p>");
  $('#modCancel').html('Cancel');$('#butConfirm').show();
  $('#modPass').keypress(function(e){
    if (e.which==13) confirmPass();
  });
  selectBut = $(this).parent().find('#bDel');
});
$tableID.on('click', '.table-edit', function () {
  _rowEdit($(this).parent().find('#bEdit'));
});

$tableID.on('click', '.table-accept', function () {
  _rowAccept($(this).parent().find('#bAcep'));
});
$tableID.on('click', '.table-cancel', function () {
  _rowCancel($(this).parent().find('#bCanc'));
});
function currentlyEditingRow($row) {
  // Check if the_rowAccept row is currently being edited
  if ($row.attr('data-status')=='editing') {
    return true;
  } else {
    return false;
  }
}
function _actionsModeNormal(button) {
  $(button).parent().parent().find('#bAcep').hide();
  $(button).parent().parent().find('#bCanc').hide();
  $(button).parent().parent().find('#bEdit').show();
  $(button).parent().parent().find('#bDel').show();
  $(button).parent().parent().find('#bView').show();
  var $row = $(button).parents('tr');         // get the row
  $row.attr('data-status', '');               // remove editing status
}
function _actionsModeEdit(button) {
  $(button).parent().parent().find('#bAcep').show();
  $(button).parent().parent().find('#bCanc').show();
  $(button).parent().parent().find('#bEdit').hide();
  $(button).parent().parent().find('#bDel').hide();
  //$(button).parent().parent().find('#bView').hide();
  var $row = $(button).parents('tr');         // get the row
  $row.attr('data-status', 'editing');        // indicate the editing status
}
function _rowDelete(button, hash) {
  $('#staticModal').show();
  var $row = $(button).parents('tr');       // access the row
  //update to the server
  let userN = $row.find('#disUser').html();
  let hashval = hash;
  todo = {action:'deluser', userN:userN, hashval:hashval};
  $.ajax({
    type: 'POST',
    data: todo,
    url: '/reguser',
    success: function(data){
      if (data=='successful'){
        options.onBeforeDelete($row);
        $row.remove();
        options.onDelete();
        $('#modDisp').html("<p>Deletion Successful!</p>");
      }else {
        $('#modDisp').html("<p>Deletion Fail!</p>");
      }
      $('#modCancel').html('Ok');$('#butConfirm').hide();
      sleep(3000);
      location.replace('/viewusers');
    }
  });
}
function _rowAccept(button) {
  // Accept the changes to the row
  var $row = $(button).parents('tr');       // access the row
  var $cols = $row.find('td');  var oldcont ='';            // read fields
  if (!currentlyEditingRow($row)) return;   // not currently editing, return
  // Finish editing the row & save edits
  let hash = '';
  _modifyEachColumn(options.editableColumns, $cols, function($td) {  // modify each column
    if ($td.attr('name') == 'disPass') {
      if ($td.find('input').val().trim()=='')  $td.find('input').val('*****');
      else {
        hash = new Hashes.SHA512().b64($td.find('input').val().trim());
        $td.find('input').val('*****');
      }
    }
    let cont = $td.find('input').val();
    oldcont = $td.find('div').html();     // read through each input
    $td.html(cont);                      // set the content and remove the input fields
  });
  _actionsModeNormal(button);
  options.onEdit($row);

  let userN = $row.find('#disUser').html();
  let hashval = hash;
  let email = $row.find('#disEmail').html();
  let branch = $row.find('#disBranch').html();
  let level = $row.find('#disLevel').html();
  let drive = $row.find('#disDrive').html();
  todo = {action:'edituser', userN:userN, hashval:hashval, email:email, branch:branch, level:level, drive:drive};
  $.ajax({
    type: 'POST',
    data: todo,
    url: '/reguser',
    success: function(data){
      if (data!='successful') alert('Modification Fail');
      //location.reload();
    }
  });
}
function _rowCancel(button) {
  // Reject the changes
  var $row = $(button).parents('tr');       // access the row
  var $cols = $row.find('td');              // read fields
  if (!currentlyEditingRow($row)) return;   // not currently editing, return

  // Finish editing the row & delete changes
  _modifyEachColumn(options.editableColumns, $cols, function($td) {  // modify each column
    var cont = $td.find('div').html();    // read div content
    $td.html(cont);                       // set the content and remove the input fields
  });
  _actionsModeNormal(button);
}
function _rowEdit(button) {
  // Indicate user is editing the row
  var $row = $(button).parents('tr');       // access the row
  var $cols =$row.find('td');  // read rows
  //$cols = $cols.splice(0,$cols.length-1);
  if (currentlyEditingRow($row)) return;    // not currently editing, return
  _modifyEachColumn(options.editableColumns, $cols, function($td) {  // modify each column
    if ($td.html()=='*****') $td.html('');
    var content = $td.html();             // read content
    var div = '<div style="display: none;">' + content + '</div>';  // hide content (save for later use)
    var input = '';
    if (($td.attr('name') == 'disPass')) input = '<input  class="form-control input-sm" type="password" data-original-value="' + content + '" value="' + content + '">';
    else  input = '<input  class="form-control input-sm"  data-original-value="' + content + '" value="' + content + '">';
    $td.html(div + input);                // set content
  });
  _actionsModeEdit(button);

  $('.input-sm').keypress(function(e){
    if (e.which==13) {
      _rowAccept(button);
    }
  });

}

function _modifyEachColumn($editableColumns, $cols, howToModify) {
  // Go through each editable field and perform the howToModifyFunction function
  var n = 0;
  $cols.each(function() {
    n++;
    if ($(this).attr('name')=='bstable-actions') return;    // exclude the actions column
    if ($(this).attr('name')=='disUser') return;
    howToModify($(this));                                   // If editable, call the provided function
  });

}

//function to handle validate Password
function confirmPass(){
  var hash = new Hashes.SHA512().b64($('#modPass').val());
  var todo = {user:getCookie('me'),hashval:hash};

  $.ajax({
    type: 'POST',
    url: '/validatepass',
    data:todo,
    success: function(data){
      if (data=='ok'){
        //$('#modCancel').click();
        $('#staticModal').hide();
        _rowDelete(selectBut, hash);
      }else {
        $('#modDisp').html("<p class='h4'>Invalid Password!</p><p class='h6'>Re-enter your password for validation:<input type='password' id='modPass' class='input-sm form-control-sm form-control'></p>");
        $('#modPass').keypress(function(e){
          if (e.which==13) confirmPass();
        });
      }

    }
  });
}
$(document).ready(function() {
  //Remove clutters
  togglePanelHide(true);
  //  selChose();
  //  $('#formroute').hide();
  //  $('#overlay').hide()//display spinner


  $('#butConfirm').on('click',function(event){
    confirmPass();
  });

});
