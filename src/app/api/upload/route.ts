import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import * as Sentry from "@sentry/nextjs";
import { IMAGE_TYPES, MAX_UPLOAD_BYTES, validateUpload } from "@/lib/upload/validate";
import { checkRateLimit } from "@/lib/auth/rate-limit";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Taille max du corps JSON : fichier base64 (≈ 4/3) + marge pour l'enveloppe. */
const MAX_BODY_BYTES = Math.ceil((MAX_UPLOAD_BYTES * 4) / 3) + 64 * 1024;

function isCloudinaryConfigured(): boolean {
  const name = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  return !!name && !!key && !name.includes("your-cloud-name") && !key.includes("your-api-key");
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { allowed } = await checkRateLimit("upload", session.user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de téléversements. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (10 Mo max)." }, { status: 413 });
  }

  let body: { file?: unknown; kind?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  // `kind: "image"` (avatars, photos d'élèves) restreint aux formats image.
  const validation = validateUpload(body.file, {
    allowedTypes: body.kind === "image" ? IMAGE_TYPES : undefined,
  });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  if (!isCloudinaryConfigured()) {
    // En production, on refuse plutôt que de stocker un base64 brut en base.
    if (process.env.NODE_ENV === "production") {
      console.error("[upload] Cloudinary non configuré en production.");
      return NextResponse.json(
        { error: "Le stockage de fichiers n'est pas configuré." },
        { status: 503 }
      );
    }
    // Développement uniquement : renvoie le data URI pour garder l'UI utilisable.
    return NextResponse.json({ success: true, url: validation.dataUri });
  }

  try {
    const establishment = session.user.establishment_id ?? "global";
    const uploadResponse = await cloudinary.uploader.upload(validation.dataUri, {
      folder: `etarcos-etab/${establishment}`,
      resource_type: "auto",
    });

    return NextResponse.json({ success: true, url: uploadResponse.secure_url });
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "api/upload" } });
    console.error("Erreur d'upload Cloudinary:", error);
    return NextResponse.json({ error: "Erreur de téléversement" }, { status: 500 });
  }
}
