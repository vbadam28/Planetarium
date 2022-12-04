import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameGuard } from 'src/app/shared/services/game.guard';
import { BoardComponent } from './board/board.component';
import { GameComponent } from './game.component';

const routes: Routes = [ 
   { path: '', component: GameComponent },
   { path: ':type', component: BoardComponent, canActivate:[GameGuard]},
  ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GameRoutingModule { }
