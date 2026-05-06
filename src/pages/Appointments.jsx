import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentApi, centerApi } from '../services/api';

const therapies = ['Shirodhara', 'Panchakarma', 'Abhyanga', 'Nasya', 'Basti', 'Udvartana', 'Swedana', 'Vamana', 'Virechana'];
const times = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

export default function Appointments() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState('book');
  const [centers, setCenters] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [created, setCreated] = useState(null);
  const [form, setForm] = useState({
    therapyType: params.get('therapyType') || 'Abhyanga',
    centerName: params.get('center') || '',
    scheduledDate: '',
    scheduledTime: '09:00 AM',
    notes: '',
  });

  useEffect(() => { load(); }, []);

  async function load() {
    const [centerList, mine] = await Promise.all([centerApi.list(), appointmentApi.my().catch(() => [])]);
    setCenters(centerList || []);
    setAppointments(mine || []);
    if (!form.centerName && centerList?.[0]) setForm((value) => ({ ...value, centerName: centerList[0].name }));
  }

  async function submit(e) {
    e.preventDefault();
    const appointment = await appointmentApi.create(form);
    setCreated(appointment);
    toast.success('Appointment booked');
    setTab('mine');
    await load();
  }

  async function cancel(id) {
    await appointmentApi.cancel(id);
    toast.success('Appointment cancelled');
    await load();
  }

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  return (
    <div className="container page">
      <header className="dashboard-header">
        <div><h1>Appointments</h1><p className="muted">Book Panchakarma sessions and review your care instructions.</p></div>
      </header>
      <div className="tabs">
        <button className={tab === 'book' ? 'active' : ''} onClick={() => setTab('book')}>Book New</button>
        <button className={tab === 'mine' ? 'active' : ''} onClick={() => setTab('mine')}>My Appointments</button>
      </div>

      {created && (
        <div className="success-box"><CheckCircle size={22} /><strong>{created.therapyType}</strong> booked at {created.centerName}. Pre-care: {created.preInstructions?.join(', ')}</div>
      )}

      {tab === 'book' ? (
        <section className="panel narrow">
          <h2><CalendarDays size={20} /> Book New Session</h2>
          <form onSubmit={submit}>
            <label>Therapy Type</label>
            <select className="input-field" value={form.therapyType} onChange={(e) => setForm({ ...form, therapyType: e.target.value })}>{therapies.map((type) => <option key={type}>{type}</option>)}</select>
            <label>Center</label>
            <select className="input-field" value={form.centerName} onChange={(e) => setForm({ ...form, centerName: e.target.value })}>{centers.map((center) => <option key={center._id} value={center.name}>{center.name} - {center.city}</option>)}</select>
            <label>Date</label>
            <input className="input-field" type="date" min={minDate} value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} required />
            <label>Time Slot</label>
            <select className="input-field" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}>{times.map((time) => <option key={time}>{time}</option>)}</select>
            <label>Notes</label>
            <textarea className="input-field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <button className="btn btn-primary" style={{ marginTop: 16, width: '100%' }}>Book Appointment</button>
          </form>
        </section>
      ) : (
        <section className="appointment-list">
          {appointments.length === 0 ? <div className="empty-state">No booked appointments yet.</div> : appointments.map((item) => (
            <article className="panel" key={item._id}>
              <div className="flex justify-between items-center">
                <div><h2>{item.therapyType}</h2><p className="muted">{item.centerName} · {new Date(item.scheduledDate).toLocaleDateString()} at {item.scheduledTime}</p></div>
                <span className={`status ${item.status}`}>{item.status}</span>
              </div>
              <details><summary>Pre-procedure instructions</summary><ul>{item.preInstructions?.map((instruction) => <li key={instruction}>{instruction}</li>)}</ul></details>
              <details><summary>Post-procedure instructions</summary><ul>{item.postInstructions?.map((instruction) => <li key={instruction}>{instruction}</li>)}</ul></details>
              {item.status === 'pending' && <button className="btn btn-secondary" onClick={() => cancel(item._id)}>Cancel</button>}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
