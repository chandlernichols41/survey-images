/* ==========================================================================
   config.js  —  the ONE file you edit to deploy.
   Fill in every value marked FILL_ME, then push to GitHub Pages.
   ========================================================================== */
const CONFIG = {

  /* --- DataPipe / OSF -----------------------------------------------------
     Create a free experiment at https://pipe.jspsych.org (linked to an OSF
     project). Set "Number of conditions" = 4 there. Paste the experiment ID: */
  DATAPIPE_EXPERIMENT_ID: "d8CyxiLHLfap",

  NUM_VERSIONS: 4,

  /* --- Images -------------------------------------------------------------
     Where the survey images are hosted (trailing slash required). This must
     match the base_url baked into stimuli.json by build_stimuli.py.          */
  IMAGE_BASE_URL: "https://chandlernichols41.github.io/survey-images/",

  /* --- SONA credit --------------------------------------------------------
     In SONA, this study's "Study Information" page shows a completion / credit
     URL that looks like the one below. Copy it here EXACTLY, but replace the
     survey-code value with the literal token [SURVEY_CODE] (this code will
     substitute the participant's actual code at the end).                     */
  SONA: {
    CREDIT_URL: "https://uscpsychology.sona-systems.com/webstudy_credit.aspx?experiment_id=FILL_ME&credit_token=FILL_ME&survey_code=[SURVEY_CODE]",
  },

  /* --- Study text ---------------------------------------------------------- */
  CONTACT_EMAIL: "cn35@email.sc.edu",

  /* Show the walk-through example screens. The example images (height/speed)
     must be generated and pushed first — see README. Set false to skip them
     until those images exist.                                                 */
  EXAMPLES_ENABLED: true,

  /* Example image filenames (pushed to IMAGE_BASE_URL). Match the pipeline's
     naming so they behave like real stimuli.                                  */
  EXAMPLE_IMAGES: {
    // Example 2 (shown FIRST): speed. Word "fast" -> the extreme image is correct.
    speed: {
      neutral: "adjnorm_exampleimg_neutral_parkedcar.png",  // parked
      weak:    "adjnorm_example_normalpace_car.png",         // normal pace
      strong:  "adjnorm_example_rapid_car.png",              // fast / rapid
    },
    // Example 1 (shown SECOND): height. Word "tall" -> the MIDDLE image is correct.
    height: {
      neutral: "adjnorm_exampleimg_short_pic.png",           // short
      weak:    "adjnorm_exampleimg_tall_pic.png",            // tall
      strong:  "adjnorm_exampleimg_giant_pic.png",           // giant
    },
  },

  /* --- Development --------------------------------------------------------
     DEBUG true = allow ?version=1..4 in the URL to force a version, skip the
     DataPipe save, and log/download the data locally instead of saving to OSF.
     ALWAYS set this back to false before launch.                              */
  DEBUG: true,
};
