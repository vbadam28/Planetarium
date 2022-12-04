import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { HotToastService } from '@ngneat/hot-toast';
import { catchError, from, of, Subscription } from 'rxjs';
import { User } from '../../../shared/models/User';
import { UserService } from '../../../shared/services/user.service';

@Component({
  selector: 'app-add-patient',
  templateUrl: './add-patient.component.html',
  styleUrls: ['./add-patient.component.scss']
})
export class AddPatientComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['lastname', 'firstname', 'email', 'bestShortPoint','bestLongPoint', 'add'];
  dataSource: MatTableDataSource<User> = new MatTableDataSource();
  usersSub$?: Subscription;
  loggedInUser?: firebase.default.User | null;


  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(private toast: HotToastService, private userService: UserService) { }

  ngOnInit(): void {
    this.loggedInUser = JSON.parse(localStorage.getItem("user") as string) as firebase.default.User;
    this.usersSub$ = this.userService.getPatientsWithoutDoctors().subscribe(users => {
      this.dataSource.data = users;
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


  addPatient(user: User) {
    user.doctorId = this.loggedInUser?.uid as string;

    const obs = from(this.userService.update(user)).pipe(
      this.toast.observe({
        loading: 'Hozzáadás...',
        success: 'Sikeres hozzáadás!',
        error: (e) => 'Sikertelen hozzáadás: ' + e,
      }),
      //catchError((error) => of(error))
    ).subscribe(
      {
        error: e => { user.doctorId = "0"; },
        complete: () => { obs.unsubscribe() }
      }
    );
  }

  ngOnDestroy(): void {
    this.usersSub$?.unsubscribe();
  }

}
