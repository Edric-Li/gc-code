import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import Loading from '@/components/common/Loading';

// Lazy load doc pages
const UsageGuidelines = lazy(() => import('@/pages/docs/UsageGuidelines'));
const PrivacyPolicy = lazy(() => import('@/pages/docs/PrivacyPolicy'));
const QuickStartInstallation = lazy(() => import('@/pages/docs/quick-start/Installation'));
const QuickStartAuthentication = lazy(() => import('@/pages/docs/quick-start/Authentication'));
const QuickStartGettingStarted = lazy(() => import('@/pages/docs/quick-start/GettingStarted'));

export default function Docs() {
  return (
    <PageLayout>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* 默认重定向到快速开始 */}
          <Route path="/" element={<Navigate to="/docs/quick-start/installation" replace />} />

          {/* 快速开始 */}
          <Route path="/quick-start/installation" element={<QuickStartInstallation />} />
          <Route path="/quick-start/authentication" element={<QuickStartAuthentication />} />
          <Route path="/quick-start/getting-started" element={<QuickStartGettingStarted />} />

          {/* 使用须知 */}
          <Route path="/usage-guidelines" element={<UsageGuidelines />} />

          {/* 隐私策略 */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* 其他路由后续添加 */}
          <Route path="*" element={<Navigate to="/docs/quick-start/installation" replace />} />
        </Routes>
      </Suspense>
    </PageLayout>
  );
}
