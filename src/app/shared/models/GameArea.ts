export interface GameArea{
    boardSize:{row:number,column:number},
    lineSize:{min:number,max:number},
    visibleTime?:number
    invisibleTime?:number
    roundTime?:number,
    rounds?:number,
    longTermTime?:number,
    random?:number,
}