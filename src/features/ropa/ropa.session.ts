import type { RopaUser } from "./ropa.types";

// Sesion guardada en localStorage -- token + datos del usuario, para no
// tener que volver a loguearse en cada recarga.
const STORAGE_KEY = "ropa.session.v1";

export type RopaSession = {
  token: string;
  user: RopaUser;
};

export function loadSession(): RopaSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RopaSession;
    if (!parsed?.token || !parsed?.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: RopaSession) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Si localStorage no esta disponible, la sesion no persiste entre
    // recargas pero la app sigue funcionando en la pestaña actual.
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // sin efecto si localStorage no esta disponible
  }
}
