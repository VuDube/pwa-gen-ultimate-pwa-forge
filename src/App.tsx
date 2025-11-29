import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { HomePage } from '@/pages/HomePage';
import '@/index.css';
// This component contains the main application logic, including service worker registration.
function AppContent() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.error('SW registration failed: ', registrationError);
        });
      });
    }
  }, []);
  return <HomePage />;
}
// The router defines the application's routes.
const router = createBrowserRouter([
  {
    path: "/",
    element: <AppContent />,
    errorElement: <RouteErrorBoundary />,
  },
]);
// The main App component that provides the router to the application.
export function App() {
  return <RouterProvider router={router} />;
}