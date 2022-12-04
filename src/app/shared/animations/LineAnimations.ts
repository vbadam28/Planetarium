import { animate, query, stagger, style, transition, trigger } from "@angular/animations";

export const lineAnimation = trigger('lineAnimation', [
    transition('* <=> *', [
        query(':enter',
            [
                style({ opacity: 0,/* "stroke-dasharray": "0","stroke-dashoffset":"1000"*/ }),
                stagger('400ms',
                    animate('600ms ease-out', style({ opacity: 1,/*"stroke-dashoffset":"0"*/ })))
            ],
            { optional: true }
        ),
        query(':leave',
            animate('300ms', style({ opacity: 0 })),
            { optional: true }
        )
    ])
]);