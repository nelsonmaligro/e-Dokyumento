//initialize values for the chart
window.myLine = null;  var tableCanvas = []; var loadInterval = null;
var myTable = $('#bootstrap-data-table-export').DataTable({lengthMenu: [[1], [1]],});
//generate random color for the lines
function randomColorFactor() {
  return Math.round(Math.random() * 255);
}
function randomColor(opacity) {
  return (
    "rgba(" +
    randomColorFactor() +
    "," +
    randomColorFactor() +
    "," +
    randomColorFactor() +
    "," +
    (opacity || ".3") +
    ")"
  );
}
var disYear = new Date().getFullYear();
//initial configuration for the chart
function returnConfig(disDatasets, files) {
  var config = {
    type: 'line',
    data: {
      //xLabels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL'],
      yLabels: files,
      datasets: disDatasets,
    },
    options: {
      responsive: true,
      legend: {
        display: false,
      },
      title: {
        display: false,
        text: 'Monitoring of Office Document Communications'
      },
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].filename;
            return value;
          }
        }
      },
      scales: {
        xAxes: [{
          type: 'time',
          position:'bottom',
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Month'
          },
          time: {
            unit: 'month',
            min: disYear.toString(),
            displayFormats: {
              month: 'MMM'
            }
          }

        },{
          type: 'time',
          display: true,
          position:'top',
          scaleLabel: {
            display: true,
            labelString: 'Monitoring of Office Document Communications'
          },
          time: {
            unit: 'month',
            min: disYear.toString(),
            displayFormats: {
              month: 'MMM'
            }
          }

        }],
        yAxes: [{
          type: 'category',
          position: 'left',
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Documents en route'
          }
        }]
      },
      pan: {
        enabled: true,
        mode: "xy",
        speed: 10,
        threshold: 10
      },
      zoom: {
        enabled: true,
        drag: false,
        mode: "xy",
        speed: 0.1,
        // sensitivity: 0.1,
        limits: {
          max: 10,
          min: 0.5
        }
      }

    }

  };
  return config;
}



// Define a plugin to provide data labels
Chart.plugins.register({
  afterDatasetsDraw: function(chart) {
    var ctx = chart.ctx;

    chart.data.datasets.forEach(function(dataset, i) {
      var meta = chart.getDatasetMeta(i);
      if (!meta.hidden) {
        meta.data.forEach(function(element, index) {
          // Draw the text in black, with the specified font
          ctx.fillStyle = 'rgb(0, 0, 0)';

          var fontSize = 12;
          var fontStyle = 'normal';
          var fontFamily = 'Arial';
          ctx.font = Chart.helpers.fontString(fontSize, fontStyle, fontFamily);

          // Just naively convert to string for now
          var dataString = dataset.data[index].label;

          // Make sure alignment settings are correct
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          var padding = 5;
          var position = element.tooltipPosition();
          ctx.fillText(dataString, position.x, position.y - (fontSize / 2) - padding);
        });
      }
    });
  }
});
//function for updating the canvas
function updateCanvas(data){
  myTable.clear();disFiles = []; newDatasets = [];
  var arrData = JSON.parse(data);
  var count = 0; bodyCount = 0;
  //get list of titles, get duplicates, and store in Array
  arrTit = []; arrData.forEach((item) => {arrTit.push(item.title.substring(0,15));});
  dupTit = arrTit.filter((item, index) => arrTit.indexOf(item) !== index);
  //iterate through files
  arrData.forEach(function (items, index) {
    //prevent duplicate title
    let disTitle = items.title.substring(0,15);
    if (dupTit.includes(items.title.substring(0,15))) disTitle = items.title.substring(0,13)+'~'+index.toString();
    disFiles.push(disTitle); //get the title of the file (15 characters only)
    var disSets = [];
    //iterate all branches routed in the file
    items.route.reverse().forEach(function (route){
      var branch = ""; var comma = "";
      route.branch.forEach(function (disBr){
        branch = branch + comma + disBr;
        comma = ",";
      });
      //create points for the branch on the canvas
      disSets.push({x:route.deyt, y:disTitle, label:branch, filename:items.filename, path:items.filepath});
    });
    //assign color for the point
    disColor = randomColor(1);
    var sets = {
      label: items.title,
      data: disSets,
      borderColor: disColor,
      backgroundColor: 'transparent',
      pointRadius:4,
      pointBackgroundColor:disColor,
    }
    newDatasets.push(sets); //store sets of points in the array
    //place 5 sets (documents and points) in the canvas
    if ((count == 5) || (index == arrData.length - 1)) {
      // add to table canvas...distinguish the mobile phone users and PC users
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) myTable.row.add([" <div  style='width:98%;'><canvas ondblclick='openChartFile(event)' id='canvas-"+bodyCount.toString()+"' height=250px ></canvas></div>"]).draw();
      else myTable.row.add([" <div  style='width:98%;'><canvas ondblclick='openChartFile(event)' id='canvas-"+bodyCount.toString()+"' height=137px ></canvas></div>"]).draw();
      tableCanvas.push({x:newDatasets,y:disFiles});
      bodyCount= bodyCount + 1; count = 0; newDatasets=[]; disFiles=[];
    } else {
      count= count + 1 ;
    }
  });
}
//handle when page of the table canvas is changed upon clicking next button
$('#bootstrap-data-table-export').on('page.dt', function(){
  var num = myTable.page.info().page;
  loadInterval = setInterval("loadCanvas("+num+")",1000);
});
//function to load the table canvas
function loadCanvas(number){
  var ctx = $('#canvas-'+number.toString()).get(0).getContext('2d');
  window.myLine = new Chart(ctx, returnConfig(tableCanvas[number].x, tableCanvas[number].y));
  clearInterval(loadInterval);
}

//function to handle the opening of file when clicking the point in the canvas
function openChartFile(event)
{
  var activePoints = window.myLine.getElementsAtEvent(event);
  var activeDataSet =  window.myLine.getDatasetAtEvent(event);
  if (activePoints.length > 0)
  {
    var clickedDatasetIndex = activeDataSet[0]._datasetIndex;
    var clickedElementIndex = activePoints[0]._index;
    var value = window.myLine.data.datasets[clickedDatasetIndex].data[clickedElementIndex];
    arrLabel = value.label.split(',');arrLabel = arrLabel.filter(function(res) {return res!='All Branches'; });
    let idx = 0;
    if (arrLabel.length>1) idx = 1;
    chartWindow = window.open("/commofile/"+value.filename+"/"+arrLabel[idx]+"","chartWindow",top=0,width=500,heigh=500);
  }
}
//Load when html renders
$(document).ready(function() {
  //Remove clutters
  togglePanelHide(true);
  selChose();
  $('#formroute').hide();
  $('#overlay').hide()//display spinner
  //begin with updating the canvas
  $.ajax({
    type: 'POST',
    url: '/chartmonitor',
    success: function(data){
      updateCanvas(data);
      //load chart JS on canvas
      loadInterval = setInterval("loadCanvas(0)",1000);
    }
  });
});
