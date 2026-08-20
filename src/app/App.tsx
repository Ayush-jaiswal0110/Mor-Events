import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from 'next-themes';
import { Toaster } from './components/ui/sonner';
import { EventsProvider } from './context/EventsContext';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <EventsProvider>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster />
        </AuthProvider>
      </EventsProvider>
    </ThemeProvider>
  );
}
