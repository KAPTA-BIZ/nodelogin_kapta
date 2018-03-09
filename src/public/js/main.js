new Chart(document.getElementById("bar-chart"), {
    
    type: 'bar',
    data: {
      labels: ["", "", "%", "", "" ],
      datasets: [
        {
          label: "",
          backgroundColor: ["", "","#3cba9f","",""],
          data: [0,0,80,0,0]
        }
      ]
    },
    options: {
      legend: { display: false },
      /*title: {
        display: true,
        text: 'Predicted world population (millions) in 2050'
      },*/
      scales: {
        xAxes: [{
            display: true,
            scaleLabel: {
            display: true
            }
            }],
        yAxes: [{
            display: true,
            ticks: {
            beginAtZero: true,
            steps: 10,
            stepValue: 5,
            max: 100
            }
        }]
       }
    }
});