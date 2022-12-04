import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from './shared/services/admin.guard';
import { AuthGuard } from './shared/services/auth.guard';
import { DoctorGuard } from './shared/services/doctor.guard';

const routes: Routes = [
  {
    path:'main',
    loadChildren: () => import('./pages/main/main.module').then(m => m.MainModule)
  },  
  {
    path:'game',
    loadChildren: () => import('./pages/game/game.module').then(m => m.GameModule)
  },  
  {
    path:'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginModule),
    canActivate:[AuthGuard],
    data:{loggedIn:false}
  },
  {
    path:'signup',
    loadChildren: () => import('./pages/signup/signup.module').then(m => m.SignupModule),
    canActivate:[AuthGuard],
    data:{loggedIn:false}
  },
  {
    path:'profile',
    loadChildren: () => import('./pages/profile/profile.module').then(m => m.ProfileModule),
    canActivate:[AuthGuard],
    data:{loggedIn:true}

  },
  {
    path:'permission',
    loadChildren: () => import('./pages/permission/permission.module').then(m => m.PermissionModule),
    canActivate:[AdminGuard]
  },
  {
    path:'patients',
    loadChildren: () => import('./pages/patients/patients.module').then(m => m.PatientsModule),
    canActivate:[DoctorGuard],
   /* children:[
      {
        path:"add-patient-list",
        component:AddPatientListComponent,
      }
    ]*/
  },
  {
    path:'leaderboard',
    loadChildren: () => import('./pages/leaderboard/leaderboard.module').then(m => m.LeaderboardModule),
    canActivate:[AuthGuard],
    data:{loggedIn:true}
  },
    {
    path:'not-found',
    loadChildren: () => import('./pages/not-found/not-found.module').then(m => m.NotFoundModule)
  },
  {
    path:'',
    redirectTo:'/login',
    pathMatch:'full'
  },{
    path:'**',
    redirectTo:'/not-found'
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
