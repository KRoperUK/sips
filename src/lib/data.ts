import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_DIR = path.join(DATA_DIR, 'users');
const GAME_HISTORY_DIR = path.join(DATA_DIR, 'game-history');
const PARTIES_DIR = path.join(DATA_DIR, 'parties');

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: string;
  lastLogin: string;
}

export interface GameHistory {
  id: string;
  userId: string;
  game: 'kings-cup' | 'truth-or-dare' | 'would-you-rather';
  timestamp: string;
  players: string[];
  duration?: number;
}

export interface Party {
  id: string;
  code: string;
  hostId: string;
  hostName: string;
  game: 'kings-cup' | 'truth-or-dare' | 'would-you-rather';
  players: PartyPlayer[];
  createdAt: string;
  updatedAt: string;
  status: 'waiting' | 'in-progress' | 'finished';
  gameState?: any;
}

export interface PartyPlayer {
  userId: string;
  name: string;
  image?: string;
  joinedAt: string;
}

// Ensure directories exist
export function ensureDataDirs() {
  [DATA_DIR, USERS_DIR, GAME_HISTORY_DIR, PARTIES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// User operations
export async function saveUser(user: User): Promise<void> {
  ensureDataDirs();
  const filePath = path.join(USERS_DIR, `${user.id}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(user, null, 2));
}

export async function getUser(userId: string): Promise<User | null> {
  ensureDataDirs();
  const filePath = path.join(USERS_DIR, `${userId}.json`);
  try {
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  ensureDataDirs();
  try {
    const files = await fs.promises.readdir(USERS_DIR);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = await fs.promises.readFile(path.join(USERS_DIR, file), 'utf-8');
        const user = JSON.parse(data);
        if (user.email === email) {
          return user;
        }
      }
    }
  } catch (error) {
    // Directory might not exist or be empty
    return null;
  }
  return null;
}

// Game history operations
export async function saveGameHistory(history: GameHistory): Promise<void> {
  ensureDataDirs();
  const filePath = path.join(GAME_HISTORY_DIR, `${history.id}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(history, null, 2));
}

export async function getUserGameHistory(userId: string): Promise<GameHistory[]> {
  ensureDataDirs();
  const history: GameHistory[] = [];
  
  try {
    const files = await fs.promises.readdir(GAME_HISTORY_DIR);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = await fs.promises.readFile(path.join(GAME_HISTORY_DIR, file), 'utf-8');
        const gameHistory = JSON.parse(data);
        if (gameHistory.userId === userId) {
          history.push(gameHistory);
        }
      }
    }
  } catch (error) {
    // Directory might not exist or be empty
    return [];
  }
  
  return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Party operations
function generatePartyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar looking characters
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createParty(
  hostId: string,
  hostName: string,
  game: Party['game']
): Promise<Party> {
  ensureDataDirs();
  
  const code = generatePartyCode();
  const party: Party = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    code,
    hostId,
    hostName,
    game,
    players: [{
      userId: hostId,
      name: hostName,
      joinedAt: new Date().toISOString(),
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'waiting',
  };
  
  const filePath = path.join(PARTIES_DIR, `${party.id}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(party, null, 2));
  return party;
}

export async function getParty(partyId: string): Promise<Party | null> {
  ensureDataDirs();
  const filePath = path.join(PARTIES_DIR, `${partyId}.json`);
  try {
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

export async function getPartyByCode(code: string): Promise<Party | null> {
  ensureDataDirs();
  try {
    const files = await fs.promises.readdir(PARTIES_DIR);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = await fs.promises.readFile(path.join(PARTIES_DIR, file), 'utf-8');
        const party = JSON.parse(data);
        if (party.code === code.toUpperCase()) {
          return party;
        }
      }
    }
  } catch (error) {
    return null;
  }
  return null;
}

export async function updateParty(party: Party): Promise<void> {
  ensureDataDirs();
  party.updatedAt = new Date().toISOString();
  const filePath = path.join(PARTIES_DIR, `${party.id}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(party, null, 2));
}

export async function joinParty(
  partyId: string,
  userId: string,
  userName: string,
  userImage?: string
): Promise<Party | null> {
  const party = await getParty(partyId);
  if (!party) return null;
  
  // Check if user already in party
  const existingPlayer = party.players.find(p => p.userId === userId);
  if (existingPlayer) {
    return party;
  }
  
  party.players.push({
    userId,
    name: userName,
    image: userImage,
    joinedAt: new Date().toISOString(),
  });
  
  await updateParty(party);
  return party;
}

export async function leaveParty(partyId: string, userId: string): Promise<Party | null> {
  const party = await getParty(partyId);
  if (!party) return null;
  
  party.players = party.players.filter(p => p.userId !== userId);
  
  // If host leaves and there are other players, assign new host
  if (party.hostId === userId && party.players.length > 0) {
    party.hostId = party.players[0].userId;
    party.hostName = party.players[0].name;
  }
  
  // If no players left, mark as finished
  if (party.players.length === 0) {
    party.status = 'finished';
  }
  
  await updateParty(party);
  return party;
}

export async function deleteParty(partyId: string): Promise<void> {
  ensureDataDirs();
  const filePath = path.join(PARTIES_DIR, `${partyId}.json`);
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    // File might not exist
  }
}

