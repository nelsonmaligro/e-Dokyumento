window.myLine = null;  var tableCanvas = []; var loadInterval = null;
var myTable = $('#bootstrap-data-table-export').DataTable({lengthMenu: [[1], [1]],});
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

function updateCanvas(data){
  myTable.clear();disFiles = []; newDatasets = [];
  var arrData = JSON.parse(data);
  var count = 0; bodyCount = 0;
  arrData.forEach(function (items, index){
    disFiles.push(items.title.substring(0,15));
    var disSets = [];
    items.route.reverse().forEach(function (route){
      var branch = ""; var comma = "";
      route.branch.forEach(function (disBr){
        branch = branch + comma + disBr;
        comma = ",";
      });
      disSets.push({x:route.deyt, y:items.title.substring(0,15), label:branch, filename:items.filename, path:items.filepath});
    });
    disColor = randomColor(1);
    var sets = {
      label: items.title,
      data: disSets,
      borderColor: disColor,
      backgroundColor: 'transparent',
      pointRadius:4,
      pointBackgroundColor:disColor,
    }
    newDatasets.push(sets);

    if ((count == 5) || (index == arrData.length - 1)) {
      //alert(JSON.stringify(sets));
      //$('#tableCanvas').append("<tr><td><div style='width:99%;'><canvas id='canvas-"+bodyCount.toString()+"' height=300px ></canvas></div></td></tr>");
      //tableBody.push("<div style='width:99%;'><canvas id='canvas-"+bodyCount.toString()+"' height=300px ></canvas></div>");
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) myTable.row.add([" <div  style='width:98%;'><canvas ondblclick='openChartFile(event)' id='canvas-"+bodyCount.toString()+"' height=250px ></canvas></div>"]).draw();
      else myTable.row.add([" <div  style='width:98%;'><canvas ondblclick='openChartFile(event)' id='canvas-"+bodyCount.toString()+"' height=137px ></canvas></div>"]).draw();

      tableCanvas.push({x:newDatasets,y:disFiles});
      bodyCount= bodyCount + 1; count = 0; newDatasets=[]; disFiles=[];
      //alert('test');
    } else {
      count= count + 1 ;
    }
  });

  //var ctx = document.getElementById('canvas-0').getContext('2d');
  //window.myLine = new Chart(ctx, returnConfig(tableCanvas[0].x, tableCanvas[0].y));
}
$('#bootstrap-data-table-export').on('page.dt', function(){
  var num = myTable.page.info().page;
  loadInterval = setInterval("loadCanvas("+num+")",1000);
});

function loadCanvas(number){
  var ctx = $('#canvas-'+number.toString()).get(0).getContext('2d');
  window.myLine = new Chart(ctx, returnConfig(tableCanvas[number].x, tableCanvas[number].y));

  clearInterval(loadInterval);
}


function openChartFile(event)
{
  var activePoints = window.myLine.getElementsAtEvent(event);
  var activeDataSet =  window.myLine.getDatasetAtEvent(event);

  if (activePoints.length > 0)
  {
    var clickedDatasetIndex = activeDataSet[0]._datasetIndex;
    var clickedElementIndex = activePoints[0]._index;
    //data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].filename;
    var value = window.myLine.data.datasets[clickedDatasetIndex].data[clickedElementIndex];
    arrLabel = value.label.split(',');arrLabel = arrLabel.filter(function(res) {return res!='All Branches'; });
    let idx = 0;
    if (arrLabel.length>1) idx = 1;
    chartWindow = window.open("/commofile/"+value.filename+"/"+arrLabel[idx]+"","chartWindow",top=0,width=500,heigh=500);
    //start auto refresh Notification


  }
}

$(document).ready(function() {
  //Remove clutters
  togglePanelHide(true);
  selChose();
  $('#formroute').hide();
  $('#overlay').hide()//display spinner

  $.ajax({
    type: 'POST',
    url: '/chartmonitor',
    success: function(data){
      updateCanvas(data);
      //load chart JS on canvas
      loadInterval = setInterval("loadCanvas(0)",1000);


    }
  });


  // chart_name is whatever your chart object is named. here I am using a
  // jquery selector to attach the click event.


});
