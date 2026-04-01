import { useState, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

interface GoogleUser {
  access_token: string;
  expires_at: number;
  email?: string;
  name?: string;
  picture?: string;
}

const ALLOWED_EMAILS = ['impulxn8n@gmail.com', 'scmejia.impulxn8n@gmail.com'];

export const useGoogleAuth = () => {
  const [user, setUser] = useState<GoogleUser | null>(() => {
    const saved = localStorage.getItem('google_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.expires_at > Date.now()) return parsed;
    }
    return null;
  });

  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Token received:', tokenResponse);
      setIsAuthorizing(true);
      try {
        // Fetch user profile to get email
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        
        if (!res.ok) throw new Error(`Google API error: ${res.status}`);
        
        const profile = await res.json();
        console.log('User profile:', profile);

        if (!profile.email) {
          alert('❌ No se pudo obtener el correo de tu cuenta de Google. Asegúrate de dar los permisos necesarios.');
          return;
        }

        const email = profile.email.toLowerCase();

        if (!ALLOWED_EMAILS.some(e => e.toLowerCase() === email)) {
          alert(`⛔ ACCESO DENEGADO\n\nEl correo [${email}] no está en la lista de SM DIGITALS.\n\nPor favor, usa la cuenta autorizada o pide permiso al administrador.`);
          return;
        }

        const newUser = {
          access_token: tokenResponse.access_token,
          expires_at: Date.now() + tokenResponse.expires_in * 1000,
          email: email,
          name: profile.name,
          picture: profile.picture,
        };
        
        setUser(newUser);
        localStorage.setItem('google_session', JSON.stringify(newUser));
        console.log('Auth success for:', email);
      } catch (error: any) {
        console.error('Auth error detail:', error);
        alert(`❌ Error de Autenticación: ${error.message}`);
      } finally {
        setIsAuthorizing(false);
      }
    },
    onError: (error) => {
      console.error('Google Login Error:', error);
      alert('❌ Error al abrir el login de Google. Revisa que no tengas pop-ups bloqueados.');
    },
    scope: 'openid profile email https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/spreadsheets',
  });

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('google_session');
  }, []);

  const isConnected = !!user && user.expires_at > Date.now();
  const isAuthorized = isConnected && !!user?.email && ALLOWED_EMAILS.includes(user.email);

  return { login, logout, isConnected, isAuthorized, isAuthorizing, user, accessToken: user?.access_token };
};
