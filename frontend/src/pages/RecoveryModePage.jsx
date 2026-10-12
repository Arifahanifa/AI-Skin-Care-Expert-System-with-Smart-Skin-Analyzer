import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Ban,
  CheckCircle2,
  HeartHandshake,
  Clock,
  ArrowRight,
  Info,
  Stethoscope,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function RecoveryModePage({ onNewAssessment, onNavigate }) {
  const [recoveryData, setRecoveryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await api.recovery.getStatus();
        setRecoveryData(res);
      } catch (err) {
        console.error('Error loading recovery status:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStatus();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div className="spinner" style={{ width: 44, height: 44, border: '4px solid #E8E2F2', borderTopColor: '#E11D48', borderRadius: '50%', margin: '0 auto 1rem' }} />
        <h3 style={{ color: '#1E1B4B', fontWeight: 700 }}>Checking Cutaneous Safety & Recovery Status...</h3>
      </div>
    );
  }

  const isRecovery = recoveryData?.is_recovery_active;
  const isMedicalAlert = recoveryData?.professional_alert;
  const firedRules = recoveryData?.recovery_rules_fired || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        className={isRecovery ? 'card-recovery' : 'card'}
        style={{
          borderRadius: '24px',
          padding: '2.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: isRecovery ? '0 12px 36px rgba(225, 29, 72, 0.12)' : 'var(--shadow-md)'
        }}
      >
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '999px', backgroundColor: isRecovery ? '#FFE4E6' : '#EDE7F8', color: isRecovery ? '#BE123C' : '#4A2285', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            <ShieldAlert size={14} />
            <span>Signature Innovation #3</span>
          </div>

          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: isRecovery ? '#BE123C' : '#1E1B4B', lineHeight: 1.2 }}>
            Adaptive Skin Recovery Mode
          </h1>

          <p style={{ fontSize: '1rem', color: isRecovery ? '#9F1239' : '#475569', marginTop: '0.5rem', lineHeight: 1.5 }}>
            {isRecovery ? (
              <>
                <strong>CIRCUIT BREAKER ENGAGED:</strong> Concerning neurosensory hyperreactivity or acute erythema was detected by your rules.
                Normal cosmetic suggestions are locked out to protect epidermal barrier integrity.
              </>
            ) : (
              'Skin Recovery Mode is currently INACTIVE. Your barrier parameters do not breach acute irritation thresholds. The circuit breaker stands on standby.'
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onNewAssessment} className="btn btn-primary" style={{ backgroundColor: isRecovery ? '#E11D48' : '#4A2285' }}>
            <RefreshCw size={16} />
            <span>Record Follow-Up Assessment</span>
          </button>
        </div>
      </div>

      {/* CRITICAL MEDICAL ALERT IF R04 FIRED */}
      {isMedicalAlert && (
        <div style={{ backgroundColor: '#FFF1F2', border: '2px solid #E11D48', borderRadius: '18px', padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#FFE4E6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Stethoscope size={24} color="#E11D48" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#BE123C' }}>
              ⚠️ Mandatory Clinical Dermatological Referral Alert (R04)
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#881337', marginTop: '0.375rem', lineHeight: 1.5 }}>
              Your reported symptoms (such as blistering, chronic swelling, severe pain, or bleeding lesions) fall outside educational decision-support boundaries. 
              <strong> Cease all cosmetic applications and consult a board-certified dermatologist or healthcare professional immediately.</strong>
            </p>
          </div>
        </div>
      )}

      {/* WHY RECOVERY MODE TRIGGERED: RULES AUDIT */}
      <div className="card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E1B4B', marginBottom: '0.5rem' }}>
          Exact Rules Triggering Recovery Mode
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1.25rem' }}>
          The expert system does not guess. Recovery Mode is activated strictly when verified production rules fire:
        </p>

        {firedRules.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {firedRules.map((rule, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: '#FFF9F9',
                  border: '1.5px solid #FDA4AF',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, color: '#E11D48', fontSize: '0.875rem' }}>
                      {rule.rule_id}
                    </span>
                    <span style={{ fontWeight: 700, color: '#1E1B4B', fontSize: '0.9375rem' }}>
                      {rule.name}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '4px', fontFamily: 'monospace' }}>
                    Condition: {rule.conditions_summary}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#881337', marginTop: '4px' }}>
                    {rule.description}
                  </p>
                </div>
                <span className="badge badge-coral">RULE FIRED</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '1.5rem', backgroundColor: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0', color: '#166534', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={20} color="#166534" />
            <span>No acute irritation rules are active in your latest assessment.</span>
          </div>
        )}
      </div>

      {/* STRICT ACTIVE INGREDIENT EMBARGO (R08 ENFORCEMENT) */}
      <div className="card" style={{ borderColor: '#FECDD3' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Ban size={22} color="#E11D48" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E1B4B' }}>
            Active Cosmetic Ingredient Embargo (Rule R08)
          </h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1.25rem' }}>
          While Recovery Mode is active, all exfoliating, stimulating, and low-pH active formulations are strictly locked out:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {[
            { name: 'Chemical Exfoliants (AHA/BHA)', why: 'Glycolic, Salicylic, and Lactic acids penetrate disrupted stratum corneum, worsening inflammation.' },
            { name: 'Retinoids & Retinol', why: 'Accelerates cell turnover and down-regulates ceramides during acute barrier trauma.' },
            { name: 'Pure L-Ascorbic Acid (Vitamin C)', why: 'Low acidic pH (< 3.5) creates stinging and triggers vascular neuro-erythema.' },
            { name: 'Physical Scrubs & Cleansing Brushes', why: 'Mechanical friction shears fragile desmosomes and tears newly regenerating corneal cells.' }
          ].map((item, idx) => (
            <div key={idx} style={{ backgroundColor: '#FFF5F5', padding: '1rem', borderRadius: '12px', border: '1px solid #FED7D7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#C53030', fontWeight: 700, fontSize: '0.875rem' }}>
                <Ban size={16} />
                <span>{item.name}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#742A2A', marginTop: '0.375rem', lineHeight: 1.4 }}>
                {item.why}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* GENTLE RECOVERY ROUTINE PROTOCOL */}
      <div className="card" style={{ backgroundColor: '#FAF9FE', borderColor: '#E0D4F5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <HeartHandshake size={22} color="#4A2285" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E1B4B' }}>
            Gentle Physiological Barrier Protocol
          </h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1.25rem' }}>
          Focus exclusively on non-stripping hygiene, soothing osmoprotectants, and physiological lipid replenishment:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E8E0F7' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#6532B0', textTransform: 'uppercase' }}>Step 1: Cleanse</span>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E1B4B', margin: '0.25rem 0' }}>Tepid Water & Non-Foaming Cleanser</h4>
            <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
              Wash face with lukewarm/tepid water. If using cleanser, select a lotion/milk cleanser buffered at pH 5.5 without fragrance or sulfates.
            </p>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E8E0F7' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#6532B0', textTransform: 'uppercase' }}>Step 2: Soothe</span>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E1B4B', margin: '0.25rem 0' }}>Centella & Thermal Mist</h4>
            <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
              Mist face with mineral thermal spring water or apply a high-purity Madecassoside / Panthenol (B5) essence to damp skin.
            </p>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '14px', border: '1px solid #E8E0F7' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#6532B0', textTransform: 'uppercase' }}>Step 3: Seal</span>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E1B4B', margin: '0.25rem 0' }}>Ceramide & Squalane Barrier Cocoon</h4>
            <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
              Seal skin with a physiological ceramide barrier cream. For micro-cracking, apply a thin layer of pure petroleum jelly or squalane over dry patches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
