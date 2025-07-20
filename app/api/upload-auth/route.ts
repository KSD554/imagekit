// @ts-nocheck
import { getUploadAuthParams } from "@imagekit/next/server";
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    // Vérifier les variables d'environnement
    if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_PUBLIC_KEY) {
      console.error("Variables d'environnement ImageKit manquantes");
      return Response.json(
        { error: "Configuration ImageKit manquante" },
        { status: 500 }
      );
    }

    // Générer un token client unique
    const clientToken = uuidv4();
    
    // Calculer l'expiration (1 minute dans le futur)
    const expireTimestamp = Math.floor(Date.now() / 1000) + 60;
    
    const authParams = getUploadAuthParams({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      expire: expireTimestamp,
      token: clientToken  // Utiliser notre propre token
    });

    console.log("Nouveaux paramètres d'authentification:", {
      token: clientToken.substring(0, 8) + "...",
      expire: expireTimestamp,
      expireDate: new Date(expireTimestamp * 1000).toISOString(),
      signature: authParams.signature.substring(0, 8) + "..."
    });

    // Retourner la réponse
    return new Response(JSON.stringify({
      token: clientToken,
      expire: expireTimestamp,
      signature: authParams.signature,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    });

  } catch (error) {
    console.error("Erreur d'authentification:", error);
    return Response.json(
      { error: "Échec de la génération des paramètres d'upload" },
      { status: 500 }
    );
  }
}