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

    // Générer un timestamp d'expiration unique pour chaque requête
    const expireTimestamp = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
    
    const authParams = getUploadAuthParams({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY as string,
      expire: expireTimestamp  // Crucial: Unique par requête
    });

    console.log("Paramètres d'authentification générés:", {
      token: authParams.token.substring(0, 10) + "...",
      expire: authParams.expire,
      expireDate: new Date(authParams.expire * 1000).toISOString(),
      hasSignature: !!authParams.signature,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY?.substring(0, 10) + "..."
    });

    // Retourner la réponse avec des headers anti-cache
    return new Response(JSON.stringify({
      token: authParams.token,
      expire: authParams.expire,
      signature: authParams.signature,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'  // Empêcher la mise en cache
      }
    });

  } catch (error) {
    console.error("Erreur d'authentification d'upload:", error);
    return Response.json(
      { error: "Échec de la génération de l'authentification d'upload" },
      { status: 500 }
    );
  }
}