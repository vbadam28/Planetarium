import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HotToastService } from '@ngneat/hot-toast';
import { catchError, from, of } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(private toast: HotToastService, private router: Router, private authService: AuthService) { }

  form=new FormGroup({
    email : new FormControl('', [Validators.required, Validators.email]),
    password : new FormControl('', [Validators.required]),
   
  });
  
  
  loading: boolean = false;
  ngOnInit(): void {  }

  login() {


    const obs$ = from(this.authService.login(this.form.get('email')?.value, this.form.get('password')?.value)).pipe(
      this.toast.observe({
        loading: 'Bejelentkezés...',
        success: 'Sikeres bejelentkezés!',
        error: (e) => 'Sikertelen bejelentkezés: Helytelen email vagy jelszó!',
      }),
      //  catchError((error) => of(error))
    ).subscribe(
      {
        next: n => {
          this.router.navigateByUrl('/main');
        },
        error: e => { },
        complete: () => { obs$.unsubscribe() }
      }
    );
  }


  /*getError(error: any) {
    switch (error.code) {
      case "auth/user-not-found":
        return "Nem létezika  felhasználó!";
      case "auth/wrong-password":
        return "Helytelen jelsző";
      default:
        return "";
    }
  }*/

}
