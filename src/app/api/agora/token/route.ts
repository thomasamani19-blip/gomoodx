// /src/app/api/agora/token/route.ts
import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export async function POST(request: Request) {
  try {
    const { channelName, role: roleStr } = await request.json();

    if (!channelName) {
      return NextResponse.json({ status: 'error', message: 'Nom du canal manquant.' }, { status: 400 });
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      console.error("Agora App ID ou App Certificate manquant dans les variables d'environnement.");
      return NextResponse.json({ status: 'error', message: 'Configuration du serveur Agora incomplète.' }, { status: 500 });
    }

    const uid = 0; // Utiliser 0 pour un token universel ou générer un UID unique par utilisateur
    const role = roleStr === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const expirationTimeInSeconds = 3600; // 1 heure
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Construire le token
    const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs);
    
    console.log(`Token généré pour le canal ${channelName}: ${token} avec le rôle ${roleStr}`);

    return NextResponse.json({ token, appId, uid });

  } catch (error: any) {
    console.error("Erreur lors de la génération du token Agora:", error);
    return NextResponse.json({ status: 'error', message: error.message || 'Erreur Interne du Serveur' }, { status: 500 });
  }
}
