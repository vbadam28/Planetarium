import { Component, OnInit } from '@angular/core';
import { GameModes, GameModesMenu} from '../../../shared/constants/GameModes';

@Component({
  selector: 'app-game-menu',
  templateUrl: './game-menu.component.html',
  styleUrls: ['./game-menu.component.scss']
})
export class GameMenuComponent implements OnInit {


  gameModes=GameModesMenu;
  constructor() { }

  ngOnInit(): void {

  }

}
