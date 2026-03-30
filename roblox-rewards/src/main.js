import './style.css'

const STORAGE_KEY = 'roblox-rewards-save-v1'

const rewardsCatalog = {
  hats: [
    { id: 'hat-sun', name: 'Sunny Cap', cost: 20, icon: '🧢' },
    { id: 'hat-crown', name: 'Pixel Crown', cost: 45, icon: '👑' },
    { id: 'hat-rocket', name: 'Rocket Helmet', cost: 75, icon: '🚀' },
  ],
  glasses: [
    { id: 'glasses-cool', name: 'Cool Glasses', cost: 18, icon: '🕶️' },
    { id: 'glasses-star', name: 'Star Specs', cost: 40, icon: '🤩' },
  ],
  pets: [
    { id: 'pet-spark', name: 'Spark Fox', cost: 35, icon: '🦊' },
    { id: 'pet-cloud', name: 'Cloud Bunny', cost: 55, icon: '🐰' },
    { id: 'pet-dragon', name: 'Mini Dragon', cost: 95, icon: '🐉' },
  ],
  trails: [
    { id: 'trail-rainbow', name: 'Rainbow Trail', cost: 30, icon: '🌈' },
    { id: 'trail-stars', name: 'Star Trail', cost: 50, icon: '✨' },
  ],
  outfits: [
    { id: 'outfit-hero', name: 'Hero Cape', cost: 25, icon: '🦸' },
    { id: 'outfit-ninja', name: 'Shadow Ninja', cost: 60, icon: '🥷' },
    { id: 'outfit-knight', name: 'Sky Knight', cost: 88, icon: '🛡️' },
  ],
  skins: [
    { id: 'skin-robot', name: 'Robo Buddy', cost: 70, icon: '🤖' },
    { id: 'skin-space', name: 'Space Hero', cost: 100, icon: '👨‍🚀' },
  ],
}

const baseGame = {
  laneCount: 3,
  position: { x: 0, lane: 1 },
  finishX: 8,
  obstacles: [
    { id: 'o1', x: 2, lane: 0, kind: 'block' },
    { id: 'o2', x: 4, lane: 1, kind: 'slime' },
    { id: 'o3', x: 6, lane: 2, kind: 'block' },
    { id: 'o4', x: 7, lane: 1, kind: 'slime' },
  ],
  coins: [
    { id: 'c1', x: 1, lane: 1, collected: false },
    { id: 'c2', x: 3, lane: 2, collected: false },
    { id: 'c3', x: 5, lane: 0, collected: false },
    { id: 'c4', x: 7, lane: 2, collected: false },
  ],
  steps: 0,
}

const defaultState = {
  profile: {
    name: 'Aarav',
    level: 1,
    stars: 0,
    coins: 25,
    gems: 0,
    xp: 0,
    nextLevelXp: 100,
    streak: 1,
    correctAnswers: 0,
    totalAnswers: 0,
  },
  settings: {
    age: 8,
    difficulty: 'easy',
    sound: true,
    safeLocalMode: true,
    timeLimit: 20,
  },
  quests: [
    { id: 'math', title: 'Solve 3 math puzzles', progress: 0, total: 3, reward: { coins: 10 } },
    { id: 'english', title: 'Finish 2 word challenges', progress: 0, total: 2, reward: { gems: 1 } },
    { id: 'play', title: 'Cross the sky path', progress: 0, total: 100, reward: { stars: 8 } },
  ],
  unlockedItems: ['hat-sun'],
  equipped: {
    hat: 'hat-sun',
    glasses: null,
    pet: null,
    trail: null,
    outfit: null,
    skin: null,
  },
  activeTab: 'home',
  activePuzzleSet: 'math',
  currentPuzzle: null,
  lastResult: null,
  recentRewards: [],
  game: structuredClone(baseGame),
}

let state = loadState()
ensurePuzzle()
normalizeGameState()

const app = document.querySelector('#app')
let keyboardBound = false

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultState))
}

function loadState() {
  const base = cloneDefaultState()

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return base

    const parsed = JSON.parse(saved)
    return {
      ...base,
      ...parsed,
      profile: { ...base.profile, ...(parsed.profile || {}) },
      settings: { ...base.settings, ...(parsed.settings || {}) },
      equipped: { ...base.equipped, ...(parsed.equipped || {}) },
      quests: Array.isArray(parsed.quests) ? parsed.quests : base.quests,
      unlockedItems: Array.isArray(parsed.unlockedItems) ? parsed.unlockedItems : base.unlockedItems,
      recentRewards: Array.isArray(parsed.recentRewards) ? parsed.recentRewards : [],
      game: {
        ...structuredClone(baseGame),
        ...(parsed.game || {}),
        position: { ...structuredClone(baseGame).position, ...(parsed.game?.position || {}) },
      },
    }
  } catch {
    return base
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function sample(list) {
  return list[rand(0, list.length - 1)]
}

function getDifficultyMultiplier() {
  return { easy: 1, medium: 1.4, hard: 1.8 }[state.settings.difficulty] || 1
}

function getAgeBand() {
  if (state.settings.age <= 7) return 'young'
  if (state.settings.age <= 9) return 'core'
  return 'advanced'
}

function createMathPuzzle() {
  const band = getAgeBand()
  const difficulty = state.settings.difficulty

  let a = 0
  let b = 0
  let question = ''
  let answer = 0

  if (band === 'young') {
    if (difficulty === 'easy') {
      a = rand(1, 10)
      b = rand(1, 10)
      question = `${a} + ${b} = ?`
      answer = a + b
    } else {
      a = rand(5, 15)
      b = rand(1, 9)
      question = `${a} - ${b} = ?`
      answer = a - b
    }
  } else if (band === 'core') {
    if (difficulty === 'easy') {
      a = rand(4, 14)
      b = rand(2, 12)
      question = `${a} + ${b} = ?`
      answer = a + b
    } else if (difficulty === 'medium') {
      a = rand(8, 20)
      b = rand(2, 9)
      question = `${a} - ${b} = ?`
      answer = a - b
    } else {
      a = rand(2, 9)
      b = rand(2, 9)
      question = `${a} × ${b} = ?`
      answer = a * b
    }
  } else {
    if (difficulty === 'easy') {
      a = rand(2, 12)
      b = rand(2, 12)
      question = `${a} × ${b} = ?`
      answer = a * b
    } else if (difficulty === 'medium') {
      b = rand(2, 10)
      answer = rand(2, 12)
      a = b * answer
      question = `${a} ÷ ${b} = ?`
    } else {
      a = rand(10, 35)
      b = rand(10, 35)
      question = `${a} + ${b} = ?`
      answer = a + b
    }
  }

  const options = new Set([String(answer)])
  while (options.size < 4) {
    const wiggle = rand(-8, 8) || 2
    options.add(String(Math.max(0, answer + wiggle)))
  }

  return {
    type: 'math',
    prompt: question,
    answer: String(answer),
    options: shuffle([...options]),
    reward: buildReward('math'),
    hint: 'Count carefully and take your time.',
  }
}

function createEnglishPuzzle() {
  const band = getAgeBand()
  const difficulty = state.settings.difficulty

  const synonymPool = [
    { prompt: 'Pick the word that means happy', answer: 'glad', options: ['sad', 'glad', 'sleepy', 'tiny'] },
    { prompt: 'Pick the word that means fast', answer: 'quick', options: ['quick', 'slow', 'soft', 'late'] },
    { prompt: 'Pick the word that means large', answer: 'big', options: ['big', 'small', 'thin', 'quiet'] },
  ]

  const spellingPool = [
    { prompt: 'Which word is spelled correctly?', answer: 'friend', options: ['freind', 'friend', 'frend', 'frind'] },
    { prompt: 'Which word is spelled correctly?', answer: 'because', options: ['becuse', 'because', 'beacause', 'becos'] },
    { prompt: 'Which word is spelled correctly?', answer: 'adventure', options: ['adventur', 'advanture', 'adventure', 'advencher'] },
  ]

  const sentencePool = [
    { prompt: 'Finish the sentence: The cat sat on the…', answer: 'mat', options: ['moon', 'mat', 'tree', 'rain'] },
    { prompt: 'Finish the sentence: We wear shoes on our…', answer: 'feet', options: ['hands', 'ears', 'feet', 'eyes'] },
    { prompt: 'Finish the sentence: I read a book at the…', answer: 'library', options: ['library', 'banana', 'pillow', 'rocket'] },
  ]

  const readingPool = [
    {
      prompt: 'Mini reading: "Lina plants seeds in spring." What does Lina plant?',
      answer: 'seeds',
      options: ['clouds', 'seeds', 'socks', 'stones'],
    },
    {
      prompt: 'Mini reading: "Omar packed water for the hike." What did Omar pack?',
      answer: 'water',
      options: ['water', 'sand', 'snow', 'paint'],
    },
  ]

  let pool = synonymPool
  if (band === 'young') pool = difficulty === 'hard' ? sentencePool : synonymPool
  if (band === 'core') pool = difficulty === 'easy' ? sentencePool : spellingPool
  if (band === 'advanced') pool = difficulty === 'easy' ? spellingPool : readingPool

  const chosen = sample(pool)

  return {
    type: 'english',
    prompt: chosen.prompt,
    answer: chosen.answer,
    options: shuffle([...chosen.options]),
    reward: buildReward('english'),
    hint: 'Read each choice slowly before you pick one.',
  }
}

function buildReward(type) {
  const power = getDifficultyMultiplier()
  const baseCoins = Math.round((type === 'math' ? 8 : 6) * power)
  const baseStars = Math.round((type === 'english' ? 7 : 4) * power)
  const baseXp = Math.round(10 * power)
  const gemChance = type === 'english' && Math.random() > 0.7 ? 1 : 0

  return {
    coins: baseCoins,
    stars: baseStars,
    xp: baseXp,
    gems: gemChance,
  }
}

function shuffle(list) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function ensurePuzzle() {
  if (state.currentPuzzle?.type === state.activePuzzleSet) return
  state.currentPuzzle = state.activePuzzleSet === 'math' ? createMathPuzzle() : createEnglishPuzzle()
}

function normalizeGameState() {
  state.game = {
    ...structuredClone(baseGame),
    ...(state.game || {}),
    position: { ...structuredClone(baseGame).position, ...(state.game?.position || {}) },
  }
}

function resetMiniGame() {
  state.game = structuredClone(baseGame)
}

function setTab(tab) {
  state.activeTab = tab
  if (tab === 'puzzles') ensurePuzzle()
  render()
}

function progressPercent(value, total) {
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)))
}

function isUnlocked(itemId) {
  return state.unlockedItems.includes(itemId)
}

function findItemById(itemId) {
  return Object.values(rewardsCatalog).flat().find((item) => item.id === itemId)
}

function categoryToEquipType(category) {
  return category === 'outfits' ? 'outfit' : category.slice(0, -1)
}

function addRecentReward(text) {
  state.recentRewards = [text, ...state.recentRewards].slice(0, 5)
}

function awardReward(reward, sourceLabel) {
  state.profile.coins += reward.coins || 0
  state.profile.stars += reward.stars || 0
  state.profile.gems += reward.gems || 0
  state.profile.xp += reward.xp || 0

  addRecentReward(`${sourceLabel}: +${reward.coins || 0} coins, +${reward.stars || 0} stars, +${reward.xp || 0} XP${reward.gems ? `, +${reward.gems} gem` : ''}`)

  while (state.profile.xp >= state.profile.nextLevelXp) {
    state.profile.xp -= state.profile.nextLevelXp
    state.profile.level += 1
    state.profile.nextLevelXp += 25
    state.profile.coins += 15
    state.profile.stars += 5
    addRecentReward('Level up bonus: +15 coins, +5 stars')
  }
}

function completeQuestIfReady(questId) {
  const quest = state.quests.find((entry) => entry.id === questId)
  if (!quest || quest.progress !== quest.total) return
  if (quest.completed) return

  quest.completed = true
  awardReward({ coins: quest.reward.coins || 0, stars: quest.reward.stars || 0, gems: quest.reward.gems || 0, xp: 12 }, `Quest complete: ${quest.title}`)
}

function updateQuestProgress(questId, amount) {
  const quest = state.quests.find((entry) => entry.id === questId)
  if (!quest) return
  quest.progress = Math.min(quest.total, quest.progress + amount)
  completeQuestIfReady(questId)
}

function answerPuzzle(option) {
  ensurePuzzle()
  const puzzle = state.currentPuzzle
  const correct = option === puzzle.answer
  state.profile.totalAnswers += 1

  if (correct) {
    state.profile.correctAnswers += 1
    awardReward(puzzle.reward, puzzle.type === 'math' ? 'Math win' : 'English win')
    updateQuestProgress(puzzle.type, 1)
    state.lastResult = 'Correct! Great job — you earned rewards.'
    state.currentPuzzle = puzzle.type === 'math' ? createMathPuzzle() : createEnglishPuzzle()
  } else {
    state.lastResult = `Not quite. Hint: ${puzzle.hint}`
  }

  saveState()
  render()
}

function collectCoinIfPresent() {
  const coin = state.game.coins.find(
    (entry) => !entry.collected && entry.x === state.game.position.x && entry.lane === state.game.position.lane,
  )

  if (!coin) return

  coin.collected = true
  awardReward({ coins: 4, stars: 1, xp: 3, gems: 0 }, 'Coin collected')
  state.lastResult = 'You grabbed a coin!'
}

function hitObstacle() {
  return state.game.obstacles.some(
    (entry) => entry.x === state.game.position.x && entry.lane === state.game.position.lane,
  )
}

function checkFinish() {
  if (state.game.position.x < state.game.finishX) return

  const collectedCoins = state.game.coins.filter((coin) => coin.collected).length
  const reward = {
    coins: 10 + collectedCoins * 3,
    stars: 8 + collectedCoins,
    xp: 16 + collectedCoins * 2,
    gems: collectedCoins >= 3 ? 1 : 0,
  }

  awardReward(reward, 'Adventure complete')
  updateQuestProgress('play', 100)
  state.lastResult = `Treasure reached! You collected ${collectedCoins} coins on the path.`
  resetMiniGame()
}

function movePlayer(deltaX, deltaLane = 0) {
  const nextLane = Math.max(0, Math.min(state.game.laneCount - 1, state.game.position.lane + deltaLane))
  const nextX = Math.max(0, Math.min(state.game.finishX, state.game.position.x + deltaX))

  state.game.position = { x: nextX, lane: nextLane }
  state.game.steps += 1

  if (hitObstacle()) {
    state.lastResult = 'Oops! You bumped into an obstacle. Back to the start.'
    resetMiniGame()
    saveState()
    render()
    return
  }

  collectCoinIfPresent()
  if (!state.lastResult) state.lastResult = 'Nice move!'
  checkFinish()
  saveState()
  render()
}

function bindKeyboardControls() {
  if (keyboardBound) return
  keyboardBound = true

  window.addEventListener('keydown', (event) => {
    if (state.activeTab !== 'play') return
    if (['ArrowRight', 'd', 'D'].includes(event.key)) {
      event.preventDefault()
      movePlayer(1, 0)
    }
    if (['ArrowUp', 'w', 'W'].includes(event.key)) {
      event.preventDefault()
      movePlayer(1, -1)
    }
    if (['ArrowDown', 's', 'S'].includes(event.key)) {
      event.preventDefault()
      movePlayer(1, 1)
    }
    if (event.key === ' ') {
      event.preventDefault()
      movePlayer(2, 0)
    }
  })
}

function purchaseItem(item) {
  if (isUnlocked(item.id)) {
    state.lastResult = `${item.name} is already unlocked.`
    render()
    return
  }

  if (state.profile.coins < item.cost) {
    state.lastResult = `You need ${item.cost - state.profile.coins} more coins for ${item.name}.`
    render()
    return
  }

  state.profile.coins -= item.cost
  state.unlockedItems.push(item.id)
  addRecentReward(`Unlocked ${item.name}`)
  state.lastResult = `Unlocked ${item.name}!`
  saveState()
  render()
}

function equipItem(type, itemId) {
  if (!isUnlocked(itemId)) return
  state.equipped[type] = itemId
  state.lastResult = `Equipped ${findItemById(itemId)?.name}!`
  saveState()
  render()
}

function resetProgress() {
  state = cloneDefaultState()
  ensurePuzzle()
  normalizeGameState()
  saveState()
  render()
}

function renderNav() {
  const tabs = [
    ['home', 'Home'],
    ['play', 'Play'],
    ['puzzles', 'Puzzles'],
    ['shop', 'Shop'],
    ['parent', 'Parent Settings'],
  ]

  return `
    <nav class="top-nav">
      <div class="brand">🎮 Roblox Rewards</div>
      <div class="nav-buttons">
        ${tabs
          .map(
            ([id, label]) => `<button class="nav-btn ${state.activeTab === id ? 'active' : ''}" data-tab="${id}">${label}</button>`,
          )
          .join('')}
      </div>
    </nav>
  `
}

function renderHome() {
  const accuracy = state.profile.totalAnswers
    ? Math.round((state.profile.correctAnswers / state.profile.totalAnswers) * 100)
    : 0

  return `
    <section class="hero-panel card">
      <div>
        <p class="eyebrow">Learn. Play. Unlock cool stuff.</p>
        <h1>Welcome back, ${state.profile.name}!</h1>
        <p class="hero-copy">A safe local-only learning adventure with puzzles, quests, badges, and virtual items — no Roblox account needed.</p>
        <div class="hero-actions">
          <button class="primary big" data-tab-target="play">▶ Play Adventure</button>
          <button class="secondary big" data-tab-target="puzzles">🧠 Solve Puzzles</button>
        </div>
      </div>
      <div class="avatar-showcase">
        <div class="avatar-card">
          <div class="avatar-face">${findItemById(state.equipped.skin)?.icon || '😄'}</div>
          <div class="avatar-gear">
            <span>${findItemById(state.equipped.hat)?.icon || '🧢'}</span>
            <span>${findItemById(state.equipped.glasses)?.icon || '👓'}</span>
            <span>${findItemById(state.equipped.pet)?.icon || '🐾'}</span>
            <span>${findItemById(state.equipped.trail)?.icon || '✨'}</span>
            <span>${findItemById(state.equipped.outfit)?.icon || '🦸'}</span>
          </div>
          <p>Level ${state.profile.level} Explorer</p>
        </div>
      </div>
    </section>

    <section class="dashboard-grid">
      <div class="card stats-card">
        <h2>Progress</h2>
        <div class="stat-row"><span>XP to next level</span><strong>${state.profile.xp}/${state.profile.nextLevelXp}</strong></div>
        <div class="progress-track"><div class="progress-fill" style="width:${progressPercent(state.profile.xp, state.profile.nextLevelXp)}%"></div></div>
        <div class="currency-row">
          <div>🪙 ${state.profile.coins} Coins</div>
          <div>⭐ ${state.profile.stars} Stars</div>
          <div>💎 ${state.profile.gems} Gems</div>
        </div>
        <div class="mini-stats">
          <span>🎯 Accuracy: ${accuracy}%</span>
          <span>🔥 Streak: ${state.profile.streak}</span>
        </div>
      </div>

      <div class="card quest-card">
        <h2>Daily Quests</h2>
        ${state.quests
          .map(
            (quest) => `
              <div class="quest-item">
                <div class="quest-top">
                  <strong>${quest.title}</strong>
                  <span>${quest.completed ? '✅ Done' : quest.reward.coins ? `+${quest.reward.coins} coins` : `+${quest.reward.gems} gem`}</span>
                </div>
                <div class="progress-track small"><div class="progress-fill" style="width:${progressPercent(quest.progress, quest.total)}%"></div></div>
              </div>
            `,
          )
          .join('')}
      </div>

      <div class="card rewards-preview">
        <h2>Recent Rewards</h2>
        <div class="recent-list">
          ${(state.recentRewards.length ? state.recentRewards : ['Start playing to earn your first reward!'])
            .map((entry) => `<div class="recent-item">🎁 ${entry}</div>`)
            .join('')}
        </div>
      </div>
    </section>
  `
}

function renderBoardCell(x, lane) {
  const playerHere = state.game.position.x === x && state.game.position.lane === lane
  const obstacle = state.game.obstacles.find((entry) => entry.x === x && entry.lane === lane)
  const coin = state.game.coins.find((entry) => entry.x === x && entry.lane === lane && !entry.collected)
  const finishHere = x === state.game.finishX && lane === 1

  let content = ''
  let className = 'board-cell'

  if (finishHere) {
    content = '🏆'
    className += ' finish'
  }
  if (obstacle) {
    content = obstacle.kind === 'slime' ? '🟪' : '🧱'
    className += ' obstacle'
  }
  if (coin) {
    content = '🪙'
    className += ' coin'
  }
  if (playerHere) {
    content = findItemById(state.equipped.skin)?.icon || '🧍'
    className += ' player-cell'
  }

  return `<div class="${className}">${content}</div>`
}

function renderPlay() {
  const collectedCoins = state.game.coins.filter((coin) => coin.collected).length

  return `
    <section class="card play-panel">
      <div class="section-heading wrap">
        <div>
          <p class="eyebrow">Mini adventure</p>
          <h2>Sky Path Dash</h2>
        </div>
        <button class="secondary" id="reset-mini-game">Reset Run</button>
      </div>
      <p>Move across the path, collect coins, avoid blocks and slime, and reach the trophy.</p>
      <div class="controls-note">Use buttons, tap controls, or keyboard: Right / Up / Down / Space</div>

      <div class="game-status-row">
        <div class="status-pill">Position: ${state.game.position.x}/${state.game.finishX}</div>
        <div class="status-pill">Lane: ${state.game.position.lane + 1}</div>
        <div class="status-pill">Coins grabbed: ${collectedCoins}/${state.game.coins.length}</div>
      </div>

      <div class="board-wrap">
        <div class="board-grid" style="grid-template-columns: repeat(${state.game.finishX + 1}, minmax(52px, 1fr));">
          ${Array.from({ length: state.game.laneCount }, (_, lane) =>
            Array.from({ length: state.game.finishX + 1 }, (_, x) => renderBoardCell(x, lane)).join(''),
          ).join('')}
        </div>
      </div>

      <div class="play-controls">
        <button class="secondary control-btn" data-move="up">↗ Jump Up</button>
        <button class="primary control-btn" data-move="right">➡ Move Right</button>
        <button class="secondary control-btn" data-move="down">↘ Jump Down</button>
        <button class="secondary control-btn" data-move="boost">⏩ Dash</button>
      </div>
    </section>
  `
}

function renderPuzzles() {
  ensurePuzzle()
  const puzzle = state.currentPuzzle

  return `
    <section class="card puzzle-panel">
      <div class="section-heading wrap">
        <div>
          <p class="eyebrow">Puzzle zone</p>
          <h2>${puzzle.type === 'math' ? 'Math Mission' : 'Word Quest'}</h2>
        </div>
        <div class="pill-switch">
          <button class="switch-btn ${state.activePuzzleSet === 'math' ? 'active' : ''}" data-puzzle-set="math">Math</button>
          <button class="switch-btn ${state.activePuzzleSet === 'english' ? 'active' : ''}" data-puzzle-set="english">English</button>
        </div>
      </div>

      <div class="puzzle-card-inner">
        <div>
          <div class="puzzle-badge">Age ${state.settings.age} • ${state.settings.difficulty}</div>
          <h3>${puzzle.prompt}</h3>
          <p class="hint-text">Hint: ${puzzle.hint}</p>
          <div class="answer-grid">
            ${puzzle.options.map((option) => `<button class="answer-btn" data-answer="${option}">${option}</button>`).join('')}
          </div>
        </div>
        <div class="reward-box">
          <h4>Rewards if correct</h4>
          <ul>
            <li>+${puzzle.reward.coins} coins</li>
            <li>+${puzzle.reward.stars} stars</li>
            <li>+${puzzle.reward.xp} XP</li>
            ${puzzle.reward.gems ? `<li>+${puzzle.reward.gems} gem</li>` : ''}
          </ul>
        </div>
      </div>
    </section>
  `
}

function renderShop() {
  return `
    <section class="card shop-panel">
      <div class="section-heading wrap">
        <div>
          <p class="eyebrow">Unlockables</p>
          <h2>Reward Shop</h2>
        </div>
        <div class="wallet">🪙 ${state.profile.coins} coins available</div>
      </div>
      ${Object.entries(rewardsCatalog)
        .map(
          ([category, items]) => `
            <div class="shop-category">
              <h3>${category[0].toUpperCase() + category.slice(1)}</h3>
              <div class="shop-grid">
                ${items
                  .map((item) => {
                    const unlocked = isUnlocked(item.id)
                    const equipType = categoryToEquipType(category)
                    const equipped = state.equipped[equipType] === item.id
                    return `
                      <div class="shop-item ${unlocked ? 'unlocked' : ''}">
                        <div class="shop-icon">${item.icon}</div>
                        <strong>${item.name}</strong>
                        <span>${item.cost} coins</span>
                        <div class="shop-actions">
                          <button class="secondary" data-buy-item="${item.id}">${unlocked ? 'Unlocked' : 'Unlock'}</button>
                          ${unlocked ? `<button class="primary" data-equip-item="${item.id}" data-equip-type="${equipType}">${equipped ? 'Equipped' : 'Equip'}</button>` : ''}
                        </div>
                      </div>
                    `
                  })
                  .join('')}
              </div>
            </div>
          `,
        )
        .join('')}
    </section>
  `
}

function renderParent() {
  return `
    <section class="card parent-panel">
      <div class="section-heading wrap">
        <div>
          <p class="eyebrow">For grown-ups</p>
          <h2>Parent Settings</h2>
        </div>
        <button class="secondary" id="reset-progress">Reset local save</button>
      </div>
      <div class="settings-grid">
        <label>
          <span>Age</span>
          <input id="age-setting" type="range" min="6" max="12" value="${state.settings.age}" />
          <strong>${state.settings.age} years old</strong>
        </label>
        <label>
          <span>Difficulty</span>
          <select id="difficulty-setting">
            <option value="easy" ${state.settings.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
            <option value="medium" ${state.settings.difficulty === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="hard" ${state.settings.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
          </select>
        </label>
        <label>
          <span>Session time limit</span>
          <input id="time-limit-setting" type="range" min="10" max="60" step="5" value="${state.settings.timeLimit}" />
          <strong>${state.settings.timeLimit} minutes</strong>
        </label>
        <label class="toggle-row">
          <span>Sound</span>
          <button class="toggle ${state.settings.sound ? 'on' : ''}" id="toggle-sound">${state.settings.sound ? 'ON' : 'OFF'}</button>
        </label>
        <label class="toggle-row">
          <span>Safe local-only mode</span>
          <button class="toggle ${state.settings.safeLocalMode ? 'on' : ''}" id="toggle-safe">${state.settings.safeLocalMode ? 'ON' : 'OFF'}</button>
        </label>
      </div>
      <div class="safe-note">🔒 Saves stay in this browser via localStorage. No Roblox login, no account linking, no Robux claims.</div>
    </section>
  `
}

function render() {
  app.innerHTML = `
    <div class="app-shell">
      ${renderNav()}
      <main class="main-content">
        ${renderHome()}
        ${state.activeTab === 'play' ? renderPlay() : ''}
        ${state.activeTab === 'puzzles' ? renderPuzzles() : ''}
        ${state.activeTab === 'shop' ? renderShop() : ''}
        ${state.activeTab === 'parent' ? renderParent() : ''}
        ${state.lastResult ? `<section class="toast">${state.lastResult}</section>` : ''}
      </main>
    </div>
  `

  bindEvents()
  bindKeyboardControls()
}

function bindEvents() {
  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => setTab(button.dataset.tab))
  })

  document.querySelectorAll('[data-tab-target]').forEach((button) => {
    button.addEventListener('click', () => setTab(button.dataset.tabTarget))
  })

  document.querySelectorAll('[data-puzzle-set]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activePuzzleSet = button.dataset.puzzleSet
      state.currentPuzzle = null
      ensurePuzzle()
      saveState()
      render()
    })
  })

  document.querySelectorAll('[data-answer]').forEach((button) => {
    button.addEventListener('click', () => answerPuzzle(button.dataset.answer))
  })

  document.querySelectorAll('[data-move]').forEach((button) => {
    button.addEventListener('click', () => {
      const move = button.dataset.move
      if (move === 'right') movePlayer(1, 0)
      if (move === 'up') movePlayer(1, -1)
      if (move === 'down') movePlayer(1, 1)
      if (move === 'boost') movePlayer(2, 0)
    })
  })

  document.getElementById('reset-mini-game')?.addEventListener('click', () => {
    resetMiniGame()
    state.lastResult = 'Adventure reset!'
    saveState()
    render()
  })

  document.querySelectorAll('[data-buy-item]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = findItemById(button.dataset.buyItem)
      if (item) purchaseItem(item)
    })
  })

  document.querySelectorAll('[data-equip-item]').forEach((button) => {
    button.addEventListener('click', () => equipItem(button.dataset.equipType, button.dataset.equipItem))
  })

  document.getElementById('age-setting')?.addEventListener('input', (event) => {
    state.settings.age = Number(event.target.value)
    state.currentPuzzle = null
    ensurePuzzle()
    saveState()
    render()
  })

  document.getElementById('difficulty-setting')?.addEventListener('change', (event) => {
    state.settings.difficulty = event.target.value
    state.currentPuzzle = null
    ensurePuzzle()
    saveState()
    render()
  })

  document.getElementById('time-limit-setting')?.addEventListener('input', (event) => {
    state.settings.timeLimit = Number(event.target.value)
    saveState()
    render()
  })

  document.getElementById('toggle-sound')?.addEventListener('click', () => {
    state.settings.sound = !state.settings.sound
    saveState()
    render()
  })

  document.getElementById('toggle-safe')?.addEventListener('click', () => {
    state.settings.safeLocalMode = !state.settings.safeLocalMode
    saveState()
    render()
  })

  document.getElementById('reset-progress')?.addEventListener('click', resetProgress)
}

render()
