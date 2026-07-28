/**
 * Utility function to export data to CSV (Excel compatible)
 */
export function exportToCSV<T extends object>(data: T[], filename: string) {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);

  const csvRows = [];
  csvRows.push(headers.join(","));

  for (const row of data) {
    const values = headers.map((header) => {
      const val = (row as Record<string, unknown>)[header];
      const escaped = ("" + (val === null || val === undefined ? "" : val)).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  const csvContent = "\uFEFF" + csvRows.join("\n");
  downloadBlob(csvContent, `${filename}_${dateSuffix()}.csv`, "text/csv;charset=utf-8;");
}

export interface ExportPDFOptions {
  title: string;
  subtitle?: string;
  filename?: string;
}

/**
 * Export PDF via impression navigateur (Ctrl+P → Enregistrer en PDF).
 * Phase 2 : intégration jsPDF / react-pdf pour génération serveur.
 */
export function exportToPDF(options: ExportPDFOptions) {
  if (typeof window === "undefined") return;

  const { title, subtitle, filename = "export" } = options;

  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 2rem; color: #111; }
          h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
          p { color: #666; font-size: 0.875rem; margin-bottom: 2rem; }
          @page { margin: 1.5cm; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
        <p>Document généré le ${new Date().toLocaleDateString("fr-FR")} – Etarcos Etab</p>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.document.title = `${filename}_${dateSuffix()}`;
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

function dateSuffix() {
  return new Date().toISOString().split("T")[0];
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}



