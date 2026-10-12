import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  ShieldCheck,
  Send,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { reminderService } from '../services/reminderNotificationService';

export default function ReminderSettingsPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [testStatus, setTestStatus] = useState('');
  const [history, setHistory] = useState([]);

  // Form for new reminder
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    reminder_type: 'sunscreen_reapplication',
    title: 'Sunscreen Reapplication',
    time: '13:00',
    is_enabled: true,
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  });

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await api.reminders.getAll();
      const list = res.reminders || [];
      setReminders(list);
      reminderService.scheduleReminders(list);
    } catch (err) {
      console.error('Error fetching reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPermissionStatus(reminderService.getPermissionStatus());
    setHistory(reminderService.getHistory());
    fetchReminders();
  }, []);

  const handleRequestPermission = async () => {
    try {
      const res = await reminderService.requestPermission();
      setPermissionStatus(res);
      if (res === 'granted') {
        reminderService.sendNotification(
          'Notifications Enabled! 🔔',
          'You will now receive scheduled daily skincare and hydration reminders.'
        );
        setHistory(reminderService.getHistory());
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTestNotification = async () => {
    setTestStatus('Sending test notification...');
    const sent = await reminderService.sendNotification(
      'DermaTwin Skincare Reminder',
      'This is a real browser notification! Your daily reminders are active.',
      { tag: 'test-' + Date.now() }
    );
    if (sent) {
      setTestStatus('Notification delivered to your device!');
      setHistory(reminderService.getHistory());
    } else {
      setTestStatus('Notification could not be sent. Please enable notifications in your browser.');
    }
    setTimeout(() => setTestStatus(''), 4000);
  };

  const handleToggleReminder = async (r) => {
    const updated = { ...r, is_enabled: !r.is_enabled };
    try {
      await api.reminders.update(r.id, updated);
      const updatedList = reminders.map((item) => (item.id === r.id ? updated : item));
      setReminders(updatedList);
      reminderService.scheduleReminders(updatedList);
    } catch (err) {
      alert('Could not update reminder: ' + err.message);
    }
  };

  const handleTimeChange = async (r, newTime) => {
    const updated = { ...r, time: newTime };
    try {
      await api.reminders.update(r.id, updated);
      const updatedList = reminders.map((item) => (item.id === r.id ? updated : item));
      setReminders(updatedList);
      reminderService.scheduleReminders(updatedList);
    } catch (err) {
      alert('Could not update reminder time: ' + err.message);
    }
  };

  const handleDeleteReminder = async (id) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;
    try {
      await api.reminders.delete(id);
      const updatedList = reminders.filter((r) => r.id !== id);
      setReminders(updatedList);
      reminderService.scheduleReminders(updatedList);
    } catch (err) {
      alert('Could not delete reminder: ' + err.message);
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    try {
      await api.reminders.save(newReminder);
      setShowAddModal(false);
      setNewReminder({
        reminder_type: 'hydration',
        title: 'Drink Water',
        time: '14:00',
        is_enabled: true,
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      });
      await fetchReminders();
    } catch (err) {
      alert('Error saving reminder: ' + err.message);
    }
  };

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#14241B' }}>
            Daily Reminders
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#536258', marginTop: '0.25rem' }}>
            Receive browser notifications for morning & evening skincare, sunscreen reapplication, and hydration.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={handleTestNotification}
            className="btn btn-secondary btn-sm"
          >
            <Send size={14} />
            <span>Test Notification</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} />
            <span>Add Reminder</span>
          </button>
        </div>
      </div>

      {testStatus && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', backgroundColor: '#E8F5EE', border: '1px solid #C8E3D4', color: '#2D6A4F', fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{testStatus}</span>
        </div>
      )}

      {/* Permission Status Banner */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: permissionStatus === 'granted' ? '#FAF8F5' : '#FDF2EB'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {permissionStatus === 'granted' ? (
            <ShieldCheck size={24} color="#2D6A4F" />
          ) : permissionStatus === 'denied' ? (
            <BellOff size={24} color="#D9734E" />
          ) : (
            <Bell size={24} color="#D9734E" />
          )}

          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#14241B' }}>
              Browser Permission: {permissionStatus === 'granted' ? 'Enabled' : permissionStatus === 'denied' ? 'Blocked in Settings' : 'Not Yet Enabled'}
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#536258', marginTop: '2px' }}>
              {permissionStatus === 'granted'
                ? 'Your browser is ready to send notifications at your scheduled reminder times.'
                : permissionStatus === 'denied'
                ? 'Notifications are blocked in your browser site settings. Check the lock icon in your address bar to allow.'
                : 'Click "Enable Notifications" so your browser can remind you to apply sunscreen and stay hydrated.'}
            </p>
          </div>
        </div>

        {permissionStatus !== 'granted' && (
          <button
            onClick={handleRequestPermission}
            className="btn btn-primary btn-sm"
          >
            Enable Notifications
          </button>
        )}
      </div>

      {/* Configured Reminders List */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#14241B' }}>
          Your Scheduled Reminders
        </h2>

        {reminders.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reminders.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: '1rem 1.15rem',
                  borderRadius: '12px',
                  backgroundColor: r.is_enabled ? '#FFFFFF' : '#FAF8F5',
                  border: '1px solid #E8E2D8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  opacity: r.is_enabled ? 1 : 0.65
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      backgroundColor: r.is_enabled ? '#E8F5EE' : '#FAF8F5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: r.is_enabled ? '#2D6A4F' : '#79877E'
                    }}
                  >
                    <Bell size={18} />
                  </div>

                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#14241B' }}>
                      {r.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#536258', marginTop: '2px' }}>
                      Days: {r.days ? r.days.join(', ') : 'Daily'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {/* Time input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={15} color="#536258" />
                    <input
                      type="time"
                      value={r.time}
                      onChange={(e) => handleTimeChange(r, e.target.value)}
                      className="form-input"
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.8125rem', width: 'auto' }}
                    />
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => handleToggleReminder(r)}
                    className={`btn btn-sm ${r.is_enabled ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {r.is_enabled ? 'Active' : 'Muted'}
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteReminder(r.id)}
                    style={{ background: 'none', border: 'none', color: '#79877E', cursor: 'pointer', padding: '4px' }}
                    title="Delete reminder"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#79877E' }}>
            No reminders configured yet. Click "Add Reminder" to create one.
          </div>
        )}
      </div>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20, 36, 27, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#14241B' }}>
                Add New Reminder
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#79877E', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Category</label>
                <select
                  value={newReminder.reminder_type}
                  onChange={(e) => {
                    const val = e.target.value;
                    const titles = {
                      morning_skincare: 'Morning Skincare Routine',
                      sunscreen_reapplication: 'Sunscreen Reapplication Check',
                      hydration: 'Drink a Glass of Water',
                      meal: 'Balanced Meal Time',
                      evening_skincare: 'Evening Skincare & Cleansing',
                      comfort_checkin: 'Daily Skin Comfort Check-in'
                    };
                    setNewReminder({
                      ...newReminder,
                      reminder_type: val,
                      title: titles[val] || 'Custom Reminder'
                    });
                  }}
                  className="form-input"
                  style={{ padding: '0.55rem 0.75rem' }}
                >
                  <option value="morning_skincare">Morning Skincare Routine</option>
                  <option value="sunscreen_reapplication">Sunscreen Reapplication</option>
                  <option value="hydration">Drink Water</option>
                  <option value="meal">Meal Reminder</option>
                  <option value="evening_skincare">Evening Skincare Routine</option>
                  <option value="comfort_checkin">Daily Comfort Check-in</option>
                </select>
              </div>

              <div>
                <label className="form-label">Reminder Title</label>
                <input
                  type="text"
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Scheduled Time</label>
                <input
                  type="time"
                  value={newReminder.time}
                  onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
