const API_BASE = "https://api.b2bleadsapi.com"

const el = {
  domainBar: document.getElementById("domain-bar"),
  noKey: document.getElementById("no-key"),
  badTab: document.getElementById("bad-tab"),
  loading: document.getElementById("loading"),
  error: document.getElementById("error"),
  errorText: document.querySelector("#error .error-text"),
  results: document.getElementById("results"),
  resultsList: document.getElementById("results-list"),
  empty: document.getElementById("empty"),
  listName: document.getElementById("list-name"),
  saveAll: document.getElementById("save-all"),
  openOptions: document.getElementById("open-options"),
  retry: document.getElementById("retry"),
}

const STATES = ["noKey", "badTab", "loading", "error", "results", "empty"]
function showState(name) {
  for (const s of STATES) el[s].classList.toggle("hidden", s !== name)
}

function hostnameFromUrl(rawUrl) {
  try {
    const u = new URL(rawUrl)
    if (!/^https?:$/.test(u.protocol)) return null
    return u.hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

function renderLeads(leads) {
  el.resultsList.innerHTML = ""
  for (const lead of leads) {
    const li = document.createElement("li")
    const parts = [lead.address, lead.phone, lead.rating ? `★ ${lead.rating}` : null].filter(Boolean)
    li.innerHTML = `
      <div class="lead-name">${escapeHtml(lead.name || "Unnamed")}</div>
      <div class="lead-detail">${escapeHtml(parts.join(" · "))}</div>
      ${lead.website ? `<div class="lead-detail"><a href="${escapeAttr(lead.website)}" target="_blank" rel="noopener">${escapeHtml(lead.website)}</a></div>` : ""}
    `
    el.resultsList.appendChild(li)
  }
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]))
}
function escapeAttr(s) {
  return escapeHtml(s)
}

let currentHostname = null
let lastLeads = []

async function runSearch(hostname, { saveToList = false, listName = "" } = {}) {
  showState("loading")
  const { apiKey } = await chrome.storage.sync.get(["apiKey"])
  if (!apiKey) {
    showState("noKey")
    return
  }
  const params = new URLSearchParams({ q: hostname, limit: "10" })
  if (saveToList) {
    params.set("save_to_list", "true")
    params.set("list_name", listName || hostname)
  }
  try {
    const res = await fetch(`${API_BASE}/v1/search-leads?${params.toString()}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (res.status === 401) {
      el.errorText.textContent = "This API key is invalid or has been revoked. Update it in settings."
      showState("error")
      return
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      el.errorText.textContent = body.error || "Something went wrong. Try again."
      showState("error")
      return
    }
    const data = await res.json()
    lastLeads = data.results || []
    if (saveToList) {
      el.saveAll.textContent = data.savedTo?.savedCount
        ? `Saved ${data.savedTo.savedCount} to "${data.savedTo.listName}"`
        : "Add all to list"
      setTimeout(() => { el.saveAll.textContent = "Add all to list" }, 2500)
    }
    if (!lastLeads.length) {
      showState("empty")
      return
    }
    renderLeads(lastLeads)
    showState("results")
  } catch {
    el.errorText.textContent = "Network error — check your connection and try again."
    showState("error")
  }
}

el.retry.addEventListener("click", () => currentHostname && runSearch(currentHostname))
el.openOptions.addEventListener("click", () => chrome.runtime.openOptionsPage())
el.saveAll.addEventListener("click", () => {
  if (!currentHostname) return
  runSearch(currentHostname, { saveToList: true, listName: el.listName.value.trim() })
})

;(async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const hostname = tab?.url ? hostnameFromUrl(tab.url) : null
  if (!hostname) {
    showState("badTab")
    return
  }
  currentHostname = hostname
  el.domainBar.textContent = hostname
  await runSearch(hostname)
})()
