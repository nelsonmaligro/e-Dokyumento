var arrSearches = [];
//handle content or index searching
function searchQuery(query){
  $('#overlay').show();arrSearches = [];
  let cntSrch = 0; //initialize nr of pages for the result
  var todo = {query:query};
  //query the server
  $.ajax({
    type: 'POST',
    url: '/searchbasic',
    data: todo,
    success: function(data){
      $('#overlay').hide();
      let arrResult = JSON.parse(data);
      if (arrResult.length > 1) {
        dispSearch(arrResult); //display the first page results with pre-defined numbers per page
        ++cntSrch; //increment page number
        $('#pageLbl').html('Page ' + cntSrch.toString())
        arrSearches = [{page:cntSrch,search:arrResult}];
        //arrSearches.push({page:cntSrch,search:arrResult});
      } else { //no result
        $('#tableSearch').empty();
        $('#tableSearch').append("<tr><td></td></tr>");
        $('#tableSearch').append("<hr>");
        $('#divButBackNext').show();//$('#pageLbl').show();
      }
    }
  });
  return false;
}
//display searches
function dispSearch(arrResult){
  $('#tableSearch').empty();
  arrResult.forEach((item)=>{ //iterate through the array and display in table
    if (item.filename!='X'){
      //replace special characters to prevent error in the html embedding
      let disFile = item.filename.replace(/ /g,"___");disFile = disFile.replace(/\(/g,'u--');disFile = disFile.replace(/\)/g,'v--');disFile = disFile.replace(/\./g,'---');
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
  //handle searching upon click of the button
  $('#butSearch').on('click', function(){
    searchQuery($('#inputSearch').val().trim());
  });
  //handle searching upon keypress enter
  $('#inputSearch').keypress(function(e){
    if (e.which==13) searchQuery($('#inputSearch').val().trim());
  });
  //handle button back click
  $('#butBack').on('click',function(e){
    let cntSrch = parseInt($('#pageLbl').html().split(' ')[1],10);
    let nxtPage = cntSrch - 1;
    if (nxtPage > 0){
      let page = arrSearches.findIndex(srcitems=>srcitems.page===nxtPage); //search through the array for the page number
      if (page!=-1){
        let arrResult = arrSearches[page].search;
        if (arrResult.length>0){
          dispSearch(arrResult); //re-display the result
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
    let page = arrSearches.findIndex(srcitems=>srcitems.page===nxtPage); //search through the array for the page number
    if (page!=-1){ //if page nr is found
      $('#overlay').hide();
      let arrResult = arrSearches[page].search;
      if (arrResult.length>0){
        dispSearch(arrResult); //re-display the result
        $('#pageLbl').html('Page ' + nxtPage.toString())
      }
    } else { //page nr not found....too many clicks of back button
      var todo = {query:$('#inputSearch').val().trim()};
      $.ajax({
        type: 'POST',
        url: '/searchnext',
        data: todo,
        success: function(data){
          $('#overlay').hide();
          let arrResult = JSON.parse(data);
          if (arrResult.length>0){
            dispSearch(arrResult); //re-display the result
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
