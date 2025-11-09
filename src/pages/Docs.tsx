import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import Loading from '@/components/common/Loading';

// Lazy load doc pages
const UsageGuidelines = lazy(() => import('@/pages/docs/UsageGuidelines'));
const ClaudeIntroduction = lazy(() => import('@/pages/docs/claude/Introduction'));
const ClaudeInstallation = lazy(() => import('@/pages/docs/claude/Installation'));

export default function Docs() {
  return (
    <PageLayout>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* 默认重定向到使用须知 */}
          <Route path="/" element={<Navigate to="/docs/usage-guidelines" replace />} />

          {/* 使用须知 */}
          <Route path="/usage-guidelines" element={<UsageGuidelines />} />

          {/* Claude 指南 */}
          <Route path="/claude/introduction" element={<ClaudeIntroduction />} />
          <Route path="/claude/installation" element={<ClaudeInstallation />} />

          {/* 其他路由后续添加 */}
          <Route path="*" element={<Navigate to="/docs/usage-guidelines" replace />} />
        </Routes>
      </Suspense>
    </PageLayout>
  );
}
