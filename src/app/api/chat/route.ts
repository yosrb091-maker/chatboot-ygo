import { BlockedReason, GoogleGenAI, type GenerateContentResponse } from "@google/genai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// C'est ici que vous pouvez modifier la personnalité et les règles de YGO.
const CONSIGNES_YGO = `Tu es YGO, un assistant intelligent chaleureux, clair et utile, créé par Yosr et Ghofran.
Tu réponds à absolument tous les sujets, pas seulement aux voyages : programmation et technologie, éducation, business et entrepreneuriat, sciences, mathématiques, santé générale, lifestyle, culture générale, actualité que tu connais, traduction, résumé, rédaction, analyse et génération d'idées. Comprends le contexte de toute la conversation et utilise les réponses précédentes, y compris pour les questions de suivi. Tu réponds naturellement, avec le bon niveau de détail, sans réponse préfabriquée.

Réponds toujours dans la langue et le registre du dernier message de l'utilisateur : français, anglais, arabe, arabe tunisien (derja) ou mélange de langues. Si l'utilisateur écrit en derja, réponds en derja avec des caractères arabes ou en arabizi selon son écriture. N'utilise une autre langue que si l'utilisateur le demande. Demande une précision seulement si elle est nécessaire. Ne prétends jamais avoir effectué une action, une recherche en direct ou une réservation que tu n'as pas faite.

Quand l'utilisateur veut organiser un voyage, accompagne-le dans une conversation progressive, pas un formulaire. Ne pose qu'une question à la fois et ne redemande jamais une information déjà donnée. Accepte les réponses libres, les corrections et les changements de choix. Si plusieurs informations ont déjà été données, passe directement à la prochaine information manquante. Si la personne veut passer une question facultative, accepte.

Les étapes, à adapter à ce qui est déjà connu :
1. Destination : si elle n'est pas connue et que c'est la première demande de planification, demande exactement en français « Avez-vous déjà choisi votre destination ou souhaitez-vous que je vous propose des destinations adaptées à vos envies ? » (traduis naturellement si l'utilisateur parle une autre langue). Si la personne n'a pas choisi, aide-la à comparer des destinations après avoir recueilli les informations utiles ; ne l'oblige pas à choisir tout de suite.
2. Ville ou pays de départ.
3. Dates approximatives et durée du séjour en jours.
4. Nombre de voyageurs.
5. Budget approximatif et devise. Pose ensuite une question séparée pour savoir si ce budget comprend le transport aller-retour, l'hébergement, les repas et les activités. Ne suppose jamais que le transport est inclus. Si la réponse est ambiguë, demande une précision ; si un poste est exclu ou inconnu, indique-le clairement.
6. Style de voyage : détente, aventure, culture et découverte, shopping, nature, romantique ou mélange de styles.
7. Préférences facultatives : activités, restaurants, type d'hébergement, moyens de transport et lieux incontournables. Pose une seule question ouverte, indique qu'on peut passer.

RÈGLE PRIORITAIRE POUR UNE DEMANDE DE VOYAGE : si le message contient déjà une destination, une durée et un budget, tu ne dois poser AUCUNE question avant d'avoir livré le plan. Produis immédiatement dans la même réponse le plan complet en quatre parties, en énonçant clairement tes hypothèses raisonnables (ville de départ, période, nombre de voyageurs, postes inclus dans le budget). Termine par une seule invitation à ajuster un point précis. Cela s'applique aussi si l'utilisateur demande explicitement un plan avec les informations disponibles. Si, et seulement si, la destination ou la durée manque réellement, pose une seule question courte. Dès que les informations nécessaires sont connues, produis un plan personnalisé et lisible en quatre parties :
A. Comparaison de plusieurs destinations adaptées si aucune n'est choisie, avec raison de visiter, budget estimatif, avantages et activités. Si une destination est choisie, compare des options de séjour ou de programme lorsque c'est pertinent.
B. Programme jour par jour avec activités, lieux, suggestions de repas et déplacements.
C. Budget sous forme de tableau Markdown : transport, hébergement, nourriture, activités, déplacements locaux, autres dépenses, total et budget restant si calculable. Utilise la devise demandée et distingue clairement ce qui est inclus, exclu ou inconnu. Indique clairement que les montants sont des estimations, pas des devis ; ne prétends pas à une précision ou à un prix vérifié que tu ne possèdes pas.
D. Hôtels et restaurants adaptés : suggère des noms uniquement si tu es suffisamment sûr de leur existence ; sinon propose des types d'établissements ou des quartiers sans inventer. Ne fabrique jamais d'adresse, de disponibilité, de réservation ou de prix attribué à un établissement. Indique que les prix, horaires et disponibilités doivent être vérifiés car tu n'as pas de données touristiques en temps réel.

Présente les réponses clairement, avec des titres, des listes et des tableaux Markdown quand cela aide. Reste concis tant que tu poses les questions.`;

// Directive ajoutée uniquement pour une demande de plan de voyage déjà suffisamment précise.
const DIRECTIVE_PLAN = `

DIRECTIVE POUR CE MESSAGE : l'utilisateur fournit une destination, une durée et un budget de voyage. Tu dois répondre immédiatement avec le plan complet en quatre parties (comparaison ou options, programme jour par jour, tableau de budget, hébergements et restaurants). Ne pose aucune question avant d'avoir rédigé le plan. Énonce clairement les hypothèses (ville de départ, période, nombre de voyageurs, postes inclus ou non dans le budget) et termine par une seule invitation à ajuster.`;

type HistoryItem = { role: "user" | "model"; text: string };

// Une demande de voyage déjà chiffrée doit recevoir un plan, sans interrogatoire.
function estDemandeDePlan(message: string): boolean {
  const evoqueUnVoyage = /planifi|itin[ée]raire|itinerary|\bplan\b|\btrip\b|voyage|vacances|holiday/i.test(message);
  const preciseUneDuree = /\b(jour|jours|day|days|nuit|nights?)\b/i.test(message);
  return evoqueUnVoyage && preciseUneDuree && /\d/.test(message);
}

// Ce modèle a été vérifié avec l'API Gemini. Il reste modifiable dans .env.
const MODELE_PAR_DEFAUT = "gemini-3.5-flash-lite";

// Limiter les données envoyées garde les requêtes simples et raisonnables.
function lireHistorique(value: unknown): HistoryItem[] {
  if (!Array.isArray(value)) return [];

  const messages = value
    .filter((item): item is HistoryItem => {
      if (!item || typeof item !== "object") return false;
      const entry = item as Record<string, unknown>;
      return (entry.role === "user" || entry.role === "model") && typeof entry.text === "string" && entry.text.trim().length > 0;
    })
    .slice(-40)
    .map((item) => ({ role: item.role, text: item.text.trim().slice(0, 12000) }));

  while (messages.reduce((total, item) => total + item.text.length, 0) > 60000) {
    messages.shift();
  }
  // Gemini attend que l'historique commence par un message utilisateur.
  while (messages.length && messages[0].role !== "user") messages.shift();
  return messages;
}

export async function POST(request: Request) {
  let body: { message?: unknown; history?: unknown };

  try {
    const length = Number(request.headers.get("content-length") || 0);
    if (length > 100000) {
      return Response.json({ error: "La conversation est trop longue. Recommencez une conversation." }, { status: 413 });
    }
    body = await request.json();
    if (!body || typeof body !== "object") throw new Error("invalid body");
  } catch {
    return Response.json({ error: "La demande est invalide. Réessayez avec un message." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return Response.json({ error: "Écrivez un message avant de l'envoyer." }, { status: 400 });
  }
  if (message.length > 6000) {
    return Response.json({ error: "Votre message est trop long (6 000 caractères maximum)." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "YOUR_API_KEY") {
    return Response.json(
      { error: "La clé Gemini n'est pas encore configurée. Ajoutez GEMINI_API_KEY dans le fichier .env, puis redémarrez le serveur." },
      { status: 503 },
    );
  }

  const history = lireHistorique(body.history);
  const contents = [
    ...history.map((item) => ({ role: item.role, parts: [{ text: item.text }] })),
    { role: "user" as const, parts: [{ text: message }] },
  ];

  try {
    // La clé ne quitte jamais le serveur. Le délai évite une attente infinie.
    const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 45000 } });
    let modele = process.env.GEMINI_MODEL?.trim() || MODELE_PAR_DEFAUT;

    const consignes = estDemandeDePlan(message) ? CONSIGNES_YGO + DIRECTIVE_PLAN : CONSIGNES_YGO;
    const demander = (model: string) => ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: consignes,
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });

    // Gemini peut être momentanément surchargé : deux nouveaux essais espacés.
    const generer = async (model: string) => {
      for (let essai = 1; ; essai += 1) {
        try {
          return await demander(model);
        } catch (error) {
          const status = Number((error as { status?: number }).status || 0);
          const passager = status === 429 || status === 500 || status === 503;
          if (!passager || essai >= 3) throw error;
          console.warn(`Gemini indisponible (${status}) ; nouvel essai ${essai}/2.`);
          await new Promise((resolve) => setTimeout(resolve, essai * 1500));
        }
      }
    };

    let result: GenerateContentResponse;
    try {
      result = await generer(modele);
    } catch (error) {
      const status = Number((error as { status?: number }).status || 0);
      // Les anciens modèles peuvent devenir indisponibles pour de nouveaux comptes.
      if (status !== 404 || modele === MODELE_PAR_DEFAUT) throw error;
      console.warn("Modèle Gemini configuré indisponible ; utilisation du modèle par défaut.");
      modele = MODELE_PAR_DEFAUT;
      result = await generer(modele);
    }

    // Une réponse peut être bloquée pour des raisons de sécurité : ne pas la réessayer automatiquement.
    const estBloquee = () => {
      const blocage = result.promptFeedback?.blockReason;
      const fin = String(result.candidates?.[0]?.finishReason || "");
      return Boolean(blocage && blocage !== BlockedReason.BLOCKED_REASON_UNSPECIFIED) || /SAFETY|BLOCKLIST|PROHIBITED|SPII|RECITATION/i.test(fin);
    };

    let reply = result.text?.trim();
    if (!reply && !estBloquee()) {
      // Gemini peut exceptionnellement renvoyer une réponse vide : un seul nouvel essai.
      console.warn("Réponse Gemini vide ; nouvel essai automatique.");
      result = await generer(modele);
      reply = result.text?.trim();
    }
    if (!reply) {
      const message = estBloquee()
        ? "Gemini n'a pas pu répondre à ce message pour des raisons de sécurité. Essayez de le reformuler."
        : "Gemini n'a renvoyé aucun texte après deux essais. Le service est peut-être momentanément indisponible.";
      return Response.json({ error: message }, { status: 502 });
    }
    return Response.json({ reply });
  } catch (error) {
    const info = error as { status?: number; code?: number; name?: string; message?: string };
    const status = Number(info?.status || info?.code || 0);
    const detail = String(info?.message || "");
    // Ne pas transmettre l'erreur brute : elle peut contenir des détails techniques sensibles.
    console.error("Échec de la requête Gemini", status || "connexion");
    if (status === 429 || /RESOURCE_EXHAUSTED|\b429\b/i.test(detail)) {
      return Response.json({ error: "La limite de requêtes Gemini est atteinte. Patientez un peu et réessayez." }, { status: 429 });
    }
    if (status === 401 || status === 403 || /API_KEY_INVALID|API key not valid|\b401\b|\b403\b/i.test(detail)) {
      return Response.json({ error: "La clé Gemini semble invalide ou ne permet pas cet accès. Vérifiez votre configuration." }, { status: 502 });
    }
    if (status === 404 || /\b404\b/.test(detail)) {
      return Response.json({ error: "Le modèle Gemini est indisponible pour cette clé. Vérifiez GEMINI_MODEL dans le fichier .env." }, { status: 502 });
    }
    if (info?.name === "AbortError" || /timed?\s*out|timeout|aborted/i.test(detail)) {
      return Response.json({ error: "Gemini met trop de temps à répondre. Réessayez dans un instant." }, { status: 504 });
    }
    return Response.json({ error: "Impossible de joindre Gemini pour le moment. Vérifiez votre connexion et réessayez." }, { status: 502 });
  }
}
