import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Suspense, lazy } from 'react';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { HomePage } from '@/pages/HomePage';
import { Skeleton } from '@/components/ui/skeleton';
import '@/index.css';
const HistoryPage = lazy(() => import('@/pages/HistoryPage').then(module => ({ default: module.HistoryPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(module => ({ default: module.SettingsPage })));
const LoadingFallback = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
    <div className="space-y-4">
      <Skeleton className="h-12 w-1/3" />
      <Skeleton className="h-64 w-full" />
    </div>
  </div>
);
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/history",
    element: <Suspense fallback={<LoadingFallback />}><HistoryPage /></Suspense>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/settings",
    element: <Suspense fallback={<LoadingFallback />}><SettingsPage /></Suspense>,
    errorElement: <RouteErrorBoundary />,
  },
]);
export function App() {
  return <RouterProvider router={router} />;
}