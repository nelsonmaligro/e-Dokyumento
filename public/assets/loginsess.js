
//Load when html renders
$(document).ready(function(){

  $('#formlogin').on('submit', function(){
    var hash = new Hashes.SHA512().b64($('#password').val());
    document.getElementById("password").value = hash;
  });

});
