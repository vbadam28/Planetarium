import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddPatientComponent } from './add-patient/add-patient.component';
import { ListPatientComponent } from './list-patient/list-patient.component';
import { PatientsComponent } from './patients.component';

const routes: Routes = [
  { path: '', component: PatientsComponent },
  { path: 'add-patient', component: AddPatientComponent },
  { path: 'list-patient', component: ListPatientComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PatientsRoutingModule { }
