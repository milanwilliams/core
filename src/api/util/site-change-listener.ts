import {SiteService} from '../services/site-service';
import {Site} from '../services/site-service';

export abstract class SiteChangeListener {

    constructor(private siteService: SiteService) {
        siteService.switchSite$.subscribe(
            site => this.changeSiteReload( site )
        );
    }

    abstract changeSiteReload(site: Site): void;
}
