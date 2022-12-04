import { DocumentReference } from "@angular/fire/compat/firestore";
import { GameResult } from "./GameResult";
import { User } from "./User";

export interface BestGameResult {
    id:string,
    user:DocumentReference<User>,
    datetime:number,
    isVisible:boolean,
    Examination?:{ levels:{shortTermPoints:number,longTermPoints:number}[], shortTermPoints:number,docRef:DocumentReference,longTermPoints:number},
    Normal?:{level:number,docRef:DocumentReference<GameResult>},
    Hard?:{level:number,docRef:DocumentReference<GameResult>},
    Classic?:{level:number,docRef:DocumentReference<GameResult>},
}