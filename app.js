// 🔥 DEINE APPS SCRIPT URL HIER EINFÜGEN!
const API_URL = 'https://script.google.com/macros/s/AKfycbwhAKHfhAiP3xiqBdhnp06-7MgpANDo2E67Dy0YyXLLUnadqjVmys-pC95qumlaAyLmMQ/exec';
const APP_VERSION = '1.0.0';
let currentMatchId = null;
let gamesCache = [];

async function apiGet(params) {
  const url = API_URL + '?' + new URLSearchParams(params).toString();
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(HTTP ${res.status});
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (err) {
    console.error('apiGet error:', err);
    showError('Verbindung fehlgeschlagen: ' + err.message);
    throw err;
  }
}

async function apiPost(body) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(HTTP ${res.status});
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (err) {
    console.error('apiPost error:', err);
    showError('Speichern fehlgeschlagen: ' + err.message);
    throw err;
  }
}

function showError(msg) {
  const box = document.getElementById('global-error');
  box.textContent = msg;
  box.style.display = 'block';
  box.className = 'status error';
  setTimeout(() => box.style.display = 'none', 5000);
}

function showSuccess(msg) {
  const box = document.getElementById('global-success');
  box.textContent = msg;
  box.style.display = 'block';
  box.className = 'status success';
  setTimeout(() => box.style.display = 'none', 3000);
}

async function loadGames() {
  try {
    const data = await apiGet({ resource: 'games' });
    gamesCache = data.games || [];
    const select = document.getElementById('game-select');
    select.innerHTML = gamesCache.length ? '' : '<option>Keine Spiele gefunden</option>';
    gamesCache.forEach(game => {
      const opt = document.createElement('option');
      opt.value = game.game_id;
      opt.textContent = ${game.name} (${game.type});
      select.appendChild(opt);
    });
  } catch {}
}

async function createGameFromForm() {
  const name = document.getElementById('new-game-name').value.trim();
  if (!name) return showError('Spielname erforderlich');
  
  let rules = null;
  const rulesText = document.getElementById('new-game-rules').value.trim();
  if (rulesText) {
    try { rules = JSON.parse(rulesText); } catch { return showError('Ungültiges JSON'); }
  }

  try {
    const resp = await apiPost({
      action: 'create_game',
      name, type: document.getElementById('new-game-type').value || 'custom',
      start_score: document.getElementById('new-game-start').value,
      rules
    });
    showSuccess(Spiel erstellt: ${resp.game_id});
    document.getElementById('new-game-name').value = '';
    await loadGames();
  } catch {}
}

async function startMatch() {
  const gameId = document.getElementById('game-select').value;
  const playersInput = document.getElementById('players-input').value.trim();
  if (!gameId || !playersInput) return showError('Spiel und Spieler erforderlich');
  
  const playerIds = playersInput.split(',').map(s => s.trim()).filter(Boolean);
  try {
    const resp = await apiPost({ action: 'create_match', game_id: gameId, player_ids: playerIds });
    currentMatchId = resp.match_id;
    document.getElementById('match-info').textContent = Match ${currentMatchId} läuft;
    document.getElementById('match-info').className = 'status success';
  } catch {}
}

async function submitThrow() {
  if (!currentMatchId) return showError('Kein Match aktiv');
  const playerId = document.getElementById('throw-player-id').value.trim();
  const score = Number(document.getElementById('throw-score').value || 0);
  if (!playerId || isNaN(score)) return showError('Player ID und Score erforderlich');

  try {
    const resp = await apiPost({
      action: 'add_throw',
      match_id: currentMatchId,
      player_id: playerId,
      round: document.getElementById('throw-round').value,
      darts: document.getElementById('throw-darts').value,
      score
    });
    document.getElementById('throw-status').textContent = Wurf ${resp.throw_id} gespeichert;
    document.getElementById('throw-status').className = 'status success';
  } catch {}
}

async function loadCurrentMatchView() {
  if (!currentMatchId) return;
  try {
    const data = await apiGet({ resource: 'match', match_id: currentMatchId });
    document.getElementById('match-view').textContent = JSON.stringify(data, null, 2);
  } catch {}
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('reload-games').onclick = loadGames;
  document.getElementById('create-game-btn').onclick = createGameFromForm;
  document.getElementById('start-match-btn').onclick = startMatch;
  document.getElementById('submit-throw-btn').onclick = submitThrow;
  document.getElementById('reload-match').onclick = loadCurrentMatchView;
  
  loadGames();
  
  // Version anzeigen
  const footer = document.createElement('footer');
  footer.innerHTML = v${APP_VERSION} | <a href="${API_URL}?resource=health" target="_blank">API Status</a>;
  footer.style.cssText = 'text-align:center;padding:20px;color:#666;font-size:14px;';
  document.body.appendChild(footer);
});