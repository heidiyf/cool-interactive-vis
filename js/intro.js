// ════════════════════════════════════════════════════════════════════════════
// Type in Every Line — MBTI Explorer  |  js/intro.js
// CSC316 Assignment 3 — Interactive Visualization
// Author: Heidi Wang
// Hero section: animated star canvas, MBTI quiz, custom cursor
// ════════════════════════════════════════════════════════════════════════════

// ── TYPE LOOKUP TABLES ──
const INTRO_ROLES = {
  INFJ:"The Advocate",    INFP:"The Mediator",     INTJ:"The Architect",   INTP:"The Logician",
  ENFJ:"The Protagonist", ENFP:"The Campaigner",   ENTJ:"The Commander",   ENTP:"The Debater",
  ISFJ:"The Defender",    ISFP:"The Adventurer",   ISTJ:"The Logistician", ISTP:"The Virtuoso",
  ESFJ:"The Consul",      ESFP:"The Entertainer",  ESTJ:"The Executive",   ESTP:"The Entrepreneur"
};

const TYPE_DESCS = {
  INTJ: "Strategic and private, you see the world as a chessboard of possibilities. You set ambitious goals and build meticulous plans to reach them — and you expect the same precision from others.",
  INTP: "A curious architect of ideas. You love finding logical inconsistencies and exploring abstract theories far longer than most people can follow. Boredom is your nemesis.",
  ENTJ: "A natural commander — you rally people around big goals and optimize relentlessly. Decisions come easily to you; so does stepping up when no one else will.",
  ENTP: "The inventive debater who flips ideas upside down just to see what falls out. You spot opportunities others miss and thrive on intellectual sparring.",
  INFJ: "Quietly visionary, you see beneath the surface of things and understand people's deep motivations. You're driven by a rare sense of purpose and a desire to make things meaningful.",
  INFP: "A dreamer with deep values. You seek meaning and authenticity everywhere, champion underdogs, and carry a rich inner world that few others fully see.",
  ENFJ: "The passionate mentor — warm, inspiring, and attuned to what others need to grow. You lead with heart and vision, often knowing what people need before they do.",
  ENFP: "Enthusiastic and full of ideas, you see possibilities everywhere and connect with people on a genuine, energetic level. Your curiosity is contagious.",
  ISTJ: "Dependable and thorough, you believe in doing things the right way and following through every time. Structure and reliability are your superpowers.",
  ISFJ: "The devoted protector — you notice what others need before they ask, and find deep satisfaction in caring for the people and places you love.",
  ESTJ: "An organized executive who brings order and gets things done. You step into leadership naturally and are the backbone of every team you join.",
  ESFJ: "The warm connector — you build harmony, make people feel at home, and go out of your way for the people in your life. Community is your core.",
  ISTP: "A calm, hands-on problem solver. You understand how things work and fix them with quiet efficiency, adapting to whatever comes your way.",
  ISFP: "A gentle artist living in the present moment. You express yourself through action and care, deeply in tune with the beauty around you.",
  ESTP: "Bold and quick-thinking, you thrive on action and reading people. You love taking risks and jumping into the thick of whatever's happening.",
  ESFP: "The spontaneous performer — you love life, people, and the spotlight. Your enthusiasm and warmth make every room more vibrant."
};

// ── QUIZ QUESTIONS ──
const QUIZ_QUESTIONS = [
  { dimension:"E_I", question:"At a social gathering, you typically…",
    optionA:{ text:"Chat with many people and feel energized",          value:"E" },
    optionB:{ text:"Prefer smaller conversations and feel drained after", value:"I" } },
  { dimension:"E_I", question:"When solving a problem, you prefer to…",
    optionA:{ text:"Talk it through with others first",            value:"E" },
    optionB:{ text:"Think it through alone before discussing",      value:"I" } },
  { dimension:"N_S", question:"You are more drawn to…",
    optionA:{ text:"Future possibilities and abstract ideas",      value:"N" },
    optionB:{ text:"Concrete facts and real-world details",        value:"S" } },
  { dimension:"N_S", question:"In a new situation, you first ask…",
    optionA:{ text:"What does this mean in the big picture?",      value:"N" },
    optionB:{ text:"What are the specific facts here?",            value:"S" } },
  { dimension:"T_F", question:"When making a difficult decision, you prioritize…",
    optionA:{ text:"Logic, fairness, and objective analysis",      value:"T" },
    optionB:{ text:"How the decision will affect the people involved", value:"F" } },
  { dimension:"T_F", question:"You find it easier to…",
    optionA:{ text:"Critique a flawed argument directly",          value:"T" },
    optionB:{ text:"Empathize with someone's point of view",       value:"F" } },
  { dimension:"J_P", question:"Your living or workspace is usually…",
    optionA:{ text:"Organized, tidy, and planned",                 value:"J" },
    optionB:{ text:"Flexible, spontaneous, and a bit messy",       value:"P" } },
  { dimension:"J_P", question:"When starting a project, you prefer to…",
    optionA:{ text:"Plan it out fully before beginning",           value:"J" },
    optionB:{ text:"Dive in and figure it out as you go",          value:"P" } }
];

// ── QUIZ STATE ──
let quizAnswers = {};
let currentQ    = 0;
let quizOpen    = false;
let userType    = null;

// ════════════════════════════════════════════════════════════════════════════
// STAR CANVAS (positioned in #intro-hero)
// ════════════════════════════════════════════════════════════════════════════
let stars = [];
let starAnimFrame = null;

function initStars() {
  const canvas = document.getElementById("star-canvas");
  if (!canvas) return;
  canvas.width  = canvas.parentElement.offsetWidth  || window.innerWidth;
  canvas.height = canvas.parentElement.offsetHeight || window.innerHeight;

  stars = Array.from({ length: 130 }, () => ({
    x:       Math.random() * canvas.width,
    y:       Math.random() * canvas.height,
    r:       Math.random() * 1.4 + 0.3,
    speed:   Math.random() * 0.22 + 0.06,
    opacity: Math.random() * 0.5 + 0.15,
    twinkle: Math.random() * Math.PI * 2
  }));
}

function animateStars() {
  const canvas = document.getElementById("star-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  stars.forEach(s => {
    s.twinkle += 0.018;
    const alpha = s.opacity * (0.6 + 0.4 * Math.sin(s.twinkle));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();
    s.y += s.speed;
    if (s.y > canvas.height + 2) {
      s.y = -2;
      s.x = Math.random() * canvas.width;
    }
  });

  starAnimFrame = requestAnimationFrame(animateStars);
}

window.addEventListener("resize", () => {
  const canvas = document.getElementById("star-canvas");
  const hero   = document.getElementById("intro-hero");
  if (canvas && hero) {
    canvas.width  = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }
});

// ════════════════════════════════════════════════════════════════════════════
// QUIZ LOGIC
// ════════════════════════════════════════════════════════════════════════════
function renderQuestion(index) {
  const q     = QUIZ_QUESTIONS[index];
  const total = QUIZ_QUESTIONS.length;
  const pct   = (index / total) * 100;

  const bar  = document.getElementById("quiz-progress-bar");
  const num  = document.getElementById("quiz-q-num");
  const text = document.getElementById("quiz-question");
  const opts = document.getElementById("quiz-options");

  if (bar)  bar.style.width    = pct + "%";
  if (num)  num.textContent    = `Question ${index + 1} of ${total}`;
  if (text) text.textContent   = q.question;
  if (opts) {
    opts.innerHTML = `
      <button class="quiz-option" data-dim="${q.dimension}" data-val="${q.optionA.value}">
        ${q.optionA.text}
      </button>
      <button class="quiz-option" data-dim="${q.dimension}" data-val="${q.optionB.value}">
        ${q.optionB.text}
      </button>`;
  }
}

function computeFinalType() {
  const tally = { E:0, I:0, N:0, S:0, T:0, F:0, J:0, P:0 };
  QUIZ_QUESTIONS.forEach((q, i) => {
    const val = quizAnswers[`${q.dimension}_q${i}`];
    if (val && tally[val] !== undefined) tally[val]++;
  });
  return (tally.E >= tally.I ? "E" : "I") +
         (tally.N >= tally.S ? "N" : "S") +
         (tally.T >= tally.F ? "T" : "F") +
         (tally.J >= tally.P ? "J" : "P");
}

function tempColor(type) {
  const n = type[1] === "N", t = type[2] === "T";
  if (n &&  t) return "#457B9D";
  if (n && !t) return "#F4A261";
  if (!n && !t) return "#52B788";
  return "#9B5DE5";
}

function showQuizResult(type) {
  const col  = tempColor(type);
  const role = INTRO_ROLES[type] || "";
  const desc = TYPE_DESCS[type]  || "";

  // Hide the active question section, show result
  const inner  = document.querySelector(".quiz-inner");
  const result = document.getElementById("quiz-result");
  if (inner)  inner.style.display  = "none";
  if (result) {
    result.classList.add("visible");

    const bar = document.getElementById("quiz-progress-bar");
    if (bar) bar.style.width = "100%";

    document.getElementById("result-type").textContent   = type;
    document.getElementById("result-type").style.background = `linear-gradient(135deg, ${col}, #9b5de5)`;
    document.getElementById("result-type").style.webkitBackgroundClip = "text";
    document.getElementById("result-type").style.webkitTextFillColor  = "transparent";
    document.getElementById("result-type").style.backgroundClip       = "text";

    document.getElementById("result-role").textContent   = role;
    document.getElementById("result-desc").textContent   = desc;

    const avatar = document.getElementById("result-avatar");
    avatar.src             = `img/${type}.png`;
    avatar.alt             = type;
    avatar.style.borderColor = col;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CUSTOM CURSOR
// ════════════════════════════════════════════════════════════════════════════
(function () {
  const outer = document.querySelector(".cursor-outer");
  const dot   = document.querySelector(".cursor-dot");
  if (!outer || !dot) return;

  let mx = window.innerWidth / 2,  my = window.innerHeight / 2;
  let ox = mx, oy = my;
  const LERP = 0.15;

  document.addEventListener("mousemove", e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + "px";
    dot.style.top  = my + "px";
    const isInteractive = e.target.closest(
      "button, select, a, .f-btn, .quiz-option, .trait-pill, .darc, .dim-card, .ig-card"
    );
    outer.classList.toggle("expanded", !!isInteractive);
  });

  document.addEventListener("mouseleave", () => {
    outer.style.opacity = "0"; dot.style.opacity = "0";
  });
  document.addEventListener("mouseenter", () => {
    outer.style.opacity = ""; dot.style.opacity = "";
  });

  (function loop() {
    ox += (mx - ox) * LERP;
    oy += (my - oy) * LERP;
    outer.style.left = ox + "px";
    outer.style.top  = oy + "px";
    requestAnimationFrame(loop);
  })();
})();

// ════════════════════════════════════════════════════════════════════════════
// DOM READY
// ════════════════════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {

  // Star canvas
  initStars();
  animateStars();

  // Stagger dim-card entrance animations
  document.querySelectorAll(".dim-card").forEach((card, i) => {
    card.style.animationDelay = `${0.12 + i * 0.1}s`;
  });

  // ── Quiz toggle button ──
  const quizToggle = document.getElementById("quiz-toggle");
  const quizBody   = document.getElementById("quiz-body");
  const quizArrow  = document.getElementById("quiz-toggle-arrow");

  if (quizToggle && quizBody) {
    quizToggle.addEventListener("click", () => {
      quizOpen = !quizOpen;
      quizBody.className = quizOpen ? "quiz-body-open" : "quiz-body-collapsed";
      quizArrow.className = quizOpen ? "quiz-toggle-arrow open" : "quiz-toggle-arrow";

      if (quizOpen && currentQ === 0) {
        // First open: reset + render first question
        quizAnswers = {}; currentQ = 0;
        const inner  = document.querySelector(".quiz-inner");
        const result = document.getElementById("quiz-result");
        if (inner)  inner.style.display = "";
        if (result) result.classList.remove("visible");
        renderQuestion(0);
      }
    });
  }

  // ── Quiz option clicks (event delegation) ──
  const optsContainer = document.getElementById("quiz-options");
  if (optsContainer) {
    optsContainer.addEventListener("click", e => {
      const btn = e.target.closest(".quiz-option");
      if (!btn) return;

      const dim = btn.dataset.dim;
      const val = btn.dataset.val;
      quizAnswers[`${dim}_q${currentQ}`] = val;
      currentQ++;

      if (currentQ < QUIZ_QUESTIONS.length) {
        renderQuestion(currentQ);
      } else {
        userType = computeFinalType();
        setTimeout(() => showQuizResult(userType), 280);
      }
    });
  }

  // ── "See my type in the data" button ──
  const btnJump = document.getElementById("btn-jump");
  if (btnJump) {
    btnJump.addEventListener("click", () => {
      const vizRoot = document.getElementById("viz-root");
      if (vizRoot) {
        vizRoot.scrollIntoView({ behavior: "smooth", block: "start" });
        // After scroll settles, highlight the type in the D3 viz
        setTimeout(() => {
          if (userType &&
              typeof state     !== "undefined" &&
              typeof data      !== "undefined" &&
              typeof render    === "function"  &&
              typeof updateDetail === "function") {
            const found = data.find(d => d.type === userType);
            if (found) {
              state.sel = found;
              updateDetail();
              render(false);
            }
          }
        }, 800);
      }
    });
  }

});
