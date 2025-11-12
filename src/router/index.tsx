import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Loading from '@/components/common/Loading';
import AdminLayout from '@/components/admin/AdminLayout';

// Lazy load pages
const Home = lazy(() => import('@/pages/Home'));
const Docs = lazy(() => import('@/pages/Docs'));
const McpServers = lazy(() => import('@/pages/McpServers'));
const Experience = lazy(() => import('@/pages/Experience'));
const Usage = lazy(() => import('@/pages/Usage'));
const Login = lazy(() => import('@/pages/Login'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Admin pages
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const Users = lazy(() => import('@/pages/admin/Users'));
const Organizations = lazy(() => import('@/pages/admin/Organizations'));
const Logs = lazy(() => import('@/pages/admin/Logs'));
const ApiKeys = lazy(() => import('@/pages/admin/ApiKeys'));
const AiProviders = lazy(() => import('@/pages/admin/AiProviders'));
const Channels = lazy(() => import('@/pages/admin/Channels'));

function AppRouter() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/docs/*" element={<Docs />} />
        <Route path="/mcp" element={<McpServers />} />
        <Route path="/experience" element={<Experience />} />
        <Route path="/usage" element={<Usage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="organizations" element={<Organizations />} />
          <Route path="logs" element={<Logs />} />
          <Route path="api-keys" element={<ApiKeys />} />
          <Route path="ai-providers" element={<AiProviders />} />
          <Route path="channels" element={<Channels />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRouter;
