import {BaseComponent} from '../_base/base-component';
import {Component, ViewEncapsulation, ElementRef} from '@angular/core';
import {DotcmsEventsService} from '../../../../api/services/dotcms-events-service';
import {INotification, NotificationsService} from '../../../../api/services/notifications-service';
import {MessageService} from '../../../../api/services/messages-service';

@Component({
    directives: [],
    encapsulation: ViewEncapsulation.Emulated,
    moduleId: __moduleName, // REQUIRED to use relative path in styleUrls
    providers: [],
    selector: 'dot-toolbar-notifications',
    styleUrls: ['toolbar-notifications.css'],
    templateUrl: ['toolbar-notifications.html']
})
export class ToolbarNotifications extends BaseComponent{
    private elementRef;
    private isNotificationsMarkedAsRead: boolean = false;
    private notifications: Array<INotification> = [];
    private notificationsUnreadCount: number = 0;
    private showNotifications: boolean = false;


    constructor(private dotcmsEventsService: DotcmsEventsService, private notificationService: NotificationsService,
                myElement: ElementRef, private messageService: MessageService) {
        super(['notifications_dismissall', 'notifications_title'], messageService);
        this.elementRef = myElement;
    }

    ngOnInit() {
        this.getNotifications();
        this.subscribeToNotifications();
    }

    private clearNotitications() {
        this.notifications = [];
        this.notificationsUnreadCount = 0;
        this.showNotifications = false;
    }

    private dismissAllNotifications():void {
        let items = this.notifications.map(item => item.id);
        this.notificationService.dismissNotifications({'items': items}).subscribe(res => {
            // TODO: I think we should get here res and err
            if (res.errors.length) {
                return;
            }

            this.clearNotitications();
        });
    }

    private getNotifications() {
        this.notificationService.getNotifications().subscribe(res => {
            this.notificationsUnreadCount = res.entity.count;
            this.notifications = res.entity.notifications;
        });
    }

    private markAllAsRead():void {
        this.notificationService.markAllAsRead().subscribe(res => {
            this.isNotificationsMarkedAsRead = true;
            this.notificationsUnreadCount = 0;
        });

    }

    private onDismissNotification($event):void {
        let notificationId = $event.id;

        this.notificationService.dismissNotifications({"items": [notificationId]}).subscribe(res => {
            if (res.errors.length) {
                return;
            }

            this.notifications = this.notifications.filter(item => {
                return item.id !== notificationId;
            });

            if (this.notificationsUnreadCount) {
                this.notificationsUnreadCount--;
            }

            if (!this.notifications.length && !this.notificationsUnreadCount) {
                this.clearNotitications();
            }
        });
    }

    private subscribeToNotifications(): void {
        this.dotcmsEventsService.subscribeTo('NOTIFICATION').subscribe((res) => {
            this.notifications.unshift(res.data);
            this.notificationsUnreadCount++;
            this.isNotificationsMarkedAsRead = false;
        });
    }

    private toggleNotifications(): void {
        this.showNotifications = !this.showNotifications;

        if (this.showNotifications && !this.isNotificationsMarkedAsRead) {
            this.markAllAsRead();
        }
    }
}