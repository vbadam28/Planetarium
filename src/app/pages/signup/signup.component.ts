import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { UserService } from '../../shared/services/user.service';
import { Image } from '../../shared/models/Image';
import { User } from '../../shared/models/User';
import { Router } from '@angular/router';
import { Roles } from '../../shared/constants/Role';
import { from, switchMap } from 'rxjs';
import { HotToastService } from '@ngneat/hot-toast';
import { ImageService } from '../../shared/services/image.service';
import { Errors } from '../../shared/constants/Errors';
@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  userId = "";
  //error = false;
  signUpForm = new FormGroup({
    email: new FormControl('', [Validators.required,Validators.email]),
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required,Validators.minLength(6)]),
    rePassword: new FormControl('', [Validators.required,Validators.minLength(6)]),
    firstname: new FormControl('', [Validators.required]),
    lastname: new FormControl('', [Validators.required]),

  });

  constructor(private toast: HotToastService, private router: Router, private userService: UserService, private location: Location, private authService: AuthService, private imageService:ImageService) { }

  ngOnInit(): void {
  }

  onSubmit() {
    if (this.signUpForm.valid) {
      if (this.signUpForm.value.password === this.signUpForm.value.rePassword) {

        const obs$ = from(this.authService.signup(this.signUpForm.get("email")?.value, this.signUpForm.get("password")?.value)).pipe(
         
         
          this.toast.observe({
            loading: 'Regisztráció...',
            success: 'Sikeres Regisztráció!',
            error: (e) => {
              const err = Errors[e.code]??e;
              return 'Sikertelen Regisztráció: ' + err},
          }),
          //  catchError((error) => of(error))
        ).subscribe(
          {
            next: cred => {
              this.userId = cred.user?.uid as string;
              const user: User = {
                id: this.userId,//cred.user?.uid as string,
                username: this.signUpForm.get('username')?.value,
                email: this.signUpForm.get('email')?.value,
                role: Roles.PATIENT,
                firstname: this.signUpForm.get('firstname')?.value,
                lastname: this.signUpForm.get('lastname')?.value,
                doctorId: "0",
                isPublicResults:true,
              };

              this.userService.create(user).then(_ => {
                console.log('User added successfully');
                const img:Image = {
                  id: this.userId,
                  imageUrl:"images/profile.jpg",
                  name:"profile",
                  lastModified:new Date().getTime(),
                };
                
                return this.imageService.updateImage(img);
              },e => {
                console.error(e);
              }).then(_ => {
                console.log('Image added successfully');
      
                this.router.navigateByUrl('/main');
            
              },error=>{
                console.error(error);
              });

            },
            error: e => { console.error(e); },
            complete: () => { obs$.unsubscribe() }
          }
        );



      } else {
        //this.error = true;
        this.toast.error("A két jelszó nem egyezik meg!")
      }
    }
  }
  goBack() {
    this.location.back();
  }

}
