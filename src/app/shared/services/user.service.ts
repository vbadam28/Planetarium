import { Injectable } from '@angular/core';
import { User } from '../models/User';
import { AngularFirestore } from '@angular/fire/compat/firestore'
import { Roles } from '../constants/Role';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  collectionName = 'Users';

  constructor(private afs: AngularFirestore) { }

  create(user:User) {
    return this.afs.collection<User>(this.collectionName).doc(user.id).set(user);
  }

  getAll() {
    return this.afs.collection<User>(this.collectionName).valueChanges();
  }
  getById(id:string){
    return this.afs.collection<User>(this.collectionName).doc(id).valueChanges();
  }

  getUserWhereDoctorId(doctorId:string){
    return this.afs.collection<User>(this.collectionName,ref=> ref.where("doctorId",'==',doctorId)).valueChanges();
  }
  getPatientsWithoutDoctors(){
    return this.afs.collection<User>(this.collectionName,ref=> ref.where("doctorId",'==',"0").where('role','==',Roles.PATIENT)).valueChanges();
  }
  update(user:User){
    return this.afs.collection<User>(this.collectionName).doc(user.id).set(user);
  }

  delete(id:string){
    return this.afs.collection<User>(this.collectionName).doc(id).delete();
  }
}
