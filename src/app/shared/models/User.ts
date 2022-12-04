import { Roles } from "../constants/Role";

export interface User{
    id:string;
    username:string;
    firstname:string,
    lastname:string,
    email:string;
    role:Roles;    
    doctorId:string;
    bestShortExaminationPoint?:number;
    bestLongExaminationPoint?:number;
    isPublicResults:boolean
}