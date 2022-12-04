import { Component, Inject, OnInit , AfterViewInit} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Chart, ChartConfiguration, ChartData, ChartDataset, registerables } from 'chart.js';
import { BehaviorSubject, Subject } from 'rxjs';
import { GameModes } from 'src/app/shared/constants/GameModes';
import { GameArea } from 'src/app/shared/models/GameArea';
import { StarLine } from 'src/app/shared/models/StarLine';
import { StarPoint } from 'src/app/shared/models/StarPoint';
import { GameResult } from '../../../shared/models/GameResult';
import { AuthService } from '../../../shared/services/auth.service';


@Component({
  selector: 'app-game-result',
  templateUrl: './game-result.component.html',
  styleUrls: ['./game-result.component.scss']
})
export class GameResultComponent implements OnInit,AfterViewInit {

  gameResult$: BehaviorSubject<GameResult | undefined> = new BehaviorSubject<GameResult | undefined>(undefined);
  currentGameResult;
  type: "Examination" | "Classic" | "Normal" | "Hard" = "Examination"
  title: string = "";
  gameAreaSize = { width: 400, height: 300 };
  gameAreaCorrection = { width: 0, height: 0 };
  gameAreaPadding = 20;
  rounds: number[] = [];
  selected = 0;
  gameMode: any;
  chart: any;

  constructor(private authService: AuthService, public dialogRef: MatDialogRef<GameResultComponent>, @Inject(MAT_DIALOG_DATA) data: GameResult) {

    this.currentGameResult = data;

  }

  ngOnInit() {
    Chart.register(...registerables);
    this.gameMode = GameModes[this.currentGameResult.gameType];
    this.type = this.currentGameResult.gameType as "Examination" | "Classic" | "Normal" | "Hard";
    this.title = GameModes[this.currentGameResult.gameType]['text'] as string;
    this.gameAreaCorrection = {
      width: this.gameAreaSize.width / this.currentGameResult.gameAreaSize!.width,
      height: this.gameAreaSize.height / this.currentGameResult.gameAreaSize!.height,
    };
    this.rounds = Array(this.currentGameResult.validLines!.length).fill(0).map((x, i) => i);

    this.roundSelected(0);
  }
  ngAfterViewInit(): void {
    if (this.currentGameResult.gameType == "Examination")
      this.initChart()
  }
  roundSelected(round: number) {
    for (const starPoint of this.currentGameResult.boardPoints!) {
      const lineIndex = this.currentGameResult.validLines![round].value.findIndex((line: StarLine) => {
        return ((starPoint.column == line.startPoint.column && starPoint.row == line.startPoint.row)
          || (starPoint.column == line.endPoint!.column && starPoint.row == line.endPoint!.row));
      });
      starPoint.active = lineIndex != -1;
    }
    this.gameResult$.next(this.currentGameResult)

    if (this.chart)
      this.colorOnSelected(round, this.chart.legend);
  }
  close() {
    this.dialogRef.close();
  }




  initChart() {
    if (this.chart) {
      this.chart.destroy();
    }
    const data: ChartData<"bar", string[] | number[] | any> = {// values on X-Axis
      labels: Array(6).fill(0).map((x, i) => (i + 1) + ". kör"),// ["1", "2 ", "3  ", "4 ", "5 ", "6",],
      datasets: [
        {
          label: "Rövidtávú memória %",
          data: this.currentGameResult.shortRoundRatios!.map(x => (x * 100).toFixed(2)),
          backgroundColor: Array(6).fill("#1F618D"),//['#CB4335', '#1F618D', '#F1C40F', '#27AE60', '#884EA0', '#D35400'],// 'blue'
          borderColor: "#1F618D",
          borderWidth: 2,
        },
        {
          label: "Hosszútávú memória %",
          data: this.currentGameResult.longRoundRatios!.map(x => (x * 100).toFixed(2)),
          backgroundColor: Array(6).fill("#27AE60"),//['#CB4335', '#1F618D', '#F1C40F', '#27AE60', '#884EA0', '#D35400'],//'limegreen'
          borderColor: "#27AE60",
          borderWidth: 2,
        }
      ]
    };
    const config: ChartConfiguration<"bar", (string[] | number[])> = {
      type: "bar",

      data: data,
      options: {
        //aspectRatio: 2.5,
        responsive: true,
        plugins: {
          legend: {
            position: 'top',


          },
          title: {
            display: true,
            text: 'Vizsgálat eredmény'

          }
        },
        scales: {/*y: {
          max: 100,
          min: -100,
        }*/
        }

      }

    };
    this.chart = new Chart("chart", config);

  }

  colorOnSelected(selectedIndex: number, legend: any) {
    legend.chart.data.datasets.forEach((dataset: ChartDataset<"bar", string[] | number[]>) => {
      (dataset.backgroundColor as string[]).forEach((color: string, index: number, colors: string[]) => {
        color = color.length === 9 ? color.slice(0, -2) : color;
        colors[index] = index === selectedIndex ? color : color + '4D';
      });
    });
    legend.chart.update();
  }
}
