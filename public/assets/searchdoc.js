var arrSearches = [];
//handle searching
function searchQuery(query){
  $('#overlay').show();
  let cntSrch = 0;
  var todo = {query:query};
    $.ajax({
      type: 'POST',
      url: '/searchbasic',
      data: todo,
      success: function(data){
        $('#overlay').hide();
        //alert('result');
        let arrResult = JSON.parse(data);
        if (arrResult.length > 1) {
          dispSearch(arrResult);
          ++cntSrch;
          $('#pageLbl').html('Page ' + cntSrch.toString())
          arrSearches = [{page:cntSrch,search:arrResult}];
          //arrSearches.push({page:cntSrch,search:arrResult});
        } else {
          $('#tableSearch').empty();
          $('#tableSearch').append("<tr><td>No Result Found!</td></tr>");
          $('#divButBackNext').hide();$('#pageLbl').hide();
        }
      }
    });
  return false;
}
//display searches
function dispSearch(arrResult){
  $('#tableSearch').empty();
  arrResult.forEach((item)=>{
    if (item.filename!='X'){
      let disFile = item.filename.replace(/ /g,"___");disFile = disFile.replace(/\./,'---');
      $('#tableSearch').append("<tr ><table><tr><td><button type='button' class='btn btn-link' onclick=openDisFile('"+disFile+"')><i class='fa fa-link'></i>&nbsp;"+ item.filename+"</button></td></tr><tr><td>"+item.content+"</td></tr></table></tr>");
      $('#tableSearch').append("<tr height='10px'></tr>");
    }
  });
  $('#tableSearch').append("<hr>");
  $('#divButBackNext').show();$('#pageLbl').show();
}

//Load when html renders
$(document).ready(function(){
  togglePanelHide(true);
  $('#butSearch').on('click', function(){
    searchQuery($('#inputSearch').val().trim());
  });
  $('#inputSearch').keypress(function(e){
    if (e.which==13) searchQuery($('#inputSearch').val().trim());
  });
  //handle button back click
  $('#butBack').on('click',function(e){
    let cntSrch = parseInt($('#pageLbl').html().split(' ')[1],10);
    let nxtPage = cntSrch - 1;
    if (nxtPage > 0){
      let page = arrSearches.findIndex(srcitems=>srcitems.page===nxtPage);
      if (page!=-1){
        let arrResult = arrSearches[page].search;
        if (arrResult.length>0){
          dispSearch(arrResult);
          $('#pageLbl').html('Page ' + nxtPage.toString())
        }
      }
    }

  });
  //handle button next click
  $('#butNext').on('click', function(e){
    $('#overlay').show();
    let cntSrch = parseInt($('#pageLbl').html().split(' ')[1],10);
    let nxtPage = cntSrch + 1;
    let page = arrSearches.findIndex(srcitems=>srcitems.page===nxtPage);
    if (page!=-1){
      $('#overlay').hide();
      let arrResult = arrSearches[page].search;
      if (arrResult.length>0){
        dispSearch(arrResult);
        $('#pageLbl').html('Page ' + nxtPage.toString())
      }
    } else {
      var todo = {query:$('#inputSearch').val().trim()};
        $.ajax({
          type: 'POST',
          url: '/searchnext',
          data: todo,
          success: function(data){
            $('#overlay').hide();
            let arrResult = JSON.parse(data);
            if (arrResult.length>0){
              dispSearch(arrResult);
              ++cntSrch;
              $('#pageLbl').html('Page ' + cntSrch.toString())
              arrSearches.push({page:cntSrch,search:arrResult});
            }
          }
        });
    }
    return false;
  })
});
