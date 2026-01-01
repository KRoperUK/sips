'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Player {
  id: string;
  name: string;
  gender: 'male' | 'female';
}

const TRUTHS = [
  "What's the most embarrassing thing you've done while drinking?",
  "Who in this group would you most want to kiss?",
  "What's your biggest secret that no one here knows?",
  "What's the worst date you've ever been on?",
  "Have you ever cheated in a relationship?",
  "What's the most illegal thing you've ever done?",
  "What's your biggest fear?",
  "Who was your first crush?",
  "What's the most childish thing you still do?",
  "What's a lie you tell most often?",
  "What's the meanest thing you've ever said to someone?",
  "What's your biggest insecurity?",
  "Have you ever had a crush on someone in this room?",
  "What's the longest you've gone without showering?",
  "What's your most embarrassing childhood memory?",
  "Have you ever ghosted someone? Why?",
  "What's the worst thing you've ever said about someone behind their back?",
  "What's your biggest regret?",
  "Have you ever lied to get out of a bad date?",
  "What's something you've never told your best friend?",
];

const DARES = [
  "Take 3 shots in a row",
  "Let someone check your phone for 2 minutes",
  "Post an embarrassing photo on social media",
  "Do your best impression of someone in the group",
  "Speak in an accent for the next 3 rounds",
  "Let the group read your last 5 text messages out loud",
  "Dance with no music for 1 minute",
  "Sing everything you say for the next 10 minutes",
  "Do 20 pushups",
  "Swap an item of clothing with someone",
  "Send a text to your crush",
  "Let someone give you a new hairstyle",
  "Call a random contact and sing them a song",
  "Eat a spoonful of a condiment chosen by the group",
  "Do your best belly dance",
  "Let someone draw on your face with a marker",
  "Tell the group your most embarrassing story",
  "Do the worm",
  "Speak in third person for the next 15 minutes",
  "Let the person to your right post anything on your social media",
];

export default function TruthOrDare() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const partyId = searchParams.get('partyId');
  
  const [gameStarted, setGameStarted] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [promptType, setPromptType] = useState<'truth' | 'dare' | null>(null);
  const [usedTruths, setUsedTruths] = useState<Set<number>>(new Set());
  const [usedDares, setUsedDares] = useState<Set<number>>(new Set());
  const [roundCount, setRoundCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  
  // Player management
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [showPlayerSetup, setShowPlayerSetup] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerGender, setNewPlayerGender] = useState<'male' | 'female'>('male');
  const [party, setParty] = useState<any>(null);
  
  // Rules modal
  const [showRulesModal, setShowRulesModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch party data if in party mode
  useEffect(() => {
    if (!partyId) return;

    const fetchParty = async () => {
      try {
        const res = await fetch(`/api/party/${partyId}`);
        if (res.ok) {
          const data = await res.json();
          setParty(data);
          
          // Auto-populate players from party data
          if (data.players && data.players.length > 0) {
            const partyPlayers: Player[] = data.players.map((p: any) => ({
              id: p.userId,
              name: p.name.split(' ')[0], // Use first name only
              gender: 'male' as 'male' | 'female', // Default
            }));
            setPlayers(partyPlayers);
          }
        }
      } catch (error) {
        console.error('Error fetching party:', error);
      }
    };

    fetchParty();
  }, [partyId]);

  const startGame = () => {
    setGameStarted(true);
    setCurrentPrompt(null);
    setPromptType(null);
    setUsedTruths(new Set());
    setUsedDares(new Set());
    setRoundCount(0);
    setStartTime(Date.now());
    setShowEndConfirm(false);
    setCurrentPlayerIndex(0);
    setShowPlayerSetup(false);
  };

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    
    const newPlayer: Player = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newPlayerName.trim(),
      gender: newPlayerGender,
    };
    
    setPlayers([...players, newPlayer]);
    setNewPlayerName('');
  };

  const removePlayer = (playerId: string) => {
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const endGame = async () => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    // Save game history
    try {
      await fetch('/api/game/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: 'truth-or-dare',
          duration,
          rounds: roundCount,
          players: players.map(p => p.name),
        }),
      });
    } catch (error) {
      console.error('Error saving game:', error);
    }
    
    router.push('/dashboard');
  };

  const getRandomPrompt = (type: 'truth' | 'dare') => {
    const prompts = type === 'truth' ? TRUTHS : DARES;
    const used = type === 'truth' ? usedTruths : usedDares;
    
    // Reset if all prompts have been used
    if (used.size === prompts.length) {
      if (type === 'truth') {
        setUsedTruths(new Set());
      } else {
        setUsedDares(new Set());
      }
      used.clear();
    }
    
    let index;
    do {
      index = Math.floor(Math.random() * prompts.length);
    } while (used.has(index));
    
    const newUsed = new Set(used);
    newUsed.add(index);
    
    if (type === 'truth') {
      setUsedTruths(newUsed);
    } else {
      setUsedDares(newUsed);
    }
    
    return prompts[index];
  };

  const handleChoice = (type: 'truth' | 'dare') => {
    const prompt = getRandomPrompt(type);
    setCurrentPrompt(prompt);
    setPromptType(type);
    setRoundCount(roundCount + 1);
  };

  const nextRound = () => {
    setCurrentPrompt(null);
    setPromptType(null);
    
    // Rotate to next player if players exist
    if (players.length > 0) {
      setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-600 to-purple-700 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => gameStarted ? setShowEndConfirm(true) : router.push('/dashboard')}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-white">Truth or Dare</h1>
          <button
            onClick={() => setShowRulesModal(true)}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg"
          >
            Rules
          </button>
        </div>

        {!gameStarted ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to Truth or Dare!</h2>
            <p className="text-gray-600 mb-6">
              Take turns choosing Truth or Dare. Answer honestly or complete the dare... or take a drink!
            </p>
            
            {/* Player Setup - Only show in solo mode */}
            {!partyId && (
              <div className="mb-6">
                {!showPlayerSetup ? (
                  <button
                    onClick={() => setShowPlayerSetup(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg mb-4"
                  >
                    {players.length > 0 ? `${players.length} Players Added` : 'Add Players (Optional)'}
                  </button>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="font-semibold mb-4">Add Players</h3>
                    
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                        placeholder="Player name"
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      <button
                        onClick={() => setNewPlayerGender(newPlayerGender === 'male' ? 'female' : 'male')}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                          newPlayerGender === 'male' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-pink-500 text-white'
                        }`}
                      >
                        {newPlayerGender === 'male' ? 'Male ♂' : 'Female ♀'}
                      </button>
                      <button
                        onClick={addPlayer}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                      >
                        Add
                      </button>
                    </div>
                    
                    {players.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {players.map(player => (
                            <div
                              key={player.id}
                              className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border"
                            >
                              <span>{player.gender === 'male' ? '♂' : '♀'} {player.name}</span>
                              <button
                                onClick={() => removePlayer(player.id)}
                                className="text-red-500 hover:text-red-700 font-bold"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => setShowPlayerSetup(false)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {partyId && players.length > 0 && (
              <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                <p className="font-semibold mb-2">Party Mode - {players.length} Players</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {players.map(p => (
                    <span key={p.id} className="bg-white px-3 py-1 rounded-full text-sm">
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={startGame}
              className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-lg font-semibold text-lg"
            >
              Start Game
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Turn Display */}
            {players.length > 0 && (
              <div className="bg-white rounded-lg p-6 text-center">
                <p className="text-gray-600 mb-2">Current Turn</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl">
                    {players[currentPlayerIndex].gender === 'male' ? '♂' : '♀'}
                  </span>
                  <h2 className="text-4xl font-bold text-pink-600">
                    {players[currentPlayerIndex].name}
                  </h2>
                </div>
              </div>
            )}
            
            {/* Player Chips */}
            {players.length > 1 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        index === currentPlayerIndex
                          ? 'bg-yellow-400 text-gray-900'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {player.gender === 'male' ? '♂' : '♀'} {player.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white text-center">
              <span className="text-lg">Round: {roundCount}</span>
            </div>

            {!currentPrompt ? (
              <div className="flex flex-col items-center space-y-6">
                <p className="text-white text-2xl font-bold text-center">
                  Choose wisely...
                </p>
                <div className="flex gap-6">
                  <button
                    onClick={() => handleChoice('truth')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-12 py-8 rounded-2xl font-bold text-3xl shadow-2xl transform hover:scale-105 transition"
                  >
                    Truth
                  </button>
                  <button
                    onClick={() => handleChoice('dare')}
                    className="bg-red-500 hover:bg-red-600 text-white px-12 py-8 rounded-2xl font-bold text-3xl shadow-2xl transform hover:scale-105 transition"
                  >
                    Dare
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-6">
                <div className={`inline-block px-6 py-2 rounded-full text-white font-bold text-xl ${
                  promptType === 'truth' ? 'bg-blue-500' : 'bg-red-500'
                }`}>
                  {promptType === 'truth' ? 'TRUTH' : 'DARE'}
                </div>
                
                <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
                  <p className="text-2xl text-center font-medium text-gray-800">
                    {currentPrompt}
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={nextRound}
                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg"
                  >
                    Done! Next Round
                  </button>
                  <button
                    onClick={nextRound}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg"
                  >
                    Refused - Drink!
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {showEndConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold mb-4">End Game?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to end the game? Your progress will be saved.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-3 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={endGame}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold"
                >
                  End Game
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rules Modal */}
        {showRulesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">How to Play</h3>
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4 text-gray-700">
                <div>
                  <h4 className="font-bold text-lg text-pink-600 mb-2">Basic Rules:</h4>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Take turns choosing Truth or Dare</li>
                    <li>Answer the truth question honestly</li>
                    <li>Complete the dare challenge</li>
                    <li>If you refuse, take a drink!</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold text-lg text-blue-600 mb-2">Truth:</h4>
                  <p>Answer a personal question honestly. The more embarrassing, the better!</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-lg text-red-600 mb-2">Dare:</h4>
                  <p>Complete a challenge or task. Don't be shy - go for it!</p>
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-sm font-semibold text-yellow-800">
                    💡 Tip: Keep it fun and respectful. Know your limits!
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-full mt-6 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Got It!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
