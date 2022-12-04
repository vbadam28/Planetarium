import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Statistics } from '../models/Statistics';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  collectionName = 'Statistics';

  constructor(private afs: AngularFirestore) { }


  getById(id:string) {
    return this.afs.collection<Statistics>(this.collectionName).doc(id).valueChanges();
  }
  getAll() {
    return this.afs.collection<Statistics>(this.collectionName).valueChanges();
  }
  update(statistics:Statistics,type:string) {
    return this.afs.collection<Statistics>(this.collectionName).doc(type).set(statistics);
  }
}
