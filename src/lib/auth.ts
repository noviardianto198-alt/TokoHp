import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'pelanggan';
  createdAt?: string;
}

let browserClient: SupabaseClient | null = null;
let clientInitPromise: Promise<SupabaseClient | null> | null = null;

// Clean config strings
function cleanConfig(val?: string): string {
  if (!val) return '';
  let cleaned = val.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

/**
 * Mendapatkan Supabase client untuk browser secara dinamis dari endpoint server /api/auth/config
 * Menghindari hardcode kredensial dan aman menggunakan anon key.
 */
export async function getBrowserSupabase(): Promise<SupabaseClient | null> {
  if (browserClient) return browserClient;
  if (clientInitPromise) return clientInitPromise;

  clientInitPromise = (async () => {
    try {
      // Coba ambil config dari endpoint backend
      const res = await fetch('/api/auth/config');
      if (res.ok) {
        const data = await res.json();
        const url = cleanConfig(data.supabaseUrl);
        const anonKey = cleanConfig(data.supabaseAnonKey);

        if (url && anonKey) {
          browserClient = createClient(url, anonKey, {
            db: { schema: 'public' },
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              storageKey: 'tokohpnovi_supabase_auth',
            },
          });
          return browserClient;
        }
      }
    } catch (e) {
      console.warn('Gagal memuat konfigurasi Supabase dari /api/auth/config:', e);
    }
    return null;
  })();

  return clientInitPromise;
}

// Local mock profile storage fallback if database profiles table is not yet provisioned
const ADMIN_EMAILS = ['admin@tokohpnovi.id', 'owner@tokohpnovi.id', 'admin@toko.id'];

export function determineUserRole(email: string, userMetadata?: any): 'admin' | 'pelanggan' {
  if (!email) return 'pelanggan';
  const lower = email.toLowerCase().trim();
  if (ADMIN_EMAILS.includes(lower)) return 'admin';
  if (userMetadata?.role === 'admin') return 'admin';
  return 'pelanggan';
}

/**
 * Login dengan Supabase Auth
 */
export async function loginWithEmail(email: string, password: string): Promise<{
  user: UserProfile | null;
  error: string | null;
}> {
  try {
    const supabase = await getBrowserSupabase();
    if (!supabase) {
      // Jika Supabase credentials belum siap di browser, periksa lewat server API
      const serverRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await serverRes.json();
      if (!serverRes.ok) {
        return { user: null, error: data.error || 'Login gagal.' };
      }
      return { user: data.user, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      let msg = error.message;
      if (msg.toLowerCase().includes('invalid login credentials')) {
        msg = 'Email atau kata sandi yang Anda masukkan salah.';
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        msg = 'Email belum dikonfirmasi. Silakan periksa kotak masuk email Anda.';
      }
      return { user: null, error: msg };
    }

    if (!data.user) {
      return { user: null, error: 'User tidak ditemukan.' };
    }

    const profile: UserProfile = {
      id: data.user.id,
      email: data.user.email || email,
      fullName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Pelanggan',
      role: determineUserRole(data.user.email || '', data.user.user_metadata),
      createdAt: data.user.created_at,
    };

    // Save active session info in local storage for fast state sync
    localStorage.setItem('tokohpnovi_current_user', JSON.stringify(profile));

    return { user: profile, error: null };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Terjadi kesalahan sistem saat login.' };
  }
}

/**
 * Register Pelanggan baru dengan Supabase Auth.
 * Role SELALU diset sebagai 'pelanggan' untuk keamanan.
 */
export async function registerCustomer(
  fullName: string,
  email: string,
  password: string
): Promise<{
  user: UserProfile | null;
  error: string | null;
  requiresEmailConfirmation?: boolean;
}> {
  try {
    const cleanEmail = email.trim();
    const cleanName = fullName.trim();

    if (!cleanName) return { user: null, error: 'Nama lengkap wajib diisi.' };
    if (!cleanEmail) return { user: null, error: 'Email wajib diisi.' };
    if (password.length < 6) return { user: null, error: 'Kata sandi minimal 6 karakter.' };

    const supabase = await getBrowserSupabase();
    if (!supabase) {
      const serverRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: cleanName, email: cleanEmail, password }),
      });
      const data = await serverRes.json();
      if (!serverRes.ok) {
        return { user: null, error: data.error || 'Pendaftaran gagal.' };
      }
      return { user: data.user, error: null };
    }

    // Role is strictly hardcoded to 'pelanggan'
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          role: 'pelanggan', // strictly customer
        },
      },
    });

    if (error) {
      let msg = error.message;
      if (msg.toLowerCase().includes('already registered')) {
        msg = 'Email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.';
      }
      return { user: null, error: msg };
    }

    if (!data.user) {
      return { user: null, error: 'Gagal membuat akun pelanggan.' };
    }

    const isConfirmed = Boolean(data.session);

    const profile: UserProfile = {
      id: data.user.id,
      email: data.user.email || cleanEmail,
      fullName: cleanName,
      role: 'pelanggan',
      createdAt: data.user.created_at,
    };

    if (data.session) {
      localStorage.setItem('tokohpnovi_current_user', JSON.stringify(profile));
    }

    return {
      user: profile,
      error: null,
      requiresEmailConfirmation: !isConfirmed,
    };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Terjadi kesalahan sistem saat mendaftar.' };
  }
}

/**
 * Logout pengguna
 */
export async function logoutUser(): Promise<{ error: string | null }> {
  try {
    const supabase = await getBrowserSupabase();
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem('tokohpnovi_current_user');
    return { error: null };
  } catch (err: any) {
    localStorage.removeItem('tokohpnovi_current_user');
    return { error: null };
  }
}

/**
 * Mengambil session aktif saat ini
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const supabase = await getBrowserSupabase();
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        const u = data.session.user;
        const profile: UserProfile = {
          id: u.id,
          email: u.email || '',
          fullName: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Pengguna',
          role: determineUserRole(u.email || '', u.user_metadata),
          createdAt: u.created_at,
        };
        localStorage.setItem('tokohpnovi_current_user', JSON.stringify(profile));
        return profile;
      }
    }

    // Fallback local storage
    const stored = localStorage.getItem('tokohpnovi_current_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
  } catch (err) {
    console.warn('Error reading current user session:', err);
  }
  return null;
}
