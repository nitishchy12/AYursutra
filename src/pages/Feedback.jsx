import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { feedbackApi, therapyApi } from '../services/api';

export default function Feedback() {
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({ sessionId: '', overallRating: 5, symptomImprovement: 7, symptomSeverity: 4, sideEffects: '', notes: '' });

  useEffect(() => { therapyApi.list().then((items) => { setSessions(items || []); if (items?.[0]) setForm((f) => ({ ...f, sessionId: items[0]._id })); }); }, []);

  async function submit(e) {
    e.preventDefault();
    await feedbackApi.create(form);
    toast.success('Feedback saved and progress prediction will update');
  }

  return (
    <div className="container page">
      <section className="panel narrow">
        <h1>Session Feedback</h1>
        <form onSubmit={submit}>
          <label>Session</label>
          <select className="input-field" value={form.sessionId} onChange={(e) => setForm({ ...form, sessionId: e.target.value })}>{sessions.map((s) => <option key={s._id} value={s._id}>{s.therapyType} - {new Date(s.scheduledDate).toLocaleString()}</option>)}</select>
          <label>Overall rating</label><input className="input-field" type="number" min="1" max="5" value={form.overallRating} onChange={(e) => setForm({ ...form, overallRating: Number(e.target.value) })} />
          <label>Symptom improvement</label><input className="input-field" type="number" min="1" max="10" value={form.symptomImprovement} onChange={(e) => setForm({ ...form, symptomImprovement: Number(e.target.value) })} />
          <label>Current symptom severity</label><input className="input-field" type="number" min="1" max="10" value={form.symptomSeverity} onChange={(e) => setForm({ ...form, symptomSeverity: Number(e.target.value) })} />
          <label>Side effects</label><textarea className="input-field" value={form.sideEffects} onChange={(e) => setForm({ ...form, sideEffects: e.target.value })} />
          <label>Notes</label><textarea className="input-field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button className="btn btn-primary" style={{ marginTop: 16 }}>Submit feedback</button>
        </form>
      </section>
    </div>
  );
}
