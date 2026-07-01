/* In-app purchases for native builds — Apple App Store AND Google Play
   (cordova-plugin-purchase v13). Calls window.AST_GRANT(kind, amount) on a verified purchase.

   Set VALIDATOR_URL to your receipt-validation endpoint (defaults to same-origin /api/iap/validate). */
(function(){
  var VALIDATOR_URL = "/api/iap/validate";
  var APP = "com.trainyouragent.animestudiotycoon";
  // Apple uses reverse-domain product IDs; Google Play uses short lowercase IDs.
  var APPLE = { pass:APP+".pass", bundle:APP+".bundle", bundle_legend:APP+".bundlelegend", bundle_mogul:APP+".bundlemogul",
    gems_s:APP+".gems120", gems_m:APP+".gems350", gems_l:APP+".gems800", gems_mega:APP+".gems2000",
    star_aurora:APP+".staraurora", star_phoenix:APP+".starphoenix", star_shogun:APP+".starshogun",
    items_pack:APP+".itemspack", noads:APP+".noads" };
  var GOOGLE= { pass:"pass", bundle:"bundle", bundle_legend:"bundle_legend", bundle_mogul:"bundle_mogul",
    gems_s:"gems120", gems_m:"gems350", gems_l:"gems800", gems_mega:"gems2000",
    star_aurora:"star_aurora", star_phoenix:"star_phoenix", star_shogun:"star_shogun",
    items_pack:"items_pack", noads:"noads" };
  var GEMS = { gems_s:120, gems_m:350, gems_l:800, gems_mega:2000 };
  var NONCONSUMABLE = { pass:1, bundle:1, bundle_legend:1, bundle_mogul:1, star_aurora:1, star_phoenix:1, star_shogun:1, noads:1 };

  // reverse lookup: any platform product id -> our sku key
  var ID2SKU = {};
  Object.keys(APPLE).forEach(function(k){ ID2SKU[APPLE[k]]=k; });
  Object.keys(GOOGLE).forEach(function(k){ ID2SKU[GOOGLE[k]]=k; });

  function grant(productId){
    var sku = ID2SKU[productId]; if(!sku || !window.AST_GRANT) return;
    if(GEMS[sku]) window.AST_GRANT("gems", GEMS[sku]);
    else if(sku.indexOf("star_")===0) window.AST_GRANT("star", 0, { sku: sku });
    else window.AST_GRANT(sku); // pass | bundle | bundle_legend | bundle_mogul | items_pack | noads
  }

  function init(){
    var P = window.CdvPurchase;
    if(!P || !P.store){ setTimeout(init, 600); return; }
    var store = P.store, APStore = P.Platform.APPLE_APPSTORE, GP = P.Platform.GOOGLE_PLAY;
    if(VALIDATOR_URL){ store.validator = VALIDATOR_URL; }
    else { try{ console.warn("IAP: VALIDATOR_URL not set — receipts are NOT server-validated."); }catch(_){} }
    var defs = [], plats = [];
    var isiOS = !!(window.NATIVE_IOS) || (window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform()==="ios");
    var isAndroid = (window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform()==="android");
    // register for whichever platform we're on (default: both, harmless)
    function add(map, plat){
      plats.push(plat);
      var NC=P.ProductType.NON_CONSUMABLE, C=P.ProductType.CONSUMABLE;
      [["pass",NC],["bundle",NC],["bundle_legend",NC],["bundle_mogul",NC],["noads",NC],
       ["star_aurora",NC],["star_phoenix",NC],["star_shogun",NC],
       ["gems_s",C],["gems_m",C],["gems_l",C],["gems_mega",C],["items_pack",C]]
       .forEach(function(p){ if(map[p[0]]) defs.push({ id:map[p[0]], type:p[1], platform:plat }); });
    }
    if(isAndroid) add(GOOGLE, GP);
    else add(APPLE, APStore); // default iOS

    store.register(defs);
    store.when()
      .approved(function(t){ return t.verify(); })
      .verified(function(receipt){
        try{ (receipt.collection || receipt.products || []).forEach(function(p){ grant(p.id || p.productId); }); }
        catch(e){ try{ console.error("IAP grant error", e); }catch(_){} }
        receipt.finish();
      });
    store.error(function(e){ try{ console.warn("IAP error", e && e.message); }catch(_){} });
    store.initialize(plats);

    var MAP = isAndroid ? GOOGLE : APPLE, PLAT = isAndroid ? GP : APStore;
    window.IAPBuy = function(sku){
      var id = MAP[sku]; if(!id) return;
      var prod = store.get(id, PLAT);
      var offer = prod && prod.getOffer && prod.getOffer();
      if(offer) store.order(offer);
      else if(window.alert) window.alert("This item is not available yet. Please try again shortly.");
    };
    window.IAPRestore = function(){ store.restorePurchases(); };
    window.__IAP_READY = true;
  }

  document.addEventListener("deviceready", init, false);
  if(document.readyState !== "loading") setTimeout(init, 1500);
  else window.addEventListener("load", function(){ setTimeout(init, 1500); });
})();
