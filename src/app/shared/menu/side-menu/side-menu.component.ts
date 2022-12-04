import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Roles } from '../../constants/Role';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss']
})
export class SideMenuComponent implements OnInit {

  @Input() loggedInUser?: firebase.default.User | null;
  @Input() actualRole?: Roles;
  @Output() onCloseSidenav: EventEmitter<boolean> = new EventEmitter();
  @Output() onLogout: EventEmitter<boolean> = new EventEmitter();

  roles=Roles;

  constructor() { }
  ngOnInit(): void {
  }


  close(logout?: boolean) {
    this.onCloseSidenav.emit(true);
    if (logout === true) {
      this.onLogout.emit(logout);
    }
  
  }
}
