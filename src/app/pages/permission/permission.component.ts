import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { catchError, from, Observable, of, Subscription } from 'rxjs';
import { Roles } from '../../shared/constants/Role';
import { UserService } from '../../shared/services/user.service';
import { User } from '../../shared/models/User';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { HotToastService } from '@ngneat/hot-toast';

@Component({
  selector: 'app-permission',
  templateUrl: './permission.component.html',
  styleUrls: ['./permission.component.scss']
})
export class PermissionComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['lastname', 'firstname', 'email', 'role'];
  dataSource: MatTableDataSource<User> = new MatTableDataSource();
  usersSub$?: Subscription;
  loggedInUser?:firebase.default.User | null;
  roles = [
    { key: Roles.ADMIN, value: "Admin" },
    { key: Roles.DOCTOR, value: "Orvos" },
    { key: Roles.PATIENT, value: "Páciens" }
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(private toast:HotToastService,private userService: UserService) { }

  ngOnInit(): void {
    this.loggedInUser = JSON.parse(localStorage.getItem("user") as string) as firebase.default.User;
    this.usersSub$ = this.userService.getAll().subscribe(users => {
      this.dataSource.data = users.filter((usr)=>{return usr.id!=this.loggedInUser?.uid});
    });

  }
  showToast() {
    this.toast.show('Hello World!');
    this.toast.loading('Lazyyy...');
    this.toast.success('Yeah!!');
    this.toast.warning('Boo!');
    this.toast.error('Oh no!');
    this.toast.info('Something...');
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

  ngOnDestroy(): void {
    this.usersSub$?.unsubscribe();
  }

  saveRole(event:MatSelectChange,user:User){
    const tmpRole=user.role;
    user.role=event.value;
    
    const obs = from(this.userService.update(user)).pipe(
      this.toast.observe({
        loading: 'Mentés...',
        success: 'Sikeres mentés!',
        error: (e)=>'Sikertelen mentés: '+ e,
      }),
      //catchError((error)=>of(error))
    ).subscribe(
      {
        error:e=>{user.role=tmpRole;},
        complete:()=>{obs.unsubscribe()}
       }
      );

  }
}


