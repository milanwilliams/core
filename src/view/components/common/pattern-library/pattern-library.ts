import {Component, ViewEncapsulation} from '@angular/core';
import {DotSelect, DotOption} from '../dot-select/dot-select';
import {DropdownComponent} from "../dropdown-component/dropdown-component";

@Component({
    directives: [DropdownComponent, DotSelect, DotOption],
    encapsulation: ViewEncapsulation.Emulated,
    moduleId: __moduleName, // REQUIRED to use relative path in styleUrls
    providers: [],
    selector: 'pattern-library',
    styleUrls: ['pattern-library.css'],
    templateUrl: ['pattern-library.html']
})

export class PatternLibrary {

}