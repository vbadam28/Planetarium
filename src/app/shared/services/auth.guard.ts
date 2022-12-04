import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, Observable, take } from 'rxjs';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private userService: UserService, private router: Router) { }
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    const forLogin = route.data['loggedIn'];
      

    const user = JSON.parse(localStorage.getItem("user") as string);
    
    if (user) {
      return new Promise<boolean>(async (resolve) => {
        const usr = await firstValueFrom(this.userService.getById(user.uid));
        if (usr) {
            resolve(forLogin?true:this.router.navigate(['/main']));
          
        }else{
          resolve(forLogin?this.router.navigate(['/login']):true);
    }
  });
    }
      return forLogin?this.router.navigate(['/login']):true ;
    
  }

}
