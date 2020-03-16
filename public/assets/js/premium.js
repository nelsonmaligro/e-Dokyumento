
tinymce.init({
  selector: '#editor',
  plugins: 'advlist autolink lists link image charmap print preview anchor searchreplace visualblocks code fullscreen insertdatetime media table contextmenu paste annotate',

  menubar: 'file edit view insert format tools table help',
  toolbar: 'undo redo | strikethrough | annotate delete-annotation ',
  content_css: '/assets/js/tinymce/plugins/annotate/css/style.css',
  contextmenu: "strikethrough annotate delete-annotation",

  init_instance_callback: function (editor) {
				// when user double-clicks on an annotation SPAN, select the entire SPAN
				editor.on('DblClick', function (e) {
					try {
						if (annotationSelected) {
							// Convert the target element of the click event into a native dom element, hence [0], then look at each parent element until we find a matching annotation SPAN
							editor.selection.select($(e.target)[0].closest('.annotation'));
						}
					} catch (err) { }
				});
				editor.on('MouseOut', function (e) {
					hideTooltip();
				});
				editor.on('keyup', function (e) {
					textChanged = true;
				});
			},
 });
 function hideTooltip() {
 			$('#editPaperWindow').css("display", "none");
 		}

var annotations = $(".annotation");
    	annotations.each( function() {
    		var annotationText = $(this).attr('data-annotation-value');
    	});
