
// /src/app/api/agora/token/route.ts
import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export async function POST(request: Request) {
  try {
    const { channelName, uid: userUid } = await request.json();

    if (!channelName) {
      return NextResponse.json({ status: 'error', message: 'Nom du canal manquant.' }, { status: 400 });
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      console.error("Agora App ID ou App Certificate manquant dans les variables d'environnement.");
      return NextResponse.json({ status: 'error', message: 'Configuration du serveur Agora incomplète.' }, { status: 500 });
    }

    const uid = userUid || 0; // Utiliser l'UID de l'utilisateur si fourni, sinon 0
    const role = RtcRole.PUBLISHER; // Tout le monde est publisher dans un appel 1-1 ou pour streamer
    const expirationTimeInSeconds = 3600; // 1 heure
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Construire le token
    const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs);
    
    console.log(`Token généré pour le canal ${channelName} et UID ${uid}: ${token}`);

    return NextResponse.json({ token, appId, uid });

  } catch (error: any) {
    console.error("Erreur lors de la génération du token Agora:", error);
    return NextResponse.json({ status: 'error', message: error.message || 'Erreur Interne du Serveur' }, { status: 500 });
  }
}
