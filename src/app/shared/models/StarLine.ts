import { StarPoint } from "./StarPoint";

export interface StarLine{
    startPoint:StarPoint,
    endPoint:StarPoint|null,
    active:boolean,
    color?:string,
    
}