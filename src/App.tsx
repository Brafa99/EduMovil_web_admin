import { RouterProvider } from 'react-router';
import { AuthProvider } from './auth/AuthContext';
import { ToastProvider } from './hooks/useToast';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  );
}
