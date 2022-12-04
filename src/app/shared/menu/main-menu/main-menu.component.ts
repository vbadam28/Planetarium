import {  Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { Location } from '@angular/common';
import { Roles } from '../../constants/Role';
import { GameModesMenu } from '../../constants/GameModes';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss']
})
export class MainMenuComponent implements OnInit {

  @Input() loggedInUser?: firebase.default.User | null;
  @Input() actualRole?: Roles;
  @Input() sidenav?: MatSidenav;
  @Output() onCloseSidenav: EventEmitter<boolean> = new EventEmitter();
  @Output() onLogout: EventEmitter<boolean> = new EventEmitter();
  routerUnsub?:Subscription;

  isVisible:boolean=false;
  role=Roles;
  activeMenu:string="";
  gameModesMenu=GameModesMenu
  constructor(private location:Location,private router:Router) {  }

  ngOnInit(): void {
   this.routerUnsub = this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((evts:any)=>{
      const currentPage = (evts.urlAfterRedirects as string );
     this.activeMenu=currentPage.split("/")[1];
     
      this.isVisible = currentPage.includes('/topic/') || currentPage.includes('/profile');
    });
    

  }


  back(){
    this.location.back();
  }
  logout() {
    this.onLogout.emit(true);
  }
  onToggleSidenav() {
    this.sidenav?.toggle();
    
  }
  ngOnDestroy(): void {
    this.routerUnsub?.unsubscribe();
  }
}
