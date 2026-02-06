// 🔥 DEINE APPS SCRIPT URL HIER EINFÜGEN!
const API_URL = 'https://script.google.com/macros/s/AKfycbyri7DIXxJCAvDiaYLwXMKrsoP2nttPpPqPOqm5CFHLh7_lcnvwj80fE-vMRQ6ZGwxFQg/exec';
const APP_VERSION = '1.0.0';
let currentMatchId = null;
let gamesCache = [];

async function apiGet(params) {
  const url = API_URL + '?' + new URLSearchParams(params).toString();
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
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
    if (!res.ok) throw new Error('HTTP ' + res.status);
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
  if (box) {
    box.textContent = msg;
    box.style.display = 'block';
    box.className = 'status error';
    setTimeout(() => box.style.display = 'none', 5000);
  }
}

function showSuccess(msg) {
  const box = document.getElementById('global-success');
  if (box) {
    box.textContent = msg;
    box.style.display = 'block';
    box.className = 'status success';
    setTimeout(() => box.style.display = 'none', 3000);
  }
}

async function loadGames() {
  try {
    const data = await apiGet({ resource: 'games' });
    gamesCache = data.games || [];
    const select = document.getElementById('game-select');
    if (select) {
      select.innerHTML = gamesCache.length ? '' : '<option>Keine Spiele gefunden</option>';
      gamesCache.forEach(game => {
        const opt = document.createElement('option');
        opt.value = game.game_id;
        opt.textContent = `${game.name} (${game.type})`;
        select.appendChild(opt);
      });
    }
  } catch (e) {
    console.error('loadGames error:', e);
  }
}

async function quickGameStart() {
  console.log('🚀 Quick Game gestartet!');
  
  try {
    // 501 Spiel finden oder erstellen
    let game501;
    let games = await apiGet({ resource: 'games' });
    
    game501 = games.games.find(g => String(g.name).includes('501'));
    if (!game501) {
      const newGame = await apiPost({
        action: 'create_game',
        name: 'Quick 501',
        type: 'x01',
        start_score: '501',
        rules: { double_out: true }
      });
      game501 = { game_id: newGame.game_id };
    }
    
    // Match mit Spieler 1 starten
    const match = await apiPost({
      action: 'create_match',
      game_id: game501.game_id,
      player_ids: [1]
    });
    
    currentMatchId = match.match_id;
    
    const matchInfo = document.getElementById('match-info');
    if (matchInfo) {
      matchInfo.textContent = `🎯 Quick 501 läuft! Match: ${currentMatchId}`;
      matchInfo.className = 'status success';
    }
    
    showSuccess('Quick Game gestartet!');
    
  } catch (error) {
    console.error('Quick Game Fehler:', error);
    showError('Quick Game fehlgeschlagen: ' + error.message);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM geladen');
  
  // Quick Game Button
  const quickBtn = document.getElementById('quick-game-btn');
  if (quickBtn) {
    quickBtn.onclick = quickGameStart;
    console.log('✅ Quick Game Button aktiv');
  } else {
    console.error('❌ Quick Game Button nicht gefunden!');
  }
  
  // Andere Buttons
  const reloadGamesBtn = document.getElementById('reload-games');
  if (reloadGamesBtn) reloadGamesBtn.onclick = loadGames;
  
  loadGames();
});