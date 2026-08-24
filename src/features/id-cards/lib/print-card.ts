import { formatDate, getInitials } from "@/lib/utils";
import type { IdCard } from "../types";

export function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Shared visual rules for a single card — reused by the single-card and
// batch (whole classroom) print windows so both stay pixel-identical.
const CARD_STYLES = `
  * { box-sizing: border-box; }
  .card {
    width: 340px; height: 214px;
    border-radius: 14px; overflow: hidden;
    border: 1.5px dashed #b9b9c6;
    background: #fff;
    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
    display: flex; flex-direction: column;
    break-inside: avoid; page-break-inside: avoid;
  }
  .card .head {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: #fff; padding: 8px 12px;
    display: flex; align-items: center; gap: 8px;
  }
  .card .head img { width: 22px; height: 22px; border-radius: 5px; object-fit: cover; background: #fff; }
  .card .head .brand-text { line-height: 1.15; overflow: hidden; }
  .card .head .brand-text b { font-size: 12px; display: block; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
  .card .head .brand-text span { font-size: 8.5px; opacity: 0.85; display: block; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
  .card .head .label { margin-left: auto; font-size: 8px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.9; text-align: right; }
  .card .body { flex: 1; display: flex; gap: 12px; padding: 12px; }
  .card .photo {
    width: 68px; height: 82px; border-radius: 8px; flex-shrink: 0;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; border: 1px solid #e5e5ec;
  }
  .card .photo img { width: 100%; height: 100%; object-fit: cover; }
  .card .photo span { color: #fff; font-size: 22px; font-weight: 700; }
  .card .info { flex: 1; min-width: 0; }
  .card .info .name { font-size: 14px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
  .card .info .row { font-size: 10.5px; color: #444; margin-bottom: 3px; display: flex; gap: 4px; }
  .card .info .row b { color: #1a1a2e; font-weight: 600; }
  .card .foot {
    border-top: 1px solid #eee; padding: 6px 12px;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 8.5px; color: #777;
  }
  .card .foot .serial { font-family: "Courier New", monospace; }
`;

function cardMarkup(card: IdCard): string {
  const studentName = escapeHtml(card.student?.user?.name ?? "—");
  const matricule = escapeHtml(card.student?.student_number ?? "—");
  const classroom = escapeHtml(card.student?.classroom?.name ?? "Sans classe");
  const dob = card.student?.user?.date_of_birth ? formatDate(card.student.user.date_of_birth) : "—";
  const establishmentName = escapeHtml(card.establishment?.name ?? "Établissement");
  const establishmentAddress = escapeHtml(
    [card.establishment?.address, card.establishment?.city].filter(Boolean).join(", ")
  );
  const establishmentPhone = escapeHtml(card.establishment?.phone ?? "");
  const logoUrl = card.establishment?.logo_url ? escapeHtml(card.establishment.logo_url) : "";
  const avatarUrl = card.student?.user?.avatar_url ? escapeHtml(card.student.user.avatar_url) : "";
  const initials = escapeHtml(getInitials(card.student?.user?.name ?? "?"));
  const academicYear = escapeHtml(card.academic_year?.name ?? "—");
  const serial = escapeHtml(card.serial_number);
  const issueDate = formatDate(card.issue_date);
  const expiryDate = card.expiry_date ? formatDate(card.expiry_date) : "—";

  return `
    <div class="card">
      <div class="head">
        ${logoUrl ? `<img src="${logoUrl}" alt="" />` : ""}
        <div class="brand-text">
          <b>${establishmentName}</b>
          <span>${establishmentAddress}${establishmentPhone ? " · " + establishmentPhone : ""}</span>
        </div>
        <div class="label">Carte<br/>d'élève</div>
      </div>
      <div class="body">
        <div class="photo">
          ${avatarUrl ? `<img src="${avatarUrl}" alt="" />` : `<span>${initials}</span>`}
        </div>
        <div class="info">
          <div class="name">${studentName}</div>
          <div class="row"><b>Matricule :</b> ${matricule}</div>
          <div class="row"><b>Classe :</b> ${classroom}</div>
          <div class="row"><b>Né(e) le :</b> ${dob}</div>
          <div class="row"><b>Année :</b> ${academicYear}</div>
        </div>
      </div>
      <div class="foot">
        <span class="serial">${serial}</span>
        <span>Émise le ${issueDate} · Exp. ${expiryDate}</span>
      </div>
    </div>
  `;
}

export function printIdCard(card: IdCard): void {
  const win = window.open("", "_blank", "width=520,height=420");
  if (!win) return;

  const studentName = escapeHtml(card.student?.user?.name ?? "—");

  win.document.write(`
    <html>
      <head>
        <title>Carte scolaire — ${studentName}</title>
        <style>
          body {
            font-family: -apple-system, "Segoe UI", Arial, sans-serif;
            display: flex; align-items: center; justify-content: center;
            min-height: 100vh; margin: 0; background: #f1f1f4;
          }
          .cut-hint { text-align: center; font-size: 11px; color: #888; margin-bottom: 10px; }
          ${CARD_STYLES}
          @media print {
            body { background: #fff; }
            .cut-hint { display: none; }
          }
        </style>
      </head>
      <body>
        <div>
          <p class="cut-hint">Format carte réelle — découpez le long du pointillé</p>
          ${cardMarkup(card)}
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

export function printIdCardsBatch(cards: IdCard[], classroomName?: string): void {
  if (cards.length === 0) return;
  const win = window.open("", "_blank", "width=800,height=600");
  if (!win) return;

  const title = classroomName ? `Cartes scolaires — ${escapeHtml(classroomName)}` : "Cartes scolaires";

  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, "Segoe UI", Arial, sans-serif;
            margin: 24px; background: #f1f1f4;
          }
          h1 { font-size: 14px; margin: 0 0 4px; }
          .count { font-size: 11px; color: #888; margin-bottom: 16px; }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 340px);
            gap: 14px;
          }
          ${CARD_STYLES}
          @media print {
            body { background: #fff; margin: 10mm; }
            h1, .count { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p class="count">${cards.length} carte${cards.length > 1 ? "s" : ""} — découpez le long des pointillés</p>
        <div class="grid">
          ${cards.map((card) => cardMarkup(card)).join("\n")}
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
