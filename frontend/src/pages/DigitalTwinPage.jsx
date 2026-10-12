import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  FileText,
  Camera,
  Trash2,
  AlertTriangle,
  ArrowRight,
  Info,
  Clock,
  Eye
} from 'lucide-react';
import { api } from '../services/api';

export default function DigitalTwinPage({ onNavigate, onNewAssessment }) {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadSkinHistory = async () => {
    setLoading(true);
    try {
      const histRes = await api.assessments.getHistory();
      setHistoryList(histRes?.history || []);
    } catch (err) {
      console.error('Error fetching skin history:', err);
      setErrorMessage('Failed to load past assessments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkinHistory();
  }, []);

  const handleDeleteAssessment = async (id) => {
    setDeleting(true);
    try {
      await api.assessments.delete(id);
      setStatusMessage('Assessment record successfully deleted.');
      setDeleteId(null);
      // Reload history list
      await loadSkinHistory();
      setTimeout(() => setStatusMessage(''), 3500);
    } catch (err) {
      console.error('Failed to delete assessment:', err);
      setErrorMessage(err.message || 'Could not delete assessment record.');
      setTimeout(() => setErrorMessage(''), 3500);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div
          className="spinner"
          style={{
            width: 36,
            height: 36,
            border: '3px solid var(--border)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            margin: '0 auto 1.25rem'
          }}
        />
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading your skin check history...</p>
      </div>
    );
  }

  const hasHistory = historyList.length > 0;

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
            Skin History & Assessment Records
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
            A chronological timeline of your saved skin checks, reported concerns, and photo quality observations.
          </p>
        </div>

        <button
          onClick={onNewAssessment}
          className="btn btn-primary"
          style={{ gap: '0.4rem' }}
        >
          <Camera size={16} />
          <span>New Skin Check</span>
        </button>
      </div>

      {/* Status or Error Notifications */}
      {statusMessage && (
        <div
          style={{
            backgroundColor: 'var(--primary-subtle)',
            border: '1px solid var(--green-border)',
            color: 'var(--primary-deep)',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            backgroundColor: '#FDF2EB',
            border: '1px solid #F7D5C5',
            color: '#B55835',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Assessments
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-heading)', marginTop: '4px' }}>
            {historyList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {historyList.length > 0 ? 'Logged to your private database' : 'No records yet'}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Latest Check Date
          </span>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-heading)', marginTop: '8px' }}>
            {hasHistory ? (historyList[0].created_at ? historyList[0].created_at.split(' ')[0] : 'Recent') : 'None'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {hasHistory ? 'Most recent analysis' : 'Ready for your first check'}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Latest Primary State
          </span>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', marginTop: '8px' }}>
            {hasHistory ? (historyList[0].primary_skin_state || 'Balanced Skin') : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Evaluated by rule engine
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!hasHistory && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'var(--primary-subtle)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              color: 'var(--primary)'
            }}
          >
            <Calendar size={32} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-heading)' }}>
            No Skin Check History Yet
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0.5rem auto 1.5rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
            Each time you complete a skin check with your camera and 3 quick questions, your results and photo quality metrics are saved here for review.
          </p>
          <button onClick={onNewAssessment} className="btn btn-primary">
            <Camera size={16} />
            <span>Start Your First Check</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Chronological List of Past Assessments */}
      {hasHistory && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="var(--primary)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
                Chronological Assessment Records
              </h2>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {historyList.length} {historyList.length === 1 ? 'assessment' : 'assessments'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {historyList.map((item, index) => {
              const q = item.user_questionnaire || {};
              const obs = item.image_observations || {};
              const dateStr = item.created_at ? item.created_at.split('.')[0] : 'Recent';
              const isRecovery = item.operating_mode === 'RECOVERY_MODE';

              return (
                <div
                  key={item.id || index}
                  style={{
                    padding: '1.15rem',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                          Check #{historyList.length - index} • {dateStr}
                        </span>
                        <span className={`badge ${isRecovery ? 'badge-peach' : 'badge-primary'}`}>
                          {item.primary_skin_state || (isRecovery ? 'Soothing Care' : 'Balanced')}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Reported Skin Feel: <strong style={{ color: 'var(--text-primary)' }}>{q.skin_feel || q.skin_type || 'Normal/Combination'}</strong> • Concern: <strong style={{ color: 'var(--text-primary)' }}>{q.primary_concern || 'Gentle Maintenance'}</strong>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => onNavigate && onNavigate('report')}
                        className="btn btn-outline btn-sm"
                        style={{ gap: '0.35rem' }}
                        title="View Full Report"
                      >
                        <Eye size={14} />
                        <span>View Report</span>
                      </button>

                      <button
                        onClick={() => setDeleteId(item.id)}
                        className="btn btn-peach-outline btn-sm"
                        style={{ padding: '0.35rem 0.55rem' }}
                        title="Delete this record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Photo Quality Observations Strip */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <div>
                      Framing: <strong style={{ color: 'var(--text-primary)' }}>{obs.framing || 'Centered'}</strong>
                    </div>
                    <div>•</div>
                    <div>
                      Brightness: <strong style={{ color: 'var(--text-primary)' }}>{obs.brightness_percent != null ? `${obs.brightness_percent}%` : 'Normal'}</strong>
                    </div>
                    <div>•</div>
                    <div>
                      Sharpness: <strong style={{ color: 'var(--text-primary)' }}>{obs.sharpness != null ? `${Math.round(obs.sharpness)}` : 'Verified'}</strong>
                    </div>
                    <div>•</div>
                    <div>
                      Faces Detected: <strong style={{ color: 'var(--text-primary)' }}>{obs.faces_detected != null ? obs.faces_detected : 1}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="modal-content" style={{ maxWidth: '440px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  backgroundColor: '#FDF2EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#B55835'
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                Delete Assessment Record?
              </h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, marginBottom: '1.5rem' }}>
              Are you sure you want to delete this skin check record? This action will remove the assessment from your history and cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setDeleteId(null)}
                className="btn btn-outline"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAssessment(deleteId)}
                className="btn btn-peach"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Academic Architecture Transparency Note */}
      <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--bg-card-subtle)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <Info size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong>Academic Digital Twin Transparency:</strong> This system maintains an honest digital record of your explicit assessment checks and daily routine consistency. It does not run speculative generative health predictions or simulated medical forecasts.
        </div>
      </div>
    </div>
  );
}
