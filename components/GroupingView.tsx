'use client';

import Link from 'next/link';
import { useState } from 'react';
import { generateGroups, GroupingStrategy, GroupingResult } from '@/lib/grouping';

type Student = { id: string; full_name: string };

interface Props {
  students: Student[];
  title: string;
}

export default function GroupingView({ students, title }: Props) {
  const [groupSize, setGroupSize] = useState(3);
  const [strategy, setStrategy] = useState<GroupingStrategy>('allow-smaller');
  const [groupResult, setGroupResult] = useState<GroupingResult | null>(null);
  const [absentIds, setAbsentIds] = useState<Set<string>>(new Set());
  const [pickedStudent, setPickedStudent] = useState<string | null>(null);
  const [remainingPickPool, setRemainingPickPool] = useState<string[]>([]);

  function toggleAbsent(id: string) {
    setAbsentIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleGenerateGroups() {
    const present = students.filter((s) => !absentIds.has(s.id));
    const result = generateGroups(present.map((s) => s.full_name), { groupSize, strategy });
    setPickedStudent(null);
    setRemainingPickPool(result.groups.flat());
    setGroupResult(result);
  }

  function handleRegenerateGroups() {
    setPickedStudent(null);
    setRemainingPickPool([]);
    const present = students.filter((s) => !absentIds.has(s.id));
    const result = generateGroups(present.map((s) => s.full_name), { groupSize, strategy });
    setRemainingPickPool(result.groups.flat());
    setGroupResult(result);
  }

  function handleCopyGroups() {
    if (!groupResult) return;
    const text = groupResult.groups
      .map((group, idx) => `Group ${idx + 1}:\n${group.join('\n')}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    alert('Groups copied to clipboard!');
  }

  function pickRandomFromGroups() {
    if (!groupResult) return;
    const pool = remainingPickPool.length > 0 ? remainingPickPool : groupResult.groups.flat();
    if (pool.length === 0) return;
    const idx = Math.floor(Math.random() * pool.length);
    const chosen = pool[idx];
    setPickedStudent(chosen);
    setRemainingPickPool(pool.filter((_, i) => i !== idx));
  }

  const presentCount = students.length - absentIds.size;

  return (
    <div className="min-h-screen bg-sky-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-7">
          <Link
            href="/"
            className="inline-flex items-center gap-1 mb-3 text-sm text-slate-400 hover:text-slate-600 font-medium transition"
          >
            ← Home
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {presentCount} present · {absentIds.size} absent
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Student roster */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-sky-200 shadow-sm p-5 h-full">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Students ({students.length})
              </h2>
              <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
                {students.length === 0 ? (
                  <p className="text-slate-400 text-sm">No students in this class.</p>
                ) : (
                  students.map((student) => {
                    const absent = absentIds.has(student.id);
                    return (
                      <div
                        key={student.id}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg transition ${
                          absent ? 'opacity-40' : 'bg-sky-50 hover:bg-sky-100'
                        }`}
                      >
                        <span className={`text-sm text-slate-800 ${absent ? 'line-through' : ''}`}>
                          {student.full_name}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleAbsent(student.id)}
                          style={{
                            padding: '2px 10px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            background: absent ? '#fca5a5' : '#bae6fd',
                            color: absent ? '#991b1b' : '#0c4a6e',
                          }}
                        >
                          {absent ? 'Absent' : 'Present'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right: Group controls + results */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Controls card */}
            <div className="bg-white rounded-xl border border-sky-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Group Generator
              </h2>

              {students.length === 0 ? (
                <p className="text-slate-400 text-sm">No students to group.</p>
              ) : (
                <>
                  <div className="flex gap-4 mb-4 flex-wrap">
                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Group Size
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="20"
                        value={groupSize}
                        onChange={(e) => setGroupSize(Math.max(2, parseInt(e.target.value) || 2))}
                        className="w-full px-3 py-2 border border-sky-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-sky-50"
                      />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Leftovers
                      </label>
                      <select
                        value={strategy}
                        onChange={(e) => setStrategy(e.target.value as GroupingStrategy)}
                        className="w-full px-3 py-2 border border-sky-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-sky-50"
                      >
                        <option value="allow-smaller">Allow smaller last group</option>
                        <option value="distribute">Distribute across groups</option>
                      </select>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <button
                      onClick={handleGenerateGroups}
                      style={{ padding: '8px 20px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}
                    >
                      Generate
                    </button>
                    <button
                      onClick={groupResult ? handleRegenerateGroups : undefined}
                      style={{ padding: '8px 16px', background: groupResult ? '#f97316' : '#e2e8f0', color: groupResult ? '#fff' : '#94a3b8', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: groupResult ? 'pointer' : 'default', fontSize: '14px' }}
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={groupResult ? handleCopyGroups : undefined}
                      style={{ padding: '8px 16px', background: groupResult ? '#a855f7' : '#e2e8f0', color: groupResult ? '#fff' : '#94a3b8', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: groupResult ? 'pointer' : 'default', fontSize: '14px' }}
                    >
                      Copy
                    </button>
                    <button
                      onClick={groupResult ? pickRandomFromGroups : undefined}
                      style={{ padding: '8px 16px', background: groupResult ? '#0f172a' : '#e2e8f0', color: groupResult ? '#fff' : '#94a3b8', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: groupResult ? 'pointer' : 'default', fontSize: '14px' }}
                    >
                      Pick Random
                    </button>
                  </div>

                  {groupResult && (
                    <p className="text-xs text-slate-400 mt-3">
                      {remainingPickPool.length > 0
                        ? `${remainingPickPool.length} remaining in pick round`
                        : 'All students picked — next pick resets the round'}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Picked student */}
            {pickedStudent && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Selected</p>
                <p className="text-2xl font-bold text-amber-900">{pickedStudent}</p>
              </div>
            )}

            {/* Groups */}
            {groupResult && (
              <div className="bg-white rounded-xl border border-sky-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  Groups ({groupResult.groups.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                  {groupResult.groups.map((group, idx) => (
                    <div key={idx} className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-2">
                        Group {idx + 1}
                      </p>
                      <ul className="space-y-1">
                        {group.map((name, i) => (
                          <li key={i} className="text-sm text-slate-800">
                            {name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
