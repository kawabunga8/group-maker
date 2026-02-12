'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, Class, Student } from '@/lib/supabaseClient';
import { generateGroups, GroupingStrategy, GroupingResult } from '@/lib/grouping';

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [bulkStudentText, setBulkStudentText] = useState('');
  const [groupSize, setGroupSize] = useState(3);
  const [strategy, setStrategy] = useState<GroupingStrategy>('allow-smaller');
  const [groupResult, setGroupResult] = useState<GroupingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBulkInput, setShowBulkInput] = useState(false);

  const [absentIds, setAbsentIds] = useState<Set<string>>(new Set());
  const [pickedStudent, setPickedStudent] = useState<string | null>(null);
  const [remainingPickPool, setRemainingPickPool] = useState<string[]>([]);


  function pickRandomFromGroups() {
    if (!groupResult) return;

    // If the pool is empty (or not initialized), initialize it from the current groups.
    const initPool = () => {
      const pool = groupResult.groups.flat();
      setRemainingPickPool(pool);
      return pool;
    };

    const pool = remainingPickPool.length > 0 ? remainingPickPool : initPool();
    if (pool.length === 0) return;

    const idx = Math.floor(Math.random() * pool.length);
    const chosen = pool[idx];

    // Remove the chosen student from the pool so we don't repeat until everyone has been picked.
    const nextPool = pool.filter((_, i) => i !== idx);

    setPickedStudent(chosen);
    setRemainingPickPool(nextPool);
  }

  function toggleAbsent(id: string) {
  setAbsentIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  }

  // Fetch class and students
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch class
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('*')
          .eq('id', classId)
          .single();

        if (classError) throw classError;
        setClassData(classData);

        // Fetch students
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .eq('class_id', classId)
          .order('created_at', { ascending: true });

        if (studentsError) throw studentsError;
        setStudents(studentsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (classId) fetchData();
  }, [classId]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    try {
      setError(null);
      const { data, error } = await supabase
        .from('students')
        .insert([{ class_id: classId, full_name: newStudentName }])
        .select();

      if (error) throw error;
      if (data && data[0]) {
        setStudents([...students, data[0]]);
        setNewStudentName('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add student');
    }
  };

  const handleBulkAddStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    const names = bulkStudentText
      .split('\n')
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (names.length === 0) return;

    try {
      setError(null);
      const insertData = names.map((name) => ({
        class_id: classId,
        full_name: name,
      }));

      const { data, error } = await supabase
        .from('students')
        .insert(insertData)
        .select();

      if (error) throw error;
      setStudents([...students, ...(data || [])]);
      setBulkStudentText('');
      setShowBulkInput(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add students');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      setError(null);
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      setStudents(students.filter((s) => s.id !== id));
      setGroupResult(null); // Clear groups
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete student');
    }
  };

  const handleGenerateGroups = () => {
    const presentStudents = students.filter((s) => !absentIds.has(s.id));
    const studentNames = presentStudents.map((s) => s.full_name);

    const result = generateGroups(studentNames, { groupSize, strategy });
    setPickedStudent(null);
    setRemainingPickPool(result.groups.flat());
    setGroupResult(result);
  };



  const handleRegenerateGroups = () => {
    setPickedStudent(null);
    setRemainingPickPool([]);
    handleGenerateGroups();
  };

  const handleCopyGroups = () => {
    if (!groupResult) return;

    const text = groupResult.groups
      .map((group, idx) => `Group ${idx + 1}:\n${group.join('\n')}`)
      .join('\n\n');

    navigator.clipboard.writeText(text);
    alert('Groups copied to clipboard!');
  };

  if (loading) {
    return <div className="p-8 text-slate-600">Loading...</div>;
  }

  if (!classData) {
    return (
      <div className="p-8">
        <p className="text-red-600">Class not found</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
        >
          Back to Classes
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{classData.name}</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition"
          >
            Back
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Students Management */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded border border-sky-200 p-6 h-full">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Students ({students.length})
              </h2>

              {/* Add Single Student */}
              <form onSubmit={handleAddStudent} className="mb-4">
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Student name..."
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="px-3 py-2 border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition"
                  >
                    Add Student
                  </button>
                </div>
              </form>

              {/* Bulk Add Toggle */}
              <button
                onClick={() => setShowBulkInput(!showBulkInput)}
                className="w-full mb-4 px-4 py-2 bg-sky-100 text-slate-900 rounded hover:bg-sky-200 transition text-sm"
              >
                {showBulkInput ? 'Hide Bulk Add' : 'Bulk Add'}
              </button>

              {/* Bulk Add Form */}
              {showBulkInput && (
                <form onSubmit={handleBulkAddStudents} className="mb-4">
                  <div className="flex flex-col gap-2">
                    <textarea
                      placeholder="One name per line..."
                      value={bulkStudentText}
                      onChange={(e) => setBulkStudentText(e.target.value)}
                      className="px-3 py-2 border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm h-28"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition"
                    >
                      Add All
                    </button>
                  </div>
                </form>
              )}

              {/* Students List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {students.length === 0 ? (
                  <p className="text-slate-500 text-sm">No students added yet</p>
                ) : (
                  students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="text-sm text-slate-900">{student.full_name}</span>
                      <div className="flex items-center gap-2">

                      <button
                        type="button"
                        onClick={() => toggleAbsent(student.id)}
                        className={`text-xs px-2 py-1 rounded ${
                          absentIds.has(student.id)
                          ? "bg-rose-500 text-white"
                          : "bg-sky-100 text-slate-800"
                        }`}
                      >
                        {absentIds.has(student.id) ? "Absent" : "Present"}
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                      >
                        ×
                      </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Grouping Controls & Results */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded border border-sky-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Group Generator
              </h2>

              {students.length === 0 ? (
                <p className="text-slate-500">Add students to generate groups</p>
              ) : (
                <>
                  {/* Controls */}
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
                        onChange={(e) => setGroupSize(Math.max(2, parseInt(e.target.value) || 1))}
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

                    <div className="flex gap-2">
                      <button
                        onClick={handleGenerateGroups}
                        className="flex-1 px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition font-medium"
                      >
                        Generate
                      </button>
                      {groupResult && (
                        <>
                          <button
                            onClick={handleRegenerateGroups}
                            className="flex-1 px-4 py-2 bg-orange-400 text-white rounded hover:bg-orange-500 transition font-medium"
                          >
                            Regenerate
                          </button>
                          <button
                            onClick={handleCopyGroups}
                            className="flex-1 px-4 py-2 bg-purple-400 text-white rounded hover:bg-purple-500 transition font-medium"
                          >
                            Copy
                          </button>
                          <button
                            onClick={pickRandomFromGroups}
                            className="flex-1 px-4 py-2 bg-slate-700 text-white rounded disabled:opacity-50"
                            disabled={!groupResult}
                            title={!groupResult ? "Generate groups first" : undefined}
                          >
                            Pick Random Student
                          </button>
                          <div className="flex-1 text-sm text-slate-600 self-center">
                            Remaining in this round: <span className="font-semibold">{remainingPickPool.length}</span>
                            {remainingPickPool.length === 0 ? (
                              <span className="ml-2 opacity-80">(all picked — next pick resets)</span>
                            ) : null}
                          </div>
                          {pickedStudent && (
                            <div className="mt-3 p-3 border rounded bg-white">
                              <div className="font-semibold">Selected Student</div>
                              <div>{pickedStudent}</div>
                            </div>
                          )}

                        </>
                      )}
                    </div>
                  </div>

                  {/* Results */}
                  {groupResult && (
                    <div className="mt-6 space-y-4 max-h-[400px] overflow-y-auto">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Groups ({groupResult.groups.length})
                      </h3>
                      {groupResult.groups.map((group, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-blue-50 border border-blue-200 rounded"
                        >
                          <h4 className="font-semibold text-blue-900 mb-2">
                            Group {idx + 1}
                          </h4>
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
