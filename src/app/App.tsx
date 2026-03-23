import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from 'next-themes';
import { Toaster } from './components/ui/sonner';
import { EventsProvider } from './context/EventsContext';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <EventsProvider>
        <RouterProvider router={router} />
        <Toaster />
      </EventsProvider>
    </ThemeProvider>
  );
}
