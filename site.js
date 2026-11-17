const API = "https://hiring-desk.uririnathaniel.workers.dev";
const WIDGET_ID = "6af8b26302b535a26e0c9b55";
const TOKEN_KEY = "kgsseb_portal_token";

function prettyType(value) {
  return String(value || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function snippet(text, max) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length > (max || 170) ? clean.slice(0, (max || 170) - 1) + "…" : clean;
}
function posted(value) {
  if (!value) return "";
  const ms = value > 1e12 ? value : value * 1000;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}
function jobUrl(id) {
  return "/job/?id=" + encodeURIComponent(id);
}

async function loadWidget() {
  const res = await fetch(API + "/api/public/widgets/" + WIDGET_ID);
  const env = await res.json();
  return env.data || { widget: {}, roles: [] };
}

function defaultHero() {
  return "/images/careers-hero.jpg";
}

function navHtml(plate) {
  return (
    '<nav class="nav">' +
    '<a class="nav-brand' + (plate === false ? " bare" : "") + '" href="/jobs/"><img src="/images/logo.jpg" alt="KGSSEB"></a>' +
    '<div class="nav-links">' +
    '<a href="/jobs/">Home</a><a href="/jobs/">Jobs</a><a class="btn" href="/portal/">Portal</a>' +
    "</div></nav>"
  );
}

function heroHtml(opts) {
  const content = opts.content || {};
  const src = content.hero_image_url || defaultHero();
  return (
    '<section class="hero' + (opts.compact ? " compact" : "") + '">' +
    '<div class="hero-photo" style="background-image:url(\'' + src + "')\"></div>" +
    '<div class="hero-wash"></div>' +
    navHtml(opts.plate) +
    '<div class="hero-inner">' +
    (opts.kicker ? "<p>" + escapeHtml(opts.kicker) + "</p>" : "") +
    "<h1>" + escapeHtml(opts.title) + "</h1>" +
    (opts.subtitle ? '<p class="sub">' + escapeHtml(opts.subtitle) + "</p>" : "") +
    (opts.cta || "") +
    "</div>" +
    (opts.caption ? '<p class="hero-caption">' + escapeHtml(opts.caption) + "</p>" : "") +
    "</section>"
  );
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function injectJsonLd(data) {
  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.textContent = JSON.stringify(data);
  document.head.appendChild(el);
}

function footerHtml() {
  return '<footer class="footer"><a href="/jobs/">View all jobs</a> · <a href="/portal/">Candidate portal</a> · © KGSSEB</footer>';
}

async function renderListing(root) {
  const data = await loadWidget();
  const content = (data.widget && data.widget.content) || {};
  const roles = data.roles || [];
  document.title = "Jobs at KGSSEB";
  injectJsonLd({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Jobs at KGSSEB",
    url: location.origin + "/jobs/",
  });
  root.innerHTML =
    heroHtml({
      content,
      plate: content.logo_plate !== false,
      caption: content.hero_caption || "KGSSEB offices, Lokoja",
      kicker: content.hero_kicker || "Kogi State Senior Secondary Education Board",
      title: "Join us",
      subtitle: content.subtitle || "Find a meaningful role and apply online.",
      cta: '<a class="hero-cta" href="#openings">View Openings</a>',
    }) +
    '<div class="wrap" id="openings"><div class="board">' +
    '<aside class="filters-col"><h3>Filters</h3><div class="filters" id="filters"></div></aside>' +
    '<section><h2>Join us</h2><p>Current Openings</p>' +
    '<div class="search-row"><label>What<input id="q" placeholder="Job title or skill"></label>' +
    '<label>Where<input id="where" placeholder="City or country"></label>' +
    '<button type="button" id="search">Search</button></div>' +
    '<ul class="jobs" id="jobs"></ul></section></div></div>' +
    footerHtml();

  const types = unique(roles.map((r) => r.employment_type).filter(Boolean));
  const cities = unique(roles.map((r) => r.location).filter(Boolean));
  document.getElementById("filters").innerHTML =
    group("Job Type", types, "type") + group("City", cities, "city");

  function paint() {
    const q = (document.getElementById("q").value || "").toLowerCase();
    const where = (document.getElementById("where").value || "").toLowerCase();
    const typeOn = checked("type");
    const cityOn = checked("city");
    const list = roles.filter((role) => {
      const hay = [role.title, role.department, role.location, role.description].join(" ").toLowerCase();
      if (q && hay.indexOf(q) < 0) return false;
      if (where && String(role.location || "").toLowerCase().indexOf(where) < 0) return false;
      if (typeOn.length && typeOn.indexOf(role.employment_type) < 0) return false;
      if (cityOn.length && cityOn.indexOf(role.location) < 0) return false;
      return true;
    });
    document.getElementById("jobs").innerHTML = list
      .map((role) => {
        return (
          '<li><a href="' + jobUrl(role.id) + '"><h3>' + escapeHtml(role.title) + "</h3>" +
          '<p class="meta">' + escapeHtml([role.location, prettyType(role.employment_type)].filter(Boolean).join(" · ")) + "</p>" +
          (snippet(role.description) ? '<p class="blurb">' + escapeHtml(snippet(role.description)) + "</p>" : "") +
          "</a></li>"
        );
      })
      .join("");
  }
  root.addEventListener("input", paint);
  document.getElementById("search").addEventListener("click", paint);
  paint();
}

function unique(items) {
  return items.filter((item, i) => items.indexOf(item) === i);
}
function group(title, items, name) {
  if (!items.length) return "";
  return (
    '<div class="filter-group"><strong>' + title + "</strong>" +
    items
      .map((item) => '<label><input type="checkbox" data-f="' + name + '" value="' + escapeHtml(item) + '"> ' + escapeHtml(prettyType(item)) + "</label>")
      .join("") +
    "</div>"
  );
}
function checked(name) {
  return Array.from(document.querySelectorAll('input[data-f="' + name + '"]:checked')).map((el) => el.value);
}

async function renderJob(root) {
  const id = new URLSearchParams(location.search).get("id");
  const data = await loadWidget();
  const role = (data.roles || []).find((item) => String(item.id) === String(id));
  const content = (data.widget && data.widget.content) || {};
  if (!role) {
    root.innerHTML = navHtml() + '<div class="wrap"><p>Role not found.</p><a href="/jobs/">Back to jobs</a></div>';
    return;
  }
  document.title = role.title + " · KGSSEB jobs";
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", snippet(role.description, 160) || role.title);
  injectJsonLd({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: role.title,
    description: role.description || role.title,
    hiringOrganization: { "@type": "Organization", name: "KGSSEB", sameAs: location.origin },
    url: location.href,
    employmentType: String(role.employment_type || "FULL_TIME").toUpperCase(),
  });
  root.innerHTML =
    heroHtml({
      content,
      compact: true,
      plate: content.logo_plate !== false,
      caption: content.hero_caption || "KGSSEB offices, Lokoja",
      kicker: "KGSSEB" + (role.employment_type ? " | " + prettyType(role.employment_type) : ""),
      title: role.title,
      subtitle: [role.location, posted(role.date_created) ? "Posted on " + posted(role.date_created) : ""].filter(Boolean).join(" | "),
      cta: '<a class="hero-cta" href="#apply">I\'m interested</a>',
    }) +
    '<div class="wrap"><p class="crumb"><a href="/jobs/">Job listing</a> › Job details</p>' +
    '<div class="detail"><article>' +
    "<h2>Job Description</h2>" +
    (role.description ? "<p>" + escapeHtml(role.description).replace(/\n/g, "<br>") + "</p>" : "") +
    (role.requirements && role.requirements.length
      ? "<h3>What we look for</h3><ul>" + role.requirements.map((item) => "<li>" + escapeHtml(item) + "</li>").join("") + "</ul>"
      : "") +
    '<p><a class="primary" href="#apply" style="display:inline-block;text-decoration:none">I\'m interested</a></p>' +
    '</article><aside class="side"><h2>Job Information</h2>' +
    info("Date Opened", posted(role.date_created)) +
    info("Job Type", prettyType(role.employment_type)) +
    info("Department", role.department) +
    info("City", role.location) +
    "</aside></div>" +
    '<section id="apply" style="margin-top:48px"><h2>Apply</h2>' +
    '<form class="form" id="apply-form">' +
    '<input name="full_name" required placeholder="Full name">' +
    '<input name="email" type="email" required placeholder="Email">' +
    '<input name="phone" placeholder="Phone">' +
    '<input name="location" placeholder="Location">' +
    '<textarea name="experience" placeholder="A few lines about your experience"></textarea>' +
    '<label class="cv-field"><span>Résumé / CV</span><small>Upload a PDF, Word .doc, or .docx</small><input name="cv" type="file" accept=".pdf,.doc,.docx,application/pdf"></label>' +
    '<button class="primary" type="submit">Submit application</button>' +
    '<p class="error hidden" id="apply-error"></p></form></section></div>' +
    footerHtml();

  document.getElementById("apply-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const err = document.getElementById("apply-error");
    err.classList.add("hidden");
    const fd = new FormData(ev.target);
    fd.append("position_id", role.id);
    try {
      const res = await fetch(API + "/api/applications", { method: "POST", body: fd });
      const env = await res.json();
      if (!res.ok) throw new Error(env.message || "Could not submit");
      ev.target.outerHTML = '<div class="card"><p><strong>Application received.</strong></p><p><a href="/portal/">Track this application</a></p></div>';
    } catch (e) {
      err.textContent = e.message || "Could not submit";
      err.classList.remove("hidden");
    }
  });
}

function info(label, value) {
  if (!value) return "";
  return "<dt>" + escapeHtml(label) + "</dt><dd>" + escapeHtml(value) + "</dd>";
}

function token() {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}
function authHeaders() {
  return { "content-type": "application/json", authorization: "Bearer " + token() };
}

async function renderPortalLogin(root) {
  document.title = "Candidate portal · KGSSEB";
  let emailReady = false;
  try {
    const res = await fetch(API + "/api/portal/status");
    const env = await res.json();
    emailReady = Boolean(env.data && env.data.emailReady);
  } catch (e) {
    emailReady = false;
  }
  const body = emailReady
    ? '<form class="card form" id="login"><p class="meta">Enter the email you applied with. We will send a sign-in link.</p><input name="email" type="email" required placeholder="Email"><button class="primary" type="submit">Send link</button><p class="error hidden" id="login-error"></p></form>'
    : '<div class="card portal-empty"><p class="portal-kicker">Candidate portal</p><h2>Login is not available yet</h2><p>A sign-in link will be emailed once outbound email is set up for this desk. Until then, apply on the job page and the team will contact you.</p><a class="primary" href="/jobs/" style="display:inline-block;text-decoration:none;margin-top:8px">Browse open roles</a></div>';
  root.innerHTML =
    heroHtml({ compact: true, plate: true, caption: "KGSSEB offices, Lokoja", title: "Candidate portal", subtitle: emailReady ? "We will email you a sign-in link." : "Tracking opens when email is configured." }) +
    '<div class="wrap portal-login">' + body + "</div>" +
    footerHtml();
}

async function renderPortalHome(root) {
  if (!token()) {
    location.href = "/portal/";
    return;
  }
  const [appsRes, profileRes] = await Promise.all([
    fetch(API + "/api/portal/applications", { headers: authHeaders() }),
    fetch(API + "/api/portal/profile", { headers: authHeaders() }),
  ]);
  if (appsRes.status === 401 || profileRes.status === 401) {
    sessionStorage.removeItem(TOKEN_KEY);
    location.href = "/portal/";
    return;
  }
  const apps = (await appsRes.json()).data || [];
  const profile = (await profileRes.json()).data || {};
  const first = profile.first_name || "";
  const last = profile.last_name || "";
  const initial = ((first[0] || "") + (last[0] || "")).toUpperCase() || "C";
  document.title = "Your applications · KGSSEB";
  root.innerHTML =
    '<div class="portal-banner"><div class="hero-photo" style="background-image:url(\'' + defaultHero() + "')\"></div><div class=\"hero-wash\"></div>" +
    navHtml() +
    "</div>" +
    '<div class="wrap portal-desk">' +
    '<div class="portal-id"><div class="avatar">' + escapeHtml(initial) + "</div>" +
    '<div><h1>' + escapeHtml((first + " " + last).trim() || "Candidate") + "</h1>" +
    '<p class="meta">' + escapeHtml(profile.email || "") + (profile.phone ? "<br>" + escapeHtml(profile.phone) : "") + "</p></div></div>" +
    '<div class="layout"><aside class="card sidemenu">' +
    '<button class="on" data-tab="apps">Applications (' + apps.length + ")</button>" +
    '<button data-tab="profile">Profile</button>' +
    '<button data-tab="skills">Skills</button>' +
    '<a href="/jobs/" style="display:block;padding:10px 14px;color:var(--green);text-decoration:none">Jobs</a>' +
    '<button id="out">Sign out</button></aside>' +
    '<section class="card" id="pane"></section></div></div>' +
    footerHtml();

  function show(tab) {
    document.querySelectorAll(".sidemenu button[data-tab]").forEach((btn) => btn.classList.toggle("on", btn.getAttribute("data-tab") === tab));
    const pane = document.getElementById("pane");
    if (tab === "apps") {
      pane.innerHTML = apps.length
        ? apps
            .map((item) => {
              return (
                '<div class="card" style="margin-bottom:12px"><p class="meta">' +
                escapeHtml(prettyType(item.employment_type) || item.status) +
                "</p><h3 style=\"color:var(--green)\">" +
                escapeHtml(item.position_title) +
                "</h3><p class=\"meta\">" +
                escapeHtml(item.location || "") +
                "<br>Applied " +
                posted(item.applied_date) +
                "</p></div>"
              );
            })
            .join("")
        : "<p>No applications yet.</p>";
    } else if (tab === "profile") {
      pane.innerHTML =
        '<form class="form" id="profile-form">' +
        '<input name="first_name" value="' + escapeHtml(profile.first_name || "") + '" placeholder="First name">' +
        '<input name="last_name" value="' + escapeHtml(profile.last_name || "") + '" placeholder="Last name">' +
        '<input value="' + escapeHtml(profile.email || "") + '" disabled>' +
        '<input name="phone" value="' + escapeHtml(profile.phone || "") + '" placeholder="Phone">' +
        '<input name="location" value="' + escapeHtml(profile.location || "") + '" placeholder="Location">' +
        '<button class="primary" type="submit">Save profile</button></form>';
      document.getElementById("profile-form").addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.target);
        await fetch(API + "/api/portal/profile", {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({
            first_name: fd.get("first_name"),
            last_name: fd.get("last_name"),
            phone: fd.get("phone"),
            location: fd.get("location"),
          }),
        });
        location.reload();
      });
    } else {
      const skills = profile.skills || [];
      pane.innerHTML =
        '<div class="search-row"><input id="skill" placeholder="Add a skill"><button class="primary" id="add-skill" type="button">+</button></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px">' +
        skills.map((s) => '<div class="skill"><strong>' + escapeHtml(s.name) + "</strong></div>").join("") +
        "</div>";
      document.getElementById("add-skill").addEventListener("click", async () => {
        const name = document.getElementById("skill").value.trim();
        if (!name) return;
        await fetch(API + "/api/portal/profile", {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ skills: skills.concat([{ name }]) }),
        });
        location.reload();
      });
    }
  }
  root.addEventListener("click", (ev) => {
    const tab = ev.target.getAttribute && ev.target.getAttribute("data-tab");
    if (tab) show(tab);
  });
  document.getElementById("out").addEventListener("click", () => {
    sessionStorage.removeItem(TOKEN_KEY);
    location.href = "/portal/";
  });
  show("apps");
}

window.KGSSEBSite = { renderListing, renderJob, renderPortalLogin, renderPortalHome };
