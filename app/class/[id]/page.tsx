import { Suspense } from 'react';
import ClassDetailClient from './ClassDetailClient';

export const dynamic = 'force-dynamic';

export default function ClassDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-600">Loading...</div>}>
      <ClassDetailClient />
    </Suspense>
  );
}
