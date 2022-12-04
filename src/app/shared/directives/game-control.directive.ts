import { OnInit, OnDestroy, Directive, ElementRef, HostListener, Renderer2, Input, Output, EventEmitter } from '@angular/core';
import { delay, Observable, Subscription, switchMap } from 'rxjs';
import { StarLine } from '../models/StarLine';
import { StarPoint } from '../models/StarPoint';

@Directive({
  selector: '[gameControl]'
})
export class GameControlDirective implements OnInit, OnDestroy {

  @Input() gameControl?: HTMLElement;
  @Input() drawingBoard!: HTMLElement;
  @Input() points!: StarPoint[];
  @Input() gameAreaPadding!: number;
  @Input() gameTimer$?: Observable<[number, boolean]>;
  @Input() helpLine$?: Observable<boolean>;
  @Output() userLines = new EventEmitter<StarLine[]>()

  @Input() lines!: StarLine[];
  parent: any;
  line: any;
  color: any;
  clicked = false;
  drawingLine: any;
  inProgressPoints: StarPoint[] = [];
  drawnLines: StarLine[] = [];
  gameTimerSub$?: Subscription;
  helpLineSub$?: Subscription;

  constructor(private el: ElementRef, private renderer: Renderer2) {

  }

  ngOnInit() {
    this.parent = this.renderer.parentNode(this.el.nativeElement);
    this.drawingLine = this.renderer.createElement('line', 'svg');
    this.setLineAttributes(this.drawingLine, { startPoint: { r: 0, column: 0, row: 0, isVisible: false, active: false }, endPoint: { r: 0, column: 0, row: 0, isVisible: false, active: false }, active: false }, true);

    this.renderer.appendChild(this.drawingBoard, this.drawingLine);
    this.renderer.setAttribute(this.drawingLine, "display", "none");

    this.gameTimerSub$ = this.gameTimer$?.subscribe(([time, emit]) => {
      if (time == 0 && emit) {

        this.userLines.emit(this.drawnLines);
        this.removeAllLines();
        this.removeAllPoints();
        this.drawnLines = [];
      }
    });

    //delay kell a hosszútávú után mert az asnycpipe késöbb kapja meg a change strategy miatt az értéket hiába küldöm elöbb 
    this.helpLine$?.pipe(delay(10)).subscribe(_ => {

      const [missingLines, wrongLines] = this.validateRound(this.lines, this.drawnLines)
      if (missingLines.length < 1)
        return;
      const _line = missingLines[Math.floor(Math.random() * missingLines.length)];

      this.line = this.renderer.createElement('line', 'svg');
      this.setLineAttributes(this.line, _line);

      this.renderer.appendChild(this.drawingBoard, this.line)

      this.drawnLines.push(_line);
      _line.startPoint.isVisible = true;
      _line.endPoint!.isVisible = true;

    })

  }
  ngOnDestroy(): void {
    this.gameTimerSub$?.unsubscribe();
    this.helpLineSub$?.unsubscribe();
  }


  @HostListener('mousemove', ['$event'])
  mouseMove(e: MouseEvent) {

    if (e.target != null && (e.target as HTMLElement).tagName == "svg") {
      const existingCircle = document.getElementsByClassName("hover-closest")[0];
      const closestCircle = this.findClosestCircle(e);
      const existingLine = document.getElementsByClassName("hover-closest-line")[0];

      if (existingCircle && closestCircle != existingCircle) {  
        this.renderer.removeClass(existingCircle, "hover-closest");
        document.body.style.cursor = "default";
      }
      if (closestCircle && closestCircle != existingCircle) {
        this.renderer.addClass(closestCircle, "hover-closest");
        document.body.style.cursor = "pointer";
        if (existingLine)                         
          this.renderer.removeClass(existingLine, "hover-closest-line")
      }
      if (!closestCircle) {
        const closestLine = this.findClosestLine(e); 
        if (existingLine && closestLine != existingLine) {

          this.renderer.removeClass(existingLine, "hover-closest-line");
          document.body.style.cursor = "default";
        }
        if (closestLine && closestLine != existingLine) {
          this.renderer.addClass(closestLine, "hover-closest-line");
          document.body.style.cursor = "pointer";
        }
      }
    }

    if (!this.clicked) return;
    
    let firstPoint = this.inProgressPoints[0];
    if (!firstPoint) {
      firstPoint = { r: 0, column: e.offsetX - this.gameAreaPadding / 2, row: e.offsetY - this.gameAreaPadding / 2, isVisible: false, active: false };
    }
    this.setLineAttributes(this.drawingLine,
      {
        startPoint: firstPoint,
        endPoint: { r: 0, column: e.offsetX - this.gameAreaPadding / 2, row: e.offsetY - this.gameAreaPadding / 2, isVisible: false, active: false }, active: false
      },
      true);

  }

  @HostListener('dblclick', ['$event'])
  onDbClick(e: MouseEvent) {

    if (this.clicked || (e.target as SVGElement).tagName == 'circle') return;

    let closestElement: SVGLineElement | null = null;
    if ((e.target as SVGElement).tagName == 'svg') {
      if (this.findClosestCircle(e)) return;
      closestElement = this.findClosestLine(e);
    }
    let clickedElement = e.target as SVGLineElement;
    if (closestElement != null) {
      clickedElement = closestElement;
    }
    if (!clickedElement || (clickedElement as SVGLineElement).tagName != "line") {
      return;
    }

    const point1Id = parseInt(document.querySelector("[cx='" + clickedElement.getAttribute("x1") + "'][cy='" + clickedElement.getAttribute("y1") + "']")!.id.split("-")[1]);
    const point2Id = parseInt(document.querySelector("[cx='" + clickedElement.getAttribute("x2") + "'][cy='" + clickedElement.getAttribute("y2") + "']")!.id.split("-")[1]);
    const point1: StarPoint = this.points[point1Id];
    const point2: StarPoint = this.points[point2Id];

    const lineIndex = this.drawnLines.findIndex((line: StarLine) => {
      return (point1 == line.startPoint && point2 == line.endPoint) || (point1 == line.endPoint && point2 == line.startPoint)
    });

    this.removeLine(lineIndex);
    this.removePoint(point1, point2);
  }

  @HostListener('click', ['$event'])
   onClick(e: MouseEvent) {
    let closestElement: SVGCircleElement | null = null;
    if ((e.target as SVGElement).tagName != "circle") {
      closestElement = this.findClosestCircle(e);
    }

    let clickedElement = e.target as SVGCircleElement;

    if (closestElement != null) {
      clickedElement = closestElement;
    }

    if (!clickedElement || (clickedElement as SVGElement).tagName != "circle") {
      if (this.clicked) {
        this.removePoint(this.inProgressPoints[0], null);
        this.inProgressPoints = [];
        this.renderer.setAttribute(this.drawingLine, "display", "none");
        this.clicked = !this.clicked;
      }
      return;
    }

    this.clicked = !this.clicked;

    const pointId = parseInt(clickedElement.id.split("-")[1]);
    const point = this.points[pointId];

    this.mouseMove(new MouseEvent("mousemove", e));//már klikken frissítse

    this.inProgressPoints.push(point);
    this.renderer.setAttribute(this.drawingLine, "display", "");
    this.inProgressPoints[0].isVisible = true;

    if (!this.clicked) {
      const point1 = this.inProgressPoints.pop() as StarPoint;
      const point2 = this.inProgressPoints.pop() as StarPoint;


      if (point1.row == point2.row && point1.column == point2.column) {
        this.removePoint(point1, point2, true);

        this.inProgressPoints = [];
        this.renderer.setAttribute(this.drawingLine, "display", "none");

        return;
      }

      const existingStarLineIndex = this.drawnLines.findIndex((line: StarLine) => {
        return (point1 == line.startPoint && point2 == line.endPoint) || (point1 == line.endPoint && point2 == line.startPoint)
      });


      if (existingStarLineIndex != -1) {
        this.removeLine(existingStarLineIndex);
        this.removePoint(point1, point2);
        this.inProgressPoints = [];
        this.renderer.setAttribute(this.drawingLine, "display", "none");

        return;
      }

      const line: StarLine = {
        startPoint: point1,
        endPoint: point2,
        active: false,
      };

      this.drawnLines.push(line);

      this.renderer.setAttribute(this.drawingLine, "display", "none");
      this.line = this.renderer.createElement('line', 'svg');
      this.setLineAttributes(this.line, line);
      this.renderer.appendChild(this.drawingBoard, this.line);
      this.inProgressPoints = [];

      point1.isVisible = true;
      point2.isVisible = true;

    }
  }
  findClosestCircle(e: MouseEvent) {
    const getPoints = document.getElementsByClassName("point") as HTMLCollectionOf<SVGCircleElement>;
    let closestElement: SVGCircleElement | null = null;
    let lowestX = 16;
    let lowestY = 16;

    for (const getPoint of Array.from(getPoints)) {
      const posX = Math.abs(e.offsetX - parseFloat(getPoint.getAttribute("cx")!));
      const posY = Math.abs(e.offsetY - parseFloat(getPoint.getAttribute("cy")!));

      if (posX <= lowestX && posY <= lowestY) {
        lowestX = posX;
        lowestY = posY;
        closestElement = getPoint;

        return closestElement;
      }
    }
    return closestElement;
  }
  findClosestLine(e: MouseEvent) {
    const getLines = document.getElementsByClassName("line") as HTMLCollectionOf<SVGLineElement>;

    let closestElement: SVGLineElement | null = null;
    const width = 10;
    const height = 10;

    for (const getLine of Array.from(getLines)) {
      const posX = parseFloat(getLine.getAttribute("x1")!);
      const posY = parseFloat(getLine.getAttribute("y1")!);
      const posX2 = parseFloat(getLine.getAttribute("x2")!);
      const posY2 = parseFloat(getLine.getAttribute("y2")!);

      const x = e.offsetX;
      const y = e.offsetY;

      let x1 = posX + width;
      let x2 = posX - width;
      let x3 = posX2 - width;
      let x4 = posX2 + width;

      let y1 = posY;
      let y2 = posY;
      let y3 = posY2;
      let y4 = posY2;
      if (posX == posX2) {

      } else if (posY == posY2) {
        x1 -= width;
        x2 += width;
        x3 += width;
        x4 -= width;

        y1 = posY + width;
        y2 = posY - width;
        y3 = posY2 - width;
        y4 = posY2 + width;

      }



      if (this.isInsideRect(x1, y1, x2, y2, x3, y3, x4, y4, x, y)) {
        closestElement = getLine;
      }


    }
    return closestElement;
  }
  removePoint(point1: StarPoint, point2: StarPoint | null, isSelf: boolean = false) {

    const point1Str = point1.column + "-" + point1.row;

    const p1stw = document.querySelectorAll(`*[id^="${point1Str}-"]`);
    const p1ste = document.querySelectorAll(`*[id$="-${point1Str}"]`);
    if ((p1stw.length + p1ste.length < 1 && !isSelf) || (p1stw.length + p1ste.length < 1 && isSelf)) {
      point1.isVisible = false;

    }

    if (!point2) return;
    const point2Str = point2.column + "-" + point2.row;
    const p2stw = document.querySelectorAll(`*[id^="${point2Str}-"]`);
    const p2ste = document.querySelectorAll(`*[id$="-${point2Str}"]`);

    if ((p2stw.length + p2ste.length < 1 && !isSelf) || (p2stw.length + p2ste.length < 1 && isSelf)) {
      point2.isVisible = false;

    }

  }
  setLineAttributes(svgLine: SVGLineElement, line: StarLine, isDrawing: boolean = false) {
    const id = line.startPoint.column + "-" + line.startPoint.row + "-" + line.endPoint!.column + "-" + line.endPoint!.row;
    this.renderer.setAttribute(svgLine, "id", isDrawing ? "invisibleLine" : id);
    this.renderer.addClass(svgLine, isDrawing ? "invisibleLine" : 'line');
    this.renderer.setAttribute(svgLine, "stroke", isDrawing ? "gray" : "#f3f3f5");
    this.renderer.setAttribute(svgLine, "x1", (line.startPoint.column + this.gameAreaPadding / 2).toString());
    this.renderer.setAttribute(svgLine, "y1", (line.startPoint.row + this.gameAreaPadding / 2).toString());
    this.renderer.setAttribute(svgLine, "x2", (line.endPoint!.column + this.gameAreaPadding / 2).toString());
    this.renderer.setAttribute(svgLine, "y2", (line.endPoint!.row + this.gameAreaPadding / 2).toString());
    this.renderer.setAttribute(svgLine, "stroke-width", "2");
    this.renderer.setAttribute(svgLine, "style", "pointer-events: none;");
  }

  removeLine(existingStarLineIndex: number) {
    const foundLine = this.drawnLines[existingStarLineIndex];
    const stString = foundLine.startPoint.column + "-" + foundLine.startPoint.row;
    const endString = foundLine.endPoint!.column + "-" + foundLine.endPoint!.row;



    let liveLine = document.getElementById(stString + "-" + endString);
    if (liveLine === null) {
      liveLine = document.getElementById(endString + "-" + stString);
    }


    this.renderer.removeChild(this.drawingBoard, liveLine);
    this.drawnLines.splice(existingStarLineIndex, 1);

  }

  removeAllLines() {
    for (const el of Array.from(this.drawingBoard.children)) {
      if (el.classList.contains("invisibleLine"))
        continue;
      this.renderer.removeChild(this.drawingBoard, el);
    }
    this.drawnLines = [];

  }
  removeAllPoints() {
    for (const point of this.points) {
      point.isVisible = false;
    }
  }

  //3szög területe koord rendszerben ()
  triangleArea(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
    return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2.0);
  }

  //ha benne van a 3szögben a keresett pont akkor ha a 3 pontjával vett területének összege megegyezik a 3szög területével 
  //ez itt négyzetre nézzük (4ponttal vett terület összege=4zet területe )
  isInsideRect(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, x: number, y: number) {
    const A = this.triangleArea(x1, y1, x2, y2, x3, y3) + this.triangleArea(x1, y1, x4, y4, x3, y3);
    const A1 = this.triangleArea(x, y, x1, y1, x2, y2);
    const A2 = this.triangleArea(x, y, x2, y2, x3, y3);
    const A3 = this.triangleArea(x, y, x3, y3, x4, y4);
    const A4 = this.triangleArea(x, y, x1, y1, x4, y4);
    return (A == A1 + A2 + A3 + A4);

  }

  validateRound(validLines: StarLine[], userCheckedLines: StarLine[]) {
    const missedLines = [];
    const _userCheckedLines = [...userCheckedLines];
    for (const validLine of validLines) {
      const foundLine = _userCheckedLines.findIndex((line: StarLine) => {
        return ((line.startPoint == validLine.startPoint && line.endPoint == validLine.endPoint) || (line.startPoint == validLine.endPoint && line.endPoint == validLine.startPoint));
      })

      if (foundLine != -1) {
        //splice mert annál kevesebbet kell iterálni minden körben
        _userCheckedLines.splice(foundLine, 1);
      } else {
        //meg nem talált vonalak
        missedLines.push(validLine);
      }

    }
    return [missedLines, _userCheckedLines];
  }

}
