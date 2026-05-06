import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function NotificationCenter() {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!currentUser) return undefined;
    let active = true;
    async function load() {
      try {
        const data = await notificationApi.list({ limit: 5 });
        if (active) {
          setItems(data.items || []);
          setUnread(data.unread || 0);
        }
      } catch {}
    }
    load();
    const timer = setInterval(load, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button className="icon-btn" onClick={() => setOpen((value) => !value)} aria-label="Notifications">
        <Bell size={20} />
        {unread > 0 && <span className="badge">{unread}</span>}
      </button>
      {open && (
        <div className="notification-menu">
          {items.length === 0 ? <p className="muted">No notifications yet.</p> : items.map((item) => (
            <div key={item._id} className="notification-item">
              <strong>{item.title}</strong>
              <p>{item.message}</p>
            </div>
          ))}
          <Link to="/notifications" className="btn btn-secondary" style={{ width: '100%', marginTop: 8 }}>View all</Link>
        </div>
      )}
    </div>
  );
}
