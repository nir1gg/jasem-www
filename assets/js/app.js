/*  آقا جاسم — landing behaviour (toybox era).
 *
 *  This file is a module: if it cannot load, the .js class is never set and
 *  the page stays fully static and fully functional. Every device here is
 *  decoration or acceleration — nothing the page *says* depends on it.
 *  The scan demo without JS is a picture of a result; with JS it is a show.
 */

/* Analytics is deferred with the behaviour module instead of inflating the
 * critical HTML. This is PostHog's queueing bootstrap; the SDK stays async. */
!function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="Ji Yi init fn mn Hr pn bn cn capture calculateEventProperties Sn register register_once register_for_session unregister unregister_for_session In getFeatureFlag getFeatureFlagPayload getFeatureFlagResult getAllFeatureFlags isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync Mn identify setPersonProperties unsetPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset shutdown setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty Cn xn createPersonProfile setInternalOrTestUser Tn hn Pn opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing debug Ur wt getPageViewId captureTraceFeedback captureTraceMetric an".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
window.posthog.init("phc_kJbr7zje6hXYZ6iqzGRzAx5gmEnuRtKxEZjobepA4iLk", {
  api_host: "https://eu.i.posthog.com",
  defaults: "2026-05-30",
  person_profiles: "always",
});

const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
root.classList.add("js");

/* ── the fake scan — a show, honest about being one ─────────────────────── */

const demo = document.getElementById("demo");
const scanBtn = document.getElementById("scan-btn");
const results = document.getElementById("demo-results");

if (demo && scanBtn && results) {
  scanBtn.addEventListener("click", () => {
    results.classList.remove("shown");
    demo.classList.remove("scanning");
    /* Force a reflow so a rescan replays the sweep from the top. */
    void demo.offsetWidth;
    demo.classList.add("scanning");
    scanBtn.disabled = true;
    setTimeout(() => {
      demo.classList.remove("scanning");
      results.classList.add("shown");
      scanBtn.disabled = false;
      scanBtn.textContent = "دوباره اسکن کن";
    }, reduced ? 0 : 1900);
  });
}

/* ── reveals: sections arrive like toys dropped on the rug ──────────────── */

const revealables = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reduced) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.18 });
  revealables.forEach((el) => observer.observe(el));
} else {
  revealables.forEach((el) => el.classList.add("in"));
}

/* ── the magnet CTA: he leans toward your cursor ────────────────────────── */

document.querySelectorAll("[data-magnet]").forEach((el) => {
  if (reduced || !matchMedia("(pointer: fine)").matches) return;
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    el.style.translate = `${x * 6}px ${y * 5}px`;
  });
  el.addEventListener("pointerleave", () => { el.style.translate = ""; });
});

/* ── the stores: tap one, get the honest surprise ───────────────────────── */

document.querySelectorAll("[data-soon]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (document.querySelector(".soon-badge")) return;
    const r = btn.getBoundingClientRect();
    const badge = document.createElement("p");
    badge.className = "soon-badge";
    badge.textContent = "به‌زودی";
    badge.style.left = r.left + r.width / 2 + "px";
    badge.style.top = r.top + r.height / 2 + "px";
    document.body.appendChild(badge);
    badge.addEventListener("animationend", (ev) => {
      if (ev.animationName === "jsm-soon-out") badge.remove();
    });
  });
});
