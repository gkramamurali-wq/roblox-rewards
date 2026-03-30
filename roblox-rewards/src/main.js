import './style.css'

const STORAGE_KEY = 'roblox-rewards-save-v3'
const ADMIN_PASSCODE = '1234'

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

function createDefaultChildProfile(name = 'New Player', age = 8, difficulty = 'easy') {
  return {
    id: `child-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    status: 'active',
    banReason: '',
    profile: {
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
      age,
      difficulty,
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
    currentPuzzle: null,
    recentRewards: [],
    game: structuredClone(baseGame),
  }
}

const defaultState = {
  activeTab: 'home',
  activePuzzleSet: 'math',
  currentChildId: null,
  lastResult: null,
  admin: {
    unlocked: false,
    showPanel: false,
  },
  childProfiles: [],
}

let state = loadState()
ensureCurrentChild()
ensurePuzzle()
normalizeCurrentChild()

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
      admin: { ...base.admin, ...(parsed.admin || {}) },
      childProfiles: Array.isArray(parsed.childProfiles) ? parsed.childProfiles : [],
    }
  } catch {
    return base
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function ensureCurrentChild() {
  if (!state.currentChildId || !state.childProfiles.find((child) => child.id === state.currentChildId)) {
    state.currentChildId = state.childProfiles.find((child) => child.status !== 'banned')?.id || state.childProfiles[0]?.id || null
  }
}

function getCurrentChild() {
  return state.childProfiles.find((child) => child.id === state.currentChildId) || null
}

function childIsLocked(child) {
  return child?.status === 'locked'
}

function childIsBanned(child) {
  return child?.status === 'banned'
}

function childIsRestricted(child) {
  return childIsLocked(child) || childIsBanned(child)
}

function normalizeCurrentChild() {
  const child = getCurrentChild()
  if (!child) return

  child.settings = {
    age: 8,
    difficulty: 'easy',
    sound: true,
    safeLocalMode: true,
    timeLimit: 20,
    ...(child.settings || {}),
  }

  child.profile = {
    level: 1,
    stars: 0,
    coins: 25,
    gems: 0,
    xp: 0,
    nextLevelXp: 100,
    streak: 1,
    correctAnswers: 0,
    totalAnswers: 0,
    ...(child.profile || {}),
  }

  child.equipped = {
    hat: 'hat-sun',
    glasses: null,
    pet: null,
    trail: null,
    outfit: null,
    skin: null,
    ...(child.equipped || {}),
  }

  child.status = child.status || 'active'
  child.banReason = child.banReason || ''
  child.quests = Array.isArray(child.quests) ? child.quests : createDefaultChildProfile().quests
  child.unlockedItems = Array.isArray(child.unlockedItems) ? child.unlockedItems : ['hat-sun']
  child.recentRewards = Array.isArray(child.recentRewards) ? child.recentRewards : []
  child.game = {
    ...structuredClone(baseGame),
    ...(child.game || {}),
    position: { ...structuredClone(baseGame).position, ...(child.game?.position || {}) },
  }
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function sample(list) {
  return list[rand(0, list.length - 1)]
}

function getDifficultyMultiplier() {
  const child = getCurrentChild()
  return { easy: 1, medium: 1.4, hard: 1.8 }[child?.settings?.difficulty] || 1
}

function getAgeBand() {
  const age = getCurrentChild()?.settings?.age || 8
  if (age <= 7) return 'young'
  if (age <= 9) return 'core'
  return 'advanced'
}

function createMathPuzzle() {
  const band = getAgeBand()
  const difficulty = getCurrentChild()?.settings?.difficulty || 'easy'

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
  const difficulty = getCurrentChild()?.settings?.difficulty || 'easy'

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
  const child = getCurrentChild()
  if (!child) return
  if (child.currentPuzzle?.type === state.activePuzzleSet) return
  child.currentPuzzle = state.activePuzzleSet === 'math' ? createMathPuzzle() : createEnglishPuzzle()
}

function resetMiniGame() {
  const child = getCurrentChild()
  if (!child) return
  child.game = structuredClone(baseGame)
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
  return getCurrentChild()?.unlockedItems.includes(itemId)
}

function findItemById(itemId) {
  return Object.values(rewardsCatalog).flat().find((item) => item.id === itemId)
}

function categoryToEquipType(category) {
  return category === 'outfits' ? 'outfit' : category.slice(0, -1)
}

function addRecentReward(text) {
  const child = getCurrentChild()
  if (!child) return
  child.recentRewards = [text, ...child.recentRewards].slice(0, 5)
}

function awardReward(reward, sourceLabel) {
  const child = getCurrentChild()
  if (!child) return

  child.profile.coins += reward.coins || 0
  child.profile.stars += reward.stars || 0
  child.profile.gems += reward.gems || 0
  child.profile.xp += reward.xp || 0

  addRecentReward(`${sourceLabel}: +${reward.coins || 0} coins, +${reward.stars || 0} stars, +${reward.xp || 0} XP${reward.gems ? `, +${reward.gems} gem` : ''}`)

  while (child.profile.xp >= child.profile.nextLevelXp) {
    child.profile.xp -= child.profile.nextLevelXp
    child.profile.level += 1
    child.profile.nextLevelXp += 25
    child.profile.coins += 15
    child.profile.stars += 5
    addRecentReward('Level up bonus: +15 coins, +5 stars')
  }
}

function completeQuestIfReady(questId) {
  const child = getCurrentChild()
  if (!child) return
  const quest = child.quests.find((entry) => entry.id === questId)
  if (!quest || quest.progress !== quest.total || quest.completed) return

  quest.completed = true
  awardReward({ coins: quest.reward.coins || 0, stars: quest.reward.stars || 0, gems: quest.reward.gems || 0, xp: 12 }, `Quest complete: ${quest.title}`)
}

function updateQuestProgress(questId, amount) {
  const child = getCurrentChild()
  if (!child) return
  const quest = child.quests.find((entry) => entry.id === questId)
  if (!quest) return
  quest.progress = Math.min(quest.total, quest.progress + amount)
  completeQuestIfReady(questId)
}

function answerPuzzle(option) {
  const child = getCurrentChild()
  if (!child || childIsRestricted(child)) return
  ensurePuzzle()
  const puzzle = child.currentPuzzle
  const correct = option === puzzle.answer
  child.profile.totalAnswers += 1

  if (correct) {
    child.profile.correctAnswers += 1
    awardReward(puzzle.reward, puzzle.type === 'math' ? 'Math win' : 'English win')
    updateQuestProgress(puzzle.type, 1)
    state.lastResult = 'Correct! Great job — you earned rewards.'
    child.currentPuzzle = puzzle.type === 'math' ? createMathPuzzle() : createEnglishPuzzle()
  } else {
    state.lastResult = `Not quite. Hint: ${puzzle.hint}`
  }

  saveState()
  render()
}

function collectCoinIfPresent() {
  const child = getCurrentChild()
  if (!child) return

  const coin = child.game.coins.find(
    (entry) => !entry.collected && entry.x === child.game.position.x && entry.lane === child.game.position.lane,
  )

  if (!coin) return

  coin.collected = true
  awardReward({ coins: 4, stars: 1, xp: 3, gems: 0 }, 'Coin collected')
  state.lastResult = 'You grabbed a coin!'
}

function hitObstacle() {
  const child = getCurrentChild()
  if (!child) return false
  return child.game.obstacles.some(
    (entry) => entry.x === child.game.position.x && entry.lane === child.game.position.lane,
  )
}

function checkFinish() {
  const child = getCurrentChild()
  if (!child || child.game.position.x < child.game.finishX) return

  const collectedCoins = child.game.coins.filter((coin) => coin.collected).length
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
  const child = getCurrentChild()
  if (!child || childIsRestricted(child)) return

  const nextLane = Math.max(0, Math.min(child.game.laneCount - 1, child.game.position.lane + deltaLane))
  const nextX = Math.max(0, Math.min(child.game.finishX, child.game.position.x + deltaX))

  child.game.position = { x: nextX, lane: nextLane }
  child.game.steps += 1

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
  const child = getCurrentChild()
  if (!child || childIsRestricted(child)) return

  if (child.unlockedItems.includes(item.id)) {
    state.lastResult = `${item.name} is already unlocked.`
    render()
    return
  }

  if (child.profile.coins < item.cost) {
    state.lastResult = `You need ${item.cost - child.profile.coins} more coins for ${item.name}.`
    render()
    return
  }

  child.profile.coins -= item.cost
  child.unlockedItems.push(item.id)
  addRecentReward(`Unlocked ${item.name}`)
  state.lastResult = `Unlocked ${item.name}!`
  saveState()
  render()
}

function equipItem(type, itemId) {
  const child = getCurrentChild()
  if (!child || childIsRestricted(child) || !child.unlockedItems.includes(itemId)) return
  child.equipped[type] = itemId
  state.lastResult = `Equipped ${findItemById(itemId)?.name}!`
  saveState()
  render()
}

function resetProfile(childId) {
  const childIndex = state.childProfiles.findIndex((child) => child.id === childId)
  if (childIndex === -1) return
  const old = state.childProfiles[childIndex]
  const fresh = createDefaultChildProfile(old.name, old.settings?.age || 8, old.settings?.difficulty || 'easy')
  fresh.id = childId
  fresh.status = old.status
  fresh.banReason = old.banReason || ''
  state.childProfiles[childIndex] = fresh
  if (state.currentChildId === childId) normalizeCurrentChild()
  state.lastResult = `Reset profile for ${old.name}.`
  saveState()
  render()
}

function removeProfile(childId) {
  const child = state.childProfiles.find((entry) => entry.id === childId)
  if (!child) return
  state.childProfiles = state.childProfiles.filter((entry) => entry.id !== childId)
  ensureCurrentChild()
  state.lastResult = `Deleted profile for ${child.name}.`
  saveState()
  render()
}

function createChildProfileFromForm(prefix = 'public') {
  const nameInput = document.getElementById(`${prefix}-child-name`)
  const ageInput = document.getElementById(`${prefix}-child-age`)
  const difficultyInput = document.getElementById(`${prefix}-child-difficulty`)

  const name = nameInput?.value?.trim()
  const age = Number(ageInput?.value || 8)
  const difficulty = difficultyInput?.value || 'easy'

  if (!name) {
    state.lastResult = 'Enter a child name first.'
    render()
    return
  }

  const child = createDefaultChildProfile(name, age, difficulty)
  state.childProfiles.push(child)
  state.currentChildId = child.id
  state.lastResult = `Created profile for ${name}.`
  saveState()
  render()
}

function switchChildProfile(childId) {
  const child = state.childProfiles.find((entry) => entry.id === childId)
  if (!child || childIsBanned(child)) {
    state.lastResult = 'That profile is banned and can only be managed in admin.'
    render()
    return
  }

  state.currentChildId = childId
  ensureCurrentChild()
  ensurePuzzle()
  normalizeCurrentChild()
  state.lastResult = 'Switched profile.'
  saveState()
  render()
}

function setChildStatus(childId, status) {
  const child = state.childProfiles.find((entry) => entry.id === childId)
  if (!child) return
  child.status = status
  if (status !== 'banned') child.banReason = ''
  if (status === 'banned' && state.currentChildId === childId) ensureCurrentChild()
  state.lastResult = `${child.name} is now ${status}.`
  saveState()
  render()
}

function banChild(childId) {
  const child = state.childProfiles.find((entry) => entry.id === childId)
  if (!child) return
  const reasonInput = document.getElementById(`ban-reason-${childId}`)
  child.status = 'banned'
  child.banReason = reasonInput?.value?.trim() || 'No reason added'
  if (state.currentChildId === childId) ensureCurrentChild()
  state.lastResult = `${child.name} was banned.`
  saveState()
  render()
}

function unbanChild(childId) {
  const child = state.childProfiles.find((entry) => entry.id === childId)
  if (!child) return
  child.status = 'active'
  child.banReason = ''
  if (!state.currentChildId) state.currentChildId = child.id
  state.lastResult = `${child.name} was unbanned.`
  saveState()
  render()
}

function grantRewardToChild(childId, type, amount) {
  const child = state.childProfiles.find((entry) => entry.id === childId)
  if (!child) return
  child.profile[type] += amount
  state.lastResult = `Gave ${amount} ${type} to ${child.name}.`
  saveState()
  render()
}

function toggleAdminPanel() {
  state.admin.showPanel = !state.admin.showPanel
  render()
}

function unlockAdmin() {
  const input = document.getElementById('admin-passcode')?.value || ''
  if (input === ADMIN_PASSCODE) {
    state.admin.unlocked = true
    state.admin.showPanel = true
    state.lastResult = 'Admin panel unlocked.'
  } else {
    state.lastResult = 'Wrong passcode.'
  }
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
        ${tabs.map(([id, label]) => `<button class="nav-btn ${state.activeTab === id ? 'active' : ''}" data-tab="${id}">${label}</button>`).join('')}
        <button class="nav-btn admin-trigger" id="open-admin">🔐 Admin</button>
      </div>
    </nav>
  `
}

function renderPublicProfileCreator() {
  return `
    <section class="card public-create-panel">
      <div class="section-heading wrap">
        <div>
          <p class="eyebrow">New player</p>
          <h2>Create a child profile</h2>
        </div>
      </div>
      <div class="admin-create-grid">
        <input id="public-child-name" type="text" placeholder="Child name" />
        <input id="public-child-age" type="number" min="6" max="12" value="8" />
        <select id="public-child-difficulty">
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <button class="primary" id="public-create-child">Create Profile</button>
      </div>
    </section>
  `
}

function renderProfileSelector() {
  const visibleProfiles = state.childProfiles.filter((child) => !childIsBanned(child))

  return `
    <section class="card profile-switcher">
      <div class="section-heading wrap">
        <div>
          <p class="eyebrow">Players</p>
          <h2>Choose a child profile</h2>
        </div>
      </div>
      <div class="profile-grid">
        ${visibleProfiles.length
          ? visibleProfiles
              .map(
                (child) => `
                  <button class="profile-card ${state.currentChildId === child.id ? 'active' : ''}" data-switch-child="${child.id}">
                    <div class="profile-avatar">${findItemById(child.equipped?.skin)?.icon || '🙂'}</div>
                    <strong>${child.name}</strong>
                    <span>Age ${child.settings?.age || 8} • ${child.settings?.difficulty || 'easy'}</span>
                    <span>${childIsLocked(child) ? '🔒 Locked' : `⭐ Level ${child.profile?.level || 1}`}</span>
                  </button>
                `,
              )
              .join('')
          : '<div class="recent-item">No active child profiles yet. Create one below.</div>'}
      </div>
    </section>
  `
}

function renderHome() {
  const child = getCurrentChild()
  if (!child) {
    return `${renderProfileSelector()}${renderPublicProfileCreator()}`
  }

  const accuracy = child.profile.totalAnswers
    ? Math.round((child.profile.correctAnswers / child.profile.totalAnswers) * 100)
    : 0

  return `
    ${renderProfileSelector()}
    ${renderPublicProfileCreator()}
    <section class="hero-panel card ${childIsRestricted(child) ? 'locked-panel' : ''}">
      <div>
        <p class="eyebrow">Learn. Play. Unlock cool stuff.</p>
        <h1>Welcome back, ${child.name}!</h1>
        <p class="hero-copy">A safe local-only learning adventure with puzzles, quests, badges, and virtual items — no Roblox account needed.</p>
        ${childIsLocked(child) ? `<div class="locked-message">🔒 This profile is paused by admin.</div>` : ''}
        ${childIsBanned(child) ? `<div class="locked-message">⛔ This profile is banned by admin. ${child.banReason}</div>` : ''}
        <div class="hero-actions">
          <button class="primary big" data-tab-target="play" ${childIsRestricted(child) ? 'disabled' : ''}>▶ Play Adventure</button>
          <button class="secondary big" data-tab-target="puzzles" ${childIsRestricted(child) ? 'disabled' : ''}>🧠 Solve Puzzles</button>
        </div>
      </div>
      <div class="avatar-showcase">
        <div class="avatar-card">
          <div class="avatar-face">${findItemById(child.equipped.skin)?.icon || '😄'}</div>
          <div class="avatar-gear">
            <span>${findItemById(child.equipped.hat)?.icon || '🧢'}</span>
            <span>${findItemById(child.equipped.glasses)?.icon || '👓'}</span>
            <span>${findItemById(child.equipped.pet)?.icon || '🐾'}</span>
            <span>${findItemById(child.equipped.trail)?.icon || '✨'}</span>
            <span>${findItemById(child.equipped.outfit)?.icon || '🦸'}</span>
          </div>
          <p>Level ${child.profile.level} Explorer</p>
        </div>
      </div>
    </section>

    <section class="dashboard-grid">
      <div class="card stats-card">
        <h2>Progress</h2>
        <div class="stat-row"><span>XP to next level</span><strong>${child.profile.xp}/${child.profile.nextLevelXp}</strong></div>
        <div class="progress-track"><div class="progress-fill" style="width:${progressPercent(child.profile.xp, child.profile.nextLevelXp)}%"></div></div>
        <div class="currency-row">
          <div>🪙 ${child.profile.coins} Coins</div>
          <div>⭐ ${child.profile.stars} Stars</div>
          <div>💎 ${child.profile.gems} Gems</div>
        </div>
        <div class="mini-stats">
          <span>🎯 Accuracy: ${accuracy}%</span>
          <span>🔥 Streak: ${child.profile.streak}</span>
        </div>
      </div>

      <div class="card quest-card">
        <h2>Daily Quests</h2>
        ${child.quests
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
          ${(child.recentRewards.length ? child.recentRewards : ['Start playing to earn your first reward!'])
            .map((entry) => `<div class="recent-item">🎁 ${entry}</div>`)
            .join('')}
        </div>
      </div>
    </section>
  `
}

function renderBoardCell(x, lane) {
  const child = getCurrentChild()
  if (!child) return '<div class="board-cell"></div>'

  const playerHere = child.game.position.x === x && child.game.position.lane === lane
  const obstacle = child.game.obstacles.find((entry) => entry.x === x && entry.lane === lane)
  const coin = child.game.coins.find((entry) => entry.x === x && entry.lane === lane && !entry.collected)
  const finishHere = x === child.game.finishX && lane === 1

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
    content = findItemById(child.equipped.skin)?.icon || '🧍'
    className += ' player-cell'
  }

  return `<div class="${className}">${content}</div>`
}

function renderPlay() {
  const child = getCurrentChild()
  if (!child) return ''

  const collectedCoins = child.game.coins.filter((coin) => coin.collected).length

  return `
    <section class="card play-panel ${childIsRestricted(child) ? 'locked-panel' : ''}">
      <div class="section-heading wrap">
        <div>
          <p class="eyebrow">Mini adventure</p>
          <h2>Sky Path Dash</h2>
        </div>
        <button class="secondary" id="reset-mini-game" ${childIsRestricted(child) ? 'disabled' : ''}>Reset Run</button>
      </div>
      <p>Move across the path, collect coins, avoid blocks and slime, and reach the trophy.</p>
      <div class="controls-note">Use buttons, tap controls, or keyboard: Right / Up / Down / Space</div>

      <div class="game-status-row">
        <div class="status-pill">Position: ${child.game.position.x}/${child.game.finishX}</div>
        <div class="status-pill">Lane: ${child.game.position.lane + 1}</div>
        <div class="status-pill">Coins grabbed: ${collectedCoins}/${child.game.coins.length}</div>
      </div>

      <div class="board-wrap">
        <div class="board-grid" style="grid-template-columns: repeat(${child.game.finishX + 1}, minmax(52px, 1fr));">
          ${Array.from({ length: child.game.laneCount }, (_, lane) =>
            Array.from({ length: child.game.finishX + 1 }, (_, x) => renderBoardCell(x, lane)).join(''),
          ).join('')}
        </div>
      </div>

      <div class="play-controls">
        <button class="secondary control-btn" data-move="up" ${childIsRestricted(child) ? 'disabled' : ''}>↗ Jump Up</button>
        <button class="primary control-btn" data-move="right" ${childIsRestricted(child) ? 'disabled' : ''}>➡ Move Right</button>
        <button class="secondary control-btn" data-move="down" ${childIsRestricted(child) ? 'disabled' : ''}>↘ Jump Down</button>
        <button class="secondary control-btn" data-move="boost" ${childIsRestricted(child) ? 'disabled' : ''}>⏩ Dash</button>
      </div>
    </section>
  `
}

function renderPuzzles() {
  const child = getCurrentChild()
  if (!child) return ''
  ensurePuzzle()
  const puzzle = child.currentPuzzle

  return `
    <section class="card puzzle-panel ${childIsRestricted(child) ? 'locked-panel' : ''}">
      <div class="section-heading wrap">
        <div>
          <p class="eyebrow">Puzzle zone</p>
          <h2>${puzzle.type === 'math' ? 'Math Mission' : 'Word Quest'}</h2>
        </div>
        <div class="pill-switch">
          <button class="switch-btn ${state.activePuzzleSet === 'math' ? 'active' : ''}" data-puzzle-set="math" ${childIsRestricted(child) ? 'disabled' : ''}>Math</button>
          <button class="switch-btn ${state.activePuzzleSet === 'english' ? 'active' : ''}" data-puzzle-set="english" ${childIsRestricted(child) ? 'disabled' : ''}>English</button>
        </div>
      </div>

      <div class="puzzle-card-inner">
        <div>
          <div class="puzzle-badge">${child.name} • Age ${child.settings.age} • ${child.settings.difficulty}</div>
          <h3>${puzzle.prompt}</h3>
          <p class="hint-text">Hint: ${puzzle.hint}</p>
          <div class="answer-grid">
            ${puzzle.options.map((option) => `<button class="answer-btn" data-answer="${option}" ${childIsRestricted(child) ? 'disabled' : ''}>${option}</button>`).join('')}
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
  const child = getCurrentChild()
  if (!child) return ''

  return `
    <section class="card shop-panel ${childIsRestricted(child) ? 'locked-panel' : ''}">
      <div class="section-heading wrap">
        <div>
          <p class="eyebrow">Unlockables</p>
          <h2>Reward Shop</h2>
        </div>
        <div class="wallet">🪙 ${child.profile.coins} coins available</div>
      </div>
      ${Object.entries(rewardsCatalog)
        .map(
          ([category, items]) => `
            <div class="shop-category">
              <h3>${category[0].toUpperCase() + category.slice(1)}</h3>
              <div class="shop-grid">
                ${items
                  .map((item) => {
                    const unlocked = child.unlockedItems.includes(item.id)
                    const equipType = categoryToEquipType(category)
                    const equipped = child.equipped[equipType] === item.id
                    return `
                      <div class="shop-item ${unlocked ? 'unlocked' : ''}">
                        <div class="shop-icon">${item.icon}</div>
                        <strong>${item.name}</strong>
                        <span>${item.cost} coins</span>
                        <div class="shop-actions">
                          <button class="secondary" data-buy-item="${item.id}" ${childIsRestricted(child) ? 'disabled' : ''}>${unlocked ? 'Unlocked' : 'Unlock'}</button>
                          ${unlocked ? `<button class="primary" data-equip-item="${item.id}" data-equip-type="${equipType}" ${childIsRestricted(child) ? 'disabled' : ''}>${equipped ? 'Equipped' : 'Equip'}</button>` : ''}
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
  const child = getCurrentChild()
  if (!child) return ''

  return `
    <section class="card parent-panel ${childIsRestricted(child) ? 'locked-panel' : ''}">
      <div class="section-heading wrap">
        <div>
          <p class="eyebrow">For grown-ups</p>
          <h2>Parent Settings</h2>
        </div>
        <button class="secondary" id="reset-current-profile">Reset current profile</button>
      </div>
      <div class="settings-grid">
        <label>
          <span>Age</span>
          <input id="age-setting" type="range" min="6" max="12" value="${child.settings.age}" ${!state.admin.unlocked ? 'disabled' : ''} />
          <strong>${child.settings.age} years old</strong>
        </label>
        <label>
          <span>Difficulty</span>
          <select id="difficulty-setting" ${!state.admin.unlocked ? 'disabled' : ''}>
            <option value="easy" ${child.settings.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
            <option value="medium" ${child.settings.difficulty === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="hard" ${child.settings.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
          </select>
        </label>
        <label>
          <span>Session time limit</span>
          <input id="time-limit-setting" type="range" min="10" max="60" step="5" value="${child.settings.timeLimit}" ${!state.admin.unlocked ? 'disabled' : ''} />
          <strong>${child.settings.timeLimit} minutes</strong>
        </label>
        <label class="toggle-row">
          <span>Sound</span>
          <button class="toggle ${child.settings.sound ? 'on' : ''}" id="toggle-sound" ${!state.admin.unlocked ? 'disabled' : ''}>${child.settings.sound ? 'ON' : 'OFF'}</button>
        </label>
        <label class="toggle-row">
          <span>Safe local-only mode</span>
          <button class="toggle ${child.settings.safeLocalMode ? 'on' : ''}" id="toggle-safe" ${!state.admin.unlocked ? 'disabled' : ''}>${child.settings.safeLocalMode ? 'ON' : 'OFF'}</button>
        </label>
      </div>
      <div class="safe-note">🔒 Parent settings require admin unlock. Saves stay local only.</div>
    </section>
  `
}

function renderAdminPanel() {
  const child = getCurrentChild()

  if (!state.admin.showPanel) return ''

  if (!state.admin.unlocked) {
    return `
      <section class="card admin-panel">
        <div class="section-heading wrap">
          <div>
            <p class="eyebrow">Admin</p>
            <h2>Unlock admin panel</h2>
          </div>
        </div>
        <div class="admin-login-row">
          <input id="admin-passcode" type="password" placeholder="Enter admin passcode" />
          <button class="primary" id="unlock-admin">Unlock</button>
        </div>
      </section>
    `
  }

  return `
    <section class="card admin-panel">
      <div class="section-heading wrap">
        <div>
          <p class="eyebrow">Admin tools</p>
          <h2>Aarav Admin Panel</h2>
        </div>
      </div>

      <div class="admin-section">
        <h3>Create child profile</h3>
        <div class="admin-create-grid">
          <input id="admin-child-name" type="text" placeholder="Child name" />
          <input id="admin-child-age" type="number" min="6" max="12" value="8" />
          <select id="admin-child-difficulty">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button class="primary" id="admin-create-child">Create Profile</button>
        </div>
      </div>

      <div class="admin-section">
        <h3>Child profiles</h3>
        <div class="admin-child-list">
          ${state.childProfiles
            .map(
              (entry) => `
                <div class="admin-child-card ${state.currentChildId === entry.id ? 'active' : ''}">
                  <div>
                    <strong>${entry.name}</strong>
                    <div>Age ${entry.settings.age} • ${entry.settings.difficulty} • ${entry.status}</div>
                    <div>Coins ${entry.profile.coins} • Stars ${entry.profile.stars} • Gems ${entry.profile.gems}</div>
                    ${childIsBanned(entry) ? `<div class="admin-note">Ban reason: ${entry.banReason}</div>` : ''}
                  </div>
                  <div class="admin-actions">
                    ${!childIsBanned(entry) ? `<button class="secondary" data-admin-switch="${entry.id}">Open</button>` : ''}
                    <button class="secondary" data-admin-lock="${entry.id}">${childIsLocked(entry) ? 'Unlock' : 'Lock'}</button>
                    ${childIsBanned(entry)
                      ? `<button class="secondary" data-admin-unban="${entry.id}">Unban</button>`
                      : `<button class="secondary" data-admin-ban="${entry.id}">Ban</button>`}
                    <button class="secondary" data-admin-give="${entry.id}" data-give-type="coins">+20 Coins</button>
                    <button class="secondary" data-admin-give="${entry.id}" data-give-type="stars">+10 Stars</button>
                    <button class="secondary" data-admin-reset="${entry.id}">Reset</button>
                    <button class="secondary danger" data-admin-delete="${entry.id}">Delete</button>
                  </div>
                  ${!childIsBanned(entry) ? `<input id="ban-reason-${entry.id}" type="text" placeholder="Reason if banning this profile" />` : ''}
                </div>
              `,
            )
            .join('')}
        </div>
      </div>

      ${child ? `
        <div class="admin-section">
          <h3>Current child: ${child.name}</h3>
          <div class="admin-note">Status: ${child.status}. Lock pauses access. Ban hides the profile from the child picker.</div>
        </div>
      ` : ''}
    </section>
  `
}

function render() {
  app.innerHTML = `
    <div class="app-shell">
      ${renderNav()}
      <main class="main-content">
        ${renderAdminPanel()}
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

  document.getElementById('open-admin')?.addEventListener('click', toggleAdminPanel)
  document.getElementById('unlock-admin')?.addEventListener('click', unlockAdmin)
  document.getElementById('admin-create-child')?.addEventListener('click', () => createChildProfileFromForm('admin'))
  document.getElementById('public-create-child')?.addEventListener('click', () => createChildProfileFromForm('public'))

  document.querySelectorAll('[data-admin-switch]').forEach((button) => {
    button.addEventListener('click', () => switchChildProfile(button.dataset.adminSwitch))
  })

  document.querySelectorAll('[data-admin-lock]').forEach((button) => {
    button.addEventListener('click', () => {
      const child = state.childProfiles.find((entry) => entry.id === button.dataset.adminLock)
      if (!child) return
      setChildStatus(child.id, childIsLocked(child) ? 'active' : 'locked')
    })
  })

  document.querySelectorAll('[data-admin-ban]').forEach((button) => {
    button.addEventListener('click', () => banChild(button.dataset.adminBan))
  })

  document.querySelectorAll('[data-admin-unban]').forEach((button) => {
    button.addEventListener('click', () => unbanChild(button.dataset.adminUnban))
  })

  document.querySelectorAll('[data-admin-give]').forEach((button) => {
    button.addEventListener('click', () => {
      const amount = button.dataset.giveType === 'coins' ? 20 : 10
      grantRewardToChild(button.dataset.adminGive, button.dataset.giveType, amount)
    })
  })

  document.querySelectorAll('[data-admin-reset]').forEach((button) => {
    button.addEventListener('click', () => resetProfile(button.dataset.adminReset))
  })

  document.querySelectorAll('[data-admin-delete]').forEach((button) => {
    button.addEventListener('click', () => removeProfile(button.dataset.adminDelete))
  })

  document.querySelectorAll('[data-switch-child]').forEach((button) => {
    button.addEventListener('click', () => switchChildProfile(button.dataset.switchChild))
  })

  document.querySelectorAll('[data-tab-target]').forEach((button) => {
    button.addEventListener('click', () => setTab(button.dataset.tabTarget))
  })

  document.querySelectorAll('[data-puzzle-set]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activePuzzleSet = button.dataset.puzzleSet
      const child = getCurrentChild()
      if (child) child.currentPuzzle = null
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
    const child = getCurrentChild()
    if (!child || !state.admin.unlocked) return
    child.settings.age = Number(event.target.value)
    child.currentPuzzle = null
    ensurePuzzle()
    saveState()
    render()
  })

  document.getElementById('difficulty-setting')?.addEventListener('change', (event) => {
    const child = getCurrentChild()
    if (!child || !state.admin.unlocked) return
    child.settings.difficulty = event.target.value
    child.currentPuzzle = null
    ensurePuzzle()
    saveState()
    render()
  })

  document.getElementById('time-limit-setting')?.addEventListener('input', (event) => {
    const child = getCurrentChild()
    if (!child || !state.admin.unlocked) return
    child.settings.timeLimit = Number(event.target.value)
    saveState()
    render()
  })

  document.getElementById('toggle-sound')?.addEventListener('click', () => {
    const child = getCurrentChild()
    if (!child || !state.admin.unlocked) return
    child.settings.sound = !child.settings.sound
    saveState()
    render()
  })

  document.getElementById('toggle-safe')?.addEventListener('click', () => {
    const child = getCurrentChild()
    if (!child || !state.admin.unlocked) return
    child.settings.safeLocalMode = !child.settings.safeLocalMode
    saveState()
    render()
  })

  document.getElementById('reset-current-profile')?.addEventListener('click', () => {
    const child = getCurrentChild()
    if (child && state.admin.unlocked) resetProfile(child.id)
  })
}

render()
