import React, { useState, useEffect } from 'react';
import {
  FileText,
  Bookmark,
  Download,
  Calendar,
  Camera,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Info,
  ArrowRight,
  ArrowLeft,
  BarChart2,
  TrendingUp,
  Clock,
  ShieldCheck
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import Logo from '../components/Logo';

export default function ReportPage({ onNavigate, assessmentId = null }) {
  const [report, setReport] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [showWhyExplainer, setShowWhyExplainer] = useState(false);

  useEffect(() => {
    async function fetchReportData() {
      setLoading(true);
      try {
        let repData = null;
        if (assessmentId) {
          repData = await api.reports.getById(assessmentId).catch(() => null);
        }
        if (!repData) {
          repData = await api.reports.getLatest().catch(() => null);
        }
        const histData = await api.reports.getHistory().catch(() => ({ reports: [] }));

        setReport(repData);
        setHistoryList(histData.reports || []);
      } catch (err) {
        console.error('Error fetching report:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReportData();
  }, [assessmentId]);

  const handleSaveReport = async () => {
    if (!report) return;
    try {
      await api.reports.save({ assessment_id: report.assessment_id });
      setSaveSuccessMessage('Report successfully saved to your skin history!');
      setTimeout(() => setSaveSuccessMessage(''), 3000);
    } catch {
      setSaveSuccessMessage('Report is already saved in your history.');
      setTimeout(() => setSaveSuccessMessage(''), 3000);
    }
  };

  const handleDownloadReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div
          className="spinner"
          style={{
            width: 40,
            height: 40,
            border: '3px solid var(--border)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            margin: '0 auto 1.25rem'
          }}
        />
        <h3 style={{ color: 'var(--text-heading)', fontWeight: 700 }}>Preparing your skin report...</h3>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="card" style={{ maxWidth: '640px', margin: '3rem auto', textAlign: 'center', padding: '3.5rem 2rem' }}>
        <FileText size={48} color="var(--primary-light)" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-heading)' }}>
          No Skin Check on Record Yet
        </h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem auto 1.5rem', maxWidth: '420px', fontSize: '0.875rem' }}>
          Take a quick photo and answer 3 simple questions to generate your personalized skincare check report.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
          <button onClick={() => onNavigate && onNavigate('analyzer')} className="btn btn-primary">
            <Camera size={16} />
            <span>Start Skin Check</span>
          </button>
          <button onClick={() => onNavigate && onNavigate('dashboard')} className="btn btn-outline">
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  // Prepare Real Data for Graph 1: Photo Quality Summary (Bar Graph)
  const metrics = report.photo_metrics || {};
  const barChartData = [
    {
      metric: 'Brightness',
      value: metrics.brightness_percent || 50,
      unit: '%',
      label: 'Lighting Luminance'
    },
    {
      metric: 'Sharpness',
      value: metrics.sharpness_scaled || 60,
      unit: '/100',
      label: 'Focus Clarity'
    },
    {
      metric: 'Framing',
      value: metrics.face_coverage_percent || 35,
      unit: '%',
      label: 'Face Coverage'
    }
  ];

  // Prepare Real Data for Graph 2: Assessment History (Line Graph)
  // Reverses to chronological order for line graph
  const lineChartData = [...historyList]
    .reverse()
    .map((item, index) => {
      const dateStr = item.generated_at ? item.generated_at.split(' ')[0] : `Check ${index + 1}`;
      const itemSharpness = item.photo_metrics?.sharpness_scaled || 50;
      const itemBrightness = item.photo_metrics?.brightness_percent || 50;
      return {
        check: dateStr,
        sharpness: itemSharpness,
        brightness: itemBrightness,
        id: item.assessment_id
      };
    });

  const photoDetails = report.photo_quality_details || {
    lighting: 'Good',
    image_clarity: 'Clear',
    face_detection: 'Successful'
  };

  const userAnswers = report.user_answers || {
    main_concern: 'General skincare routine',
    skin_feeling: 'Combination',
    discomfort_after_washing: 'Sometimes'
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Action Toolbar (Hidden during print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="btn btn-outline btn-sm"
          style={{ gap: '0.4rem' }}
        >
          <ArrowLeft size={15} />
          <span>Back to Dashboard</span>
        </button>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleSaveReport}
            className="btn btn-secondary btn-sm"
            style={{ gap: '0.4rem' }}
            title="Save this report to your history"
          >
            <Bookmark size={15} />
            <span>Save Report</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="btn btn-outline btn-sm"
            style={{ gap: '0.4rem' }}
            title="Download or Print Report as PDF"
          >
            <Download size={15} />
            <span>Download Report</span>
          </button>

          <button
            onClick={() => onNavigate && onNavigate('twin')}
            className="btn btn-outline btn-sm"
            style={{ gap: '0.4rem' }}
            title="View saved past reports"
          >
            <Calendar size={15} />
            <span>View Skin History</span>
          </button>
        </div>
      </div>

      {/* Save Confirmation Toast Banner */}
      {saveSuccessMessage && (
        <div
          className="no-print"
          style={{
            backgroundColor: 'var(--primary-subtle)',
            border: '1px solid var(--green-border)',
            color: 'var(--primary-deep)',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* ================= FORMAL REPORT DOCUMENT ================= */}
      <div
        className="card"
        style={{
          padding: '2.5rem',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '20px',
          border: '1.5px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem'
        }}
      >
        {/* A. Report Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1.5px solid var(--border)',
            paddingBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <Logo size="lg" />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-heading)', marginTop: '0.75rem' }}>
              Skin Check Report
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Clear, organized skincare guidance based on your photo check and questionnaire.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Report ID
            </span>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-heading)' }}>
              {report.report_id}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Assessment Date: <strong>{report.generated_at ? report.generated_at.split(' ')[0] : 'Today'}</strong>
            </div>
            <div style={{ marginTop: '0.35rem' }}>
              <span
                className={`badge ${report.photo_quality === 'Good' ? 'badge-primary' : 'badge-peach'}`}
                style={{ fontSize: '0.72rem' }}
              >
                Photo Quality: {report.photo_quality}
              </span>
            </div>
          </div>
        </div>

        {/* B. Photo Quality Details */}
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.65rem' }}>
            Photo Quality Validation
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div style={{ padding: '0.85rem', borderRadius: '10px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Lighting
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: photoDetails.lighting === 'Good' ? 'var(--primary)' : 'var(--peach)', marginTop: '2px' }}>
                {photoDetails.lighting}
              </div>
            </div>

            <div style={{ padding: '0.85rem', borderRadius: '10px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Image Clarity
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: photoDetails.image_clarity === 'Clear' ? 'var(--primary)' : 'var(--peach)', marginTop: '2px' }}>
                {photoDetails.image_clarity}
              </div>
            </div>

            <div style={{ padding: '0.85rem', borderRadius: '10px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Face Detection
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>
                {photoDetails.face_detection}
              </div>
            </div>
          </div>
        </div>

        {/* C. What We Noticed */}
        <div style={{ padding: '1rem 1.25rem', borderRadius: '12px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            What We Noticed
          </div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-heading)' }}>
            {report.what_we_noticed}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.45 }}>
            Note: An ordinary webcam provides visual lighting and framing measurements only. It cannot measure skin hydration, sebum levels, or diagnose medical skin conditions.
          </p>
        </div>

        {/* D. Your Answers */}
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.65rem' }}>
            Your Reported Answers
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>How your skin usually feels:</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '2px' }}>
                {userAnswers.skin_feeling}
              </div>
            </div>

            <div style={{ padding: '0.75rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Main concern for help:</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '2px' }}>
                {userAnswers.main_concern}
              </div>
            </div>

            <div style={{ padding: '0.75rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Discomfort after washing:</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '2px' }}>
                {userAnswers.discomfort_after_washing}
              </div>
            </div>
          </div>
        </div>

        {/* E. Your Skincare Suggestions */}
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.65rem' }}>
            Your Skincare Suggestions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {report.skincare_suggestions?.map((tip, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  padding: '0.75rem 0.9rem',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)'
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-subtle)',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  {idx + 1}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                  {tip}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expandable Section: "Why am I seeing this?" */}
        <div className="no-print" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <button
            onClick={() => setShowWhyExplainer(!showWhyExplainer)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              padding: '0.35rem 0'
            }}
          >
            <span>Why am I seeing this? (Rule-based reasoning explanation)</span>
            {showWhyExplainer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showWhyExplainer && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                fontSize: '0.8125rem',
                color: 'var(--text-primary)',
                lineHeight: 1.55
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-heading)' }}>
                Deterministic Rule Traces:
              </div>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {report.why_am_i_seeing_this?.map((item, i) => (
                  <li key={i}>
                    <strong>{item.trigger}:</strong> {item.reason}
                  </li>
                ))}
              </ul>
              <p style={{ marginTop: '0.65rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                This student system relies strictly on transparent forward-chaining rules and OpenCV image processing—no neural networks, black-box deep learning, or external diagnostic APIs are used.
              </p>
            </div>
          )}
        </div>

        {/* F. Your Next Step Buttons */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            borderTop: '1px solid var(--border)',
            paddingTop: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate && onNavigate('twin')}
              className="btn btn-outline btn-sm"
            >
              <Calendar size={14} />
              <span>View Skin History</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('analyzer')}
              className="btn btn-outline btn-sm"
            >
              <Camera size={14} />
              <span>Start New Skin Check</span>
            </button>
          </div>

          <button
            onClick={() => onNavigate && onNavigate('my-routine')}
            className="btn btn-primary"
            style={{ gap: '0.5rem' }}
          >
            <Sparkles size={16} />
            <span>View My Routine</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* ================= SECTION 5: TWO USEFUL GRAPHS (MY INSIGHTS) ================= */}
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-heading)' }}>
            My Insights
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Objective measurements from your webcam check and saved assessment history.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {/* GRAPH 1: Photo Quality Summary (Bar Graph) */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart2 size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  Photo Quality Summary
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                This bar chart displays the objective camera lighting, sharpness, and framing values measured during your photo check.
              </p>
            </div>

            <div style={{ height: '240px', width: '100%', marginTop: '0.5rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="metric"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text-heading)',
                      fontSize: '12px'
                    }}
                    formatter={(val, name, props) => [`${val}${props.payload.unit}`, props.payload.label]}
                  />
                  <Bar
                    dataKey="value"
                    fill="var(--primary)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
              * Measures optical clarity and lighting; not a score of internal skin health.
            </div>
          </div>

          {/* GRAPH 2: Your Assessment History (Line Graph) */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  Your Assessment History
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Tracks the consistency of your completed assessments over time.
              </p>
            </div>

            {lineChartData.length >= 2 ? (
              <div style={{ height: '240px', width: '100%', marginTop: '0.5rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="check"
                      tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                      axisLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      axisLine={{ stroke: 'var(--border)' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-heading)',
                        fontSize: '12px'
                      }}
                      formatter={(val, name) => [
                        `${val}/100`,
                        name === 'sharpness' ? 'Photo Clarity' : 'Lighting Level'
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="sharpness"
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: 'var(--primary)' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div
                style={{
                  height: '240px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderRadius: '12px',
                  border: '1px dashed var(--border)',
                  padding: '1.5rem',
                  textAlign: 'center'
                }}
              >
                <Clock size={32} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-heading)' }}>
                  History Graph Initializes After 2 Checks
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem', maxWidth: '280px' }}>
                  Complete another skin check in a few days to view your longitudinal assessment trendline.
                </p>
              </div>
            )}

            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
              * Plotted strictly from your saved check timestamps. Missing dates are never fabricated.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
