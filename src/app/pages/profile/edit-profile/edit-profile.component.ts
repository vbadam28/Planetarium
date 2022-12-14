import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthService } from '../../../shared/services/auth.service';
import { UserService } from '../../../shared/services/user.service';
import { User } from '../../../shared/models/User';
import { HotToastService } from '@ngneat/hot-toast';
import { empty, firstValueFrom, from, of, switchMap } from 'rxjs';
import { Errors } from '../../../shared/constants/Errors';
import { GameService } from '../../../shared/services/game.service';
import { throws } from 'assert';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss']
})
export class EditProfileComponent implements OnInit {


  form: FormGroup = new FormGroup({});
  type!: string;
  isPublicResults!: boolean;
  loggedInUser!: firebase.default.User;
  user!: User;
  constructor(private toast: HotToastService, private userService: UserService, private gameService: GameService, private authService: AuthService, public dialogRef: MatDialogRef<EditProfileComponent>, @Inject(MAT_DIALOG_DATA) data: { type: string, isPublicResults: boolean }) {
    this.type = data.type;
    this.isPublicResults = data.isPublicResults;
  }

  async ngOnInit() {
    this.form = this.createForm(this.type);
    this.loggedInUser = JSON.parse(localStorage.getItem('user') as string) as firebase.default.User;

    this.user = await firstValueFrom(this.userService.getById(this.loggedInUser.uid)) as User/*.subscribe(usr => {
      this.user = usr as User;
    });*/

    this.loggedInUser = await this.authService.getCurrentUser() as firebase.default.User/*.then(usr => {
      this.loggedInUser= usr as firebase.default.User;
    });*/

    if (this.type == "isPublicResults") {
      this.check();
    }
    if(this.type=="fullname"){
      this.form.get("firstname")?.setValue(this.user.firstname);
      this.form.get("lastname")?.setValue(this.user.lastname);
    }

  }

  createForm(type: string) {
    switch (type) {
      case 'username':
        return new FormGroup({
          username: new FormControl('', Validators.required),
        });
      case 'fullname':
        return new FormGroup({
          firstname: new FormControl('', Validators.required),
          lastname: new FormControl('', Validators.required),
        });
      case 'email':
        return new FormGroup({
          email: new FormControl('', [Validators.required, Validators.email]),
          oldPasswordConfirm: new FormControl('', Validators.required),
        });
      case 'password':
        return new FormGroup({
          newPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
          newPasswordConfirm: new FormControl('', [Validators.required, Validators.minLength(6)]),
          oldPasswordConfirm: new FormControl('', Validators.required),
        });
      default:
        return new FormGroup({});
    }
  }


  check() {
    if (this.type == 'isPublicResults') {
      this.user.isPublicResults = this.isPublicResults;
      const pubResMod$ = from(this.userService.update(this.user))
        .pipe(
          switchMap(async _ => {
            if (await firstValueFrom(this.gameService.getByUserId(this.user.id, "BestGameResults")))
              return from(this.gameService.updateVisibility(this.isPublicResults, this.user.id));
            else
              return of(true);
          }),
          this.toast.observe({
            loading: 'Eredm??nyek megjelen??t??s??nek m??dos??t??sa...',
            success: 'Sikeres m??dos??t??s!',
            error: (e) => {
              const err = Errors[e.code] ?? e;
              return 'Sikertelen m??dos??t??s: ' + err;
            },
          }),
        ).subscribe({
          complete: () => { pubResMod$.unsubscribe() }
        });;
    }
    else if (this.type === 'email') {
      const emailMod$ = from(this.authService.reauth(this.loggedInUser, this.loggedInUser.email as string, this.form.get('oldPasswordConfirm')?.value))
        .pipe(
          switchMap(_ => this.authService.changeEmail(this.loggedInUser, this.form.get('email')?.value)),
          switchMap(_ => {
            this.user.email = this.form.get('email')?.value;
            return this.userService.update(this.user);
          }),
          this.toast.observe({
            loading: 'Email m??dos??t??sa...',
            success: 'Sikeres email m??dos??t??s!',
            error: (e) => {
              const err = Errors[e.code] ?? e;

              return 'Sikertelen email m??dos??t??s: ' + err;
            },
          }),
          //catchError(e=>{alert(e); return of(e)}),
        ).subscribe({
          complete: () => { emailMod$.unsubscribe() }
        });
    }
    else if (this.type === 'password') {
      if (this.form.get('newPassword')?.value !== this.form.get('newPasswordConfirm')?.value) {
        this.toast.error("A k??t jelsz?? nem egyezik meg!")
        return;
      }
      const pwdMod$ = from(this.authService.reauth(this.loggedInUser, this.loggedInUser.email as string, this.form.get('oldPasswordConfirm')?.value))
        .pipe(
          switchMap(_ => this.authService.changePassword(this.loggedInUser, this.form.get('newPassword')?.value)),
          this.toast.observe({
            loading: 'Jelsz?? m??dos??t??sa...',
            success: 'Sikeres jelsz?? m??dos??t??s!',
            error: (e) => {
              console.log(e);
              const err = Errors[e.code] ?? e;

              return 'Sikertelen jelsz?? m??dos??t??s: ' + err;
            },
          }),
        ).subscribe({
          complete: () => { pwdMod$.unsubscribe() }
        });


    } else if (this.type === 'username') {

      this.user.username = this.form.get('username')?.value;
      const uNameMod$ = from(this.userService.update(this.user))
        .pipe(
          this.toast.observe({
            loading: 'Felhaszn??l??n??v m??dos??t??sa...',
            success: 'Sikeres felhaszn??l??n??v m??dos??t??s!',
            error: (e) => {
              const err = Errors[e.code] ?? e;
              return 'Sikertelen felhaszn??l??n??v m??dos??t??s: ' + err;
            },
          }),
        ).subscribe({
          complete: () => { uNameMod$.unsubscribe() }
        });;


    }else if(this.type=="fullname"){
      this.user.firstname = this.form.get('firstname')?.value;
      this.user.lastname = this.form.get('lastname')?.value;
      const uNameMod$ = from(this.userService.update(this.user))
        .pipe(
          this.toast.observe({
            loading: 'N??v m??dos??t??sa...',
            success: 'Sikeres n??v m??dos??t??s!',
            error: (e) => {
              const err = Errors[e.code] ?? e;
              return 'Sikertelen n??v m??dos??t??s: ' + err;
            },
          }),
        ).subscribe({
          complete: () => { uNameMod$.unsubscribe() }
        });;
    }


    this.dialogRef.close(this.form.value);

  }
}