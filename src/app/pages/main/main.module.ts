import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainRoutingModule } from './main-routing.module';
import { MatCardModule } from '@angular/material/card';
import { MainComponent } from './main.component';


@NgModule({
  declarations: [MainComponent],
  imports: [
    CommonModule,
    MainRoutingModule,
    MatCardModule
  ],
})
export class MainModule { }
