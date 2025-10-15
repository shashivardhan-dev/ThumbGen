"use client";
import useSWR from 'swr';
import axios from 'axios';
import Navbar from '../../components/Navbar';
const fetcher = url=>axios.get(url).then(r=>r.data);

export default function Analytics() {
  const { data } = useSWR('/api/analytics/alltime', fetcher);
  const stats = data || { totalGenerations: 0 };
  return (
    <div className="container">
      <Navbar/>
      <h2>Analytics — All time</h2>
      <div>Total generations: {stats.totalGenerations}</div>
    </div>
  );
}
