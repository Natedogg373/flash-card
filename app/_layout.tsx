import { Stack } from 'expo-router';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    // Log for debugging and catch errors
    if (typeof window !== 'undefined') {
      console.log('App loaded on web platform');
      
      // Log any unhandled errors to help debug
      const originalError = window.onerror;
      window.onerror = (message, source, lineno, colno, error) => {
        console.error('JavaScript Error:', { message, source, lineno, colno, error });
        if (originalError) {
          return originalError(message, source, lineno, colno, error);
        }
        return false;
      };
      
      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
      });
    }
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

