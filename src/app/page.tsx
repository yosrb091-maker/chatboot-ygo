import Script from "next/script";

// La page est rendue côté serveur ; les interactions sont dans public/script.js.
export const dynamic = "force-dynamic";

export default function HomePage() {
  const key = process.env.GEMINI_API_KEY?.trim();
  const isConfigured = Boolean(key && key !== "YOUR_API_KEY");

  return (
    <main className="page">
      {/* Les éléments du décor sont indépendants de l'interface. */}
      <div className="scenery" aria-hidden="true">
        {/* Globe et nuages : derrière le grand titre. */}
        <img className="hero-globe" src="/assets/02-blue-globe-clouds.png" alt="" />
        <div className="cloud-wash cloud-wash--left" />
        <div className="cloud-wash cloud-wash--right" />
        <img className="decor-cloud decor-cloud--left" src="/assets/07-decorative-clouds.png" alt="" />
        <img className="decor-cloud decor-cloud--right" src="/assets/07-decorative-clouds.png" alt="" />

        {/* Lignes de voyage en pointillés. */}
        <svg className="travel-route travel-route--top" viewBox="0 0 1440 280" preserveAspectRatio="none">
          <path d="M 47 183 C 205 238, 300 151, 401 94 S 541 70, 598 83" />
          <path d="M 874 169 C 1020 240, 1054 147, 1117 128 S 1160 123, 1184 103" />
        </svg>

        {/* Étoiles dorées. */}
        <img className="decor-stars" src="/assets/11-golden-stars.png" alt="" />

        {/* Avion vintage en haut à droite. */}
        <img className="decor-airplane" src="/assets/04-vintage-airplane.png" alt="" />

        {/* Polaroid 1 (gauche) : l'aile d'avion. */}
        <figure className="polaroid polaroid--wing">
          <span className="postcard-tape" />
          <div className="polaroid-photo">
            <img src="/assets/13-airplane-wing-photo.jpg" alt="" />
          </div>
        </figure>

        {/* Polaroid 2 (haut droite) : Santorin. Le ciel est dessiné en CSS derrière la photo détourée. */}
        <figure className="polaroid polaroid--santorini">
          <span className="postcard-tape" />
          <div className="polaroid-photo polaroid-photo--santorini">
            <img src="/assets/09-santorini-photo.png" alt="" />
          </div>
        </figure>

        {/* Polaroid 3 (bas droite) : tour Eiffel. */}
        <figure className="polaroid polaroid--eiffel">
          <span className="postcard-tape" />
          <div className="polaroid-photo polaroid-photo--eiffel">
            <img src="/assets/10-eiffel-photo.png" alt="" />
          </div>
        </figure>

        {/* Carte, valise, trajet avec épingle. */}
        <img className="decor-map" src="/assets/05-folded-travel-map.png" alt="" />
        <img className="decor-suitcase" src="/assets/03-vintage-suitcase.png" alt="" />
        <img className="decor-flight-path" src="/assets/12-flight-path-pin.png" alt="" />

        <svg className="bottom-waves" viewBox="0 0 1440 190" preserveAspectRatio="none">
          <path d="M0 49 C180 -3 269 43 392 105 C516 168 616 187 770 133 C920 80 1017 125 1150 145 C1277 166 1338 54 1440 63 L1440 190 L0 190Z" fill="#FFEEB9" />
          <path d="M0 117 C156 24 235 53 359 115 C500 186 584 180 747 139 C907 98 1043 120 1168 155 C1275 185 1360 121 1440 114 L1440 190 L0 190Z" fill="#BCD1DE" />
          <path d="M0 150 C139 73 196 114 320 161 C447 208 597 192 749 142 C909 89 1028 122 1164 160 C1285 194 1360 112 1440 112 L1440 190 L0 190Z" fill="#FFEEB9" />
          <path d="M0 190 L589 190 C738 156 803 108 914 117 C1030 126 1093 158 1167 174 C1285 200 1366 124 1440 129 L1440 190Z" fill="#5E442E" />
          <path d="M0 117 C156 24 235 53 359 115 C500 186 584 180 747 139 C907 98 1043 120 1168 155 C1275 185 1360 121 1440 114" fill="none" stroke="#FFF8E2" strokeWidth="2" opacity=".9" />
        </svg>
      </div>

      <div className="availability" title={isConfigured ? "Gemini est configuré" : "Ajoutez votre clé Gemini dans le fichier .env"}>
        <span className={isConfigured ? "availability-dot" : "availability-dot availability-dot--waiting"} />
        <span>{isConfigured ? "À votre écoute" : "Gemini à configurer"}</span>
      </div>

      <div className="page-content">
        <header className="brand" aria-label="YGO, assistant intelligent">
          <img className="brand-dove" src="/assets/01-golden-dove-logo.png" alt="Colombe dorée portant une branche d’olivier" />
          <div className="brand-lockup">
            <span className="brand-line" />
            <span className="brand-name">YGO</span>
            <span className="brand-line" />
          </div>
          <p className="brand-tagline">EXPLORER <span>•</span> PLANIFIER <span>•</span> DÉCOUVRIR</p>
        </header>

        <section className="hero" aria-labelledby="hero-title">
          <h1 id="hero-title">
            <span>Et si toutes vos idées</span>
            <em>commençaient par une question ?</em>
          </h1>
          <p className="hero-subtitle">
            Votre <strong>assistant intelligent</strong> pour découvrir, organiser{" "}<br className="desktop-break" />
            et planifier vos <strong>prochaines aventures.</strong>
            <svg className="hero-heart" viewBox="0 0 30 30" fill="none" aria-hidden="true">
              <path d="M14.4 25.8C12.3 22.9 4.3 16.2 4.3 10.3C4.3 6.9 6.5 5.3 8.6 5.7C11.1 6.2 12.5 8.7 13.2 11C15 7.8 17.3 6.1 19.6 6.6C22.1 7.2 23 9.3 22.2 11.9C21.2 15.4 18.5 20.3 14.4 25.8Z" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </p>
        </section>

        <section className="chat-card" aria-label="Conversation avec YGO">
          <button className="reset-button" id="reset-chat" type="button" title="Recommencer la conversation" aria-label="Recommencer la conversation">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 7v5h-5M4 17v-5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5.5 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.5-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="conversation" id="conversation" aria-live="polite" aria-relevant="additions">
            <div className="message message--assistant welcome-message">
              <div className="avatar"><img src="/assets/01-golden-dove-logo.png" alt="" /></div>
              <div className="message-bubble welcome-bubble" dir="auto">
                <h2>Bonjour ! Je suis YGO <span className="greeting-sparkle">✦</span></h2>
                <p>Je suis votre assistant intelligent. Posez-moi toutes vos questions ou laissez-moi vous aider à planifier votre prochain voyage.</p>
              </div>
            </div>
          </div>

          <div className="thinking" id="thinking" hidden role="status">
            <span className="thinking-dots"><i /><i /><i /></span>
            YGO réfléchit...
          </div>

          <div className="suggestions" aria-label="Suggestions de conversation">
            <button type="button" className="suggestion" data-prompt="travel">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m21 3-7.1 7.1-8.1-2.2L4 9.6l6.2 4.2-3.8 3.8-2.8-.7-1.1 1.1 3.3 1.4 1.4 3.3 1.1-1.1-.7-2.8 3.8-3.8 4.2 6.2 1.7-1.8-2.2-8.1L21 4.3c.5-.5.5-1.1 0-1.3Z" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" /></svg>
              <span>Planifier un voyage</span>
            </button>
            <button type="button" className="suggestion" data-prompt="ideas">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18h6M10 21h4M8.4 14.5a7 7 0 1 1 7.2 0c-.7.5-.9 1.2-.9 1.9H9.3c0-.7-.2-1.4-.9-1.9Z" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span>Trouver des idées</span>
            </button>
            <button type="button" className="suggestion" data-prompt="destination">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.65" /><path d="M3.5 12h17M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21M12 3C9.8 5.4 8.7 8.4 8.7 12s1.1 6.6 3.3 9M5 7.5h14M5 16.5h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
              <span>Découvrir une destination</span>
            </button>
            <button type="button" className="suggestion" data-prompt="question">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 2c.6 5.2 2.8 7.4 8 8-5.2.6-7.4 2.8-8 8-.6-5.2-2.8-7.4-8-8 5.2-.6 7.4-2.8 8-8ZM19 15c.3 2.3 1.4 3.5 4 3.8-2.6.3-3.7 1.4-4 3.7-.3-2.3-1.4-3.4-4-3.7 2.6-.3 3.7-1.5 4-3.8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
              <span>Poser une question</span>
            </button>
          </div>

          <form className="composer" id="chat-form">
            <label className="sr-only" htmlFor="message-input">Votre message à YGO</label>
            <svg className="composer-sparkle" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M14 2c.7 6.9 3.7 9.9 10.5 10.5C17.7 13.2 14.7 16.2 14 23c-.7-6.8-3.7-9.8-10.5-10.5C10.3 11.9 13.3 8.9 14 2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M25 19c.3 2.8 1.5 4 4.3 4.3-2.8.3-4 1.5-4.3 4.2-.3-2.7-1.5-3.9-4.3-4.2 2.8-.3 4-1.5 4.3-4.3Z" fill="currentColor" /></svg>
            <textarea id="message-input" rows={1} maxLength={6000} placeholder="Posez votre question à YGO..." dir="auto" required />
            <button className="send-button" id="send-button" type="submit" title="Envoyer" aria-label="Envoyer le message">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 3 10.1 13.9M21 3l-6.8 18-4.1-7.1L3 9.8 21 3Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </form>
        </section>

        <footer className="page-footer">
          Prix et disponibilités à vérifier <span className="footer-separator">·</span> Imaginé avec <span className="footer-heart" aria-label="amour">♡</span> par Yosr &amp; Ghofran <span className="footer-separator">·</span> Propulsé par Gemini
        </footer>
      </div>
      <Script src="/script.js?v=3" strategy="afterInteractive" />
    </main>
  );
}
