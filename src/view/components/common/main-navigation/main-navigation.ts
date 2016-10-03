import {Component} from '@angular/core';
import {RoutingService, Menu} from '../../../../api/services/routing-service';

@Component({
    moduleId: __moduleName, // REQUIRED to use relative path in styleUrls
    providers: [],
    selector: 'dot-main-nav',
    styleUrls: ['main-navigation.css'],
    templateUrl: ['main-navigation.html'],
})

export class MainNavigation {

    private menuItems: Menu[];

    constructor(routingService: RoutingService) {
        routingService.menusChange$.subscribe(menu => {
            this.menuItems = menu;
        });
    }
}
