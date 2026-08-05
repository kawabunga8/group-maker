'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';

type Course = { id: string; name: string; block: string | null; grade_years: number[] };

const KNOWN_YEARS = ['2025-26', '2026-27'];

function currentSchoolYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startYear = month >= 7 ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(2)}`;
}

function hashStringToInt(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function courseCardColors(id: string) {
  const hue = hashStringToInt(id) % 360;
  return {
    backgroundColor: `hsl(${hue} 65% 95%)`,
    borderColor: `hsl(${hue} 55% 80%)`,
  };
}

export default function ClassesClient() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(currentSchoolYear);
  const [combineMode, setCombineMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/courses?school_year=${selectedYear}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? 'Failed to load courses');
        setCourses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [selectedYear]);

  function toggleCombineMode() {
    setCombineMode((prev) => !prev);
    setSelectedIds([]);
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleCombineSelected() {
    if (selectedIds.length < 2) return;
    const selected = courses.filter((c) => selectedIds.includes(c.id));
    const defaultName = selected
      .map((c) => (c.block ? `Block ${c.block} — ${c.name}` : c.name))
      .join(' + ');
    const name = window.prompt('Name for the combined class:', defaultName);
    if (!name || !name.trim()) return;
    const params = new URLSearchParams({ ids: selectedIds.join(','), name: name.trim() });
    router.push(`/class/combined?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-sky-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Group Maker</h1>
          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setCombineMode(false); setSelectedIds([]); }}
              className="text-sm border border-sky-300 rounded px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              {KNOWN_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={signOut}
              className="text-sm text-slate-500 hover:text-slate-700 font-semibold"
            >
              Sign out
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-6 flex items-center gap-3 flex-wrap">
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
          {combineMode && selectedIds.length >= 2 && (
            <button
              onClick={handleCombineSelected}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm font-semibold"
            >
              Combine {selectedIds.length} selected →
            </button>
          )}
          {combineMode && (
            <p className="text-xs text-slate-500 w-full mt-1">
              Select two or more courses to merge their rosters (e.g. WL 11 + WL 12, same block).
            </p>
          )}
        </div>

        {loading ? (
          <p className="text-slate-600">Loading courses...</p>
        ) : courses.length === 0 ? (
          <p className="text-slate-600">No courses found for {selectedYear}.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => {
              const colors = courseCardColors(course.id);
              const isSelected = selectedIds.includes(course.id);
              const label = course.block
                ? `Block ${course.block} — ${course.name}`
                : course.name;
              return (
                <div
                  key={course.id}
                  onClick={combineMode ? () => toggleSelected(course.id) : undefined}
                  className={`flex flex-col justify-between p-4 rounded transition ${
                    combineMode ? 'cursor-pointer' : 'hover:shadow'
                  }`}
                  style={{
                    backgroundColor: colors.backgroundColor,
                    border: isSelected
                      ? '2px solid rgb(99 102 241)'
                      : `1px solid ${colors.borderColor}`,
                  }}
                >
                  <h3 className="text-lg font-semibold text-slate-900 break-words">{label}</h3>
                  {!combineMode && (
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          const params = new URLSearchParams({ name: label });
                          router.push(`/class/${course.id}?${params.toString()}`);
                        }}
                        className="w-full text-center px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition"
                      >
                        Open
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
