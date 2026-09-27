# B2BLeads Chrome Extension (MVP)

Finds business leads for the site you're currently browsing, right from the toolbar. No build step — plain Manifest V3.

## Install (unpacked, for testing)

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.
4. Click the extension icon → **Open settings**, paste an API key from [b2bleadsapi.com/app/api-keys](https://b2bleadsapi.com/app/api-keys), click **Save**.
5. Open any company website and click the extension icon.

## How it works

- Reads the active tab's page (via `chrome.scripting.executeScript`) to guess the business name — `og:site_name`, JSON-LD `Organization`/`LocalBusiness`, or the page `<title>` — since Google Places search matches on business names, not domains. Falls back to the raw hostname if extraction fails or the name search returns nothing.
- "Add all to list" resends the same search with `save_to_list=true` — the API saves the results into a list server-side in one call, no separate endpoint needed.

## Not included in this MVP

- Chrome Web Store listing — this only builds the loadable-unpacked extension. Publishing needs a Chrome Web Store developer account, icons/screenshots, and store listing copy.
- OAuth login, background sync, per-result "add to list" (single "add all" button for now).
