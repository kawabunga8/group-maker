'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import GroupingView from '@/components/GroupingView';

type Student = { id: string; full_name: string };

export default function CombinedDetailClient() {
  const searchParams = useSearchParams();
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) ?? [];
  const name = searchParams.get('name') ?? 'Combined Class';

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ids.length === 0) {
      setError('No courses selected.');
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      try {
        setLoading(true);
        const results = await Promise.all(
          ids.map((id) =>
            fetch(`/api/courses/${id}/roster`)
              .then((r) => (r.ok ? r.json() : []))
              .catch(() => [])
          )
        );

        const merged: Student[] = results.flatMap((roster, i) =>
          (roster as Array<{ id: string; full_name: string }>).map((s) => ({
            id: `${ids[i]}-${s.id}`,
            full_name: s.full_name,
          }))
        );
        setStudents(merged);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load rosters');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="p-8 text-slate-600">Loading rosters...</div>;

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <a href="/" className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600">
          Home
        </a>
      </div>
    );
  }

  return <GroupingView students={students} title={name} />;
}
