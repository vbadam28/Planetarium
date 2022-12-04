import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument, DocumentReference } from '@angular/fire/compat/firestore';
import { BestGameResult } from '../models/BestGameResults';
import { GameResult } from '../models/GameResult';
import { User } from '../models/User';

@Injectable({
  providedIn: 'root'
})
export class GameService {



  collectionName = 'GameResults';

  constructor(private afs: AngularFirestore) { }

  createId() {
    return this.afs.createId();
  }
  create(gameResult: GameResult | BestGameResult, collectionName: 'GameResults' | 'BestGameResults') {

    return this.afs.collection<GameResult | BestGameResult>(collectionName).doc(gameResult.id).set(gameResult);
  }
  getGameResultReference(collection: string, id: string) {
    return this.afs.doc(collection + '/' + id).ref as DocumentReference<GameResult|User>;
  }

  getById(id: string, collectionName: 'GameResults' | 'BestGameResults') {
    return this.afs.collection<GameResult | BestGameResult>(collectionName).doc(id).valueChanges();
  }
  getByUserId(userId: string, collectionName: 'GameResults' | 'BestGameResults') {
    return this.afs.collection<GameResult | BestGameResult>(collectionName, ref => ref.where("userId", '==', userId)).valueChanges();
  }

  getByUserIdnType(userId: string, type: string) {
    return this.afs.collection<GameResult>(this.collectionName, ref => ref.where("userId", '==', userId).where("gameType", '==', type)).valueChanges();
  }

  getByUserIdOrderLimit(userId: string, gameType: string, orderby: string, ordertype: 'asc' | 'desc', limit: number) {
    return this.afs.collection<GameResult>(this.collectionName, ref => ref.where("userId", '==', userId).where("gameType", '==', gameType).orderBy(orderby, ordertype).limit(limit)).valueChanges();
  }


  getBestResByType(orderby:string,ordertype: 'asc'|'desc') {
    return this.afs.collection<BestGameResult>('BestGameResults',ref=>ref.where("isVisible","==",true).orderBy(orderby, ordertype)).valueChanges()
  }

  update(gameResult: GameResult | BestGameResult, collectionName: 'GameResults' | 'BestGameResults') {
    return this.afs.collection<GameResult | BestGameResult>(collectionName).doc(gameResult.id).set(gameResult);
  }
  updateVisibility(visibility:boolean,id:string) {
    return this.afs.collection<BestGameResult>('BestGameResults').doc(id).update({isVisible:visibility});
  }

  delete(id: string) {
    return this.afs.collection<GameResult>(this.collectionName).doc(id).delete();
  }
}
