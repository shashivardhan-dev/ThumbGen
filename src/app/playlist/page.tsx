'use client';
import { useState } from 'react';
export default function PlaylistPage() {
  const [titles, setTitles] = useState(['']);
  const add = ()=>setTitles(prev=>[...prev, '']);
  const update=(i,v)=>setTitles(prev=>prev.map((p,idx)=>idx===i?v:p));
  return (
    <div className="container">
      <h2>Playlist / Series</h2>
      {titles.map((t,i)=>(
        <div key={i}><input value={t} onChange={e=>update(i,e.target.value)} /></div>
      ))}
      <button onClick={add}>Add title</button>
      <p>Use Create flow to generate series with consistent style.</p>
    </div>
  );
}
