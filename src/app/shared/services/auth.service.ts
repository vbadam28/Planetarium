import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth'
import firebase from 'firebase/compat/app';
import { AngularFirestore } from '@angular/fire/compat/firestore'

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private testr:string="";

  constructor(private auth: AngularFireAuth) { }

  login(email: string, password: string) {
    return this.auth.signInWithEmailAndPassword(email, password);
  }

  signup(email: string, password: string) {
    return this.auth.createUserWithEmailAndPassword(email, password);
  }

  isUserLoggedIn() {
    return this.auth.user;
  }

  reauth(fbUser: firebase.User, currentEmail: string, currentPassword: string) {
    let cred = firebase.auth.EmailAuthProvider.credential(currentEmail, currentPassword);

    return fbUser?.reauthenticateWithCredential(cred);
  }
  getCurrentUser() {
    return this.auth.currentUser;
  }
  changePassword(fbUser: firebase.User, newPassword: string) {
    return fbUser.updatePassword(newPassword);
  }


  changeEmail(fbUser: firebase.User, newEmail: string) {
    return fbUser.updateEmail(newEmail);
  }

 
  logout(){
      return this.auth.signOut();
  }
}
