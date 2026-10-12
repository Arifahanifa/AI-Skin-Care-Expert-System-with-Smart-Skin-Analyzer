import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Info,
  Clock,
  Sparkles,
  HeartPulse,
  Activity,
  Droplet,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';

export default function RecoveryTimelinePage({ onNewAssessment }) {
  const [days, setDays] = useState(14);
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Symptom check-in modal/form state
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [checkinForm, setCheckinForm] = useState({
    comfort: 7.5,
    dryness: 3.0,
    irritation: 2.0,
    notes: ''
  });
  const [submittingCheckin, setSubmittingCheckin] = useState(false);

  const fetchTimeline = async (selectedDays = days) => {
    setLoading(true);
    try {
      const res = await api.timeline.getRecoveryTimeline(selectedDays);
      setTimelineData(res);
    } catch (err) {
      setError(err.message || 'Failed to load recovery timeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline(days);
  }, [days]);

  const handleLogCheckin = async (e) => {
    e.preventDefault();
    setSubmittingCheckin(true);
    try {
      await api.symptoms.checkin({
        comfort_rating: checkinForm.comfort,
        dryness_rating: checkinForm.dryness,
        irritation_rating: checkinForm.irritation,
        notes: checkinForm.notes
      });
      setShowCheckinForm(false);
      setCheckinForm({ comfort: 7.5, dryness: 3.0, irritation: 2.0, notes: '' });
      await fetchTimeline(days);
    } catch (err) {
      alert('Error saving check-in: ' + err.message);
    } finally {
      setSubmittingCheckin(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '999px', backgroundColor: '#EDE7F8', color: '#4A2285', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            <Calendar size={14} />
            <span>Empirical Progress Tracker</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1E1B4B' }}>
            Recovery Timeline
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#64748B', marginTop: '0.25rem' }}>
            Adherence metrics, daily comfort ratings, and recorded barrier indicators over realistic observation intervals.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Review Period Selector */}
          <div style={{ display: 'flex', backgroundColor: '#F1EDF8', padding: '3px', borderRadius: '10px' }}>
            {[7, 14, 28].map((period) => (
              <button
                key={period}
                onClick={() => setDays(period)}
                style={{
                  padding: '0.375rem 0.875rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: days === period ? '#4A2285' : 'transparent',
                  color: days === period ? '#FFFFFF' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
              >
                {period} Days
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCheckinForm(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0D9488', color: '#FFFFFF', padding: '0.5rem 1rem', borderRadius: '10px', border: 'none', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}
          >
            <HeartPulse size={16} />
            <span>Log Daily Check-in</span>
          </button>
        </div>
      </div>

      {/* Scientific Honesty Notice */}
      <div style={{ padding: '0.875rem 1.25rem', borderRadius: '12px', backgroundColor: '#FAF9FE', border: '1px solid #E8E2F2', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <Info size={20} color="#6532B0" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
          <strong>Tracking Period Disclosure:</strong> The 7, 14, and 28-day review intervals represent scientific observation horizons matching natural epidermal cellular turnover (28 days). They are <em>not</em> guaranteed cure dates. Adherence is calculated solely from recorded task completions.
        </span>
      </div>

      {/* Safety Alert if Worsening */}
      {timelineData?.is_worsening_trend && (
        <div style={{ padding: '1rem 1.25rem', borderRadius: '12px', backgroundColor: '#FFF1F2', border: '1px solid #FECDD3', display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
          <AlertTriangle size={20} color="#E11D48" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#9F1239' }}>
              Persistent or Escalating Discomfort Detected
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#881337', marginTop: '0.25rem', lineHeight: 1.4 }}>
              {timelineData.safety_guidance}
            </p>
          </div>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E8E2F2' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Routine Adherence</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1E1B4B', marginTop: '4px' }}>
            {timelineData?.adherence_percentage || 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#0D9488', marginTop: '2px' }}>
            {timelineData?.total_completed_tasks || 0} completed tasks
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E8E2F2' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Missed / Skipped</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#64748B', marginTop: '4px' }}>
            {timelineData?.total_skipped_tasks || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Steps bypassed</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E8E2F2' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Check-in Records</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4A2285', marginTop: '4px' }}>
            {timelineData?.symptom_ratings_history?.length || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6532B0', marginTop: '2px' }}>Logged comfort entries</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E8E2F2' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Digital Twin Snapshots</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0D9488', marginTop: '4px' }}>
            {timelineData?.twin_progression?.length || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#0D9488', marginTop: '2px' }}>Confirmed state points</div>
        </div>
      </div>

      {/* Chart 1: Daily Task Completion Adherence */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E8E2F2' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E1B4B', marginBottom: '0.25rem' }}>
          Daily Routine Adherence ({days}-Day Horizon)
        </h3>
        <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1.25rem' }}>
          Actual completed skincare steps versus prescribed regimen targets.
        </p>

        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timelineData?.daily_adherence_data || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1EDF8" />
              <XAxis dataKey="day_label" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 6]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="completed" name="Completed Steps" fill="#4A2285" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" name="Daily Target" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: User-Reported Symptom & Comfort Ratings */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E8E2F2' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E1B4B', marginBottom: '0.25rem' }}>
          Daily Subjective Comfort & Irritation Trends
        </h3>
        <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1.25rem' }}>
          User-logged comfort rating (1-10) alongside reported tightness and irritation scores.
        </p>

        {timelineData?.symptom_ratings_history?.length > 0 ? (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData.symptom_ratings_history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1EDF8" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="comfort_rating" name="Comfort (1-10)" stroke="#0D9488" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="dryness_rating" name="Dryness / Tightness" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="irritation_rating" name="Irritation Level" stroke="#E11D48" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', backgroundColor: '#FAF9FE', borderRadius: '12px' }}>
            No symptom check-ins recorded yet. Click "Log Daily Check-in" above to add your first entry.
          </div>
        )}
      </div>

      {/* Modal / Form to Log Check-in */}
      {showCheckinForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', width: '100%', maxWidth: '480px', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1E1B4B' }}>
                Log Daily Skin Comfort Check-in
              </h3>
              <button onClick={() => setShowCheckinForm(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.25rem' }}>×</button>
            </div>

            <form onSubmit={handleLogCheckin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                  Skin Comfort Rating (1 = Uncomfortable, 10 = Completely Plump & Calm): {checkinForm.comfort}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={checkinForm.comfort}
                  onChange={(e) => setCheckinForm({ ...checkinForm, comfort: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: '#0D9488' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                  Dryness / Tightness Rating (0 = None, 10 = Severe Tautness): {checkinForm.dryness}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={checkinForm.dryness}
                  onChange={(e) => setCheckinForm({ ...checkinForm, dryness: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: '#F59E0B' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                  Irritation / Stinging Rating (0 = None, 10 = Acute Burning): {checkinForm.irritation}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={checkinForm.irritation}
                  onChange={(e) => setCheckinForm({ ...checkinForm, irritation: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: '#E11D48' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                  Personal Observations / Triggers
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mild cheek tightness after sitting in AC office"
                  value={checkinForm.notes}
                  onChange={(e) => setCheckinForm({ ...checkinForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCheckinForm(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'none', color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCheckin}
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: '#0D9488', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer' }}
                >
                  {submittingCheckin ? 'Saving...' : 'Save Check-in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
