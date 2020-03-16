
//Auto refresh Notification
function checkFiles(){
  $("#notifyme").load(location.href+" #notifyme");
  if (($('#fileroute').val()=='empty') && (document.getElementById("notiNr").innerHTML!='0')){
    location.replace('/incoming');
  }
}

//send JSON to server for scanning the document
function scanDoc(){
  var fileroute = $('#fileroute');
  var todo = {fileroute: fileroute.val()};
  if ((fileroute.val()!='empty') && (!checkCookie())){
      $.ajax({
        type: 'POST',
        url: '/incoming/scandoc',
        data: todo,
        success: function(data){
          //do something with the data via front-end framework
          document.getElementById("txtscan").innerHTML = "&nbsp;Analyzing document using AI...";
          AIDoc();
        }
       });

  }else{
    //unhide elements
    document.getElementById("actBr").style.display = "block";
    document.getElementById("butScan").style.display = "none";
    document.getElementById("selDiv").style.display = "block";
    document.getElementById("butDiv").style.display = "block";
    jQuery(".standardSelect").chosen({
        disable_search_threshold: 10,
        no_results_text: "Oops, nothing found!",
        width: "100%"
    });
  }
};
//Send JSON to server for analyzing document using AI
 function AIDoc(){
   $.ajax({
     type: 'POST',
     url: '/incoming/analyzedoc',
     success: function(data){
       //unhide elements
       document.getElementById("actBr").style.display = "block";
       document.getElementById("butScan").style.display = "none";
       document.getElementById("selDiv").style.display = "block";
       document.getElementById("butDiv").style.display = "block";
       //select branches
       $("#selBr").val(data).prop('selected', true);
       //document.getElementById(data).selected = true;
       //re-design select option
       jQuery(".standardSelect").chosen({
           disable_search_threshold: 10,
           no_results_text: "Oops, nothing found!",
           width: "100%"
       });
      setCookie('fileAI',$('#newfile').val(),1);setCookie('branchAI',$('form select').val(),1);
      }
    });
  };

//Set cookie
function setCookie(sessVar, sessData, expireDays) {
  var d = new Date();
  d.setTime(d.getTime() + (expireDays*24*60*60*1000));
  var expires = "expires=" + d.toGMTString();
  document.cookie = sessVar + "=" + sessData + ";" + expires + ";path=/";
}
//Get setCookie
function getCookie(disVar) {
  var name = disVar + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
//check checkCookie
function checkCookie() {
  var disFile=getCookie('fileAI');
  var disBranch=getCookie('branchAI');
  if (disFile==$('#newfile').val()){
    $("#selBr").val(disBranch).prop('selected', true);
    return true;
  }else{
    return false;
  }

}

//Load when html renders
$(document).ready(function(){
  //assign picture based on id ME
  var disID = getCookie('me');
  $('#pixID').attr("src","/images/"+disID+".jpg");

  //handle form submit
  $('#formroute').on('submit', function(){
      var fileroute = $('#fileroute');
      var newfile = $('#newfile');
      var branch = $('form select');

      var todo = {fileroute: fileroute.val(), newfile:newfile.val(), branch:branch.val()};
      if (fileroute.val()!='empty'){
        $.ajax({
          type: 'POST',
          url: '/incoming',
          data: todo,
          success: function(data){
            location.replace('/incoming');
          }
        });
      }
      return false;
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
//Start scanning document
scanDoc();
//start auto refresh Notification
setInterval('checkFiles();',10000);
});
