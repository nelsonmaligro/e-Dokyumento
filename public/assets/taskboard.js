
var KanbanTest = new jKanban({
        element: "#myKanban",
        gutter: "5px",
        widthBoard: "200px",
        itemHandleOptions:{
          enabled: false,
        },
        click: function(el) {
          console.log("Trigger on all items click!");
        },
        context: function(el, e) {
          console.log("Trigger on all items right-click!");
        },
        dropEl: function(el, target, source, sibling){
          routeEltoBranch(source.parentElement.getAttribute('data-id'),target.parentElement.getAttribute('data-id'), el.getAttribute('data-eid'));
        },
        buttonClick: function(el, boardId) {
          console.log(el);
          console.log(boardId);
          // create a form to enter element
          var formItem = document.createElement("form");
          formItem.setAttribute("class", "itemform");
          formItem.innerHTML =
            '<div class="form-group"><textarea class="form-control" rows="2" autofocus></textarea></div><div class="form-group"><button type="submit" class="btn btn-primary btn-sm pull-right">Submit</button><button type="button" id="CancelBtn" class="btn btn-secondary btn-sm pull-right">Cancel</button></div><br>';

          KanbanTest.addForm(boardId, formItem);
          formItem.addEventListener("submit", function(e) {
            e.preventDefault();
            var text = e.target[0].value;
            KanbanTest.addElement(boardId, {
              title: text
            });
            formItem.parentNode.removeChild(formItem);
          });
          document.getElementById("CancelBtn").onclick = function() {
            formItem.parentNode.removeChild(formItem);
          };
        },
        itemAddOptions: {
          enabled: true,
          content: '+ Add New Doc',
          class: 'btn-sm btn-primary',
          footer: true
        }
      });
//function for updating the canvas
function routeEltoBranch(src, dst, elem){
  if (src.toUpperCase()==$('#disBranch').val().toUpperCase()){
    qrClick = false;
    $('#newfile').val(elem);$('#fileroute').val(elem);
    $.ajax({
        type: 'POST',
        url: '/taskincoming',
        data: {file:elem},
        success: function(data){
          routetoBranchApp(dst);//process routing slip.....from app.js
          $('#disBranch').click();
        }
      });

  }
}
//handle updating taskboard canvas
function updateCanvas(data){
  let except =['ALL BRANCHES', 'SECRETARY-RECEIVING'];
  data.forEach((item, i) => {
    if (!except.includes(item.branch)){
      if (item.branch.toUpperCase()==$('#disBranch').val().toUpperCase()){
        KanbanTest.addBoards([
          { id: item.branch, title: item.branch, class: "alert-success"}
        ]);
      } else {
        KanbanTest.addBoards([
          { id: item.branch, title: item.branch, class: "alert-success", "dragTo": [item.branch]}
        ]);
      }
      item.title.forEach((doc, i) => {
        KanbanTest.addElement(item.branch, { id: doc, title: doc });
      });
    }
  });
}
//Load when html renders
$(document).ready(function() {
  //Remove clutters
  setCookie('viewBr','taskroute',1);
  //togglePanelHide(true);
  selChose();
  //$('#formroute').hide();
  $('#overlay').hide()//display spinner
  $.ajax({
      type: 'POST',
      url: '/taskmonitor',
      success: function(data){
        let arrData = JSON.parse(data);
        updateCanvas(arrData); //update the canvas using the identified branches
      }
    });
});
