// soirees.js — Soirées partagées : un album commun pour les personnes d'une soirée.
// Données : Firestore « soirees/{id} » (nom, date, lieu, membres) et « soirees/{id}/photos/{id} ».
// Photos : même dossier de stockage que le carnet (souvenirs/<uid>/soiree-…jpg), réduites comme les souvenirs.
// L'identifiant de la soirée (aléatoire) sert de lien d'invitation : https://whazup.fr/?soiree=<id>
// Pour tout annuler : retirer la ligne <script defer src="soirees.js"> dans index.html.
(function () {
  "use strict";
  if (window.__wzSoirees) return;
  window.__wzSoirees = true;

  var MAX_PHOTOS = 30, MAX_MEMBERS = 50;
  var LINK = "https://whazup.fr/?soiree=";
  var PENDING = "wz_pending_soiree";

  // ---- accès Firebase (remplaçables pour les tests) ----
  function T() { return window.__wzSoireeTest || {}; }
  function DB() { return T().db || db; }
  function AUTH() { return T().auth || auth; }
  function STORE() { return T().storage || firebase.storage(); }
  function FV() { return T().fieldValue || firebase.firestore.FieldValue; }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var toastTimer = null;
  function toast(m) {
    try {
      addCss();
      var t = document.getElementById("wz-so-toast");
      if (!t) { t = document.createElement("div"); t.id = "wz-so-toast"; document.body.appendChild(t); }
      t.textContent = m; t.style.opacity = "1";
      clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.style.opacity = "0"; }, 3200);
    } catch (e) { try { alert(m); } catch (x) {} }
  }
  function realUser() { try { var u = AUTH().currentUser; return (u && !u.isAnonymous) ? u : null; } catch (e) { return null; } }
  function myName() {
    try {
      var u = realUser();
      var n = window.__niceName ? window.__niceName(u, u && u.email) : "";
      return n || "Un participant";
    } catch (e) { return "Un participant"; }
  }
  function newId() {
    var a = "abcdefghijklmnopqrstuvwxyz0123456789", out = "";
    try { var r = new Uint8Array(20); crypto.getRandomValues(r); for (var i = 0; i < 20; i++) out += a[r[i] % a.length]; }
    catch (e) { for (var j = 0; j < 20; j++) out += a[Math.floor(Math.random() * a.length)]; }
    return out;
  }
  function fmtDate(d) {
    try { return new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); } catch (e) { return d || ""; }
  }
  function openAccount() { var m = document.getElementById("account-modal"); if (m) m.classList.remove("hidden"); }

  // ---- générateur de QR code (qrcode-generator 1.4.4, licence MIT, © Kazuhiko Arase) ----
  var QRLIB = (function () { var module, exports, define; var qrcode=function(){var t=function(t,r){var e=t,n=g[r],o=null,i=0,a=null,u=[],f={},c=function(t,r){o=function(t){for(var r=new Array(t),e=0;e<t;e+=1){r[e]=new Array(t);for(var n=0;n<t;n+=1)r[e][n]=null}return r}(i=4*e+17),l(0,0),l(i-7,0),l(0,i-7),s(),h(),d(t,r),e>=7&&v(t),null==a&&(a=p(e,n,u)),w(a,r)},l=function(t,r){for(var e=-1;e<=7;e+=1)if(!(t+e<=-1||i<=t+e))for(var n=-1;n<=7;n+=1)r+n<=-1||i<=r+n||(o[t+e][r+n]=0<=e&&e<=6&&(0==n||6==n)||0<=n&&n<=6&&(0==e||6==e)||2<=e&&e<=4&&2<=n&&n<=4)},h=function(){for(var t=8;t<i-8;t+=1)null==o[t][6]&&(o[t][6]=t%2==0);for(var r=8;r<i-8;r+=1)null==o[6][r]&&(o[6][r]=r%2==0)},s=function(){for(var t=B.getPatternPosition(e),r=0;r<t.length;r+=1)for(var n=0;n<t.length;n+=1){var i=t[r],a=t[n];if(null==o[i][a])for(var u=-2;u<=2;u+=1)for(var f=-2;f<=2;f+=1)o[i+u][a+f]=-2==u||2==u||-2==f||2==f||0==u&&0==f}},v=function(t){for(var r=B.getBCHTypeNumber(e),n=0;n<18;n+=1){var a=!t&&1==(r>>n&1);o[Math.floor(n/3)][n%3+i-8-3]=a}for(n=0;n<18;n+=1){a=!t&&1==(r>>n&1);o[n%3+i-8-3][Math.floor(n/3)]=a}},d=function(t,r){for(var e=n<<3|r,a=B.getBCHTypeInfo(e),u=0;u<15;u+=1){var f=!t&&1==(a>>u&1);u<6?o[u][8]=f:u<8?o[u+1][8]=f:o[i-15+u][8]=f}for(u=0;u<15;u+=1){f=!t&&1==(a>>u&1);u<8?o[8][i-u-1]=f:u<9?o[8][15-u-1+1]=f:o[8][15-u-1]=f}o[i-8][8]=!t},w=function(t,r){for(var e=-1,n=i-1,a=7,u=0,f=B.getMaskFunction(r),c=i-1;c>0;c-=2)for(6==c&&(c-=1);;){for(var g=0;g<2;g+=1)if(null==o[n][c-g]){var l=!1;u<t.length&&(l=1==(t[u]>>>a&1)),f(n,c-g)&&(l=!l),o[n][c-g]=l,-1==(a-=1)&&(u+=1,a=7)}if((n+=e)<0||i<=n){n-=e,e=-e;break}}},p=function(t,r,e){for(var n=A.getRSBlocks(t,r),o=b(),i=0;i<e.length;i+=1){var a=e[i];o.put(a.getMode(),4),o.put(a.getLength(),B.getLengthInBits(a.getMode(),t)),a.write(o)}var u=0;for(i=0;i<n.length;i+=1)u+=n[i].dataCount;if(o.getLengthInBits()>8*u)throw"code length overflow. ("+o.getLengthInBits()+">"+8*u+")";for(o.getLengthInBits()+4<=8*u&&o.put(0,4);o.getLengthInBits()%8!=0;)o.putBit(!1);for(;!(o.getLengthInBits()>=8*u||(o.put(236,8),o.getLengthInBits()>=8*u));)o.put(17,8);return function(t,r){for(var e=0,n=0,o=0,i=new Array(r.length),a=new Array(r.length),u=0;u<r.length;u+=1){var f=r[u].dataCount,c=r[u].totalCount-f;n=Math.max(n,f),o=Math.max(o,c),i[u]=new Array(f);for(var g=0;g<i[u].length;g+=1)i[u][g]=255&t.getBuffer()[g+e];e+=f;var l=B.getErrorCorrectPolynomial(c),h=k(i[u],l.getLength()-1).mod(l);for(a[u]=new Array(l.getLength()-1),g=0;g<a[u].length;g+=1){var s=g+h.getLength()-a[u].length;a[u][g]=s>=0?h.getAt(s):0}}var v=0;for(g=0;g<r.length;g+=1)v+=r[g].totalCount;var d=new Array(v),w=0;for(g=0;g<n;g+=1)for(u=0;u<r.length;u+=1)g<i[u].length&&(d[w]=i[u][g],w+=1);for(g=0;g<o;g+=1)for(u=0;u<r.length;u+=1)g<a[u].length&&(d[w]=a[u][g],w+=1);return d}(o,n)};f.addData=function(t,r){var e=null;switch(r=r||"Byte"){case"Numeric":e=M(t);break;case"Alphanumeric":e=x(t);break;case"Byte":e=m(t);break;case"Kanji":e=L(t);break;default:throw"mode:"+r}u.push(e),a=null},f.isDark=function(t,r){if(t<0||i<=t||r<0||i<=r)throw t+","+r;return o[t][r]},f.getModuleCount=function(){return i},f.make=function(){if(e<1){for(var t=1;t<40;t++){for(var r=A.getRSBlocks(t,n),o=b(),i=0;i<u.length;i++){var a=u[i];o.put(a.getMode(),4),o.put(a.getLength(),B.getLengthInBits(a.getMode(),t)),a.write(o)}var g=0;for(i=0;i<r.length;i++)g+=r[i].dataCount;if(o.getLengthInBits()<=8*g)break}e=t}c(!1,function(){for(var t=0,r=0,e=0;e<8;e+=1){c(!0,e);var n=B.getLostPoint(f);(0==e||t>n)&&(t=n,r=e)}return r}())},f.createTableTag=function(t,r){t=t||2;var e="";e+='<table style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: "+(r=void 0===r?4*t:r)+"px;",e+='">',e+="<tbody>";for(var n=0;n<f.getModuleCount();n+=1){e+="<tr>";for(var o=0;o<f.getModuleCount();o+=1)e+='<td style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: 0px;",e+=" width: "+t+"px;",e+=" height: "+t+"px;",e+=" background-color: ",e+=f.isDark(n,o)?"#000000":"#ffffff",e+=";",e+='"/>';e+="</tr>"}return e+="</tbody>",e+="</table>"},f.createSvgTag=function(t,r,e,n){var o={};"object"==typeof arguments[0]&&(t=(o=arguments[0]).cellSize,r=o.margin,e=o.alt,n=o.title),t=t||2,r=void 0===r?4*t:r,(e="string"==typeof e?{text:e}:e||{}).text=e.text||null,e.id=e.text?e.id||"qrcode-description":null,(n="string"==typeof n?{text:n}:n||{}).text=n.text||null,n.id=n.text?n.id||"qrcode-title":null;var i,a,u,c,g=f.getModuleCount()*t+2*r,l="";for(c="l"+t+",0 0,"+t+" -"+t+",0 0,-"+t+"z ",l+='<svg version="1.1" xmlns="http://www.w3.org/2000/svg"',l+=o.scalable?"":' width="'+g+'px" height="'+g+'px"',l+=' viewBox="0 0 '+g+" "+g+'" ',l+=' preserveAspectRatio="xMinYMin meet"',l+=n.text||e.text?' role="img" aria-labelledby="'+y([n.id,e.id].join(" ").trim())+'"':"",l+=">",l+=n.text?'<title id="'+y(n.id)+'">'+y(n.text)+"</title>":"",l+=e.text?'<description id="'+y(e.id)+'">'+y(e.text)+"</description>":"",l+='<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>',l+='<path d="',a=0;a<f.getModuleCount();a+=1)for(u=a*t+r,i=0;i<f.getModuleCount();i+=1)f.isDark(a,i)&&(l+="M"+(i*t+r)+","+u+c);return l+='" stroke="transparent" fill="black"/>',l+="</svg>"},f.createDataURL=function(t,r){t=t||2,r=void 0===r?4*t:r;var e=f.getModuleCount()*t+2*r,n=r,o=e-r;return I(e,e,function(r,e){if(n<=r&&r<o&&n<=e&&e<o){var i=Math.floor((r-n)/t),a=Math.floor((e-n)/t);return f.isDark(a,i)?0:1}return 1})},f.createImgTag=function(t,r,e){t=t||2,r=void 0===r?4*t:r;var n=f.getModuleCount()*t+2*r,o="";return o+="<img",o+=' src="',o+=f.createDataURL(t,r),o+='"',o+=' width="',o+=n,o+='"',o+=' height="',o+=n,o+='"',e&&(o+=' alt="',o+=y(e),o+='"'),o+="/>"};var y=function(t){for(var r="",e=0;e<t.length;e+=1){var n=t.charAt(e);switch(n){case"<":r+="&lt;";break;case">":r+="&gt;";break;case"&":r+="&amp;";break;case'"':r+="&quot;";break;default:r+=n}}return r};return f.createASCII=function(t,r){if((t=t||1)<2)return function(t){t=void 0===t?2:t;var r,e,n,o,i,a=1*f.getModuleCount()+2*t,u=t,c=a-t,g={"██":"█","█ ":"▀"," █":"▄","  ":" "},l={"██":"▀","█ ":"▀"," █":" ","  ":" "},h="";for(r=0;r<a;r+=2){for(n=Math.floor((r-u)/1),o=Math.floor((r+1-u)/1),e=0;e<a;e+=1)i="█",u<=e&&e<c&&u<=r&&r<c&&f.isDark(n,Math.floor((e-u)/1))&&(i=" "),u<=e&&e<c&&u<=r+1&&r+1<c&&f.isDark(o,Math.floor((e-u)/1))?i+=" ":i+="█",h+=t<1&&r+1>=c?l[i]:g[i];h+="\n"}return a%2&&t>0?h.substring(0,h.length-a-1)+Array(a+1).join("▀"):h.substring(0,h.length-1)}(r);t-=1,r=void 0===r?2*t:r;var e,n,o,i,a=f.getModuleCount()*t+2*r,u=r,c=a-r,g=Array(t+1).join("██"),l=Array(t+1).join("  "),h="",s="";for(e=0;e<a;e+=1){for(o=Math.floor((e-u)/t),s="",n=0;n<a;n+=1)i=1,u<=n&&n<c&&u<=e&&e<c&&f.isDark(o,Math.floor((n-u)/t))&&(i=0),s+=i?g:l;for(o=0;o<t;o+=1)h+=s+"\n"}return h.substring(0,h.length-1)},f.renderTo2dContext=function(t,r){r=r||2;for(var e=f.getModuleCount(),n=0;n<e;n++)for(var o=0;o<e;o++)t.fillStyle=f.isDark(n,o)?"black":"white",t.fillRect(n*r,o*r,r,r)},f};t.stringToBytes=(t.stringToBytesFuncs={default:function(t){for(var r=[],e=0;e<t.length;e+=1){var n=t.charCodeAt(e);r.push(255&n)}return r}}).default,t.createStringToBytes=function(t,r){var e=function(){for(var e=S(t),n=function(){var t=e.read();if(-1==t)throw"eof";return t},o=0,i={};;){var a=e.read();if(-1==a)break;var u=n(),f=n()<<8|n();i[String.fromCharCode(a<<8|u)]=f,o+=1}if(o!=r)throw o+" != "+r;return i}(),n="?".charCodeAt(0);return function(t){for(var r=[],o=0;o<t.length;o+=1){var i=t.charCodeAt(o);if(i<128)r.push(i);else{var a=e[t.charAt(o)];"number"==typeof a?(255&a)==a?r.push(a):(r.push(a>>>8),r.push(255&a)):r.push(n)}}return r}};var r,e,n,o,i,a=1,u=2,f=4,c=8,g={L:1,M:0,Q:3,H:2},l=0,h=1,s=2,v=3,d=4,w=5,p=6,y=7,B=(r=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],e=1335,n=7973,i=function(t){for(var r=0;0!=t;)r+=1,t>>>=1;return r},(o={}).getBCHTypeInfo=function(t){for(var r=t<<10;i(r)-i(e)>=0;)r^=e<<i(r)-i(e);return 21522^(t<<10|r)},o.getBCHTypeNumber=function(t){for(var r=t<<12;i(r)-i(n)>=0;)r^=n<<i(r)-i(n);return t<<12|r},o.getPatternPosition=function(t){return r[t-1]},o.getMaskFunction=function(t){switch(t){case l:return function(t,r){return(t+r)%2==0};case h:return function(t,r){return t%2==0};case s:return function(t,r){return r%3==0};case v:return function(t,r){return(t+r)%3==0};case d:return function(t,r){return(Math.floor(t/2)+Math.floor(r/3))%2==0};case w:return function(t,r){return t*r%2+t*r%3==0};case p:return function(t,r){return(t*r%2+t*r%3)%2==0};case y:return function(t,r){return(t*r%3+(t+r)%2)%2==0};default:throw"bad maskPattern:"+t}},o.getErrorCorrectPolynomial=function(t){for(var r=k([1],0),e=0;e<t;e+=1)r=r.multiply(k([1,C.gexp(e)],0));return r},o.getLengthInBits=function(t,r){if(1<=r&&r<10)switch(t){case a:return 10;case u:return 9;case f:case c:return 8;default:throw"mode:"+t}else if(r<27)switch(t){case a:return 12;case u:return 11;case f:return 16;case c:return 10;default:throw"mode:"+t}else{if(!(r<41))throw"type:"+r;switch(t){case a:return 14;case u:return 13;case f:return 16;case c:return 12;default:throw"mode:"+t}}},o.getLostPoint=function(t){for(var r=t.getModuleCount(),e=0,n=0;n<r;n+=1)for(var o=0;o<r;o+=1){for(var i=0,a=t.isDark(n,o),u=-1;u<=1;u+=1)if(!(n+u<0||r<=n+u))for(var f=-1;f<=1;f+=1)o+f<0||r<=o+f||0==u&&0==f||a==t.isDark(n+u,o+f)&&(i+=1);i>5&&(e+=3+i-5)}for(n=0;n<r-1;n+=1)for(o=0;o<r-1;o+=1){var c=0;t.isDark(n,o)&&(c+=1),t.isDark(n+1,o)&&(c+=1),t.isDark(n,o+1)&&(c+=1),t.isDark(n+1,o+1)&&(c+=1),0!=c&&4!=c||(e+=3)}for(n=0;n<r;n+=1)for(o=0;o<r-6;o+=1)t.isDark(n,o)&&!t.isDark(n,o+1)&&t.isDark(n,o+2)&&t.isDark(n,o+3)&&t.isDark(n,o+4)&&!t.isDark(n,o+5)&&t.isDark(n,o+6)&&(e+=40);for(o=0;o<r;o+=1)for(n=0;n<r-6;n+=1)t.isDark(n,o)&&!t.isDark(n+1,o)&&t.isDark(n+2,o)&&t.isDark(n+3,o)&&t.isDark(n+4,o)&&!t.isDark(n+5,o)&&t.isDark(n+6,o)&&(e+=40);var g=0;for(o=0;o<r;o+=1)for(n=0;n<r;n+=1)t.isDark(n,o)&&(g+=1);return e+=Math.abs(100*g/r/r-50)/5*10},o),C=function(){for(var t=new Array(256),r=new Array(256),e=0;e<8;e+=1)t[e]=1<<e;for(e=8;e<256;e+=1)t[e]=t[e-4]^t[e-5]^t[e-6]^t[e-8];for(e=0;e<255;e+=1)r[t[e]]=e;var n={glog:function(t){if(t<1)throw"glog("+t+")";return r[t]},gexp:function(r){for(;r<0;)r+=255;for(;r>=256;)r-=255;return t[r]}};return n}();function k(t,r){if(void 0===t.length)throw t.length+"/"+r;var e=function(){for(var e=0;e<t.length&&0==t[e];)e+=1;for(var n=new Array(t.length-e+r),o=0;o<t.length-e;o+=1)n[o]=t[o+e];return n}(),n={getAt:function(t){return e[t]},getLength:function(){return e.length},multiply:function(t){for(var r=new Array(n.getLength()+t.getLength()-1),e=0;e<n.getLength();e+=1)for(var o=0;o<t.getLength();o+=1)r[e+o]^=C.gexp(C.glog(n.getAt(e))+C.glog(t.getAt(o)));return k(r,0)},mod:function(t){if(n.getLength()-t.getLength()<0)return n;for(var r=C.glog(n.getAt(0))-C.glog(t.getAt(0)),e=new Array(n.getLength()),o=0;o<n.getLength();o+=1)e[o]=n.getAt(o);for(o=0;o<t.getLength();o+=1)e[o]^=C.gexp(C.glog(t.getAt(o))+r);return k(e,0).mod(t)}};return n}var A=function(){var t=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12,7,37,13],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],r=function(t,r){var e={};return e.totalCount=t,e.dataCount=r,e},e={};return e.getRSBlocks=function(e,n){var o=function(r,e){switch(e){case g.L:return t[4*(r-1)+0];case g.M:return t[4*(r-1)+1];case g.Q:return t[4*(r-1)+2];case g.H:return t[4*(r-1)+3];default:return}}(e,n);if(void 0===o)throw"bad rs block @ typeNumber:"+e+"/errorCorrectionLevel:"+n;for(var i=o.length/3,a=[],u=0;u<i;u+=1)for(var f=o[3*u+0],c=o[3*u+1],l=o[3*u+2],h=0;h<f;h+=1)a.push(r(c,l));return a},e}(),b=function(){var t=[],r=0,e={getBuffer:function(){return t},getAt:function(r){var e=Math.floor(r/8);return 1==(t[e]>>>7-r%8&1)},put:function(t,r){for(var n=0;n<r;n+=1)e.putBit(1==(t>>>r-n-1&1))},getLengthInBits:function(){return r},putBit:function(e){var n=Math.floor(r/8);t.length<=n&&t.push(0),e&&(t[n]|=128>>>r%8),r+=1}};return e},M=function(t){var r=a,e=t,n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=e,n=0;n+2<r.length;)t.put(o(r.substring(n,n+3)),10),n+=3;n<r.length&&(r.length-n==1?t.put(o(r.substring(n,n+1)),4):r.length-n==2&&t.put(o(r.substring(n,n+2)),7))}},o=function(t){for(var r=0,e=0;e<t.length;e+=1)r=10*r+i(t.charAt(e));return r},i=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);throw"illegal char :"+t};return n},x=function(t){var r=u,e=t,n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=e,n=0;n+1<r.length;)t.put(45*o(r.charAt(n))+o(r.charAt(n+1)),11),n+=2;n<r.length&&t.put(o(r.charAt(n)),6)}},o=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);if("A"<=t&&t<="Z")return t.charCodeAt(0)-"A".charCodeAt(0)+10;switch(t){case" ":return 36;case"$":return 37;case"%":return 38;case"*":return 39;case"+":return 40;case"-":return 41;case".":return 42;case"/":return 43;case":":return 44;default:throw"illegal char :"+t}};return n},m=function(r){var e=f,n=t.stringToBytes(r),o={getMode:function(){return e},getLength:function(t){return n.length},write:function(t){for(var r=0;r<n.length;r+=1)t.put(n[r],8)}};return o},L=function(r){var e=c,n=t.stringToBytesFuncs.SJIS;if(!n)throw"sjis not supported.";!function(){var t=n("友");if(2!=t.length||38726!=(t[0]<<8|t[1]))throw"sjis not supported."}();var o=n(r),i={getMode:function(){return e},getLength:function(t){return~~(o.length/2)},write:function(t){for(var r=o,e=0;e+1<r.length;){var n=(255&r[e])<<8|255&r[e+1];if(33088<=n&&n<=40956)n-=33088;else{if(!(57408<=n&&n<=60351))throw"illegal char at "+(e+1)+"/"+n;n-=49472}n=192*(n>>>8&255)+(255&n),t.put(n,13),e+=2}if(e<r.length)throw"illegal char at "+(e+1)}};return i},D=function(){var t=[],r={writeByte:function(r){t.push(255&r)},writeShort:function(t){r.writeByte(t),r.writeByte(t>>>8)},writeBytes:function(t,e,n){e=e||0,n=n||t.length;for(var o=0;o<n;o+=1)r.writeByte(t[o+e])},writeString:function(t){for(var e=0;e<t.length;e+=1)r.writeByte(t.charCodeAt(e))},toByteArray:function(){return t},toString:function(){var r="";r+="[";for(var e=0;e<t.length;e+=1)e>0&&(r+=","),r+=t[e];return r+="]"}};return r},S=function(t){var r=t,e=0,n=0,o=0,i={read:function(){for(;o<8;){if(e>=r.length){if(0==o)return-1;throw"unexpected end of file./"+o}var t=r.charAt(e);if(e+=1,"="==t)return o=0,-1;t.match(/^\s$/)||(n=n<<6|a(t.charCodeAt(0)),o+=6)}var i=n>>>o-8&255;return o-=8,i}},a=function(t){if(65<=t&&t<=90)return t-65;if(97<=t&&t<=122)return t-97+26;if(48<=t&&t<=57)return t-48+52;if(43==t)return 62;if(47==t)return 63;throw"c:"+t};return i},I=function(t,r,e){for(var n=function(t,r){var e=t,n=r,o=new Array(t*r),i={setPixel:function(t,r,n){o[r*e+t]=n},write:function(t){t.writeString("GIF87a"),t.writeShort(e),t.writeShort(n),t.writeByte(128),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(255),t.writeByte(255),t.writeByte(255),t.writeString(","),t.writeShort(0),t.writeShort(0),t.writeShort(e),t.writeShort(n),t.writeByte(0);var r=a(2);t.writeByte(2);for(var o=0;r.length-o>255;)t.writeByte(255),t.writeBytes(r,o,255),o+=255;t.writeByte(r.length-o),t.writeBytes(r,o,r.length-o),t.writeByte(0),t.writeString(";")}},a=function(t){for(var r=1<<t,e=1+(1<<t),n=t+1,i=u(),a=0;a<r;a+=1)i.add(String.fromCharCode(a));i.add(String.fromCharCode(r)),i.add(String.fromCharCode(e));var f,c,g,l=D(),h=(f=l,c=0,g=0,{write:function(t,r){if(t>>>r!=0)throw"length over";for(;c+r>=8;)f.writeByte(255&(t<<c|g)),r-=8-c,t>>>=8-c,g=0,c=0;g|=t<<c,c+=r},flush:function(){c>0&&f.writeByte(g)}});h.write(r,n);var s=0,v=String.fromCharCode(o[s]);for(s+=1;s<o.length;){var d=String.fromCharCode(o[s]);s+=1,i.contains(v+d)?v+=d:(h.write(i.indexOf(v),n),i.size()<4095&&(i.size()==1<<n&&(n+=1),i.add(v+d)),v=d)}return h.write(i.indexOf(v),n),h.write(e,n),h.flush(),l.toByteArray()},u=function(){var t={},r=0,e={add:function(n){if(e.contains(n))throw"dup key:"+n;t[n]=r,r+=1},size:function(){return r},indexOf:function(r){return t[r]},contains:function(r){return void 0!==t[r]}};return e};return i}(t,r),o=0;o<r;o+=1)for(var i=0;i<t;i+=1)n.setPixel(i,o,e(i,o));var a=D();n.write(a);for(var u=function(){var t=0,r=0,e=0,n="",o={},i=function(t){n+=String.fromCharCode(a(63&t))},a=function(t){if(t<0);else{if(t<26)return 65+t;if(t<52)return t-26+97;if(t<62)return t-52+48;if(62==t)return 43;if(63==t)return 47}throw"n:"+t};return o.writeByte=function(n){for(t=t<<8|255&n,r+=8,e+=1;r>=6;)i(t>>>r-6),r-=6},o.flush=function(){if(r>0&&(i(t<<6-r),t=0,r=0),e%3!=0)for(var o=3-e%3,a=0;a<o;a+=1)n+="="},o.toString=function(){return n},o}(),f=a.toByteArray(),c=0;c<f.length;c+=1)u.writeByte(f[c]);return u.flush(),"data:image/gif;base64,"+u};return t}();qrcode.stringToBytesFuncs["UTF-8"]=function(t){return function(t){for(var r=[],e=0;e<t.length;e++){var n=t.charCodeAt(e);n<128?r.push(n):n<2048?r.push(192|n>>6,128|63&n):n<55296||n>=57344?r.push(224|n>>12,128|n>>6&63,128|63&n):(e++,n=65536+((1023&n)<<10|1023&t.charCodeAt(e)),r.push(240|n>>18,128|n>>12&63,128|n>>6&63,128|63&n))}return r}(t)},function(t){"function"==typeof define&&define.amd?define([],t):"object"==typeof exports&&(module.exports=t())}(function(){return qrcode});
 return qrcode; })();

  // ---- habillage ----
  var CSS = [
    "#wz-so{position:fixed;inset:0;z-index:100000;background:#FAFAFA;color:#1A1A1A;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:calc(14px + env(safe-area-inset-top,0px)) 16px calc(28px + env(safe-area-inset-bottom,0px));font-family:inherit}",
    "#wz-so .so-in{max-width:560px;margin:0 auto}",
    "#wz-so .so-top{display:flex;align-items:center;gap:10px;margin-bottom:14px}",
    "#wz-so .so-back{border:1.5px solid #E5E7EB;background:#fff;color:#14213D;border-radius:12px;padding:8px 12px;font-family:inherit;font-weight:700;font-size:14px;cursor:pointer}",
    "#wz-so h1{font-size:22px;color:#14213D;margin:0;font-weight:800}",
    "#wz-so .so-lab{font-size:12px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;margin:16px 0 6px}",
    "#wz-so input[type=date]{-webkit-appearance:none;appearance:none;display:block;min-width:0;max-width:100%;height:50px;text-align:left}",
    "#wz-so input[type=date]::-webkit-date-and-time-value{text-align:left}",
    "#wz-so input[type=text],#wz-so input[type=date]{width:100%;box-sizing:border-box;background:#fff;border:1.5px solid #E5E7EB;border-radius:14px;padding:13px 14px;font:inherit;font-size:16px;color:#1A1A1A}",
    "#wz-so .so-btn{display:block;width:100%;box-sizing:border-box;background:#E8604C;color:#fff;font-weight:800;text-align:center;padding:15px;border:0;border-radius:16px;font-family:inherit;font-weight:800;font-size:16px;cursor:pointer;margin-top:14px}",
    "#wz-so .so-btn.alt{background:#fff;color:#14213D;border:2px solid #14213D}",
    "#wz-so .so-btn[disabled]{opacity:.55}",
    "#wz-so .so-card{display:block;width:100%;box-sizing:border-box;text-align:left;border:0;border-radius:18px;padding:16px;margin-bottom:10px;color:#fff;background:linear-gradient(135deg,#14213D,#2C3E6B);cursor:pointer;font:inherit}",
    "#wz-so .so-card b{display:block;font-size:18px}#wz-so .so-card span{font-size:13px;opacity:.85}",
    "#wz-so .so-row{display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid #E5E7EB;border-radius:14px;padding:10px 12px;margin-bottom:8px;font-weight:700;font-size:15px}",
    "#wz-so .so-row input{width:22px;height:22px;accent-color:#E8604C;margin-left:auto}",
    "#wz-so .so-note{font-size:12.5px;color:#6B7280;line-height:1.4;margin-top:8px}",
    "#wz-so .so-hero{border-radius:18px;padding:16px;color:#fff;background:linear-gradient(135deg,#14213D,#2C3E6B);margin-bottom:12px}",
    "#wz-so .so-hero b{font-size:20px;display:block}#wz-so .so-hero span{font-size:13px;opacity:.88;display:block;margin-top:3px}",
    "#wz-so .so-tabs{display:flex;gap:6px;margin:6px 0 10px}",
    "#wz-so .so-tabs button{flex:1;border:0;border-radius:12px;padding:9px;font-family:inherit;font-weight:800;font-size:13px;background:#EEF0F4;color:#6B7280;cursor:pointer}",
    "#wz-so .so-tabs button.on{background:#14213D;color:#fff}",
    "#wz-so .so-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}",
    "#wz-so .so-grid button{padding:0;border:0;background:#EEF0F4;border-radius:8px;overflow:hidden;aspect-ratio:1;cursor:pointer}",
    "#wz-so .so-grid img{width:100%;height:100%;object-fit:cover;display:block}",
    "#wz-so .so-empty{text-align:center;color:#6B7280;padding:30px 10px;font-size:14px;line-height:1.5}",
    "#wz-so .so-link{background:none;border:0;color:#9BA5C2;text-decoration:underline;font:inherit;font-size:12.5px;cursor:pointer;margin-top:18px}",
    "#wz-so-qr{position:fixed;inset:0;z-index:100004;background:#fff;color:#14213D;overflow-y:auto;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;padding:calc(16px + env(safe-area-inset-top,0px)) 20px calc(20px + env(safe-area-inset-bottom,0px));font-family:inherit}",
    "#wz-so-qr .q-t{font-size:24px;font-weight:800;line-height:1.2;max-width:420px}",
    "#wz-so-qr .q-s{font-size:14px;color:#6B7280;max-width:420px}",
    "#wz-so-qr .q-c{width:min(82vw,380px);height:min(82vw,380px)}",
    "#wz-so-qr .q-c svg{display:block;width:100%;height:100%}",
    "#wz-so-qr .q-h{font-size:17px;font-weight:800}",
    "#wz-so-qr .q-l{font-size:12px;color:#6B7280;word-break:break-all;max-width:420px}",
    "#wz-so-qr .q-b{display:flex;gap:10px;margin-top:6px}",
    "#wz-so-qr .q-b button{border:2px solid #14213D;background:#fff;color:#14213D;border-radius:14px;padding:12px 18px;font-family:inherit;font-weight:800;font-size:15px;cursor:pointer}",
    "#wz-so-qr .q-b button.p{background:#E8604C;border-color:#E8604C;color:#fff}",
    "@media print{body>*:not(#wz-so-qr){display:none!important}#wz-so-qr{position:static!important;display:flex!important;overflow:visible!important}#wz-so-qr .q-b{display:none!important}#wz-so-qr .q-c{width:14cm!important;height:14cm!important}}",
    "#wz-so-v{position:fixed;inset:0;z-index:100001;background:rgba(11,19,40,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px}",
    "#wz-so-v img{max-width:100%;max-height:76vh;border-radius:12px}",
    "#wz-so-v .vb{display:flex;gap:10px;margin-top:14px}",
    "#wz-so-v button{border:0;border-radius:12px;padding:11px 16px;font-family:inherit;font-weight:800;font-size:14px;cursor:pointer;background:#fff;color:#14213D}",
    "#wz-so-v button.del{background:#E8604C;color:#fff}",
    "#account-modal{z-index:100002!important}",
    "#wz-so-toast{position:fixed;left:50%;bottom:calc(30px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);max-width:88vw;z-index:100003;background:#14213D;color:#fff;font:700 14px/1.35 system-ui,sans-serif;padding:12px 18px;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.25);opacity:0;transition:opacity .25s;pointer-events:none;text-align:center}",
    "#wz-so-entry{display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;margin:0 0 12px;padding:12px 14px;border-radius:16px;border:1.5px solid #E8604C;background:#FCEAE7;color:#C64A38;font-family:inherit;font-weight:800;font-size:15px;cursor:pointer}"
  ].join("\n");
  function addCss() {
    if (document.getElementById("wz-so-css")) return;
    var s = document.createElement("style"); s.id = "wz-so-css"; s.textContent = CSS; document.head.appendChild(s);
  }

  // ---- écran de base ----
  function root() {
    addCss();
    var r = document.getElementById("wz-so");
    if (!r) { r = document.createElement("div"); r.id = "wz-so"; document.body.appendChild(r); }
    return r;
  }
  function closeAll() { var r = document.getElementById("wz-so"); if (r) r.remove(); var v = document.getElementById("wz-so-v"); if (v) v.remove(); var q = document.getElementById("wz-so-qr"); if (q) q.remove(); }
  function frame(title, backFn, bodyHtml) {
    var r = root();
    r.innerHTML = '<div class="so-in"><div class="so-top"><button class="so-back" id="so-back">←</button><h1>' + esc(title) + '</h1></div>' + bodyHtml + '</div>';
    r.scrollTop = 0;
    r.querySelector("#so-back").onclick = backFn || closeAll;
    return r;
  }

  // ---- QR code de la soirée : à faire scanner (écran, table, impression) ----
  function qrSvg(text) {
    var q = QRLIB(0, "M"); q.addData(text); q.make();
    var n = q.getModuleCount(), m = 4, size = n + 2 * m, d = "";
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += "M" + (c + m) + " " + (r + m) + "h1v1h-1z";
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + " " + size + '" shape-rendering="crispEdges" role="img" aria-label="QR code de la soirée"><rect width="' + size + '" height="' + size + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }
  function qrScreen(s) {
    addCss();
    var old = document.getElementById("wz-so-qr"); if (old) old.remove();
    var link = LINK + s.id, svg;
    try { svg = qrSvg(link); } catch (e) { console.error(e); toast("Le QR code n'a pas pu être créé."); return; }
    var o = document.createElement("div"); o.id = "wz-so-qr";
    o.innerHTML =
      '<div class="q-t">' + esc(s.name) + '</div>' +
      '<div class="q-s">' + esc(fmtDate(s.date)) + (s.place ? " · " + esc(s.place) : "") + '</div>' +
      '<div class="q-c">' + svg + '</div>' +
      '<div class="q-h">Scanne pour rejoindre la soirée 📸</div>' +
      '<div class="q-l">' + esc(link) + '</div>' +
      '<div class="q-b"><button class="p" id="q-print">🖨️ Imprimer</button><button id="q-close">Fermer</button></div>';
    document.body.appendChild(o);
    o.querySelector("#q-close").onclick = function () { o.remove(); };
    o.querySelector("#q-print").onclick = function () { try { window.print(); } catch (e) { toast("Impression impossible ici : fais une capture d'écran du QR code."); } };
  }

  var openAfterLogin = false;
  // ---- liste des soirées ----
  async function listScreen() {
    if (!realUser()) { openAfterLogin = true; toast("Connecte-toi pour créer ou rejoindre une soirée."); openAccount(); return; }
    var r = frame("Mes soirées", closeAll,
      '<button class="so-btn" id="so-new" style="margin-top:0">＋ Créer une soirée</button><div id="so-list" class="so-empty">Chargement…</div>');
    r.querySelector("#so-new").onclick = createScreen;
    var box = r.querySelector("#so-list");
    try {
      var snap = await DB().collection("soirees").where("members", "array-contains", realUser().uid).get();
      var arr = snap.docs.map(function (d) { var x = d.data(); x.id = d.id; return x; });
      arr.sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); });
      if (!arr.length) { box.innerHTML = "Aucune soirée pour l'instant.<br>Crée la première et invite tes amis !"; return; }
      box.className = ""; box.innerHTML = "";
      arr.forEach(function (s) {
        var b = document.createElement("button"); b.className = "so-card";
        b.innerHTML = "<b>" + esc(s.name) + "</b><span>" + esc(fmtDate(s.date)) + " · " + (s.members ? s.members.length : 1) + " personne" + ((s.members && s.members.length > 1) ? "s" : "") + "</span>";
        b.onclick = function () { albumScreen(s.id); };
        box.appendChild(b);
      });
    } catch (e) { console.error(e); box.textContent = "Impossible de charger tes soirées pour l'instant."; }
  }

  // ---- création + invitation ----
  async function createScreen() {
    var u = realUser(); if (!u) return;
    var today = new Date(); var iso = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    var r = frame("Nouvelle soirée", listScreen,
      '<div class="so-lab">Nom</div><input type="text" id="so-name" maxlength="60" placeholder="Anniversaire de Léa">' +
      '<div class="so-lab">Date</div><input type="date" id="so-date" value="' + iso + '">' +
      '<div class="so-lab">Lieu (facultatif)</div><input type="text" id="so-place" maxlength="80" placeholder="Chez Léa, Paris 11e">' +
      '<div class="so-lab">Tes amis sur Whazup</div><div id="so-fr"><div class="so-note">Chargement…</div></div>' +
      '<div class="so-note">🔒 Seules les personnes invitées voient l\'album. Tout le monde voit toutes les photos.</div>' +
      '<button class="so-btn" id="so-go">Créer la soirée</button>');
    var friends = [];
    try { friends = (window.__loadFriendsList ? await window.__loadFriendsList() : []) || []; } catch (e) {}
    var fr = r.querySelector("#so-fr");
    if (!friends.length) fr.innerHTML = '<div class="so-note">Tu n\'as pas encore d\'amis sur Whazup : crée la soirée, puis envoie-leur le lien d\'invitation.</div>';
    else {
      fr.innerHTML = "";
      friends.forEach(function (f) {
        var nm = (window.__niceName ? window.__niceName(null, f.email) : "") || f.email || "Ami";
        var row = document.createElement("label"); row.className = "so-row";
        row.innerHTML = "<span>" + esc(nm) + '</span><input type="checkbox" value="' + esc(f.uid) + '">';
        fr.appendChild(row);
      });
    }
    r.querySelector("#so-go").onclick = async function () {
      var name = r.querySelector("#so-name").value.trim();
      var date = r.querySelector("#so-date").value;
      var place = r.querySelector("#so-place").value.trim();
      if (!name) { toast("Donne un nom à la soirée."); return; }
      if (!date) { toast("Choisis la date de la soirée."); return; }
      var members = [u.uid];
      r.querySelectorAll("#so-fr input:checked").forEach(function (c) { if (members.indexOf(c.value) < 0) members.push(c.value); });
      if (members.length > MAX_MEMBERS) { toast("50 personnes maximum par soirée."); return; }
      var btn = r.querySelector("#so-go"); btn.disabled = true; btn.textContent = "Création…";
      var id = newId();
      try {
        await DB().collection("soirees").doc(id).set({ ownerUid: u.uid, ownerName: myName(), name: name, date: date, place: place, members: members, createdAt: Date.now() });
        albumScreen(id, true);
      } catch (e) { console.error(e); btn.disabled = false; btn.textContent = "Créer la soirée"; toast("Création impossible pour le moment."); }
    };
  }

  async function shareInvite(s) {
    var url = LINK + s.id;
    var text = "Rejoins la soirée « " + s.name + " » sur Whazup pour voir et partager les photos : " + url;
    try { if (navigator.share) { await navigator.share({ title: "Soirée " + s.name, text: "Rejoins la soirée « " + s.name + " » sur Whazup pour voir et partager les photos.", url: url }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(text); toast("✓ Lien d'invitation copié."); }
    catch (e) { try { prompt("Copie ce lien d'invitation :", url); } catch (x) {} }
  }

  // ---- album ----
  async function albumScreen(id, justCreated) {
    var u = realUser(); if (!u) { listScreen(); return; }
    var r = frame("Soirée", listScreen, '<div class="so-empty">Chargement…</div>');
    var s;
    try {
      var d = await DB().collection("soirees").doc(id).get();
      if (!d.exists) { toast("Cette soirée n'existe plus."); return listScreen(); }
      s = d.data(); s.id = id;
    } catch (e) { console.error(e); toast("Impossible d'ouvrir la soirée."); return listScreen(); }
    if ((s.members || []).indexOf(u.uid) < 0) { toast("Tu n'as pas accès à cette soirée."); return listScreen(); }

    var photos = [], tab = "all";
    async function load() {
      var snap = await DB().collection("soirees").doc(id).collection("photos").get();
      photos = snap.docs.map(function (p) { var x = p.data(); x._id = p.id; return x; });
      photos.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    }
    try { await load(); } catch (e) { console.error(e); }
    var isOwner = s.ownerUid === u.uid;

    function draw() {
      var mine = photos.filter(function (p) { return p.ownerUid === u.uid; });
      var shown = tab === "mine" ? mine : photos;
      var nPeople = (s.members || []).length;
      var html =
        '<div class="so-hero"><b>' + esc(s.name) + '</b><span>' + esc(fmtDate(s.date)) + (s.place ? " · " + esc(s.place) : "") + '</span>' +
        '<span>' + nPeople + ' personne' + (nPeople > 1 ? "s" : "") + ' · ' + photos.length + ' photo' + (photos.length > 1 ? "s" : "") + '</span></div>' +
        '<button class="so-btn alt" id="so-inv" style="margin-top:0">🔗 Inviter quelqu\'un</button>' +
        '<button class="so-btn alt" id="so-qr" style="margin-top:10px">📱 Afficher le QR code</button>' +
        '<button class="so-link" id="so-copy" style="display:block;margin:8px auto 0">Copier seulement le lien</button>' +
        '<div class="so-tabs"><button data-t="all" class="' + (tab === "all" ? "on" : "") + '">Toutes</button><button data-t="mine" class="' + (tab === "mine" ? "on" : "") + '">Les miennes (' + mine.length + ')</button></div>' +
        (shown.length ? '<div class="so-grid" id="so-grid"></div>' : '<div class="so-empty">' + (tab === "mine" ? "Tu n'as pas encore ajouté de photo." : "Aucune photo pour l'instant.<br>Ajoute les premières !") + '</div>') +
        '<input type="file" id="so-file" accept="image/*" multiple style="display:none">' +
        '<button class="so-btn" id="so-add">📸 Ajouter mes photos</button>' +
        '<div class="so-note" id="so-msg"></div>' +
        (isOwner ? '<div style="text-align:center"><button class="so-link" id="so-del">Supprimer cette soirée</button></div>' : "");
      var rr = frame(s.name, listScreen, html);
      rr.querySelector("#so-inv").onclick = function () { shareInvite(s); };
      rr.querySelector("#so-qr").onclick = function () { qrScreen(s); };
      rr.querySelector("#so-copy").onclick = async function () {
        try { await navigator.clipboard.writeText(LINK + s.id); toast("✓ Lien copié."); }
        catch (e) { try { prompt("Copie ce lien :", LINK + s.id); } catch (x) {} }
      };
      rr.querySelectorAll(".so-tabs button").forEach(function (b) { b.onclick = function () { tab = b.getAttribute("data-t"); draw(); }; });
      var grid = rr.querySelector("#so-grid");
      if (grid) shown.forEach(function (p) {
        var b = document.createElement("button"); var im = document.createElement("img");
        im.loading = "lazy"; im.alt = ""; im.src = p.photoUrl; b.appendChild(im);
        b.onclick = function () { viewer(p); }; grid.appendChild(b);
      });
      rr.querySelector("#so-add").onclick = function () { rr.querySelector("#so-file").click(); };
      rr.querySelector("#so-file").onchange = function (ev) { upload(ev.target.files, rr); };
      var del = rr.querySelector("#so-del");
      if (del) del.onclick = removeAlbum;
    }
    async function upload(files, rr) {
      files = Array.prototype.slice.call(files || []);
      if (!files.length) return;
      var have = photos.filter(function (p) { return p.ownerUid === u.uid; }).length;
      var room = MAX_PHOTOS - have;
      if (room <= 0) { toast("Tu as déjà ajouté " + MAX_PHOTOS + " photos à cette soirée."); return; }
      if (files.length > room) { files = files.slice(0, room); toast("Seulement " + room + " photo" + (room > 1 ? "s" : "") + " de plus possible" + (room > 1 ? "s" : "") + " (30 maximum par personne)."); }
      var msg = rr.querySelector("#so-msg"), ok = 0;
      for (var i = 0; i < files.length; i++) {
        msg.textContent = "Envoi " + (i + 1) + " / " + files.length + "…";
        try {
          var f = files[i];
          if (window.__compressImage) f = await window.__compressImage(f);
          var pid = newId().slice(0, 10);
          var ref = STORE().ref().child("souvenirs/" + u.uid + "/soiree-" + id + "-" + pid + ".jpg");
          await ref.put(f, { contentType: "image/jpeg" });
          var url = await ref.getDownloadURL();
          await DB().collection("soirees").doc(id).collection("photos").doc(pid).set({ ownerUid: u.uid, ownerName: myName(), photoUrl: url, createdAt: Date.now() });
          ok++;
        } catch (e) { console.error(e); toast("Une photo n'a pas pu être envoyée."); }
      }
      try { await load(); } catch (e) {}
      draw();
      if (ok) toast("✓ " + ok + " photo" + (ok > 1 ? "s ajoutées" : " ajoutée"));
    }
    function viewer(p) {
      var v = document.createElement("div"); v.id = "wz-so-v";
      var canDel = p.ownerUid === u.uid || isOwner;
      v.innerHTML = '<img src="' + esc(p.photoUrl) + '" alt=""><div class="so-note" style="color:#fff;opacity:.8">Photo de ' + esc(p.ownerName || "un participant") + '</div><div class="vb"><button id="v-x">Fermer</button>' + (canDel ? '<button class="del" id="v-d">Supprimer</button>' : "") + '</div>';
      document.body.appendChild(v);
      v.querySelector("#v-x").onclick = function () { v.remove(); };
      var d = v.querySelector("#v-d");
      if (d) d.onclick = async function () {
        if (!confirm("Supprimer cette photo de la soirée ?")) return;
        try {
          await DB().collection("soirees").doc(id).collection("photos").doc(p._id).delete();
          try { await STORE().refFromURL(p.photoUrl).delete(); } catch (e) {}
          v.remove(); await load(); draw();
        } catch (e) { console.error(e); toast("Suppression impossible."); }
      };
    }
    async function removeAlbum() {
      if (!confirm("Supprimer la soirée « " + s.name + " » et toutes ses photos pour tout le monde ?")) return;
      try {
        for (var i = 0; i < photos.length; i++) {
          await DB().collection("soirees").doc(id).collection("photos").doc(photos[i]._id).delete();
          try { await STORE().refFromURL(photos[i].photoUrl).delete(); } catch (e) {}
        }
        await DB().collection("soirees").doc(id).delete();
        toast("Soirée supprimée."); listScreen();
      } catch (e) { console.error(e); toast("Suppression impossible."); }
    }
    draw();
    if (justCreated) {
      toast("✓ Soirée créée. Invite maintenant les personnes qui n'ont pas Whazup.");
    }
  }

  // ---- arrivée par un lien d'invitation ----
  function readParam() {
    try {
      var q = new URLSearchParams(location.search), id = (q.get("soiree") || "").trim();
      if (!/^[a-z0-9]{10,40}$/.test(id)) return;
      try { localStorage.setItem(PENDING, id); } catch (e) {}
      q.delete("soiree");
      var qs = q.toString();
      history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
    } catch (e) {}
  }
  function pendingId() { try { return localStorage.getItem(PENDING) || ""; } catch (e) { return ""; } }
  function clearPending() { try { localStorage.removeItem(PENDING); } catch (e) {} }

  var handling = false;
  async function handlePending() {
    var id = pendingId(); if (!id || handling) return;
    var cu = AUTH().currentUser; if (!cu) return; // la connexion (même anonyme) arrive juste après
    handling = true;
    try {
      var ref = DB().collection("soirees").doc(id), d = await ref.get();
      if (!d.exists) { clearPending(); toast("Cette soirée n'existe plus."); return; }
      var s = d.data(); s.id = id;
      var u = realUser();
      if (!u) {
        var r = frame("Tu es invité(e) 🎉", closeAll,
          '<div class="so-hero"><b>' + esc(s.name) + '</b><span>' + esc(fmtDate(s.date)) + '</span><span>Invitation de ' + esc(s.ownerName || "ton ami") + '</span></div>' +
          '<div class="so-note" style="font-size:14px">Crée ton compte Whazup (gratuit) ou connecte-toi pour voir et ajouter les photos de la soirée.</div>' +
          '<button class="so-btn" id="so-login">Me connecter ou créer mon compte</button>');
        r.querySelector("#so-login").onclick = function () { closeAll(); openAccount(); };
        return;
      }
      if ((s.members || []).indexOf(u.uid) < 0) {
        if ((s.members || []).length >= MAX_MEMBERS) { clearPending(); toast("Cette soirée est complète."); return; }
        await ref.update({ members: FV().arrayUnion(u.uid) });
        toast("✓ Tu as rejoint la soirée « " + s.name + " »");
      }
      clearPending();
      albumScreen(id);
    } catch (e) { console.error(e); toast("Impossible de rejoindre la soirée pour le moment."); }
    finally { handling = false; }
  }

  // ---- bouton dans le carnet ----
  function inject() {
    var scr = document.getElementById("souvenirs-screen");
    if (!scr || scr.querySelector("#wz-so-entry")) return;
    var tabs = scr.querySelector("#wz-ctabs") || scr.querySelector("#souvenirs-city-tabs");
    if (!tabs) return;
    addCss();
    var b = document.createElement("button"); b.id = "wz-so-entry"; b.type = "button";
    b.innerHTML = "<span>🎉</span><span>Mes soirées partagées</span><span style=\"margin-left:auto\">›</span>";
    b.onclick = listScreen;
    tabs.parentNode.insertBefore(b, tabs);
  }

  var pollN = 0;
  var poll = setInterval(function () {
    pollN++;
    if (pollN > 240) return clearInterval(poll);          // 4 minutes au maximum
    if (pendingId() && realUser() && !handling && !document.getElementById("wz-so")) handlePending();
  }, 1000);
  window.__wzOpenSoirees = listScreen;
  window.__wzSoireesHandlePending = handlePending;
  readParam();
  try { new MutationObserver(inject).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  try { inject(); } catch (e) {}
  try {
    var wait = setInterval(function () {
      try { var onChange = function () { handlePending(); if (openAfterLogin && realUser()) { openAfterLogin = false; listScreen(); } };
        AUTH().onAuthStateChanged(onChange);
        if (AUTH().onIdTokenChanged) AUTH().onIdTokenChanged(onChange); clearInterval(wait); } catch (e) {}
    }, 300);
    setTimeout(function () { clearInterval(wait); }, 20000);
  } catch (e) {}
})();
