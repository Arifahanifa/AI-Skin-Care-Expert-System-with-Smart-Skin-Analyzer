import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Scale,
  Cpu,
  Layers,
  CheckCircle2,
  Filter,
  Code2
} from 'lucide-react';
import { api } from '../services/api';

export default function KnowledgeBasePage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    async function loadRules() {
      try {
        const res = await api.knowledgeBase.getRules();
        setRules(res?.rules || []);
      } catch (err) {
        console.error('Error fetching knowledge base:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRules();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div className="spinner" style={{ width: 44, height: 44, border: '4px solid #E8E2F2', borderTopColor: '#4A2285', borderRadius: '50%', margin: '0 auto 1rem' }} />
        <h3 style={{ color: '#1E1B4B', fontWeight: 700 }}>Loading Centralized Rule Base...</h3>
      </div>
    );
  }

  const categories = ['ALL', ...new Set(rules.map((r) => r.category))];

  const filteredRules = rules.filter((r) => {
    if (selectedCategory === 'ALL') return true;
    return r.category === selectedCategory;
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '999px', backgroundColor: '#EDE7F8', color: '#4A2285', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            <BookOpen size={14} />
            <span>Academic Knowledge Base</span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#1E1B4B', lineHeight: 1.2 }}>
            FOAI Production Rule Repository
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#64748B', marginTop: '0.375rem', maxWidth: '680px' }}>
            Complete formal specification of all {rules.length} production rules, fuzzy antecedents, priorities, and conflict-resolution strategies.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="btn btn-sm"
              style={{
                backgroundColor: selectedCategory === cat ? '#4A2285' : '#FFFFFF',
                color: selectedCategory === cat ? '#FFFFFF' : '#475569',
                border: '1px solid #D8C7F2'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Rules Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {filteredRules.map((r) => (
          <div key={r.rule_id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <span className="badge badge-primary">{r.rule_id}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '0.5rem' }}>
                  {r.category}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4A2285', background: '#F1ECFA', padding: '2px 8px', borderRadius: '4px' }}>
                Priority: {r.priority}
              </span>
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1E1B4B', marginBottom: '0.5rem' }}>
              {r.name}
            </h3>

            <div style={{ backgroundColor: '#FAF9FE', padding: '0.75rem', borderRadius: '10px', border: '1px solid #EBE3F7', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#6532B0', textTransform: 'uppercase' }}>Antecedent (IF):</div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1E1B4B', marginTop: '2px' }} className="font-mono">
                {r.conditions_summary}
              </div>
            </div>

            <div style={{ backgroundColor: '#F0FDFA', padding: '0.75rem', borderRadius: '10px', border: '1px solid #99F6E4', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#0F766E', textTransform: 'uppercase' }}>Consequent (THEN Assert):</div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#134E4A', marginTop: '2px' }} className="font-mono">
                {JSON.stringify(r.consequents)}
              </div>
            </div>

            <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              {r.description}
            </p>

            <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #F1EDF8', fontSize: '0.75rem', color: '#64748B' }}>
              <strong>FOAI Rationale:</strong> {r.faculty_rationale}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
