import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { HomePage } from '@/pages/HomePage';
import '@/index.css';
// The router defines the application's routes.
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
]);
// The main App component that provides the router to the application.
export function App() {
  return <RouterProvider router={router} />;
}