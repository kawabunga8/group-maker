'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, Class } from '@/lib/supabaseClient';

function hashStringToInt(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function classCardColors(classId: string) {
  // Pastel-ish HSL: rotate hue by id, keep saturation/lightness gentle.
  const hue = hashStringToInt(classId) % 360;
  const backgroundColor = `hsl(${hue} 65% 95%)`;
  const borderColor = `hsl(${hue} 55% 80%)`;
  return { backgroundColor, borderColor };
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setClasses(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load classes');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      setError(null);
      const { data, error } = await supabase
        .from('classes')
        .insert([{ name: newClassName }])
        .select();

      if (error) throw error;
      if (data && data[0]) {
        setClasses([data[0], ...classes]);
        setNewClassName('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create class');
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      setError(null);
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) throw error;
      setClasses(classes.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete class');
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Group Maker</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Create Class Form */}
        <form onSubmit={handleCreateClass} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter class name..."
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              className="flex-1 px-4 py-2 border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition"
            >
              Create Class
            </button>
          </div>
        </form>

        {/* Classes List */}
        {loading ? (
          <p className="text-slate-600">Loading classes...</p>
        ) : classes.length === 0 ? (
          <p className="text-slate-600">No classes yet. Create one to get started!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((classItem) => {
              const colors = classCardColors(classItem.id);
              return (
              <div
                key={classItem.id}
                className="flex flex-col justify-between p-4 rounded hover:shadow transition"
                style={{ backgroundColor: colors.backgroundColor, border: `1px solid ${colors.borderColor}` }}
              >
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 break-words">
                    {classItem.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {new Date(classItem.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/class/${classItem.id}`}
                    className="flex-1 text-center px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition"
                  >
                    Open
                  </Link>
                  <button
                    onClick={() => handleDeleteClass(classItem.id)}
                    className="flex-1 px-4 py-2 bg-rose-400 text-white rounded hover:bg-rose-500 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
