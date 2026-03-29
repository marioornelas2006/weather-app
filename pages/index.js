export async function getServerSideProps({ res }) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Route METAR Monitor</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#f7f7f5;--surface:#ffffff;--surface2:#f0f0ee;
  --border:#e0e0dc;--border2:#c8c8c4;
  --text:#1a1a18;--text2:#5a5a56;--text3:#9a9a96;
  --mono:'IBM Plex Mono',monospace;--sans:'IBM Plex Sans',sans-serif;
  --go:#2d6a4f;--go-bg:#f0f7f4;--go-border:#b7d9cb;
  --caution:#7d5a00;--caution-bg:#fdf8ec;--caution-border:#e8d5a0;
  --nogo:#8b2222;--nogo-bg:#fdf0f0;--nogo-border:#e8b8b8;
  --vfr:#2d6a4f;--mvfr:#1a4a8a;--ifr:#7d5a00;--lifr:#8b2222;
}
body{background:var(--bg);color:var(--text);font-family:var(--sans);font-size:14px;line-height:1.5;min-height:100vh;padding:32px 24px 64px;max-width:860px;margin:0 auto;}
h1{font-size:18px;font-weight:500;margin-bottom:2px;}
.subtitle{font-family:var(--mono);font-size:11px;color:var(--text3);margin-bottom:28px;}

/* route config */
.route-box{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px 18px;margin-bottom:20px;}
.route-box label{font-family:var(--mono);font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:10px;}
.route-inputs{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;}
.input-group{display:flex;flex-direction:column;gap:4px;flex:1;min-width:100px;}
.input-group span{font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;}
input[type="text"],input[type="number"]{font-family:var(--mono);font-size:13px;padding:8px 10px;border:1px solid var(--border);border-radius:5px;background:var(--bg);color:var(--text);outline:none;width:100%;height:36px;transition:border-color .15s;}
input:focus,select:focus{border-color:var(--border2);background:var(--surface);}
input::placeholder{color:var(--text3);}
button{font-family:var(--mono);font-size:12px;font-weight:500;padding:0 16px;height:36px;border-radius:5px;cursor:pointer;border:1px solid var(--text);background:var(--text);color:#fff;transition:opacity .15s;white-space:nowrap;align-self:flex-end;}
button:hover{opacity:.78;}
button:disabled{opacity:.3;cursor:not-allowed;}
button.ghost{background:var(--surface);color:var(--text);border-color:var(--border2);}
button.ghost:hover{background:var(--surface2);opacity:1;}

/* status */
.status-row{display:flex;align-items:center;justify-content:space-between;font-family:var(--mono);font-size:11px;color:var(--text3);margin-bottom:6px;flex-wrap:wrap;gap:6px;}
.dot{width:6px;height:6px;border-radius:50%;background:var(--text3);display:inline-block;margin-right:5px;}
.dot.ok{background:var(--go);}
.dot.fetching{background:var(--caution);}
.dot.error{background:var(--nogo);}
.progress-track{height:1px;background:var(--border);margin-bottom:24px;overflow:hidden;}
.progress-fill{height:100%;background:var(--text3);}

/* section */
.section-label{font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;margin-top:24px;display:flex;align-items:center;gap:8px;}
.section-label::after{content:'';flex:1;height:1px;background:var(--border);}

/* map */
#weatherMap{height:300px;border-radius:8px;border:1px solid var(--border);margin-bottom:4px;}
.map-toggle-row{display:flex;gap:14px;flex-wrap:wrap;font-family:var(--mono);font-size:10px;color:var(--text3);margin:8px 0 2px;}
.map-toggle-row label{display:flex;align-items:center;gap:6px;cursor:pointer;}
.map-toggle-row input{accent-color:#1a1a18;}

/* route column */
.route-col{display:flex;flex-direction:column;}

.station-block{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px 16px;}
.st-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;}
.st-id{font-family:var(--mono);font-size:15px;font-weight:500;}
.st-name{font-family:var(--mono);font-size:10px;color:var(--text3);margin-top:1px;}
.st-right{display:flex;flex-direction:column;align-items:flex-end;gap:4px;}
.st-time{font-family:var(--mono);font-size:10px;color:var(--text3);}
.raw-metar{font-family:var(--mono);font-size:11px;background:var(--surface2);border:1px solid var(--border);border-radius:5px;padding:8px 10px;color:var(--text2);word-break:break-all;margin-bottom:10px;line-height:1.5;}
.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:6px;}
.metric{background:var(--surface2);border-radius:5px;padding:8px 10px;}
.metric-label{font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;}
.metric-value{font-family:var(--mono);font-size:12px;font-weight:500;color:var(--text);}

.runway-mini{margin-top:10px;border:1px solid var(--border);border-radius:5px;padding:8px 10px;background:var(--surface2);}
.runway-mini-label{font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px;}
.runway-mini-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(86px,1fr));gap:4px 8px;}
.runway-mini-item{font-family:var(--mono);font-size:10px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}


/* analysis connector between stations */
.analysis-connector{display:flex;gap:0;align-items:stretch;padding:0;margin:0;}
.connector-gutter{width:40px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;}
.connector-line{width:1px;background:var(--border2);flex:1;}
.connector-dot{width:8px;height:8px;border-radius:50%;background:var(--border2);border:2px solid var(--bg);flex-shrink:0;margin:0;}
.analysis-inner{flex:1;padding:8px 0;}

.gng-inline{border-radius:6px;padding:12px 14px;border:1px solid transparent;margin:4px 0;}
.gng-inline.go{background:var(--go-bg);border-color:var(--go-border);}
.gng-inline.caution{background:var(--caution-bg);border-color:var(--caution-border);}
.gng-inline.nogo{background:var(--nogo-bg);border-color:var(--nogo-border);}
.gng-inline.loading{background:var(--surface);border-color:var(--border);}
.gng-verdict{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.04em;margin-bottom:5px;}
.go .gng-verdict{color:var(--go);}
.caution .gng-verdict{color:var(--caution);}
.nogo .gng-verdict{color:var(--nogo);}
.loading .gng-verdict{color:var(--text3);}
.gng-analysis{font-size:13px;color:var(--text2);line-height:1.7;}

/* prog charts */
.prog-box{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px 16px;}
.prog-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;}
.prog-img-label{font-family:var(--mono);font-size:10px;color:var(--text3);margin-bottom:5px;}
.prog-img-wrap img{width:100%;border-radius:5px;border:1px solid var(--border);display:block;}
.prog-analysis{font-size:13px;color:var(--text2);line-height:1.7;}
.prog-loading{font-family:var(--mono);font-size:11px;color:var(--text3);display:flex;align-items:center;gap:8px;padding:4px 0;}

/* off-route table */
.stations-grid{display:flex;flex-direction:column;gap:1px;background:var(--border);border:1px solid var(--border);border-radius:8px;overflow:hidden;}
.station-row{background:var(--surface);padding:10px 14px;display:grid;grid-template-columns:60px 52px 1fr 48px;gap:10px;align-items:start;}
.header-row{background:var(--surface2) !important;padding:7px 14px !important;align-items:center !important;}
.header-row span{font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;}
.st-id-sm{font-family:var(--mono);font-size:13px;font-weight:500;}
.st-tag{font-family:var(--mono);font-size:10px;color:var(--text3);}
.st-details{font-family:var(--mono);font-size:11px;color:var(--text2);line-height:1.5;}
.st-raw-sm{font-family:var(--mono);font-size:10px;color:var(--text3);margin-top:2px;word-break:break-all;}
.st-time-sm{font-family:var(--mono);font-size:10px;color:var(--text3);text-align:right;}

.fr-badge{font-family:var(--mono);font-size:10px;font-weight:500;padding:2px 6px;border-radius:3px;letter-spacing:.03em;display:inline-block;}
.fr-vfr{background:var(--go-bg);color:var(--vfr);border:1px solid var(--go-border);}
.fr-mvfr{background:#eef3fb;color:var(--mvfr);border:1px solid #b8ccee;}
.fr-ifr{background:var(--caution-bg);color:var(--ifr);border:1px solid var(--caution-border);}
.fr-lifr{background:var(--nogo-bg);color:var(--lifr);border:1px solid var(--nogo-border);}
.fr-err{background:var(--surface2);color:var(--text3);border:1px solid var(--border);}

.empty-state{text-align:center;padding:48px 24px;font-family:var(--mono);font-size:12px;color:var(--text3);}
.bg-nav{display:flex;gap:8px;margin-bottom:14px;}
.bg-panel{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px 16px;margin-top:12px;}
.bg-pre{font-family:var(--mono);font-size:11px;white-space:pre-wrap;word-break:break-word;color:var(--text2);background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:10px;margin-top:8px;line-height:1.55;}

@media(max-width:560px){.prog-grid{grid-template-columns:1fr;}.station-row{grid-template-columns:52px 44px 1fr;}.st-time-sm{display:none;}}
</style>
</head>
<body>

<h1>Route METAR Monitor</h1>
<div class="subtitle">Live weather · CheckWX + Gemini AI analysis</div>

<div class="route-box">
  <label>Route configuration</label>
  <div class="route-inputs">
    <div class="input-group" style="max-width:300px;">
      <span>Airports (space or comma separated)</span>
      <input type="text" id="routeInput" placeholder="KLAF KIKK KMDW" value="KLAF KIKK">
    </div>
    <div class="input-group" style="max-width:240px;">
      <span>Official briefing PDF (optional)</span>
      <input type="file" id="briefingPdfInput" accept="application/pdf" style="padding:6px 8px;height:36px;">
    </div>
    <div class="input-group" style="max-width:140px;">
      <span>Off-route radius (NM)</span>
      <input type="number" id="radiusInput" value="30" min="10" max="100" step="5">
    </div>
    <div class="input-group" style="max-width:160px;">
      <span>Planned cruise altitude (ft MSL)</span>
      <input type="number" id="altitudeInput" value="8000" min="0" max="45000" step="500">
    </div>
    <div class="input-group" style="max-width:120px;">
      <span>Flight rules</span>
      <select id="flightRulesInput" style="font-family:var(--mono);font-size:13px;padding:8px 10px;border:1px solid var(--border);border-radius:5px;background:var(--bg);color:var(--text);outline:none;width:100%;height:36px;transition:border-color .15s;">
        <option value="VFR" selected>VFR</option>
        <option value="IFR">IFR</option>
      </select>
    </div>
    <button id="loadBtn" onclick="loadRoute()">Load route</button>
    <button class="ghost" id="refreshBtn" onclick="doRefresh()" disabled>↺ Refresh</button>
    <button class="ghost" id="toggleBtn" onclick="toggleMonitor()" disabled>Pause</button>
  </div>
</div>

<div class="status-row">
  <span><span class="dot" id="statusDot"></span><span id="statusText">Enter a route above to begin.</span></span>
  <span id="countdownSpan" style="display:none;font-family:var(--mono);font-size:11px;color:var(--text3);">Refresh in <b id="countdown">120</b>s</span>
</div>
<div class="progress-track"><div class="progress-fill" id="pfill" style="width:0%;transition:none;"></div></div>

<div class="bg-nav">
  <button class="ghost" id="showMainBtn" onclick="showPage('main')" disabled>Main</button>
  <button class="ghost" id="showBackgroundBtn" onclick="showPage('background')" disabled>Background</button>
  <button class="ghost" id="retryAiBtn" onclick="retryOverallDecision()" disabled>Retry AI</button>
</div>

<div id="mainContent" style="display:none;">
  <div class="section-label">Weather map</div>

<div id="weatherMap"></div>
  <div class="map-toggle-row">
    <label><input type="checkbox" id="toggleGairmet" checked onchange="renderAdvisoryLayers()"> G-AIRMET</label>
    <label><input type="checkbox" id="toggleSigmet" checked onchange="renderAdvisoryLayers()"> SIGMET</label>
    <label><input type="checkbox" id="toggleConvSigmet" checked onchange="renderAdvisoryLayers()"> Convective SIGMET</label>
    <label><input type="checkbox" id="toggleCwa" checked onchange="renderAdvisoryLayers()"> CWA</label>
      </div>
  <div style="display:flex;gap:14px;flex-wrap:wrap;margin:0 0 10px;font-family:var(--mono);font-size:10px;color:var(--text2);align-items:center;">
    <span><span style="display:inline-block;width:12px;height:12px;background:#7fb3ff;border:2px dashed #2b6cb0;vertical-align:middle;margin-right:6px;"></span>Sierra</span>
    <span><span style="display:inline-block;width:12px;height:12px;background:#ffd166;border:2px solid #cc8a00;vertical-align:middle;margin-right:6px;"></span>Tango</span>
    <span><span style="display:inline-block;width:12px;height:12px;background:#d6bcfa;border:2px solid #7e57c2;vertical-align:middle;margin-right:6px;"></span>Zulu</span>
    <span><span style="display:inline-block;width:12px;height:12px;background:#ffb000;border:2px solid #cc8400;vertical-align:middle;margin-right:6px;"></span>SIGMET</span>
    <span><span style="display:inline-block;width:12px;height:12px;background:#ff3b30;border:2px solid #c81e1e;vertical-align:middle;margin-right:6px;"></span>Convective SIGMET</span>
    <span><span style="display:inline-block;width:12px;height:12px;background:#ff66cc;border:2px solid #b83280;vertical-align:middle;margin-right:6px;"></span>CWA</span>
      </div>

  <div class="section-label">Route</div>
  <div class="route-col" id="routeCol"></div>

  <div class="section-label">Prog chart analysis</div>
  <div class="prog-box">
    <div class="prog-grid" id="progGrid"></div>
    <div class="prog-loading" id="progLoading"><span class="dot fetching"></span>Loading prog charts...</div>
    <div class="prog-analysis" id="progAnalysis" style="display:none;"></div>
  </div>

  <div class="section-label" id="offRouteLabel">Off-route stations</div>
  <div id="offRouteCards"></div>
</div>

<div id="backgroundContent" style="display:none;">
  <div class="section-label">Background</div>
  <div class="bg-panel">
    <div style="font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;">TAF and supporting forecast data</div>
    <div style="font-size:12px;color:var(--text2);margin-top:6px;">This page shows forecast/supporting weather data used by the briefing engine. It is not displayed on the main briefing page.</div>
    <div id="tafSummaryBox" class="bg-pre" style="margin-top:10px;">No forecast data loaded yet.</div>
  </div>
  <div class="bg-panel">
    <div style="font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;">Raw prog-chart AI output</div>
    <div style="font-size:12px;color:var(--text2);margin-top:6px;">This is the full prog-chart analysis text used by the decision engine.</div>
    <div id="progRawBox" class="bg-pre" style="margin-top:10px;">No prog-chart analysis loaded yet.</div>
  </div>
</div>

<div id="emptyState" class="empty-state">Enter a route and press Load route to begin.</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
let API_KEY='';

async function loadConfig(){
  try{
    const r=await fetch('/api/config');
    const j=await r.json();
    if(j.key){API_KEY=j.key;return true;}
    alert('CheckWX API key not configured. Add CHECKWX_API_KEY in Netlify or AWS environment variables.');
    return false;
  }catch(e){
    alert('Config error: '+e.message);
    return false;
  }
}

const INTERVAL=120;

let countdown=INTERVAL;
let pausedAt=null;
let progTimer=null;
let isRunning=false;
let fetching=false;
let routeAirports=[];
let corridorData={};
let offRouteData={};
let offRouteRadius=30;
let leafletMap=null;
let mapMarkers=[];
let mapPolyline=null;
let radarLayer=null;
let surfaceAnalysisLayer=null;
let cruiseAltitudeFt=8000;
let advisoryLayers={gairmet:null,sigmet:null,convective:null,cwa:null};
let advisoryGeo={gairmet:[],sigmet:[],convective:[],cwa:[]};
let airportRunwayData={};
let uploadedBriefingText='';
let uploadedBriefingName='';
let plannedFlightRules='VFR';
let tafData={};
let currentPage='main';
let overallEssayText='';

// ── geometry ──────────────────────────────────────────────────────────────────
function toRad(d){return d*Math.PI/180;}
function distNm(lat1,lon1,lat2,lon2){
  const R=3440.065,dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function ptToSegDist(px,py,ax,ay,bx,by){
  const dx=bx-ax,dy=by-ay,lenSq=dx*dx+dy*dy;
  if(lenSq===0) return distNm(px,py,ax,ay);
  const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/lenSq));
  return distNm(px,py,ax+t*dx,ay+t*dy);
}
function minDistToRoute(lat,lon,route){
  let min=Infinity;
  for(let i=0;i<route.length-1;i++) min=Math.min(min,ptToSegDist(lat,lon,route[i].lat,route[i].lon,route[i+1].lat,route[i+1].lon));
  return min;
}


function getGeometryPoints(geom){
  const pts=[];
  function walk(coords){
    if(!Array.isArray(coords)) return;
    if(typeof coords[0]==='number' && typeof coords[1]==='number'){
      pts.push({lon:coords[0],lat:coords[1]});
      return;
    }
    coords.forEach(walk);
  }
  if(geom?.coordinates) walk(geom.coordinates);
  return pts;
}
function geometryNearRoute(geom, route, bufferNm){
  const pts=getGeometryPoints(geom);
  if(!pts.length || !route.length) return false;
  let min=Infinity,minLat=Infinity,maxLat=-Infinity,minLon=Infinity,maxLon=-Infinity;
  pts.forEach(p=>{
    min=Math.min(min, minDistToRoute(p.lat,p.lon,route));
    minLat=Math.min(minLat,p.lat); maxLat=Math.max(maxLat,p.lat);
    minLon=Math.min(minLon,p.lon); maxLon=Math.max(maxLon,p.lon);
  });
  if(min<=bufferNm) return true;
  const padDegLat=bufferNm/60;
  return route.some(p=>p.lat>=minLat-padDegLat&&p.lat<=maxLat+padDegLat&&p.lon>=minLon-padDegLat&&p.lon<=maxLon+padDegLat);
}
function advisoryKind(props){
  const raw=\`\${props?.hazard||''} \${props?.type||''} \${props?.severity||''} \${props?.rawText||props?.raw_text||''} \${props?.reportType||''} \${props?.series||''} \${props?.hazardType||''}\`.toUpperCase();
  if(/CWA|CENTER WEATHER/.test(raw)) return 'cwa';
  if(/CONVECTIVE/.test(raw)) return 'convective';
  if(/SIGMET/.test(raw)) return 'sigmet';
  return 'gairmet';
}
function advisoryLabel(props){
  const pieces=[
    props?.hazard || props?.phenomenon || props?.type || props?.airmetType || props?.reportType || 'Advisory',
    props?.severity || '',
    props?.validTimeFrom || props?.validFrom || '',
    props?.validTimeTo || props?.validTo || ''
  ].filter(Boolean);
  return pieces.join(' · ');
}

function advisoryDetailsFromProps(type, props){
  const p=props||{};
  const title = p.label || p.airSigmetId || p.sequence || p.id || p.rawAirSigmet || p.hazard || p.phenomenon || p.type || (type==='convective'?'Convective SIGMET':type==='sigmet'?'SIGMET':'G-AIRMET');
  const hazard = p.hazard || p.phenomenon || p.type || p.airmetType || p.reportType || '';
  const severity = p.severity || p.intensity || p.level || p.qualifier || p.airsigmetSeverity || '';
  const validFrom = p.validTimeFrom || p.validFrom || p.valid_from || p.start || p.issueTime || p.issued || p.issued_at || '';
  const validTo = p.validTimeTo || p.validTo || p.valid_to || p.end || p.expireTime || p.expires || p.expires_at || '';
  const top = p.top || p.topFt || p.top_ft_msl || p.altitudeTop || p.flightLevelTop || p.topText || p.tops || '';
  const base = p.base || p.baseFt || p.base_ft_msl || p.altitudeBase || p.flightLevelBase || p.baseText || '';
  const raw = p.rawText || p.raw_text || p.text || '';
  return {title,hazard,severity,validFrom,validTo,top,base,raw};
}
function advisoryPopupHtml(type, props){
  const d=advisoryDetailsFromProps(type, props);
  const label = type==='convective' ? 'Convective SIGMET' : (type==='sigmet' ? 'SIGMET' : (type==='cwa' ? 'CWA' : \`G-AIRMET \${gAirmetSubtype(props).toUpperCase()}\`));
  const fmt=(v)=>String(v||'—');
  return \`<div style="font-family:monospace;font-size:11px;max-width:360px;line-height:1.45">
    <div style="font-weight:700;margin-bottom:6px">\${label}</div>
    <div><b>ID:</b> \${fmt(d.title)}</div>
    <div><b>Hazard:</b> \${fmt(d.hazard)}</div>
    <div><b>Severity:</b> \${fmt(d.severity)}</div>
    <div><b>Valid from:</b> \${fmt(d.validFrom)}</div>
    <div><b>Valid to:</b> \${fmt(d.validTo)}</div>
    <div><b>Base:</b> \${fmt(d.base)}</div>
    <div><b>Top:</b> \${fmt(d.top)}</div>
    <div style="margin-top:6px"><b>Text:</b> \${fmt(d.raw)}</div>
  </div>\`;
}
function pointInRing(latlng, ring){
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const xi=ring[i][0], yi=ring[i][1];
    const xj=ring[j][0], yj=ring[j][1];
    const intersect=((yi>latlng.lat)!=(yj>latlng.lat)) &&
      (latlng.lng < (xj-xi)*(latlng.lat-yi)/((yj-yi)||1e-12)+xi);
    if(intersect) inside=!inside;
  }
  return inside;
}
function latLngNearLine(latlng, coords, tolNm=12){
  if(!coords || coords.length<2) return false;
  for(let i=0;i<coords.length-1;i++){
    const a=coords[i], b=coords[i+1];
    if(ptToSegDist(latlng.lat, latlng.lng, a[1], a[0], b[1], b[0]) <= tolNm) return true;
  }
  return false;
}
function advisoryContainsLatLng(feature, latlng){
  const g=feature?.geometry;
  if(!g) return false;
  if(g.type==='Point'){
    return distNm(latlng.lat, latlng.lng, g.coordinates[1], g.coordinates[0]) <= 15;
  }
  if(g.type==='LineString'){
    return latLngNearLine(latlng, g.coordinates, 12);
  }
  if(g.type==='MultiLineString'){
    return (g.coordinates||[]).some(line=>latLngNearLine(latlng, line, 12));
  }
  if(g.type==='Polygon'){
    const rings=g.coordinates||[];
    if(!rings.length) return false;
    if(!pointInRing(latlng, rings[0])) return false;
    for(let i=1;i<rings.length;i++) if(pointInRing(latlng, rings[i])) return false;
    return true;
  }
  if(g.type==='MultiPolygon'){
    return (g.coordinates||[]).some(poly=>{
      const rings=poly||[];
      if(!rings.length) return false;
      if(!pointInRing(latlng, rings[0])) return false;
      for(let i=1;i<rings.length;i++) if(pointInRing(latlng, rings[i])) return false;
      return true;
    });
  }
  return false;
}
function shownAdvisoryTypes(){
  return {
    gairmet: !!document.getElementById('toggleGairmet')?.checked,
    sigmet: !!document.getElementById('toggleSigmet')?.checked,
    convective: !!document.getElementById('toggleConvSigmet')?.checked,
    cwa: !!document.getElementById('toggleCwa')?.checked
  };
}
function showCombinedAdvisoryPopup(latlng){
  if(!leafletMap) return;
  const shown=shownAdvisoryTypes();
  const matches=[];
  ['convective','sigmet','cwa','gairmet'].forEach(type=>{
    if(!shown[type]) return;
    (advisoryGeo[type]||[]).forEach(f=>{
      if(advisoryContainsLatLng(f, latlng)) matches.push({type, props:f.properties||{}});
    });
  });
  if(!matches.length) return;
  const html = matches.map((m,idx)=>\`<div style="\${idx?\`border-top:1px solid #ddd;padding-top:8px;margin-top:8px;\`:''}">\${advisoryPopupHtml(m.type, m.props)}</div>\`).join('');
  L.popup({maxWidth:390}).setLatLng(latlng).setContent(html).openOn(leafletMap);
}
function getRouteRelevantAdvisories(route, bufferNm){
  const out={gairmet:[],sigmet:[],convective:[],cwa:[]};
  ['gairmet','sigmet','convective','cwa'].forEach(type=>{
    (advisoryGeo[type]||[]).forEach(f=>{
      if(geometryNearRoute(f.geometry, route, bufferNm)) out[type].push(f);
    });
  });
  return out;
}

// ── weather helpers ───────────────────────────────────────────────────────────
function flightRules(d){
  if(!d) return 'error';
  const vis=d.visibility?.miles_float??10,ceil=d.ceiling?.feet??9999;
  if(vis<1||ceil<500) return 'lifr';
  if(vis<3||ceil<1000) return 'ifr';
  if(vis<5||ceil<3000) return 'mvfr';
  return 'vfr';
}
function frBadge(fr){
  const m={vfr:['VFR','fr-vfr'],mvfr:['MVFR','fr-mvfr'],ifr:['IFR','fr-ifr'],lifr:['LIFR','fr-lifr'],error:['—','fr-err']};
  const [l,c]=m[fr]||m.error;
  return \`<span class="fr-badge \${c}">\${l}</span>\`;
}
function windStr(d){
  if(!d?.wind) return '—';
  const w=d.wind;
  let s=w.degrees!=null?\`\${w.degrees}°/\${w.speed_kts}kt\`:\`VRB/\${w.speed_kts}kt\`;
  if(w.gust_kts) s+=\` G\${w.gust_kts}\`;
  return s;
}
function skyStr(d){
  if(!d?.clouds?.length) return 'CLR';
  return d.clouds.map(c=>c.base_feet_agl!=null?\`\${c.code}\${String(Math.round(c.base_feet_agl/100)).padStart(3,'0')}\`:c.code).join(' ');
}
function stationDetailStr(d){
  if(!d) return 'No data';
  const vis=d.visibility?.miles?\`\${d.visibility.miles}SM\`:'—';
  return \`\${windStr(d)} · \${vis} · \${skyStr(d)}\${d.temperature?.celsius!=null?' · '+d.temperature.celsius+'°C':''}\`;
}
function frColor(fr){return{vfr:'#2d6a4f',mvfr:'#1a4a8a',ifr:'#7d5a00',lifr:'#8b2222',error:'#9a9a96'}[fr]||'#9a9a96';}

function finishAtSentence(text, maxLen=5000){
  if(!text) return text;
  let t=String(text).replace(/\\s+/g,' ').trim();
  if(t.length<=maxLen) return t;
  t=t.slice(0,maxLen);
  const last=Math.max(t.lastIndexOf('. '), t.lastIndexOf('! '), t.lastIndexOf('? '));
  return last>120 ? t.slice(0,last+1) : t;
}


function parseAltitudeToken(val){
  if(val==null) return null;
  const s=String(val).trim().toUpperCase();
  if(!s || s==='—' || s==='UNL' || s==='UNLIMITED' || s==='UNK') return null;
  if(s==='SFC' || s==='SURFACE' || s==='GROUND') return 0;
  let m=s.match(/FL\\s*0*(\\d{2,3})/);
  if(m) return parseInt(m[1],10)*100;
  m=s.match(/\\b(\\d{2,3})\\b/);
  if(m && !s.includes('FT') && parseInt(m[1],10) <= 450) return parseInt(m[1],10)*100;
  m=s.match(/(\\d{3,5})/);
  if(m) return parseInt(m[1],10);
  return null;
}
function advisoryBand(props){
  const p=props||{};
  const base=parseAltitudeToken(p.base ?? p.baseFt ?? p.base_ft_msl ?? p.altitudeBase ?? p.flightLevelBase ?? p.baseText);
  const top=parseAltitudeToken(p.top ?? p.topFt ?? p.top_ft_msl ?? p.altitudeTop ?? p.flightLevelTop ?? p.topText ?? p.tops);
  return {base, top};
}
function gAirmetSubtype(props){
  const raw=\`\${props?.hazard||''} \${props?.type||''} \${props?.airmetType||''} \${props?.rawText||props?.raw_text||''}\`.toUpperCase();
  if(/SIERRA|IFR|MOUNTAIN/.test(raw)) return 'sierra';
  if(/TANGO|TURB|LLWS|WIND/.test(raw)) return 'tango';
  if(/ZULU|ICE|ICING|FREEZ/.test(raw)) return 'zulu';
  return 'other';
}
function advisoryAltitudeRelevant(type, props, altitudeFt){
  const raw=\`\${props?.hazard||''} \${props?.type||''} \${props?.airmetType||''} \${props?.rawText||props?.raw_text||''}\`.toUpperCase();
  if(type==='convective' || /CONVECTIVE|TS|THUNDER|TORNADO|HAIL|SEVERE/.test(raw)) return true;
  if(type==='cwa' || type==='sigmet'){
    const band=advisoryBand(props);
    if(band.base==null && band.top==null) return true;
    const lo=band.base ?? 0;
    const hi=band.top ?? 60000;
    return altitudeFt >= lo-2000 && altitudeFt <= hi+2000;
  }
  if(type==='gairmet'){
    const subtype=gAirmetSubtype(props);
    if(subtype==='sierra') return true;
    const band=advisoryBand(props);
    if(band.base==null && band.top==null) return subtype!=='zulu' ? true : altitudeFt <= 18000;
    const lo=band.base ?? 0;
    const hi=band.top ?? 60000;
    return altitudeFt >= lo-2000 && altitudeFt <= hi+2000;
  }
  return true;
}
function advisoryCritical(type, props){
  const raw=\`\${props?.hazard||''} \${props?.type||''} \${props?.airmetType||''} \${props?.rawText||props?.raw_text||''}\`.toUpperCase();
  return type==='convective' || /SEV|SEVERE|TS|THUNDER|TORNADO|HAIL|VOLCANIC|ASH/.test(raw);
}
function advisoryWeight(type, props, altitudeFt){
  const raw=\`\${props?.hazard||''} \${props?.type||''} \${props?.airmetType||''} \${props?.rawText||props?.raw_text||''}\`.toUpperCase();
  const relevant=advisoryAltitudeRelevant(type, props, altitudeFt);
  if(type==='convective') return 4;
  if(type==='sigmet') return relevant ? 3 : 1;
  if(type==='cwa') return relevant ? 2 : 1;
  if(type==='gairmet'){
    const subtype=gAirmetSubtype(props);
    if(subtype==='sierra') return 1.5;
    if(subtype==='tango') return relevant ? 1.5 : 0.5;
    if(subtype==='zulu') return relevant ? 1.5 : 0.25;
    return relevant ? 1 : 0.25;
  }
  return 1;
}
function styleForAdvisoryFeature(type, props){
  if(type==='convective') return {color:'#c81e1e', fillColor:'#ff3b30', weight:3, fillOpacity:0.18, dashArray:null};
  if(type==='sigmet') return {color:'#cc8400', fillColor:'#ffb000', weight:2.5, fillOpacity:0.12, dashArray:null};
  if(type==='cwa') return {color:'#b83280', fillColor:'#ff66cc', weight:2.5, fillOpacity:0.12, dashArray:'3 3'};
  const subtype=gAirmetSubtype(props);
  if(subtype==='sierra') return {color:'#2b6cb0', fillColor:'#7fb3ff', weight:2, fillOpacity:0.1, dashArray:'6 4'};
  if(subtype==='tango') return {color:'#cc8a00', fillColor:'#ffd166', weight:2, fillOpacity:0.1, dashArray:'6 4'};
  if(subtype==='zulu') return {color:'#7e57c2', fillColor:'#d6bcfa', weight:2, fillOpacity:0.1, dashArray:'6 4'};
  return {color:'#0077cc', fillColor:'#00a6ff', weight:2, fillOpacity:0.1, dashArray:'6 4'};
}
function riskMatrixResult(){
  const routeWithCoords=routeAirports.filter(a=>a.lat!=null&&a.lon!=null);
  const relevant=getRouteRelevantAdvisories(routeWithCoords, Math.max(offRouteRadius+60, 90));
  let score=0;
  const reasons=[];

  function addStationRisk(id,d){
    if(!d) return;
    const fr=flightRules(d);
    if(fr==='mvfr'){score+=1; reasons.push(\`\${id} MVFR\`);}
    if(fr==='ifr'){score+=2; reasons.push(\`\${id} IFR\`);}
    if(fr==='lifr'){score+=3; reasons.push(\`\${id} LIFR\`);}
    const wx=\`\${d?.wx_string||''}\`.toUpperCase();
    const temp=d?.temperature?.celsius;
    const dew=d?.dewpoint?.celsius;
    if(/LLWS/.test(wx) || /LLWS/.test(d?.raw_text||'')){score+=4; reasons.push(\`\${id} LLWS\`);}
    if(/TS|VCTS/.test(wx)){score+=4; reasons.push(\`\${id} thunderstorms\`);}
    if((/FZ|SN|PL|GR|GS|IC/.test(wx) || (temp!=null && temp<=3 && skyStr(d)!=='CLR' && dew!=null && Math.abs(temp-dew)<=3))){
      score+=3; reasons.push(\`\${id} possible icing\`);
    }
    const rwy=bestRunwayWindAssessment(id,d);
    if(rwy?.crosswind!=null){
      if(rwy.crosswind>=15){score+=3; reasons.push(\`\${id} crosswind ≥15 kt\`);}
      else if(rwy.crosswind>=10){score+=1.5; reasons.push(\`\${id} crosswind ≥10 kt\`);}
      if(rwy.headwind!=null && rwy.headwind<0 && Math.abs(rwy.headwind)>=10){score+=1; reasons.push(\`\${id} notable tailwind on best runway\`);}
    }
  }

  function addTafRisk(id, taf){
    const raw=\`\${taf?.raw_text||''}\`.toUpperCase();
    if(!raw) return;
    if(/LLWS/.test(raw)){score+=4; reasons.push(\`\${id} TAF LLWS\`);}
    if(/ TS |VCTS|CB/.test(\` \${raw} \`)){score+=4; reasons.push(\`\${id} TAF thunderstorms\`);}
    if(/FZRA|FZDZ|ICING|PL|SN/.test(raw)){score+=3; reasons.push(\`\${id} TAF icing / frozen precip\`);}
    if(plannedFlightRules==='VFR'){
      if(/ 0\\/0| OVC00| BKN00| VV00| 1SM| 2SM| 3SM/.test(raw)){score+=2; reasons.push(\`\${id} TAF poor VFR\`);}
    }else{
      if(/ 1\\/2SM| 1SM| VV00| OVC00/.test(raw)){score+=1.5; reasons.push(\`\${id} TAF very low IFR\`);}
    }
  }

  routeAirports.forEach(a=>addStationRisk(a.id,corridorData[a.id]));
  Object.entries(offRouteData).slice(0,12).forEach(([id,d])=>addStationRisk(id,d));

  Object.entries(tafData||{}).forEach(([id,taf])=>addTafRisk(id, taf));

  const convectiveClose=(advisoryGeo.convective||[]).some(f=>geometryNearRoute(f.geometry, routeWithCoords, 30));
  if(convectiveClose){score+=6; reasons.push('Convective SIGMET within 30 NM of route');}

  ['sigmet','gairmet','cwa'].forEach(type=>{
    (relevant[type]||[]).forEach(f=>{
      const p=f.properties||{};
      const raw=\`\${p.hazard||''} \${p.type||''} \${p.airmetType||''} \${p.rawText||p.raw_text||''}\`.toUpperCase();
      const relevantAlt=advisoryAltitudeRelevant(type,p,cruiseAltitudeFt);
      if(/LLWS/.test(raw)){score+=4; reasons.push('LLWS advisory on route'); return;}
      if(/ICE|ICING|FZRA|FZDZ|FREEZ/.test(raw) && relevantAlt){score+=4; reasons.push('route-relevant icing advisory'); return;}
      if(advisoryCritical(type,p)){score+=3; reasons.push(\`critical \${type} advisory\`); return;}
      score+=advisoryWeight(type,p,cruiseAltitudeFt);
      if(type==='cwa') reasons.push('route-relevant CWA');
      if(type==='sigmet') reasons.push('route-relevant SIGMET');
      if(type==='gairmet') reasons.push(\`route-relevant G-AIRMET \${gAirmetSubtype(p)}\`);
    });
  });

  const prog=(document.getElementById('progAnalysis')?.textContent||'').toLowerCase();
  if(/no-go|convective|thunder|icing|llws|severe|embedded/.test(prog)){
    score+=3;
    reasons.push('prog-chart analysis indicates meaningful hazards');
  } else if(/caution|worsen|deteriorat|ifr|imc|turbulence/.test(prog)){
    score+=1.5;
    reasons.push('prog-chart analysis indicates caution');
  }

  if(plannedFlightRules==='VFR'){
    routeAirports.forEach(a=>{
      const d=corridorData[a.id];
      const fr=flightRules(d);
      if(fr==='mvfr'){score+=1.5; reasons.push(\`\${a.id} below basic VFR comfort\`);}
      if(fr==='ifr'){score+=3; reasons.push(\`\${a.id} IFR not suitable for VFR\`);}
      if(fr==='lifr'){score+=4; reasons.push(\`\${a.id} LIFR not suitable for VFR\`);}
    });
  }else if(plannedFlightRules==='IFR'){
    routeAirports.forEach(a=>{
      const d=corridorData[a.id];
      const fr=flightRules(d);
      if(fr==='ifr'){score+=1; reasons.push(\`\${a.id} IFR conditions\`);}
      if(fr==='lifr'){score+=2; reasons.push(\`\${a.id} very low IFR conditions\`);}
    });
  }

  let category='LOW';
  let verdict='GO';
  if(score>=8){category='HIGH'; verdict='NO-GO';}
  else if(score>=4){category='MODERATE'; verdict='CAUTION';}
  return {score:Math.round(score*10)/10, category, verdict, reasons:[...new Set(reasons)].slice(0,12)};
}
function renderRiskMatrix(){
  const old=document.getElementById('riskMatrixBox');
  if(old) old.remove();
  const r=riskMatrixResult();
  const cls=r.verdict==='NO-GO'?'nogo':(r.verdict==='CAUTION'?'caution':'go');
  const box=document.createElement('div');
  box.id='riskMatrixBox';
  box.className=\`gng-inline \${cls}\`;
  box.style.marginBottom='12px';
  box.innerHTML=\`<div class="gng-verdict">RISK MATRIX · \${r.category} · score \${r.score} · \${r.verdict}</div><div class="gng-analysis">Planned altitude: \${cruiseAltitudeFt.toLocaleString()} ft MSL · \${plannedFlightRules}. Primary drivers: \${r.reasons.join(', ') || 'no major risk drivers flagged'}.</div>\`;
  document.getElementById('routeCol').prepend(box);
}
function syncSurfaceAnalysisLayer(){ return; }



async function fetchRunwaysForAirports(ids){
  try{
    const q=encodeURIComponent(ids.join(','));
    const r=await fetch(\`/api/runways?ids=\${q}\`);
    if(!r.ok) return {};
    return await r.json();
  }catch(e){
    console.error('Runway fetch error:', e);
    return {};
  }
}
function headingFromRunwayIdent(ident){
  if(!ident) return null;
  const m=String(ident).match(/(\\d{1,2})([LRC]?)/);
  if(!m) return null;
  const base=parseInt(m[1],10)%36;
  let hdg=base*10;
  if(hdg===0) hdg=360;
  if(m[2]==='L') hdg-=1;
  if(m[2]==='R') hdg+=1;
  return hdg;
}
function normalizeAngleDiff(a,b){
  let d=Math.abs((a-b)%360);
  if(d>180) d=360-d;
  return d;
}
function bestRunwayWindAssessment(airportId, d){
  const windDir=d?.wind?.degrees;
  const windKts=d?.wind?.speed_kts ?? 0;
  const gustKts=d?.wind?.gust_kts ?? null;
  const rwys=(airportRunwayData[airportId]?.runways)||[];
  if(windDir==null || !rwys.length){
    return {airportId, bestRunway:null, crosswind:null, headwind:null, gustCrosswind:null, note: !rwys.length ? 'runway data unavailable' : 'wind direction variable or unavailable'};
  }
  let best=null;
  rwys.forEach(r=>{
    const hdg=r.heading ?? headingFromRunwayIdent(r.ident);
    if(hdg==null) return;
    const diff=normalizeAngleDiff(windDir, hdg);
    const rad=diff*Math.PI/180;
    const cross=Math.abs(Math.sin(rad)*windKts);
    const head=Math.cos(rad)*windKts;
    const gustCross=gustKts!=null ? Math.abs(Math.sin(rad)*gustKts) : null;
    const candidate={airportId,bestRunway:r.ident || \`\${Math.round(hdg/10)}\`, heading:hdg, diff, crosswind:cross, headwind:head, gustCrosswind:gustCross};
    if(!best || candidate.crosswind<best.crosswind) best=candidate;
  });
  return best || {airportId, bestRunway:null, crosswind:null, headwind:null, gustCrosswind:null, note:'no usable runway heading'};
}
function runwayAssessmentSummary(){
  return routeAirports.map(a=>{
    const wx=corridorData[a.id];
    const r=bestRunwayWindAssessment(a.id, wx);
    if(!r || r.crosswind==null){
      return \`\${a.id}: runway crosswind assessment unavailable (\${r?.note || 'missing data'})\`;
    }
    const gustTxt=r.gustCrosswind!=null ? \`, gust crosswind about \${Math.round(r.gustCrosswind)} kt\` : '';
    const headType=r.headwind!=null && r.headwind < 0 ? 'tailwind' : 'headwind';
    const headVal=r.headwind!=null ? Math.round(Math.abs(r.headwind)) : 'unknown';
    return \`\${a.id}: best aligned runway \${r.bestRunway}, crosswind about \${Math.round(r.crosswind)} kt\${gustTxt}, \${headType} about \${headVal} kt\`;
  }).join('\\n');
}


function runwayComponentsForAirport(airportId, d){
  const windDir=d?.wind?.degrees;
  const windKts=d?.wind?.speed_kts ?? 0;
  const gustKts=d?.wind?.gust_kts ?? null;
  const rwys=(airportRunwayData[airportId]?.runways)||[];
  if(windDir==null || !rwys.length) return [];
  const out=[];
  rwys.forEach(r=>{
    const hdg=r.heading ?? headingFromRunwayIdent(r.ident);
    if(hdg==null) return;
    const diff=normalizeAngleDiff(windDir, hdg);
    const rad=diff*Math.PI/180;
    const cross=Math.abs(Math.sin(rad)*windKts);
    const head=Math.cos(rad)*windKts;
    const gustCross=gustKts!=null ? Math.abs(Math.sin(rad)*gustKts) : null;
    out.push({
      ident:r.ident || \`\${Math.round(hdg/10)}\`,
      cross:Math.round(cross),
      gustCross:gustCross!=null ? Math.round(gustCross) : null,
      head:Math.round(Math.abs(head)),
      headType: head < 0 ? 'TW' : 'HW'
    });
  });
  return out.sort((a,b)=>a.cross-b.cross).slice(0,8);
}
function runwayMiniHtml(airportId, d){
  const items=runwayComponentsForAirport(airportId,d);
  if(!items.length){
    return \`<div class="runway-mini"><div class="runway-mini-label">Runway wind components</div><div class="runway-mini-item">Unavailable</div></div>\`;
  }
  return \`<div class="runway-mini"><div class="runway-mini-label">Runway wind components</div><div class="runway-mini-grid">\${
    items.map(r=>\`<div class="runway-mini-item"><b>\${r.ident}</b> · XW \${r.cross}\${r.gustCross!=null?\` G\${r.gustCross}\`:''} · \${r.headType} \${r.head}</div>\`).join('')
  }</div></div>\`;
}
async function extractBriefingPdfText(file){
  const fd=new FormData();
  fd.append('file', file);
  const r=await fetch('/api/pdfextract', {method:'POST', body:fd});
  if(!r.ok) throw new Error(\`PDF extract failed (\${r.status})\`);
  const j=await r.json();
  return j.text || '';
}
async function loadOptionalBriefingPdf(){
  const input=document.getElementById('briefingPdfInput');
  const file=input?.files?.[0];
  uploadedBriefingText='';
  uploadedBriefingName='';
  if(!file) return;
  setStatus('fetching', \`Reading briefing PDF: \${file.name} ...\`);
  try{
    const txt=await extractBriefingPdfText(file);
    uploadedBriefingText=String(txt||'').replace(/\\s+/g,' ').trim().slice(0,18000);
    uploadedBriefingName=file.name;
    setStatus('fetching', \`Loaded briefing PDF: \${file.name}\`);
  }catch(e){
    console.error('Briefing PDF error:', e);
    uploadedBriefingText='';
    uploadedBriefingName='';
    setStatus('error', \`Briefing PDF unavailable: \${e.message}\`);
  }
}

// ── map ───────────────────────────────────────────────────────────────────────

function initMap(){
  if(leafletMap) return;
  leafletMap=L.map('weatherMap').setView([40.5,-87.2],7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'© OpenStreetMap',maxZoom:10
  }).addTo(leafletMap);
  radarLayer=L.tileLayer('https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png',{
    opacity:0.5,maxZoom:10,attribution:'© Iowa State Mesonet'
  }).addTo(leafletMap);
  advisoryLayers.gairmet=L.layerGroup().addTo(leafletMap);
  advisoryLayers.sigmet=L.layerGroup().addTo(leafletMap);
  advisoryLayers.convective=L.layerGroup().addTo(leafletMap);
  advisoryLayers.cwa=L.layerGroup().addTo(leafletMap);
    leafletMap.on('click', e=>showCombinedAdvisoryPopup(e.latlng));
}



function renderAdvisoryLayers(){
  if(!leafletMap) return;
  Object.values(advisoryLayers).forEach(layer=>layer&&layer.clearLayers());

  const shown=shownAdvisoryTypes();
  ['gairmet','sigmet','convective','cwa'].forEach(type=>{
    if(!shown[type]) return;
    (advisoryGeo[type]||[]).forEach(feat=>{
      try{
        const style=styleForAdvisoryFeature(type, feat.properties||{});
        L.geoJSON(feat,{
          style:{
            color:style.color,
            weight:style.weight,
            fillColor:style.fillColor,
            fillOpacity:style.fillOpacity,
            dashArray:style.dashArray
          },
          pointToLayer:(feature,latlng)=>L.circleMarker(latlng,{
            radius:6,
            color:style.color,
            fillColor:style.fillColor,
            fillOpacity:0.85,
            weight:2
          }),
          onEachFeature:(feature,layer)=>{
            layer.on('click', (e)=>{
              if(e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent);
              showCombinedAdvisoryPopup(e.latlng || layer.getBounds?.().getCenter?.() || leafletMap.getCenter());
            });
          }
        }).addTo(advisoryLayers[type]);
      }catch(e){
        console.error('Advisory layer error', type, e);
      }
    });
  });
}

function updateMap(){

  if(!leafletMap) return;
  mapMarkers.forEach(m=>m.remove()); mapMarkers=[];
  if(mapPolyline){mapPolyline.remove();mapPolyline=null;}
  const coordPts=routeAirports.filter(a=>a.lat!=null&&a.lon!=null);
  if(coordPts.length>=2)
    mapPolyline=L.polyline(coordPts.map(a=>[a.lat,a.lon]),{color:'#1a1a18',weight:2,dashArray:'5,5'}).addTo(leafletMap);
  const all=[
    ...routeAirports.map(a=>({id:a.id,data:corridorData[a.id],lat:a.lat,lon:a.lon,role:'route'})),
    ...Object.entries(offRouteData).map(([id,d])=>({id,data:d,lat:d.station?.geometry?.coordinates?.[1],lon:d.station?.geometry?.coordinates?.[0],role:'off',dist:d._dist}))
  ].filter(s=>s.lat!=null&&s.lon!=null);
  const bounds=[];
  all.forEach(s=>{
    const fr=flightRules(s.data),color=frColor(fr),sz=s.role==='route'?13:9;
    const icon=L.divIcon({className:'',html:\`<div style="width:\${sz}px;height:\${sz}px;border-radius:50%;background:\${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.25);"></div>\`,iconSize:[sz,sz],iconAnchor:[sz/2,sz/2]});
    const marker=L.marker([s.lat,s.lon],{icon});
    marker.bindPopup(\`<b style="font-family:monospace">\${s.id}</b>\${s.role==='off'?\` <span style="color:#888;font-size:11px">\${s.dist}NM</span>\`:''}<br><span style="font-family:monospace;font-size:11px">\${fr.toUpperCase()}</span><br><span style="font-family:monospace;font-size:10px;color:#555">\${stationDetailStr(s.data)}</span>\`);
    marker.addTo(leafletMap); mapMarkers.push(marker); bounds.push([s.lat,s.lon]);
  });
  renderAdvisoryLayers();
  if(bounds.length>0) leafletMap.fitBounds(bounds,{padding:[30,30]});
}

// ── API ───────────────────────────────────────────────────────────────────────
async function fetchDecoded(icao){
  const r=await fetch(\`https://api.checkwx.com/metar/\${icao}/decoded\`,{headers:{'X-API-Key':API_KEY}});
  if(!r.ok) return null;
  const j=await r.json(); return j?.data?.[0]||null;
}
async function fetchStationsNear(lat,lon,radiusNm){
  const km=Math.round(radiusNm*1.852);
  const r=await fetch(\`https://api.checkwx.com/metar/lat/\${lat.toFixed(4)}/lon/\${lon.toFixed(4)}/radius/\${km}/decoded\`,{headers:{'X-API-Key':API_KEY}});
  if(!r.ok) return [];
  const j=await r.json(); return j?.data||[];
}
async function fetchAwcGeo(product){
  const r=await fetch(\`/api/awc?product=\${encodeURIComponent(product)}\`);
  if(!r.ok) return null;
  return await r.json();
}


async function fetchRouteAdvisories(route){
  const [gairmetGeo, sigmetGeo, convGeo, cwaGeo] = await Promise.all([
    fetchAwcGeo('gairmet'),
    fetchAwcGeo('sigmet'),
    fetchAwcGeo('convective_sigmet'),
    fetchAwcGeo('cwa')
  ]);
  const grouped={gairmet:[],sigmet:[],convective:[],cwa:[]};
  const allFeatures=[
    ...((gairmetGeo?.features)||[]),
    ...((sigmetGeo?.features)||[]),
    ...((convGeo?.features)||[]),
    ...((cwaGeo?.features)||[])
  ];
  allFeatures.forEach(feat=>{
    feat.properties = feat.properties || {};
    feat.properties.label = advisoryLabel(feat.properties);
    grouped[advisoryKind(feat.properties)].push(feat);
  });
  advisoryGeo = grouped;
  renderAdvisoryLayers();
}

function summarizeAdvisoriesForAI(){
  const routeWithCoords=routeAirports.filter(a=>a.lat!=null&&a.lon!=null);
  const relevant=getRouteRelevantAdvisories(routeWithCoords, Math.max(offRouteRadius+60, 90));
  const lines=[];
  ['convective','sigmet','cwa','gairmet'].forEach(type=>{
    (relevant[type]||[]).slice(0,12).forEach(f=>{
      const p=f.properties||{};
      const altitudeMatch=advisoryAltitudeRelevant(type, p, cruiseAltitudeFt);
      if(!altitudeMatch && !advisoryCritical(type,p)) return;
      const band=advisoryBand(p);
      const bandText=(band.base!=null || band.top!=null) ? \` [base \${band.base ?? 'SFC'} ft / top \${band.top ?? 'unknown'} ft]\` : '';
      const altNote=altitudeMatch ? '' : ' [less relevant at planned altitude but still noted]';
      const label = type==='convective' ? 'CONVECTIVE SIGMET' : (type==='sigmet' ? 'SIGMET' : (type==='cwa' ? 'CWA' : \`G-AIRMET \${gAirmetSubtype(p).toUpperCase()}\`));
      const critical=advisoryCritical(type,p) ? ' [critical]' : '';
      lines.push(\`\${label}: \${p.hazard||p.type||p.label||'hazard'}\${bandText}\${altNote}\${critical}\${p.rawText||p.raw_text?\` — \${String(p.rawText||p.raw_text).slice(0,320)}\`:''}\`);
    });
  });
  return lines.length ? lines.join('\\n') : \`No current route-relevant G-AIRMETs, SIGMETs, Convective SIGMETs, or CWAs were found near the route corridor at or near the planned altitude of \${cruiseAltitudeFt} ft MSL for the planned \${plannedFlightRules} operation.\`;
}

// ── prog charts ───────────────────────────────────────────────────────────────
const PROG_CHARTS=[
  {label:'Surface analysis',url:'https://www.wpc.ncep.noaa.gov/noaa/noaa.gif'},
  {label:'12-hr fronts / precip prog',url:'https://www.wpc.ncep.noaa.gov/basicwx/92f.gif'},
];
async function loadProgCharts(){
  document.getElementById('progLoading').style.display='flex';
  document.getElementById('progAnalysis').style.display='none';
  const grid=document.getElementById('progGrid');
  grid.innerHTML=PROG_CHARTS.map(c=>\`<div class="prog-img-wrap"><div class="prog-img-label">\${c.label}</div><img src="/api/progchart?url=\${encodeURIComponent(c.url)}&_=\${Date.now()}" alt="\${c.label}" crossorigin="anonymous" onerror="this.style.display='none'"></div>\`).join('');
  const b64imgs=await Promise.allSettled(PROG_CHARTS.map(async c=>{
    try{
      const proxyUrl='/api/progchart?url='+encodeURIComponent(c.url)+'&_='+Date.now();
      const r=await fetch(proxyUrl);
      if(!r.ok) return null;
      const contentType=r.headers.get('content-type')||'image/gif';
      if(!contentType.startsWith('image/')) return null;
      const blob=await r.blob();
      return await new Promise(res=>{
        const fr=new FileReader();
        fr.onload=()=>res({label:c.label,b64:fr.result.split(',')[1],mime:contentType});
        fr.onerror=()=>res(null);
        fr.readAsDataURL(blob);
      });
    }catch(e){console.error('Prog chart exception:',e.message);return null;}
  }));
  const validImgs=b64imgs.filter(r=>r.status==='fulfilled'&&r.value).map(r=>r.value);
  if(validImgs.length===0){
    document.getElementById('progLoading').style.display='none';
    document.getElementById('progAnalysis').style.display='block';
    document.getElementById('progAnalysis').textContent='Prog chart images unavailable. Redeploy this updated version and try again.';
    if(document.getElementById('routeCol').children.length) overallDecision();
    return;
  }
  try{
    const routeText=routeAirports.map(a=>a.id).join(' to ');
    const advisorySummary=summarizeAdvisoriesForAI();
    const geminiParts=[
      ...validImgs.flatMap(img=>[
        {inline_data:{mime_type:img.mime,data:img.b64}},
        {text:\`Above image: \${img.label}\`}
      ]),
      {text:\`You are an aviation weather briefer preparing a route-focused briefing for \${routeText}.
Analyze only weather on the route corridor or close enough that it is likely to affect the route within the next 6 hours.
Do not give a broad CONUS analysis unless a system clearly affects the route within 6 hours.

Current route-relevant advisories:
\${advisorySummary}

Reply in exactly 5 complete sentences:
Sentence 1: route-relevant surface features now from the surface analysis.
Sentence 2: route-relevant changes shown by the 12-hour prog, but only mention features likely to affect the route in roughly the next 6 hours.
Sentence 3: route-relevant hazards from G-AIRMETs, SIGMETs, or Convective SIGMETs.
Sentence 4: the most important advisory-related hazard on or near the route. Sentence 5: one practical operational takeaway for pilot decision-making.
Be conservative, specific, and avoid discussing distant weather not relevant to the route.\`}
    ];
    const resp=await fetch('/api/gemini',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{role:'user',parts:geminiParts}],generationConfig:{maxOutputTokens:4096,temperature:0.1}})});
    const data=await resp.json();
    if(!resp.ok||data.error) throw new Error(data.error?.message||data.error?.status||JSON.stringify(data).substring(0,200)||\`HTTP \${resp.status}\`);
    const out=data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('').trim()||'';
    if(!out) throw new Error('No text in Gemini response.');
    document.getElementById('progLoading').style.display='none';
    document.getElementById('progAnalysis').style.display='block';
    document.getElementById('progAnalysis').textContent=out;
    if(document.getElementById('routeCol').children.length) overallDecision();
  }catch(e){
    console.error('Prog chart error:',e);
    document.getElementById('progLoading').style.display='none';
    document.getElementById('progAnalysis').style.display='block';
    document.getElementById('progAnalysis').textContent=\`Prog chart analysis unavailable: \${e.message}\`;
    renderBackgroundPage();
    if(document.getElementById('routeCol').children.length) overallDecision();
  }
}

// ── route render ──────────────────────────────────────────────────────────────
function renderRouteCol(){
  const col=document.getElementById('routeCol');
  col.innerHTML='';
  routeAirports.forEach((apt,i)=>{
    const d=corridorData[apt.id];
    const fr=flightRules(d);
    const tag=i===0?'DEP':i===routeAirports.length-1?'ARR':'WPT';
    // station block
    const block=document.createElement('div');
    block.className='station-block';
    block.innerHTML=\`
      <div class="st-header">
        <div>
          <div class="st-id">\${apt.id} <span style="font-size:11px;color:var(--text3);font-weight:400;">\${tag}</span></div>
          \${d?.station?.name?\`<div class="st-name">\${d.station.name}</div>\`:''}
        </div>
        <div class="st-right">\${frBadge(fr)}<span class="st-time">\${d?.observed?d.observed.substring(11,16)+'Z':''}</span></div>
      </div>
      \${d?.raw_text?\`<div class="raw-metar">\${d.raw_text}</div>\`:''}
      \${d?\`<div class="metrics">
        <div class="metric"><div class="metric-label">Wind</div><div class="metric-value">\${windStr(d)}</div></div>
        <div class="metric"><div class="metric-label">Visibility</div><div class="metric-value">\${d.visibility?.miles??'—'} SM</div></div>
        <div class="metric"><div class="metric-label">Sky</div><div class="metric-value">\${skyStr(d)}</div></div>
        <div class="metric"><div class="metric-label">Temp / Dew</div><div class="metric-value">\${d.temperature?.celsius??'—'}° / \${d.dewpoint?.celsius??'—'}°C</div></div>
        <div class="metric"><div class="metric-label">Altimeter</div><div class="metric-value">\${d.barometer?.hg!=null?d.barometer.hg.toFixed(2):'—'} inHg</div></div>
      </div>\`:\`<div style="font-family:var(--mono);font-size:11px;color:var(--text3);margin-top:4px;">No data</div>\`}\`;
    col.appendChild(block);

    // analysis connector between stations
    if(i<routeAirports.length-1){
      const conn=document.createElement('div');
      conn.className='analysis-connector';
      conn.innerHTML=\`
        <div class="connector-gutter">
          <div class="connector-line"></div>
          <div class="connector-dot"></div>
          <div class="connector-line"></div>
        </div>
        <div class="analysis-inner">
          <div class="gng-inline loading" id="analysis-\${i}">
            <div class="gng-verdict">ANALYZING \${apt.id} → \${routeAirports[i+1].id}...</div>
            <div class="gng-analysis" style="font-family:var(--mono);font-size:11px;color:var(--text3);">Waiting for Gemini...</div>
          </div>
        </div>\`;
      col.appendChild(conn);
    }
  });
}


function collectSegmentStations(i){
  const a=routeAirports[i],b=routeAirports[i+1];
  const stations=Object.entries(offRouteData)
    .filter(([,d])=>{
      const lat=d.station?.geometry?.coordinates?.[1],lon=d.station?.geometry?.coordinates?.[0];
      if(lat==null||a.lat==null||b.lat==null) return true;
      const dA=distNm(lat,lon,a.lat,a.lon),dB=distNm(lat,lon,b.lat,b.lon);
      return dA<dB*2;
    })
    .slice(0,8)
    .map(([id,d])=>({id,d}));
  return stations;
}

function deriveRisksForStation(d){
  const risks=[];
  const vis=d?.visibility?.miles_float ?? d?.visibility?.miles ?? null;
  const ceil=d?.ceiling?.feet ?? null;
  const wind=d?.wind?.speed_kts ?? null;
  const gust=d?.wind?.gust_kts ?? null;
  const wx=(d?.wx_string||'').toUpperCase();
  if(ceil!=null && ceil<500) risks.push('LIFR ceiling');
  else if(ceil!=null && ceil<1000) risks.push('IFR ceiling');
  else if(ceil!=null && ceil<3000) risks.push('MVFR ceiling');
  if(vis!=null && vis<1) risks.push('LIFR visibility');
  else if(vis!=null && vis<3) risks.push('IFR visibility');
  else if(vis!=null && vis<5) risks.push('MVFR visibility');
  if(gust!=null && gust>=30) risks.push('strong gusts');
  else if(wind!=null && wind>=25) risks.push('strong winds');
  if(/TS|VCTS|CB/.test(wx)) risks.push('thunderstorm risk');
  if(/FZ|SN|PL|GR|GS/.test(wx)) risks.push('icing / frozen precip risk');
  if(/FG|BR|HZ/.test(wx)) risks.push('reduced visibility obscuration');
  return risks;
}

function segmentRiskSummary(i){
  const a=routeAirports[i],b=routeAirports[i+1];
  const da=corridorData[a.id], db=corridorData[b.id];
  const risks=[
    ...deriveRisksForStation(da).map(r=>\`\${a.id}: \${r}\`),
    ...deriveRisksForStation(db).map(r=>\`\${b.id}: \${r}\`),
  ];
  collectSegmentStations(i).forEach(({id,d})=>{
    deriveRisksForStation(d).slice(0,2).forEach(r=>risks.push(\`\${id}: \${r}\`));
  });
  return [...new Set(risks)].slice(0,10);
}



async function runSegmentAnalysis(i){
  const a=routeAirports[i],b=routeAirports[i+1];
  const da=corridorData[a.id],db=corridorData[b.id];
  const nearbyStations = collectSegmentStations(i)
    .map(({id,d})=>\`\${id} (\${d._dist}NM off route): \${flightRules(d).toUpperCase()}, VIS \${d.visibility?.miles_float??'?'}SM, CEIL \${d.ceiling?.feet??'unlimited'}ft, WIND \${windStr(d)}\${d.wx_string?\`, WX \${d.wx_string}\`:''}\`)
    .join('; ');
  const risks = segmentRiskSummary(i);

  const prompt=\`You are an aviation weather briefer helping with a conservative preflight weather review.
This is advisory only and not an official briefing.

Analyze ONLY this one route segment and be practical, concise, and safety-focused.
Use the weather data below. Weight the worst credible risk more heavily than the best case.
If conditions are mixed or uncertain, prefer CAUTION over GO.
Planned cruise altitude: \${cruiseAltitudeFt} ft MSL
Planned operation: \${plannedFlightRules}.
If an advisory exists but is clearly outside the planned altitude band and not critical, reduce its weight but do not ignore departure/arrival, convective, volcanic ash, or severe hazards.

Segment: \${a.id} to \${b.id}

Departure station \${a.id}:
\${da?\`Flight rules \${flightRules(da).toUpperCase()}, visibility \${da.visibility?.miles_float??'?'}SM, ceiling \${da.ceiling?.feet??'unlimited'} ft, wind \${windStr(da)}, sky \${skyStr(da)}\${da.wx_string?\`, weather \${da.wx_string}\`:''}, raw METAR: \${da.raw_text}\`:'No data'}

Arrival station \${b.id}:
\${db?\`Flight rules \${flightRules(db).toUpperCase()}, visibility \${db.visibility?.miles_float??'?'}SM, ceiling \${db.ceiling?.feet??'unlimited'} ft, wind \${windStr(db)}, sky \${skyStr(db)}\${db.wx_string?\`, weather \${db.wx_string}\`:''}, raw METAR: \${db.raw_text}\`:'No data'}

Nearby route corridor stations:
\${nearbyStations || 'No nearby stations available'}

Derived risk flags:
\${risks.length ? risks.join('; ') : 'No major automated risk flags'}

Route-relevant advisories:
\${summarizeAdvisoriesForAI()}

Reply in EXACTLY this format:
VERDICT: GO or CAUTION or NO-GO
REASONING: 5 to 7 complete sentences. Mention the biggest hazards first, explicitly include any advisory and altitude impacts, and end with the most important operational takeaway.
\`;
  try{
    const resp=await fetch('/api/gemini',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      contents:[{role:'user',parts:[{text:prompt}]}],
      generationConfig:{maxOutputTokens:3600,temperature:0.1}
    })});
    const data=await resp.json();
    if(!resp.ok || data.error){
      throw new Error(data.error?.message || data.error || \`HTTP \${resp.status}\`);
    }
    const text = data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('').trim();
    if(!text) throw new Error('Empty response from Gemini');
    const lines=text.split('\\n').map(l=>l.trim()).filter(Boolean);
    const vLine=lines.find(l=>l.toUpperCase().startsWith('VERDICT:'))||'';
    const verdict=vLine.replace(/VERDICT:/i,'').trim().toUpperCase();
    const reasoningLine=lines.find(l=>l.toUpperCase().startsWith('REASONING:'))||'';
    let analysis=reasoningLine.replace(/REASONING:/i,'').trim();
    if(!analysis){
      analysis=lines.filter(l=>!l.toUpperCase().startsWith('VERDICT:')).join(' ').trim();
    }
    let cls='caution';
    if(verdict.includes('NO-GO')) cls='nogo';
    else if(verdict==='GO') cls='go';
    const el=document.getElementById(\`analysis-\${i}\`);
    if(el){el.className=\`gng-inline \${cls}\`;el.innerHTML=\`<div class="gng-verdict">\${a.id} → \${b.id} · \${verdict||'CAUTION'}</div><div class="gng-analysis">\${analysis}</div>\`;}
  }catch(e){
    console.error('Segment analysis error:',e);
    const el=document.getElementById(\`analysis-\${i}\`);
    if(el){el.className='gng-inline loading';el.innerHTML=\`<div class="gng-verdict">\${a.id} → \${b.id}</div><div class="gng-analysis" style="font-family:var(--mono);font-size:11px;color:var(--text3);">Analysis unavailable: \${e.message}</div>\`;}
  }
}

function renderOffRoute(){

  const off=Object.entries(offRouteData).sort((a,b)=>a[1]._dist-b[1]._dist);
  if(!off.length){
    document.getElementById('offRouteCards').innerHTML=\`<div style="font-family:var(--mono);font-size:11px;color:var(--text3);padding:6px 0;">No additional stations found within \${offRouteRadius} NM.</div>\`;
    return;
  }
  let html=\`<div class="stations-grid"><div class="station-row header-row"><span>Station</span><span>Wx</span><span>Details</span><span style="text-align:right;">Time</span></div>\`;
  off.forEach(([id,d])=>{
    html+=\`<div class="station-row">
      <div><div class="st-id-sm">\${id}</div><div class="st-tag">\${d._dist} NM</div></div>
      <div>\${frBadge(flightRules(d))}</div>
      <div><div class="st-details">\${stationDetailStr(d)}</div>\${d?.raw_text?\`<div class="st-raw-sm">\${d.raw_text}</div>\`:''}</div>
      <div class="st-time-sm">\${d?.observed?d.observed.substring(11,16)+'Z':''}</div>
    </div>\`;
  });
  document.getElementById('offRouteCards').innerHTML=html+'</div>';
}

// ── main fetch ────────────────────────────────────────────────────────────────
async function fetchAll(){
  if(fetching) return;
  fetching=true;
  document.getElementById('refreshBtn').disabled=true;
  setStatus('fetching','Fetching METARs, nearby stations, advisories, AI analysis, and prog charts...');

  const decoded=await Promise.allSettled(routeAirports.map(a=>fetchDecoded(a.id)));
  decoded.forEach((r,i)=>{
    const d=r.status==='fulfilled'?r.value:null;
    corridorData[routeAirports[i].id]=d;
    if(d?.station?.geometry?.coordinates){routeAirports[i].lon=d.station.geometry.coordinates[0];routeAirports[i].lat=d.station.geometry.coordinates[1];}
  });

  const routeWithCoords=routeAirports.filter(a=>a.lat!=null);
  const samplePts=[];
  const stepNm=Math.max(offRouteRadius*1.5, 35);
  for(let i=0;i<routeWithCoords.length-1;i++){
    const A=routeWithCoords[i], B=routeWithCoords[i+1];
    const segDist=distNm(A.lat,A.lon,B.lat,B.lon);
    const steps=Math.max(1,Math.ceil(segDist/stepNm));
    for(let s=0;s<=steps;s++){
      const t=s/steps;
      samplePts.push({lat:A.lat+(B.lat-A.lat)*t, lon:A.lon+(B.lon-A.lon)*t});
    }
  }

  const [nearby, _advs, runways] = await Promise.all([
    Promise.allSettled(samplePts.map(p=>fetchStationsNear(p.lat,p.lon,offRouteRadius+15))),
    fetchRouteAdvisories(routeWithCoords),
    fetchRunwaysForAirports(routeAirports.map(a=>a.id))
  ]);
  airportRunwayData=runways||{};

  const seen=new Set(routeAirports.map(a=>a.id));
  const candidates={};
  nearby.forEach(r=>{
    if(r.status!=='fulfilled') return;
    r.value.forEach(d=>{const id=d.icao;if(!id||seen.has(id)) return;seen.add(id);candidates[id]=d;});
  });

  offRouteData={};
  if(routeWithCoords.length>=2){
    Object.entries(candidates).forEach(([id,d])=>{
      const lat=d.station?.geometry?.coordinates?.[1],lon=d.station?.geometry?.coordinates?.[0];
      if(lat==null||lon==null) return;
      const dist=minDistToRoute(lat,lon,routeWithCoords);
      if(dist<=offRouteRadius) offRouteData[id]={...d,_dist:Math.round(dist)};
    });
  }

  renderRouteCol();
  renderOffRoute();
  updateMap();

  const progPromise=loadProgCharts();
  await Promise.allSettled([progPromise]);
  overallDecision();

  const anyOk=Object.values(corridorData).some(d=>d!=null);
  setStatus(anyOk?'ok':'error',anyOk?\`Updated \${new Date().toLocaleTimeString()}\`:'Fetch failed');
  fetching=false;
  document.getElementById('refreshBtn').disabled=false;
  countdown=INTERVAL;
}

// ── route loading ─────────────────────────────────────────────────────────────
async function loadRoute(){
  if(!API_KEY){const ok=await loadConfig();if(!ok)return;}
  const raw=document.getElementById('routeInput').value.trim();
  offRouteRadius=parseInt(document.getElementById('radiusInput').value)||30;
  cruiseAltitudeFt=parseInt(document.getElementById('altitudeInput').value)||8000;
  const ids=raw.split(/[\\s,]+/).map(s=>s.toUpperCase()).filter(s=>s.length>=3);
  if(ids.length<2){alert('Please enter at least 2 airport IDs.');return;}
  routeAirports=ids.map(id=>({id,lat:null,lon:null}));
  corridorData={}; offRouteData={};
  plannedFlightRules=document.getElementById('flightRulesInput')?.value || 'VFR';
  document.getElementById('emptyState').style.display='none';
  document.getElementById('mainContent').style.display='block';
  document.getElementById('offRouteLabel').textContent=\`Off-route stations within \${offRouteRadius} NM\`;
  document.getElementById('countdownSpan').style.display='';
  document.getElementById('refreshBtn').disabled=false;
  document.getElementById('toggleBtn').disabled=false;
  // enablePageNav();
  enableRetryAiButton(false);
  showPage('main');
  document.getElementById('toggleBtn').textContent='Pause';

  isRunning=true; pausedAt=null;
  clearInterval(progTimer);
  setTimeout(()=>initMap(),100);
  loadOptionalBriefingPdf().catch(e=>{
    console.error('PDF load failed:', e);
  });
  await fetchAll();
  startCountdown();
}




function cleanSummaryText(s){ return (s||'').replace(/\\s+/g,' ').trim(); }
async function overallDecision(){
  try{
    const matrix=riskMatrixResult();
    const advisorySummary=summarizeAdvisoriesForAI();
    const prog=(document.getElementById('progAnalysis')?.textContent||'').trim();
    const tafSummary=Object.entries(tafData||{}).map(([id,taf])=> taf?.raw_text ? \`\${id}: \${taf.raw_text}\` : \`\${id}: No TAF available.\`).join('\\n');
    const runwaySummary=routeAirports.map(a=>{
      const wx=corridorData[a.id];
      const comps=runwayComponentsForAirport(a.id, wx);
      if(!comps.length) return \`\${a.id}: runway wind components unavailable\`;
      return \`\${a.id}: \` + comps.slice(0,8).map(r=>\`\${r.ident} XW \${r.cross}\${r.gustCross!=null?\` G\${r.gustCross}\`:''} \${r.headType} \${r.head}\`).join('; ');
    }).join('\\n');
    const stationSummary=routeAirports.map(a=>{
      const d=corridorData[a.id];
      if(!d) return \`\${a.id}: no METAR\`;
      return \`\${a.id}: \${flightRules(d).toUpperCase()}, VIS \${d.visibility?.miles_float ?? d.visibility?.miles ?? '?'}SM, CEIL \${d.ceiling?.feet ?? 'unlimited'}ft, WIND \${windStr(d)}, SKY \${skyStr(d)}\${d.wx_string?\`, WX \${d.wx_string}\`:''}, TEMP \${d.temperature?.celsius ?? '?'}C, DEW \${d.dewpoint?.celsius ?? '?'}C, RAW \${d.raw_text}\`;
    }).join('\\n');
    const offRouteSummary=Object.entries(offRouteData).slice(0,12).map(([id,d])=>{
      return \`\${id} (\${d._dist}NM): \${flightRules(d).toUpperCase()}, VIS \${d.visibility?.miles_float ?? d.visibility?.miles ?? '?'}SM, CEIL \${d.ceiling?.feet ?? 'unlimited'}ft, WIND \${windStr(d)}\${d.wx_string?\`, WX \${d.wx_string}\`:''}\`;
    }).join('\\n') || 'No off-route supporting stations.';
    const uploadedBriefingSection=uploadedBriefingText ? \`Uploaded official briefing PDF (\${uploadedBriefingName || 'briefing.pdf'}):
\${uploadedBriefingText}\` : 'No uploaded official briefing PDF.';
    const cls=matrix.verdict==='NO-GO'?'nogo':(matrix.verdict==='CAUTION'?'caution':'go');

    setOverallDecisionLoading();
    enableRetryAiButton(false);

    const prompt=\`You are an aviation weather briefer writing a long-form decision essay for conservative general aviation operations. This is advisory only and not an official briefing.

Route: \${routeAirports.map(a=>a.id).join(' to ')}
Planned cruise altitude: \${cruiseAltitudeFt} ft MSL
Planned operation: \${plannedFlightRules}

Use these decision rules strongly:
1. Thunderstorms or Convective SIGMETs within 30 NM of any point on the route are NO-GO.
2. Icing SIGMETs/G-AIRMET Zulu, or likely icing from cloud layers with freezing/subfreezing temperatures, are NO-GO.
3. LLWS presence affecting the route is NO-GO.
4. Wind risk must be evaluated using runway crosswind component at the airports of use, not just total wind speed.
5. TAFs matter because they indicate whether the route is likely to improve or deteriorate during the period of flight.
6. Prog-chart analysis matters and must affect the final decision, not just be mentioned separately.
7. An uploaded official briefing PDF, if present, is high-priority context and should be cross-checked against current weather.

Current METARs at airports of use:
\${stationSummary}

Supporting off-route stations:
\${offRouteSummary}

TAFs:
\${tafSummary}

Runway wind component summary:
\${runwaySummary}

Route-relevant advisories:
\${advisorySummary}

Prog-chart analysis:
\${prog || 'Prog-chart analysis unavailable.'}

Uploaded briefing:
\${uploadedBriefingSection}

Risk matrix support:
Score \${matrix.score}, category \${matrix.category}, suggested verdict \${matrix.verdict}. Drivers: \${matrix.reasons.join(', ') || 'none'}

Reply in EXACTLY this format:
VERDICT: GO or CAUTION or NO-GO
ESSAY: Write 3 solid paragraphs totaling 10 to 16 complete sentences. Paragraph 1 should explain the present weather and route structure. Paragraph 2 should explain the forecast trend using TAFs, advisories, and prog charts together. Paragraph 3 should make a clear operational general-aviation go/no-go decision with specific reasons, including altitude relevance, runway crosswind considerations, and the most important hazards.\`;

    const resp=await fetch('/api/gemini',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        contents:[{role:'user',parts:[{text:prompt}]}],
        generationConfig:{maxOutputTokens:4096,temperature:0.15}
      })
    });
    const data=await resp.json();
    if(!resp.ok || data.error) throw new Error(data.error?.message || data.error || \`HTTP \${resp.status}\`);
    const txt=data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('').trim();
    if(!txt) throw new Error('Empty AI response');
    const verdict=(txt.split('\\n').find(l=>l.toUpperCase().startsWith('VERDICT:'))||'').replace(/VERDICT:/i,'').trim() || matrix.verdict;
    let essay=(txt.split('\\n').find(l=>l.toUpperCase().startsWith('ESSAY:'))||'').replace(/ESSAY:/i,'').trim();
    if(!essay){
      essay=txt.replace(/VERDICT:[^\\n]*/i,'').replace(/ESSAY:/i,'').trim();
    }
    overallEssayText=essay;
    const newCls=verdict.toUpperCase().includes('NO-GO')?'nogo':(verdict.toUpperCase().includes('CAUTION')?'caution':'go');
    const el=document.getElementById('overallDecisionBox');
    if(el){
      el.className=\`gng-inline \${newCls}\`;
      el.innerHTML=\`<div class="gng-verdict">OVERALL · \${verdict}</div><div class="gng-analysis" style="white-space:pre-wrap;">\${essay}</div>\`;
    }
  }catch(e){
    console.error('Overall decision failed:', e);
    const matrix=riskMatrixResult();
    const el=document.getElementById('overallDecisionBox');
    if(el){
      el.className='gng-inline caution';
      el.innerHTML=\`<div class="gng-verdict">OVERALL · \${matrix.verdict}</div>
      <div class="gng-analysis">AI analysis failed. Check the Retry AI button or browser console. Fallback risk matrix is \${matrix.category} with score \${matrix.score}. Primary drivers: \${matrix.reasons.join(', ') || 'none'}.</div>\`;
    }
  }finally{
    enableRetryAiButton(true);
    renderRiskMatrix();
  }
}

// ── controls ──────────────────────────────────────────────────────────────────
function doRefresh(){
  pausedAt=null;
  countdown=INTERVAL;
  const pf=document.getElementById('pfill');
  pf.style.transition='none'; pf.style.width='100%';
  requestAnimationFrame(()=>{pf.style.transition='width 1s linear';});
  fetchAll();
}

function setStatus(state,msg){
  document.getElementById('statusDot').className='dot '+state;
  document.getElementById('statusText').textContent=msg;
}

function toggleMonitor(){
  isRunning=!isRunning;
  document.getElementById('toggleBtn').textContent=isRunning?'Pause':'Resume';
  if(!isRunning){
    // store exactly where countdown is when paused
    pausedAt=countdown;
  } else {
    // resume from paused value — do NOT reset countdown
    if(pausedAt!=null){ countdown=pausedAt; pausedAt=null; }
  }
}

function startCountdown(){
  clearInterval(progTimer);
  countdown=INTERVAL;
  progTimer=setInterval(()=>{
    if(!isRunning) return;
    countdown--;
    if(countdown<0) countdown=0;
    document.getElementById('countdown').textContent=countdown;
    const pct=(countdown/INTERVAL)*100;
    const pf=document.getElementById('pfill');
    pf.style.transition='width 1s linear';
    pf.style.width=pct+'%';
    if(countdown<=0) fetchAll();
  },1000);
}
</script>
</body>
</html>
`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.write(html);
  res.end();
  return { props: {} };
}

export default function Home() {
  return null;
}
