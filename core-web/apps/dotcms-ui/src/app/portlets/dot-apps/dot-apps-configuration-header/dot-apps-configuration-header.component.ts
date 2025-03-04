import { Component, Input } from '@angular/core';
import { DotApps } from '@dotcms/dotcms-models';
import { DotRouterService } from '@dotcms/app/api/services/dot-router/dot-router.service';

@Component({
    selector: 'dot-apps-configuration-header',
    templateUrl: './dot-apps-configuration-header.component.html',
    styleUrls: ['./dot-apps-configuration-header.component.scss']
})
export class DotAppsConfigurationHeaderComponent {
    showMore: boolean;

    @Input() app: DotApps;

    constructor(private dotRouterService: DotRouterService) {}

    /**
     * Redirects to app configuration listing page
     *
     * @param string key
     * @memberof DotAppsConfigurationDetailComponent
     */
    goToApps(key: string): void {
        this.dotRouterService.gotoPortlet(`/apps/${key}`);
        this.dotRouterService.goToAppsConfiguration(key);
    }
}
