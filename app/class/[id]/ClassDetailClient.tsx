'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import GroupingView from '@/components/GroupingView';

type Student = { id: string; full_name: string };

export default function ClassDetailClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = params.id as string;
  const nameFromUrl = searchParams.get('name') ?? '';

  const [students, setStudents] = useState<Student[]>([]);
  const [title, setTitle] = useState(nameFromUrl || 'Loading...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoster = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/courses/${courseId}/roster`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? 'Failed to load roster');
        setStudents(data);
        if (!nameFromUrl) {
          const coursesRes = await fetch('/api/courses');
          if (coursesRes.ok) {
            const courses: Array<{ id: string; name: string; block: string | null }> =
              await coursesRes.json();
            const course = courses.find((c) => c.id === courseId);
            if (course) {
              setTitle(course.block ? `Block ${course.block} — ${course.name}` : course.name);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load roster');
      } finally {
        setLoading(false);
      }
    };

    fetchRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  if (loading) return <div className="p-8 text-slate-600">Loading roster...</div>;

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

  return <GroupingView students={students} title={title} />;
}
