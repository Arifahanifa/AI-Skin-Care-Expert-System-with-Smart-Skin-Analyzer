import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  XCircle,
  FlaskConical,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function SimulatorPage() {
  const [baselineData, setBaselineData] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  // Hypothetical overrides state
  const [hypoValues, setHypoValues] = useState({
    hydration: 45,
    oiliness: 75,
    sensitivity: 35,
    redness: 25,
    uv_index: 5,
    humidity: 45
  });

  useEffect(() => {
    async function loadBaseline() {
      try {
        const twinRes = await api.twin.getCurrent();
        const base = twinRes?.digital_twin?.metrics || {
          hydration: 55,
          oiliness: 60,
          sensitivity: 25,
          redness: 20,
          uv_index: 4,
          humidity: 50
        };
        setBaselineData(base);
        setHypoValues({
          hydration: base.hydration,
          oiliness: base.oiliness,
          sensitivity: base.sensitivity,
          redness: base.redness,
          uv_index: twinRes?.digital_twin?.environmental_context?.uv_index || 4,
          humidity: twinRes?.digital_twin?.environmental_context?.humidity || 50
        });

        // Run initial simulation
        const simRes = await api.simulation.run(base, {});
        setSimulationResult(simRes);
      } catch (err) {
        console.error('Error loading baseline for simulation:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBaseline();
  }, []);

  const handleSliderChange = (param, val) => {
    setHypoValues((prev) => ({ ...prev, [param]: Number(val) }));
  };

  const runSimulation = async () => {
    setSimulating(true);
    try {
      const res = await api.simulation.run(baselineData, hypoValues);
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Quick preset test buttons for Viva presentation
  const applyPreset = (presetName) => {
    let presetOverrides = {};
    if (presetName === 'spike_irritation') {
      presetOverrides = { sensitivity: 85, redness: 80, irritation: 70 };
    } else if (presetName === 'dehydrated_oily') {
      presetOverrides = { oiliness: 88, hydration: 20 };
    } else if (presetName === 'high_uv_arid') {
      presetOverrides = { uv_index: 9.5, humidity: 25, hydration: 30 };
    } else if (presetName === 'homeostasis') {
      presetOverrides = { hydration: 75, oiliness: 30, sensitivity: 15, redness: 15 };
    }

    setHypoValues((prev) => ({ ...prev, ...presetOverrides }));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div className="spinner" style={{ width: 44, height: 44, border: '4px solid #E8E2F2', borderTopColor: '#4A2285', borderRadius: '50%', margin: '0 auto 1rem' }} />
        <h3 style={{ color: '#1E1B4B', fontWeight: 700 }}>Initializing What-If Symbolic Scenario Engine...</h3>
      </div>
    );
  }

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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '999px', backgroundColor: '#FEF3C7', color: '#B45309', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            <FlaskConical size={14} />
            <span>Interactive FOAI Experimentation</span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#1E1B4B', lineHeight: 1.2 }}>
            What-If Scenario Simulator
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#64748B', marginTop: '0.375rem', maxWidth: '680px' }}>
            Modify hypothetical skin parameters in memory to observe real-time rule activations and operating mode shifts without modifying your saved twin.
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={simulating}
          className="btn btn-primary btn-lg"
          style={{ gap: '0.5rem' }}
        >
          <RefreshCw size={18} className={simulating ? 'spinner' : ''} />
          <span>Execute Simulation</span>
        </button>
      </div>

      {/* QUICK PRESET BUTTONS FOR COLLEGE VIVA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '16px', border: '1px solid #E8E2F2' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#4A2285' }}>
          Evaluator Quick Scenarios:
        </span>
        <button onClick={() => applyPreset('spike_irritation')} className="btn btn-secondary btn-sm" style={{ backgroundColor: '#FFF1F2', color: '#BE123C', borderColor: '#FECDD3' }}>
          Spike Sensitivity (Trigger Recovery Mode)
        </button>
        <button onClick={() => applyPreset('dehydrated_oily')} className="btn btn-secondary btn-sm">
          High Sebum + Low Water (Trigger R01)
        </button>
        <button onClick={() => applyPreset('high_uv_arid')} className="btn btn-secondary btn-sm">
          Extreme UV + Arid Humidity (Trigger R05 & R11)
        </button>
        <button onClick={() => applyPreset('homeostasis')} className="btn btn-secondary btn-sm" style={{ backgroundColor: '#F0FDF4', color: '#166534', borderColor: '#BBF7D0' }}>
          Optimal Homeostasis (Trigger R13)
        </button>
      </div>

      {/* TWO COLUMN COMPARISON: SLIDERS vs SIMULATION RESULTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1.4fr)', gap: '1.75rem' }}>
        {/* Left: Interactive Hypothetical Sliders */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1E1B4B' }}>
            Hypothetical Parameter Overrides
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>
            Adjust any value below, then click "Execute Simulation" to evaluate the production rules.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Hydration */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span className="form-label">Hypothetical Hydration</span>
                <span style={{ fontWeight: 700, color: '#0284C7' }}>{hypoValues.hydration}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={hypoValues.hydration}
                onChange={(e) => handleSliderChange('hydration', e.target.value)}
                className="range-slider"
              />
            </div>

            {/* Oiliness */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span className="form-label">Hypothetical Oiliness</span>
                <span style={{ fontWeight: 700, color: '#D97706' }}>{hypoValues.oiliness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={hypoValues.oiliness}
                onChange={(e) => handleSliderChange('oiliness', e.target.value)}
                className="range-slider"
              />
            </div>

            {/* Sensitivity */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span className="form-label">Hypothetical Sensitivity</span>
                <span style={{ fontWeight: 700, color: '#E11D48' }}>{hypoValues.sensitivity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={hypoValues.sensitivity}
                onChange={(e) => handleSliderChange('sensitivity', e.target.value)}
                className="range-slider"
              />
            </div>

            {/* Redness */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span className="form-label">Hypothetical Redness</span>
                <span style={{ fontWeight: 700, color: '#FB7185' }}>{hypoValues.redness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={hypoValues.redness}
                onChange={(e) => handleSliderChange('redness', e.target.value)}
                className="range-slider"
              />
            </div>

            {/* UV Index */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span className="form-label">Hypothetical UV Index</span>
                <span style={{ fontWeight: 700, color: '#4A2285' }}>{hypoValues.uv_index}</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={hypoValues.uv_index}
                onChange={(e) => handleSliderChange('uv_index', e.target.value)}
                className="range-slider"
              />
            </div>

            {/* Humidity */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span className="form-label">Hypothetical Humidity</span>
                <span style={{ fontWeight: 700, color: '#0D9488' }}>{hypoValues.humidity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                value={hypoValues.humidity}
                onChange={(e) => handleSliderChange('humidity', e.target.value)}
                className="range-slider"
              />
            </div>
          </div>
        </div>

        {/* Right: Comparative Outcomes (Baseline vs Hypothetical) */}
        {simulationResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Side-by-Side Mode & State Comparison Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Real Baseline */}
              <div className="card" style={{ padding: '1.25rem', backgroundColor: '#FAF9FE' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#6532B0', textTransform: 'uppercase' }}>
                  Real Baseline Twin
                </span>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1E1B4B', margin: '0.375rem 0' }}>
                  {simulationResult.baseline.primary_skin_state}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#475569' }}>
                  <span>Barrier Index:</span>
                  <strong>{simulationResult.baseline.barrier_health_index}/100</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#475569', marginTop: '2px' }}>
                  <span>Operating Mode:</span>
                  <strong>{simulationResult.baseline.operating_mode}</strong>
                </div>
              </div>

              {/* Hypothetical Twin */}
              <div
                className="card"
                style={{
                  padding: '1.25rem',
                  backgroundColor: simulationResult.hypothetical.operating_mode === 'RECOVERY_MODE' ? '#FFF5F5' : '#F0FDFA',
                  borderColor: simulationResult.hypothetical.operating_mode === 'RECOVERY_MODE' ? '#FDA4AF' : '#99F6E4'
                }}
              >
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: simulationResult.hypothetical.operating_mode === 'RECOVERY_MODE' ? '#E11D48' : '#0D9488',
                    textTransform: 'uppercase'
                  }}
                >
                  Hypothetical Scenario
                </span>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1E1B4B', margin: '0.375rem 0' }}>
                  {simulationResult.hypothetical.primary_skin_state}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#475569' }}>
                  <span>Barrier Shift:</span>
                  <strong style={{ color: simulationResult.barrier_index_change >= 0 ? '#0D9488' : '#E11D48' }}>
                    {simulationResult.hypothetical.barrier_health_index}/100 ({simulationResult.barrier_index_change > 0 ? '+' : ''}{simulationResult.barrier_index_change} pts)
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#475569', marginTop: '2px' }}>
                  <span>Operating Mode:</span>
                  <strong style={{ color: simulationResult.hypothetical.operating_mode === 'RECOVERY_MODE' ? '#E11D48' : '#4A2285' }}>
                    {simulationResult.hypothetical.operating_mode}
                  </strong>
                </div>
              </div>
            </div>

            {/* Newly Activated Rules */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <CheckCircle2 size={18} color="#0D9488" />
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E1B4B' }}>
                  Newly Activated Rules ({simulationResult.newly_activated_rules.length})
                </h4>
              </div>

              {simulationResult.newly_activated_rules.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {simulationResult.newly_activated_rules.map((r, i) => (
                    <div key={i} style={{ padding: '0.75rem', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0', fontSize: '0.8125rem' }}>
                      <div style={{ fontWeight: 700, color: '#166534' }}>
                        {r.rule_id}: {r.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                        Condition: {r.conditions_summary}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                  No new rules activated in this hypothetical state.
                </p>
              )}
            </div>

            {/* Deactivated Rules */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <XCircle size={18} color="#64748B" />
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E1B4B' }}>
                  Deactivated Rules ({simulationResult.deactivated_rules.length})
                </h4>
              </div>

              {simulationResult.deactivated_rules.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {simulationResult.deactivated_rules.map((r, i) => (
                    <div key={i} style={{ padding: '0.75rem', backgroundColor: '#FAF9FE', borderRadius: '8px', border: '1px solid #E8E2F2', fontSize: '0.8125rem' }}>
                      <div style={{ fontWeight: 700, color: '#475569' }}>
                        {r.rule_id}: {r.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                        Conditions no longer satisfied by hypothetical values.
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                  No baseline rules were deactivated.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
