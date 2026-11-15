import { useState, type FormEvent } from "react";
import { createClient, updateClient } from "../ropa.client";
import type { RopaClient } from "../ropa.types";

type ClientFormModalProps = {
  token: string;
  // Si viene un cliente, el modal edita en vez de crear -- mismo
  // formulario para las dos cosas (mismo patron que ProductFormModal).
  client?: RopaClient;
  onCancelar: () => void;
  onGuardado: (client: RopaClient) => void;
};

// Cuenta corriente (15/09/2026): "lo unico obligatorio es nombre y
// fecha de vencimiento" -- email y telefono quedan opcionales.
export function ClientFormModal({ token, client, onCancelar, onGuardado }: ClientFormModalProps) {
  const isEditing = Boolean(client);
  const [name, setName] = useState(client?.name ?? "");
  const [dueDate, setDueDate] = useState(client?.dueDate ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Ingresá el nombre del cliente.");
      return;
    }
    if (!dueDate) {
      setError("Elegí la fecha de vencimiento.");
      return;
    }

    setError("");
    setGuardando(true);
    try {
      const payload = {
        name: name.trim(),
        dueDate,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined
      };

      const savedClient =
        isEditing && client ? await updateClient(token, client.id, payload) : await createClient(token, payload);

      onGuardado(savedClient);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el cliente.");
      setGuardando(false);
    }
  }

  return (
    <div className="ropa-modal-overlay">
      <div className="ropa-modal-box">
        <h2>{isEditing ? "Editar cliente" : "Nuevo cliente"}</h2>

        <form onSubmit={(event) => void handleSubmit(event)}>
          <label className="ropa-field">
            <span>Nombre</span>
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
          </label>

          <label className="ropa-field">
            <span>Fecha de vencimiento</span>
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </label>

          <label className="ropa-field">
            <span>Email (opcional)</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>

          <label className="ropa-field">
            <span>Teléfono (opcional)</span>
            <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>

          {error ? <p className="ropa-error">{error}</p> : null}

          <div className="ropa-modal-actions">
            <button type="button" className="ropa-button ropa-button--ghost" onClick={onCancelar} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="ropa-button ropa-button--primary" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
