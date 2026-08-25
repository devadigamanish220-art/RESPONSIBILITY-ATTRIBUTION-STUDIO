const defaultActors = [
  { name: 'System design', value: 35, color: '#ec765e' },
  { name: 'Operational context', value: 25, color: '#79a9c7' },
  { name: 'Human decision', value: 25, color: '#e7bd5d' },
  { name: 'Robot autonomy', value: 15, color: '#c7e86b' }
];
const defaultLog = [
  ['08:42', 'The restricted aisle was marked in the facility map, but the robot loaded a version from the previous shift.'],
  ['08:47', 'An operator override accepted the alternate route while the proximity sensor was reporting intermittent signals.'],
  ['09:03', 'Attribution weights were reviewed against the navigation log and retained as a shared contribution.']
];
const storageKey = 'responsible-robotics-assessment';
let actors = structuredClone(defaultActors);

function saveAssessment() {
  const assessment = {
    title: document.querySelector('#incidentTitle').value,
    outcome: document.querySelector('#outcome').value,
    evidence: document.querySelector('#evidence').value,
    attribution: actors
  };
  localStorage.setItem(storageKey, JSON.stringify(assessment));
  if (location.protocol.startsWith('http')) {
    fetch('/api/assessment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(assessment) }).catch(() => {});
  }
  document.querySelector('#savedState').textContent = 'Saved locally';
}

function loadAssessment() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return;
  try {
    const assessment = JSON.parse(saved);
    const savedActors = assessment.actors || assessment.attribution;
    if (Array.isArray(savedActors) && savedActors.length) actors = savedActors;
    if (assessment.title) document.querySelector('#incidentTitle').value = assessment.title;
    if (assessment.outcome) document.querySelector('#outcome').value = assessment.outcome;
    if (assessment.evidence) document.querySelector('#evidence').value = assessment.evidence;
  } catch {
    localStorage.removeItem(storageKey);
  }
}

async function loadServerAssessment() {
  if (!location.protocol.startsWith('http')) return;
  try {
    const response = await fetch('/api/assessment');
    const assessment = await response.json();
    if (!assessment) return;
    localStorage.setItem(storageKey, JSON.stringify(assessment));
    if (Array.isArray(assessment.attribution)) actors = assessment.attribution;
    if (assessment.title) document.querySelector('#incidentTitle').value = assessment.title;
    if (assessment.outcome) document.querySelector('#outcome').value = assessment.outcome;
    if (assessment.evidence) document.querySelector('#evidence').value = assessment.evidence;
    renderActors();
    renderResult();
  } catch {
    // Local storage remains the offline fallback.
  }
}

const actorsElement = document.querySelector('#actors');
const resultChart = document.querySelector('#resultChart');
const totalValue = document.querySelector('#totalValue');
const balanceBar = document.querySelector('#balanceBar');
const balanceMessage = document.querySelector('#balanceMessage');

function renderActors() {
  actorsElement.innerHTML = actors.map((actor, index) => `
    <div class="actor">
      <div class="actor-top"><span class="actor-name">${escapeHtml(actor.name)}</span><span class="actor-value">${actor.value}%</span></div>
      <div class="actor-controls">
        <input aria-label="${escapeHtml(actor.name)} responsibility" data-index="${index}" type="range" min="0" max="100" value="${actor.value}">
        <button class="remove-actor" data-remove="${index}" title="Remove source" aria-label="Remove ${escapeHtml(actor.name)}">x</button>
      </div>
    </div>`).join('');
  actorsElement.querySelectorAll('input').forEach(input => input.addEventListener('input', event => {
    actors[Number(event.target.dataset.index)].value = Number(event.target.value);
    renderActors();
    document.querySelector(`[data-index="${event.target.dataset.index}"]`)?.focus();
    renderResult();
    saveAssessment();
  }));
  actorsElement.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
    if (actors.length > 1) { actors.splice(Number(button.dataset.remove), 1); renderActors(); renderResult(); saveAssessment(); }
  }));
}
function renderResult() {
  const total = actors.reduce((sum, actor) => sum + actor.value, 0);
  totalValue.textContent = `${total}%`;
  balanceBar.style.width = `${Math.min(total, 100)}%`;
  balanceBar.style.background = total === 100 ? 'var(--lime)' : 'var(--coral)';
  balanceMessage.textContent = total === 100 ? 'Balanced attribution across the current sources.' : total < 100 ? `${100 - total}% remains unallocated.` : `${total - 100}% over the available allocation.`;
  resultChart.innerHTML = actors.map(actor => `<span class="chart-segment" style="width:${total ? actor.value / total * 100 : 0}%;background:${actor.color}"></span>`).join('');
  const legend = actors.map(actor => `<div class="legend-item"><i class="legend-color" style="background:${actor.color}"></i><div><strong>${escapeHtml(actor.name)}</strong><span>${actor.value}% attributed</span></div></div>`).join('');
  resultChart.insertAdjacentHTML('afterend', `<div class="result-legend">${legend}</div>`);
  document.querySelectorAll('.result-legend').forEach((item, index, list) => { if (index < list.length - 1) item.remove(); });
}
function renderLog() { document.querySelector('#log').innerHTML = defaultLog.map(([time, text]) => `<article class="log-entry"><time>${time} / OBSERVATION</time><p>${escapeHtml(text)}</p></article>`).join(''); }
function escapeHtml(value) { return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }

document.querySelector('#addActor').addEventListener('click', () => { actors.push({ name: 'New source', value: 0, color: '#b9aaa0' }); renderActors(); renderResult(); saveAssessment(); });
document.querySelector('#addLog').addEventListener('click', () => { const text = prompt('Observation'); if (text?.trim()) defaultLog.push([new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text.trim()]); renderLog(); });
document.querySelector('#resetButton').addEventListener('click', () => { actors = structuredClone(defaultActors); document.querySelector('#caseForm').reset(); localStorage.removeItem(storageKey); renderActors(); renderResult(); });
document.querySelector('#exportButton').addEventListener('click', () => { const payload = { title: document.querySelector('#incidentTitle').value, outcome: document.querySelector('#outcome').value, evidence: document.querySelector('#evidence').value, attribution: actors }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'responsibility-assessment.json'; link.click(); URL.revokeObjectURL(link.href); });
document.querySelectorAll('#caseForm input, #caseForm textarea').forEach(input => input.addEventListener('input', saveAssessment));
loadAssessment();
renderActors(); renderResult(); renderLog();
loadServerAssessment();
