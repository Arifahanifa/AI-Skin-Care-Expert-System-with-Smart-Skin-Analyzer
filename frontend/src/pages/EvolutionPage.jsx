import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  Droplet,
  Flame,
  HeartPulse,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';

export default function EvolutionPage({ onNewAssessment }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await api.twin.getHistory();
        setHistory(res?.snapshots || []);
      } catch (err) {
        console.error('Error fetching evolution snapshots:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div className="spinner" style={{ width: 44, height: 44, border: '4px solid #E8E2F2', borderTopColor: '#4A2285', borderRadius: '50%', margin: '0 auto 1rem' }} />
        <h3 style={{ color: '#1E1B4B', fontWeight: 700 }}>Compiling Longitudinal Skin Twin Evolution...</h3>
      </div>
    );
  }

  // Format historical snapshots for LineChart
  const chartData = history.map((h, i) => ({
    assessment: `Record #${h.id}`,
    date: h.created_at?.split(' ')[0] || `T${i + 1}`,
    Hydration: h.hydration,
    Oiliness: h.oiliness,
    Sensitivity: h.sensitivity,
    Redness: h.redness,
    BarrierHealth: h.barrier_health_index
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div
        className="card-glass"
        style={{
          borderRadius: '24px',
          padding: '2rem 2.25rem',
          border: '1.5px solid #DDD1F5',
          boxShadow: '0 8px 30px rgba(74, 34, 133, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '999px', backgroundColor: '#EDE7F8', color: '#4A2285', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            <TrendingUp size={14} />
            <span>Longitudinal State Tracking</span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#1E1B4B', lineHeight: 1.2 }}>
            Skin Twin Evolution
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#64748B', marginTop: '0.375rem', maxWidth: '680px' }}>
            Chronological progression of observed parameters and recovery events across saved evaluations.
          </p>
        </div>

        <button onClick={onNewAssessment} className="btn btn-primary">
          <Sparkles size={16} />
          <span>Record New Assessment</span>
        </button>
      </div>

      {/* LINE CHART: PARAMETER EVOLUTION OVER TIME */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E1B4B', marginBottom: '0.5rem' }}>
          Longitudinal Metric Trajectories
        </h3>
        <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '1.5rem' }}>
          Tracking verified changes in hydration, sebum flux, sensitivity, and barrier index across successive observations.
        </p>

        {chartData.length > 0 ? (
          <div style={{ height: 360, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EDF8" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#64748B" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Hydration" stroke="#0284C7" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Oiliness" stroke="#D97706" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Sensitivity" stroke="#E11D48" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Redness" stroke="#FB7185" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="BarrierHealth" stroke="#4A2285" strokeWidth={3} strokeDasharray="4 4" dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={{ textAlign: 'center', padding: '3rem 0', color: '#94A3B8' }}>
            No historical records found. Complete multiple assessments to see trajectory lines.
          </p>
        )}
      </div>

      {/* TIMELINE PROGRESSION CARDS */}
      <div className="card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E1B4B', marginBottom: '1.25rem' }}>
          Chronological Assessment Log ({history.length} Records)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {history.slice().reverse().map((rec, idx) => {
            const isRecMode = rec.operating_mode === 'RECOVERY_MODE';
            return (
              <div
                key={rec.id}
                style={{
                  padding: '1.25rem',
                  borderRadius: '14px',
                  backgroundColor: '#FAF9FE',
                  border: isRecMode ? '1.5px solid #FECDD3' : '1px solid #E8E2F2',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#4A2285' }}>
                      Assessment #{rec.id}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                      {rec.created_at}
                    </span>
                    <span className={`badge ${isRecMode ? 'badge-coral' : 'badge-primary'}`}>
                      {rec.operating_mode}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.625rem', fontSize: '0.8125rem', color: '#475569', flexWrap: 'wrap' }}>
                    <span>Hydration: <strong>{rec.hydration}%</strong></span>
                    <span>Oiliness: <strong>{rec.oiliness}%</strong></span>
                    <span>Sensitivity: <strong>{rec.sensitivity}%</strong></span>
                    <span>Redness: <strong>{rec.redness}%</strong></span>
                    <span>Barrier Health: <strong>{rec.barrier_health_index}/100</strong></span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Observed State:</span>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E1B4B' }}>
                    {rec.primary_skin_state || 'Recorded State'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
