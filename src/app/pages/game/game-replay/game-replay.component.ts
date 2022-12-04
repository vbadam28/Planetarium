import { Component, Inject, OnInit, OnDestroy, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Chart, ChartConfiguration, ChartData, ChartDataset, registerables} from 'chart.js';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { GameModes } from 'src/app/shared/constants/GameModes';
import { BestGameResult } from 'src/app/shared/models/BestGameResults';
import { GameArea } from 'src/app/shared/models/GameArea';
import { GameResult } from 'src/app/shared/models/GameResult';
import { StarLine } from 'src/app/shared/models/StarLine';
import { StarPoint } from 'src/app/shared/models/StarPoint';
import { GameService } from 'src/app/shared/services/game.service';
import { User } from '../../../shared/models/User';

@Component({
  selector: 'app-game-replay',
  templateUrl: './game-replay.component.html',
  styleUrls: ['./game-replay.component.scss']
})
export class GameReplayComponent implements OnInit, OnDestroy {

  @Input() resultGame?: GameResult | null;
  @Input() resultId?: string;
  @Input() resultType?: 'BestGameResults' | 'GameResults';

  user!: User;
  gameResultsSubs$?: Subscription;
  currentGameResult!: GameResult;
  selected = 0;

  gameAreaSize = { width: 400, height: 300 };
  gameAreaCorrection = { width: 0, height: 0 };
  gameAreaPadding = 20;
  rounds: number[] = [];
  type: 'Examination' | 'Classic' | 'Normal' | 'Hard' = "Examination";
  title:string="";
  gameRes$:BehaviorSubject<GameResult|undefined> = new BehaviorSubject<GameResult|undefined>(undefined);
  boardPoints$: Subject<StarPoint[]> = new Subject<StarPoint[]>();
  validLines$: Subject<StarLine[]> = new Subject<StarLine[]>();
  shortTermLines$: Subject<StarLine[]> = new Subject<StarLine[]>();
  shortTermMissingLines$: Subject<StarLine[]> = new Subject<StarLine[]>();
  shortTermWrongLines$: Subject<StarLine[]> = new Subject<StarLine[]>();
  longTermMissingLines$: Subject<StarLine[]> = new Subject<StarLine[]>();
  longTermWrongLines$: Subject<StarLine[]> = new Subject<StarLine[]>();
  longTermLines$: Subject<StarLine[]> = new Subject<StarLine[]>();
  chart?: any;
  /**
   * TODO:
   *       - user adatok kellenének
   *       -extra statisztikák
  **/
  constructor(public dialogRef: MatDialogRef<GameReplayComponent>, @Inject(MAT_DIALOG_DATA) data: User | null, private gameService: GameService) {
    this.user = data as User;
    
  }

  ngOnInit(): void {
    Chart.register(...registerables);



    
    if (this.resultId && this.resultType) {
      this.gameService.getById(this.resultType == "BestGameResults" ? this.user.id : this.resultId, this.resultType).subscribe(bestGameResult => {
        if (this.resultType == "BestGameResults") {
          (bestGameResult as BestGameResult)[this.type]!.docRef.get().then(snapshot => {
            this.currentGameResult = snapshot.data() as GameResult;
            this.title = GameModes[this.currentGameResult.gameType]['text'] as string;
              this.gameAreaCorrection = {
              width: this.gameAreaSize.width / this.currentGameResult.gameAreaSize!.width,
              height: this.gameAreaSize.height / this.currentGameResult.gameAreaSize!.height,
            };
            this.rounds = Array(this.currentGameResult.validLines!.length).fill(0).map((x, i) => i);
            this.roundSelected(0);
          })
        } else {
          this.currentGameResult = (bestGameResult as GameResult);
          this.title = GameModes[this.currentGameResult.gameType]['text'] as string;
          this.gameAreaCorrection = {
            width: this.gameAreaSize.width / this.currentGameResult.gameAreaSize!.width,
            height: this.gameAreaSize.height / this.currentGameResult.gameAreaSize!.height,
          };
          this.rounds = Array(this.currentGameResult.validLines!.length).fill(0).map((x, i) => i);
          this.roundSelected(0);
        }

        this.initChart();
        this.colorOnSelected(0, this.chart.legend);

      });
      return;
    }
    this.gameResultsSubs$ = this.gameService.getById(this.user.id, "BestGameResults").subscribe(bestGameResult => {
      (bestGameResult as BestGameResult)[this.type]!.docRef.get().then(snapshot => {
        this.currentGameResult = snapshot.data() as GameResult;
        this.title = GameModes[this.currentGameResult.gameType]['text'] as string;
        this.gameAreaCorrection = {
          width: this.gameAreaSize.width / this.currentGameResult.gameAreaSize!.width,
          height: this.gameAreaSize.height / this.currentGameResult.gameAreaSize!.height,
        };

        this.rounds = Array(this.currentGameResult.validLines!.length).fill(0).map((x, i) => i);
        this.roundSelected(this.selected);

        this.initChart();
        this.colorOnSelected(this.selected, this.chart.legend);
      })





    });
  }

  ngOnDestroy(): void {
    this.gameResultsSubs$?.unsubscribe();
  }

  roundSelected(round: number) {
    for (const starPoint of this.currentGameResult.boardPoints!) {
      const lineIndex = this.currentGameResult.validLines![round].value.findIndex((line: StarLine) => {
        return ((starPoint.column == line.startPoint.column && starPoint.row == line.startPoint.row)
          || (starPoint.column == line.endPoint!.column && starPoint.row == line.endPoint!.row));
      });
      starPoint.active = lineIndex != -1;


    }
    this.gameRes$.next(this.currentGameResult);

    if (this.chart)
      this.colorOnSelected(round, this.chart.legend);

  }

  initChart() {
    if (this.chart) {
      this.chart.destroy();
    }
    const data: ChartData<"bar", string[] | number[] |any>  = {// values on X-Axis
      labels: Array(6).fill(0).map((x, i) => (i + 1) + ". kör"),// ["1", "2 ", "3  ", "4 ", "5 ", "6",],
      datasets: [
        {
          label: "Rövidtávú memória %",
          data: this.currentGameResult.shortRoundRatios!.map(x => (x * 100).toFixed(2)),
          backgroundColor: Array(6).fill("#1F618D"),//['#CB4335', '#1F618D', '#F1C40F', '#27AE60', '#884EA0', '#D35400'],// 'blue'
          borderColor: "#1F618D",
          borderWidth:2,
        },
        {
          label: "Hosszútávú memória %",
          data: this.currentGameResult.longRoundRatios!.map(x => (x * 100).toFixed(2)),
          backgroundColor: Array(6).fill("#27AE60"),//['#CB4335', '#1F618D', '#F1C40F', '#27AE60', '#884EA0', '#D35400'],//'limegreen'
          borderColor: "#27AE60",
          borderWidth:2,
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

