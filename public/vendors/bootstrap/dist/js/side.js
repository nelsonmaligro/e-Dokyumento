function openNav() {
  document.getElementById('mySidenav').style.width = '220px';

  document.getElementById("sideBut").style.display = "none";
  document.getElementById("hideBut").style.display = "block";
}

function closeNav() {
  document.getElementById('mySidenav').style.width = '0';

  document.getElementById("sideBut").style.display = "block";
  document.getElementById("hideBut").style.display = "none";
}

function openComment() {
  document.getElementById('commentnav').style.width = '420px';
  document.getElementById('commentnav').style.right = '320px';

  document.getElementById("showCommentBut").style.display = "none";
  document.getElementById("hideCommentBut").style.display = "block";
}

function closeComment() {
  document.getElementById('commentnav').style.width = '0';
  document.getElementById('commentnav').style.right = '0';
  document.getElementById("showCommentBut").style.display = "block";
  document.getElementById("hideCommentBut").style.display = "none";
}