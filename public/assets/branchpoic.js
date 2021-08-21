

//Load when html renders
$(document).ready(function(){
  var disID = getCookie('me');
  document.getElementById('docSave').innerHTML = "Save Document";
  //handle document edit during routing
  $('#docEdit').on('click', function(){
    if (window.location.toString().includes("/incoming")){
      var newfile = $('#fileroute');
      var todo = {file:newfile.val()};
      $.ajax({
        type: 'POST',
        url: '/editincoming',
        data: todo,
        success: function(data){
          if (data != 'notowner'){
            let newPath = data;
            //open file using ie option....must run the registry file first to enable ie option on the browser
            disWindow = window.open("ie:"+newPath+"","disWindow","width=5px,heigh=5px");
            //start auto refresh Notification
            disClock = setInterval('closWindow()',20000);
          }else alert('Editing denied! Only the originator can edit this document.');

        }
      });
    }
  });

  //handle document save in branch incoming
  $('#docSave').on('click', function(){
    if (!$('#newfile').val().includes('.')) {alert ('File extension not recognized!'); return false;}
    var branch = $('#selClas'); if (branch.val()==null) {alert ('Correspondence Empty!'); return false;} //must supply doc classification
    togglePanelProc(true); //hide some buttons
    var fileroute = $('#fileroute');
    var newfile = $('#newfile');
    //get metadata
    var tag = $('#selTag').val(); if (tag===null) tag = [];
    var arrRef = getCookie('arrRef');
    var arrEnc = getCookie('arrEnc');
    var arrComm = getCookie('arrComm');

    var user = disID;
    var todo = {save:'save', fileroute: fileroute.val(), newfile:newfile.val(), class:branch.val(), tag:JSON.stringify(tag), user:user, refs:arrRef, encs:arrEnc, comments:arrComm};
    //save a copy of the routed document into the drive
    if (fileroute.val()!='empty'){
      $.ajax({
        type: 'POST',
        url: '/incoming',
        data: todo,
        success: function(data){
          togglePanelProc(true);
          location.replace('/incoming/'+newfile.val()); //reload the page
        }
      });
    }
    return false;
  });


});
