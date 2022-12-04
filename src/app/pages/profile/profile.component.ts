import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { User } from '../../shared/models/User';
import { UserService } from '../../shared/services/user.service';
import { catchError, firstValueFrom, from, of, Subscription, switchMap } from 'rxjs';
import { Image } from '../../shared/models/Image';
import { MatDialog } from '@angular/material/dialog';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { ImageService } from '../../shared/services/image.service';
import { HotToastService } from '@ngneat/hot-toast';
import { Chart, ChartConfiguration, ChartData, registerables, DatasetChartOptions } from 'chart.js';
import { GameService } from 'src/app/shared/services/game.service';
import { StatisticsService } from 'src/app/shared/services/statistics.service';
import { GameModes, GameModesMenu } from 'src/app/shared/constants/GameModes';
import { MatTableDataSource } from '@angular/material/table';
import { GameResult } from 'src/app/shared/models/GameResult';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {



  userId = '';
  user?: User;
  ownProfile = false;
  image?: Image;
  loadedImage: string = '';

  profileForm?: FormGroup;

  gameResultForChart: { Examination: string[][], Normal: number[], Hard: number[], Classic: number[] } = { Examination: [[], []], Normal: [0], Hard: [0], Classic: [0] };
  imageGet$?: Subscription;
  loadImage$?: Subscription;
  actRouteSub$?: Subscription;
  userSub$?: Subscription;
  isPublicResults = true;
  chart?: Chart<"bar" | "line", string[] | number[], unknown>;
  chartType: 'bar' | 'line' = 'bar';
  gameTypes = GameModesMenu;
  selectedGameType: "Examination" | "Normal" | "Hard" | "Classic" = "Examination";
  selectedTable = this.selectedGameType;
  displayedColumns: string[] = ['round1', 'round2', 'round3', 'round4', 'round5', 'round6', 'shortTermAll', 'longTermAll'];
  dataSource: MatTableDataSource<GameResult> = new MatTableDataSource();
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  constructor(private toast: HotToastService, private dialog: MatDialog, private gameService: GameService, private statisticsService: StatisticsService, private userService: UserService, private imageService: ImageService, private actRoute: ActivatedRoute) { }

  ngOnInit(): void {
    Chart.register(...registerables);
    const user = JSON.parse(localStorage.getItem('user') as string) as firebase.default.User;

    this.actRouteSub$ = this.actRoute.params.subscribe((param: Params) => {
      this.userId = param['userId'] as string;
    })
    //this.actRoute.snapshot.paramMap.get("userId");
    this.userId = this.userId ?? user.uid;

    this.userSub$ = this.userService.getById(this.userId).subscribe(data => {
      this.user = data;
      this.isPublicResults = this.user!.isPublicResults;

    })
    this.imageGet$ = this.imageService.get(this.userId).subscribe({
      next: img => {
        this.image = img;
        if (img) {
          this.loadImage$ = this.imageService.loadImage(img.imageUrl).subscribe((data) => {
            this.loadedImage = data;
          });
        }
      }, error: error => {
        console.error(error);
        const profileImg = "images/profile.jpg";
        this.loadImage$ = this.imageService.loadImage(profileImg).subscribe((data) => {
          this.loadedImage = data;
        });
      }
    });

    this.ownProfile = this.userId === user.uid;

    if (this.ownProfile) {
      this.getStatistics();
      this.getResults('Examination');
    }
  }
  ngAfterViewInit() {
    if (this.paginator)
      this.dataSource.paginator = this.paginator;
    if(this.sort)
      this.dataSource.sort=this.sort;
    console.log(this.sort)
    }

  ngOnDestroy(): void {
    this.imageGet$?.unsubscribe();
    this.loadImage$?.unsubscribe();
    this.actRouteSub$?.unsubscribe();
    this.userSub$?.unsubscribe();
  }

  setChanges($event: any) {
    this.user!.isPublicResults = $event.checked;
  }

  edit(type: string) {
    if (type != 'image') {
      const dialogRef = this.dialog.open(EditProfileComponent, { 'panelClass': 'mat-dialog-container-small', 'data': { type: type, isPublicResults: this.user?.isPublicResults } });

      const diaRef$ = dialogRef.afterClosed().subscribe({
        next: () => {
        }, error: error => {
          console.error(error);
        }, complete: () => { diaRef$.unsubscribe() }
      });
    }
  }

  onFileInput(imgFile: any) {
    if (imgFile.target.files) {
      let splittedName = imgFile.target.files[0].name.split('.');
      let ext = splittedName.pop().toLowerCase();
      let name = splittedName.join('_');

      if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {

        const renamedFile = new File([imgFile.target.files[0]], this.userId + "." + ext);
        const picUpload$ = from(this.imageService.uploadImage(renamedFile)).pipe(
          switchMap(_ => {
            this.image!.name = name;
            this.image!.lastModified = new Date().getTime();
            this.image!.imageUrl = 'images/' + renamedFile.name;
            return from(this.imageService.updateImage(this.image as Image));
          }),
          this.toast.observe({
            loading: 'Kép feltöltése...',
            success: 'Sikeres képfeltöltés!',
            error: (e) => 'Sikertelen képfeltöltés: ' + e,
          }),
        ).subscribe({
          complete: () => { picUpload$.unsubscribe() }
        });

      } else {
        this.toast.error("Nem megfelelő fájlformátum,csak jpg,jpeg,png.\n Feltöltött kép: " + ext);
      }

    }

  }

  initChart() {

    const data: ChartData<"bar", string[] | number[] | any> = {// values on X-Axis
      labels: Array(6).fill(0).map((x, i) => (i + 1) + ". kör"),
      datasets: [
        {
          label: "Azonnali felidézés %",
          data: this.gameResultForChart.Examination[0],//this.currentGameResult.shortRoundRatios!.map(x => (x * 100).toFixed(2)),
          backgroundColor: "#1F618D4D",//Array(6).fill("#1F618D"),//['#CB4335', '#1F618D', '#F1C40F', '#27AE60', '#884EA0', '#D35400'],// 'blue'
          borderColor: "#1F618D",
          borderWidth: 2,
        },
        {
          label: "Késleltetett felidézés %",
          data: this.gameResultForChart.Examination[1],//this.currentGameResult.longRoundRatios!.map(x => (x * 100).toFixed(2)),
          backgroundColor: "#27AE604D",// Array(6).fill("#27AE60"),//['#CB4335', '#1F618D', '#F1C40F', '#27AE60', '#884EA0', '#D35400'],//'limegreen'
          borderColor: "#27AE60",
          borderWidth: 2,
        }
      ]
    };
    const config: ChartConfiguration<"bar" | "line", (string[] | number[])> = {
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
            text: 'Utolsó 10 Vizsgálat átlagos eredmény'

          },

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

  changeChartType() {
    this.chartType = this.chartType == 'bar' ? 'line' : 'bar';
    this.chart!.data.datasets.forEach((dataset) => {
      dataset.type = this.chartType;
    });
    this.chart?.update();
  }
  changeChartData(gType: string) {
    this.selectedGameType = gType as 'Examination' | 'Normal' | 'Classic' | 'Hard';
    const data = this.gameResultForChart[this.selectedGameType];
    if (this.selectedGameType == "Examination") {
      this.chart!.config.options!.plugins!.title!.text = "Utolsó 10 Vizsgálat átlagos eredmény";
      this.chart!.data.labels = Array(6).fill(0).map((x, i) => (i + 1) + ". kör");
      this.chart!.data.datasets = [
        {
          type: this.chartType,
          label: "Azonnali felidézés %",
          data: this.gameResultForChart.Examination[0],//this.currentGameResult.shortRoundRatios!.map(x => (x * 100).toFixed(2)),
          backgroundColor: "#1F618D4D",//Array(6).fill("#1F618D"),//['#CB4335', '#1F618D', '#F1C40F', '#27AE60', '#884EA0', '#D35400'],// 'blue'
          borderColor: "#1F618D",
          borderWidth: 2,
        },
        {
          type: this.chartType,

          label: "Késleltetett felidézés %",
          data: this.gameResultForChart.Examination[1],//this.currentGameResult.longRoundRatios!.map(x => (x * 100).toFixed(2)),
          backgroundColor: "#27AE604D",// Array(6).fill("#27AE60"),//['#CB4335', '#1F618D', '#F1C40F', '#27AE60', '#884EA0', '#D35400'],//'limegreen'
          borderColor: "#27AE60",
          borderWidth: 2,
        }
      ];
    } else {
      this.chart!.config.options!.plugins!.title!.text = "Utolsó 10 " + GameModes[this.selectedGameType]['text'] + " játék átlagos eredmény";
      this.chart!.data.labels = Array(this.gameResultForChart[this.selectedGameType].length).fill(0).map((x, i) => (i + 1) + ". szint");
      this.chart!.data.datasets = [
        {
          type: this.chartType,

          label: "Teljesítések száma",
          data: this.gameResultForChart[this.selectedGameType],//this.currentGameResult.shortRoundRatios!.map(x => (x * 100).toFixed(2)),
          backgroundColor: "#1F618D4D",//Array(6).fill("#1F618D"),//['#CB4335', '#1F618D', '#F1C40F', '#27AE60', '#884EA0', '#D35400'],// 'blue'
          borderColor: "#1F618D",
          borderWidth: 2,
        },
      ];
    }
    this.chart?.update();

  }

  changeTableData(type: string) {
    if (type == "Examination") {
      this.displayedColumns = ['round1', 'round2', 'round3', 'round4', 'round5', 'round6', 'shortTermAll', 'longTermAll'];

    } else {
      this.displayedColumns = ['level', 'datetime'];

    }
    this.selectedTable = (type as "Examination" | "Normal" | "Hard" | "Classic");
    this.getResults(type);
  }

  async getResults(type: string) {
    this.dataSource.data = await firstValueFrom(this.gameService.getByUserIdnType(this.userId, type));

  }

  getStatistics() {
    firstValueFrom(this.gameService.getByUserIdOrderLimit(this.userId, 'Examination', "datetime", 'desc', 10)).then(results => {
      let shortTermMemory: number[] = Array(6).fill(0);
      let longTermMemory: number[] = Array(6).fill(0);
      const size = results.length == 0 ? 1 : results.length;
      for (const result of results) {
        for (let i = 0; i < 6; i++) {
          shortTermMemory[i] += result.shortRoundRatios![i];
          longTermMemory[i] += result.longRoundRatios![i];
        }
      }


      this.gameResultForChart.Examination[0] = shortTermMemory.map(res => ((res / size) * 100).toFixed(2));
      this.gameResultForChart.Examination[1] = longTermMemory.map(res => ((res / size) * 100).toFixed(2));
      this.initChart();
    });


    firstValueFrom(this.statisticsService.getById("Normal")).then(doc => {
      this.gameResultForChart.Normal[0] = doc!.levels.length;
      return firstValueFrom(this.gameService.getByUserIdOrderLimit(this.userId, 'Normal', "datetime", 'desc', 10));
    }).then(results => {

      const normalLevels = this.gameResultForChart.Normal.pop()
      const levels = Array(normalLevels).fill(0);
      for (const res of results) {
        levels[res.level!]++;
      }
      this.gameResultForChart.Normal = levels;
    });

    firstValueFrom(this.statisticsService.getById("Hard")).then(doc => {
      this.gameResultForChart.Hard[0] = doc!.levels.length ?? 0;
      return firstValueFrom(this.gameService.getByUserIdOrderLimit(this.userId, 'Hard', "datetime", 'desc', 10));
    }).then(results => {

      const hardLevels = this.gameResultForChart.Hard.pop()
      const levels = Array(hardLevels).fill(0);
      for (const res of results) {
        levels[res.level!]++;
      }
      this.gameResultForChart.Hard = levels;
    });

    firstValueFrom(this.statisticsService.getById("Classic")).then(doc => {
      this.gameResultForChart.Classic[0] = doc!.levels.length;
      return firstValueFrom(this.gameService.getByUserIdOrderLimit(this.userId, 'Classic', "datetime", 'desc', 10));
    }).then(results => {

      const classicLevels = this.gameResultForChart.Classic.pop()
      const levels = Array(classicLevels).fill(0);
      for (const res of results) {
        levels[res.level!]++;
      }
      this.gameResultForChart.Hard = levels;
    });
  }
}
