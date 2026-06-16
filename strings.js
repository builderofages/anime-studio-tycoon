// All player-visible UI strings, with multi-language support.
// Switching language = swapping this data (STR is mutated in place so existing imports stay valid).

const EN = {
  title:"Anime Studio Tycoon", tagline:"From a one-room studio to a global anime empire",
  start:"Enter the Studio", goal:"Goal",
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

// STR is the live, current-language object. Mutated in place by setLang.
export const STR = Object.assign({}, EN);
STR.__code = "en";

export function setLang(code){
  const L = LANGS[code] || EN;
  Object.assign(STR, L);
  STR.__code = LANGS[code] ? code : "en";
  try{ localStorage.setItem("ast_lang", STR.__code); }catch(e){}
  return STR.__code;
}
export function initialLang(){
  // Default to English. Only use a language the player explicitly chose before.
  try{ const s=localStorage.getItem("ast_lang"); if(s && LANGS[s]) return s; }catch(e){}
  return "en";
}
// True only the very first time (no saved language yet) — used to show the onboarding language step.
export function langChosen(){ try{ return !!localStorage.getItem("ast_lang"); }catch(e){ return false; } }
