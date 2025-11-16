import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Loading from '@/components/common/Loading';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import ConsoleLayout from '@/components/console/ConsoleLayout';

// Lazy load pages
const Home = lazy(() => import('@/pages/Home'));
const Docs = lazy(() => import('@/pages/Docs'));
const McpServers = lazy(() => import('@/pages/McpServers'));
const Experience = lazy(() => import('@/pages/Experience'));
const Usage = lazy(() => import('@/pages/Usage'));
const ManualLogin = lazy(() => import('@/pages/ManualLogin'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Console pages
const ConsoleDashboard = lazy(() => import('@/pages/console/Dashboard'));
const ConsoleApiKeys = lazy(() => import('@/pages/console/ApiKeys'));
const ConsoleLogs = lazy(() => import('@/pages/console/Logs'));

// Admin pages
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const Users = lazy(() => import('@/pages/admin/Users'));
const Organizations = lazy(() => import('@/pages/admin/Organizations'));
const Logs = lazy(() => import('@/pages/admin/Logs'));
const ApiKeys = lazy(() => import('@/pages/admin/ApiKeys'));
const AiProviders = lazy(() => import('@/pages/admin/AiProviders'));
const Channels = lazy(() => import('@/pages/admin/Channels'));
const NotificationSettings = lazy(() => import('@/pages/admin/NotificationSettings'));
const AlertHistory = lazy(() => import('@/pages/admin/AlertHistory'));

function AppRouter() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public routes - 无需登录 */}
        <Route path="/login/manual" element={<ManualLogin />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected routes - 需要登录 */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/docs/*"
          element={
            <ProtectedRoute>
              <Docs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mcp"
          element={
            <ProtectedRoute>
              <McpServers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/experience"
          element={
            <ProtectedRoute>
              <Experience />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usage"
          element={
            <ProtectedRoute>
              <Usage />
            </ProtectedRoute>
          }
        />

        {/* Console routes - 需要登录 */}
        <Route
          path="/console"
          element={
            <ProtectedRoute>
              <ConsoleLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ConsoleDashboard />} />
          <Route path="api-keys" element={<ConsoleApiKeys />} />
          <Route path="logs" element={<ConsoleLogs />} />
        </Route>

        {/* Admin routes - 需要管理员权限 */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="organizations" element={<Organizations />} />
          <Route path="logs" element={<Logs />} />
          <Route path="api-keys" element={<ApiKeys />} />
          <Route path="ai-providers" element={<AiProviders />} />
          <Route path="channels" element={<Channels />} />
          <Route path="notifications" element={<NotificationSettings />} />
          <Route path="alerts" element={<AlertHistory />} />
        </Route>

        {/* 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRouter;
