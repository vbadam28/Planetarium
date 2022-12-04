import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage,AngularFireUploadTask } from '@angular/fire/compat/storage'
import { Image } from '../models/Image'

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  collectionName='Images';
  constructor(private afs:AngularFirestore,private storage:AngularFireStorage,) { }

  
/*Képfelöltés menete
    uploadImage() --bucket (pic name == image.id)
    updateImage() --collection (name or url change if url ext diff)
*/

  get(id:string){
    return this.afs.collection<Image>(this.collectionName).doc(id).valueChanges();
  }

  loadImage(url:string){
    return this.storage.ref(url).getDownloadURL();
  }

  updateImage(image:Image){
    return this.afs.collection<Image>(this.collectionName).doc(image.id).set(image);
  }

  uploadImage(img:File){
    //TODO:
    //path === images/

    const ref = this.storage.ref('/images/'+img.name);
    const storageTask:AngularFireUploadTask = ref.put(img) ;
    return storageTask;
   // const storageRef = ref(this.storage,path);
//    const storageTask = from(uploadBytes(storageRef,img));
//    return storageTask.
    //return this.storage.upload('images',data);
  }


}
