import React, { useEffect, useState } from 'react';
import { notificationApi } from '../services/api';

export default function Notifications() {
  const [filter, setFilter] = useState('all');
  const [data, setData] = useState({ items: [], unread: 0 });

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setData(await notificationApi.list({ filter }));
  }

  async function readAll() {
    await notificationApi.readAll();
    await load();
  }

  return (
    <div className="container page">
      <header className="dashboard-header"><div><h1>Notifications</h1><p className="muted">{data.unread || 0} unread alerts</p></div><button className="btn btn-secondary" onClick={readAll}>Mark all read</button></header>
      <div className="tabs">{['all', 'unread', 'read'].map((tab) => <button className={filter === tab ? 'active' : ''} onClick={() => setFilter(tab)} key={tab}>{tab}</button>)}</div>
      <section className="panel">
        {data.items?.length ? data.items.map((item) => (
          <article key={item._id} className="notification-line">
            <strong>{item.title}</strong>
            <p>{item.message}</p>
            {!item.readAt && <button onClick={async () => { await notificationApi.read(item._id); await load(); }}>Mark read</button>}
          </article>
        )) : <div className="empty-state"><p>No notifications match this filter.</p></div>}
      </section>
    </div>
  );
}
