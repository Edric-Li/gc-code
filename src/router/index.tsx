import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Loading from '@/components/common/Loading';

// Lazy load pages
const Home = lazy(() => import('@/pages/Home'));
const Docs = lazy(() => import('@/pages/Docs'));
const McpServers = lazy(() => import('@/pages/McpServers'));
const ApiEndpoints = lazy(() => import('@/pages/ApiEndpoints'));
const Usage = lazy(() => import('@/pages/Usage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function AppRouter() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/docs/*" element={<Docs />} />
        <Route path="/mcp" element={<McpServers />} />
        <Route path="/api" element={<ApiEndpoints />} />
        <Route path="/usage" element={<Usage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRouter;
