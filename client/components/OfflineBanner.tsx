import React from 'react';
import { useAuth } from '@/store/adapters/authAdapter';
import { Button } from '@/components/ui/button';

export default function OfflineBanner() {
  const { currentUser } = useAuth();
  const [visible, setVisible] = React.useState(true);

  if (!visible) return null;

  const isGuest = !!(currentUser as any)?.isGuest;

  if (!isGuest) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[min(900px,calc(100%-2rem))]">
      <div className="flex items-center justify-between bg-yellow-50 border-l-4 border-yellow-400 text-yellow-900 px-4 py-3 rounded shadow-md">
        <div>
          <p className="font-medium">You are in Guest / Offline Mode</p>
          <p className="text-sm text-yellow-800">Some features are limited. Sign in for full functionality.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }))}
            className="bg-white text-black"
          >
            Sign In
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setVisible(false)}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
