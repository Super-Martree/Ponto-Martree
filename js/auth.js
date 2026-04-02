import { supabase } from './supabaseClient.js';

const ADMIN_ACCESS_KEY = 'martree_admin_access';

export async function login(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) throw error;
  return data;
}

export async function logout() {
  sessionStorage.removeItem(ADMIN_ACCESS_KEY);
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  window.location.href = './login.html';
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    if (error.name === 'AuthSessionMissingError' || error.message?.includes('Auth session missing')) {
      return null;
    }
    throw error;
  }
  return data.user;
}

export async function getFuncionarioLogado() {
  const user = await getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('funcionarios')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    window.location.href = './login.html';
    return null;
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (!user) return null;

  const funcionario = await getFuncionarioLogado();
  if (!funcionario || !funcionario.admin) {
    alert('Acesso negado: apenas administradores.');
    window.location.href = './dashboard.html';
    return null;
  }

  return { user, funcionario };
}

export function enableAdminNavigation(link) {
  if (!link) return;
  link.addEventListener('click', () => {
    sessionStorage.setItem(ADMIN_ACCESS_KEY, '1');
  });
}

export function ensureAdminNavigationIntent() {
  if (sessionStorage.getItem(ADMIN_ACCESS_KEY) === '1') return true;
  window.location.replace('./dashboard.html');
  return false;
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => callback(session));
}
