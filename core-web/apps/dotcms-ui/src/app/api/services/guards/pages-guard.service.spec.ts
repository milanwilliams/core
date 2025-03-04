import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MockDotPropertiesService } from '@dotcms/app/portlets/dot-edit-page/main/dot-edit-page-nav/dot-edit-page-nav.component.spec';
import { DotPropertiesService } from '@dotcms/data-access';
import { FeaturedFlags } from '@dotcms/dotcms-models';
import { PagesGuardService } from './pages-guard.service';

describe('PagesGuardService', () => {
    let pagesGuardService: PagesGuardService;
    let dotPropertiesService: DotPropertiesService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                PagesGuardService,
                { provide: DotPropertiesService, useClass: MockDotPropertiesService }
            ]
        });

        pagesGuardService = TestBed.inject(PagesGuardService);
        dotPropertiesService = TestBed.inject(DotPropertiesService);
    });

    it('should allow access to Pages Portlets', () => {
        let result: boolean;
        spyOn(dotPropertiesService, 'getKey').and.returnValue(of('true'));
        pagesGuardService.canActivate().subscribe((res) => (result = res));
        expect(dotPropertiesService.getKey).toHaveBeenCalledWith(
            FeaturedFlags.DOTFAVORITEPAGE_FEATURE_ENABLE
        );
        expect(result).toBe(true);
    });

    it('should deny access to Pages Portlets', () => {
        let result: boolean;
        spyOn(dotPropertiesService, 'getKey').and.returnValue(of('false'));
        pagesGuardService.canActivate().subscribe((res) => (result = res));
        expect(dotPropertiesService.getKey).toHaveBeenCalledWith(
            FeaturedFlags.DOTFAVORITEPAGE_FEATURE_ENABLE
        );
        expect(result).toBe(false);
    });
});
