'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseClient, Class } from '@/lib/supabaseClient';

type RealCourse = { id: string; name: string; block: string | null; grade_years: number[] };

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

export default function ClassesClient() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [classes, setClasses] = useState<Class[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showImport, setShowImport] = useState(false);
  const [realCourses, setRealCourses] = useState<RealCourse[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'importing' | 'error'>('idle');

  const [combineMode, setCombineMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [combining, setCombining] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  async function importCourseRow(course: RealCourse): Promise<Class> {
    const { data: cls, error: classErr } = await supabase
      .from('group_maker_classes')
      .insert([{ name: `Block ${course.block} — ${course.name}`, source_course_id: course.id }])
      .select()
      .single();
    if (classErr) throw classErr;

    const res = await fetch(`/api/courses/${course.id}/roster`);
    const roster = await res.json();
    if (!res.ok) throw new Error(roster?.error ?? 'Failed to load roster');

    if (Array.isArray(roster) && roster.length > 0) {
      const { error: studentsErr } = await supabase
        .from('group_maker_students')
        .insert(roster.map((s: { full_name: string }) => ({ class_id: cls.id, full_name: s.full_name })));
      if (studentsErr) throw studentsErr;
    }
    return cls;
  }

  async function openImport() {
    setShowImport(true);
    setImportStatus('loading');
    try {
      const res = await fetch('/api/courses');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to load courses');
      setRealCourses(data);
      setImportStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
      setImportStatus('error');
    }
  }

  async function importCourse(course: RealCourse) {
    setImportStatus('importing');
    try {
      setError(null);
      const cls = await importCourseRow(course);
      setClasses((prev) => [cls, ...prev]);
      setShowImport(false);
      setImportStatus('idle');
      router.push(`/class/${cls.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import course');
      setImportStatus('error');
    }
  }

  // Auto-import every active course for the current quarter, once -- classes already
  // imported (tracked by source_course_id) are skipped so re-visiting the page never
  // duplicates rosters. Manual classes and combined classes (source_course_id null)
  // are left alone.
  async function autoImportCurrentCourses(existing: Class[]) {
    try {
      const res = await fetch('/api/courses');
      const courses: RealCourse[] = await res.json();
      if (!res.ok || !Array.isArray(courses)) return;

      const importedCourseIds = new Set(existing.map((c) => c.source_course_id).filter(Boolean));
      const toImport = courses.filter((c) => !importedCourseIds.has(c.id));
      if (toImport.length === 0) return;

      const imported: Class[] = [];
      for (const course of toImport) {
        try {
          imported.push(await importCourseRow(course));
        } catch {
          // Skip a course that fails to import (e.g. transient error) rather than
          // blocking the rest -- it'll just get retried on the next page load.
        }
      }
      if (imported.length > 0) {
        setClasses((prev) => [...imported, ...prev]);
      }
    } catch {
      // Auto-import is a convenience, not required -- silently skip on failure.
    }
  }

  // Fetch classes on mount, then auto-import any not-yet-imported current courses.
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('group_maker_classes')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        const existing = data || [];
        setClasses(existing);
        setLoading(false);
        await autoImportCurrentCourses(existing);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load classes');
        setLoading(false);
      }
    };

    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      setError(null);
      const { data, error } = await supabase
        .from('group_maker_classes')
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
      const { error } = await supabase.from('group_maker_classes').delete().eq('id', id);
      if (error) throw error;
      setClasses(classes.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete class');
    }
  };

  function toggleCombineMode() {
    setCombineMode((prev) => !prev);
    setSelectedIds([]);
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleCombineSelected() {
    if (selectedIds.length < 2) return;
    const selected = classes.filter((c) => selectedIds.includes(c.id));
    const defaultName = selected.map((c) => c.name).join(' + ');
    const name = window.prompt('Name for the combined class:', defaultName);
    if (!name || !name.trim()) return;

    setCombining(true);
    try {
      setError(null);
      const { data: cls, error: classErr } = await supabase
        .from('group_maker_classes')
        .insert([{ name: name.trim() }])
        .select()
        .single();
      if (classErr) throw classErr;

      const { data: students, error: studentsErr } = await supabase
        .from('group_maker_students')
        .select('full_name')
        .in('class_id', selectedIds);
      if (studentsErr) throw studentsErr;

      if (students && students.length > 0) {
        const { error: insertErr } = await supabase
          .from('group_maker_students')
          .insert(students.map((s: { full_name: string }) => ({ class_id: cls.id, full_name: s.full_name })));
        if (insertErr) throw insertErr;
      }

      // Combining replaces the source classes -- deleting them cascades their students.
      const { error: deleteErr } = await supabase.from('group_maker_classes').delete().in('id', selectedIds);
      if (deleteErr) throw deleteErr;

      setClasses((prev) => [cls, ...prev.filter((c) => !selectedIds.includes(c.id))]);
      setCombineMode(false);
      setSelectedIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to combine classes');
    } finally {
      setCombining(false);
    }
  }

  return (
    <div className="min-h-screen bg-sky-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Group Maker</h1>
          <button onClick={signOut} className="text-sm text-slate-500 hover:text-slate-700 font-semibold">
            Sign out
          </button>
        </div>

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

        {/* Import from a real course + combine toggle */}
        <div className="mb-8 flex flex-wrap gap-2">
          {!showImport ? (
            <button
              onClick={openImport}
              className="px-4 py-2 bg-white border border-sky-300 text-slate-700 rounded hover:bg-sky-100 transition text-sm font-semibold"
            >
              Import roster from a course →
            </button>
          ) : (
            <div className="bg-white border border-sky-200 rounded p-4 w-full">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-900">Import a course&apos;s real roster</h2>
                <button onClick={() => setShowImport(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                  Cancel
                </button>
              </div>
              {importStatus === 'loading' ? (
                <p className="text-slate-500 text-sm">Loading courses...</p>
              ) : realCourses.length === 0 ? (
                <p className="text-slate-500 text-sm">No courses are active right now.</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {realCourses.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => importCourse(c)}
                      disabled={importStatus === 'importing'}
                      className="w-full text-left px-3 py-2 rounded hover:bg-sky-50 disabled:opacity-50 text-sm text-slate-800"
                    >
                      Block {c.block} — {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={toggleCombineMode}
            className={`px-4 py-2 border rounded transition text-sm font-semibold ${
              combineMode
                ? 'bg-indigo-500 text-white border-indigo-500'
                : 'bg-white border-sky-300 text-slate-700 hover:bg-sky-100'
            }`}
          >
            {combineMode ? 'Cancel combine' : 'Combine classes…'}
          </button>
          {combineMode && (
            <button
              onClick={handleCombineSelected}
              disabled={selectedIds.length < 2 || combining}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm font-semibold disabled:opacity-50"
            >
              {combining ? 'Combining…' : `Combine ${selectedIds.length} selected`}
            </button>
          )}
        </div>
        {combineMode && (
          <p className="text-xs text-slate-500 mb-4 -mt-4">
            Select two or more classes to merge into one (e.g. WL 11 + WL 12, same block). The originals are replaced.
          </p>
        )}

        {/* Classes List */}
        {loading ? (
          <p className="text-slate-600">Loading classes...</p>
        ) : classes.length === 0 ? (
          <p className="text-slate-600">No classes yet. Create one to get started!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((classItem) => {
              const colors = classCardColors(classItem.id);
              const isSelected = selectedIds.includes(classItem.id);
              return (
              <div
                key={classItem.id}
                onClick={combineMode ? () => toggleSelected(classItem.id) : undefined}
                className={`flex flex-col justify-between p-4 rounded transition ${combineMode ? 'cursor-pointer' : 'hover:shadow'}`}
                style={{
                  backgroundColor: colors.backgroundColor,
                  border: isSelected ? '2px solid rgb(99 102 241)' : `1px solid ${colors.borderColor}`,
                }}
              >
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 break-words">
                    {classItem.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {new Date(classItem.created_at).toLocaleDateString()}
                  </p>
                </div>

                {!combineMode && (
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
                )}
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
