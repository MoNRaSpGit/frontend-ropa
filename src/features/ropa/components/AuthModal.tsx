import { useState, type FormEvent } from "react";
import { loginUser, registerUser } from "../ropa.client";
import type { RopaSession } from "../ropa.session";

type AuthModalProps = {
  onCancelar: () => void;
  onIngresado: (session: RopaSession) => void;
};

// Un solo modal para las dos cosas: entrar con una cuenta que ya existe,
// o crear una nueva -- el registro publico siempre da el rol "usuario"
// (solo ve el catalogo). El unico administrador se crea aparte, no por
// aca.
export function AuthModal({ onCancelar, onIngresado }: AuthModalProps) {
  const [modo, setModo] = useState<"login" | "registro">("login");
  // Precargado TEMPORAL con las credenciales del admin, pedido explicito
  // (15/09/2026): "para entrar rapido ahora porque estoy probando" --
  // SOLO en modo desarrollo local (import.meta.env.DEV), nunca en el
  // build que se publica -- si esto se precargara tambien en produccion,
  // la contraseña del admin quedaria visible en el codigo JS publico del
  // sitio para cualquiera que abra el inspector del navegador.
  const [email, setEmail] = useState(import.meta.env.DEV ? "admin@ropa.com" : "");
  const [password, setPassword] = useState(import.meta.env.DEV ? "Ropaadmin2026!" : "");
  const [fullName, setFullName] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Completá email y contraseña.");
      return;
    }

    setError("");
    setGuardando(true);
    try {
      const result =
        modo === "login"
          ? await loginUser({ email: email.trim(), password })
          : await registerUser({ email: email.trim(), password, fullName: fullName.trim() || undefined });
      onIngresado(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la operación.");
      setGuardando(false);
    }
  }

  return (
    <div className="ropa-modal-overlay">
      <div className="ropa-modal-box">
        <h2>{modo === "login" ? "Ingresar" : "Crear cuenta"}</h2>

        <div className="ropa-auth-tabs">
          <button type="button" className={modo === "login" ? "ropa-chip is-active" : "ropa-chip"} onClick={() => setModo("login")}>
            Ya tengo cuenta
          </button>
          <button
            type="button"
            className={modo === "registro" ? "ropa-chip is-active" : "ropa-chip"}
            onClick={() => setModo("registro")}
          >
            Soy nuevo
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)}>
          {modo === "registro" ? (
            <label className="ropa-field">
              <span>Nombre (opcional)</span>
              <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} autoFocus />
            </label>
          ) : null}

          <label className="ropa-field">
            <span>{modo === "login" ? "Usuario o email" : "Email"}</span>
            <input
              type={modo === "login" ? "text" : "email"}
              autoCapitalize="none"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoFocus={modo === "login"}
            />
          </label>

          <label className="ropa-field">
            <span>Contraseña</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>

          {error ? <p className="ropa-error">{error}</p> : null}

          <div className="ropa-modal-actions">
            <button type="button" className="ropa-button ropa-button--ghost" onClick={onCancelar} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="ropa-button ropa-button--primary" disabled={guardando}>
              {guardando ? "Un momento..." : modo === "login" ? "Ingresar" : "Crear cuenta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
