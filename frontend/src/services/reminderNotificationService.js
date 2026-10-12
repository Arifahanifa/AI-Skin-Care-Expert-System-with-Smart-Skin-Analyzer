/**
 * Client-Side Real Reminder and Notification Scheduling Service
 * Manages Browser Notifications API, Service Worker registration, and scheduled triggers.
 */

class ReminderNotificationService {
  constructor() {
    this.swRegistration = null;
    this.activeTimers = [];
    this.initServiceWorker();
  }

  async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      } catch (err) {
        console.warn('Service Worker registration skipped or failed:', err);
      }
    }
  }

  getPermissionStatus() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission; // 'default', 'granted', 'denied'
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support desktop notifications.');
    }
    const permission = await Notification.requestPermission();
    return permission;
  }

  async sendNotification(title, body, options = {}) {
    const perm = this.getPermissionStatus();
    if (perm !== 'granted') {
      console.warn('Cannot send notification: permission is', perm);
      return false;
    }

    const notifOptions = {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      tag: options.tag || 'dermatwin-reminder',
      renotify: true,
      ...options
    };

    // Record into local reminder history
    this.recordHistory(title, body);

    if (this.swRegistration && this.swRegistration.showNotification) {
      try {
        await this.swRegistration.showNotification(title, notifOptions);
        return true;
      } catch (err) {
        // Fallback to standard window Notification
      }
    }

    try {
      new Notification(title, notifOptions);
      return true;
    } catch (e) {
      console.error('Direct Notification failed:', e);
      return false;
    }
  }

  recordHistory(title, body) {
    try {
      const history = JSON.parse(localStorage.getItem('dermatwin_reminder_history') || '[]');
      history.unshift({
        id: Date.now(),
        title,
        body,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString()
      });
      localStorage.setItem('dermatwin_reminder_history', JSON.stringify(history.slice(0, 30)));
    } catch (e) {
      // ignore
    }
  }

  getHistory() {
    try {
      return JSON.parse(localStorage.getItem('dermatwin_reminder_history') || '[]');
    } catch (e) {
      return [];
    }
  }

  clearHistory() {
    localStorage.removeItem('dermatwin_reminder_history');
  }

  /**
   * Sets up active in-tab timers for enabled reminders
   */
  scheduleReminders(remindersList) {
    // Clear previous timers
    this.activeTimers.forEach(t => clearTimeout(t));
    this.activeTimers = [];

    if (!Array.isArray(remindersList)) return;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    remindersList.forEach(r => {
      if (!r.is_enabled || !r.time) return;

      const [rHour, rMin] = r.time.split(':').map(Number);
      const targetMinutes = rHour * 60 + rMin;

      let diffMinutes = targetMinutes - currentMinutes;
      if (diffMinutes < 0) {
        // Scheduled for tomorrow (or next occurrence)
        diffMinutes += 24 * 60;
      }

      const msUntilTarget = diffMinutes * 60 * 1000 - (now.getSeconds() * 1000);
      if (msUntilTarget > 0 && msUntilTarget < 24 * 60 * 60 * 1000) {
        const timerId = setTimeout(() => {
          this.sendNotification(
            `⏰ ${r.title}`,
            `Scheduled skincare reminder for ${r.time}. Consistency supports your skin barrier.`
          );
        }, msUntilTarget);
        this.activeTimers.push(timerId);
      }
    });
  }
}

export const reminderService = new ReminderNotificationService();
