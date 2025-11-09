import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import Loading from '@/components/common/Loading';

// Lazy load doc pages
const Overview = lazy(() => import('@/pages/docs/Overview'));
const Installation = lazy(() => import('@/pages/docs/Installation'));

export default function Docs() {
  return (
    <PageLayout>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* 默认重定向到概述页 */}
          <Route path="/" element={<Navigate to="/docs/getting-started/overview" replace />} />

          {/* 快速开始 */}
          <Route path="/getting-started/overview" element={<Overview />} />
          <Route path="/getting-started/installation" element={<Installation />} />

          {/* 其他路由后续添加 */}
          <Route path="*" element={<Navigate to="/docs/getting-started/overview" replace />} />
        </Routes>
      </Suspense>
    </PageLayout>
  );
}
