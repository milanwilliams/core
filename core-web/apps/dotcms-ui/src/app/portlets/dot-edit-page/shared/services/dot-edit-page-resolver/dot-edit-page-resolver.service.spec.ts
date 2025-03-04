/* eslint-disable @typescript-eslint/no-explicit-any */

import { ActivatedRouteSnapshot } from '@angular/router';
import { DotContentletLockerService } from '@dotcms/data-access';
import { DotEditPageResolver } from './dot-edit-page-resolver.service';
import { DotHttpErrorManagerService } from '@dotcms/app/api/services/dot-http-error-manager/dot-http-error-manager.service';
import { DotPageRenderService } from '@dotcms/data-access';
import { DotRouterService } from '@dotcms/app/api/services/dot-router/dot-router.service';
import { LoginService, CoreWebService, HttpCode } from '@dotcms/dotcms-js';
import { LoginServiceMock, mockUser } from '@dotcms/utils-testing';
import { getTestBed, TestBed } from '@angular/core/testing';
import { mockDotRenderedPage } from '@dotcms/utils-testing';
import { of, throwError } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CoreWebServiceMock } from '@dotcms/utils-testing';
import { DotAlertConfirmService } from '@dotcms/data-access';
import { ConfirmationService } from 'primeng/api';
import { DotFormatDateService } from '@dotcms/app/api/services/dot-format-date-service';
import { MockDotRouterService } from '@dotcms/utils-testing';
import { mockResponseView } from '@dotcms/utils-testing';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { DotPageRender, DotPageRenderState } from '@dotcms/dotcms-models';
import { DotESContentService } from '@dotcms/data-access';
import { DotPageStateService } from '../../../content/services/dot-page-state/dot-page-state.service';

const route: any = jasmine.createSpyObj<ActivatedRouteSnapshot>('ActivatedRouteSnapshot', [
    'toString'
]);

route.queryParams = {};

describe('DotEditPageResolver', () => {
    let dotHttpErrorManagerService: DotHttpErrorManagerService;
    let dotPageStateService: DotPageStateService;
    let dotPageStateServiceRequestPageSpy: jasmine.Spy;
    let dotRouterService: DotRouterService;

    let injector: TestBed;
    let dotEditPageResolver: DotEditPageResolver;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                { provide: CoreWebService, useClass: CoreWebServiceMock },
                DotHttpErrorManagerService,
                DotPageStateService,
                DotEditPageResolver,
                DotPageRenderService,
                DotContentletLockerService,
                DotAlertConfirmService,
                ConfirmationService,
                DotFormatDateService,
                DotESContentService,
                { provide: DotRouterService, useClass: MockDotRouterService },
                {
                    provide: ActivatedRouteSnapshot,
                    useValue: route
                },
                {
                    provide: LoginService,
                    useClass: LoginServiceMock
                }
            ]
        });
        injector = getTestBed();
        dotEditPageResolver = injector.get(DotEditPageResolver);
        dotHttpErrorManagerService = injector.get(DotHttpErrorManagerService);
        dotPageStateService = injector.get(DotPageStateService);
        dotPageStateServiceRequestPageSpy = spyOn(dotPageStateService, 'requestPage');
        dotRouterService = injector.get(DotRouterService);

        spyOn(dotHttpErrorManagerService, 'handle').and.callThrough();
    });

    beforeEach(() => {
        route.queryParams.url = 'edit-page/content';
        route.queryParams.language_id = '2';
        route.children = [
            {
                url: [
                    {
                        path: 'content'
                    }
                ]
            }
        ];
    });

    it('should return a DotRenderedPageState', () => {
        const mock = new DotPageRenderState(mockUser(), new DotPageRender(mockDotRenderedPage()));
        dotPageStateServiceRequestPageSpy.and.returnValue(of(mock));

        dotEditPageResolver.resolve(route).subscribe((state: DotPageRenderState) => {
            expect(state).toEqual(mock);
        });

        expect<any>(dotPageStateService.requestPage).toHaveBeenCalledWith({
            url: 'edit-page/content',
            viewAs: {
                language: '2'
            }
        });
    });

    it('should redirect to site-browser when request fail', () => {
        const fake403Response = mockResponseView(403);

        dotPageStateServiceRequestPageSpy.and.returnValue(throwError(fake403Response));

        dotEditPageResolver.resolve(route).subscribe();
        expect(dotRouterService.goToSiteBrowser).toHaveBeenCalledTimes(1);
    });

    it('should return DotPageRenderState from local state', () => {
        const mock = new DotPageRenderState(mockUser(), new DotPageRender(mockDotRenderedPage()));
        dotPageStateService.setInternalNavigationState(mock);

        dotEditPageResolver.resolve(route).subscribe((state: DotPageRenderState) => {
            expect(state).toEqual(mock);
        });

        expect(dotPageStateServiceRequestPageSpy).not.toHaveBeenCalled();
    });

    describe('handle layout', () => {
        beforeEach(() => {
            route.children = [
                {
                    url: [
                        {
                            path: 'layout'
                        }
                    ]
                }
            ];
        });

        it('should return a DotRenderedPageState', () => {
            const mock = new DotPageRenderState(
                mockUser(),
                new DotPageRender(mockDotRenderedPage())
            );
            dotPageStateServiceRequestPageSpy.and.returnValue(of(mock));

            dotEditPageResolver.resolve(route).subscribe((state: DotPageRenderState) => {
                expect(state).toEqual(mock);
            });
            expect(dotRouterService.goToSiteBrowser).not.toHaveBeenCalled();
        });

        it('should handle error and redirect to site-browser when cant edit layout', () => {
            const mock = new DotPageRenderState(
                mockUser(),
                new DotPageRender({
                    ...mockDotRenderedPage(),
                    page: {
                        ...mockDotRenderedPage().page,
                        canEdit: false
                    }
                })
            );
            dotPageStateServiceRequestPageSpy.and.returnValue(of(mock));

            dotEditPageResolver.resolve(route).subscribe((state: DotPageRenderState) => {
                expect(state).toBeNull();
            });
            expect(dotRouterService.goToSiteBrowser).toHaveBeenCalled();
            expect(dotHttpErrorManagerService.handle).toHaveBeenCalledWith(
                new HttpErrorResponse(
                    new HttpResponse({
                        body: null,
                        status: HttpCode.FORBIDDEN,
                        headers: null,
                        url: ''
                    })
                )
            );
        });

        it('should handle error and redirect to site-browser when layout is not drawed', () => {
            const mock = new DotPageRenderState(
                mockUser(),
                new DotPageRender({
                    ...mockDotRenderedPage(),
                    layout: null
                })
            );
            dotPageStateServiceRequestPageSpy.and.returnValue(of(mock));

            dotEditPageResolver.resolve(route).subscribe((state: DotPageRenderState) => {
                expect(state).toBeNull();
            });
            expect(dotRouterService.goToSiteBrowser).toHaveBeenCalled();
            expect(dotHttpErrorManagerService.handle).toHaveBeenCalledTimes(1);
        });
    });
});
