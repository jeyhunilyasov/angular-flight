import { Component } from '@angular/core';
import { FlightService } from './services/flight.service';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import * as XLSX from 'xlsx';
import * as Chart from "chart.js";
import readXlsxFile from "read-excel-file";

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
  csvData: any[] = [];
  title = "Miles Table for All Airports";
  lines = [];
  wopts: XLSX.WritingOptions = { bookType: "xlsx", type: "array" };
  fileName: string = "SheetJS.HubPattern.csv";
  csvUrl = "assets/HubPattern.csv";
  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.readCsvData();
  }
  private extractData(res: any) {
    let csvData = res;
    let allTextLines = csvData.split(/\r\n|\n/);
    let headers = allTextLines[0].split(",");
    console.log("headers:" + headers);

    for (let i = 0; i < allTextLines.length; i++) {
      let data = allTextLines[i].split(",");
      if (data.length == headers.length) {
        let tarr = [];
        for (let j = 0; j < headers.length; j++) {
          tarr.push(data[j]);
        }
        this.lines.push(tarr);
      }
    }
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

  readCsvData() {
    this.http.get(this.csvUrl, { responseType: "text" }).subscribe(data => {
      this.extractData(data);
    });
  }
  getJsonFormatData() {
    console.log(this.lines.length);
    for (let i = 0; i < this.lines.length; i++) {
      var ele = {
        time: this.lines[i][0],
        inbound: -this.lines[i][1],
        outbound: this.lines[i][2]
      };

      this.inValues.push(-this.lines[i][1]);
      this.outValues.push(this.lines[i][2]);
      console.log(this.lines[i][0])
      if (this.lines[i][0] < 12) {
        this.timeValues.push(this.lines[i][0] + ":00 A.M");
      } else {
        if (this.lines[i][0] == 12 )
          this.timeValues.push(this.lines[i][0] + ":00 P.M");
        else
          this.timeValues.push(this.lines[i][0] - 12 + ":00 P.M");
      }
      this.jsonData.push(ele);
    }
    this.drawGraph();
  }
  canvas: any;
  ctx: any;
  drawGraph() {
    this.canvas = document.getElementById("myChart");
    this.ctx = this.canvas.getContext("2d");
    var horizontalBarChartData = {
      labels: this.timeValues,
      datasets: [
        {
          label: "Inbound flights",
          backgroundColor: "#f4b084",
          borderColor: "#f4b084",
          borderWidth: 1,
          data: this.inValues
        },
        {
          label: "Outbounds flights",
          backgroundColor: "#ffc000",
          borderColor: "ffc000",
          data: this.outValues
        }
      ]
    };
    let myChart = new Chart(this.ctx, {
      type: "horizontalBar",
      data: horizontalBarChartData,
      options: {
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
              var text='';
              var xLabel = d.datasets[t.datasetIndex].label;
              var yLabel = t.yLabel;
              var val = yLabel.substring(0, yLabel.indexOf(':'));
              var when = yLabel.substring(yLabel.indexOf(':') + 3, yLabel.length);
              console.log(when);
              if( val == '11' && when === ' A.M'){
                text =
                  "between " + val + when + " and " + (Number(val) + 1) + " P.M";
              } else {
                if( val == '12' ) {
                  text = 'between ' + val + when + " and " + (1) + when;
                } else {
                    text = 'between ' + val + when + " and " + (Number(val) + 1) + when;
                }
              }
              return xLabel + ' ' + text;
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
          text: "Flight Time table for DEL"
        },
        animation: {
          onComplete: function() {
            var chartInstance = this.chart;
            var ctx = chartInstance.ctx;
            ctx.textAlign = "center";
            ctx.font = "19px Open Sans";
            ctx.fillStyle = "#fff";

            Chart.helpers.each(
              this.data.datasets.forEach(function(dataset, i) {
                var meta = chartInstance.controller.getDatasetMeta(i);
                Chart.helpers.each(
                  meta.data.forEach(function(bar, index) {
                    var data = dataset.data[index];
                    if (data < 0) data = Math.abs(data);
                    var barWidth = bar._model.x - bar._model.base;
                    var centerX = bar._model.base + barWidth / 2;
                    if (i == 0) {
                      ctx.fillText(data, centerX, bar._model.y + 4);
                    } else {
                      ctx.fillText(data, centerX, bar._model.y + 4);
                    }
                  }),
                  this
                );
              }),
              this
            );
          }
        }
      }
    });
  }
}
