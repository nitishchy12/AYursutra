import React, { useEffect, useMemo, useState } from 'react';
import { apiGetHerbs, apiSeedHerbs } from '../services/api';
import { Leaf, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const doshas = ['All', 'Vata', 'Pitta', 'Kapha'];

export default function Remedies() {
  const [herbs, setHerbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dosha, setDosha] = useState('All');
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => { fetchHerbs(); }, [debouncedSearch, dosha]);

  async function fetchHerbs() {
    setLoading(true);
    try {
      const data = await apiGetHerbs({ search: debouncedSearch || undefined, dosha: dosha === 'All' ? undefined : dosha, limit: 60 });
      setHerbs(data.data || data.herbs || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeedData() {
    setSeeding(true);
    try {
      await apiSeedHerbs();
      toast.success('Herbal database seeded');
      await fetchHerbs();
    } finally {
      setSeeding(false);
    }
  }

  const categories = useMemo(() => [...new Set(herbs.map((h) => h.category).filter(Boolean))], [herbs]);

  return (
    <div className="container page">
      <header className="text-center" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--primary-dark)' }}>Ayurvedic Herbal Remedies</h1>
        <p className="muted">Search DB-backed herbs and filter by dosha-balancing properties.</p>
      </header>

      <div className="toolbar">
        <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={20} />
          <input className="input-field" style={{ width: '100%', paddingLeft: 42 }} placeholder="Search ashwagandha, digestion, skin..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="tabs" style={{ margin: 0 }}>
          {doshas.map((item) => <button key={item} className={dosha === item ? 'active' : ''} onClick={() => setDosha(item)}>{item}</button>)}
        </div>
        <button className="btn btn-secondary" onClick={handleSeedData} disabled={seeding}>{seeding ? 'Seeding...' : 'Seed Initial Data'}</button>
      </div>

      {loading ? (
        <div className="empty-state"><RefreshCw className="animate-spin" /><p>Loading herbal remedies...</p></div>
      ) : herbs.length === 0 ? (
        <div className="empty-state"><Leaf size={42} /><h3>No herbs found</h3><p>The herbal database is empty or no herbs match your filter.</p><button onClick={handleSeedData} className="btn btn-primary">Seed Initial Data</button></div>
      ) : (
        <>
          <p className="muted" style={{ marginBottom: 16 }}>{herbs.length} herbs loaded {categories.length ? `across ${categories.length} categories` : ''}</p>
          <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
            {herbs.map((herb) => (
              <article key={herb._id || herb.id} className="card herb-card">
                <img src={herb.imageUrl || herb.image} alt={herb.name} />
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3>{herb.name}</h3>
                      <p className="muted"><em>{herb.scientificName}</em></p>
                    </div>
                    <span className="pill">{herb.category}</span>
                  </div>
                  <p>{herb.description}</p>
                  <div className="dosha-pills">
                    {['Vata', 'Pitta', 'Kapha'].map((item) => <span key={item} className={herb.doshaBalance?.[item.toLowerCase()] ? 'on' : ''}>{item[0]}</span>)}
                  </div>
                  <h4>Benefits</h4>
                  <ul>{(herb.benefits || []).slice(0, 6).map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
                  <div className="info-strip"><strong>Usage:</strong> {herb.usage || herb.usageMethod}</div>
                  <div className="info-strip"><strong>Precautions:</strong> {herb.precautions}</div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
