import { GameArea } from "./GameArea";
import { StarPoint } from "./StarPoint";
import { StarLine } from "./StarLine";

export interface GameResult {

    id?: string,
    userId?: string,

    gameType: string,
    datetime?: number,
    boardPoints?: StarPoint[],
    gameAreaSize:{height:number,width:number},
//firebaseben nem lehet arrayben array (type[][])

    validLines?: {value:StarLine[]}[],
    shortTermLines?: {value:StarLine[]}[],
    longTermLines?: {value:StarLine[]}[],

    shortTermWrongLines?: {value:StarLine[]}[],
    shortTermMissingLines?: {value:StarLine[]}[],
    longTermWrongLines?: {value:StarLine[]}[],
    longTermMissingLines?: {value:StarLine[]}[],
    point?: number,
    percentage?: number,
    level?:number,
    
    shortRoundRatios?: number[], //legfontosabb számolt érték
    allShortRoundRatio?: number, //legfontosabb számolt érték

    allLongRoundRatio?: number, //legfontosabb számolt érték
    longRoundRatios?: number[],//legfontosabb számolt érték
}