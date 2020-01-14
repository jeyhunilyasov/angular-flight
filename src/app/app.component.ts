import { Component } from '@angular/core';
import { FlightService } from './services/flight.service';
import * as XLSX from 'xlsx';
import * as Chart from "chart.js";

type AOA = any[][];

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {
  data: AOA = [];
  jsonData = [];
  inValues = [];
  outValues = [];
  timeValues = [];
  wopts: XLSX.WritingOptions = { bookType: "xlsx", type: "array" };
  fileName: string = "SheetJS.xlsx";
  title = "flight";
  constructor(private flightService: FlightService) {}

  ngOnInit() {
    this.getJsonFormatData();
  }

  onFileChange(evt: any) {
    this.jsonData = [];
    /* wire up file reader */
    const target: DataTransfer = <DataTransfer>evt.target;
    if (target.files.length !== 1) throw new Error("Cannot use multiple files");
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      /* read workbook */
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: "binary" });

      /* grab first sheet */
      const wsname: string = wb.SheetNames[1];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      /* save data */
      this.data = <AOA>XLSX.utils.sheet_to_json(ws, { header: 1 });
      console.log(this.data);
      this.getJsonFormatData();
      this.drawGraph();
    };
    reader.readAsBinaryString(target.files[0]);
  }

  getJsonFormatData() {
    for (let i = 0; i < this.data.length; i++) {
      var ele = {
        time: this.data[i][0],
        inbound: -this.data[i][1],
        outbound: this.data[i][2]
      };
      this.inValues.push(-this.data[i][1]);
      this.outValues.push(this.data[i][2]);
      this.timeValues.push(this.data[i[0]]);
      this.jsonData.push(ele);
    }
    console.log(this.jsonData);
  }

  // title = "angular8chartjs";
  canvas: any;
  ctx: any;
  drawGraph() {
    this.canvas = document.getElementById("myChart");
    this.ctx = this.canvas.getContext("2d");
    var horizontalBarChartData = {
      labels: [
        "8:00 A.M",
        "9:00 A.M",
        "10:00 A.M",
        "11:00 A.M",
        "12:00 P.M",
        "1:00 P.M",
        "2:00 P.M"
      ],
      datasets: [
        {
          label: "Inbound flights",
          backgroundColor: '#f4b084',
          borderColor: '#f4b084',
          borderWidth: 1,
          data: this.inValues
        },
        {
          label: "Outbounds flights",
          backgroundColor: '#ffc000',
          borderColor: 'ffc000',
          data: this.outValues
        }
      ]
    };
    let myChart = new Chart(this.ctx, {
      type: "horizontalBar",
      data: horizontalBarChartData,
      options: {
        // Elements options apply to all of the options unless overridden in a dataset
        // In this case, we are setting the border of each horizontal bar to be 2px wide
        scales: {
          yAxes: [
            {
              gridLines: {
                display: true,
                color: "rgba(219,219,219,0.3)",
                zeroLineColor: "rgba(219,219,219,0.3)",
                drawBorder: false, // <---
                lineWidth: 27,
                zeroLineWidth: 1
              },
              ticks: {
                beginAtZero: true,
                display: true
              }
            }
          ],
          xAxes: [
            {
              gridLines: {
                display: false,
                color: "rgba(219,219,219,0.3)",
                zeroLineColor: "rgba(219,219,219,0.3)",
                drawBorder: false, // <---
                lineWidth: 27,
                zeroLineWidth: 1
              },
              ticks: {
                callback: function(t, i) {
                  return t < 0 ? Math.abs(t) : t;
                }
              }
            }
          ]
        },
        tooltips: {
          callbacks: {
            label: function(t, d) {
              var datasetLabel = d.datasets[t.datasetIndex].label;
              var xLabel = Math.abs(t.xLabel);
              return datasetLabel + ": " + xLabel;
            }
          }
        },
        elements: {
          rectangle: {
            borderWidth: 2
          }
        },
        responsive: true,
        legend: {
          position: "right"
        },
        title: {
          display: true,
          text: "Flight Time table DEL"
        },
        // animation: {
        //   onComplete: function() {
        //     var chartInstance = this.chart;
        //     var ctx = chartInstance.ctx;
        //     ctx.textAlign = "center";
        //     ctx.font = "19px Open Sans";
        //     ctx.fillStyle = "#fff";

        //     Chart.helpers.each(
        //       this.data.datasets.forEach(function(dataset, i) {
        //         var meta = chartInstance.controller.getDatasetMeta(i);
        //         Chart.helpers.each(
        //           meta.data.forEach(function(bar, index) {
        //             var data = dataset.data[index];
        //             if( data < 0) data = Math.abs(data);
        //             var barWidth = bar._model.x - bar._model.base;
        //             var centerX = bar._model.base + barWidth / 2;
        //             if (i == 0) {
        //               ctx.fillText(data, centerX, bar._model.y + 4);
        //             } else {
        //               ctx.fillText(data, centerX, bar._model.y + 4);
        //             }
        //           }),
        //           this
        //         );
        //       }),
        //       this
        //     );
        //   }
        // }
      }
    });
  }
}
