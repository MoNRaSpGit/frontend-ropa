import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getDiscountConfig, updateDiscountConfig } from "../ropa.client";
import type { RopaDiscountConfig } from "../ropa.types";

type AdminDiscountPageProps = {
  token: string;
  onGuardado: (config: RopaDiscountConfig) => void;
};

// Codigo de descuento (28/09/2026, pedido explicito): el admin carga el
// codigo (ej "ropaweb"), el porcentaje (entero 1-10) y si esta habilitado
// o no. Si esta deshabilitado, el carrito ni muestra el input para el
// cliente final -- ver CartDrawer.tsx.
export function AdminDiscountPage({ token, onGuardado }: AdminDiscountPageProps) {
  const [code, setCode] = useState("");
  const [percentage, setPercentage] = useState(10);
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDiscountConfig()
      .then((config) => {
        if (cancelled) return;
        setCode(config.code);
        setPercentage(config.percentage);
        setEnabled(config.enabled);
        setLoadError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "No se pudo cargar la configuración.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGuardar() {
    if (enabled && !code.trim()) {
      toast.error("Ingresá un código antes de habilitarlo.");
      return;
    }

    setIsSaving(true);
    try {
      const saved = await updateDiscountConfig(token, { code: code.trim(), percentage, enabled });
      setCode(saved.code);
      setPercentage(saved.percentage);
      setEnabled(saved.enabled);
      onGuardado(saved);
      toast.success("Código de descuento actualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="ropa-admin-main">
      <div className="ropa-admin-header">
        <h2>Código de descuento</h2>
      </div>

      {loadError ? <p className="ropa-error ropa-error--center">{loadError}</p> : null}
      {!loadError && isLoading ? <p className="ropa-hint">Cargando...</p> : null}

      {!loadError && !isLoading ? (
        <div className="ropa-discount-form">
          <label className="ropa-field">
            <span>Código</span>
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Ej: ropaweb"
              disabled={isSaving}
            />
          </label>

          <label className="ropa-field">
            <span>Porcentaje de descuento</span>
            <input
              type="number"
              min={1}
              max={10}
              step={1}
              value={percentage}
              onChange={(event) => setPercentage(Number(event.target.value))}
              disabled={isSaving}
            />
          </label>

          <div className="ropa-field">
            <span>¿Mostrar el código en el carrito?</span>
            <button
              type="button"
              className={enabled ? "ropa-toggle-button ropa-toggle-button--on" : "ropa-toggle-button ropa-toggle-button--off"}
              onClick={() => setEnabled((current) => !current)}
              disabled={isSaving}
            >
              {enabled ? "Activado" : "Desactivado"}
            </button>
          </div>

          <div className="ropa-modal-actions">
            <button type="button" className="ropa-button ropa-button--primary" onClick={() => void handleGuardar()} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
