import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import Loading from '@/components/common/Loading';

// Lazy load doc pages
const ClaudeIntroduction = lazy(() => import('@/pages/docs/claude/Introduction'));
const ClaudeInstallation = lazy(() => import('@/pages/docs/claude/Installation'));

export default function Docs() {
  return (
    <PageLayout>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* 默认重定向到 Claude 介绍页 */}
          <Route path="/" element={<Navigate to="/docs/claude/introduction" replace />} />

          {/* Claude 指南 */}
          <Route path="/claude/introduction" element={<ClaudeIntroduction />} />
          <Route path="/claude/installation" element={<ClaudeInstallation />} />

          {/* 其他路由后续添加 */}
          <Route path="*" element={<Navigate to="/docs/claude/introduction" replace />} />
        </Routes>
      </Suspense>
    </PageLayout>
  );
}
