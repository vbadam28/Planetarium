import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'datetimeFormat'
})
export class DatetimeFormatPipe implements PipeTransform {

  transform(value: number, ...args: unknown[]): unknown {
    let tzoffset = (new Date(value)).getTimezoneOffset() * 6000;
    let minOffset = new Date(value).getTime() - tzoffset;
    let localISOTime = (new Date(minOffset)).toISOString().replace('Z','').replace('T',' ');
    let splitDate=localISOTime.split(" ");
    return splitDate[0]+" "+splitDate[1].split(".")[0];
  }

}
