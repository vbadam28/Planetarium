import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'countdown'
})
export class CountdownPipe implements PipeTransform {

  transform(value: number, max:string="sec"): string {
    //value==sec
     const hour= Math.floor(value/60/60);
     const min= Math.floor(value/60);
     const sec = value-min*60;
    
    const retObj:{[key:string]:string}={
      'sec':value+" Másodperc",
      'min':min+" Perc "+sec+" Másodperc",
      'hour':hour+" Óra "+min+" Perc "+sec+" Másodperc",
    }

    return   retObj[max];
  }

}
