// ════════════════════════════════════════════════════════════════════════════
// Type in Every Line — MBTI Writing Explorer  |  js/main.js
// CSC316 Assignment 3 — Interactive Visualization
// Author: Heidi Wang
// ════════════════════════════════════════════════════════════════════════════

const COLORS = { NF:"#F4A261", NT:"#457B9D", SF:"#52B788", ST:"#9B5DE5" };

const ROLES = {
  INFJ:"The Advocate",   INFP:"The Mediator",    INTJ:"The Architect",  INTP:"The Logician",
  ENFJ:"The Protagonist",ENFP:"The Campaigner",  ENTJ:"The Commander",  ENTP:"The Debater",
  ISFJ:"The Defender",   ISFP:"The Adventurer",  ISTJ:"The Logistician",ISTP:"The Virtuoso",
  ESFJ:"The Consul",     ESFP:"The Entertainer", ESTJ:"The Executive",  ESTP:"The Entrepreneur"
};

const METRIC_META = {
  words_per_comment:{ label:"Avg. Words per Post",  fmt: d => d.toFixed(1)  },
  http_per_comment: { label:"Links per Post",        fmt: d => d.toFixed(4)  },
  qm_per_comment:   { label:"Questions per Post",    fmt: d => d.toFixed(4)  },
  variance:         { label:"Writing Variability",   fmt: d => d.toFixed(1)  }
};

const METRIC_DESC = {
  words_per_comment: "Average number of words written per forum post",
  http_per_comment:  "Average number of URLs/links shared per forum post",
  qm_per_comment:    "Average number of question marks used per forum post",
  variance:          "How much a person's post length varies (standard deviation)"
};

const ANNOTATIONS_DEF = [
  { type:"INFP",  metric:null,                label:"Most users (1,832)",    dx:38,  dy:-32 },
  { type:"ENTJ",  metric:"words_per_comment", label:"Highest avg. words",    dx:32,  dy:-28 },
  { type:"ESFJ",  metric:null,                label:"Fewest users (42)",      dx:40,  dy:18  },
  { type:"ESTP",  metric:"qm_per_comment",    label:"Fewest ?s per post",    dx:-44, dy:-20 },
  { type:"ENTP",  metric:"http_per_comment",  label:"Few links, many users", dx:38,  dy:22  },
];

const STORIES = [
  { title:"Who writes more — and asks more?",
    sub:"Words per post vs. questions per post. Upper-right = verbose AND curious.",
    xM:"words_per_comment", yM:"qm_per_comment", hl:{ dim:"N_S", val:"N" },
    ann:"💡 Intuitive types (N, highlighted) cluster upper-right — they write longer posts and pepper them with more questions." },
  { title:"Do longer writers vary more?",
    sub:"Words per post vs. writing variability. High variability = post length swings wildly.",
    xM:"words_per_comment", yM:"variance", hl:{ dim:"J_P", val:"P" },
    ann:"💡 Perceiver types (P, highlighted) sit higher on variability — their post length is less predictable than Judgers'." },
  { title:"Do verbose writers share more links?",
    sub:"Words per post vs. links per post. Sensing types share more URLs despite writing less.",
    xM:"words_per_comment", yM:"http_per_comment", hl:{ dim:"N_S", val:"S" },
    ann:"💡 Sensing types (S, highlighted) share more links per post even though they write shorter posts overall." },
  { title:"Link-sharers vs. question-askers",
    sub:"Links per post vs. questions per post — two very different ways of engaging online.",
    xM:"http_per_comment", yM:"qm_per_comment", hl:{ dim:"N_S", val:"S" },
    ann:"💡 Sensing types lean toward sharing links; Intuitive types lean toward asking questions — opposite engagement styles." },
  { title:"Curious minds, inconsistent lengths?",
    sub:"Questions per post vs. writing variability — does curiosity come with unpredictability?",
    xM:"qm_per_comment", yM:"variance", hl:{ dim:"T_F", val:"F" },
    ann:"💡 ENFP has the highest variability and high curiosity — Feeling types (F, highlighted) tend to be the most unpredictable writers." },
  { title:"Do link-sharers write consistently?",
    sub:"Links per post vs. writing variability — information-forwarding vs. post-length consistency.",
    xM:"http_per_comment", yM:"variance", hl:{ dim:"N_S", val:"S" },
    ann:"💡 Sensing types (S, highlighted) share more links and write more consistently — focused, practical communicators." }
];

// ── STATE ──
let state = {
  xM:"words_per_comment", yM:"qm_per_comment",
  hl:null, sel:null, playing:false, storyIdx:-1,
  donutFilter:null, brushRange:null
};
let playTimer = null, data = [];

// ════════════════════════════════════════════════════════════════════════════
// SCATTER CHART — SVG setup, margins, linear/sqrt scales
// ════════════════════════════════════════════════════════════════════════════
const M = { top:18, right:22, bottom:50, left:58 };

function chartDims() {
  const W = (document.getElementById("chart-wrap").clientWidth) || 700;
  const H = Math.max(280, Math.min(440, window.innerHeight - 420));
  return { W, H, w: W - M.left - M.right, h: H - M.top - M.bottom };
}

let dims = chartDims();
const svg = d3.select("#chart").attr("width", dims.W).attr("height", dims.H);

// Defs — scatter clip + per-type avatar clips
const scatterDefs = svg.append("defs");
scatterDefs.append("clipPath").attr("id","scatter-clip")
  .append("rect").attr("width", dims.w).attr("height", dims.h);

const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);

let xSc    = d3.scaleLinear().range([0, dims.w]);
let ySc    = d3.scaleLinear().range([dims.h, 0]);
const sizeSc = d3.scaleSqrt().range([14, 44]);

const xGrid   = g.append("g").attr("class","grid").attr("transform",`translate(0,${dims.h})`);
const yGrid   = g.append("g").attr("class","grid");
const xAxisG  = g.append("g").attr("class","axis x-axis").attr("transform",`translate(0,${dims.h})`);
const yAxisG  = g.append("g").attr("class","axis y-axis");
const xLbl    = g.append("text").attr("class","ax-label").attr("text-anchor","middle").attr("x",dims.w/2).attr("y",dims.h+42);
const yLbl    = g.append("text").attr("class","ax-label").attr("text-anchor","middle").attr("transform","rotate(-90)").attr("x",-dims.h/2).attr("y",-44);

const annG     = g.append("g").attr("class","annotations").attr("clip-path","url(#scatter-clip)");
const bubblesG = g.append("g").attr("clip-path","url(#scatter-clip)");
const labelsG  = g.append("g").attr("clip-path","url(#scatter-clip)");

// ════════════════════════════════════════════════════════════════════════════
// ZOOM + PAN  (d3.zoom)
// ════════════════════════════════════════════════════════════════════════════
let currentZoomTransform = d3.zoomIdentity;

const zoomBehavior = d3.zoom()
  .scaleExtent([0.5, 10])
  .filter(event => {
    if (event.type === "wheel" || event.type === "touchstart") return true;
    const cls = (event.target?.getAttribute("class") || "");
    return !cls.includes("bubble") && !cls.includes("blabel");
  })
  .on("zoom", event => {
    currentZoomTransform = event.transform;
    const isId = event.transform.k === 1 && event.transform.x === 0 && event.transform.y === 0;
    document.getElementById("reset-zoom-btn").classList.toggle("hidden", isId);
    applyZoom();
  });

svg.call(zoomBehavior);

function applyZoom() {
  if (!data.length) return;
  const zx = currentZoomTransform.rescaleX(xSc);
  const zy = currentZoomTransform.rescaleY(ySc);
  const isFmt = k => k === "words_per_comment" || k === "variance";
  xAxisG.call(d3.axisBottom(zx).ticks(6).tickFormat(isFmt(state.xM) ? d3.format(".0f") : d3.format(".3f")));
  yAxisG.call(d3.axisLeft(zy).ticks(6).tickFormat(isFmt(state.yM) ? d3.format(".0f") : d3.format(".3f")));
  xGrid.call(d3.axisBottom(zx).ticks(6).tickSize(-dims.h).tickFormat("")).call(gg => gg.select(".domain").remove());
  yGrid.call(d3.axisLeft(zy).ticks(6).tickSize(-dims.w).tickFormat("")).call(gg => gg.select(".domain").remove());
  bubblesG.selectAll("g.bubble")
    .attr("transform", d => `translate(${zx(d[state.xM])},${zy(d[state.yM])})`);
  labelsG.selectAll("text.blabel")
    .attr("x", d => zx(d[state.xM]))
    .attr("y", d => zy(d[state.yM]) + sizeSc(d.count) + 11);
  updateAnnotations(zx, zy);
}

function resetZoom() {
  currentZoomTransform = d3.zoomIdentity;
  svg.transition().duration(420).ease(d3.easeCubicInOut).call(zoomBehavior.transform, d3.zoomIdentity);
  document.getElementById("reset-zoom-btn").classList.add("hidden");
}
document.getElementById("reset-zoom-btn").addEventListener("click", resetZoom);

// ════════════════════════════════════════════════════════════════════════════
// AVATAR CLIP PATHS
// ════════════════════════════════════════════════════════════════════════════
function ensureAvatarClips(data) {
  data.forEach(d => {
    const id = `clip-${d.type}`;
    if (scatterDefs.select(`#${id}`).empty()) {
      scatterDefs.append("clipPath").attr("id", id)
        .append("circle").attr("cx", 0).attr("cy", 0).attr("r", 1);
    }
  });
}

// ════════════════════════════════════════════════════════════════════════════
// ANNOTATIONS
// ════════════════════════════════════════════════════════════════════════════
function updateAnnotations(zx, zy) {
  annG.selectAll("*").remove();
  if (!data.length) return;
  ANNOTATIONS_DEF.forEach(ann => {
    if (ann.metric && ann.metric !== state.xM) return;
    const d = data.find(x => x.type === ann.type);
    if (!d || opacity(d) < 0.5) return;
    const cx = zx(d[state.xM]), cy = zy(d[state.yM]), r = sizeSc(d.count);
    const angle = Math.atan2(ann.dy, ann.dx);
    annG.append("path").attr("class","ann-line")
      .attr("d", `M${cx + Math.cos(angle)*r},${cy + Math.sin(angle)*r} L${cx+ann.dx},${cy+ann.dy}`)
      .attr("stroke","#4ecdc4").attr("stroke-width",1).attr("stroke-dasharray","3,2")
      .attr("opacity",0.5).attr("fill","none");
    annG.append("text").attr("class","ann-text")
      .attr("x", cx + ann.dx + (ann.dx >= 0 ? 4 : -4))
      .attr("y", cy + ann.dy)
      .attr("text-anchor", ann.dx >= 0 ? "start" : "end")
      .attr("dominant-baseline","middle").text(ann.label);
  });
}

// ════════════════════════════════════════════════════════════════════════════
// BAR CHART — scaleBand, brushX, linked views with scatter
// ════════════════════════════════════════════════════════════════════════════
const BAR_M = { top:12, right:88, bottom:34, left:55 };
const BAR_H_TOTAL = 370;
let barG, barXSc, barYSc, barBrush, barBrushG;

function initBar() {
  const BW = document.getElementById("bar-wrap").clientWidth || 700;
  const bw = BW - BAR_M.left - BAR_M.right;
  const bh = BAR_H_TOTAL - BAR_M.top - BAR_M.bottom;
  d3.select("#bar-chart").attr("width", BW).attr("height", BAR_H_TOTAL);
  barG = d3.select("#bar-chart").append("g").attr("transform", `translate(${BAR_M.left},${BAR_M.top})`);
  barXSc = d3.scaleLinear().range([0, bw]);
  barYSc = d3.scaleBand().range([0, bh]).padding(0.18);
  barG.append("g").attr("class","bar-x-axis axis").attr("transform",`translate(0,${bh})`);
  barG.append("g").attr("class","bar-y-axis axis");
  barG.append("text").attr("class","bar-x-lbl ax-label").attr("text-anchor","middle").attr("x",bw/2).attr("y",bh+28);
  barG.append("g").attr("class","bars-g");
  barG.append("g").attr("class","bval-g");

  // ── Drag hint overlay (dismissed on first brush interaction) ──
  // Positioned in the lower-right where short bars leave open space
  const hintW = 160, hintH = 64;
  const hintX = bw - hintW - 8, hintY = bh - hintH - 8;
  const hintCX = hintX + hintW / 2, hintCY = hintY + hintH / 2;
  const dragHint = barG.append("g").attr("class","drag-hint-g");
  // Solid dark background
  dragHint.append("rect")
    .attr("x", hintX).attr("y", hintY)
    .attr("width", hintW).attr("height", hintH)
    .attr("rx", 8).attr("fill", "rgba(6,6,18,0.88)");
  // Teal dashed border
  dragHint.append("rect")
    .attr("x", hintX).attr("y", hintY)
    .attr("width", hintW).attr("height", hintH)
    .attr("rx", 8).attr("fill", "none")
    .attr("stroke", "#4ecdc4")
    .attr("stroke-width", 1.8)
    .attr("stroke-dasharray", "6,4");
  // Arrow icon
  dragHint.append("text")
    .attr("x", hintCX).attr("y", hintCY - 14)
    .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
    .attr("fill", "#4ecdc4")
    .style("font-size", "16px")
    .text("⟺");
  dragHint.append("text")
    .attr("x", hintCX).attr("y", hintCY + 6)
    .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
    .attr("fill", "#e0e8f8")
    .style("font-size", "12px").style("font-weight", "700")
    .style("letter-spacing", "0.08em")
    .text("DRAG TO FILTER");
  dragHint.append("text")
    .attr("x", hintCX).attr("y", hintCY + 22)
    .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
    .attr("fill", "#8888bb")
    .style("font-size", "9.5px")
    .text("highlights matching bubbles above");

  barBrush = d3.brushX().extent([[0,0],[bw,bh]]).on("brush end", ev => {
    // Dismiss the hint on first brush interaction
    barG.select(".drag-hint-g")
      .transition().duration(350).style("opacity", 0)
      .on("end", function() { d3.select(this).remove(); });
    state.brushRange = ev.selection
      ? [barXSc.invert(ev.selection[0]), barXSc.invert(ev.selection[1])]
      : null;
    render();
  });
  barBrushG = barG.append("g").attr("class","brush");
  barBrushG.call(barBrush);
}

function clearBrush() {
  state.brushRange = null;
  if (barBrushG) barBrushG.call(barBrush.move, null);
}

function drawBar(animate) {
  if (!barG) return;
  const t = d3.transition().duration(animate ? 700 : 0).ease(d3.easeCubicInOut);
  const sorted = [...data].sort((a,b) => b[state.xM] - a[state.xM]);
  barXSc.domain([0, d3.max(data, d => d[state.xM]) * 1.08]);
  barYSc.domain(sorted.map(d => d.type));
  const isFmt = state.xM === "words_per_comment" || state.xM === "variance";
  barG.select(".bar-x-axis").transition(t).call(d3.axisBottom(barXSc).ticks(5).tickFormat(isFmt ? d3.format(".0f") : d3.format(".3f")));
  barG.select(".bar-y-axis").transition(t).call(d3.axisLeft(barYSc).tickSize(0).tickPadding(5));
  barG.select(".bar-x-lbl").transition(t).text(METRIC_META[state.xM].label);
  barG.select(".bar-y-axis").selectAll(".tick text")
    .attr("fill", d => state.sel && d === state.sel.type ? "#fff" : "#383858")
    .attr("font-weight", d => state.sel && d === state.sel.type ? "700" : "400");

  const inBr = d => !state.brushRange || (d[state.xM] >= state.brushRange[0] && d[state.xM] <= state.brushRange[1]);
  const barsG = barG.select(".bars-g");

  let bars = barsG.selectAll("rect.bar").data(sorted, d => d.type);
  const bEnt = bars.enter().append("rect").attr("class","bar")
    .attr("x",0).attr("y",d=>barYSc(d.type)).attr("height",barYSc.bandwidth())
    .attr("width",0).attr("rx",2).attr("fill",d=>COLORS[d.temperament]).style("cursor","pointer")
    .on("mouseover",showTip).on("mousemove",moveTip).on("mouseout",hideTip)
    .on("click",(ev,d)=>{ state.sel = state.sel && state.sel.type===d.type ? null : d; updateDetail(); render(false); });
  bars = bEnt.merge(bars);
  bars.on("mouseover",showTip).on("mousemove",moveTip).on("mouseout",hideTip);
  bars.transition(t)
    .attr("y",d=>barYSc(d.type)).attr("height",barYSc.bandwidth())
    .attr("width",d=>barXSc(d[state.xM])).attr("fill",d=>COLORS[d.temperament])
    .attr("opacity",d=>!inBr(d)?0.15:state.sel&&d.type===state.sel.type?1:0.72)
    .attr("stroke",d=>state.sel&&d.type===state.sel.type?"#fff":"none").attr("stroke-width",1.5);
  bars.exit().transition(t).attr("width",0).remove();

  let avatars = barsG.selectAll("image.bar-avatar").data(sorted, d => d.type);
  const h = barYSc.bandwidth();
  const aEnt = avatars.enter().append("image").attr("class","bar-avatar")
    .attr("href", d => `img/${d.type}.png`)
    .attr("preserveAspectRatio","xMidYMid slice")
    .attr("x", 1).attr("width", h).attr("height", h)
    .attr("pointer-events","none");
  avatars = aEnt.merge(avatars);
  avatars.transition(t)
    .attr("y", d => barYSc(d.type))
    .attr("height", h).attr("width", h)
    .attr("opacity", d => !inBr(d) ? 0.15 : 0.9);
  avatars.exit().remove();

  const bvalG = barG.select(".bval-g");
  let vl = bvalG.selectAll("text.bval").data(sorted, d => d.type);
  const vEnt = vl.enter().append("text").attr("class","bval")
    .attr("dominant-baseline","middle").attr("pointer-events","none")
    .attr("fill","#484868").style("font-size","9px")
    .attr("y",d=>barYSc(d.type)+barYSc.bandwidth()/2).attr("x",2)
    .text(d=>METRIC_META[state.xM].fmt(d[state.xM]));
  vl = vEnt.merge(vl);
  vl.transition(t)
    .attr("y",d=>barYSc(d.type)+barYSc.bandwidth()/2)
    .attr("x",d=>barXSc(d[state.xM])+4)
    .attr("opacity",d=>inBr(d)?0.8:0.18)
    .text(d=>METRIC_META[state.xM].fmt(d[state.xM]));
  vl.exit().remove();
}

// ════════════════════════════════════════════════════════════════════════════
// DONUT CHART — d3.pie + d3.arc, click-to-filter temperament groups
// ════════════════════════════════════════════════════════════════════════════
function drawDonut() {
  const card = document.getElementById("donut-card");
  const W = Math.max(220, card.clientWidth - 4);
  const outerR=56, innerR=24, cx=W/2, cy=outerR+18, H=cy+outerR+36;
  const temps = ["NF","NT","SF","ST"];
  const td = temps.map(t => ({ t, count: d3.sum(data.filter(d=>d.temperament===t), d=>d.count) }));
  const pie     = d3.pie().value(d=>d.count).sort(null).padAngle(0.025);
  const arcPath = d3.arc().innerRadius(innerR).outerRadius(outerR).cornerRadius(3);
  const arcHov  = d3.arc().innerRadius(innerR).outerRadius(outerR+6).cornerRadius(3);
  const dsvg    = d3.select("#donut-chart").attr("width",W).attr("height",H);
  dsvg.selectAll("*").remove();
  const dg   = dsvg.append("g").attr("transform",`translate(${cx},${cy})`);
  const arcs = pie(td);
  const total = d3.sum(data, x => x.count);
  const cCnt = dg.append("text").attr("text-anchor","middle").attr("y",-3)
    .attr("fill","#dde1ec").style("font-size","13px").style("font-weight","700")
    .text(state.donutFilter ? d3.sum(data.filter(x=>x.temperament===state.donutFilter),x=>x.count).toLocaleString() : total.toLocaleString());
  const cLbl = dg.append("text").attr("text-anchor","middle").attr("y",12)
    .attr("fill","#484868").style("font-size","9px").text(state.donutFilter || "all types");
  dg.selectAll("path.darc").data(arcs).enter().append("path").attr("class","darc")
    .attr("d",arcPath).attr("fill",d=>COLORS[d.data.t])
    .attr("stroke","#0b0b16").attr("stroke-width",2)
    .attr("opacity",d=>!state.donutFilter||state.donutFilter===d.data.t?0.9:0.2)
    .style("cursor","pointer")
    .on("mouseover",function(ev,d){ d3.select(this).attr("d",arcHov(d)); cCnt.text(d.data.count.toLocaleString()); cLbl.text(d.data.t); })
    .on("mouseout",function(ev,d){ d3.select(this).attr("d",arcPath(d)); cCnt.text(state.donutFilter?d3.sum(data.filter(x=>x.temperament===state.donutFilter),x=>x.count).toLocaleString():total.toLocaleString()); cLbl.text(state.donutFilter||"all types"); })
    .on("click",function(ev,d){ state.donutFilter=state.donutFilter===d.data.t?null:d.data.t; drawDonut(); render(); });
  arcs.forEach(ad => {
    const pct=(ad.data.count/total*100).toFixed(0), [lx,ly]=arcPath.centroid(ad);
    dg.append("text").attr("x",lx).attr("y",ly).attr("text-anchor","middle").attr("dominant-baseline","middle")
      .attr("fill","#fff").style("font-size","9px").style("font-weight","700").attr("pointer-events","none").text(`${pct}%`);
  });
  const ls=(W-20)/4, lg=dsvg.append("g").attr("transform",`translate(10,${cy+outerR+12})`);
  temps.forEach((t,i)=>{
    const item=lg.append("g").attr("transform",`translate(${i*ls},0)`);
    item.append("rect").attr("width",8).attr("height",8).attr("rx",1).attr("fill",COLORS[t])
      .attr("opacity",!state.donutFilter||state.donutFilter===t?0.9:0.2);
    item.append("text").attr("x",11).attr("y",8)
      .attr("fill",!state.donutFilter||state.donutFilter===t?"#888":"#383858").style("font-size","9px").text(t);
  });
}

// ════════════════════════════════════════════════════════════════════════════
// TOOLTIP
// ════════════════════════════════════════════════════════════════════════════
const tip = d3.select("#tip");
function showTip(event, d) {
  tip.classed("show",true).html(`
    <div class="tip-head" style="color:${COLORS[d.temperament]}">${d.type} — ${ROLES[d.type]}</div>
    <div class="tip-row"><span class="tip-k">Users</span><span class="tip-v">${d.count.toLocaleString()}</span></div>
    <div class="tip-row"><span class="tip-k">Words/Post</span><span class="tip-v">${d.words_per_comment.toFixed(1)}</span></div>
    <div class="tip-row"><span class="tip-k">Links/Post</span><span class="tip-v">${d.http_per_comment.toFixed(4)}</span></div>
    <div class="tip-row"><span class="tip-k">Questions/Post</span><span class="tip-v">${d.qm_per_comment.toFixed(4)}</span></div>
    <div class="tip-row"><span class="tip-k">Variability</span><span class="tip-v">${d.variance.toFixed(1)}</span></div>`);
}
function moveTip(event) { tip.style("left",(event.clientX+14)+"px").style("top",(event.clientY-18)+"px"); }
function hideTip() { tip.classed("show",false); }

// ════════════════════════════════════════════════════════════════════════════
// OPACITY  (AND-logic across all active filters)
// ════════════════════════════════════════════════════════════════════════════
function opacity(d) {
  const passHl = !state.hl          || d[state.hl.dim] === state.hl.val;
  const passDf = !state.donutFilter || d.temperament   === state.donutFilter;
  const passBr = !state.brushRange  || (d[state.xM] >= state.brushRange[0] && d[state.xM] <= state.brushRange[1]);
  return (passHl && passDf && passBr) ? 0.95 : 0.1;
}

// ════════════════════════════════════════════════════════════════════════════
// SCALES
// ════════════════════════════════════════════════════════════════════════════
function updateScales() {
  const xExt = d3.extent(data, d => d[state.xM]);
  const yExt = d3.extent(data, d => d[state.yM]);
  const xPad = (xExt[1]-xExt[0]) * 0.14;
  const yPad = (yExt[1]-yExt[0]) * 0.14;
  xSc.domain([xExt[0]-xPad, xExt[1]+xPad]);
  ySc.domain([yExt[0]-yPad, yExt[1]+yPad]);
  sizeSc.domain([0, d3.max(data, d => d.count)]);
}

// ════════════════════════════════════════════════════════════════════════════
// CHART GUIDE — updates the axis guide card in HTML
// ════════════════════════════════════════════════════════════════════════════
function updateChartGuide() {
  const xEl   = document.getElementById("guide-x-label");
  const yEl   = document.getElementById("guide-y-label");
  const xDesc = document.getElementById("guide-x-desc");
  const yDesc = document.getElementById("guide-y-desc");
  if (xEl)   xEl.textContent   = METRIC_META[state.xM].label;
  if (yEl)   yEl.textContent   = METRIC_META[state.yM].label;
  if (xDesc) xDesc.textContent = METRIC_DESC[state.xM];
  if (yDesc) yDesc.textContent = METRIC_DESC[state.yM];
}

// ════════════════════════════════════════════════════════════════════════════
// RENDER — scatter with avatar bubbles
// ════════════════════════════════════════════════════════════════════════════
function render(animate = true) {
  const dur = animate ? 750 : 0;
  const t   = d3.transition().duration(dur).ease(d3.easeCubicInOut);

  updateScales();
  updateChartGuide();
  const zx = currentZoomTransform.rescaleX(xSc);
  const zy = currentZoomTransform.rescaleY(ySc);
  const isFmt = k => k === "words_per_comment" || k === "variance";

  xGrid.transition(t).call(d3.axisBottom(zx).ticks(6).tickSize(-dims.h).tickFormat("")).call(gg=>gg.select(".domain").remove());
  yGrid.transition(t).call(d3.axisLeft(zy).ticks(6).tickSize(-dims.w).tickFormat("")).call(gg=>gg.select(".domain").remove());
  xAxisG.transition(t).call(d3.axisBottom(zx).ticks(6).tickFormat(isFmt(state.xM) ? d3.format(".0f") : d3.format(".3f")));
  yAxisG.transition(t).call(d3.axisLeft(zy).ticks(6).tickFormat(isFmt(state.yM) ? d3.format(".0f") : d3.format(".3f")));
  xLbl.transition(t).text(METRIC_META[state.xM].label);
  yLbl.transition(t).text(METRIC_META[state.yM].label);

  const strokeW = d => state.sel && d.type === state.sel.type ? 3.5 : 1.8;
  const strokeC = d => state.sel && d.type === state.sel.type ? "#ffffff" : COLORS[d.temperament];

  data.forEach(d => {
    const r = sizeSc(d.count);
    scatterDefs.select(`#clip-${d.type} circle`).attr("r", r);
  });

  let groups = bubblesG.selectAll("g.bubble").data(data, d => d.type);

  const entered = groups.enter().append("g").attr("class","bubble")
    .attr("transform", d => `translate(${zx(d[state.xM])},${zy(d[state.yM])})`)
    .style("cursor","pointer")
    .on("mouseover", showTip).on("mousemove", moveTip).on("mouseout", hideTip)
    .on("click", (event, d) => {
      state.sel = state.sel && state.sel.type === d.type ? null : d;
      updateDetail(); render();
    });

  entered.append("circle").attr("class","bubble-bg")
    .attr("r", 0).attr("fill", d => COLORS[d.temperament]).attr("opacity", 0.4);

  entered.append("image").attr("class","bubble-img")
    .attr("href", d => `img/${d.type}.png`)
    .attr("preserveAspectRatio","xMidYMid slice")
    .attr("clip-path", d => `url(#clip-${d.type})`);

  entered.append("circle").attr("class","bubble-ring")
    .attr("r", 0).attr("fill","none")
    .attr("stroke", d => strokeC(d)).attr("stroke-width", d => strokeW(d));

  entered.append("circle").attr("class","bubble-hit")
    .attr("r", 0).attr("fill","transparent").attr("stroke","none");

  groups = entered.merge(groups);
  groups.on("mouseover", showTip).on("mousemove", moveTip).on("mouseout", hideTip);

  groups.transition(t)
    .attr("transform", d => `translate(${zx(d[state.xM])},${zy(d[state.yM])})`)
    .attr("opacity", d => opacity(d));

  groups.select("circle.bubble-bg").transition(t).attr("r", d => sizeSc(d.count));

  groups.select("image.bubble-img").transition(t)
    .attr("x",      d => -sizeSc(d.count))
    .attr("y",      d => -sizeSc(d.count))
    .attr("width",  d => sizeSc(d.count) * 2)
    .attr("height", d => sizeSc(d.count) * 2);

  groups.select("circle.bubble-ring").transition(t)
    .attr("r",            d => sizeSc(d.count))
    .attr("stroke",       d => strokeC(d))
    .attr("stroke-width", d => strokeW(d));

  groups.select("circle.bubble-hit").transition(t).attr("r", d => sizeSc(d.count));

  let lbls = labelsG.selectAll("text.blabel").data(data, d => d.type);
  const lEnt = lbls.enter().append("text").attr("class","blabel")
    .attr("text-anchor","middle")
    .attr("fill","#fff").attr("pointer-events","none")
    .attr("x", d => zx(d[state.xM]))
    .attr("y", d => zy(d[state.yM]) + sizeSc(d.count) + 11)
    .style("font-size","9px").style("font-weight","700")
    .style("text-shadow","0 1px 4px rgba(0,0,0,0.9)")
    .text(d => d.type);
  lbls = lEnt.merge(lbls);
  lbls.transition(t)
    .attr("x", d => zx(d[state.xM]))
    .attr("y", d => zy(d[state.yM]) + sizeSc(d.count) + 11)
    .attr("opacity", d => opacity(d));

  updateAnnotations(zx, zy);
  drawBar(animate);
}

// ════════════════════════════════════════════════════════════════════════════
// DETAIL PANEL + RADAR — custom SVG polygon spider chart on type click
// ════════════════════════════════════════════════════════════════════════════
const DIM_DESC = {
  E: "Extraversion — directs energy outward to people and activity",
  I: "Introversion — directs energy inward to ideas and reflection",
  N: "Intuition — takes in information through patterns and the big picture",
  S: "Sensing — takes in information through concrete facts and details",
  T: "Thinking — makes decisions objectively through logic and analysis",
  F: "Feeling — makes decisions empathetically through values and impact",
  J: "Judging — approaches the world with structure and a preference for closure",
  P: "Perceiving — approaches the world flexibly and stays open to new information"
};

function updateDetail() {
  const card = document.getElementById("detail-card");
  const d    = state.sel;
  if (!d) {
    card.innerHTML = '<div class="placeholder">Click any bubble or bar to explore that type\'s writing profile.</div>';
    const ac = document.getElementById("avatar-card");
    if (ac) ac.style.display = "none";
    return;
  }
  const col = COLORS[d.temperament];

  const avatarCard = document.getElementById("avatar-card");
  const avatarImg  = document.getElementById("avatar-img");
  const avatarName = document.getElementById("avatar-name");
  const avatarRole = document.getElementById("avatar-role");
  if (avatarCard) {
    avatarCard.style.display = "flex";
    avatarCard.style.borderColor = col;
    avatarImg.src = `img/${d.type}.png`;
    avatarImg.alt = d.type;
    avatarName.textContent = d.type;
    avatarName.style.color = col;
    avatarRole.textContent = `${ROLES[d.type]} · ${d.temperament}`;
  }

  card.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <img src="img/${d.type}.png" width="54" height="54"
           style="border-radius:50%;border:2px solid ${col};object-fit:cover;flex-shrink:0;" />
      <div>
        <div class="d-type" style="color:${col}">${d.type}</div>
        <div class="d-role">${ROLES[d.type]} · ${d.temperament}</div>
      </div>
    </div>
    <div class="d-dims" style="line-height:2">
      <span class="trait-pill" onmouseenter="document.getElementById('trait-desc').textContent='${DIM_DESC[d.E_I]}'" onmouseleave="document.getElementById('trait-desc').textContent=''">${d.E_I==="I"?"Introvert":"Extravert"}</span> ·
      <span class="trait-pill" onmouseenter="document.getElementById('trait-desc').textContent='${DIM_DESC[d.N_S]}'" onmouseleave="document.getElementById('trait-desc').textContent=''">${d.N_S==="N"?"Intuitive":"Sensing"}</span> ·
      <span class="trait-pill" onmouseenter="document.getElementById('trait-desc').textContent='${DIM_DESC[d.T_F]}'" onmouseleave="document.getElementById('trait-desc').textContent=''">${d.T_F==="T"?"Thinking":"Feeling"}</span> ·
      <span class="trait-pill" onmouseenter="document.getElementById('trait-desc').textContent='${DIM_DESC[d.J_P]}'" onmouseleave="document.getElementById('trait-desc').textContent=''">${d.J_P==="J"?"Judging":"Perceiving"}</span>
    </div>
    <div id="trait-desc" style="font-size:0.72rem;color:#4ecdc4;min-height:2.2em;line-height:1.5;margin-bottom:8px;font-style:italic;"></div>
    <div class="stat"><span class="stat-k">Users in dataset</span><span class="stat-v">${d.count.toLocaleString()}</span></div>
    <div class="stat"><span class="stat-k">Words per post</span><span class="stat-v">${d.words_per_comment.toFixed(1)}</span></div>
    <div class="stat"><span class="stat-k">Links per post</span><span class="stat-v">${d.http_per_comment.toFixed(4)}</span></div>
    <div class="stat"><span class="stat-k">Questions per post</span><span class="stat-v">${d.qm_per_comment.toFixed(4)}</span></div>
    <div class="stat" style="border:none"><span class="stat-k">Writing variability</span><span class="stat-v">${d.variance.toFixed(1)}</span></div>
    <div id="radar-wrap"><div class="r-title">Writing Profile vs. Average (normalized)</div></div>`;
  drawRadar(d, col);
}

function drawRadar(d, col) {
  const W=236, H=200, cx=W/2, cy=H/2, R=70;
  const axes=[
    {key:"words_per_comment",lbl:"Verbosity"},
    {key:"http_per_comment", lbl:"Sharing"  },
    {key:"qm_per_comment",   lbl:"Curiosity"},
    {key:"variance",         lbl:"Variability"}
  ];
  const N=axes.length, as=(Math.PI*2)/N;
  const norm=k=>{const[lo,hi]=d3.extent(data,x=>x[k]);return(d[k]-lo)/(hi-lo);};
  const avg =k=>{const[lo,hi]=d3.extent(data,x=>x[k]);return(d3.mean(data,x=>x[k])-lo)/(hi-lo);};
  const c=d3.select("#radar-wrap"); c.selectAll("svg.radar").remove();
  const rs=c.append("svg").attr("class","radar").attr("width",W).attr("height",H);
  const rg=rs.append("g").attr("transform",`translate(${cx},${cy})`);
  [0.25,0.5,0.75,1].forEach(l=>
    rg.append("circle").attr("r",R*l).attr("fill","none").attr("stroke","#1a1a2e").attr("stroke-width",1));
  axes.forEach((m,i)=>{
    const a=as*i-Math.PI/2;
    rg.append("line").attr("x1",0).attr("y1",0).attr("x2",R*Math.cos(a)).attr("y2",R*Math.sin(a))
      .attr("stroke","#1a1a2e").attr("stroke-width",1);
    rg.append("text").attr("x",(R+12)*Math.cos(a)).attr("y",(R+12)*Math.sin(a))
      .attr("text-anchor","middle").attr("dominant-baseline","middle")
      .attr("fill","#44445a").style("font-size","9px").text(m.lbl);
  });
  const ap=axes.map((m,i)=>{const a=as*i-Math.PI/2,v=avg(m.key);return[R*v*Math.cos(a),R*v*Math.sin(a)];});
  rg.append("polygon").attr("points",ap.map(p=>p.join(",")).join(" "))
    .attr("fill","#1a1a2e").attr("stroke","#232340").attr("stroke-width",1.5);
  const tp=axes.map((m,i)=>{const a=as*i-Math.PI/2,v=norm(m.key);return[R*v*Math.cos(a),R*v*Math.sin(a)];});
  rg.append("polygon").attr("points",tp.map(p=>p.join(",")).join(" "))
    .attr("fill",col).attr("opacity",0.25).attr("stroke",col).attr("stroke-width",2);
  tp.forEach(p=>rg.append("circle").attr("cx",p[0]).attr("cy",p[1]).attr("r",3).attr("fill",col));
  const lg=rs.append("g").attr("transform",`translate(${W-84},${H-22})`);
  lg.append("rect").attr("width",8).attr("height",8).attr("fill",col).attr("opacity",0.38).attr("y",-3);
  lg.append("text").attr("x",11).attr("fill","#44445a").style("font-size","8px").text(d.type);
  lg.append("rect").attr("width",8).attr("height",8).attr("fill","#1a1a2e").attr("stroke","#232340").attr("y",9).attr("stroke-width",1);
  lg.append("text").attr("x",11).attr("y",15).attr("fill","#333350").style("font-size","8px").text("All-type avg");
}

// ════════════════════════════════════════════════════════════════════════════
// STORY MODE
// ════════════════════════════════════════════════════════════════════════════
function applyStory(i) {
  state.storyIdx = i;
  const s = STORIES[i];
  document.getElementById("story-title").textContent = s.title;
  document.getElementById("story-sub").textContent   = s.sub;
  document.getElementById("story-ann").textContent   = s.ann;
  if (state.xM !== s.xM) { clearBrush(); resetZoom(); }
  state.xM = s.xM; state.yM = s.yM; state.hl = s.hl;
  document.getElementById("x-sel").value = s.xM;
  document.getElementById("y-sel").value = s.yM;
  document.querySelectorAll(".f-btn").forEach(b => { b.className = "f-btn"; });
  if (s.hl) {
    const b = document.querySelector(`.f-btn[data-dim="${s.hl.dim}"][data-val="${s.hl.val}"]`);
    if (b) b.classList.add("lit");
  }
  document.querySelectorAll(".s-dot").forEach((el,j) => el.classList.toggle("on", j===i));
  render(true);
}

function startPlay() {
  if (state.playing) { stopPlay(); return; }
  state.playing = true;
  document.getElementById("play-btn").textContent = "⏹ Stop";
  let i = 0; applyStory(i);
  playTimer = setInterval(() => {
    i = (i+1) % STORIES.length; applyStory(i);
    if (i === STORIES.length-1) setTimeout(stopPlay, 2200);
  }, 2000);
}

function stopPlay() {
  state.playing = false;
  document.getElementById("play-btn").textContent = "▶ Play Story";
  if (playTimer) { clearInterval(playTimer); playTimer = null; }
}

STORIES.forEach((s,i) => {
  const d = document.createElement("div");
  d.className = "s-dot"; d.title = s.title;
  d.addEventListener("click", () => { stopPlay(); applyStory(i); });
  document.getElementById("dot-row").appendChild(d);
});

function resetStoryPanel(t) {
  document.getElementById("story-title").textContent = t;
  document.getElementById("story-sub").textContent   = "Start by clicking a bubble, brushing across the ranked bars, or switching the axes to compare different writing patterns.";
  document.getElementById("story-ann").textContent   = "The strongest overall pattern is that Intuitive types generally write longer and ask more questions, while Sensing types more often cluster around shorter, more link-sharing behavior.";
  document.querySelectorAll(".s-dot").forEach(e => e.classList.remove("on"));
  state.storyIdx = -1;
}

document.getElementById("x-sel").addEventListener("change", function() {
  state.xM = this.value; clearBrush(); resetZoom(); stopPlay();
  resetStoryPanel("Custom View"); render();
});
document.getElementById("y-sel").addEventListener("change", function() {
  state.yM = this.value; stopPlay(); resetStoryPanel("Custom View"); render();
});
document.getElementById("play-btn").addEventListener("click", startPlay);
document.querySelectorAll(".f-btn").forEach(btn => {
  btn.addEventListener("click", function() {
    const dim = this.dataset.dim, val = this.dataset.val;
    const active = this.classList.contains("lit");
    document.querySelectorAll(".f-btn").forEach(b => { b.className = "f-btn"; });
    state.hl = active ? null : { dim, val };
    if (!active) this.classList.add("lit");
    stopPlay(); resetStoryPanel(`Highlighting: ${this.textContent} types`); render();
  });
});

window.addEventListener("resize", () => {
  dims = chartDims();
  svg.attr("width", dims.W).attr("height", dims.H);
  svg.select("#scatter-clip rect").attr("width", dims.w).attr("height", dims.h);
  xSc.range([0, dims.w]); ySc.range([dims.h, 0]);
  xAxisG.attr("transform", `translate(0,${dims.h})`);
  xGrid.attr("transform",  `translate(0,${dims.h})`);
  xLbl.attr("x", dims.w/2).attr("y", dims.h+42);
  yLbl.attr("x", -dims.h/2);
  render(false); drawDonut();
});

// ════════════════════════════════════════════════════════════════════════════
// DATA LOAD & INIT
// ════════════════════════════════════════════════════════════════════════════
d3.json("data/mbti.json").then(raw => {
  data = raw;

  ensureAvatarClips(data);
  initBar();
  drawDonut();
  render(false);

  // Stagger entrance animation — groups pop in with a bounce scale
  bubblesG.selectAll("g.bubble")
    .attr("transform", d => {
      const zx = currentZoomTransform.rescaleX(xSc);
      const zy = currentZoomTransform.rescaleY(ySc);
      return `translate(${zx(d[state.xM])},${zy(d[state.yM])}) scale(0)`;
    })
    .transition().duration(650).delay((_,i) => i * 40).ease(d3.easeBounceOut)
    .attr("transform", d => {
      const zx = currentZoomTransform.rescaleX(xSc);
      const zy = currentZoomTransform.rescaleY(ySc);
      return `translate(${zx(d[state.xM])},${zy(d[state.yM])}) scale(1)`;
    });

}).catch(err => {
  console.error("Data load failed:", err);
  document.getElementById("story-title").textContent = "⚠ Run via a local server (e.g. VS Code Live Server) to load data.";
  document.getElementById("story-sub").textContent = "Open the folder in VS Code → right-click index.html → Open with Live Server";
});

// ════════════════════════════════════════════════════════════════════════════
// RESIZABLE RIGHT PANEL
// ════════════════════════════════════════════════════════════════════════════
(function() {
  const handle = document.getElementById("resize-handle");
  const panel  = document.getElementById("right-panel");
  let dragging = false, startX = 0, startW = 0;

  handle.addEventListener("mousedown", e => {
    dragging = true; startX = e.clientX; startW = panel.offsetWidth;
    handle.classList.add("dragging");
    document.body.style.userSelect = "none";
  });
  document.addEventListener("mousemove", e => {
    if (!dragging) return;
    const delta = startX - e.clientX;
    const newW  = Math.max(200, Math.min(480, startW + delta));
    panel.style.width = newW + "px";
  });
  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove("dragging");
    document.body.style.userSelect = "";
    if (typeof drawDonut === "function") drawDonut();
  });
})();
