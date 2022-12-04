import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { resolve } from 'dns';
import { firstValueFrom, Observable, take } from 'rxjs';
import { Roles } from '../constants/Role';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private router:Router,private userService:UserService){ }
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {


    const user = JSON.parse(localStorage.getItem("user") as string);
    if (user) {
      return new Promise<boolean>(async (resolve) => {
         const usr = await firstValueFrom(this.userService.getById(user.uid).pipe(take(1)));

         if(usr){
            if(usr.role===Roles.ADMIN){
              resolve(true);
            }
          }
            resolve(false);
          
        });
    }
    return false;

  }

}
