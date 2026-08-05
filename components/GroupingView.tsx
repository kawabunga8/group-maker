'use client';

const btnStyles = `
  .gm-btn {
    transition: transform 0.1s ease, box-shadow 0.1s ease, filter 0.1s ease;
    user-select: none;
  }
  .gm-btn:active {
    transform: scale(0.93) translateY(2px);
    filter: brightness(0.92);
  }
  .gm-btn-active {
    box-shadow: 0 4px 12px rgba(0,0,0,0.22), 0 1px 3px rgba(0,0,0,0.12);
  }
  .gm-btn-active:active {
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }
  .gm-toggle-btn {
    transition: transform 0.1s ease, box-shadow 0.1s ease;
  }
  .gm-toggle-btn:active {
    transform: scale(0.9);
  }
`;

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
      <style>{btnStyles}</style>
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 mb-3 text-sm text-slate-400 hover:text-slate-600 font-medium transition"
          >
            ← Home
          </Link>
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
            {pickedStudent && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#fbbf24',
                border: '3px solid #d97706',
                borderRadius: '14px',
                padding: '8px 20px',
                boxShadow: '0 4px 16px rgba(217,119,6,0.45), 0 2px 4px rgba(0,0,0,0.15)',
              }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Selected</span>
                <span style={{ fontSize: '28px', fontWeight: 900, color: '#1c1917', letterSpacing: '-0.01em', lineHeight: 1.1 }}>{pickedStudent}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {presentCount} present · {absentIds.size} absent
          </p>
        </div>

        {/* 1 — Student Picker */}
        <div className="bg-white rounded-xl border border-sky-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Student Picker
          </h2>

          {/* Pick Random button + result */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={groupResult ? pickRandomFromGroups : undefined}
              className={`gm-btn ${groupResult ? 'gm-btn-active' : ''}`}
              style={{
                padding: '10px 22px',
                background: groupResult ? '#0f172a' : '#e2e8f0',
                color: groupResult ? '#fff' : '#94a3b8',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: groupResult ? 'pointer' : 'default',
                fontSize: '15px',
              }}
            >
              Pick Random
            </button>
            {!groupResult && (
              <span className="text-sm text-slate-400">Generate groups first</span>
            )}
            {groupResult && (
              <span className="text-xs text-slate-400">
                {remainingPickPool.length > 0
                  ? `${remainingPickPool.length} remaining`
                  : 'All picked — next resets round'}
              </span>
            )}
          </div>

        </div>

        {/* 2 — Group Generator controls + results */}
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

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  onClick={handleGenerateGroups}
                  className="gm-btn gm-btn-active"
                  style={{ padding: '8px 20px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}
                >
                  Generate
                </button>
                <button
                  onClick={groupResult ? handleRegenerateGroups : undefined}
                  className={`gm-btn ${groupResult ? 'gm-btn-active' : ''}`}
                  style={{ padding: '8px 16px', background: groupResult ? '#f97316' : '#e2e8f0', color: groupResult ? '#fff' : '#94a3b8', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: groupResult ? 'pointer' : 'default', fontSize: '14px' }}
                >
                  Regenerate
                </button>
                <button
                  onClick={groupResult ? handleCopyGroups : undefined}
                  className={`gm-btn ${groupResult ? 'gm-btn-active' : ''}`}
                  style={{ padding: '8px 16px', background: groupResult ? '#a855f7' : '#e2e8f0', color: groupResult ? '#fff' : '#94a3b8', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: groupResult ? 'pointer' : 'default', fontSize: '14px' }}
                >
                  Copy
                </button>
              </div>

              {groupResult && (
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {groupResult.groups.map((group, idx) => (
                    <div key={idx} className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-2">
                        Group {idx + 1}
                      </p>
                      <ul className="space-y-1">
                        {group.map((name, i) => (
                          <li key={i} className="text-sm text-slate-800">{name}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* 3 — Full student list */}
        <div className="bg-white rounded-xl border border-sky-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Students ({students.length})
          </h2>
          <div className="space-y-1.5">
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
                      className="gm-toggle-btn"
                      style={{
                        padding: '2px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        background: absent ? '#fca5a5' : '#bae6fd',
                        color: absent ? '#991b1b' : '#0c4a6e',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
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
    </div>
  );
}
