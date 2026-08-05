import { Suspense } from 'react';
import CombinedDetailClient from './CombinedDetailClient';

export const dynamic = 'force-dynamic';

export default function CombinedPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-600">Loading...</div>}>
      <CombinedDetailClient />
    </Suspense>
  );
}
