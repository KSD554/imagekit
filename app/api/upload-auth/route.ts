// @ts-nocheck
import { getUploadAuthParams } from "@imagekit/next/server";

export async function GET() {
  try {
    // Vérifier que les variables d'environnement sont présentes
    if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_PUBLIC_KEY) {
      console.error("Variables d'environnement ImageKit manquantes");
      return Response.json(
        { error: "Configuration ImageKit manquante" },
        { status: 500 }
      );
    }

    // Option 1: Laisser ImageKit gérer l'expiration automatiquement
    const authParams = getUploadAuthParams({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY as string
      // Pas de paramètre expire - ImageKit utilisera sa valeur par défaut
    });

    // Option 2: Si vous voulez contrôler l'expiration (commentée)
    /*
    const expireTimestamp = Math.floor(Date.now() / 1000) + (30 * 60); // 30 minutes
    const authParams = getUploadAuthParams({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY as string,
      expire: expireTimestamp
    });
    */

    console.log("Paramètres d'authentification générés:", {
      token: authParams.token.substring(0, 10) + "...",
      expire: authParams.expire,
      expireDate: new Date(authParams.expire * 1000).toISOString(),
      hasSignature: !!authParams.signature,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY?.substring(0, 10) + "..."
    });

    return Response.json({
      token: authParams.token,
      expire: authParams.expire,
      signature: authParams.signature,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    });

  } catch (error) {
    console.error("Erreur d'authentification d'upload:", error);
    return Response.json(
      { error: "Échec de la génération de l'authentification d'upload" },
      { status: 500 }
    );
  }
}