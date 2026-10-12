import React, { useState, useEffect } from 'react';
import {
  Camera,
  FileText,
  Calendar,
  Sparkles,
  ArrowRight,
  Heart,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage({
  dashboardData,
  onNavigate,
  onNewAssessment,
  loading
}) {
  const { user } = useAuth();
  const [currentRoutine, setCurrentRoutine] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [historyCount, setHistoryCount] = useState(0);

  const isSoothing = dashboardData?.operating_mode === 'RECOVERY_MODE';
  const hasAssessments = dashboardData?.has_assessments;
  const latestAss = dashboardData?.latest_assessment;
  const lastAssessmentDate = dashboardData?.last_assessment_date || latestAss?.created_at;

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [rRes, histRes] = await Promise.all([
          api.routine.getCurrent().catch(() => null),
          api.assessments.getHistory().catch(() => null)
        ]);

        if (rRes) {
          setCurrentRoutine(rRes.routine?.plan_json);
          setTodayTasks(rRes.today_tasks || []);
        }

        if (histRes?.history) {
          setHistoryCount(histRes.history.length);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      }
    }
    loadDashboardData();
  }, [dashboardData]);

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
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading your skincare dashboard...</p>
      </div>
    );
  }

  // Routine steps calculation
  const morningSteps = currentRoutine?.morning || [
    { id: 'm1', name: 'Wash face gently' },
    { id: 'm2', name: 'Apply moisturiser' },
    { id: 'm3', name: 'Apply SPF 30+ sunscreen' }
  ];
  const eveningSteps = currentRoutine?.evening || [
    { id: 'e1', name: 'Cleanse face gently' },
    { id: 'e2', name: 'Apply moisturiser' }
  ];

  const totalSteps = morningSteps.length + eveningSteps.length;
  const completedCount = todayTasks.filter((t) => t.status === 'completed').length;
  const completionPct = totalSteps > 0 ? Math.min(100, Math.round((completedCount / totalSteps) * 100)) : 0;

  // Photo quality status helper
  const photoQuality = latestAss?.image_observations?.quality_rating || (latestAss?.image_observations?.brightness ? 'Optimal' : 'Verified');
  const mainConcern = latestAss?.user_questionnaire?.primary_concern || latestAss?.primary_skin_state || 'Balanced Maintenance';

  const displayName = user?.full_name ? user.full_name.split(' ')[0] : user?.username || 'there';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1080px', margin: '0 auto' }}>
      {/* 1. Welcome Message & Subtitle */}
      <div
        className="card"
        style={{
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="var(--primary)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Personal Skincare Dashboard
          </span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
          Welcome back, {displayName}!
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '650px', lineHeight: 1.5 }}>
          Your daily skincare portal. Perform regular skin checks, follow your tailored morning and evening routine, and view verified assessment reports.
        </p>
      </div>

      {/* Soothing Notice if Active */}
      {isSoothing && (
        <div
          style={{
            backgroundColor: 'var(--peach-subtle)',
            border: '1px solid var(--peach-border)',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Heart size={22} color="var(--accent-peach)" />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-peach)' }}>
                Soothing Mode Active
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Your routine has been simplified to gentle essentials until your skin barrier feels completely comfortable.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('my-routine')}
            className="btn btn-peach btn-sm"
          >
            <span>View Soothing Steps</span>
          </button>
        </div>
      )}

      {/* 2. Exactly the 4 Clean Required Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        
        {/* CARD 1: Start Skin Check (Clear Call to Action) */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1.25rem',
            border: '1.5px solid var(--green-border)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  backgroundColor: 'var(--primary-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}
              >
                <Camera size={20} />
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
                Start Skin Check
              </h2>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Capture a live webcam photo and answer 3 quick questions about how your skin feels to receive a personalized analysis and routine.
            </p>
          </div>

          <button
            onClick={onNewAssessment}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem 1rem' }}
          >
            <Camera size={16} />
            <span>Start Skin Check</span>
            <ArrowRight size={15} />
          </button>
        </div>

        {/* CARD 2: Latest Report */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1.25rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}
              >
                <FileText size={20} />
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
                Latest Report
              </h2>
            </div>

            {hasAssessments && latestAss ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Date: <strong style={{ color: 'var(--text-heading)' }}>{lastAssessmentDate ? lastAssessmentDate.split(' ')[0] : 'Recent'}</strong>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Photo Quality: <span className="badge badge-primary" style={{ fontSize: '0.72rem', padding: '2px 7px' }}>{photoQuality}</span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Main Concern: <strong style={{ color: 'var(--primary)' }}>{mainConcern}</strong>
                </div>
              </div>
            ) : (
              <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                  No skin checks completed yet. Complete your first check to generate a personalized report.
                </p>
              </div>
            )}
          </div>

          {hasAssessments ? (
            <button
              onClick={() => onNavigate('report')}
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <FileText size={15} />
              <span>View Full Report</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={onNewAssessment}
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>Take First Check</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {/* CARD 3: Today's Routine */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1.25rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    backgroundColor: 'var(--primary-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)'
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
                  Today's Routine
                </h2>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                {completionPct}%
              </span>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', margin: 0 }}>
              {completedCount} of {totalSteps} daily steps completed today.
            </p>

            {/* Calculated Progress Bar */}
            <div style={{ height: '8px', backgroundColor: 'var(--primary-subtle)', borderRadius: '999px', overflow: 'hidden', marginTop: '0.65rem' }}>
              <div
                style={{
                  height: '100%',
                  width: `${completionPct}%`,
                  backgroundColor: 'var(--primary)',
                  borderRadius: '999px',
                  transition: 'width 300ms ease'
                }}
              />
            </div>
          </div>

          <button
            onClick={() => onNavigate('my-routine')}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Sparkles size={15} />
            <span>Open My Routine</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* CARD 4: Previous Assessments */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1.25rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)'
                }}
              >
                <Calendar size={20} />
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
                Previous Assessments
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Total Assessments: <strong style={{ color: 'var(--text-heading)', fontSize: '1.1rem' }}>{historyCount || (hasAssessments ? 1 : 0)}</strong>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Last Assessment: <strong style={{ color: 'var(--text-heading)' }}>{lastAssessmentDate ? lastAssessmentDate.split(' ')[0] : 'None yet'}</strong>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                All records are securely logged to your private profile timeline.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('twin')}
            className="btn btn-outline"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Calendar size={15} />
            <span>View Skin History</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
