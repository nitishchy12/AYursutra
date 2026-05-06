import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ExternalLink, Mail, MapPin, Phone, Star } from 'lucide-react';
import { centerApi } from '../services/api';

export default function SessionCenters() {
  const [centers, setCenters] = useState([]);
  const [city, setCity] = useState('All');
  const navigate = useNavigate();

  useEffect(() => { load(); }, [city]);

  async function load() {
    const data = await centerApi.list({ city: city === 'All' ? undefined : city });
    setCenters(data || []);
  }

  const cities = ['All', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Chandigarh'];

  function book(center) {
    const query = new URLSearchParams({ center: center.name, city: center.city, therapyType: center.therapiesOffered?.[0] || 'Abhyanga' });
    navigate(`/appointments?${query.toString()}`);
  }

  return (
    <div className="container page">
      <header className="text-center" style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary-dark)' }}>Our Session Centers</h1>
        <p className="muted">DB-backed AyurSutra wellness centers across India.</p>
      </header>
      <div className="toolbar">
        <label>City</label>
        <select className="input-field" value={city} onChange={(e) => setCity(e.target.value)}>{cities.map((item) => <option key={item}>{item}</option>)}</select>
      </div>
      <div className="center-list">
        {centers.map((center) => (
          <article key={center._id} className="card center-card">
            <img src={center.imageUrl} alt={center.name} />
            <div>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2>{center.name}</h2>
                  <p className="muted"><MapPin size={16} /> {center.address}</p>
                </div>
                <button className="btn btn-primary" onClick={() => book(center)}>Book Session</button>
              </div>
              <div className="center-meta">
                <span><Star size={16} fill="var(--accent-color)" color="var(--accent-color)" /> {center.rating} ({center.reviewCount})</span>
                <span><Clock size={16} /> {center.hours}</span>
                <span><Phone size={16} /> {center.phone}</span>
                <span><Mail size={16} /> {center.email}</span>
              </div>
              <div className="dosha-pills wide">{center.specialties?.map((item) => <span className="on" key={item}>{item}</span>)}</div>
              <p className="muted">Therapies: {center.therapiesOffered?.join(', ')}</p>
              <button className="text-button" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.address)}`, '_blank', 'noopener,noreferrer')}>
                View on Map <ExternalLink size={14} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
