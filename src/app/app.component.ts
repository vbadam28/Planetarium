import { Component, OnInit } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Roles } from './shared/constants/Role';
import { User } from './shared/models/User';
import { AuthService } from './shared/services/auth.service';
import { UserService } from './shared/services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'planetarium';
  loggedInUser?: firebase.default.User | null;
  actualUser$?:Observable<User | undefined>;
  routes:Array<string> = [];
  isOpened=false;
  role:Roles=Roles.PATIENT;
  constructor(private userService:UserService ,private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
    this.routes = this.router.config.map(conf => conf.path) as string[];


    this.authService.isUserLoggedIn().subscribe({next:user => {
      this.loggedInUser = user;
      localStorage.setItem('user', JSON.stringify(this.loggedInUser));
      this.actualUser$=this.userService.getById(this.loggedInUser?.uid as string);


    }, error:error => {
      console.error(error);
      localStorage.setItem('user', JSON.stringify('null'));
      this.role=Roles.PATIENT;
    }});


  }


  onToggleSidenav(event: any, sidenav: MatSidenav) {
    if (event === true) {
      sidenav.close();
      this.isOpened=false;
    }else{
      sidenav.open();
      this.isOpened=true;
    }
  }

  logout(_?: boolean) {
    this.authService.logout().then(() => {
      console.log('Logged out succesfully');
    }).catch(error => {
      console.error(error);
    });
  }
}
