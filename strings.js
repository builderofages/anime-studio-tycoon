// All player-visible UI strings, with multi-language support.
// Switching language = swapping this data (STR is mutated in place so existing imports stay valid).

const EN = {
  title:"Anime Studio Tycoon", tagline:"From a one-room studio to a global anime empire",
  start:"Enter the Studio", startPlay:"Play", startDemo:"Try Demo",
  startPlayHint:"Real game — start from ¥1,500, hire staff, greenlight your first anime.",
  startDemoHint:'Showcase tour — pre-loaded Sakura studio for screenshots (<code>?demo=1</code>).',
  startShare:"Share", startShareHint:"Invite friends — link opens the real game start (not demo).",
  goal:"Goal",
  res_yen:"Yen", res_fans:"Fans", res_hype:"Hype", netWorth:"Studio Value", trend:"Trending",
  tab_produce:"Produce", tab_quests:"Quests", tab_staff:"Staff", tab_stars:"Stars",
  tab_research:"Research", tab_studio:"Studio", tab_market:"Marketing", tab_store:"Store",
  greenlight:"Greenlight", release:"Release!", rush:"Rush (Hype)", overdrive:"Overdrive (Hype)", hire:"Hire",
  h_dashboard:"Studio Dashboard", h_daily:"Daily Quests", h_weekly:"Weekly Quests",
  h_login:"30-Day Login Calendar", h_rewards:"Rewards & Quests", h_achievements:"Achievements",
  h_store:"Store", h_freeRewards:"Free Rewards",
  claim:"Claim", resetsIn:"resets in",
  offlineTitle:"While you were away",
  muteOn:"Sound: On", muteOff:"Sound: Off", save:"Save", reset:"Reset",
  privacy:"Privacy", terms:"Terms", share:"Share", language:"Language",
};
const ES = {
  title:"Anime Studio Tycoon", tagline:"De un estudio de una sala a un imperio global del anime",
  start:"Entrar al Estudio", goal:"Meta",
  res_yen:"Yenes", res_fans:"Fans", res_hype:"Hype", netWorth:"Valor del Estudio", trend:"Tendencia",
  tab_produce:"Producir", tab_quests:"Misiones", tab_staff:"Equipo", tab_stars:"Estrellas",
  tab_research:"Investigar", tab_studio:"Estudio", tab_market:"Marketing", tab_store:"Tienda",
  greenlight:"Aprobar", release:"¡Estrenar!", rush:"Acelerar (Hype)", overdrive:"Sobremarcha (Hype)", hire:"Contratar",
  h_dashboard:"Panel del Estudio", h_daily:"Misiones Diarias", h_weekly:"Misiones Semanales",
  h_login:"Calendario de 30 Días", h_rewards:"Recompensas y Misiones", h_achievements:"Logros",
  h_store:"Tienda", h_freeRewards:"Recompensas Gratis",
  claim:"Reclamar", resetsIn:"se reinicia en",
  offlineTitle:"Mientras no estabas",
  muteOn:"Sonido: Sí", muteOff:"Sonido: No", save:"Guardar", reset:"Reiniciar",
  privacy:"Privacidad", terms:"Términos", share:"Compartir", language:"Idioma",
};
const PT = {
  title:"Anime Studio Tycoon", tagline:"De um estúdio de uma sala a um império global do anime",
  start:"Entrar no Estúdio", goal:"Meta",
  res_yen:"Ienes", res_fans:"Fãs", res_hype:"Hype", netWorth:"Valor do Estúdio", trend:"Em alta",
  tab_produce:"Produzir", tab_quests:"Missões", tab_staff:"Equipe", tab_stars:"Estrelas",
  tab_research:"Pesquisa", tab_studio:"Estúdio", tab_market:"Marketing", tab_store:"Loja",
  greenlight:"Aprovar", release:"Estrear!", rush:"Acelerar (Hype)", overdrive:"Turbo (Hype)", hire:"Contratar",
  h_dashboard:"Painel do Estúdio", h_daily:"Missões Diárias", h_weekly:"Missões Semanais",
  h_login:"Calendário de 30 Dias", h_rewards:"Recompensas e Missões", h_achievements:"Conquistas",
  h_store:"Loja", h_freeRewards:"Recompensas Grátis",
  claim:"Resgatar", resetsIn:"reinicia em",
  offlineTitle:"Enquanto você esteve fora",
  muteOn:"Som: Ligado", muteOff:"Som: Desligado", save:"Salvar", reset:"Reiniciar",
  privacy:"Privacidade", terms:"Termos", share:"Compartilhar", language:"Idioma",
};
const FR = {
  title:"Anime Studio Tycoon", tagline:"D'un studio d'une pièce à un empire mondial de l'anime",
  start:"Entrer dans le Studio", goal:"Objectif",
  res_yen:"Yens", res_fans:"Fans", res_hype:"Hype", netWorth:"Valeur du Studio", trend:"Tendance",
  tab_produce:"Produire", tab_quests:"Quêtes", tab_staff:"Équipe", tab_stars:"Stars",
  tab_research:"Recherche", tab_studio:"Studio", tab_market:"Marketing", tab_store:"Boutique",
  greenlight:"Lancer", release:"Sortie !", rush:"Accélérer (Hype)", overdrive:"Surrégime (Hype)", hire:"Recruter",
  h_dashboard:"Tableau de bord", h_daily:"Quêtes Quotidiennes", h_weekly:"Quêtes Hebdo",
  h_login:"Calendrier 30 Jours", h_rewards:"Récompenses et Quêtes", h_achievements:"Succès",
  h_store:"Boutique", h_freeRewards:"Récompenses Gratuites",
  claim:"Réclamer", resetsIn:"réinit. dans",
  offlineTitle:"Pendant votre absence",
  muteOn:"Son : Activé", muteOff:"Son : Coupé", save:"Sauver", reset:"Réinit.",
  privacy:"Confidentialité", terms:"Conditions", share:"Partager", language:"Langue",
};
const DE = {
  title:"Anime Studio Tycoon", tagline:"Vom Ein-Zimmer-Studio zum globalen Anime-Imperium",
  start:"Studio betreten", goal:"Ziel",
  res_yen:"Yen", res_fans:"Fans", res_hype:"Hype", netWorth:"Studio-Wert", trend:"Im Trend",
  tab_produce:"Produzieren", tab_quests:"Aufgaben", tab_staff:"Team", tab_stars:"Stars",
  tab_research:"Forschung", tab_studio:"Studio", tab_market:"Marketing", tab_store:"Shop",
  greenlight:"Freigeben", release:"Premiere!", rush:"Boosten (Hype)", overdrive:"Overdrive (Hype)", hire:"Anstellen",
  h_dashboard:"Studio-Dashboard", h_daily:"Tägliche Aufgaben", h_weekly:"Wöchentliche Aufgaben",
  h_login:"30-Tage-Kalender", h_rewards:"Belohnungen & Aufgaben", h_achievements:"Erfolge",
  h_store:"Shop", h_freeRewards:"Gratis-Belohnungen",
  claim:"Abholen", resetsIn:"neu in",
  offlineTitle:"Während du weg warst",
  muteOn:"Ton: An", muteOff:"Ton: Aus", save:"Speichern", reset:"Zurücksetzen",
  privacy:"Datenschutz", terms:"AGB", share:"Teilen", language:"Sprache",
};
const JA = {
  title:"Anime Studio Tycoon", tagline:"小さなスタジオから世界的なアニメ帝国へ",
  start:"スタジオに入る", goal:"目標",
  res_yen:"円", res_fans:"ファン", res_hype:"Hype", netWorth:"スタジオ価値", trend:"トレンド",
  tab_produce:"制作", tab_quests:"クエスト", tab_staff:"スタッフ", tab_stars:"スター",
  tab_research:"研究", tab_studio:"スタジオ", tab_market:"宣伝", tab_store:"ストア",
  greenlight:"企画開始", release:"公開！", rush:"加速 (Hype)", overdrive:"オーバードライブ (Hype)", hire:"採用",
  h_dashboard:"スタジオ ダッシュボード", h_daily:"デイリークエスト", h_weekly:"ウィークリークエスト",
  h_login:"30日ログインカレンダー", h_rewards:"報酬とクエスト", h_achievements:"実績",
  h_store:"ストア", h_freeRewards:"無料報酬",
  claim:"受け取る", resetsIn:"リセットまで",
  offlineTitle:"留守の間に",
  muteOn:"サウンド: オン", muteOff:"サウンド: オフ", save:"セーブ", reset:"リセット",
  privacy:"プライバシー", terms:"利用規約", share:"シェア", language:"言語",
};

export const LANGS = { en:EN, es:ES, pt:PT, fr:FR, de:DE, ja:JA };
export const LANG_NAMES = { en:"English", es:"Español", pt:"Português", fr:"Français", de:"Deutsch", ja:"日本語" };

/* ---- Extended UI vocabulary (first i18n batch beyond the chrome).
   English is the base/fallback; any key missing in a language falls back to it. ---- */
const UI = {
  en:{ h_hire:"Hire Your Team", h_stars:"Star Talent", h_yourstars:"Your Stars", h_research:"Genre Mastery",
       h_upgrades:"Studio Upgrades", h_perks:"Legacy Perks", h_records:"Studio Records", h_marketing:"Marketing",
       h_industry:"Industry Ranking", h_hof:"Hall of Fame", h_greenlight:"Greenlight a Project",
       b_buy:"Buy", b_run:"Run", b_upgrade:"Upgrade", b_research:"Research", b_spend:"Spend", b_use:"Use",
       b_get:"Get", b_expand:"Expand", b_scoutOpen:"Open Casting", b_scoutPremium:"Premium Scout" },
  es:{ h_hire:"Contrata tu Equipo", h_stars:"Talento Estrella", h_yourstars:"Tus Estrellas", h_research:"Maestría de Género",
       h_upgrades:"Mejoras del Estudio", h_perks:"Ventajas de Legado", h_records:"Récords del Estudio", h_marketing:"Marketing",
       h_industry:"Clasificación", h_hof:"Salón de la Fama", h_greenlight:"Aprobar un Proyecto",
       b_buy:"Comprar", b_run:"Lanzar", b_upgrade:"Mejorar", b_research:"Investigar", b_spend:"Gastar", b_use:"Usar",
       b_get:"Obtener", b_expand:"Ampliar", b_scoutOpen:"Casting Abierto", b_scoutPremium:"Reclutar Premium" },
  pt:{ h_hire:"Contrate sua Equipe", h_stars:"Talento Estrela", h_yourstars:"Suas Estrelas", h_research:"Maestria de Gênero",
       h_upgrades:"Melhorias do Estúdio", h_perks:"Vantagens de Legado", h_records:"Recordes do Estúdio", h_marketing:"Marketing",
       h_industry:"Ranking da Indústria", h_hof:"Hall da Fama", h_greenlight:"Aprovar um Projeto",
       b_buy:"Comprar", b_run:"Lançar", b_upgrade:"Melhorar", b_research:"Pesquisar", b_spend:"Gastar", b_use:"Usar",
       b_get:"Obter", b_expand:"Expandir", b_scoutOpen:"Seleção Aberta", b_scoutPremium:"Recrutar Premium" },
  fr:{ h_hire:"Recrutez votre Équipe", h_stars:"Talent Vedette", h_yourstars:"Vos Stars", h_research:"Maîtrise de Genre",
       h_upgrades:"Améliorations du Studio", h_perks:"Atouts d'Héritage", h_records:"Records du Studio", h_marketing:"Marketing",
       h_industry:"Classement", h_hof:"Temple de la Renommée", h_greenlight:"Lancer un Projet",
       b_buy:"Acheter", b_run:"Lancer", b_upgrade:"Améliorer", b_research:"Rechercher", b_spend:"Dépenser", b_use:"Utiliser",
       b_get:"Obtenir", b_expand:"Agrandir", b_scoutOpen:"Casting Ouvert", b_scoutPremium:"Recrutement Premium" },
  de:{ h_hire:"Stelle dein Team ein", h_stars:"Star-Talente", h_yourstars:"Deine Stars", h_research:"Genre-Meisterschaft",
       h_upgrades:"Studio-Upgrades", h_perks:"Vermächtnis-Boni", h_records:"Studio-Rekorde", h_marketing:"Marketing",
       h_industry:"Branchen-Rangliste", h_hof:"Ruhmeshalle", h_greenlight:"Projekt freigeben",
       b_buy:"Kaufen", b_run:"Starten", b_upgrade:"Verbessern", b_research:"Erforschen", b_spend:"Ausgeben", b_use:"Nutzen",
       b_get:"Holen", b_expand:"Erweitern", b_scoutOpen:"Offenes Casting", b_scoutPremium:"Premium-Scout" },
  ja:{ h_hire:"スタッフを雇う", h_stars:"スター人材", h_yourstars:"あなたのスター", h_research:"ジャンル熟練",
       h_upgrades:"スタジオ強化", h_perks:"レガシー特典", h_records:"スタジオ記録", h_marketing:"マーケティング",
       h_industry:"業界ランキング", h_hof:"殿堂", h_greenlight:"企画を承認",
       b_buy:"購入", b_run:"実施", b_upgrade:"強化", b_research:"研究", b_spend:"消費", b_use:"使う",
       b_get:"入手", b_expand:"拡張", b_scoutOpen:"オープン採用", b_scoutPremium:"プレミアム採用" },
};
for(const c in UI){ if(LANGS[c]) Object.assign(LANGS[c], UI[c]); }

// Second batch: Produce-screen dashboard KPIs + greenlight card labels (most-seen screen).
const UI2 = {
  en:{ k_level:"Studio Lv.", k_value:"Studio Value", k_income:"Income ×", k_output:"Output/s", k_premieres:"Premieres", k_stars:"Stars", k_slots:"Slots", k_legacy:"Legacy", k_best:"Best Value", k_royalties:"Royalties", k_awards:"Awards", c_cost:"Cost", c_reward:"Reward", c_workload:"Workload", c_fans:"fans" },
  es:{ k_level:"Nivel", k_value:"Valor", k_income:"Ingresos ×", k_output:"Salida/s", k_premieres:"Estrenos", k_stars:"Estrellas", k_slots:"Líneas", k_legacy:"Legado", k_best:"Mejor Valor", k_royalties:"Regalías", k_awards:"Premios", c_cost:"Costo", c_reward:"Recompensa", c_workload:"Trabajo", c_fans:"fans" },
  pt:{ k_level:"Nível", k_value:"Valor", k_income:"Receita ×", k_output:"Saída/s", k_premieres:"Estreias", k_stars:"Estrelas", k_slots:"Linhas", k_legacy:"Legado", k_best:"Melhor Valor", k_royalties:"Royalties", k_awards:"Prêmios", c_cost:"Custo", c_reward:"Recompensa", c_workload:"Trabalho", c_fans:"fãs" },
  fr:{ k_level:"Niveau", k_value:"Valeur", k_income:"Revenu ×", k_output:"Sortie/s", k_premieres:"Premières", k_stars:"Stars", k_slots:"Lignes", k_legacy:"Héritage", k_best:"Meilleure Valeur", k_royalties:"Royalties", k_awards:"Prix", c_cost:"Coût", c_reward:"Récompense", c_workload:"Charge", c_fans:"fans" },
  de:{ k_level:"Level", k_value:"Wert", k_income:"Einkommen ×", k_output:"Ausstoß/s", k_premieres:"Premieren", k_stars:"Stars", k_slots:"Linien", k_legacy:"Vermächtnis", k_best:"Bester Wert", k_royalties:"Tantiemen", k_awards:"Preise", c_cost:"Kosten", c_reward:"Belohnung", c_workload:"Aufwand", c_fans:"Fans" },
  ja:{ k_level:"レベル", k_value:"価値", k_income:"収入 ×", k_output:"出力/秒", k_premieres:"公開数", k_stars:"スター", k_slots:"ライン", k_legacy:"レガシー", k_best:"最高価値", k_royalties:"印税", k_awards:"受賞", c_cost:"費用", c_reward:"報酬", c_workload:"作業量", c_fans:"ファン" },
};
for(const c in UI2){ if(LANGS[c]) Object.assign(LANGS[c], UI2[c]); }

// Third batch: Store section headers (the monetization screen).
const UI3 = {
  en:{ s_store:"Studio Store", s_topup:"Top up Gems", s_premium:"Premium Bundles", s_exclusive:"Exclusive Stars", s_spend:"Spend Gems", s_free:"Free Rewards", s_redeem:"Redeem a Code", s_ach:"Achievements" },
  es:{ s_store:"Tienda del Estudio", s_topup:"Recargar Gemas", s_premium:"Paquetes Premium", s_exclusive:"Estrellas Exclusivas", s_spend:"Gastar Gemas", s_free:"Recompensas Gratis", s_redeem:"Canjear un Código", s_ach:"Logros" },
  pt:{ s_store:"Loja do Estúdio", s_topup:"Recarregar Gemas", s_premium:"Pacotes Premium", s_exclusive:"Estrelas Exclusivas", s_spend:"Gastar Gemas", s_free:"Recompensas Grátis", s_redeem:"Resgatar um Código", s_ach:"Conquistas" },
  fr:{ s_store:"Boutique du Studio", s_topup:"Recharger des Gemmes", s_premium:"Packs Premium", s_exclusive:"Stars Exclusives", s_spend:"Dépenser des Gemmes", s_free:"Récompenses Gratuites", s_redeem:"Utiliser un Code", s_ach:"Succès" },
  de:{ s_store:"Studio-Shop", s_topup:"Gems aufladen", s_premium:"Premium-Pakete", s_exclusive:"Exklusive Stars", s_spend:"Gems ausgeben", s_free:"Gratis-Belohnungen", s_redeem:"Code einlösen", s_ach:"Erfolge" },
  ja:{ s_store:"スタジオストア", s_topup:"ジェムを補充", s_premium:"プレミアムバンドル", s_exclusive:"限定スター", s_spend:"ジェムを使う", s_free:"無料報酬", s_redeem:"コードを引き換える", s_ach:"実績" },
};
for(const c in UI3){ if(LANGS[c]) Object.assign(LANGS[c], UI3[c]); }

// Fourth batch: Coach bar, guided tutorial, and store hero copy.
const UI4 = {
  en:{ coach_label:"Coach's Tip", coach_guided:"Guided", coach_aria_tips:"Coach tips", coach_aria_cta:"Go to next action", coach_aria_gift:"Rewards and quests",
       coach_go:"Go", coach_cta_next:"Next", coach_cta_recruit:"Recruit", coach_cta_greenlight:"Greenlight", coach_cta_boost:"Boost", coach_cta_premiere:"Premiere", coach_cta_play:"Play",
       coach_welcome:"Welcome, {name}! Tap Next when you're ready.", coach_hire_role:"Tap Hire on {role} — crew speeds every show", coach_hire_first:"Open Recruit and hire your first team member",
       coach_gl_first:"Greenlight your first anime on Play", coach_boost_poster:"Tap the poster to boost production speed", coach_premiere_ready:"Production ready — premiere now!", coach_premiere_wait:"Keep boosting until production finishes",
       tut_kicker:"First session", tut_skip:"Skip tutorial", tut_step:"Step {n} of {total}",
       tut_lbl_studio:"Studio", tut_lbl_hire:"Hire", tut_lbl_greenlight:"Greenlight", tut_lbl_boost:"Boost", tut_lbl_premiere:"Premiere",
       tut_name_title:"Name your studio", tut_name_body:"You're {name}! Your brand shows at the top of the screen.",
       tut_hire_title:"Hire your first staff", tut_hire_body:"Animators and writers speed up every production. Hire one on Recruit.",
       tut_gl_title:"Greenlight your first anime", tut_gl_body:"Pick a project and start production — one tap greenlights your debut show.",
       tut_boost_title:"Tap to boost speed", tut_boost_body:"Tap the poster or Boost button to rush episodes — great for your first premiere.",
       tut_premiere_title:"Premiere when ready", tut_premiere_body:"When the bar fills, hit Global Premiere to earn ¥, fans, and your first hit.",
       s_balance_kicker:"Your Gem Balance", s_balance_sub:"Scouts · skips · boosts",
       s_lead_pay:"Gems power scouts, skips, and boosts. Earn free through play or top up below.",
       s_lead_f2p:"100% free to play — earn every 💎 through daily rewards, quests, and milestones." },
  es:{ coach_label:"Consejo del Coach", coach_guided:"Guiado", coach_aria_tips:"Consejos del coach", coach_aria_cta:"Ir a la siguiente acción", coach_aria_gift:"Recompensas y misiones",
       coach_go:"Ir", coach_cta_next:"Siguiente", coach_cta_recruit:"Reclutar", coach_cta_greenlight:"Aprobar", coach_cta_boost:"Impulsar", coach_cta_premiere:"Estrenar", coach_cta_play:"Jugar",
       coach_welcome:"¡Bienvenido, {name}! Toca Siguiente cuando estés listo.", coach_hire_role:"Toca Contratar en {role} — el equipo acelera cada show", coach_hire_first:"Abre Reclutar y contrata a tu primer miembro",
       coach_gl_first:"Aprueba tu primer anime en Jugar", coach_boost_poster:"Toca el póster para acelerar la producción", coach_premiere_ready:"¡Producción lista — estrena ahora!", coach_premiere_wait:"Sigue impulsando hasta que termine la producción",
       tut_kicker:"Primera sesión", tut_skip:"Saltar tutorial", tut_step:"Paso {n} de {total}",
       tut_lbl_studio:"Estudio", tut_lbl_hire:"Contratar", tut_lbl_greenlight:"Aprobar", tut_lbl_boost:"Impulsar", tut_lbl_premiere:"Estreno",
       tut_name_title:"Nombra tu estudio", tut_name_body:"¡Eres {name}! Tu marca aparece arriba de la pantalla.",
       tut_hire_title:"Contrata tu primer staff", tut_hire_body:"Animadores y guionistas aceleran cada producción. Contrata uno en Reclutar.",
       tut_gl_title:"Aprueba tu primer anime", tut_gl_body:"Elige un proyecto y empieza — un toque aprueba tu debut.",
       tut_boost_title:"Toca para acelerar", tut_boost_body:"Toca el póster o Impulsar para apurar episodios — ideal para tu primer estreno.",
       tut_premiere_title:"Estrena cuando esté listo", tut_premiere_body:"Cuando la barra se llene, pulsa Estreno Global para ganar ¥, fans y tu primer hit.",
       s_balance_kicker:"Tu saldo de Gemas", s_balance_sub:"Scouts · saltos · boosts",
       s_lead_pay:"Las gemas impulsan scouts, saltos y boosts. Gana gratis jugando o recarga abajo.",
       s_lead_f2p:"100% gratis — gana cada 💎 con recompensas diarias, misiones y hitos." },
  pt:{ coach_label:"Dica do Coach", coach_guided:"Guiado", coach_aria_tips:"Dicas do coach", coach_aria_cta:"Ir para a próxima ação", coach_aria_gift:"Recompensas e missões",
       coach_go:"Ir", coach_cta_next:"Próximo", coach_cta_recruit:"Recrutar", coach_cta_greenlight:"Aprovar", coach_cta_boost:"Impulsionar", coach_cta_premiere:"Estrear", coach_cta_play:"Jogar",
       coach_welcome:"Bem-vindo, {name}! Toque Próximo quando estiver pronto.", coach_hire_role:"Toque Contratar em {role} — a equipe acelera cada show", coach_hire_first:"Abra Recrutar e contrate seu primeiro membro",
       coach_gl_first:"Aprove seu primeiro anime em Jogar", coach_boost_poster:"Toque o pôster para acelerar a produção", coach_premiere_ready:"Produção pronta — estreie agora!", coach_premiere_wait:"Continue impulsionando até a produção terminar",
       tut_kicker:"Primeira sessão", tut_skip:"Pular tutorial", tut_step:"Passo {n} de {total}",
       tut_lbl_studio:"Estúdio", tut_lbl_hire:"Contratar", tut_lbl_greenlight:"Aprovar", tut_lbl_boost:"Impulsionar", tut_lbl_premiere:"Estreia",
       tut_name_title:"Nomeie seu estúdio", tut_name_body:"Você é {name}! Sua marca aparece no topo da tela.",
       tut_hire_title:"Contrate sua primeira equipe", tut_hire_body:"Animadores e roteiristas aceleram cada produção. Contrate um em Recrutar.",
       tut_gl_title:"Aprove seu primeiro anime", tut_gl_body:"Escolha um projeto e comece — um toque aprova seu estreia.",
       tut_boost_title:"Toque para acelerar", tut_boost_body:"Toque o pôster ou Impulsionar para apressar episódios — ótimo para sua primeira estreia.",
       tut_premiere_title:"Estreie quando estiver pronto", tut_premiere_body:"Quando a barra encher, toque Estreia Global para ganhar ¥, fãs e seu primeiro hit.",
       s_balance_kicker:"Seu saldo de Gemas", s_balance_sub:"Scouts · pulos · boosts",
       s_lead_pay:"Gemas alimentam scouts, pulos e boosts. Ganhe grátis jogando ou recarregue abaixo.",
       s_lead_f2p:"100% grátis — ganhe cada 💎 com recompensas diárias, missões e marcos." },
  fr:{ coach_label:"Conseil du Coach", coach_guided:"Guidé", coach_aria_tips:"Conseils du coach", coach_aria_cta:"Aller à l'action suivante", coach_aria_gift:"Récompenses et quêtes",
       coach_go:"Aller", coach_cta_next:"Suivant", coach_cta_recruit:"Recruter", coach_cta_greenlight:"Lancer", coach_cta_boost:"Booster", coach_cta_premiere:"Sortie", coach_cta_play:"Jouer",
       coach_welcome:"Bienvenue, {name} ! Appuyez sur Suivant quand vous êtes prêt.", coach_hire_role:"Appuyez sur Recruter {role} — l'équipe accélère chaque show", coach_hire_first:"Ouvrez Recruter et embauchez votre premier membre",
       coach_gl_first:"Lancez votre premier anime sur Jouer", coach_boost_poster:"Touchez l'affiche pour accélérer la production", coach_premiere_ready:"Production prête — sortez maintenant !", coach_premiere_wait:"Continuez à booster jusqu'à la fin de la production",
       tut_kicker:"Première session", tut_skip:"Passer le tutoriel", tut_step:"Étape {n} sur {total}",
       tut_lbl_studio:"Studio", tut_lbl_hire:"Recruter", tut_lbl_greenlight:"Lancer", tut_lbl_boost:"Booster", tut_lbl_premiere:"Sortie",
       tut_name_title:"Nommez votre studio", tut_name_body:"Vous êtes {name} ! Votre marque s'affiche en haut de l'écran.",
       tut_hire_title:"Recrutez votre première équipe", tut_hire_body:"Animateurs et scénaristes accélèrent chaque production. Recrutez-en un dans Recruter.",
       tut_gl_title:"Lancez votre premier anime", tut_gl_body:"Choisissez un projet et démarrez — un tap lance votre premier show.",
       tut_boost_title:"Touchez pour accélérer", tut_boost_body:"Touchez l'affiche ou Booster pour précipiter les épisodes — parfait pour votre première sortie.",
       tut_premiere_title:"Sortez quand c'est prêt", tut_premiere_body:"Quand la barre est pleine, lancez la Première mondiale pour gagner ¥, fans et votre premier hit.",
       s_balance_kicker:"Votre solde de Gemmes", s_balance_sub:"Scouts · sauts · boosts",
       s_lead_pay:"Les gemmes alimentent scouts, sauts et boosts. Gagnez-en gratuitement ou rechargez ci-dessous.",
       s_lead_f2p:"100 % gratuit — gagnez chaque 💎 via récompenses quotidiennes, quêtes et jalons." },
  de:{ coach_label:"Coach-Tipp", coach_guided:"Geführt", coach_aria_tips:"Coach-Tipps", coach_aria_cta:"Zur nächsten Aktion", coach_aria_gift:"Belohnungen und Aufgaben",
       coach_go:"Los", coach_cta_next:"Weiter", coach_cta_recruit:"Rekrutieren", coach_cta_greenlight:"Freigeben", coach_cta_boost:"Boosten", coach_cta_premiere:"Premiere", coach_cta_play:"Spielen",
       coach_welcome:"Willkommen, {name}! Tippe auf Weiter, wenn du bereit bist.", coach_hire_role:"Tippe Anstellen bei {role} — Crew beschleunigt jede Show", coach_hire_first:"Öffne Rekrutieren und stelle dein erstes Teammitglied ein",
       coach_gl_first:"Gib dein erstes Anime auf Spiel frei", coach_boost_poster:"Tippe das Poster, um die Produktion zu beschleunigen", coach_premiere_ready:"Produktion fertig — jetzt premiere!", coach_premiere_wait:"Booste weiter, bis die Produktion fertig ist",
       tut_kicker:"Erste Sitzung", tut_skip:"Tutorial überspringen", tut_step:"Schritt {n} von {total}",
       tut_lbl_studio:"Studio", tut_lbl_hire:"Anstellen", tut_lbl_greenlight:"Freigeben", tut_lbl_boost:"Boosten", tut_lbl_premiere:"Premiere",
       tut_name_title:"Benenne dein Studio", tut_name_body:"Du bist {name}! Deine Marke steht oben auf dem Bildschirm.",
       tut_hire_title:"Stelle dein erstes Team ein", tut_hire_body:"Animatoren und Autoren beschleunigen jede Produktion. Stelle einen unter Rekrutieren ein.",
       tut_gl_title:"Gib dein erstes Anime frei", tut_gl_body:"Wähle ein Projekt und starte — ein Tipp gibt dein Debüt frei.",
       tut_boost_title:"Tippen zum Beschleunigen", tut_boost_body:"Tippe Poster oder Boosten, um Episoden zu beschleunigen — ideal für deine erste Premiere.",
       tut_premiere_title:"Premiere wenn bereit", tut_premiere_body:"Wenn der Balken voll ist, starte die Weltpremiere für ¥, Fans und deinen ersten Hit.",
       s_balance_kicker:"Dein Gem-Guthaben", s_balance_sub:"Scouts · Sprünge · Boosts",
       s_lead_pay:"Gems für Scouts, Sprünge und Boosts. Verdiene gratis beim Spielen oder lade unten auf.",
       s_lead_f2p:"100 % kostenlos — verdiene jedes 💎 über tägliche Belohnungen, Aufgaben und Meilensteine." },
  ja:{ coach_label:"コーチのヒント", coach_guided:"ガイド中", coach_aria_tips:"コーチのヒント", coach_aria_cta:"次のアクションへ", coach_aria_gift:"報酬とクエスト",
       coach_go:"移動", coach_cta_next:"次へ", coach_cta_recruit:"採用", coach_cta_greenlight:"企画開始", coach_cta_boost:"ブースト", coach_cta_premiere:"公開", coach_cta_play:"プレイ",
       coach_welcome:"ようこそ、{name}さん！準備ができたら「次へ」をタップ。", coach_hire_role:"{role}の採用をタップ — スタッフが全作品を加速", coach_hire_first:"採用を開いて最初のメンバーを雇う",
       coach_gl_first:"プレイで最初のアニメを企画開始", coach_boost_poster:"ポスターをタップして制作を加速", coach_premiere_ready:"制作完了 — 今すぐ公開！", coach_premiere_wait:"制作が終わるまでブーストを続けよう",
       tut_kicker:"初回セッション", tut_skip:"チュートリアルをスキップ", tut_step:"ステップ {n}/{total}",
       tut_lbl_studio:"スタジオ", tut_lbl_hire:"採用", tut_lbl_greenlight:"企画", tut_lbl_boost:"ブースト", tut_lbl_premiere:"公開",
       tut_name_title:"スタジオに名前をつける", tut_name_body:"あなたは{name}！ブランド名が画面上部に表示されます。",
       tut_hire_title:"最初のスタッフを雇う", tut_hire_body:"アニメーターとライターが制作を加速。採用で1人雇いましょう。",
       tut_gl_title:"最初のアニメを企画開始", tut_gl_body:"プロジェクトを選んで開始 — ワンタップでデビュー作をスタート。",
       tut_boost_title:"タップで加速", tut_boost_body:"ポスターまたはブーストでエピソードを急げ — 初公開に最適。",
       tut_premiere_title:"準備ができたら公開", tut_premiere_body:"バーが満タンになったらグローバル公開で¥、ファン、初ヒットを獲得。",
       s_balance_kicker:"ジェム残高", s_balance_sub:"スカウト · スキップ · ブースト",
       s_lead_pay:"ジェムでスカウト、スキップ、ブースト。プレイで無料獲得または下でチャージ。",
       s_lead_f2p:"完全無料 — デイリー報酬、クエスト、マイルストーンで💎を獲得。" },
};
for(const c in UI4){ if(LANGS[c]) Object.assign(LANGS[c], UI4[c]); }

// STR is the live, current-language object. Mutated in place by setLang.
export const STR = Object.assign({}, EN);
STR.__code = "en";

export function setLang(code){
  const L = LANGS[code] || EN;
  // reset to the English base first so a partial translation never leaves stale
  // keys from a previously selected language, then overlay the chosen language.
  Object.assign(STR, EN, L);
  STR.__code = LANGS[code] ? code : "en";
  try{ localStorage.setItem("ast_lang", STR.__code); }catch(e){}
  return STR.__code;
}
/* Translate a key, falling back to English (or the provided fallback). */
export function t(key, fallback){ const v=STR[key]; return (v==null) ? (fallback!=null?fallback:key) : v; }
/* Translate with {var} placeholders, e.g. tf("coach_welcome",{name:"Alex"},"Welcome…") */
export function tf(key, vars, fallback){
  let s=t(key, fallback);
  if(vars){ for(const k in vars){ s=String(s).split("{"+k+"}").join(vars[k]); } }
  return s;
}
export function initialLang(){
  // Default to English. Only use a language the player explicitly chose before.
  try{ const s=localStorage.getItem("ast_lang"); if(s && LANGS[s]) return s; }catch(e){}
  return "en";
}
// True only the very first time (no saved language yet) — used to show the onboarding language step.
export function langChosen(){ try{ return !!localStorage.getItem("ast_lang"); }catch(e){ return false; } }
