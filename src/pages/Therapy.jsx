import React, { useState } from 'react';
import { Sparkles, Heart, Wind, Shield, Activity, ArrowRight, Video, MapPin, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const therapySessions = [
  {
    id: 'shirodhara',
    title: 'Shirodhara (Mind Relaxation)',
    description: 'A continuous stream of warm herbal oil poured onto the forehead to calm the nervous system and relieve stress.',
    benefits: ['Relieves anxiety', 'Improves sleep quality', 'Tension headache relief'],
    icon: <Wind className="text-primary" />,
    duration: '60 mins',
    intensity: 'Gentle'
  },
  {
    id: 'panchakarma',
    title: 'Panchakarma (Detoxification)',
    description: 'A comprehensive five-step purification process to remove deep-seated toxins and restore biological balance.',
    benefits: ['Deep detoxification', 'Weight management', 'Strengthens immunity'],
    icon: <Shield className="text-primary" />,
    duration: '7-21 days',
    intensity: 'Moderate'
  },
  {
    id: 'abhyanga',
    title: 'Abhyanga (Herbal Massage)',
    description: 'Warm, medicated oil massage tailored to your Dosha to improve circulation and nourish the skin.',
    benefits: ['Improves circulation', 'Skin health', 'Lymphatic drainage'],
    icon: <Activity className="text-primary" />,
    duration: '90 mins',
    intensity: 'Relaxing'
  },
  {
    id: 'nasya',
    title: 'Nasya (Respiratory Care)',
    description: 'Administration of herbal oils through the nasal passage to clear sinuses and improve mental clarity.',
    benefits: ['Clearer breathing', 'Sinus relief', 'Mental alertness'],
    icon: <Wind className="text-primary" />,
    duration: '30 mins',
    intensity: 'Focused'
  }
];

const Therapy = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  return (
    <div className="container page" style={{ paddingBottom: '5rem' }}>
      {/* Hero Section */}
      <section style={{ 
        position: 'relative', 
        borderRadius: 'var(--radius-lg)', 
        overflow: 'hidden', 
        marginBottom: '4rem',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('/ayurvedic_therapy_hero_1773497431792.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.8)',
          zIndex: -1
        }}></div>
        <div style={{ padding: '2rem', maxWidth: '800px' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1rem', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
            Traditional Ayurvedic Therapies
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9, lineHeight: '1.6' }}>
            Personalized therapeutic sessions designed to restore balance to your Doshas and enhance your natural vitality.
          </p>
        </div>
      </section>

      {/* Quick Actions */}
      <div className="grid-3" style={{ marginBottom: '4rem' }}>
        <Link to="/appointments" className="card hover-scale" style={{ textAlign: 'center', padding: '2rem', textDecoration: 'none', color: 'inherit' }}>
          <Calendar size={48} color="var(--primary-color)" style={{ marginBottom: '1rem' }} />
          <h3>Book Session</h3>
          <p>Schedule a face-to-face consultation or therapy session.</p>
        </Link>
        <Link to="/chat" className="card hover-scale" style={{ textAlign: 'center', padding: '2rem', textDecoration: 'none', color: 'inherit' }}>
          <Video size={48} color="var(--primary-color)" style={{ marginBottom: '1rem' }} />
          <h3>Online Consultation</h3>
          <p>Connect with our expert Vaisyas from the comfort of your home.</p>
        </Link>
        <Link to="/centers" className="card hover-scale" style={{ textAlign: 'center', padding: '2rem', textDecoration: 'none', color: 'inherit' }}>
          <MapPin size={48} color="var(--primary-color)" style={{ marginBottom: '1rem' }} />
          <h3>Find Centers</h3>
          <p>Locate accredited AyurSutra wellness centers near you.</p>
        </Link>
      </div>

      {/* Therapy List */}
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', color: 'var(--primary-dark)' }}>Recommended for You</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Guided sessions based on your therapeutic needs.</p>
          </div>
        </div>
      </header>

      <div className="grid-2">
        {therapySessions.map((session) => (
          <div key={session.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '15px', 
                backgroundColor: 'var(--primary-light)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white'
              }}>
                {React.cloneElement(session.icon, { size: 32, color: 'white' })}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-primary" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>{session.duration}</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Intensity: {session.intensity}</p>
              </div>
            </div>
            
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{session.title}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', flex: 1 }}>{session.description}</p>
            
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--primary-dark)' }}>Key Benefits:</h4>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
              {session.benefits.map((benefit, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                  <Heart size={16} color="var(--accent-color)" /> {benefit}
                </li>
              ))}
            </ul>

            <Link to={`/appointments?therapyType=${encodeURIComponent(session.title.split(' ')[0])}`} className="btn btn-primary" style={{ width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              Book This Session <ArrowRight size={18} />
            </Link>
          </div>
        ))}
      </div>

      {/* Guide Section */}
      <section className="card" style={{ marginTop: '5rem', backgroundColor: 'var(--primary-dark)', color: 'white', padding: '3rem' }}>
        <div className="grid-2" style={{ alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Not sure which therapy is right?</h2>
            <p style={{ opacity: 0.9, fontSize: '1.1rem', marginBottom: '2rem' }}>
              Our AI Ayurvedic Advisor can analyze your current health concerns and Dosha profile to recommend the most effective therapy session for you.
            </p>
            <Link to="/chat" className="btn" style={{ backgroundColor: 'white', color: 'var(--primary-dark)', fontWeight: '700' }}>
              Consult AI Advisor
            </Link>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Sparkles size={120} color="var(--accent-color)" style={{ opacity: 0.5 }} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Therapy;
