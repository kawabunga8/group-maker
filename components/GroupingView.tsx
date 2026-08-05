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

  return (
    <div className="min-h-screen bg-sky-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-block mb-3 text-sm text-slate-500 hover:text-slate-700 font-semibold"
          >
            ← Home
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Student roster */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded border border-sky-200 p-6 h-full">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Students ({students.length})
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {students.length === 0 ? (
                  <p className="text-slate-500 text-sm">No students in this class.</p>
                ) : (
                  students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="text-sm text-slate-900">{student.full_name}</span>
                      <button
                        type="button"
                        onClick={() => toggleAbsent(student.id)}
                        className={`text-xs px-2 py-1 rounded ${
                          absentIds.has(student.id)
                            ? 'bg-rose-500 text-white'
                            : 'bg-sky-100 text-slate-800'
                        }`}
                      >
                        {absentIds.has(student.id) ? 'Absent' : 'Present'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Group controls + results */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded border border-sky-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Group Generator</h2>

              {students.length === 0 ? (
                <p className="text-slate-500">No students to group.</p>
              ) : (
                <>
                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Group Size
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="20"
                        value={groupSize}
                        onChange={(e) => setGroupSize(Math.max(2, parseInt(e.target.value) || 2))}
                        className="w-full px-3 py-2 border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Leftover Handling
                      </label>
                      <select
                        value={strategy}
                        onChange={(e) => setStrategy(e.target.value as GroupingStrategy)}
                        className="w-full px-3 py-2 border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-400"
                      >
                        <option value="allow-smaller">Allow Last Group Smaller</option>
                        <option value="distribute">Distribute Across Groups</option>
                      </select>
                    </div>

                    {/* Action buttons — always visible; Regenerate/Copy/Pick disabled until groups exist */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <button
                        onClick={handleGenerateGroups}
                        className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition font-medium"
                      >
                        Generate
                      </button>
                      <button
                        onClick={handleRegenerateGroups}
                        disabled={!groupResult}
                        className="px-4 py-2 bg-orange-400 text-white rounded hover:bg-orange-500 transition font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Regenerate
                      </button>
                      <button
                        onClick={handleCopyGroups}
                        disabled={!groupResult}
                        className="px-4 py-2 bg-purple-400 text-white rounded hover:bg-purple-500 transition font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Copy
                      </button>
                      <button
                        onClick={pickRandomFromGroups}
                        disabled={!groupResult}
                        className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800 transition font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Pick Random
                      </button>
                    </div>

                    {groupResult && (
                      <p className="text-sm text-slate-500">
                        Remaining in round:{' '}
                        <span className="font-semibold">{remainingPickPool.length}</span>
                        {remainingPickPool.length === 0 && (
                          <span className="ml-1 opacity-70">(all picked — next pick resets)</span>
                        )}
                      </p>
                    )}

                    {pickedStudent && (
                      <div className="p-3 border border-sky-300 rounded bg-sky-50">
                        <div className="text-xs font-semibold text-sky-600 mb-1">Selected</div>
                        <div className="text-slate-900 font-medium">{pickedStudent}</div>
                      </div>
                    )}
                  </div>

                  {groupResult && (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Groups ({groupResult.groups.length})
                      </h3>
                      {groupResult.groups.map((group, idx) => (
                        <div key={idx} className="p-4 bg-blue-50 border border-blue-200 rounded">
                          <h4 className="font-semibold text-blue-900 mb-2">Group {idx + 1}</h4>
                          <ul className="space-y-1">
                            {group.map((name, i) => (
                              <li key={i} className="text-blue-800 text-sm">
                                {i + 1}. {name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
