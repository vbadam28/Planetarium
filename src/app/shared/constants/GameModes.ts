import { GameArea } from "../models/GameArea";

export const GameModesMenu: { [key: string]: string }[] = [
    { key: 'Examination', text: 'Vizsgálat' },
    { key: 'Normal', text: 'Normál'},//'#cb4335'},
    { key: 'Hard', text: 'Nehéz',},//'#ffcd56' },
    //{ key: 'Classic', text: 'Klasszikus' },
];

export const GameModes: { [key: string]: { [key: string]: string | GameArea } } = {
    'Examination': {
        index: '0', key: 'Examination', text: 'Vizsgálat',
        gameArea: { 
            boardSize: { row: 6, column: 7 }, 
            lineSize: { min: 4, max: 6 }, 
            visibleTime: 3000,
            invisibleTime: 3000, 
            roundTime: 0,
            rounds: 6, 
            longTermTime: 600,
            random:0 
        }
    },
    'Normal': {
        index: '1', key: 'Normal', text: 'Normál',
        gameArea: { 
            boardSize: { row: 5, column: 5 }, 
            lineSize: { min: 3, max: 5 }, 
            visibleTime: 3000, 
            invisibleTime: 3000, 
            roundTime: 6, 
            rounds: 20,
            random:0 
        }
    },
    'Hard': {
        index: '2', key: 'Hard', text: 'Nehéz',
        gameArea: { 
            boardSize: { row: 6, column: 6 }, 
            lineSize: { min: 3, max: 5 }, 
            visibleTime: 3000, 
            invisibleTime: 3000, 
            roundTime: 6, 
            rounds: 20 ,
            random:1
        }
    },
    'Classic': {
        index: '3', key: 'Classic', text: 'Klasszikus',
        gameArea: { boardSize: { row: 4, column: 5 }, lineSize: { min: 3, max: 5 }, visibleTime: 3000, invisibleTime: 3000, roundTime: 6, rounds: 20,random:0 }
    },
    'Tutorial': {
        index: '4', key: 'Tutorial', text: 'Bemutató pálya',
        gameArea: { 
            boardSize: { row: 3, column: 3 }, 
            lineSize: { min: 3, max: 3 }, 
            visibleTime: 3000, 
            invisibleTime: 3000, 
            roundTime: 0, 
            rounds: 1,
            random:0 
        }
    },
};


