import { Suspense } from 'react';
import ClassesClient from './ClassesClient';

export const dynamic = 'force-dynamic';

export default function ClassesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sky-50 flex items-center justify-center text-slate-400">Loading...</div>}>
      <ClassesClient />
    </Suspense>
  );
}
