/* ==========================================================================
   experiment.js  —  Forced-choice adjective/image norming study (jsPsych 7)

   Flow:  consent  ->  language screener  ->  instructions  ->  examples
          ->  65 randomized forced-choice trials  ->  save (DataPipe/OSF)
          ->  return to SONA for credit.

   Each experimental trial: one adjective + three images (neutral | weak |
   strong), randomly positioned. Participant clicks the best image.
   Correct = strong word -> strong image; weak word -> weak image.
   ========================================================================== */

/* ---------- small helpers ------------------------------------------------- */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}
function shuffle(arr) {
  return jsPsych.randomization.shuffle(arr);
}
function imgURL(file) { return CONFIG.IMAGE_BASE_URL + file; }

/* ---------- participant / session identifiers ----------------------------- */
const SONA_ID = getParam("id") || getParam("sona_id") || getParam("survey_code") || "";

/* ---------- jsPsych init -------------------------------------------------- */
const jsPsych = initJsPsych({
  on_finish: function () { /* redirect handled by the final trial */ }
});

/* ========================================================================== */
/*  Decide which of the 4 versions this participant gets.                     */
/*  Prefer DataPipe balanced assignment; fall back to random.                 */
/* ========================================================================== */
async function decideVersion() {
  const override = getParam("version");
  if (CONFIG.DEBUG && override) {
    const v = parseInt(override, 10);
    if (v >= 1 && v <= CONFIG.NUM_VERSIONS) return v;
  }
  if (CONFIG.DATAPIPE_EXPERIMENT_ID && CONFIG.DATAPIPE_EXPERIMENT_ID !== "FILL_ME") {
    try {
      const r = await fetch("https://pipe.jspsych.org/api/v2/condition", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "*/*" },
        body: JSON.stringify({ experiment_id: CONFIG.DATAPIPE_EXPERIMENT_ID })
      });
      const j = await r.json();
      if (typeof j.condition === "number") {
        return (j.condition % CONFIG.NUM_VERSIONS) + 1;   // 0-indexed -> 1..4
      }
    } catch (e) {
      console.warn("DataPipe condition request failed; using random version.", e);
    }
  }
  return Math.floor(Math.random() * CONFIG.NUM_VERSIONS) + 1;
}

/* ========================================================================== */
/*  Static screens                                                            */
/* ========================================================================== */
const consent = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="screen-narrow">
      <h2>Research Study: Words &amp; Images</h2>
      <p>You are invited to take part in a research study conducted by Chandler Nichols,
         a PhD student in the Linguistics Program at the University of South Carolina.</p>
      <p>The purpose of this study is to understand how people interpret descriptive words
         when they are matched with different images. You will see words and judge which
         image best matches each word. The study takes approximately <b>20&ndash;30 minutes</b>.</p>
      <p>You will receive SONA research credit for participating. To protect against
         fraudulent or inattentive responses, the study includes basic checks for response
         quality (attention-check items and response-time monitoring). If responses are
         determined to be non-legitimate (for example, random responding or automated/bot
         activity), you may not receive credit.</p>
      <p>Participation is voluntary. You are free not to participate or to stop at any time.
         If you withdraw before completing the study, you will not receive credit for partial
         completion. Alternative research-credit opportunities are available through your
         course instructor and the SONA system.</p>
      <p class="fineprint">Questions? Contact Chandler Nichols, Linguistics Program, University of
         South Carolina (${CONFIG.CONTACT_EMAIL}). Concerns about your rights as a research
         subject? Contact USC&rsquo;s Office of Research Compliance at (803) 777-6670.</p>
      <p><b>By clicking &ldquo;Begin Study&rdquo; you indicate that you are at least 18 years old,
         have read the information above, and voluntarily agree to participate.</b></p>
    </div>`,
  choices: ["Begin Study"],
  data: { screen: "consent" }
};

const screener = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="screen-narrow">
      <h2>Quick language question</h2>
      <p style="text-align:center;font-size:1.15rem;">
        Is English your first and primary language, used at home since birth?</p>
    </div>`,
  choices: ["Yes", "No"],
  data: { screen: "screener" },
  on_finish: function (data) {
    data.screener_english = (data.response === 0) ? "yes" : "no";
    if (data.response === 1) {
      jsPsych.endExperiment(`
        <div class="screen-narrow" style="text-align:center;">
          <h2>Thank you</h2>
          <p>This study requires participants whose first and primary language is English,
             so you are not eligible to continue.</p>
          <p>You may now close this window and choose another study in SONA. No credit is
             awarded for this study, but this will not affect your standing in any way.</p>
        </div>`);
    }
  }
};

const instructions = [
  {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="screen-narrow">
        <h2>What you&rsquo;ll do</h2>
        <p>On each screen you will see <b>one descriptive word</b> and <b>three images</b> of the
           same thing. Your job is to <b>click the single image that best represents the meaning
           of the word</b>.</p>
        <p>The three images are similar but differ in important ways. Look carefully and pick the
           one you feel best fits the word.</p>
        <p>You will do this for <b>65 words</b>. There are no trick questions &mdash; we just want
           your honest judgment.</p>
      </div>`,
    choices: ["Next"],
    data: { screen: "instructions_1" }
  },
  {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="screen-narrow">
        <h2>Match the intensity of the word</h2>
        <p>Choose the image that best matches how <b>intense or extreme</b> the word is.</p>
        <ul>
          <li>Sometimes the <b>most extreme</b> image is exactly right.</li>
          <li>Other times the word is <b>less intense</b>, so a <b>less extreme</b> image fits it
              better &mdash; the most extreme image would match only an even more intense word.</li>
        </ul>
        <p>The next two screens show one example of each. Please read the explanation on each.</p>
      </div>`,
    choices: ["See examples"],
    data: { screen: "instructions_2" }
  }
];

/* ---------- example walk-through screens ---------------------------------- */
function exampleScreen({ title, word, imgs, correctRole, explanation }) {
  const order = ["neutral", "weak", "strong"];   // fixed left->right (increasing intensity) for teaching clarity
  const cards = order.map(role => `
    <div class="ex-item ${role === correctRole ? "correct" : ""}">
      <img src="${imgURL(imgs[role])}" alt="example">
      <div class="ex-label">${role === correctRole ? "&#10004; best match" : "&nbsp;"}</div>
    </div>`).join("");
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="screen-wide">
        <h2>${title}</h2>
        <p style="text-align:center;">The word is <span class="ex-tag">example</span></p>
        <div class="adj-word" style="text-align:center;">${word}</div>
        <div class="ex-row">${cards}</div>
        <p>${explanation}</p>
      </div>`,
    choices: ["Next"],
    data: { screen: "example" }
  };
}

function buildExamples() {
  const S = CONFIG.EXAMPLE_IMAGES.speed;
  const H = CONFIG.EXAMPLE_IMAGES.height;
  return [
    // Shown FIRST — the strongest image genuinely is the best fit.
    exampleScreen({
      title: "Example 1 of 2",
      word: "fast", imgs: S, correctRole: "strong",
      explanation: `The best match for &ldquo;fast&rdquo; is the <b>highlighted</b> image &mdash; the
        car that is clearly speeding. The other two cars (one parked, one going a normal pace) are
        not going fast. <b>Sometimes the strongest image genuinely is the right choice.</b>`
    }),
    // Shown SECOND — a strong image is NOT the best fit.
    exampleScreen({
      title: "Example 2 of 2",
      word: "tall", imgs: H, correctRole: "weak",
      explanation: `The best match for &ldquo;tall&rdquo; is the <b>highlighted</b> figure. Notice it
        is <i>not</i> the tallest one &mdash; the tallest figure is better described as a
        <i>giant</i>, which goes beyond plain &ldquo;tall.&rdquo; <b>Sometimes the strongest image is
        not the right choice.</b>`
    })
  ];
}

const ready = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="screen-narrow" style="text-align:center;">
      <h2>Ready to begin</h2>
      <p>There are 65 words. Please take your time and choose the image that best represents each
         word&rsquo;s meaning and strength. There are no trick questions &mdash; just your judgment.</p>
      <p>Click below to start.</p>
    </div>`,
  choices: ["Start the study"],
  data: { screen: "ready" }
};

/* ========================================================================== */
/*  Trial factory                                                             */
/* ========================================================================== */
function buildTrial(trial, index, total) {
  // options = [{role, url}] shuffled into random left/center/right positions
  let options;
  if (trial.type === "experimental") {
    options = ["neutral", "weak", "strong"].map(role => ({ role, url: trial.images[role] }));
  } else { // control
    options = ["target", "distractor"].map(role => ({ role, url: trial.images[role] }));
  }
  options = shuffle(options);

  const choices = options.map(o => `<img src="${o.url}" class="choice-img" draggable="false">`);
  const positionNames = ["left", "center", "right"];

  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="adj-counter">Word ${index + 1} of ${total}</div>
      <div class="adj-word">${trial.adj_shown}</div>
      <div class="adj-prompt">Click the image that best represents this word.</div>`,
    choices: choices,
    button_html: '<button class="img-choice">%choice%</button>',
    data: {
      screen: "trial",
      trial_kind: trial.type,
      pair: trial.pair,
      scene: trial.scene,
      adj_shown: trial.adj_shown,
      adj_strength: trial.adj_strength,
      correct_role: trial.correct,
      // record which role sat in each on-screen position
      pos_left:   options[0] ? options[0].role : "",
      pos_center: options[1] ? options[1].role : "",
      pos_right:  options[2] ? options[2].role : ""
    },
    on_finish: function (data) {
      const chosen = options[data.response];
      data.chosen_role = chosen ? chosen.role : "";
      data.chosen_position = chosen ? positionNames[data.response] : "";
      // correctness
      if (trial.type === "control") {
        data.is_correct = (data.chosen_role === "target");
      } else {
        data.is_correct = (data.chosen_role === trial.correct);
      }
      data.rt_ms = data.rt;
    }
  };
}

/* ========================================================================== */
/*  Build & run                                                               */
/* ========================================================================== */
async function main() {
  let stim;
  try {
    stim = await fetch("stimuli.json").then(r => r.json());
  } catch (e) {
    document.body.innerHTML =
      "<p style='font-family:sans-serif;max-width:600px;margin:60px auto;'>" +
      "Could not load the study stimuli (stimuli.json). If you are testing locally, " +
      "run a local web server (e.g. <code>py -m http.server</code>) instead of opening " +
      "the file directly.</p>";
    return;
  }

  const version = await decideVersion();
  const trials = shuffle(stim.versions[String(version)].slice());

  // participant-level columns written on every row
  jsPsych.data.addProperties({
    sona_id: SONA_ID,
    version: version,
    study: "adjnorm_forced_choice",
    user_agent: navigator.userAgent
  });

  const timeline = [];

  // preload this version's images so trials are snappy
  const allImgs = [];
  trials.forEach(t => Object.values(t.images).forEach(u => allImgs.push(u)));
  if (CONFIG.EXAMPLES_ENABLED) {
    ["height", "speed"].forEach(k =>
      Object.values(CONFIG.EXAMPLE_IMAGES[k]).forEach(f => allImgs.push(imgURL(f))));
  }
  timeline.push({
    type: jsPsychPreload,
    images: allImgs,
    continue_after_error: true,
    message: "Loading study…",
    error_message: "Some images did not load, but you can continue.",
    show_progress_bar: true
  });

  timeline.push(consent);
  timeline.push(screener);
  instructions.forEach(s => timeline.push(s));
  if (CONFIG.EXAMPLES_ENABLED) buildExamples().forEach(s => timeline.push(s));
  timeline.push(ready);

  trials.forEach((t, i) => timeline.push(buildTrial(t, i, trials.length)));

  // --- save to DataPipe/OSF -------------------------------------------------
  const filename = `${SONA_ID || "anon"}_v${version}_${Date.now()}.csv`;
  const saveConfigured =
    CONFIG.DATAPIPE_EXPERIMENT_ID && CONFIG.DATAPIPE_EXPERIMENT_ID !== "FILL_ME";

  if (saveConfigured && !CONFIG.DEBUG) {
    timeline.push({
      type: jsPsychPipe,
      action: "save",
      experiment_id: CONFIG.DATAPIPE_EXPERIMENT_ID,
      filename: filename,
      data_string: () => jsPsych.data.get().csv(),
      data: { screen: "save" }
    });
  } else {
    // DEBUG / not-yet-configured: don't hit OSF; log + offer a local download
    timeline.push({
      type: jsPsychHtmlButtonResponse,
      stimulus: `<div class="screen-narrow" style="text-align:center;">
          <h2>(debug) Data not sent to OSF</h2>
          <p>DataPipe is not configured or DEBUG is on. Your data is in the browser console
             and can be downloaded below.</p></div>`,
      choices: ["Download data"],
      data: { screen: "debug_save" },
      on_finish: () => {
        console.log(jsPsych.data.get().csv());
        jsPsych.data.get().localSave("csv", filename);
      }
    });
  }

  // --- completion / SONA redirect ------------------------------------------
  const creditConfigured =
    CONFIG.SONA.CREDIT_URL && !CONFIG.SONA.CREDIT_URL.includes("FILL_ME");
  const creditURL = creditConfigured
    ? CONFIG.SONA.CREDIT_URL.replace("[SURVEY_CODE]", encodeURIComponent(SONA_ID))
    : null;

  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: () => {
      if (SONA_ID && creditURL) {
        return `<div class="screen-narrow" style="text-align:center;">
          <h2>All done — thank you!</h2>
          <p>Your responses have been saved. Click below to return to SONA and receive your credit.
             You will be redirected automatically in a few seconds.</p></div>`;
      }
      return `<div class="screen-narrow" style="text-align:center;">
          <h2>All done — thank you!</h2>
          <p>Your responses have been saved. You may now close this window.</p>
          ${SONA_ID ? "" : "<p class='fineprint'>(No SONA id was detected in the link, so there is nothing to redirect to.)</p>"}
        </div>`;
    },
    choices: (SONA_ID && creditURL) ? ["Return to SONA for credit"] : ["Finish"],
    trial_duration: (SONA_ID && creditURL) ? 6000 : null,
    data: { screen: "end" },
    on_finish: () => { if (SONA_ID && creditURL) window.location.href = creditURL; }
  });

  jsPsych.run(timeline);
}

main();
