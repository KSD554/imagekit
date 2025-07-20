// @ts-nocheck
import { getUploadAuthParams } from "@imagekit/next/server";

export async function GET() {
  try {
    // Génère un timestamp UNIX valide (dans 30 minutes)
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const expire = nowInSeconds + 30 * 60; // 30 minutes dans le futur

    // Génère les paramètres d’authentification
    const { token, signature } = getUploadAuthParams({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      expire,
    });

    return Response.json({
      token,
      expire,
      signature,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    });
  } catch (error) {
    console.error("Upload auth error:", error);
    return Response.json(
      { error: "Failed to generate upload authentication" },
      { status: 500 }
    );
  }
}
