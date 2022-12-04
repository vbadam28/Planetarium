import { Component, HostListener, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { from, Observable, Subject, switchMap, firstValueFrom, of } from 'rxjs';
import { GameResult } from '../../../shared/models/GameResult';
import { GameBoardService } from '../../../shared/services/game-board.service';
import { GameService } from '../../../shared/services/game.service';
import { lineAnimation } from '../../../shared/animations/LineAnimations';
import { GameModes } from '../../../shared/constants/GameModes';
import { GameArea } from '../../../shared/models/GameArea';
import { StarLine } from '../../../shared/models/StarLine';
import { StarPoint } from '../../../shared/models/StarPoint';
import { GameResultComponent } from '../game-result/game-result.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { HotToastService } from '@ngneat/hot-toast';
import { Errors } from '../../../shared/constants/Errors';
import { UserService } from '../../../shared/services/user.service';
import { User } from '../../../shared/models/User';
import { BestGameResult } from '../../../shared/models/BestGameResults';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { StatisticsService } from '../../../shared/services/statistics.service';
import { Statistics } from 'src/app/shared/models/Statistics';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  animations: [lineAnimation]
})
export class BoardComponent implements OnInit {
  // @Input() size!: { row: number, column: number };
  // @Input() lineSize!: number;
  lineSize: number = 0;
  gameAreaCorrection = { width: 0, height: 0 };
  gameState: "started" | "ended" | "init" = "init";

  starPoints: StarPoint[] = [];
  starLines: Array<StarLine[]> = [];
  tutorialLines: Array<StarLine[]> = [];
  tutorialBoard: StarPoint[] = [];
  userLines: Array<StarLine[]> = [];
  longTermLines: Array<StarLine[]> = [];
  stars$?: Observable<StarPoint[]>;
  lines$?: Observable<StarLine[]>;
  linesForControl$ = new Subject<StarLine[]>();

  gameTimer$ = new Subject<[number, boolean]>();
  helpLine$ = new Subject<boolean>();
  playedTutorial = false;
  gameResult?: GameResult;
  roundCounter: number = 0;
  clickedElement?: HTMLElement;
  drawingBoard?: HTMLElement;
  // kék: #0c1445, #4c408e, #5c54a4, #38285c.
  // fehér:#f8f8f9,#f3f3f5,#efeff2,#eaeaee,#e5e5eb
  gameAreaSize = { width: 1000, height: 600 };
  currentGameAreaSize = { width: 1000, height: 600 };
  gameAreaPadding = 40;
  game: any;
  solutionVisible = false;
  isNextRunning = false;
  phase = 1;
  starVisible = false;
  helpAvailable: boolean = false;
  loggedInUser: firebase.default.User | null = null;
  user: User | null = null;
  bestGameResult?: BestGameResult;
  oldBestResult?: BestGameResult;

  constructor(private authService: AuthService, private userService: UserService, private toast: HotToastService, private router: Router, private route: ActivatedRoute, private gameBoardService: GameBoardService, private gameService: GameService, private StatisticsService: StatisticsService, private dialog: MatDialog) {
    const gameType: string = (this.route.snapshot.params)['type'];
    //    this.router.onSameUrlNavigation ='reload'
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    let game = null;
    if (GameModes[gameType]) {
      game = GameModes[gameType];
      this.game = GameModes[gameType];
    }
    this.lineSize = (GameModes['Tutorial']!['gameArea'] as GameArea).lineSize.max;
    this.gameAreaCorrection = {
      width: this.gameAreaSize.width / this.gameAreaSize.width,
      height: this.gameAreaSize.height / this.gameAreaSize.height,
    };
  }

  ngOnInit() {
    this.loggedInUser = JSON.parse(localStorage.getItem('user') as string);
    if (this.loggedInUser != null) {
      firstValueFrom(this.userService.getById(this.loggedInUser.uid)).then(usr => {
        if (usr != undefined) {
          this.user = usr;
        }
      });
      firstValueFrom(this.gameService.getById(this.loggedInUser.uid, "BestGameResults")).then(gameRes => {
        this.bestGameResult = gameRes as BestGameResult;
        this.oldBestResult = { ...this.bestGameResult };
      });
    }
    this.tutorialBoard = this.gameBoardService.generateBoard(this.gameAreaSize, (GameModes['Tutorial']!['gameArea'] as GameArea).boardSize, 0);
    this.stars$ = new Observable((observer) => {
      observer.next(this.tutorialBoard);
    });
    this.tutorialLines.push(this.gameBoardService.generateLines(0, this.tutorialBoard, GameModes['Tutorial']));

    this.starPoints = this.gameBoardService.generateBoard(this.gameAreaSize, (this.game!['gameArea'] as GameArea).boardSize, (this.game!['gameArea'] as GameArea).random);
    const rounds = this.game['gameArea'].rounds;
    for (let i = 0; i < rounds; i++) {
      this.starLines.push(this.gameBoardService.generateLines(i, this.starPoints, this.game));
    }
  }

  validateRound(validLines: StarLine[], userCheckedLines: StarLine[]) {
    const missedLines = [];
    const _userCheckedLines = [...userCheckedLines];
    for (const validLine of validLines) {
      const foundLine = _userCheckedLines.findIndex((line: StarLine) => {
        //referenciával néha hibás 
        return ((line.startPoint.column == validLine.startPoint.column && line.startPoint.row == validLine.startPoint.row && line.endPoint!.column == validLine.endPoint!.column && line.endPoint!.row == validLine.endPoint!.row)
          || (line.startPoint.column == validLine.endPoint!.column && line.startPoint.row == validLine.endPoint!.row && line.endPoint!.column == validLine.startPoint.column && line.endPoint!.row == validLine.startPoint.row)
        );
      })

      if (foundLine != -1) {
        //splice mert annál kevesebbet kell iterálni minden körben
        _userCheckedLines.splice(foundLine, 1);
      } else {
        //meg nem talált vonalak
        missedLines.push(validLine);
      }

    }
    return [missedLines, _userCheckedLines];
  }
  checkResult(userLines: Array<StarLine[]>) {
    let validLinesList = [...this.tutorialLines];
    if (this.playedTutorial) {
      validLinesList = [...this.starLines];
    }
    const userCheckedLines = [...userLines];
    const missedLinesList = [];
    const wronglyFoundLinesList = [];
    for (let i = 0; i < validLinesList.length; i++) {
      const [missedLines, wrongLines] = this.validateRound(validLinesList[i], userCheckedLines[i]);
      missedLinesList.push(missedLines);
      wronglyFoundLinesList.push(wrongLines);
    }
    return [missedLinesList, wronglyFoundLinesList];

  }

  startGame() {
    this.roundCounter = 0;
    this.userLines = [];
    this.gameState = "started";
    const currentGame = this.playedTutorial ? this.game : GameModes['Tutorial'];
    this.lineSize = (currentGame!['gameArea'] as GameArea).lineSize.max;

    if (this.playedTutorial)
      this.stars$ = new Observable((observer) => {
        observer.next(this.starPoints);
      });
    this.nextRound();
  }

  async nextRound() {
    const currentGame = this.playedTutorial ? this.game : GameModes['Tutorial'];
    this.isNextRunning = true;
    this.helpAvailable = true;
    if (this.roundCounter != 0)
      this.startTimer(0, 0)

    if (this.roundCounter >= currentGame['gameArea'].rounds) {
      if (currentGame['gameArea'].longTermTime && currentGame['gameArea'].longTermTime > 0 && this.phase == 1) {
        this.phase = 2;
        const sec = this.game['gameArea'].longTermTime
        await this.startTimer(sec, 1000, false);
        this.roundCounter = 0;
        this.isNextRunning = false;

        this.nextRound();
        return;
      }
      if (this.phase == 2) {
        const [missedLines, wrongLines] = this.checkResult(this.userLines);
        const [missedLinesLong, wrongLinesLong] = this.checkResult(this.longTermLines);

        const gameResult: GameResult = this.setResult(currentGame, wrongLines, missedLines, wrongLinesLong, missedLinesLong);
        this.showResult({ ...gameResult });

        this.gameState = "ended";
        if (this.loggedInUser != null)
          this.saveGameResult(gameResult);

      }
      if (this.phase == 1 && (!currentGame['gameArea'].longTermTime || currentGame['gameArea'].longTermTime < 0) && this.playedTutorial) {
        const [missedLines, wrongLines] = this.checkResult(this.userLines);

        const gameResult: GameResult = this.setResult(currentGame, wrongLines, missedLines);
        this.showResult({ ...gameResult });

        this.gameState = "ended";
        if (this.loggedInUser != null) {
          delete gameResult.boardPoints;
          delete gameResult.validLines;
          delete gameResult.shortTermLines;
          delete gameResult.shortTermWrongLines;
          delete gameResult.shortTermMissingLines;

          this.saveGameResult(gameResult);
        }
      }

      if (!this.playedTutorial) {
        const [missedLines, wrongLines] = this.checkResult(this.userLines);
        const gameResult: GameResult = this.setResult(currentGame, wrongLines, missedLines);
        this.showResult({ ...gameResult });
        this.playedTutorial = true;
        this.gameState = "init";
      }
      this.isNextRunning = false
      return;
    }

    if (this.playedTutorial && this.game.key != "Examination" && this.roundCounter > 0) {
      const [missed, wrong] = this.validateRound(this.starLines[this.roundCounter - 1], this.userLines[this.roundCounter - 1]);
      if (missed.length != 0 || wrong.length != 0) {
        const gameResult: GameResult = this.setResult(currentGame, [[...wrong]], [[...missed]]);
        this.showResult(gameResult);
        if (this.loggedInUser != null)
          this.saveGameResult(gameResult);
        this.isNextRunning = false
        return;
      }
    }
    const i = this.roundCounter;
    this.linesForControl$.next(this.playedTutorial ? this.starLines[i] : this.tutorialLines[i]);
    if (this.phase == 1) {
      this.setActivePoints(i, this.playedTutorial ? this.starPoints : this.tutorialBoard, this.playedTutorial ? this.starLines[i] : this.tutorialLines[i]);
      this.lines$ = new Observable((observer) => {
        observer.next(this.playedTutorial ? this.starLines[i] : this.tutorialLines[i])
      });
      this.solutionVisible = true;
      await this.visibleTime(currentGame['gameArea'].visibleTime + (400 * this.starLines[i].length));
      this.solutionVisible = false;
      this.starVisible = false;
      await this.visibleTime(currentGame['gameArea'].invisibleTime + 300);
      this.starVisible = true;
    } else {
      this.helpLine$.next(true)
    }
    this.roundCounter++;
    this.isNextRunning = false;
  }

  setActivePoints(i: number, starPoints: StarPoint[], starLines: StarLine[]) {

    for (const point of starPoints) {
      point.active = false;
      const t = starLines.find((line: StarLine) => {
        return line.startPoint == point || line.endPoint == point;
      });
      if (t) {
        point.active = true;
      }
    }
  }

  visibleTime(ms: number) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(true);
      }, ms)
    });
  }

  startTimer(roundTime: number, ms: number = 1000, emit = true) {
    if (ms == 0) {
      this.gameTimer$.next([roundTime, emit]);
      return;
    }
    return new Promise((resolve, reject) => {
      const i = setInterval(() => {
        this.gameTimer$.next([roundTime, emit]);
        roundTime--;
        if (roundTime == -1) {
          clearInterval(i);
          resolve(true);
        }
      }, ms)
    });

  }
  setUserLines(drawnLines: StarLine[]) {
    this.userLines.push(drawnLines);

    if (this.phase == 2 && drawnLines) {
      this.longTermLines.push(drawnLines);

    }
  }

  help() {
    if (!this.helpAvailable)
      return
    this.helpLine$.next(true)
    this.helpAvailable = false;
  }
  showResult(gameResult: GameResult) {
    const dialogRef = this.dialog.open(GameResultComponent, { 'panelClass': 'mat-dialog-container-small', maxHeight: '90vh', 'data': gameResult });

    const diaRef$ = dialogRef.afterClosed().subscribe({
      next: () => {
      }, error: error => {
        console.error(error);
      }, complete: () => { diaRef$.unsubscribe() }
    });
  }

  setResult(currentGame: any, wrongLines: StarLine[][], missedLines: StarLine[][], wrongLinesLong: StarLine[][] = [], missedLinesLong: StarLine[][] = []) {


    const sLines = Array.from(this.playedTutorial ? this.starLines : this.tutorialLines, x => {
      return Object.fromEntries(
        x.map(y => ['value', x]));
    });
    const sUserLines = Array.from(this.userLines, x => {
      return Object.fromEntries(
        x.map(y => ['value', x]));
    });
    const sWLines = Array.from(wrongLines, x => {
      return Object.fromEntries(
        x.map(y => ['value', x]
        ));
    });
    const sMLines = Array.from(missedLines, x => {
      return Object.fromEntries(
        x.map(y => ['value', x]));
    });

    const gameResult: GameResult = {
      gameType: currentGame.key,
      level: this.roundCounter,
      gameAreaSize: this.gameAreaSize,
      datetime: new Date().getTime(),
      boardPoints: this.playedTutorial ? this.starPoints : this.tutorialBoard,
      validLines: (sLines as { value: StarLine[]; }[]),
      shortTermLines: sUserLines as { value: StarLine[]; }[],
      shortTermWrongLines: sWLines as { value: StarLine[]; }[],
      shortTermMissingLines: sMLines as { value: StarLine[]; }[],

    };
    if (this.loggedInUser != null) {
      gameResult.userId = this.loggedInUser!.uid;
    }

    const isLongTerm = currentGame['gameArea'].longTermTime && currentGame['gameArea'].longTermTime > 0;

    if (isLongTerm) {


      const lTermLines = Array.from(this.longTermLines, x => {
        return Object.fromEntries(
          x.map(y => ['value', x]));
      });
      const lWLines = Array.from(wrongLinesLong, x => {
        return Object.fromEntries(
          x.map(y => ['value', x]));
      });
      const lMLines = Array.from(missedLinesLong, x => {
        return Object.fromEntries(
          x.map(y => ['value', x]));
      });

      gameResult.longTermLines = lTermLines as { value: StarLine[]; }[],
        gameResult.longTermWrongLines = lWLines as { value: StarLine[]; }[];
      gameResult.longTermMissingLines = lMLines as { value: StarLine[]; }[];

    }


    //TODO:
    let allShortRoundRatio = 0;
    let allLongRoundsRatio = 0;
    //   const shortRoundCorrectRatios = [];
    //   const shortRoundWrongRatios = [];
    const shortRoundRatios = [];
    //    const longRoundCorrectRatios = [];
    //    const longRoundWrongRatios = [];
    const longRoundRatios = [];
    if (gameResult.gameType != "Examination") {
      gameResult.id = this.gameService.createId();
      return gameResult;
    }
    for (let i = 0; i < gameResult.validLines!.length; i++) {

      const wrongLinesLength = Object.keys(gameResult.shortTermWrongLines![i]).length === 0 ? 0 : gameResult.shortTermWrongLines![i].value.length;
      const correctLinesLength = (Object.keys(gameResult.shortTermLines![i]).length === 0 ? 0 : gameResult.shortTermLines![i].value.length) - wrongLinesLength;

      const shortRoundRatio = (correctLinesLength - wrongLinesLength) / (gameResult.validLines![i].value.length);
      const shortCorrectLinesRatio = correctLinesLength / (gameResult.validLines![i].value.length);
      const shortWrongLinesRatio = wrongLinesLength / (gameResult.validLines![i].value.length);


      shortRoundRatios.push(shortRoundRatio);
      allShortRoundRatio += shortRoundRatio;

      if (isLongTerm) {
        const longWrongLinesLength = Object.keys(gameResult.longTermWrongLines![i]).length === 0 ? 0 : gameResult.longTermWrongLines![i].value.length;
        const longCorrectLinesLength = (Object.keys(gameResult.longTermLines![i]).length === 0 ? 0 : gameResult.longTermLines![i].value.length) - longWrongLinesLength;

        const longRoundRatio = (longCorrectLinesLength - longWrongLinesLength) / gameResult.validLines![i].value.length;
        // const longCorrectLinesRatio = longCorrectLinesLength / this.gameResult.validLines[i].length;
        // const longWrongLinesRatio = longWrongLinesLength / this.gameResult.validLines[i].length;



        longRoundRatios.push(longRoundRatio);
        allLongRoundsRatio += longRoundRatio;

      }

    }

    allShortRoundRatio = allShortRoundRatio / gameResult.validLines!.length;


    gameResult.allShortRoundRatio = allShortRoundRatio;
    gameResult.shortRoundRatios = shortRoundRatios;


    if (isLongTerm) {
      allLongRoundsRatio = allLongRoundsRatio / gameResult.validLines!.length;

      gameResult.allLongRoundRatio = allLongRoundsRatio;
      gameResult.longRoundRatios = longRoundRatios;
    }


    gameResult.id = this.gameService.createId();
    return gameResult;
  }

  saveGameResult(gameResult: GameResult) {

    const gmRes$ = from(this.gameService.create(gameResult, 'GameResults')).pipe(//a gameResult mentése
      switchMap(_ => {//a bestGameResult frissítése

        let gameType = gameResult.gameType as 'Examination' | 'Normal' | 'Hard' | 'Classic';
        let gameMode: {
          levels: { shortTermPoints: number, longTermPoints: number }[],
          shortTermPoints: number,
          longTermPoints: number,
          docRef: DocumentReference<GameResult>
        } | { level: number, docRef: DocumentReference<GameResult> };

        const dcRef = this.gameService.getGameResultReference('GameResults', gameResult.id as string);

        if (gameType == 'Examination') {

          gameMode = {
            levels: [],
            shortTermPoints: gameResult.allShortRoundRatio as number,
            longTermPoints: gameResult.allLongRoundRatio as number,
            docRef: dcRef as DocumentReference<GameResult>
          };
          for (let i = 0; i < gameResult.shortRoundRatios!.length; i++) {
            gameMode.levels.push({
              shortTermPoints: gameResult.shortRoundRatios![i],
              longTermPoints: gameResult.longRoundRatios![i],
            });
          }


        } else {

          gameMode = { level: gameResult.level as number, docRef: dcRef as DocumentReference<GameResult> };

        }



        if (this.bestGameResult !== undefined) {

          this.bestGameResult.datetime = new Date().getTime();
          if (gameType == 'Examination') {
            if ((this.bestGameResult.Examination && this.bestGameResult.Examination.shortTermPoints < (gameMode as BestGameResult['Examination'])!.shortTermPoints) || this.bestGameResult.Examination) {
              this.bestGameResult.Examination = gameMode as BestGameResult['Examination'];
            }
          } else {
            if ((this.bestGameResult[gameType] && this.bestGameResult[gameType]!.level < (gameMode as BestGameResult['Normal' | 'Hard' | 'Classic'])!.level) || !this.bestGameResult[gameType])
              this.bestGameResult[gameType] = gameMode as BestGameResult['Normal' | 'Hard' | 'Classic'];
          }
          return from(this.gameService.update(this.bestGameResult, 'BestGameResults'))

        }
        else {
          this.bestGameResult = {
            id: this.user!.id,
            user: this.gameService.getGameResultReference('Users', this.user!.id) as DocumentReference<User>,
            datetime: new Date().getTime(),
            [gameType]: gameMode,
            isVisible: this.user!.isPublicResults,
          };
          return from(this.gameService.create(this.bestGameResult, 'BestGameResults'))
        }
      }),
      switchMap(_ => firstValueFrom(this.StatisticsService.getById(gameResult.gameType))),
      switchMap(statistic => {
        let gameType = gameResult.gameType as 'Examination' | 'Normal' | 'Hard' | 'Classic';

        if (this.oldBestResult) {
          let needUpdate = false; //ha van oldbestresult kell e statisztikát frissíteni(ha kellett a best resultot akk kell itt is)
          if (gameType == 'Examination') {
            if ((this.oldBestResult.Examination && this.oldBestResult.Examination.shortTermPoints < this.bestGameResult!.Examination!.shortTermPoints) || !this.oldBestResult.Examination) {
              needUpdate = true;
            }
          } else {
            if ((this.oldBestResult[gameType] && this.oldBestResult[gameType]!.level < this.bestGameResult![gameType]!.level) || !this.oldBestResult[gameType])
              needUpdate = true;
          }

          if (!needUpdate) {
            return this.StatisticsService.update(statistic!, gameType);
          }
          if (gameType == "Examination") {
            if (this.oldBestResult.Examination) { //létezik
              for (let i = 0; i < this.bestGameResult!.Examination!.levels.length; i++) {
                statistic!.levels[i].shortTermPoints! -= this.oldBestResult.Examination.levels[i].shortTermPoints;
                statistic!.levels[i].shortTermPoints! += this.bestGameResult!.Examination!.levels[i].shortTermPoints;
                statistic!.levels[i].longTermPoints! -= this.oldBestResult.Examination.levels[i].longTermPoints;
                statistic!.levels[i].longTermPoints = this.bestGameResult!.Examination!.levels[i].longTermPoints;
              }
            } else { // nem létezik
              for (let i = 0; i < this.bestGameResult!.Examination!.levels.length; i++) {
                statistic!.levels[i].count = statistic!.levels[i].count + 1;
                statistic!.levels[i].shortTermPoints! += this.bestGameResult!.Examination!.levels[i].shortTermPoints;
                statistic!.levels[i].longTermPoints! += this.bestGameResult!.Examination!.levels[i].longTermPoints;
              }
            }
          } else {
            if (this.oldBestResult[gameType]) { // létezik
              const oldIndex = (this.oldBestResult[gameType] as BestGameResult['Normal' | 'Hard' | 'Classic'])!.level;

              statistic!.levels[oldIndex - 1].count = statistic!.levels[oldIndex].count - 1;
              if (statistic!.levels[this.bestGameResult![gameType]!.level]) {
                statistic!.levels[this.bestGameResult![gameType]!.level].count = statistic!.levels[this.bestGameResult![gameType]!.level].count + 1;
              } else {
                statistic!.levels[this.bestGameResult![gameType]!.level] = { count: 1 };
                for (let i = 0; i < statistic!.levels.length; i++) {
                  if (!statistic!.levels[i]) {
                    statistic!.levels[i] = { count: 0 };
                  }
                }
              }
            } else { //nem létezik
              if (statistic!.levels[this.bestGameResult![gameType]!.level]) {
                statistic!.levels[this.bestGameResult![gameType]!.level].count = statistic!.levels[this.bestGameResult![gameType]!.level].count + 1;
              } else {
                statistic!.levels[this.bestGameResult![gameType]!.level] = { count: 1 };
                for (let i = 0; i < statistic!.levels.length; i++) {
                  if (!statistic!.levels[i]) {
                    statistic!.levels[i] = { count: 0 };
                  }
                }
              }
            }
          }
        } else { //not existing oldbestres
          if (gameType == "Examination") {
            for (let i = 0; i < this.bestGameResult!.Examination!.levels.length; i++) {
              statistic!.levels[i].count = statistic!.levels[i].count + 1;
              statistic!.levels[i].shortTermPoints! += this.bestGameResult!.Examination!.levels[i].shortTermPoints;
              statistic!.levels[i].longTermPoints! += this.bestGameResult!.Examination!.levels[i].longTermPoints;
            }
          } else {
            if (statistic!.levels[this.bestGameResult![gameType]!.level]) {
              statistic!.levels[this.bestGameResult![gameType]!.level].count = statistic!.levels[this.bestGameResult![gameType]!.level].count + 1;
            } else {
              statistic!.levels[this.bestGameResult![gameType]!.level] = { count: 1 };

              for (let i = 0; i < statistic!.levels.length; i++) {
                if (!statistic!.levels[i]) {
                  statistic!.levels[i] = { count: 0 };
                }
              }
            }

          }
        }
        return this.StatisticsService.update(statistic!, gameType);
      }),
      switchMap(_ => {
        this.user!.bestShortExaminationPoint = gameResult.allShortRoundRatio ?? 0;
        this.user!.bestLongExaminationPoint = gameResult.allLongRoundRatio ?? 0;


        return from(this.userService.update(this.user!))
      }),
      this.toast.observe({
        loading: 'Eredmény mentése...',
        success: 'Sikeres mentés!',
        error: (e) => {
          const err = Errors[e.code] ?? e;

          return 'Sikertelen mentése: ' + err;
        },
      }),
    ).subscribe({
      complete: () => { gmRes$.unsubscribe() }
    });
  }
}
