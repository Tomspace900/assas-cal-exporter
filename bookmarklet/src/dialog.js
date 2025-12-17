/**
 * Dialog UI Module
 * Simple modal dialogs for the bookmarklet
 */

// Unique prefix to avoid CSS conflicts
const PREFIX = "assas-exp";

// Base styles injected once - matches template.html design
const BASE_STYLES = `
  .${PREFIX}-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999998;
  }
  .${PREFIX}-dialog {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    max-width: 90vw;
    max-height: 80vh;
    overflow: auto;
    min-width: 320px;
  }
  .${PREFIX}-header {
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
    font-size: 18px;
    border-radius: 16px 16px 0 0;
  }
  .${PREFIX}-body {
    padding: 20px;
  }
  .${PREFIX}-footer {
    padding: 16px 20px;
    border-top: 1px solid #e9ecef;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
  .${PREFIX}-btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s ease;
  }
  .${PREFIX}-btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  .${PREFIX}-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
  }
  .${PREFIX}-btn-secondary {
    background: #e0e0e0;
    color: #333;
  }
  .${PREFIX}-btn-secondary:hover {
    background: #d0d0d0;
  }
  .${PREFIX}-input {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }
  .${PREFIX}-input:focus {
    outline: none;
    border-color: #667eea;
  }
  .${PREFIX}-row {
    margin-bottom: 16px;
  }
  .${PREFIX}-label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #2c3e50;
  }
  .${PREFIX}-section {
    margin-bottom: 20px;
  }
  .${PREFIX}-section-title {
    font-weight: 600;
    margin-bottom: 10px;
    color: #2c3e50;
    font-size: 15px;
  }
  .${PREFIX}-checkbox-list {
    max-height: 180px;
    overflow-y: auto;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 8px 12px;
    background: #f8f9fa;
  }
  .${PREFIX}-checkbox-item {
    display: block;
    padding: 6px 0;
    cursor: pointer;
  }
  .${PREFIX}-checkbox-item:hover {
    color: #667eea;
  }
  .${PREFIX}-checkbox-item input {
    margin-right: 10px;
    accent-color: #667eea;
  }
  .${PREFIX}-info {
    background: #e7f3ff;
    border-left: 4px solid #2196f3;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;
    color: #1565c0;
  }
`;

let stylesInjected = false;

function injectStyles() {
  if (stylesInjected) return;
  const style = document.createElement("style");
  style.textContent = BASE_STYLES;
  document.head.appendChild(style);
  stylesInjected = true;
}

/**
 * Creates and shows a dialog, returns a promise that resolves with result
 * @param {Object} config - Dialog configuration
 * @returns {Promise<any>} Resolves with dialog result, rejects on cancel
 */
function showDialog(config) {
  injectStyles();

  return new Promise((resolve, reject) => {
    const overlay = document.createElement("div");
    overlay.className = `${PREFIX}-overlay`;

    const dialog = document.createElement("div");
    dialog.className = `${PREFIX}-dialog`;
    dialog.innerHTML = `
      <div class="${PREFIX}-header">${config.title || "Dialog"}</div>
      <div class="${PREFIX}-body">${config.body || ""}</div>
      <div class="${PREFIX}-footer">
        <button class="${PREFIX}-btn ${PREFIX}-btn-secondary" data-action="cancel">Annuler</button>
        <button class="${PREFIX}-btn ${PREFIX}-btn-primary" data-action="confirm">${
      config.confirmText || "OK"
    }</button>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);

    function cleanup() {
      overlay.remove();
      dialog.remove();
    }

    // Handle button clicks
    dialog.addEventListener("click", (e) => {
      const action = e.target.dataset.action;
      if (action === "cancel") {
        cleanup();
        reject(new Error("cancelled"));
      } else if (action === "confirm") {
        const result = config.onConfirm ? config.onConfirm(dialog) : true;
        cleanup();
        resolve(result);
      }
    });

    // Close on overlay click
    overlay.addEventListener("click", () => {
      cleanup();
      reject(new Error("cancelled"));
    });
  });
}

/**
 * Date range dialog
 * @returns {Promise<{startDate: string, endDate: string}>}
 */
function showDateDialog() {
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const defaultStart = `${year}-09-01`;
  const defaultEnd = `${year + 1}-08-31`;

  const body = `
    <div class="${PREFIX}-info">📅 Sélectionne la période à exporter</div>
    <div class="${PREFIX}-row">
      <label class="${PREFIX}-label">Date de début</label>
      <input type="date" class="${PREFIX}-input" id="${PREFIX}-start" value="${defaultStart}">
    </div>
    <div class="${PREFIX}-row">
      <label class="${PREFIX}-label">Date de fin</label>
      <input type="date" class="${PREFIX}-input" id="${PREFIX}-end" value="${defaultEnd}">
    </div>
  `;

  return showDialog({
    title: "🎓 Assas Calendar Exporter",
    body,
    confirmText: "Continuer",
    onConfirm: (dialog) => {
      const startDate = dialog.querySelector(`#${PREFIX}-start`).value;
      const endDate = dialog.querySelector(`#${PREFIX}-end`).value;
      return { startDate, endDate };
    },
  });
}

/**
 * Extracts unique filter options from parsed events
 * OPTION is not a group - it means "optional course"
 * @param {Array} events - Events with parsed property
 * @returns {Object} { groups: [], options: [] }
 */
function extractFilterOptions(events) {
  // Only "1" and "2" are valid groups
  const VALID_GROUPS = ["1", "2"];

  // Store events per group and per option for debug
  const groupEvents = {}; // { "1": [event1, event2, ...], "2": [...] }
  const optionEvents = {}; // { "id": { events: [...], module, staff } }
  const troncCommunEvents = []; // Events without group/option

  events.forEach((event) => {
    const p = event.parsed;

    // Check if it's a valid group (1 or 2)
    if (p.group && VALID_GROUPS.includes(p.group)) {
      if (!groupEvents[p.group]) groupEvents[p.group] = [];
      groupEvents[p.group].push(event);
    }
    // Check if it's an optional course
    else if (p.group && p.group.toUpperCase().includes("OPTION")) {
      const module = p.module || "Cours sans nom";
      const staff = p.staff || "";
      const id = `${module}|||${staff}`;

      if (!optionEvents[id]) {
        optionEvents[id] = { events: [], module, staff };
      }
      optionEvents[id].events.push(event);
    }
    // Tronc commun: no group, no option
    else {
      troncCommunEvents.push(event);
    }
  });

  // Build groups array with counts
  const groups = VALID_GROUPS.filter((g) => groupEvents[g]).map((g) => ({
    id: g,
    label: `Groupe ${g}`,
    count: groupEvents[g].length,
  }));

  // Build options array with counts
  const options = Object.entries(optionEvents)
    .map(([id, data]) => ({
      id,
      module: data.module,
      staff: data.staff,
      label: data.staff ? `${data.module} (${data.staff})` : data.module,
      count: data.events.length,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // Build tronc commun grouped by module
  const troncCommunByModule = {};
  troncCommunEvents.forEach((e) => {
    const module = e.parsed?.module || "Autre";
    if (!troncCommunByModule[module]) troncCommunByModule[module] = 0;
    troncCommunByModule[module]++;
  });

  const troncCommun = Object.entries(troncCommunByModule)
    .map(([module, count]) => ({ module, count }))
    .sort((a, b) => b.count - a.count); // Most frequent first

  return { groups, options, troncCommun, troncCommunCount: troncCommunEvents.length };
}

/**
 * Filter selection dialog with dynamic recap
 * @param {Object} options - { groups, options }
 * @param {number} totalCount - Total event count
 * @param {Array} allEvents - All parsed events for recap
 * @returns {Promise<{groups: string[], optionIds: string[]}>}
 */
function showFilterDialog(options, totalCount, allEvents) {
  // Helper to get filtered events based on current selection
  function getFilteredEvents(selectedGroups, selectedOptionIds) {
    return allEvents.filter((event) => {
      const p = event.parsed;
      const isOption = p.group && p.group.toUpperCase().includes("OPTION");

      if (isOption) {
        const module = p.module || "Cours sans nom";
        const staff = p.staff || "";
        const id = `${module}|||${staff}`;
        return selectedOptionIds.includes(id);
      } else if (p.group && ["1", "2"].includes(p.group)) {
        return selectedGroups.includes(p.group);
      }
      // Events without group/option are always included
      return true;
    });
  }

  // Build recap HTML
  function buildRecapHtml(events) {
    if (events.length === 0) {
      return `<div style="color: #999; font-style: italic;">Aucun cours sélectionné</div>`;
    }

    // Sort by date
    const sorted = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));

    // Group by month for better readability
    const byMonth = {};
    sorted.forEach((e) => {
      const date = new Date(e.start);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      if (!byMonth[monthKey]) byMonth[monthKey] = { label: monthLabel, events: [] };
      byMonth[monthKey].events.push(e);
    });

    let html = "";
    Object.values(byMonth).forEach((month) => {
      html += `<div style="font-weight: 600; margin-top: 8px; color: #667eea;">${month.label} (${month.events.length})</div>`;
      month.events.slice(0, 10).forEach((e) => {
        const date = new Date(e.start);
        const day = date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
        const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        const title = e.parsed?.module || "Cours";
        html += `<div style="font-size: 12px; padding: 2px 0;">📅 ${day} ${time} - ${escapeHtml(
          title.substring(0, 40)
        )}${title.length > 40 ? "..." : ""}</div>`;
      });
      if (month.events.length > 10) {
        html += `<div style="font-size: 11px; color: #999;">... et ${
          month.events.length - 10
        } autres</div>`;
      }
    });

    return html;
  }

  let body = `<div class="${PREFIX}-info">📊 ${totalCount} événements trouvés. Sélectionne ce que tu veux exporter.</div>`;

  // Groups section
  if (options.groups.length > 0) {
    body += `
      <div class="${PREFIX}-section">
        <div class="${PREFIX}-section-title">👥 Mon groupe</div>
        <div class="${PREFIX}-checkbox-list">
          ${options.groups
            .map(
              (g) => `
            <label class="${PREFIX}-checkbox-item">
              <input type="checkbox" name="group" value="${escapeHtml(g.id)}" checked>
              ${escapeHtml(g.label)} - ${g.count} cours
            </label>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  // Options section
  if (options.options.length > 0) {
    body += `
      <div class="${PREFIX}-section">
        <div class="${PREFIX}-section-title">📚 Mes options</div>
        <div class="${PREFIX}-checkbox-list">
          ${options.options
            .map(
              (opt) => `
            <label class="${PREFIX}-checkbox-item">
              <input type="checkbox" name="option" value="${escapeHtml(opt.id)}" checked>
              ${escapeHtml(opt.label)} - ${opt.count} cours
            </label>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  // Tronc commun section (informational, always included)
  if (options.troncCommun && options.troncCommun.length > 0) {
    body += `
      <div class="${PREFIX}-section">
        <div class="${PREFIX}-section-title">📖 Tronc commun - ${
      options.troncCommunCount
    } cours</div>
        <div class="${PREFIX}-checkbox-list" style="background: #f0f7ff; border-color: #c4dff7;">
          ${options.troncCommun
            .map(
              (tc) => `
            <div style="padding: 4px 0; font-size: 13px;">
              📘 ${escapeHtml(tc.module)} - ${tc.count} cours
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  // Recap section
  const initialGroups = options.groups.map((g) => g.id);
  const initialOptions = options.options.map((o) => o.id);
  const initialFiltered = getFilteredEvents(initialGroups, initialOptions);

  body += `
    <div class="${PREFIX}-section">
      <div class="${PREFIX}-section-title">📋 Récap : <span id="${PREFIX}-recap-count">${
    initialFiltered.length
  }</span> cours à exporter</div>
      <div id="${PREFIX}-recap" class="${PREFIX}-checkbox-list" style="max-height: 200px; font-size: 13px;">
        ${buildRecapHtml(initialFiltered)}
      </div>
    </div>
  `;

  return new Promise((resolve, reject) => {
    injectStyles();

    const overlay = document.createElement("div");
    overlay.className = `${PREFIX}-overlay`;

    const dialog = document.createElement("div");
    dialog.className = `${PREFIX}-dialog`;
    dialog.innerHTML = `
      <div class="${PREFIX}-header">🎯 Filtrer les événements</div>
      <div class="${PREFIX}-body">${body}</div>
      <div class="${PREFIX}-footer">
        <button class="${PREFIX}-btn ${PREFIX}-btn-secondary" data-action="cancel">Annuler</button>
        <button class="${PREFIX}-btn ${PREFIX}-btn-primary" data-action="confirm">Exporter</button>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);

    // Update recap when checkboxes change
    function updateRecap() {
      const selectedGroups = [...dialog.querySelectorAll('input[name="group"]:checked')].map(
        (cb) => cb.value
      );
      const selectedOptionIds = [...dialog.querySelectorAll('input[name="option"]:checked')].map(
        (cb) => cb.value
      );
      const filtered = getFilteredEvents(selectedGroups, selectedOptionIds);

      const recapEl = dialog.querySelector(`#${PREFIX}-recap`);
      const countEl = dialog.querySelector(`#${PREFIX}-recap-count`);
      if (recapEl) recapEl.innerHTML = buildRecapHtml(filtered);
      if (countEl) countEl.textContent = filtered.length;
    }

    // Add change listeners
    dialog.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", updateRecap);
    });

    function cleanup() {
      overlay.remove();
      dialog.remove();
    }

    dialog.addEventListener("click", (e) => {
      const action = e.target.dataset.action;
      if (action === "cancel") {
        cleanup();
        reject(new Error("cancelled"));
      } else if (action === "confirm") {
        const selectedGroups = [...dialog.querySelectorAll('input[name="group"]:checked')].map(
          (cb) => cb.value
        );
        const selectedOptionIds = [...dialog.querySelectorAll('input[name="option"]:checked')].map(
          (cb) => cb.value
        );
        cleanup();
        resolve({ groups: selectedGroups, optionIds: selectedOptionIds });
      }
    });

    overlay.addEventListener("click", () => {
      cleanup();
      reject(new Error("cancelled"));
    });
  });
}

/**
 * Filters events based on user selection
 * @param {Array} events - Events with parsed property
 * @param {Object} filters - { groups, optionIds }
 * @returns {Array} Filtered events
 */
function filterEvents(events, filters) {
  return events.filter((event) => {
    const p = event.parsed;

    // Is this an optional course?
    const isOption = p.group && p.group.toUpperCase().includes("OPTION");

    if (isOption) {
      // Check if this option is selected
      const module = p.module || "Cours sans nom";
      const staff = p.staff || "";
      const id = `${module}|||${staff}`;
      const included = filters.optionIds?.includes(id) ?? true;
      return included;
    } else if (p.group) {
      // Regular group - check if selected
      const included = filters.groups?.includes(p.group) ?? true;
      return included;
    }

    // No group info - include by default (meetings, etc.)
    return true;
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Export for Node.js (bundler)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    showDateDialog,
    showFilterDialog,
    extractFilterOptions,
    filterEvents,
  };
}
