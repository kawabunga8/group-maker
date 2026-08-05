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
    background: `hsl(${hue} 60% 94%)`,
    border: `hsl(${hue} 50% 78%)`,
    badge: `hsl(${hue} 50% 82%)`,
    badgeText: `hsl(${hue} 40% 35%)`,
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
    <div className="min-h-screen bg-sky-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Group Maker</h1>
            <p className="text-sm text-slate-500 mt-1">Pick a class to generate groups or pick a random student.</p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setCombineMode(false); setSelectedIds([]); }}
              className="text-sm border border-sky-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              {KNOWN_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={signOut}
              className="text-sm text-slate-400 hover:text-slate-600 font-medium transition"
            >
              Sign out
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Combine toolbar */}
        <div className="mb-5 flex items-center gap-3 flex-wrap">
          <button
            onClick={toggleCombineMode}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition border ${
              combineMode
                ? 'bg-indigo-500 text-white border-indigo-500 shadow'
                : 'bg-white border-sky-300 text-slate-600 hover:bg-sky-100'
            }`}
          >
            {combineMode ? '✕ Cancel' : '⊕ Combine classes…'}
          </button>
          {combineMode && selectedIds.length >= 2 && (
            <button
              onClick={handleCombineSelected}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-semibold shadow"
            >
              Combine {selectedIds.length} selected →
            </button>
          )}
          {combineMode && selectedIds.length < 2 && (
            <p className="text-xs text-slate-500">
              Select 2 or more courses to merge their rosters.
            </p>
          )}
        </div>

        {/* Course grid */}
        {loading ? (
          <div className="text-slate-500 text-sm py-8 text-center">Loading courses…</div>
        ) : courses.length === 0 ? (
          <div className="text-slate-500 text-sm py-8 text-center">No courses found for {selectedYear}.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courses.map((course) => {
              const c = courseCardColors(course.id);
              const isSelected = selectedIds.includes(course.id);
              const label = course.block
                ? `Block ${course.block} — ${course.name}`
                : course.name;
              return (
                <div
                  key={course.id}
                  onClick={combineMode ? () => toggleSelected(course.id) : undefined}
                  style={{
                    background: c.background,
                    border: isSelected ? '2px solid rgb(99 102 241)' : `1px solid ${c.border}`,
                    boxShadow: isSelected ? '0 0 0 3px rgba(99,102,241,0.2)' : undefined,
                  }}
                  className={`relative flex flex-col justify-between p-4 rounded-xl transition-shadow ${
                    combineMode ? 'cursor-pointer select-none' : 'hover:shadow-md'
                  }`}
                >
                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      ✓
                    </div>
                  )}

                  <div>
                    <h3 className="text-base font-semibold text-slate-900 leading-snug pr-6">{label}</h3>
                    {course.grade_years && course.grade_years.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {course.grade_years.map((g) => (
                          <span
                            key={g}
                            style={{ background: c.badge, color: c.badgeText }}
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                          >
                            Gr {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {!combineMode && (
                    <div className="mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const params = new URLSearchParams({ name: label });
                          router.push(`/class/${course.id}?${params.toString()}`);
                        }}
                        className="w-full text-center px-4 py-2 bg-white/70 hover:bg-white text-slate-700 font-semibold rounded-lg border border-white/80 transition text-sm"
                      >
                        Open →
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
