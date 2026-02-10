'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, Class } from '@/lib/supabaseClient';

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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Group Maker</h1>

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
              className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Create Class
            </button>
          </div>
        </form>

        {/* Classes List */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-600">Loading classes...</p>
          ) : classes.length === 0 ? (
            <p className="text-gray-600">No classes yet. Create one to get started!</p>
          ) : (
            classes.map((classItem) => (
              <div
                key={classItem.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded hover:shadow transition"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {classItem.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(classItem.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/class/${classItem.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Open
                  </Link>
                  <button
                    onClick={() => handleDeleteClass(classItem.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
