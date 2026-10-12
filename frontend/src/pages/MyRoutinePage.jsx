import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Info,
  Clock,
  Heart,
  RotateCcw,
  Check
} from 'lucide-react';
import { api } from '../services/api';

export default function MyRoutinePage({ onNewAssessment, onNavigate }) {
  const [routineData, setRoutineData] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'morning', 'evening'
  const [actionMessage, setActionMessage] = useState('');
  const [soothingActive, setSoothingActive] = useState(false);

  const fetchRoutine = async () => {
    setLoading(true);
    try {
      const res = await api.routine.getCurrent();
      setRoutineData(res.routine);
      setTodayTasks(res.today_tasks || []);
      setSoothingActive(res.routine?.mode === 'SOOTHING' || res.routine?.mode === 'RECOVERY_MODE');
    } catch (err) {
      setError(err.message || 'Failed to load daily routine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutine();
  }, []);

  // Toggle Mark as Done
  const handleToggleTask = async (step, timeOfDay) => {
    try {
      const res = await api.routine.toggleTask({
        step_id: step.id,
        step_name: step.name || step.title,
        time_of_day: timeOfDay
      });

      // Refresh today's tasks
      const updated = await api.routine.getCurrent();
      setTodayTasks(updated.today_tasks || []);

      setActionMessage(res.status === 'completed' ? `Marked "${step.name || step.title}" as done!` : `Unmarked "${step.name || step.title}".`);
      setTimeout(() => setActionMessage(''), 2500);
    } catch (err) {
      console.error('Error toggling step:', err);
    }
  };

  // Reset Today's Checklist
  const handleResetChecklist = async () => {
    try {
      await api.routine.resetTodayTasks();
      const updated = await api.routine.getCurrent();
      setTodayTasks(updated.today_tasks || []);
      setActionMessage("Today's checklist has been reset.");
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      console.error('Error resetting checklist:', err);
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
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading your skincare routine checklist...</p>
      </div>
    );
  }

  const plan = routineData?.plan_json || {};

  // Standard steps fallback if plan is empty
  const morningSteps = plan.morning && plan.morning.length > 0 ? plan.morning : [
    { id: 'm_wash', name: 'Wash your face gently', instructions: 'Rinse with lukewarm water or a gentle non-foaming cleanser.', category: 'Cleanser' },
    { id: 'm_moist', name: 'Apply moisturiser', instructions: 'Smooth a light soothing cream onto damp skin to lock in moisture.', category: 'Moisturizer' },
    { id: 'm_sun', name: 'Apply broad-spectrum SPF 30+ sunscreen', instructions: 'Spread two finger lengths evenly across face and neck before heading outside.', category: 'Sun Protection' }
  ];

  const eveningSteps = plan.evening && plan.evening.length > 0 ? plan.evening : [
    { id: 'e_cleanse', name: 'Clean your face gently', instructions: 'Wash off daily sunscreen, oils, and dirt for 45-60 seconds.', category: 'Cleanser' },
    { id: 'e_moist', name: 'Apply moisturiser', instructions: 'Press a calming night moisturizer into skin to aid overnight barrier recovery.', category: 'Moisturizer' }
  ];

  const totalSteps = morningSteps.length + eveningSteps.length;
  const completedCount = todayTasks.filter((t) => t.status === 'completed').length;
  const progressPct = totalSteps > 0 ? Math.min(100, Math.round((completedCount / totalSteps) * 100)) : 0;

  const isStepCompleted = (stepId) => {
    return todayTasks.some((t) => t.step_id === stepId && t.status === 'completed');
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title & Routine Overview */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
            Daily Skincare Routine
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
            A simple daily checklist to keep your skin balanced, moisturized, and protected.
          </p>
        </div>

        {/* Reset Checklist Button */}
        <button
          onClick={handleResetChecklist}
          className="btn btn-outline btn-sm"
          style={{ gap: '0.4rem' }}
          title="Reset all tasks for today"
        >
          <RotateCcw size={14} />
          <span>Reset Today's Checklist</span>
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          style={{
            backgroundColor: 'var(--primary-subtle)',
            border: '1px solid var(--green-border)',
            color: 'var(--primary-deep)',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.84rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CheckCircle2 size={16} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Today's Progress Card */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="var(--primary)" />
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-heading)' }}>
              Today's Progress
            </span>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>
            {completedCount} of {totalSteps} steps completed ({progressPct}%)
          </span>
        </div>

        <div style={{ height: '8px', backgroundColor: 'var(--primary-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              backgroundColor: 'var(--primary)',
              borderRadius: '999px',
              transition: 'width 250ms ease'
            }}
          />
        </div>
      </div>

      {/* Routine Filter Tabs: Morning / Evening / All */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setActiveTab('all')}
          className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
        >
          <span>All Steps ({totalSteps})</span>
        </button>
        <button
          onClick={() => setActiveTab('morning')}
          className={`btn btn-sm ${activeTab === 'morning' ? 'btn-primary' : 'btn-outline'}`}
          style={{ gap: '0.4rem' }}
        >
          <Sun size={14} />
          <span>Morning Routine ({morningSteps.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('evening')}
          className={`btn btn-sm ${activeTab === 'evening' ? 'btn-primary' : 'btn-outline'}`}
          style={{ gap: '0.4rem' }}
        >
          <Moon size={14} />
          <span>Evening Routine ({eveningSteps.length})</span>
        </button>
      </div>

      {/* Routine Steps Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Morning Routine Section */}
        {(activeTab === 'all' || activeTab === 'morning') && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Sun size={18} color="var(--primary)" />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
                Morning Routine
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {morningSteps.map((step, idx) => {
                const done = isStepCompleted(step.id);
                return (
                  <div
                    key={step.id || idx}
                    className={`checklist-item ${done ? 'done' : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          backgroundColor: done ? 'var(--primary)' : 'var(--primary-subtle)',
                          color: done ? '#FFFFFF' : 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      >
                        {done ? <Check size={15} /> : idx + 1}
                      </div>

                      <div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: done ? 'var(--primary)' : 'var(--text-heading)' }}>
                          {step.name}
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4, margin: 0 }}>
                          {step.instructions || step.purpose}
                        </p>
                      </div>
                    </div>

                    {/* Mark as Done Button */}
                    <button
                      onClick={() => handleToggleTask(step, 'morning')}
                      className={`btn btn-sm ${done ? 'btn-primary' : 'btn-outline'}`}
                      style={{ flexShrink: 0, minWidth: '120px' }}
                    >
                      {done ? (
                        <>
                          <Check size={14} />
                          <span>Done ✓</span>
                        </>
                      ) : (
                        <span>Mark as Done</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Evening Routine Section */}
        {(activeTab === 'all' || activeTab === 'evening') && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Moon size={18} color="var(--accent-peach)" />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
                Evening Routine
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {eveningSteps.map((step, idx) => {
                const done = isStepCompleted(step.id);
                return (
                  <div
                    key={step.id || idx}
                    className={`checklist-item ${done ? 'done' : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          backgroundColor: done ? 'var(--primary)' : 'var(--peach-subtle)',
                          color: done ? '#FFFFFF' : 'var(--accent-peach)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      >
                        {done ? <Check size={15} /> : idx + 1}
                      </div>

                      <div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: done ? 'var(--primary)' : 'var(--text-heading)' }}>
                          {step.name}
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4, margin: 0 }}>
                          {step.instructions || step.purpose}
                        </p>
                      </div>
                    </div>

                    {/* Mark as Done Button */}
                    <button
                      onClick={() => handleToggleTask(step, 'evening')}
                      className={`btn btn-sm ${done ? 'btn-primary' : 'btn-outline'}`}
                      style={{ flexShrink: 0, minWidth: '120px' }}
                    >
                      {done ? (
                        <>
                          <Check size={14} />
                          <span>Done ✓</span>
                        </>
                      ) : (
                        <span>Mark as Done</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Patch-testing guidance */}
      <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--bg-card-subtle)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <Info size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong>Patch-Testing Guidance:</strong> Before applying any new face product, test a small pea-sized amount on your inner forearm or jawline for 24 hours to verify comfort. If persistent redness, itching, or swelling occurs, discontinue use and speak with a healthcare professional or dermatologist.
        </div>
      </div>
    </div>
  );
}
