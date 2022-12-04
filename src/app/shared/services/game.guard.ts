import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { GameModes } from '../constants/GameModes';

@Injectable({
  providedIn: 'root'
})
export class GameGuard implements CanActivate {
  constructor( private router: Router){}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      let final=false;
      if(GameModes[route.params['type']]){
        final=true;
      }
      if(final){
        return true;
      }
      
      return this.router.navigate(['/game']);
  }
  
}
