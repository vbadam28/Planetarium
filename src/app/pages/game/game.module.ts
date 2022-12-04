import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GameRoutingModule } from './game-routing.module';
import { GameComponent } from './game.component';
import { BoardComponent } from './board/board.component';
import { GameControlDirective } from '../../shared/directives/game-control.directive';
import { GameMenuComponent } from './game-menu/game-menu.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { CountdownPipe } from 'src/app/shared/pipes/countdown.pipe';
import { GameResultComponent } from './game-result/game-result.component';
import { MatDialogModule } from '@angular/material/dialog';
import { GameReplayComponent } from './game-replay/game-replay.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';


@NgModule({
  declarations: [
    GameComponent,
    BoardComponent,
    GameControlDirective,
    GameMenuComponent,
    CountdownPipe,
    GameResultComponent,
    GameReplayComponent
    
  ],
  imports: [
    CommonModule,
    GameRoutingModule,
    MatGridListModule,
    MatCardModule,
    MatRippleModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule

    
  ]
})
export class GameModule { }
