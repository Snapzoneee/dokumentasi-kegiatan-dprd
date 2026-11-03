'use client';
import { use, useEffect, useState } from 'react';
import { ActivityEditor } from '@/components/activity-editor';
import { toast } from 'sonner';
export default function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activity,setActivity] = useState<any>(null); const [error,setError] = useState('');
  useEffect(()=>{fetch(`/api/activities/${id}`).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);setActivity(d.activity);}).catch(e=>{setError(e.message);toast.error(e.message);});},[id]);
  if(error) return <div className="card empty-state"><h3>{error}</h3></div>;
  if(!activity) return <div className="card" style={{height:350,background:'#fff'}}/>;
  return <ActivityEditor initial={activity}/>;
}
