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
  
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))  {
	//alert('here');
	document.getElementById('commentnav').style.width = '420px';
	document.getElementById('commentnav').style.right = '180px';
	document.getElementById('commentinput').className = 'float-right col-8 form-control';
	document.getElementById('addCommentBut').className = 'float-right col-2 btn btn-sm btn-info';	
	
	if (window.matchMedia('screen and (max-width: 768px)').matches) {
		document.getElementById('commentnav').style.width = '250px';
		document.getElementById('commentnav').style.right = '140px';
		document.getElementById('commentinput').className = 'float-right col-4 form-control';
		document.getElementById('addCommentBut').className = 'float-right col-2 btn btn-sm btn-info';	
		document.getElementById('allComments').style.width = '20px';
	}else {
		document.getElementById('commentnav').style.top = '50px';
		document.getElementById('commentnav').style.height = '270px';
	}
	
  }

  document.getElementById("showCommentBut").style.display = "none";
  document.getElementById("hideCommentBut").style.display = "block";
}

function closeComment() {
  document.getElementById('commentnav').style.width = '0';
  document.getElementById('commentnav').style.right = '0';
  document.getElementById("showCommentBut").style.display = "block";
  document.getElementById("hideCommentBut").style.display = "none";
}