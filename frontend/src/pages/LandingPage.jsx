import React from 'react';
import {
  Camera,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  LogIn,
  Heart,
  ShieldCheck
} from 'lucide-react';

export default function LandingPage({ onStartAnalysis, onNavigate, onOpenAuth }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: '1040px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* HERO SECTION */}
      <section
        className="card"
        style={{
          padding: '3.5rem 2.5rem',
          borderRadius: '24px',
          border: '1.5px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '1.5rem',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.35rem 0.85rem', borderRadius: '999px', backgroundColor: 'var(--primary-subtle)', border: '1px solid var(--green-border)' }}>
          <Sparkles size={15} color="var(--primary)" />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            AI Skincare Expert System
          </span>
        </div>

        <h1 style={{ fontSize: '2.75rem', fontWeight: 800, color: 'var(--text-heading)', lineHeight: 1.2, maxWidth: '780px', margin: 0 }}>
          Gentle, Evidence-Based Skincare <br />
          <span style={{ color: 'var(--primary)' }}>Clear, Honest & Tailored</span>
        </h1>

        <p style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '640px', margin: 0 }}>
          Capture a quick webcam photo to verify lighting and focus, answer 3 simple questions about how your skin feels, and get an everyday morning and evening routine tailored to your skin.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <button
            onClick={onStartAnalysis}
            className="btn btn-primary btn-lg"
            style={{ gap: '0.5rem', padding: '0.85rem 1.75rem' }}
          >
            <Camera size={18} />
            <span>Start Skin Check</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={onOpenAuth}
            className="btn btn-secondary btn-lg"
            style={{ padding: '0.85rem 1.5rem', gap: '0.4rem' }}
          >
            <LogIn size={18} color="var(--primary)" />
            <span>Sign In / Register</span>
          </button>

          <button
            onClick={() => onNavigate('my-routine')}
            className="btn btn-outline btn-lg"
            style={{ padding: '0.85rem 1.5rem', gap: '0.4rem' }}
          >
            <Sparkles size={18} color="var(--text-secondary)" />
            <span>View Routine Steps</span>
          </button>
        </div>
      </section>

      {/* THREE SIMPLE STEP CARDS */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={22} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
            1. Real Camera Check
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Real-time face detection checks your framing, brightness, and sharpness right in your browser using computer vision.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: 'var(--peach-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={22} color="var(--accent-peach)" />
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
            2. Simple Questions
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Answer 3 straightforward questions about how your skin feels, your main concern, and post-wash comfort.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={22} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
            3. Daily Care Checklist
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Follow clean morning and evening routines. Mark steps as done each day and keep track of your consistency.
          </p>
        </div>
      </section>

      {/* SYSTEM TRANSPARENCY NOTICE */}
      <section
        style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '14px',
          backgroundColor: 'var(--bg-card-subtle)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem'
        }}
      >
        <ShieldCheck size={24} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          <strong>System Transparency:</strong> Built as a rule-based expert system utilizing traditional computer vision (OpenCV Haar Cascades & Laplacian variance). No black-box machine learning, deep learning, or external paid APIs are used.
        </div>
      </section>
    </div>
  );
}
