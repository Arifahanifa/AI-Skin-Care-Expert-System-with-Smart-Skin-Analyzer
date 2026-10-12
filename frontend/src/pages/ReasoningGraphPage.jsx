import React, { useState, useEffect } from 'react';
import {
  GitFork,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowRight,
  Filter,
  Code2,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function ReasoningGraphPage() {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showTechnical, setShowTechnical] = useState(false);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'RULE', 'FACT', 'FUZZY', 'DERIVED'

  useEffect(() => {
    async function loadReasoning() {
      try {
        const res = await api.reasoning.explain();
        setGraphData(res);
        // Default select first fired rule if present
        const firstRule = res?.reasoning_graph?.nodes?.find((n) => n.type === 'RULE');
        if (firstRule) setSelectedNode(firstRule);
      } catch (err) {
        console.error('Error fetching reasoning graph:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReasoning();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div className="spinner" style={{ width: 44, height: 44, border: '4px solid #E8E2F2', borderTopColor: '#4A2285', borderRadius: '50%', margin: '0 auto 1rem' }} />
        <h3 style={{ color: '#1E1B4B', fontWeight: 700 }}>Synthesizing Explainable AI (XAI) Reasoning Path...</h3>
        <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Tracing forward-chaining activation agenda</p>
      </div>
    );
  }

  if (!graphData || !graphData.reasoning_graph) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <GitFork size={48} color="#C9B8EB" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E1B4B' }}>No Inference Path Available</h2>
        <p style={{ color: '#64748B', maxWidth: '480px', margin: '0.5rem auto 1.5rem' }}>
          Execute a skin assessment to generate a complete forward-chaining inference trace.
        </p>
      </div>
    );
  }

  const { nodes, edges, technical_summary, execution_trace } = graphData.reasoning_graph;

  const filteredNodes = nodes.filter((n) => {
    if (filterType === 'ALL') return true;
    return n.type === filterType;
  });

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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '999px', backgroundColor: '#E6FFFA', color: '#0D9488', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            <GitFork size={14} />
            <span>Signature Innovation #2</span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#1E1B4B', lineHeight: 1.2 }}>
            Explain My Skin: AI Reasoning Graph
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#64748B', marginTop: '0.375rem', maxWidth: '680px' }}>
            Dynamic Explainable AI (XAI) causal graph tracing verified production rules from raw observations to asserted recommendations.
          </p>
        </div>

        <button
          onClick={() => setShowTechnical(!showTechnical)}
          className="btn btn-secondary"
          style={{ gap: '0.5rem' }}
        >
          <Cpu size={16} color="#6532B0" />
          <span>{showTechnical ? 'Hide Technical FOAI Proof' : 'FOAI Evaluator Reasoning'}</span>
          {showTechnical ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* EXPANDABLE FOAI TECHNICAL EVALUATOR SECTION */}
      {showTechnical && (
        <div className="card" style={{ backgroundColor: '#FAF9FE', borderColor: '#D4C5F9', borderLeft: '4px solid #4A2285' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Code2 size={22} color="#4A2285" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E1B4B' }}>
              FOAI Formal System Specification
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid #E8E0F7' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6532B0' }}>Knowledge Representation:</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1E1B4B', marginTop: '2px' }}>
                Production System ⟨W, R, E⟩
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                Working memory size: {technical_summary.working_memory_size} facts.
              </p>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid #E8E0F7' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6532B0' }}>Fuzzy Logic Operator:</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1E1B4B', marginTop: '2px' }}>
                Zadeh t-norm Conjunction
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }} className="font-mono">
                μ(A ∩ B) = min(μ_A, μ_B)
              </p>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid #E8E0F7' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6532B0' }}>Convergence & Conflict:</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1E1B4B', marginTop: '2px' }}>
                Static Priority Ordering
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                Quiescence reached in {technical_summary.cycles_to_quiescence} cycle(s).
              </p>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E1B4B', marginBottom: '0.5rem' }}>
              Unsatisfied Rules Analysis (Negative Proof):
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
              {technical_summary.unfired_summary?.map((u, i) => (
                <div key={i} style={{ backgroundColor: '#FFFFFF', padding: '0.625rem 0.875rem', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E8E2F2' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#64748B' }}>{u.rule_id}: {u.name}</span>
                    <span style={{ color: '#94A3B8', marginLeft: '0.5rem' }}>({u.conditions})</span>
                  </div>
                  <span style={{ fontWeight: 600, color: '#94A3B8' }}>Unsatisfied</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKBENCH: INTERACTIVE REASONING GRAPH + NODE INSPECTOR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(340px, 1fr)', gap: '1.75rem', alignItems: 'start' }}>
        {/* Left: Interactive Node Canvas */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1E1B4B' }}>
                Reasoning Network Nodes
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Click any node to inspect condition breakdown, fuzzy membership degrees, and asserted facts
              </p>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#F1ECF8', padding: '3px', borderRadius: '8px' }}>
              {['ALL', 'FACT', 'FUZZY', 'RULE', 'DERIVED'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  style={{
                    border: 'none',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: filterType === t ? '#FFFFFF' : 'transparent',
                    color: filterType === t ? '#4A2285' : '#64748B'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Graph Nodes Grid / Pipeline Display */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.875rem',
              maxHeight: '560px',
              overflowY: 'auto',
              padding: '0.5rem',
              backgroundColor: '#FAF9FE',
              borderRadius: '16px',
              border: '1px solid #ECE4F7'
            }}
          >
            {filteredNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              let badgeColor = '#4A2285';
              let badgeBg = '#EDE7F8';
              let borderStyle = '1px solid #E8E2F2';

              if (node.type === 'FACT') {
                badgeColor = '#0284C7';
                badgeBg = '#E0F2FE';
              } else if (node.type === 'FUZZY') {
                badgeColor = '#D97706';
                badgeBg = '#FEF3C7';
              } else if (node.type === 'RULE') {
                badgeColor = '#4A2285';
                badgeBg = '#EDE7F8';
                borderStyle = '1.5px solid #C4B5E0';
              } else if (node.type === 'DERIVED') {
                badgeColor = '#0D9488';
                badgeBg = '#CCFBF1';
              } else if (node.type === 'ACTION') {
                badgeColor = '#BE123C';
                badgeBg = '#FFE4E6';
              }

              if (isSelected) {
                borderStyle = '2px solid #4A2285';
              }

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  style={{
                    backgroundColor: isSelected ? '#FFFFFF' : '#FFFFFF',
                    borderRadius: '12px',
                    padding: '0.875rem 1.125rem',
                    border: borderStyle,
                    boxShadow: isSelected ? '0 4px 16px rgba(74, 34, 133, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 150ms ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor: badgeBg,
                        color: badgeColor
                      }}
                    >
                      {node.type}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E1B4B' }}>
                      {node.label}
                    </span>
                  </div>

                  <ArrowRight size={15} color={isSelected ? '#4A2285' : '#CBD5E1'} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Dynamic Inspector Panel */}
        <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '90px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid #F1EDF8', marginBottom: '1rem' }}>
            <Info size={18} color="#6532B0" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1E1B4B' }}>
              Node Detail Inspector
            </h3>
          </div>

          {selectedNode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '0.25rem' }}>
                  {selectedNode.type} • {selectedNode.category}
                </span>
                <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1E1B4B', marginTop: '0.25rem' }}>
                  {selectedNode.label}
                </h4>
              </div>

              {/* RULE SPECIFIC INSPECTION */}
              {selectedNode.type === 'RULE' && (
                <>
                  <div style={{ padding: '0.75rem', backgroundColor: '#FAF9FE', borderRadius: '10px', border: '1px solid #EBE3F7' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6532B0' }}>IF-THEN Logic:</div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1E1B4B', marginTop: '2px' }}>
                      {selectedNode.data.conditions_summary}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                      Antecedent Conditions Evaluation:
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.375rem' }}>
                      {selectedNode.data.condition_details?.map((cond, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: cond.satisfied ? '#F0FDF4' : '#FFF1F2',
                            border: `1px solid ${cond.satisfied ? '#BBF7D0' : '#FECDD3'}`,
                            borderRadius: '8px',
                            fontSize: '0.75rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                            <span style={{ color: '#1E1B4B' }}>{cond.parameter}</span>
                            <span style={{ color: cond.satisfied ? '#0D9488' : '#E11D48' }}>
                              {cond.satisfied ? 'Satisfied' : 'Not Satisfied'}
                            </span>
                          </div>
                          <div style={{ color: '#64748B', marginTop: '2px' }}>
                            Required: {cond.required_threshold} | Actual: <strong>{cond.actual_value}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem', backgroundColor: '#FAF9FE', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6532B0' }}>Academic FOAI Rationale:</div>
                    <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                      {selectedNode.data.faculty_rationale}
                    </p>
                  </div>
                </>
              )}

              {/* FUZZY SPECIFIC INSPECTION */}
              {selectedNode.type === 'FUZZY' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: '#FFFBEB', borderRadius: '10px', border: '1px solid #FDE68A' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B45309' }}>Fuzzy Linguistic Degree:</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#78350F', marginTop: '2px' }}>
                      μ = {selectedNode.data.membership_degree?.toFixed(2)} ({selectedNode.data.dominant_term})
                    </div>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.4 }}>
                    {selectedNode.data.explanation}
                  </p>
                </div>
              )}

              {/* DERIVED FACT INSPECTION */}
              {selectedNode.type === 'DERIVED' && (
                <div style={{ padding: '0.75rem', backgroundColor: '#F0FDFA', borderRadius: '10px', border: '1px solid #99F6E4' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F766E' }}>Asserted Into Working Memory:</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#134E4A', marginTop: '2px' }}>
                    {selectedNode.data.fact_key} = {String(selectedNode.data.fact_value)}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
                    Asserted by Rule {selectedNode.data.source_rule}
                  </span>
                </div>
              )}

              {/* ACTION SPECIFIC INSPECTION */}
              {selectedNode.type === 'ACTION' && (
                <div style={{ padding: '0.75rem', backgroundColor: '#FFF1F2', borderRadius: '10px', border: '1px solid #FECDD3' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#BE123C' }}>Decision Guidance:</div>
                  <p style={{ fontSize: '0.8125rem', color: '#1E1B4B', marginTop: '2px', lineHeight: 1.4 }}>
                    {selectedNode.data.action}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94A3B8', fontSize: '0.875rem' }}>
              Select any node on the left to inspect its parameters.
            </div>
          )}
        </div>
      </div>

      {/* FULL EXECUTION TRACE LOG (AUDIT TRAIL) */}
      <div className="card">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1E1B4B', marginBottom: '0.75rem' }}>
          Rule Execution Trace & Cycle Log
        </h3>
        <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '1rem' }}>
          Chronological cycle-by-cycle trace recorded during forward-chaining evaluation.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAF9FE', borderBottom: '1.5px solid #E8E2F2', textAlign: 'left' }}>
                <th style={{ padding: '0.625rem 0.75rem', color: '#4A2285' }}>Cycle</th>
                <th style={{ padding: '0.625rem 0.75rem', color: '#4A2285' }}>Rule ID</th>
                <th style={{ padding: '0.625rem 0.75rem', color: '#4A2285' }}>Name</th>
                <th style={{ padding: '0.625rem 0.75rem', color: '#4A2285' }}>Priority</th>
                <th style={{ padding: '0.625rem 0.75rem', color: '#4A2285' }}>Strength (μ)</th>
                <th style={{ padding: '0.625rem 0.75rem', color: '#4A2285' }}>Asserted Fact</th>
              </tr>
            </thead>
            <tbody>
              {execution_trace.map((tr, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #F1EDF8' }}>
                  <td style={{ padding: '0.625rem 0.75rem', fontWeight: 700, color: '#64748B' }}>#{tr.cycle}</td>
                  <td style={{ padding: '0.625rem 0.75rem', fontWeight: 700, color: '#4A2285' }}>{tr.rule_id}</td>
                  <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600, color: '#1E1B4B' }}>{tr.name}</td>
                  <td style={{ padding: '0.625rem 0.75rem', color: '#64748B' }}>{tr.priority}</td>
                  <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600, color: '#0D9488' }}>
                    {tr.activation_strength?.toFixed(2) || '1.00'}
                  </td>
                  <td style={{ padding: '0.625rem 0.75rem', color: '#475569' }} className="font-mono">
                    {JSON.stringify(tr.consequents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
