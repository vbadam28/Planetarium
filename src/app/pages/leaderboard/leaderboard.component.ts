import { Component, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import {
  Chart, ChartConfiguration, ChartData, registerables,
  ChartDataset
} from 'chart.js';
import { firstValueFrom, Subscription } from 'rxjs';
import { Statistics } from '../../shared/models/Statistics';
import { AuthService } from '../../shared/services/auth.service';
import { GameModesMenu } from '../../shared/constants/GameModes';
import { BestGameResult } from '../../shared/models/BestGameResults';
import { User } from '../../shared/models/User';
import { GameService } from '../../shared/services/game.service';
import { StatisticsService } from 'src/app/shared/services/statistics.service';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit, OnDestroy {

  leaderboardSub$?: Subscription;
  dataSource: MatTableDataSource<BestGameResult & User> = new MatTableDataSource();
  displayedColumns: string[] = ['placement', 'username', 'level'];
  type: string = "Examination";
  gametypes = GameModesMenu;
  chart?: Chart<"bar" | "line", string[] | number[], unknown>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  userBestResult?: BestGameResult;
  loggedInUser!: firebase.default.User;
  statistics: { [key: string]: Statistics } = {};
  chartType: 'line' | 'bar' = "bar";
  constructor(private gameService: GameService, private statisticsService: StatisticsService, private authService: AuthService) { }

  //TODO: az average és a userData rendesen az averagebol
  async ngOnInit() {
    this.displayedColumns = this.type == "Examination" ? ['placement', 'username', 'shortTermPoints', 'longTermPoints'] : ['placement', 'username', 'level'];

    Chart.register(...registerables);
    this.loggedInUser = await this.authService.getCurrentUser() as firebase.default.User;
    this.userBestResult = await firstValueFrom(this.gameService.getById(this.loggedInUser.uid, "BestGameResults")) as BestGameResult;
    this.statistics['Examination'] = await firstValueFrom(this.statisticsService.getById(this.type)) as Statistics;

    firstValueFrom(this.statisticsService.getById('Normal')).then(stat => {
      this.statistics['Normal'] = stat as Statistics;
    })

    firstValueFrom(this.statisticsService.getById('Classic')).then(stat => {
      this.statistics['Classic'] = stat as Statistics;
    })

    firstValueFrom(this.statisticsService.getById('Hard')).then(stat => {
      this.statistics['Hard'] = stat as Statistics;
    })

    this.initTable();
    this.initChart();

  }
  changeTable(type: string) {
    this.type = type;
    if (this.userBestResult) {
      this.userBestResult!
    }
    this.initTable();
    this.initChart();
  }

  initTable() {
    this.displayedColumns = this.type == "Examination" ? ['placement', 'username', 'shortTermPoints', 'longTermPoints'] : ['placement', 'username', 'level'];
    const level = this.type == "Examination" ? 'shortTermPoints' : 'level';

    this.leaderboardSub$ = this.gameService.getBestResByType(this.type + '.' + level, 'desc').subscribe(async gameResults => {
      const data: Array<BestGameResult & User> = [];

      for (const gameRes of gameResults) {
        const snapshot = await gameRes.user.get();
        const usr = snapshot.data() as User;
        data.push({ ...gameRes, ...usr });
      }
      this.dataSource.data = data;
    });
  }
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.leaderboardSub$?.unsubscribe();
  }

  initChart() {

    if (this.chart) {
      this.chart.destroy();
    }
    const myData = this.getUserData();
    const averageData = this.getAverageData();
    const labels = this.getLabels();
    const scales = this.type == "Examination" ? {
      y: {
        max: 100,
        min: -100,
      }
    } : {};
    const datas: ChartDataset<"bar" | "line", any>[] = this.type == "Examination" ? [
      {
        label: "Általad elért azonnali felidézés %",
        data: myData[0],//['100', '-76', '100', '-76', '80', '-76', '70', '-68', '68', '76', '100', '76',],
        backgroundColor: '#1F618D4D',
        borderColor: "#1F618D",
        borderWidth: 2,
      },
      {
        label: "Általad elért késleltetett felidézés %",
        data: myData[1],//['30', '-40', '10', '-7', '20', '25', '70', '-28', '68', '76', '100', '76',],
        backgroundColor: '#cb43354D', //cb4335
        borderColor: "#cb4335",
        borderWidth: 2,
      }, {
        label: "Felhasználók Átlag Azonnali felidézés %",
        data: averageData[0],//['100', '-76', '100', '-76', '80', '-76', '70', '-68', '68', '76', '100', '76',],
        backgroundColor: '#27AE604D',
        borderColor: "#27AE60",
        borderWidth: 2,
      },
      {
        label: "Felhasználók Átlag késleltetett felidézés %",
        data: averageData[1],//['30', '-40', '10', '-7', '20', '25', '70', '-28', '68', '76', '100', '76',],
        backgroundColor: '#ffcd564D',
        borderColor: "#ffcd56",
        borderWidth: 2,
      },
    ] :
      [
        {
          label: "Általad Elért legmagasabb szint",
          data: myData[0],
          backgroundColor: '#1F618D4D',
          borderColor: "#1F618D",
          borderWidth: 2,
        },
        {
          label: "Felhasználók Átlag elért szintjei",
          data: averageData[0],
          backgroundColor: '#F1C40F4D',
          borderColor: "#F1C40F",
          borderWidth: 2,
        },
      ];


    const data: ChartData<"bar" | 'line', string | number | any, unknown> = {// values on X-Axis
      labels: labels,//["1 R ", "1 H", "2 R ", "2 H", "3 R ", " 3 H", "4 R ", "4 H", "5 R ", "5 H", "6 R ", "6 H",],
      datasets: datas
    };
    const config: ChartConfiguration<"bar" | "line", (string[] | number[])>= {
      type: this.chartType,

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
            text: 'A táblázat statisztikája'
          }
        },
        //scales: scales

      }

    };

    const ctx = 'chart';

    this.chart = new Chart(ctx, config);

  }
  changeChartType() {
    this.chartType = this.chartType == 'bar' ? 'line' : 'bar';
    this.chart!.data.datasets.forEach((dataset) => {
      dataset.type = this.chartType;
    });
    this.chart?.update();
  }

  getAverageData() {
    const data: number[][] = [[], []];
    for (const stat of this.statistics[this.type].levels) {
      if (this.type == "Examination") {
        data[0].push(stat.shortTermPoints! / stat.count * 100);
        data[1].push(stat.longTermPoints! / stat.count * 100);
      } else {
        data[0].push(stat.count!);
      }

    }
    return data;
  }
  getLabels() {
    if (this.type == "Examination") {
      return Array(6).fill(0).map((x, y) => (y + 1) + ". Kör");

    }
    return Array.from({ length: this.statistics[this.type].levels.length }, (_, i) => i + 1);
  }
  getUserData() {
    const type = this.type as ('Examination' | 'Normal' | 'Hard' | 'Classic');
    const myData: number[][] = [[], []];
    if (this.userBestResult && this.userBestResult[type]) {


      if (type == 'Examination') {
        for (const res of this.userBestResult[type]!.levels) {
          myData[0].push(this.userBestResult[type]!.shortTermPoints * 100);
          myData[1].push(this.userBestResult[type]!.longTermPoints * 100);
        }
      } else {
        for (let i = 0; i < this.userBestResult[type]!.level; i++) {
          myData[0].push(i == this.userBestResult[type]!.level - 1 ? this.userBestResult[type]!.level : 0);

        }

      }
    }
    return myData;
  }

}
