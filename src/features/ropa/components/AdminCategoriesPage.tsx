import { useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { createCategory, deleteCategory, listCategories, moveCategory, renameCategory } from "../ropa.client";
import { setRopaGenres, useRopaGenres } from "../ropa.genres";

type AdminCategoriesPageProps = {
  token: string;
};

// Pestaña "Categorías" (16/11/2026, pedido explicito): el administrador agrega,
// renombra, ordena y borra categorias y subcategorias, para armarlas a medida.
// Renombrar cambia solo el nombre que se ve: los productos ya cargados siguen
// en su categoria. Borrar una que todavia tiene productos no se deja.
export function AdminCategoriesPage({ token }: AdminCategoriesPageProps) {
  const genres = useRopaGenres();
  const [newLabel, setNewLabel] = useState("");
  const [newSubLabels, setNewSubLabels] = useState<Record<number, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  // Celular: el campo de "nueva subcategoria" aparece solo al tocar el boton del grupo.
  const [openSubId, setOpenSubId] = useState<number | null>(null);

  async function reload() {
    setRopaGenres(await listCategories());
  }

  async function run(action: () => Promise<unknown>, successMessage?: string) {
    setBusy(true);
    try {
      await action();
      await reload();
      if (successMessage) toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el cambio.");
    } finally {
      setBusy(false);
    }
  }

  function handleAddCategory(event: FormEvent) {
    event.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    void run(async () => {
      await createCategory(token, label);
      setNewLabel("");
    }, "Categoría agregada.");
  }

  function handleAddSub(event: FormEvent, parentId: number) {
    event.preventDefault();
    const label = (newSubLabels[parentId] ?? "").trim();
    if (!label) return;
    void run(async () => {
      await createCategory(token, label, parentId);
      setNewSubLabels((current) => ({ ...current, [parentId]: "" }));
      setOpenSubId(null);
    }, "Subcategoría agregada.");
  }

  function startEdit(id: number | undefined, label: string) {
    if (id === undefined) return;
    setEditingId(id);
    setEditingLabel(label);
  }

  function saveEdit(id: number) {
    const label = editingLabel.trim();
    if (!label) return;
    void run(async () => {
      await renameCategory(token, id, label);
      setEditingId(null);
    }, "Nombre actualizado.");
  }

  function renderRow(id: number | undefined, label: string, isFirst: boolean, isLast: boolean, extra?: "sub") {
    if (id === undefined) return null;
    const isEditing = editingId === id;
    return (
      <div className={`ropa-cat-row${extra === "sub" ? " ropa-cat-row--sub" : ""}${isEditing || confirmDeleteId === id ? " ropa-cat-row--busy" : ""}`} key={id}>
        {isEditing ? (
          <input
            className="ropa-cat-input"
            value={editingLabel}
            onChange={(event) => setEditingLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") saveEdit(id);
              if (event.key === "Escape") setEditingId(null);
            }}
            autoFocus
            maxLength={120}
          />
        ) : (
          <span className="ropa-cat-label">{label}</span>
        )}

        <div className="ropa-cat-actions">
          {isEditing ? (
            <>
              <button type="button" className="ropa-button ropa-button--primary" disabled={busy} onClick={() => saveEdit(id)}>
                Guardar
              </button>
              <button type="button" className="ropa-button ropa-button--ghost" onClick={() => setEditingId(null)}>
                Cancelar
              </button>
            </>
          ) : confirmDeleteId === id ? (
            <>
              <span className="ropa-cat-confirm">¿Borrar{extra === "sub" ? "" : " y sus subcategorías"}?</span>
              <button
                type="button"
                className="ropa-button ropa-button--danger"
                disabled={busy}
                onClick={() => {
                  setConfirmDeleteId(null);
                  void run(() => deleteCategory(token, id), "Borrada.");
                }}
              >
                Sí, borrar
              </button>
              <button type="button" className="ropa-button ropa-button--ghost" onClick={() => setConfirmDeleteId(null)}>
                No
              </button>
            </>
          ) : (
            <>
              <button type="button" className="ropa-cat-icon" disabled={busy || isFirst} aria-label="Subir" onClick={() => void run(() => moveCategory(token, id, "up"))}>
                ↑
              </button>
              <button type="button" className="ropa-cat-icon" disabled={busy || isLast} aria-label="Bajar" onClick={() => void run(() => moveCategory(token, id, "down"))}>
                ↓
              </button>
              <button type="button" className="ropa-button ropa-button--ghost ropa-cat-text-button" aria-label="Renombrar" onClick={() => startEdit(id, label)}>
                <span className="ropa-cat-btn-text">Renombrar</span>
                <span className="ropa-cat-btn-icon" aria-hidden="true">
                  ✎
                </span>
              </button>
              <button type="button" className="ropa-button ropa-button--ghost ropa-cat-text-button" aria-label="Borrar" onClick={() => setConfirmDeleteId(id)}>
                <span className="ropa-cat-btn-text">Borrar</span>
                <span className="ropa-cat-btn-icon" aria-hidden="true">
                  🗑
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="ropa-admin-main">
      <div className="ropa-admin-header">
        <h2>Categorías</h2>
      </div>

      <p className="ropa-hint">
        Armá las categorías y subcategorías de la tienda a tu medida. Si le cambiás el nombre a una, los productos que ya
        tenía siguen en ella. Para borrar una, primero tenés que cambiar la categoría de sus productos.
      </p>

      <form className="ropa-cat-add" onSubmit={handleAddCategory}>
        <input
          className="ropa-cat-input"
          value={newLabel}
          onChange={(event) => setNewLabel(event.target.value)}
          placeholder="Nueva categoría (ej: Aros)"
          maxLength={120}
        />
        <button type="submit" className="ropa-button ropa-button--primary" disabled={busy || !newLabel.trim()}>
          + Agregar categoría
        </button>
      </form>

      <div className="ropa-cat-list">
        {genres.map((genre, index) => (
          <section className="ropa-cat-group" key={genre.key}>
            {renderRow(genre.id, genre.label, index === 0, index === genres.length - 1)}
            {genre.subcategories.map((sub, subIndex) =>
              renderRow(sub.id, sub.label, subIndex === 0, subIndex === genre.subcategories.length - 1, "sub")
            )}
            {genre.id !== undefined ? (
              <>
              <button
                type="button"
                className="ropa-button ropa-button--ghost ropa-cat-add-toggle"
                onClick={() => setOpenSubId(openSubId === genre.id ? null : (genre.id as number))}
              >
                {openSubId === genre.id ? "Cancelar" : "+ Subcategoría"}
              </button>
              <form className={`ropa-cat-add ropa-cat-add--sub${openSubId === genre.id ? " is-open" : ""}`} onSubmit={(event) => handleAddSub(event, genre.id as number)}>
                <input
                  className="ropa-cat-input"
                  value={newSubLabels[genre.id] ?? ""}
                  onChange={(event) => setNewSubLabels((current) => ({ ...current, [genre.id as number]: event.target.value }))}
                  placeholder={`Nueva subcategoría de ${genre.label}`}
                  maxLength={120}
                />
                <button
                  type="submit"
                  className="ropa-button ropa-button--ghost"
                  disabled={busy || !(newSubLabels[genre.id] ?? "").trim()}
                >
                  + Subcategoría
                </button>
              </form>
              </>
            ) : null}
          </section>
        ))}
        {genres.length === 0 ? <p className="ropa-hint">Todavía no hay categorías. Agregá la primera arriba.</p> : null}
      </div>
    </main>
  );
}
