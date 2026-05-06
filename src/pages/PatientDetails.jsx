import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Activity, AlertTriangle, ArrowLeft, CalendarDays, ClipboardList, User } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { mlApi, patientApi } from '../services/api';

export default function PatientDetails() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const patient = await patientApi.get(id);
        const [progressData, anomalyData] = await Promise.all([
          mlApi.predictProgress(id).catch(() => null),
          mlApi.anomalies(id).catch(() => []),
        ]);
        if (active) {
          setData(patient);
          setProgress(progressData);
          setAnomalies(anomalyData || []);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [id]);

  const sessions = useMemo(() => {
    const therapies = data?.therapies || [];
    const appointments = data?.appointments || [];
    return [...appointments, ...therapies].sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));
  }, [data]);

  const chart = progress?.points?.map((point) => ({
    session: point.sessionNumber,
    improvement: point.feedbackScore,
    severity: point.symptomSeverity,
  })) || [];

  if (loading) return <div className="container page"><section className="panel">Loading patient...</section></div>;
  if (!data?.profile) return <div className="container page"><section className="panel">Patient not found.</section></div>;

  const { profile } = data;

  return (
    <div className="container page">
      <header className="dashboard-header">
        <div>
          <Link to="/dashboard" className="text-button"><ArrowLeft size={16} /> Back to dashboard</Link>
          <h1>{profile.name}</h1>
          <p className="muted">{profile.prakriti || 'Unassessed'} patient profile and appointment history.</p>
        </div>
      </header>

      <div className="dashboard-grid">
        <section className="panel">
          <h2><User size={20} /> Patient Summary</h2>
          <p><strong>Age:</strong> {profile.age || 'Not set'}</p>
          <p><strong>Gender:</strong> {profile.gender || 'Not set'}</p>
          <p><strong>Prakriti:</strong> {profile.prakriti || 'Unassessed'}</p>
          <p><strong>Health history:</strong> {profile.medicalHistory?.join(', ') || 'None recorded'}</p>
        </section>

        <section className="panel">
          <h2><CalendarDays size={20} /> Appointments</h2>
          {sessions.length ? sessions.map((session) => <SessionRow key={session._id} session={session} />) : <div className="empty-state">No appointments or therapy sessions yet.</div>}
        </section>

        <section className="panel">
          <h2><AlertTriangle size={20} /> Anomaly Alerts</h2>
          {anomalies.length ? anomalies.map((item) => (
            <p key={item.therapyId || item._id}><strong>{item.therapyType}</strong> z-score {item.zScore}</p>
          )) : <p className="muted">No anomaly flags found.</p>}
        </section>

        <section className="panel chart-panel full">
          <h2><Activity size={20} /> Health Improvement Trend</h2>
          {chart.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="session" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Line dataKey="improvement" stroke="#4CAF50" strokeWidth={2} />
                <Line dataKey="severity" stroke="#E53935" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="empty-state">No feedback trend yet.</div>}
          {progress?.prediction && <p className="muted">Trend: {progress.prediction.trend}. Next predicted score: {progress.prediction.predictedScore}.</p>}
        </section>

        <section className="panel full">
          <h2><ClipboardList size={20} /> Care Notes</h2>
          <p><strong>Allergies:</strong> {profile.allergies?.join(', ') || 'None recorded'}</p>
          <p><strong>Current medications:</strong> {profile.currentMedications?.join(', ') || 'None recorded'}</p>
          <p><strong>Emergency contact:</strong> {profile.emergencyContact?.name || 'Not set'} {profile.emergencyContact?.phone || ''}</p>
        </section>
      </div>
    </div>
  );
}

function SessionRow({ session }) {
  const date = new Date(session.scheduledDate).toLocaleDateString();
  const time = session.scheduledTime || new Date(session.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="session-row">
      <strong>{session.therapyType}</strong>
      <span>{date} at {time}</span>
      <span className={`status ${session.status}`}>{session.status}</span>
    </div>
  );
}
