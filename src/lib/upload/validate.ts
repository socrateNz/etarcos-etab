// ==================================================
// Validation des fichiers envoyés à /api/upload
// ==================================================
//
// Le client envoie le fichier sous forme de data URI base64. On n'accepte
// RIEN d'autre (pas d'URL distante, que Cloudinary irait récupérer), on
// limite les types MIME à une liste blanche et on vérifie la signature
// binaire réelle du fichier (le MIME déclaré par le client n'est pas fiable).

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 Mo — aligné sur le client

/** Signature binaire attendue (préfixe en octets, avec offset optionnel). */
type Signature = { offset?: number; bytes: number[] };

const PK_ZIP: Signature[] = [{ bytes: [0x50, 0x4b, 0x03, 0x04] }];
const OLE2: Signature[] = [{ bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }];

/**
 * Types autorisés → signatures acceptées. `null` = format texte, pas de
 * signature ; on vérifie seulement l'absence d'octets nuls.
 * SVG volontairement exclu (peut embarquer du JavaScript).
 */
export const ALLOWED_TYPES: Record<string, Signature[] | null> = {
  "image/jpeg": [{ bytes: [0xff, 0xd8, 0xff] }],
  "image/png": [{ bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  "image/gif": [{ bytes: [0x47, 0x49, 0x46, 0x38] }],
  "image/webp": [{ offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }],
  "application/pdf": [{ bytes: [0x25, 0x50, 0x44, 0x46] }],
  "application/msword": OLE2,
  "application/vnd.ms-excel": OLE2,
  "application/vnd.ms-powerpoint": OLE2,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": PK_ZIP,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": PK_ZIP,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": PK_ZIP,
  "text/plain": null,
  "text/csv": null,
};

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/** Valeur pour l'attribut `accept` des <input type="file"> côté client. */
export const ACCEPT_ATTRIBUTE = Object.keys(ALLOWED_TYPES).join(",");

export type UploadValidation =
  | { ok: true; mime: string; size: number; dataUri: string }
  | { ok: false; error: string };

const DATA_URI_RE = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+)(?:;[a-z0-9-]+=[^;,]+)*;base64,([A-Za-z0-9+/]*={0,2})$/i;

function matches(buf: Buffer, sig: Signature): boolean {
  const offset = sig.offset ?? 0;
  if (buf.length < offset + sig.bytes.length) return false;
  return sig.bytes.every((b, i) => buf[offset + i] === b);
}

export function validateUpload(
  file: unknown,
  options: { allowedTypes?: string[]; maxBytes?: number } = {}
): UploadValidation {
  const maxBytes = options.maxBytes ?? MAX_UPLOAD_BYTES;
  const allowed = options.allowedTypes ?? Object.keys(ALLOWED_TYPES);

  if (typeof file !== "string" || file.length === 0) {
    return { ok: false, error: "Aucun fichier fourni." };
  }

  // Rejet rapide avant tout décodage : taille base64 ≈ 4/3 de la taille réelle.
  if (file.length > Math.ceil((maxBytes * 4) / 3) + 200) {
    return { ok: false, error: "Fichier trop volumineux." };
  }

  const match = DATA_URI_RE.exec(file);
  if (!match) {
    return { ok: false, error: "Format de fichier invalide." };
  }

  const mime = match[1].toLowerCase();
  if (!allowed.includes(mime) || !(mime in ALLOWED_TYPES)) {
    return { ok: false, error: "Type de fichier non autorisé." };
  }

  const buf = Buffer.from(match[2], "base64");
  if (buf.length === 0) {
    return { ok: false, error: "Fichier vide." };
  }
  if (buf.length > maxBytes) {
    return { ok: false, error: "Fichier trop volumineux." };
  }

  const signatures = ALLOWED_TYPES[mime];
  if (signatures === null) {
    if (buf.includes(0)) {
      return { ok: false, error: "Le contenu du fichier ne correspond pas à son type." };
    }
  } else if (!signatures.some((sig) => matches(buf, sig))) {
    return { ok: false, error: "Le contenu du fichier ne correspond pas à son type." };
  }

  return { ok: true, mime, size: buf.length, dataUri: file };
}
