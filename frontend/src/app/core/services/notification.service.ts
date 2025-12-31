import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, interval, switchMap, startWith } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Notification {
    id: string;
    type: 'transaction' | 'security' | 'promo' | 'system' | 'kyc';
    titre: string;
    message: string;
    data?: any;
    lu: boolean;
    date: Date;
    dateLecture?: Date;
}

export interface NotificationsResponse {
    notifications: Notification[];
    nonLues: number;
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface NotificationPreferences {
    sms: boolean;
    email: boolean;
    push: boolean;
    transactions: boolean;
    securite: boolean;
    promotions: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private readonly http = inject(HttpClient);
    private readonly API_URL = `${environment.apiUrl}/notifications`;

    // State signals
    private _unreadCount = signal<number>(0);
    private _notifications = signal<Notification[]>([]);
    private _preferences = signal<NotificationPreferences | null>(null);

    // Public computed signals
    readonly unreadCount = computed(() => this._unreadCount());
    readonly notifications = computed(() => this._notifications());
    readonly preferences = computed(() => this._preferences());
    readonly hasUnread = computed(() => this._unreadCount() > 0);

    /**
     * Démarre le polling pour les nouvelles notifications
     */
    startPolling(intervalMs: number = 30000): Observable<{ nonLues: number }> {
        return interval(intervalMs).pipe(
            startWith(0),
            switchMap(() => this.getUnreadCount())
        );
    }

    /**
     * Récupère le nombre de notifications non lues
     */
    getUnreadCount(): Observable<{ nonLues: number }> {
        return this.http.get<{ nonLues: number }>(`${this.API_URL}/count`).pipe(
            tap(res => this._unreadCount.set(res.nonLues))
        );
    }

    /**
     * Récupère la liste des notifications
     */
    getNotifications(options: { page?: number; limit?: number; lu?: boolean; type?: string } = {}): Observable<NotificationsResponse> {
        let params = new HttpParams();
        
        if (options.page) params = params.set('page', String(options.page));
        if (options.limit) params = params.set('limit', String(options.limit));
        if (options.lu !== undefined) params = params.set('lu', String(options.lu));
        if (options.type) params = params.set('type', options.type);

        return this.http.get<NotificationsResponse>(this.API_URL, { params }).pipe(
            tap(res => {
                this._notifications.set(res.notifications);
                this._unreadCount.set(res.nonLues);
            })
        );
    }

    /**
     * Marque une notification comme lue
     */
    markAsRead(id: string): Observable<{ notification: Notification }> {
        return this.http.put<{ notification: Notification }>(`${this.API_URL}/${id}/read`, {}).pipe(
            tap(() => {
                // Mettre à jour le state local
                this._notifications.update(notifs => 
                    notifs.map(n => n.id === id ? { ...n, lu: true } : n)
                );
                this._unreadCount.update(count => Math.max(0, count - 1));
            })
        );
    }

    /**
     * Marque toutes les notifications comme lues
     */
    markAllAsRead(): Observable<{ message: string; count: number }> {
        return this.http.put<{ message: string; count: number }>(`${this.API_URL}/read-all`, {}).pipe(
            tap(() => {
                this._notifications.update(notifs => 
                    notifs.map(n => ({ ...n, lu: true }))
                );
                this._unreadCount.set(0);
            })
        );
    }

    /**
     * Supprime une notification
     */
    deleteNotification(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`).pipe(
            tap(() => {
                const notif = this._notifications().find(n => n.id === id);
                this._notifications.update(notifs => notifs.filter(n => n.id !== id));
                if (notif && !notif.lu) {
                    this._unreadCount.update(count => Math.max(0, count - 1));
                }
            })
        );
    }

    /**
     * Récupère les préférences de notification
     */
    getPreferences(): Observable<{ preferences: NotificationPreferences }> {
        return this.http.get<{ preferences: NotificationPreferences }>(`${this.API_URL}/preferences`).pipe(
            tap(res => this._preferences.set(res.preferences))
        );
    }

    /**
     * Met à jour les préférences de notification
     */
    updatePreferences(preferences: Partial<NotificationPreferences>): Observable<{ message: string; preferences: NotificationPreferences }> {
        return this.http.put<{ message: string; preferences: NotificationPreferences }>(`${this.API_URL}/preferences`, preferences).pipe(
            tap(res => this._preferences.set(res.preferences))
        );
    }

    /**
     * Retourne l'icône appropriée pour le type de notification
     */
    getNotificationIcon(type: string): string {
        const icons: Record<string, string> = {
            transaction: 'account_balance_wallet',
            security: 'security',
            promo: 'local_offer',
            system: 'info',
            kyc: 'verified_user'
        };
        return icons[type] || 'notifications';
    }

    /**
     * Retourne la couleur appropriée pour le type de notification
     */
    getNotificationColor(type: string): string {
        const colors: Record<string, string> = {
            transaction: '#4CAF50',
            security: '#F44336',
            promo: '#FF9800',
            system: '#2196F3',
            kyc: '#9C27B0'
        };
        return colors[type] || '#757575';
    }
}
