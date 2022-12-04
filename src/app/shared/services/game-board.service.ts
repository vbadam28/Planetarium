import { Injectable } from '@angular/core';
import { StarPoint } from '../models/StarPoint';
import { StarLine } from '../models/StarLine';

@Injectable({
  providedIn: 'root'
})
export class GameBoardService {
  constructor() { }

  generateLines(round: number, starPoints: StarPoint[], game: any) {

    const pointsInUse = [];
    const lines = [];
    const plus = 2;
    let prevPoint = null;
    for (let i = 0; i < game['gameArea'].lineSize.min + Math.floor(round / plus); i++) {
      const pointList = [...starPoints];
      let randomPoint = Math.floor(Math.random() * (pointList.length));
      const randomPointInUse = Math.floor(Math.random() * (pointsInUse.length));
      if (i == 0) {
        const pointListCopy = [...pointList];
        pointListCopy.splice(randomPoint, 1);
        prevPoint = Math.floor(Math.random() * (pointListCopy.length));
        pointsInUse.push(pointListCopy[prevPoint]);
      }

      let isSame = i != 0;
      while (isSame) {
        let innerSame = false;
        if (pointsInUse[randomPointInUse] == pointList[randomPoint]) {
          pointList.splice(randomPoint, 1);
          randomPoint = Math.floor(Math.random() * (pointList.length));
          continue;
        }
        for (const starL of lines) {
          if (this.doOverlap({ startPoint: pointsInUse[randomPointInUse], endPoint: pointList[randomPoint], active: false, }, starL)) {
            innerSame = true;
            pointList.splice(randomPoint, 1);
            break;
          }
        }
        isSame = innerSame;
        if (innerSame) {
          randomPoint = Math.floor(Math.random() * (pointList.length));
        }

      }
      const starLine: StarLine = {
        startPoint: pointsInUse[randomPointInUse],
        endPoint: pointList[randomPoint],
        active: true,
      };

      lines.push(starLine);

      const t = pointsInUse.indexOf(pointList[randomPoint]);
      if (t == -1) {

        pointsInUse.push(pointList[randomPoint]);

      }

    }

    return lines;
  }

  generateBoard(gameAreaSize: { height: number, width: number }, size: { column: number, row: number }, random: number = 0) {
    const starPoints: StarPoint[] = [];
    const leftoffset = (gameAreaSize.width) / (size.column - 1);
    const topoffset = (gameAreaSize.height) / (size.row - 1);

    for (let i = 0; i < (size.row * size.column); i++) {

      const randomoffsetTop = Math.floor(Math.random() * 10) * random;
      const randomoffsetLeft = Math.floor(Math.random() * 10) * random;
      const randomSignTop = Math.floor(Math.random() * 2) == random ? -1 : 1;
      const randomSignLeft = Math.floor(Math.random() * 2) == random ? -1 : 1;

      const point: StarPoint = {
        row: Math.floor(i / size.column) * topoffset + (randomoffsetTop * randomSignTop),
        column: (i % size.column) * leftoffset + (randomoffsetLeft * randomSignLeft),
        active: false,
        isVisible: false,
        r: 5,
      };
      starPoints.push(point);
    }

    return starPoints;
  }


  //point q rajta van a 'pr' szakaszon
  onSegment(p: StarPoint, q: StarPoint, r: StarPoint, isEqual: boolean = false) {
    if (isEqual) {
      if (q.column < Math.max(p.column, r.column) && q.column > Math.min(p.column, r.column) &&
        q.row < Math.max(p.row, r.row) && q.row > Math.min(p.row, r.row))
        return true;

      if (q.column <= Math.max(p.column, r.column) && q.column >= Math.min(p.column, r.column) &&
        q.row < Math.max(p.row, r.row) && q.row > Math.min(p.row, r.row))
        return true;

      if (q.column < Math.max(p.column, r.column) && q.column > Math.min(p.column, r.column) &&
        q.row <= Math.max(p.row, r.row) && q.row >= Math.min(p.row, r.row))
        return true;


    } else {

      if (q.column <= Math.max(p.column, r.column) && q.column >= Math.min(p.column, r.column) &&
        q.row <= Math.max(p.row, r.row) && q.row >= Math.min(p.row, r.row))
        return true;
    }
    return false;
  }


  //0=kollienáris, 1óramutató -1 ellentétes
  getOrientation(p: StarPoint, q: StarPoint, r: StarPoint) {
    //adott 3 pont egy egyenesre esik / jobbra balra dől a 3.pont 
    const val = (q.row - p.row) * (r.column - q.column) -
      (q.column - p.column) * (r.row - q.row);
    return val;
  }

  // 2 vonal fedi-e egymást
  //line1: az új vonal, line2:a régi vonal
  doOverlap(line1: StarLine, line2: StarLine): boolean {
    const p1 = line1.startPoint;
    const q1 = line1.endPoint!;
    const p2 = line2.startPoint;
    const q2 = line2.endPoint!;

    //szakasz 1-re kollineáris-e a  másik
    const o1 = this.getOrientation(p1, q1, p2);
    const o2 = this.getOrientation(p1, q1, q2);
    //fordítva
    const o3 = this.getOrientation(p2, q2, p1);
    const o4 = this.getOrientation(p2, q2, q1);

    const onSegmentp2 = this.onSegment(p1, p2, q1);
    const onSegmentq2 = this.onSegment(p1, q2, q1);

    // p1, q1 kollineáris p2 és q2 vel   és vagy p2 vagy q2 rajta van a szakaszon 
    if (o1 == 0 && o2 == 0 && (onSegmentp2 || onSegmentq2)) {
      //ha csak az egyik vana szakaszon
      if ((onSegmentp2 && !onSegmentq2) || (!onSegmentp2 && onSegmentq2)) {
        //megnézni hogy egybe esik e valamelyik végpont és hogy ellentétes irányúak-e
        return !(this.isOppositeDir(p1, p2, q1, q2));
      }

      return true;
    }

    const onSegmentp1 = this.onSegment(p2, p1, q2);
    const onSegmentq1 = this.onSegment(p2, q1, q2);
    // p2, q2 kollineáris p1 és q1 vel   és vagy p1 vagy q1 rajta van a szakaszon 
    if (o3 == 0 && o4 == 0 && (onSegmentp1 || onSegmentq1)) {
      if ((onSegmentp1 && !onSegmentq1) || (!onSegmentp1 && onSegmentq1)) {
        return !(this.isOppositeDir(p2, p1, q2, q1));
      }
      return true
    };

    //elletntétes orientációnál szinte biztos metszik,de csak az kell ha a régi vonalegyik végpontja ráesik az új egyenesre
    if (o1 == 0 && this.onSegment(p1, p2, q1, true)) return true;

    // p1, q1, q2 are kollineárisak és q2 a p1q1 szakaszon van
    if (o2 == 0 && this.onSegment(p1, q2, q1, true)) return true;

    // p2, q2, p1 are kollineárisak és p1 a p2q2 szakaszon van
    if (o3 == 0 && this.onSegment(p2, p1, q2, true)) return true;
    
    // p2, q2, q1 are kollineárisak és q1 a p2q2 szakaszon van
    if (o4 == 0 && this.onSegment(p2, q1, q2, true)) return true;


    return false;
  }

  //két vektor ellentétes irányú-e ha van közös végpontjuk
  isOppositeDir(p1: StarPoint, p2: StarPoint, q1: StarPoint, q2: StarPoint) {
    if ((p1.row == p2.row && p1.column == p2.column)) {
      const vec1x = q1.row - p1.row;
      const vec1y = q1.column - p1.column;

      const vec2x = q2.row - p1.row;
      const vec2y = q2.column - p1.column;

      const x = vec1x * vec2x;
      const y = vec1y * vec2y;

      if (x <= 0 && y <= 0) {
        return true;
      }
    } else if (q1.row == p2.row && q1.column == p2.column) {
      const vec1x = p1.row - q1.row;
      const vec1y = p1.column - q1.column;

      const vec2x = q2.row - q1.row;
      const vec2y = q2.column - q1.column;

      const x = vec1x * vec2x;
      const y = vec1y * vec2y;
      if (x <= 0 && y <= 0) {
        return true;
      }
    } else if ((p1.row == q2.row && p1.column == q2.column)) {
      const vec1x = q1.row - p1.row;
      const vec1y = q1.column - p1.column;

      const vec2x = p2.row - p1.row;
      const vec2y = p2.column - p1.column;

      const x = vec1x * vec2x;
      const y = vec1y * vec2y;
      if (x <= 0 && y <= 0) {
        return true;
      }

    } else if (q1.row == q2.row && q1.column == q2.column) {
      const vec1x = p1.row - q1.row;
      const vec1y = p1.column - q1.column;

      const vec2x = p2.row - q1.row;
      const vec2y = p2.column - q1.column;

      const x = vec1x * vec2x;
      const y = vec1y * vec2y;
      if (x <= 0 && y <= 0) {
        return true;
      }
    }
    return false;
  }

}
