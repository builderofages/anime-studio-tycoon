/* In-app purchases for native builds — Apple App Store AND Google Play
   (cordova-plugin-purchase v13). Calls window.AST_GRANT(kind, amount) on a verified purchase. */
(function(){
  var APP = "com.trainyouragent.animestudiotycoon";
  // Apple uses reverse-domain product IDs; Google Play uses short lowercase IDs.
  var APPLE = { pass:APP+".pass", bundle:APP+".bundle", gems_s:APP+".gems120", gems_m:APP+".gems350", gems_l:APP+".gems800", gems_mega:APP+".gems2000" };
  var GOOGLE= { pass:"pass", bundle:"bundle", gems_s:"gems120", gems_m:"gems350", gems_l:"gems800", gems_mega:"gems2000" };
  var GEMS = { gems_s:120, gems_m:350, gems_l:800, gems_mega:2000 };

  // reverse lookup: any platform product id -> our sku key
  var ID2SKU = {};
  Object.keys(APPLE).forEach(function(k){ ID2SKU[APPLE[k]]=k; });
  Object.keys(GOOGLE).forEach(function(k){ ID2SKU[GOOGLE[k]]=k; });

  function grant(productId){
    var sku = ID2SKU[productId]; if(!sku || !window.AST_GRANT) return;
    if(sku==="pass") window.AST_GRANT("pass");
    else if(sku==="bundle") window.AST_GRANT("bundle");
    else if(GEMS[sku]) window.AST_GRANT("gems", GEMS[sku]);
  }

  function init(){
    var P = window.CdvPurchase;
    if(!P || !P.store){ setTimeout(init, 600); return; }
    var store = P.store, APStore = P.Platform.APPLE_APPSTORE, GP = P.Platform.GOOGLE_PLAY;
    var defs = [], plats = [];
    var isiOS = !!(window.NATIVE_IOS) || (window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform()==="ios");
    var isAndroid = (window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform()==="android");
    // register for whichever platform we're on (default: both, harmless)
    function add(map, plat){
      plats.push(plat);
      [["pass",P.ProductType.NON_CONSUMABLE],["bundle",P.ProductType.NON_CONSUMABLE],
       ["gems_s",P.ProductType.CONSUMABLE],["gems_m",P.ProductType.CONSUMABLE],
       ["gems_l",P.ProductType.CONSUMABLE],["gems_mega",P.ProductType.CONSUMABLE]]
       .forEach(function(p){ defs.push({ id:map[p[0]], type:p[1], platform:plat }); });
    }
    if(isAndroid) add(GOOGLE, GP);
    else add(APPLE, APStore); // default iOS

    store.register(defs);
    store.when()
      .approved(function(t){ return t.verify(); })
      .verified(function(receipt){
        try{ (receipt.collection || receipt.products || []).forEach(function(p){ grant(p.id || p.productId); }); }catch(e){}
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
