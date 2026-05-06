import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, CalendarDays, ClipboardList, Leaf, LineChart as LineIcon, Star, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { adminApi, appointmentApi, mlApi, patientApi, therapyApi, userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const roleTitle = { patient: 'Patient Dashboard', practitioner: 'Practitioner Dashboard', admin: 'Admin Dashboard' };

export default function Dashboard() {
  const { userData, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [therapies, setTherapies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [patients, setPatients] = useState([]);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        if (userData.role === 'patient') {
          const [myProfile, userProfile, sessions, appointments, recs, patientAnalytics] = await Promise.all([
            patientApi.me(),
            userApi.me(),
            therapyApi.list(),
            appointmentApi.my().catch(() => []),
            mlApi.recommendTherapy({}),
            mlApi.patientAnalytics().catch(() => null),
          ]);
          const progress = myProfile?._id ? await mlApi.predictProgress(myProfile._id) : null;
          if (active) {
            setProfile({ ...(myProfile || {}), ...(userProfile || {}), prakriti: userProfile?.dosha || myProfile?.prakriti, prakritiScores: userProfile?.doshaScores || myProfile?.prakritiScores });
            setTherapies([...(sessions || []), ...(appointments || [])]);
            setRecommendations(recs || []);
            setPrediction(progress);
            setAnalytics(patientAnalytics);
          }
        }
        if (userData.role === 'practitioner') {
          const [sessions, appointments, patientList] = await Promise.all([therapyApi.list(), appointmentApi.list(), patientApi.list()]);
          if (active) {
            setTherapies([...(sessions || []), ...(appointments || [])]);
            setPatients(patientList.items || []);
          }
        }
        if (userData.role === 'admin') {
          const overview = await adminApi.overview();
          if (active) setAdmin(overview);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [userData.role]);

  if (loading) return <div className="container page"><Skeleton height={120} count={4} /></div>;

  return (
    <div className="container page">
      <header className="dashboard-header">
        <div>
          <h1>{roleTitle[userData.role] || 'Dashboard'}</h1>
          <p className="muted">Welcome back, {userData.name}. Your Panchakarma workspace is ready.</p>
        </div>
        <Link to="/appointments" className="btn btn-primary"><CalendarDays size={18} /> Book Therapy</Link>
      </header>
      {userData.role === 'patient' && <PatientDashboard profile={profile} setProfile={setProfile} refreshUserData={refreshUserData} therapies={therapies} recommendations={recommendations} prediction={prediction} analytics={analytics} />}
      {userData.role === 'practitioner' && <PractitionerDashboard therapies={therapies} patients={patients} />}
      {userData.role === 'admin' && <AdminDashboard admin={admin} />}
    </div>
  );
}

function PatientDashboard({ profile, setProfile, refreshUserData, therapies, recommendations, prediction, analytics }) {
  const upcoming = therapies.filter((t) => new Date(t.scheduledDate) >= new Date() && ['scheduled', 'pending', 'confirmed'].includes(t.status)).slice(0, 3);
  const radar = analytics?.radarData?.length ? analytics.radarData : ['vata', 'pitta', 'kapha'].map((axis) => ({ axis: axis.toUpperCase(), score: profile?.prakritiScores?.[axis] || 0 }));
  const progress = analytics?.improvementTrend?.length ? analytics.improvementTrend : prediction?.points?.map((p) => ({ session: p.sessionNumber, improvement: p.feedbackScore, severity: p.symptomSeverity })) || [];
  const therapyProgress = analytics?.therapyProgress || {
    booked: therapies.filter((t) => t.status !== 'cancelled').length,
    completed: therapies.filter((t) => t.status === 'completed').length,
    totalRecommended: 6,
    percent: 0,
  };
  return (
    <div className="dashboard-grid">
      <section className="panel">
        <h2><Leaf size={20} /> Prakriti</h2>
        <strong className="metric">{profile?.dosha || profile?.prakriti || 'Not assessed'}</strong>
        <p className="muted">{profile?.prakritiExplanation || 'Complete the questionnaire to generate an ML-backed profile.'}</p>
        {profile?.dosha || profile?.prakriti ? <span className="dosha-badge">{profile?.dosha || profile?.prakriti}</span> : <Link to="/dosha-test" className="btn btn-secondary">Take questionnaire</Link>}
      </section>
      <ProfileEditor profile={profile} onSave={setProfile} refreshUserData={refreshUserData} />
      <section className="panel">
        <h2><CalendarDays size={20} /> Upcoming Sessions</h2>
        {upcoming.length ? upcoming.map((t) => <SessionRow key={t._id} therapy={t} />) : <Empty text="No upcoming sessions." action="/appointments" label="Book now" />}
      </section>
      <section className="panel chart-panel">
        <h2><Activity size={20} /> Dosha Balance</h2>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radar}><PolarGrid /><PolarAngleAxis dataKey="axis" /><PolarRadiusAxis domain={[0, 100]} /><Tooltip /><Radar dataKey="score" fill="#4CAF50" fillOpacity={0.45} /></RadarChart>
        </ResponsiveContainer>
      </section>
      <section className="panel">
        <h2><ClipboardList size={20} /> Therapy Progress</h2>
        <p className="metric">{therapyProgress.booked}/{therapyProgress.totalRecommended}</p>
        <div className="progress-track"><span style={{ width: `${therapyProgress.percent}%` }} /></div>
        <p className="muted">{therapyProgress.percent}% of recommended sessions booked. {therapyProgress.completed || 0} completed.</p>
      </section>
      <section className="panel chart-panel">
        <h2><LineIcon size={20} /> Health Improvement</h2>
        {progress.length ? <ResponsiveContainer width="100%" height={220}><LineChart data={progress}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="session" /><YAxis domain={[0, 10]} /><Tooltip /><Line dataKey="improvement" stroke="#4CAF50" strokeWidth={2} /><Line dataKey="movingAverage" stroke="#2E7D32" strokeDasharray="4 4" /><Line dataKey="severity" stroke="#E53935" strokeDasharray="5 5" /></LineChart></ResponsiveContainer> : <Empty text="Submit feedback after a session to see prediction." />}
        {prediction?.prediction && <p className="muted">Trend: {prediction.prediction.trend}. Next predicted score: {prediction.prediction.predictedScore}.</p>}
      </section>
      <section className="panel full">
        <h2><Star size={20} /> AI Recommended Therapies</h2>
        <div className="card-row">{recommendations.map((r) => <div className="mini-card" key={r.therapyType}><strong>{r.therapyType}</strong><span className="pill">{r.confidence}% match</span><p>{r.reasoning}</p></div>)}</div>
      </section>
    </div>
  );
}

function ProfileEditor({ profile, onSave, refreshUserData }) {
  const [form, setForm] = useState(() => ({
    name: profile?.name || '',
    age: profile?.age || '',
    gender: profile?.gender || '',
    weight: profile?.weight || '',
    height: profile?.height || '',
    medicalHistory: (profile?.medicalHistory || []).join(', '),
    allergies: (profile?.allergies || []).join(', '),
    currentMedications: (profile?.currentMedications || []).join(', '),
    emergencyName: profile?.emergencyContact?.name || '',
    emergencyPhone: profile?.emergencyContact?.phone || '',
    phone: profile?.phone || '',
    healthGoals: profile?.healthGoals || '',
  }));
  useEffect(() => {
    setForm({
      name: profile?.name || '', age: profile?.age || '', gender: profile?.gender || '', weight: profile?.weight || '', height: profile?.height || '',
      medicalHistory: (profile?.medicalHistory || []).join(', '), allergies: (profile?.allergies || []).join(', '), currentMedications: (profile?.currentMedications || []).join(', '),
      emergencyName: profile?.emergencyContact?.name || '', emergencyPhone: profile?.emergencyContact?.phone || '', phone: profile?.phone || '', healthGoals: profile?.healthGoals || '',
    });
  }, [profile]);
  async function save(e) {
    e.preventDefault();
    const payload = {
      name: form.name,
      age: Number(form.age) || null,
      gender: form.gender,
      weight: Number(form.weight) || null,
      height: Number(form.height) || null,
      medicalHistory: split(form.medicalHistory),
      allergies: split(form.allergies),
      currentMedications: split(form.currentMedications),
      emergencyContact: { name: form.emergencyName, phone: form.emergencyPhone },
    };
    const saved = await userApi.updateProfile({ name: payload.name, age: payload.age, gender: payload.gender, phone: form.phone, healthGoals: form.healthGoals });
    await patientApi.updateMe(payload).catch(() => null);
    onSave({ ...profile, ...saved });
    await refreshUserData();
    toast.success('Profile updated');
  }
  return (
    <section className="panel full">
      <h2>Editable Profile</h2>
      <form className="profile-grid" onSubmit={save}>
        {['name', 'age', 'gender', 'weight', 'height'].map((key) => <input key={key} className="input-field" placeholder={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}
        <input className="input-field" placeholder="Medical history, comma separated" value={form.medicalHistory} onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })} />
        <input className="input-field" placeholder="Allergies, comma separated" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
        <input className="input-field" placeholder="Current medications, comma separated" value={form.currentMedications} onChange={(e) => setForm({ ...form, currentMedications: e.target.value })} />
        <input className="input-field" placeholder="Emergency contact name" value={form.emergencyName} onChange={(e) => setForm({ ...form, emergencyName: e.target.value })} />
        <input className="input-field" placeholder="Emergency contact phone" value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} />
        <input className="input-field" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="input-field" placeholder="Health goals" value={form.healthGoals} onChange={(e) => setForm({ ...form, healthGoals: e.target.value })} />
        <button className="btn btn-primary">Save profile</button>
      </form>
    </section>
  );
}

function split(value) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function PractitionerDashboard({ therapies, patients }) {
  const [items, setItems] = useState(therapies);
  useEffect(() => { setItems(therapies); }, [therapies]);
  const today = new Date().toISOString().slice(0, 10);
  const todaySessions = items.filter((t) => new Date(t.scheduledDate).toISOString().slice(0, 10) === today);
  const pendingAppointments = items.filter((t) => t.status === 'pending');
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const weeklySessions = items.filter((t) => {
    const scheduled = new Date(t.scheduledDate);
    return scheduled >= weekStart && scheduled < weekEnd && t.status !== 'cancelled';
  });
  const completedThisWeek = weeklySessions.filter((t) => t.status === 'completed');
  const breakdown = Object.values(weeklySessions.reduce((map, t) => { map[t.therapyType] = map[t.therapyType] || { name: t.therapyType, value: 0 }; map[t.therapyType].value += 1; return map; }, {}));
  async function updateAppointment(id, action) {
    const updated = action === 'approve' ? await appointmentApi.approve(id) : await appointmentApi.cancel(id);
    setItems((value) => value.map((item) => (item._id === id ? updated : item)));
    toast.success(action === 'approve' ? 'Appointment approved' : 'Appointment cancelled');
  }
  return (
    <div className="dashboard-grid">
      <section className="panel"><h2><ClipboardList size={20} /> Today's Schedule</h2>{todaySessions.length ? todaySessions.map((t) => <SessionRow key={t._id} therapy={t} />) : <Empty text="No sessions today." />}</section>
      <section className="panel full">
        <h2><CalendarDays size={20} /> Appointment Approvals</h2>
        {pendingAppointments.length ? pendingAppointments.map((appointment) => (
          <div className="approval-row" key={appointment._id}>
            <div>
              <strong>{appointment.therapyType}</strong>
              <p className="muted">{appointment.patient?.name || 'Patient'} - {new Date(appointment.scheduledDate).toLocaleDateString()} at {appointment.scheduledTime}</p>
            </div>
            <div className="approval-actions">
              <button className="btn btn-primary" onClick={() => updateAppointment(appointment._id, 'approve')}>Approve</button>
              <button className="btn btn-secondary" onClick={() => updateAppointment(appointment._id, 'cancel')}>Cancel</button>
            </div>
          </div>
        )) : <Empty text="No pending appointments to approve." />}
      </section>
      <section className="panel"><h2><Users size={20} /> Patients</h2>{patients.slice(0, 6).map((p) => <p key={p._id}><Link to={`/patients/${p._id}`}>{p.name}</Link> <span className="muted">{p.prakriti || 'Unassessed'}</span></p>)}</section>
      <section className="panel"><h2><AlertTriangle size={20} /> Anomaly Alerts</h2><p className="muted">Feedback z-score checks run per patient from the ML endpoint. Open a patient profile to inspect flags.</p></section>
      <section className="panel chart-panel"><h2>Weekly Stats</h2><p className="metric">{weeklySessions.length}</p><p className="muted">Sessions booked this week. {completedThisWeek.length} completed.</p><ResponsiveContainer width="100%" height={180}><PieChart><Pie data={breakdown} dataKey="value" nameKey="name" fill="#4CAF50" /></PieChart></ResponsiveContainer></section>
    </div>
  );
}

function AdminDashboard({ admin }) {
  const COLORS = ['#4CAF50', '#FFB300', '#7E57C2', '#26A69A', '#EF5350', '#5C6BC0'];
  const revenue = Object.entries(admin?.revenue || {}).map(([name, value]) => ({ name, value }));
  const analytics = admin?.analytics || {};
  return (
    <div className="dashboard-grid">
      <section className="panel"><h2>Total Patients</h2><p className="metric">{admin?.patients || 0}</p></section>
      <section className="panel"><h2>Practitioners</h2><p className="metric">{admin?.practitioners || 0}</p></section>
      <section className="panel"><h2>Total Bookings</h2><p className="metric">{analytics.totalBookings || 0}</p><p className="muted">{admin?.sessionsThisMonth || 0} this month</p></section>
      <section className="panel chart-panel"><h2>Popular Therapies</h2><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={analytics.popularTherapies || []} dataKey="value" nameKey="name" outerRadius={80} label>{(analytics.popularTherapies || []).map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></section>
      <section className="panel chart-panel"><h2>Monthly Sessions</h2><ResponsiveContainer width="100%" height={240}><BarChart data={analytics.monthlySessions || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="sessions" fill="#4CAF50" /></BarChart></ResponsiveContainer></section>
      <section className="panel chart-panel full"><h2>Revenue by Therapy</h2><ResponsiveContainer width="100%" height={260}><BarChart data={revenue}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#4CAF50" /></BarChart></ResponsiveContainer></section>
      <section className="panel full"><h2>Notification Logs</h2>{admin?.notifications?.map((n) => <p key={n._id}><strong>{n.title}</strong> <span className="muted">{n.message}</span></p>)}</section>
    </div>
  );
}

function SessionRow({ therapy }) {
  const date = new Date(therapy.scheduledDate).toLocaleDateString();
  const time = therapy.scheduledTime || new Date(therapy.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return <div className="session-row"><strong>{therapy.therapyType}</strong><span>{date} at {time}</span><span className={`status ${therapy.status}`}>{therapy.status}</span></div>;
}

function Empty({ text, action, label }) {
  return <div className="empty-state"><p>{text}</p>{action && <Link to={action} className="btn btn-secondary">{label}</Link>}</div>;
}
