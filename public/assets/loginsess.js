
//Load when html renders
$(document).ready(function(){

  $('#formlogin').on('submit', function(){
    var hash = new Hashes.SHA512().b64($('#password').val());
    document.getElementById("password").value = hash;
  });
//test for android login
 $('#submitLogin').on('click', function(){
   var hash = new Hashes.SHA512().b64($('#password').val());
   var todo = {user:$('#username').val(),hashval:hash};
   $.ajax({
     type: 'POST',
     url: '/login-adapter',
     data:todo,
     success: function(data){
       if (data=='ok') alert('Login Successful!');
       else if (data=='notok') alert('Invalid Password!');
      else if (data=='notuser') alert('Invalid User!');

     }
   });
 });
});
