"use client";
import axios from 'axios';
import useSWR from 'swr';
import Navbar from '../../components/Navbar';
const fetcher = url=>axios.get(url).then(r=>r.data);


export default function Dashboard() {
  const { data } = useSWR('/api/history', fetcher);
  const thumbs = data || [];
  return (
    <div className="container">
      <Navbar />
      <h2>Dashboard</h2>
      <p>History</p>
      <div>
        {thumbs.map(t=>(
          <div key={t.id} style={{border:'1px solid #ddd', padding:8, margin:8}}>
            <strong>{t.title}</strong> — {t.ratio}
            <div><a href={`/edit/${t.id}`}>Open</a></div>
          </div>
        ))}
      </div>
    </div>
  );
}
