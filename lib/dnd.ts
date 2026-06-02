// Shared drag-and-drop contract for dragging document cards onto the Ask Petal
// companion pane. Native HTML5 DnD via dataTransfer keeps the drag source
// (DocumentRow, in the Documents section tree) decoupled from the drop target
// (the Ask Petal composer, in the client layout tree) — no shared React state.

export const DOC_DND_MIME = "application/x-petal-doc";

export type DraggedDoc = {
  id: string;
  fileName: string;
  docTypeLabel: string;
};

/** Strip the file extension and underscores for a human-readable label. */
export function prettyDocName(fileName: string): string {
  return fileName.replace(/_/g, " ").replace(/\.[^.]+$/, "");
}
