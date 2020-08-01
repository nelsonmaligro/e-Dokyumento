
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
