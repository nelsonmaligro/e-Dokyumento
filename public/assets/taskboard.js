var deyt = moment().format('D MMM');
var dbTasksArr = [], dbMonitor = [], itemSelected = "", boardSelected="";

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
          itemSelected = el.getAttribute('data-eid');
          boardSelected= KanbanTest.getParentBoardID(itemSelected);
        },
        //handle function of dropping element in a list
        dropEl: function(el, target, source, sibling){
          let listFiles = $('#arrFiles').data('locations'); // get routing files
          if (listFiles.includes(el.getAttribute('data-eid'))) { //check if selected element is a file
              routeEltoBranch(source.parentElement.getAttribute('data-id'),target.parentElement.getAttribute('data-id'), el.getAttribute('data-eid'));
          } else {
            if ((source.parentElement.getAttribute('data-id') == $('#disBranch').val().toUpperCase()) || ($('#userLevel').data('locations')=="SECRETARY")) { //if own branch or secretary
              //Update Source list in the taskboard DB
              var allEle = KanbanTest.getBoardElements(source.parentElement.getAttribute('data-id'));
              let arrEle = [];
              allEle.forEach(function(value, index, array) {
                //get items from monitoring DB to separate from taskboard DB items
                let srcEle = [];
                srcList = dbMonitor.find(x => x.branch === source.parentElement.getAttribute('data-id'));
                if (srcList != undefined ) srcEle = srcList.title;
                if (!srcEle.includes($(value).data("eid"))) { //check if selected element not on the monitoring DB items
                  arrEle.push({
                    "id": $(value).data("eid"),
                    "title":  '<p style="color:blue;">' + $(value).data("eid") +'</p>'+ $(value).data("date"),
                    "date": $(value).data("date"),
                  });
                }
              });
              //send to backend to update taskboard DB
              $.ajax({
                  type: 'POST',
                  url: '/taskupdate',
                  data: {title:source.parentElement.getAttribute('data-id'), arrEle:JSON.stringify(arrEle)},
                  success: function(){
                    //Update target list in the Taskboard DB
                    tasks = dbTasksArr; //get dbtasks from global variable
                    let disEle = [];
                    disList = tasks.find(x => x.boardtitle === target.parentElement.getAttribute('data-id'));
                    if (disList != undefined ) disEle = disList.element;
                    disEle.push({
                      "id": el.getAttribute('data-eid'),
                      "title":  '<a style="color:blue; font-size:14px;">' + el.getAttribute('data-eid') +'</a><br>'+ deyt,
                      "date": deyt,
                    });
                    $.ajax({
                        type: 'POST',
                        url: '/taskupdate',
                        data: {title:target.parentElement.getAttribute('data-id'), arrEle:JSON.stringify(disEle)},
                        success: function() {}
                      });
                  }
              });
            }
          }
        },
        buttonClick: function(el, boardId) {
          console.log(el);
          console.log(boardId);
          // create a form to enter element
          var formItem = document.createElement("form");
          formItem.setAttribute("class", "itemform");
          formItem.innerHTML =
            '<div class="form-group"><textarea class="form-control" rows="2" autofocus></textarea></div><div class="form-group"><button type="submit" class="btn btn-primary btn-sm pull-right">Submit</button><button type="button" id="CancelBtn" class="btn btn-secondary btn-sm pull-right">Cancel</button></div><br>';

          KanbanTest.addForm(boardId, formItem); //add above form to the task list
          //Handle event when submit button is clicked
          formItem.addEventListener("submit", function(e) {
            e.preventDefault();
            var text = e.target[0].value;
            //Add the element to the list
            KanbanTest.addElement(boardId, {
              id: text.trim().replace(/\r?\n|\r|\\/g," "),
              title: '<a style="color:blue;font-size:14px;">' + text  +'</a><br>'+ deyt,
              date: deyt,
            });
            formItem.parentNode.removeChild(formItem);
            //Update list in the taskboard DB
            var allEle = KanbanTest.getBoardElements(boardId);
            let arrEle = [], srcEle = [];
            let listFiles = $('#arrFiles').data('locations'); // get routing files
            srcList = dbMonitor.find(x => x.branch === boardId); //get the list in the monitoring DB to check if the item exist
            if (srcList != undefined ) srcEle = srcList.title;
            allEle.forEach(function(value, index, array) {
              //if item is added on the current branch or the incoming branch for secretary
              if ((boardId == $('#disBranch').val().toUpperCase()) || (boardId=='incoming-temp')) {
                if (!listFiles.includes($(value).data("eid"))) { //check if selected item is not a file
                  arrEle.push({"id": $(value).data("eid"), "title": '<a style="color:blue; font-size:14px;">' + $(value).data("eid") +'</a><br>'+ $(value).data("date"), "date": $(value).data("date"),});
                }
              } else { //if item is added to other branches
                if (!srcEle.includes($(value).data("eid"))) { //check if selected item is not in the monitoring DB
                  arrEle.push({"id": $(value).data("eid"), "title": '<a style="color:blue; font-size:14px;">' + $(value).data("eid") +'</a><br>'+ $(value).data("date"), "date": $(value).data("date"),});
                }
              }
            });
            //send to backend to update taskboard DB
            $.ajax({
                type: 'POST',
                url: '/taskupdate',
                data: {title:boardId, arrEle:JSON.stringify(arrEle)},
                success: function(){
                  //alert('success');
                }
              });
          });
          document.getElementById("CancelBtn").onclick = function() {
            formItem.parentNode.removeChild(formItem);
          };
        },
        itemAddOptions: {
          enabled: true,
          content: '+ Add Item',
          class: 'btn-sm btn-primary',
          footer: true
        }
      });
//function for updating the canvas
function routeEltoBranch(src, dst, elem){
  if (src.toUpperCase()==$('#disBranch').val().toUpperCase()){
    qrClick = false;
    $('#newfile').val(elem);$('#fileroute').val(elem);
    setCookie('arrRef',JSON.stringify([]),1);setCookie('arrEnc',JSON.stringify([]),1);setCookie('arrComm',JSON.stringify([]),1);
    queryDoc();//query document database to populate metadata

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
function updateCanvas(rawdata){
  data = rawdata.branches; // get lists from monitoringDB
  let except =['ALL BRANCHES', 'SECRETARY-RECEIVING']; //create taskboard except this
  //create list for current branch
  if ($('#userLevel').data('locations')=="SECRETARY") { //if secretary then populate incoming-temp
    KanbanTest.addBoards([
      { id: 'incoming-temp', title: 'Incoming', class: "alert-success"}
    ]);
    let listFiles = $('#arrFiles').data('locations');
    listFiles.forEach((doc, i) => {
      KanbanTest.addElement('incoming-temp', { id: doc, title: '<a style="color:blue;font-size:14px;">' + doc + '</a><br>', date: deyt });
    });
  } else { //if manager, staff, executives
    if (!except.includes($('#disBranch').val().toUpperCase())) {
      KanbanTest.addBoards([
        { id: $('#disBranch').val(), title: $('#disBranch').val(), class: "alert-success"}
      ]);
      let listFiles = $('#arrFiles').data('locations');
      listFiles.forEach((doc, i) => {
        KanbanTest.addElement($('#disBranch').val(), { id: doc, title: '<a style="color:blue;font-size:14px;">' + doc + '</a><br>', date: deyt });
      });
    }
  }
  dbMonitor = rawdata.branches; //copy monitorDB to global variable
  //create lists for all branches and populate items from the monitoring DB
  data.forEach((item, i) => {
    if (!except.includes(item.branch)){
      if (item.branch.toUpperCase()!=$('#disBranch').val().toUpperCase()) {
        //if secretary then allow dragging of elements in all lists
        if ($('#userLevel').data('locations')=="SECRETARY") KanbanTest.addBoards([{ id: item.branch, title: item.branch, class: "alert-success"}]);
        else KanbanTest.addBoards([{ id: item.branch, title: item.branch, class: "alert-success", "dragTo": [item.branch]}]);
        //populate items
        item.title.forEach((doc, i) => {
          KanbanTest.addElement(item.branch, { id: doc, title: '<a style="color:blue;font-size:14px;">' + doc +'</a><br>' , date: deyt });
        });
      }
    }
  });

  //add items  for tasksDB
  dbTasksArr = rawdata.dbtasks; //copy dbtasks to global variable
  tasks = rawdata.dbtasks;
  tasks.forEach((list, i) => {
    //Get all elements in list to check if existing
    if ((list.boardtitle!='incoming-temp') || ($('#userLevel').data('locations')=="SECRETARY")){ //populate items except incoming folder of the secretary
      if (!KanbanTest.findBoard(list.boardtitle)) {KanbanTest.addBoards([{ id: list.boardtitle, title: list.boardtitle, class: "alert-success"}]);}
      var allEle = KanbanTest.getBoardElements(list.boardtitle);
      let arrEle = [];
      allEle.forEach(function(value, index, array) {
        arrEle.push($(value).data("eid"));
      });
        list.element.forEach((elem, i) => {
          if (!arrEle.includes(elem.id)){
            KanbanTest.addElement(list.boardtitle, { id: elem.id, title: elem.title, date: elem.date });
          }
        });
    }
  });
  //add Archive List in the taskboard
  disList = tasks.find(x => x.boardtitle === 'Release-Archive');
  if (disList == undefined ) {
    KanbanTest.addBoards([
      { id: 'Release-Archive', title: 'Release-Archive', class: "alert-success"}
    ]);
  }


}
//handle rightclick context menu delete click
$('#contDel').on('click', (event)=>{

  let listFiles = $('#arrFiles').data('locations');
  if ((boardSelected == $('#disBranch').val()) || ($('#userLevel').data('locations')=="SECRETARY")) { //if own branch or secretary
    if (listFiles.includes(itemSelected)) {alert('Deletion denied! Note: Routing files can be deleted in the Routing Menu.');return;}
    KanbanTest.removeElement(itemSelected);
    //Update list in the taskboard DB
    var allEle = KanbanTest.getBoardElements(boardSelected);
    let arrEle = [], srcEle = [];
    //get items from Monitor DB to separate from Taskboard DB items
    srcList = dbMonitor.find(x => x.branch === boardSelected);
    if (srcList != undefined ) srcEle = srcList.title;
    allEle.forEach(function(value, index, array) {
      if (!srcEle.includes($(value).data("eid"))) { //check if selected element not on the monitoring DB items
        //store tor array
        arrEle.push({"id": $(value).data("eid"),"title": '<a style="color:blue; font-size:14px;">' + $(value).data("eid") +'</a><br>'+ $(value).data("date"),"date": $(value).data("date")});
      }
    });
    //send to backend to update taskboard DB
    $.ajax({
        type: 'POST',
        url: '/taskupdate',
        data: {title:boardSelected, arrEle:JSON.stringify(arrEle)},
        success: function(){
          //alert('success');
        }
      });
  } else {
    alert('Deletion denied! Note: You can only delete item within your group or branch')
  }
});
//Load when html renders
$(document).ready(function() {
  //Remove clutters
  setCookie('viewBr','taskroute',1);
   if ($('#userLevel').data('locations')=="SECRETARY") $('#disBranch').val('incoming-temp');
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
