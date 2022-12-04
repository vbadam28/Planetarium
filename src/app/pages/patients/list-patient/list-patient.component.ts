import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { HotToastService } from '@ngneat/hot-toast';
import { catchError, from, of, Subscription,firstValueFrom } from 'rxjs';
import { BestGameResult } from 'src/app/shared/models/BestGameResults';
import { GameResult } from 'src/app/shared/models/GameResult';
import { User } from 'src/app/shared/models/User';
import { GameService } from 'src/app/shared/services/game.service';
import { UserService } from 'src/app/shared/services/user.service';
import { GameReplayComponent } from '../../game/game-replay/game-replay.component';

@Component({
  selector: 'app-list-patient',
  templateUrl: './list-patient.component.html',
  styleUrls: ['./list-patient.component.scss']
})
export class ListPatientComponent implements OnInit, OnDestroy, AfterViewInit {

  displayedColumns: string[] = ['lastname', 'firstname', 'email', 'bestShortPoint', 'bestLongPoint', 'replay', 'remove'];
  dataSource: MatTableDataSource<User> = new MatTableDataSource();
  usersSub$?: Subscription;
  loggedInUser?: firebase.default.User | null;


  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(private toast: HotToastService, private userService: UserService,private gameService:GameService,private dialog:MatDialog) { }

  ngOnInit(): void {
    this.loggedInUser = JSON.parse(localStorage.getItem("user") as string) as firebase.default.User;
    this.usersSub$ = this.userService.getUserWhereDoctorId(this.loggedInUser.uid).subscribe(users => {
      this.dataSource.data = users;
      
     // for(const user of users){
      //  this.gameService.getById(user.id,"BestGameResults")
        //firstValueFrom(this.gameService.getById(user.id,"BestGameResults")/*this.gameService.getByUserIdOrderLimit(user.id,'Examination','datetime','desc',1)*/).then(gameResults=>{
        //  user.bestShortExaminationPoint=(gameResults as BestGameResult).Examination?.shortTermPoints;
        //  user.bestLongExaminationPoint=(gameResults as BestGameResult).Examination?.longTermPoints;
        //})

      //}

    });
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  removePatient(user: User) {

    user.doctorId = "0";
    const obs$ = from(this.userService.update(user)).pipe(
      this.toast.observe({
        loading: 'Eltávolítás...',
        success: 'Sikeres eltávolítás!',
        error: (e) => 'Sikertelen eltávolítás: ' + e,
      }),
      //   catchError((error)=>of(error))
    ).subscribe(
      {
        error: e => { user.doctorId = this.loggedInUser?.uid as string; },
        complete: () => { obs$.unsubscribe() }
      }
    );
  }

  replayGame(user: User) {
    //nincs mit visszajátszani
    if(!user.bestShortExaminationPoint && !user.bestLongExaminationPoint){
      return;
    }
    const dialogRef = this.dialog.open(GameReplayComponent, { 'panelClass': 'mat-dialog-container-small',   maxHeight: '90vh','data': user });

    const diaRef$ = dialogRef.afterClosed().subscribe({
      next: () => {
      }, error: error => {
      }, complete: () => { diaRef$.unsubscribe() }
    });

  }

  ngOnDestroy(): void {
    this.usersSub$?.unsubscribe();
  }
}
