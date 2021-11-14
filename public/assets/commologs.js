//For Pie chart
//initial config for pie chart
function returnConfigPie(arrBgCol, arrCount, arrBranch) {
  var configPie = {
    type: 'pie',
    data: {
      datasets: [ {
        data: arrCount,
        backgroundColor: arrBgCol
        //hoverBackgroundColor: arrBgHov
      } ],
      labels: arrBranch
    },
    options: {
      responsive: true,
      legend: {
        display: true,
        position: 'left',
        labels:{
          fontSize:8
        }
      }
    }
  };
  return configPie;
}


//generate random colors
function randomColorFactor() {
  return Math.round(Math.random() * 255);
}
function randomRGB(){
  return {red:randomColorFactor(), green:randomColorFactor(), blue:randomColorFactor()};
}
function randomColor(red, green, blue, opacity) {
  return (
    "rgba(" +
    red +
    "," +
    green +
    "," +
    blue +
    "," +
    (opacity || ".3") +
    ")"
  );
}
//initial configuration for bar chart
function returnConfig(datasets) {
  var config = {
    type: 'bar',
    data: {
      labels: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
      datasets: datasets
    },
    options: {
      legend:{
        labels: {
          fontSize:8
        }
      },
      scales: {
        yAxes: [ {
          ticks: {
            beginAtZero: true
          }
        } ]
      },
      pan: {
        enabled: true,
        mode: "x",
        speed: 10,
        threshold: 10
      },
      zoom: {
        enabled: true,
        drag: false,
        mode: "x",
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

//Update Canvas Bar and Pie Chart
function updateCanvas(data, arrBranch){
  //Update Bar Chart first
  let arrData = data.commologs;
  let arrChart = new Array;
  let arrMonth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let arrColor = new Array;
  //iterate through branches
  arrBranch.forEach(function (branch){
    arrNum = [];
    arrMonth.forEach(function (month){ //get number of routed documents per month
      let result = arrData.find(item=>(item.month==month) && (item.branch==branch));
      arrNum.push(result.count);
    });
    //assign color for the branch
    let arrRGB = randomRGB();
    disColor = randomColor(arrRGB.red, arrRGB.green, arrRGB.blue, .5);
    disBorder = randomColor(arrRGB.red, arrRGB.green, arrRGB.blue, 1);
    let setting = {
      label: branch,
      data: arrNum,
      borderColor: disBorder,
      borderWidth: "0",
      backgroundColor: disColor
    };
    arrColor.push(disColor); //this is to remember the color previously assigned to the branch
    arrChart.push(setting); //store the branch, month and colors into the array
  });
  //load array into the bar chart
  let ctx = document.getElementById( "barChart" );
  let myChart = new Chart( ctx, returnConfig(arrChart) );

  //Update pie chart
  let arrDataPie = data.current;
  let arrCount = new Array;
  //iterate through the branches and store count into the pie for the branch
  arrBranch.forEach((branch)=>{
    arrDataPie.forEach((item)=>{
      if (item.branch.toUpperCase()==branch.toUpperCase()) arrCount.push(item.count);
    });
  });

  //load array into the pie chart
  let ctxPie = document.getElementById( "pieChart" );
  let myChartPie = new Chart( ctxPie, returnConfigPie(arrColor, arrCount, arrBranch));

}
//Load when html renders
$(document).ready(function() {
  //Remove clutters
  togglePanelHide(true);
  $('#formroute').hide();
  $('#overlay').hide()//display spinner
  let except =['ALL BRANCHES', 'SECRETARY-RECEIVING'];

  var options = $('#tempSelBr option');
  var values = new Array;
  var arrBranch = new Array;
  //put delay for initial loading of the canvas... then update the canvas with the correct values
  sleep(2000).then(()=>{
    values = $.map(options ,function(option) {
      return option.value;
    });
  }).then(()=>{
    //request server for the document routing logs
    arrBranch = values.filter((item)=>{return !except.includes(item);}); //get all branches except listed above
    $.ajax({
      type: 'POST',
      url: '/dashlogs',
      success: function(data){
        let arrData = JSON.parse(data);
        var disYear = new Date().getFullYear();
        $('#titleBar').html("Total Documents Routed (CY " +disYear.toString()+")");
        updateCanvas(arrData, arrBranch); //update the canvas using the identified branches
      }
    });
  });
});
