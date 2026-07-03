import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { file } = await req.json();
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const isPlaceholder = !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.includes("your-cloud-name") ||
      !process.env.CLOUDINARY_API_KEY ||
      process.env.CLOUDINARY_API_KEY.includes("your-api-key");

    if (isPlaceholder) {
      // Offline fallback: return the raw base64 data URI to keep the UI fully interactive
      return NextResponse.json({
        success: true,
        url: file
      });
    }

    const uploadResponse = await cloudinary.uploader.upload(file, {
      folder: "etarcos-etab",
      resource_type: "auto",
    });

    return NextResponse.json({
      success: true,
      url: uploadResponse.secure_url,
    });
  } catch (error: any) {
    console.error("Erreur d'upload Cloudinary:", error);
    return NextResponse.json({ error: error.message || "Erreur de téléversement" }, { status: 500 });
  }
}
