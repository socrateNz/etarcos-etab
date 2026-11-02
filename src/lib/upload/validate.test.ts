import { describe, expect, it } from "vitest";
import { IMAGE_TYPES, validateUpload } from "./validate";

const toDataUri = (mime: string, bytes: number[] | Buffer) =>
  `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];
const PDF = [...Buffer.from("%PDF-1.7\n")];

describe("validateUpload", () => {
  it("accepte un PNG valide", () => {
    const res = validateUpload(toDataUri("image/png", PNG));
    expect(res).toMatchObject({ ok: true, mime: "image/png", size: PNG.length });
  });

  it("accepte un PDF valide", () => {
    expect(validateUpload(toDataUri("application/pdf", PDF)).ok).toBe(true);
  });

  it("accepte un WEBP (signature à l'offset 8)", () => {
    const webp = [...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBPVP8 ")];
    expect(validateUpload(toDataUri("image/webp", webp)).ok).toBe(true);
  });

  it("accepte un CSV texte", () => {
    expect(validateUpload(toDataUri("text/csv", Buffer.from("a,b\n1,2\n"))).ok).toBe(true);
  });

  it("refuse une URL distante (pas de fetch côté Cloudinary)", () => {
    expect(validateUpload("https://evil.example/x.png").ok).toBe(false);
    expect(validateUpload("http://169.254.169.254/latest/meta-data").ok).toBe(false);
  });

  it("refuse une entrée qui n'est pas une chaîne ou est vide", () => {
    expect(validateUpload(undefined).ok).toBe(false);
    expect(validateUpload({}).ok).toBe(false);
    expect(validateUpload("").ok).toBe(false);
  });

  it("refuse un type hors liste blanche (SVG, HTML, exécutable)", () => {
    expect(validateUpload(toDataUri("image/svg+xml", Buffer.from("<svg/>"))).ok).toBe(false);
    expect(validateUpload(toDataUri("text/html", Buffer.from("<script>"))).ok).toBe(false);
    expect(validateUpload(toDataUri("application/x-msdownload", [0x4d, 0x5a])).ok).toBe(false);
  });

  it("refuse un fichier dont le contenu ne correspond pas au MIME déclaré", () => {
    const res = validateUpload(toDataUri("image/png", PDF));
    expect(res).toEqual({ ok: false, error: "Le contenu du fichier ne correspond pas à son type." });
  });

  it("refuse un fichier texte contenant des octets binaires", () => {
    expect(validateUpload(toDataUri("text/plain", [0x41, 0x00, 0x42])).ok).toBe(false);
  });

  it("refuse un fichier trop volumineux", () => {
    const big = Buffer.alloc(2048, 0x41);
    expect(validateUpload(toDataUri("text/plain", big), { maxBytes: 1024 })).toEqual({
      ok: false,
      error: "Fichier trop volumineux.",
    });
  });

  it("restreint aux images quand demandé", () => {
    expect(validateUpload(toDataUri("application/pdf", PDF), { allowedTypes: IMAGE_TYPES }).ok).toBe(false);
    expect(validateUpload(toDataUri("image/png", PNG), { allowedTypes: IMAGE_TYPES }).ok).toBe(true);
  });
});
