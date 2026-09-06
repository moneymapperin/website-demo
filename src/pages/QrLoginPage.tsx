import React, { useEffect, useState, CSSProperties } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';

// Supabase Web Session Payload Interface
interface WebSessionPayload {
  session_token: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  status: 'PENDING' | 'AUTHENTICATED';
  created_at: string;
  authenticated_at: string | null;
}

// Initialize Supabase Client
const supabase = createClient(
  'https://upxsmlmsqxcwknvtywgk.supabase.co', // Replace with your Supabase URL
  'YOUR_SUPABASE_ANON_KEY'                  // Replace with your Supabase Anon Key
);

export const QrLoginPage: React.FC = () => {
  const [sessionToken, setSessionToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [scanned, setScanned] = useState<boolean>(false);

  useEffect(() => {
    // 1. Generate a unique session token for this web instance
    const token: string = uuidv4();
    setSessionToken(token);

    // 2. Insert initial pending session record in Supabase
    const initSession = async () => {
      await supabase.from('web_sessions').insert({
        session_token: token,
        status: 'PENDING',
      });
      setLoading(false);
    };

    initSession();

    // 3. Listen via Supabase Realtime for mobile app's scan event
    const channel: RealtimeChannel = supabase
      .channel(`qr-login-${token}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'web_sessions',
          filter: `session_token=eq.${token}`,
        },
        async (payload) => {
          const newSession = payload.new as WebSessionPayload;

          if (
            newSession.status === 'AUTHENTICATED' &&
            newSession.access_token &&
            newSession.refresh_token
          ) {
            setScanned(true);

            // 4. Hydrate Supabase auth session on Web
            await supabase.auth.setSession({
              access_token: newSession.access_token,
              refresh_token: newSession.refresh_token,
            });

            // 5. Cleanup database record & redirect to Web Dashboard
            await supabase.from('web_sessions').delete().eq('session_token', token);

            setTimeout(() => {
              window.location.href = '/dashboard'; // Redirect route
            }, 800);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Log in to MoneyMapper Web</h2>
        <p style={styles.subtitle}>
          Open the MoneyMapper app on your phone and scan this QR code to sign in instantly.
        </p>

        <div style={styles.qrWrapper}>
          {loading ? (
            <div style={styles.loader}>Generating Secure QR...</div>
          ) : scanned ? (
            <div style={styles.successWrapper}>
              <div style={styles.successIcon}>✓</div>
              <p style={styles.successText}>Authenticated! Redirecting...</p>
            </div>
          ) : (
            <QRCodeSVG value={sessionToken} size={240} level="H" />
          )}
        </div>

        <div style={styles.footerNote}>
          <span style={styles.shieldIcon}>🛡️</span> Works for both Personal & Corporate profiles
        </div>
      </div>
    </div>
  );
};

// Strongly Typed Styles
const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090B',
    color: '#FFFFFF',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    backgroundColor: '#18181B',
    padding: '40px',
    borderRadius: '24px',
    border: '1px solid #27272A',
    textAlign: 'center',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
  },
  title: {
    fontSize: '22px',
    fontWeight: '800',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#A1A1AA',
    lineHeight: '1.5',
    marginBottom: '28px',
  },
  qrWrapper: {
    backgroundColor: '#FFFFFF',
    padding: '20px',
    borderRadius: '20px',
    display: 'inline-block',
    minWidth: '240px',
    minHeight: '240px',
  },
  loader: {
    color: '#000',
    paddingTop: '100px',
    fontWeight: 'bold',
  },
  successWrapper: {
    color: '#10B981',
    paddingTop: '60px',
  },
  successIcon: {
    fontSize: '48px',
    fontWeight: 'bold',
  },
  successText: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: '10px',
  },
  footerNote: {
    fontSize: '12px',
    color: '#71717A',
    marginTop: '24px',
  },
  shieldIcon: {
    marginRight: '4px',
  },
};

export default QrLoginPage;
