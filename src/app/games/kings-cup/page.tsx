'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

const CARDS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♦', '♣'];

const RULES: Record<string, { title: string; description: string }> = {
  'A': { title: 'Waterfall', description: 'Everyone starts drinking. You can\'t stop until the person to your right stops.' },
  '2': { title: 'You', description: 'Pick someone to take a drink.' },
  '3': { title: 'Me', description: 'You take a drink.' },
  '4': { title: 'Floor', description: 'Last person to touch the floor drinks.' },
  '5': { title: 'Guys', description: 'All guys drink.' },
  '6': { title: 'Chicks', description: 'All girls drink.' },
  '7': { title: 'Heaven', description: 'Last person to raise their hand drinks.' },
  '8': { title: 'Mate', description: 'Pick a drinking buddy. They drink when you drink.' },
  '9': { title: 'Rhyme', description: 'Say a word. Everyone says a rhyming word. First to fail drinks.' },
  '10': { title: 'Categories', description: 'Pick a category. Everyone names something in that category. First to fail drinks.' },
  'J': { title: 'Make a Rule', description: 'Create a new rule that everyone must follow. Breaking it = drink.' },
  'Q': { title: 'Questions', description: 'Ask someone a question. They must respond with a question. First to fail drinks.' },
  'K': { title: 'King\'s Cup', description: 'Pour some of your drink into the cup. Last King drinks it all!' },
};

interface Card {
  value: string;
  suit: string;
}

interface Player {
  id: string;
  name: string;
  gender: 'male' | 'female';
}

interface Mate {
  playerId: string;
  mateId: string;
}

export default function KingsCup() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const partyId = searchParams.get('partyId');
  const [deck, setDeck] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [cardsDrawn, setCardsDrawn] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [kingsDrawn, setKingsDrawn] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  
  // Player management
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [showPlayerSetup, setShowPlayerSetup] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerGender, setNewPlayerGender] = useState<'male' | 'female'>('male');
  const [party, setParty] = useState<any>(null);
  
  // Mate tracking
  const [mates, setMates] = useState<Mate[]>([]);
  const [showMateSelection, setShowMateSelection] = useState(false);
  
  // Question master tracking
  const [questionMasterId, setQuestionMasterId] = useState<string | null>(null);
  
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
              gender: 'male' as 'male' | 'female', // Default, can be updated
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

  const shuffleDeck = () => {
    const newDeck: Card[] = [];
    for (const value of CARDS) {
      for (const suit of SUITS) {
        newDeck.push({ value, suit });
      }
    }
    // Fisher-Yates shuffle
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  };

  const startGame = () => {
    setDeck(shuffleDeck());
    setCurrentCard(null);
    setCardsDrawn(0);
    setGameStarted(true);
    setKingsDrawn(0);
    setStartTime(Date.now());
    setCurrentPlayerIndex(0);
    setShowPlayerSetup(false);
    setMates([]);
    setShowMateSelection(false);
    setQuestionMasterId(null);
  };

  const getQuestionMaster = (): Player | null => {
    if (!questionMasterId) return null;
    return players.find(p => p.id === questionMasterId) || null;
  };

  const getMateForPlayer = (playerId: string): Player | null => {
    const mateRelation = mates.find(m => m.playerId === playerId);
    if (!mateRelation) return null;
    return players.find(p => p.id === mateRelation.mateId) || null;
  };

  const selectMate = (mateId: string) => {
    const currentPlayerId = players[currentPlayerIndex].id;
    
    // Remove any existing mate relationship for current player
    const updatedMates = mates.filter(m => m.playerId !== currentPlayerId);
    
    // Add new mate relationship
    updatedMates.push({
      playerId: currentPlayerId,
      mateId: mateId,
    });
    
    setMates(updatedMates);
    setShowMateSelection(false);
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

  const getAffectedPlayers = (cardValue: string): Player[] => {
    if (cardValue === '5') {
      // Guys drink
      return players.filter(p => p.gender === 'male');
    } else if (cardValue === '6') {
      // Chicks drink
      return players.filter(p => p.gender === 'female');
    }
    return [];
  };

  const endGame = async () => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    // Save game history
    try {
      await fetch('/api/game/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: 'kings-cup',
          duration,
          cardsDrawn,
          players: players.map(p => p.name),
        }),
      });
    } catch (error) {
      console.error('Error saving game:', error);
    }
    
    router.push('/dashboard');
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    addPlayer();
  };

  const drawCard = () => {
    if (deck.length === 0) return;
    
    const [drawnCard, ...remainingDeck] = deck;
    setCurrentCard(drawnCard);
    setDeck(remainingDeck);
    setCardsDrawn(cardsDrawn + 1);
    
    if (drawnCard.value === 'K') {
      setKingsDrawn(kingsDrawn + 1);
    }

    // Set question master if Queen is drawn (before moving to next player)
    if (drawnCard.value === 'Q' && players.length > 0) {
      setQuestionMasterId(players[currentPlayerIndex].id);
    }

    // Show mate selection if card 8 is drawn and there are other players
    if (drawnCard.value === '8' && players.length > 1) {
      setShowMateSelection(true);
    }

    // Move to next player if multiple players
    if (players.length > 0) {
      setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
    }
  };

  const getSuitColor = (suit: string) => {
    return suit === '♥' || suit === '♦' ? 'text-red-600' : 'text-black';
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-white">King's Cup</h1>
          <button
            onClick={() => setShowRulesModal(true)}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg"
          >
            Rules
          </button>
        </div>

        {!gameStarted ? (
          <div className="bg-white rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4 text-center">Welcome to King's Cup!</h2>
            <p className="text-gray-600 mb-6 text-center">
              Draw cards and follow the rules. When you draw a King, pour some of your drink into the center cup. 
              The person who draws the 4th King drinks the King's Cup!
            </p>

            {!partyId && (
              <div className="mb-6 border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Players (Optional)</h3>
                  <button
                    onClick={() => setShowPlayerSetup(!showPlayerSetup)}
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    {showPlayerSetup ? 'Hide' : 'Add Players'}
                  </button>
                </div>

                {showPlayerSetup && (
                  <div className="space-y-4">
                    <form onSubmit={handleAddPlayer} className="flex gap-2">
                      <input
                        type="text"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        placeholder="Player name"
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setNewPlayerGender('male')}
                          className={`px-4 py-2 rounded-lg font-medium transition ${
                            newPlayerGender === 'male'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          ♂ Male
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewPlayerGender('female')}
                          className={`px-4 py-2 rounded-lg font-medium transition ${
                            newPlayerGender === 'female'
                              ? 'bg-pink-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          ♀ Female
                        </button>
                      </div>
                      <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
                      >
                        Add
                      </button>
                    </form>

                    {players.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 font-medium">Added Players:</p>
                        <div className="space-y-1">
                          {players.map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg"
                            >
                              <span className="flex items-center gap-2">
                                <span className={player.gender === 'male' ? 'text-blue-600' : 'text-pink-600'}>
                                  {player.gender === 'male' ? '♂' : '♀'}
                                </span>
                                <span className="font-medium">{player.name}</span>
                              </span>
                              <button
                                onClick={() => removePlayer(player.id)}
                                className="text-red-600 hover:text-red-700 font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {partyId && party && (
              <div className="mb-6 border-t pt-6">
                <h3 className="text-lg font-semibold mb-3">Party Players</h3>
                <div className="space-y-1">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg"
                    >
                      <span className={player.gender === 'male' ? 'text-blue-600' : 'text-pink-600'}>
                        {player.gender === 'male' ? '♂' : '♀'}
                      </span>
                      <span className="font-medium">{player.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={startGame}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold text-lg"
              >
                Start Game
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
              <div className="flex justify-between items-center">
                <span>Cards Drawn: {cardsDrawn} / 52</span>
                <span>Kings: {kingsDrawn} / 4</span>
                <span>Cards Left: {deck.length}</span>
              </div>
            </div>

            {players.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
                <div className="text-center mb-3">
                  <p className="text-sm opacity-80">Current Turn:</p>
                  <p className="text-2xl font-bold flex items-center justify-center gap-2">
                    <span className={players[currentPlayerIndex].gender === 'male' ? 'text-blue-300' : 'text-pink-300'}>
                      {players[currentPlayerIndex].gender === 'male' ? '♂' : '♀'}
                    </span>
                    {players[currentPlayerIndex].name}
                  </p>
                </div>
                
                {questionMasterId && (
                  <div className="text-center mb-3 pb-3 border-b border-white/20">
                    <p className="text-sm opacity-80">Question Master:</p>
                    <p className="text-lg font-bold flex items-center justify-center gap-2">
                      <span>👑</span>
                      {getQuestionMaster()?.name}
                    </p>
                    <p className="text-xs opacity-70 mt-1">Don't answer their questions or drink!</p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 justify-center mb-3">
                  {players.map((player, idx) => {
                    const mate = getMateForPlayer(player.id);
                    const isQuestionMaster = questionMasterId === player.id;
                    return (
                      <div
                        key={player.id}
                        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                          idx === currentPlayerIndex
                            ? 'bg-yellow-500 text-white font-bold'
                            : 'bg-white/20 text-white/80'
                        }`}
                      >
                        {isQuestionMaster && <span className="text-xs">👑</span>}
                        {player.name}
                        {mate && (
                          <span className="ml-1 text-xs">
                            💑{mate.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {(mates.length > 0 || questionMasterId) && (
                  <div className="text-center text-xs opacity-70 border-t border-white/20 pt-2 space-y-1">
                    {mates.length > 0 && <p>💑 = Drinking Buddies</p>}
                    {questionMasterId && <p>👑 = Question Master</p>}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col items-center space-y-6">
              {currentCard ? (
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-64 h-96 flex flex-col items-center justify-center">
                  <div className={`text-8xl font-bold ${getSuitColor(currentCard.suit)}`}>
                    {currentCard.value}
                  </div>
                  <div className={`text-6xl ${getSuitColor(currentCard.suit)}`}>
                    {currentCard.suit}
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl w-64 h-96 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">?</span>
                </div>
              )}

              {currentCard && (
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-2xl font-bold mb-2">{RULES[currentCard.value].title}</h3>
                  <p className="text-gray-700">{RULES[currentCard.value].description}</p>
                  
                  {/* Show mate reminder for card 8 */}
                  {currentCard.value === '8' && players.length > 1 && (
                    <div className="mt-4 p-4 bg-purple-50 border-2 border-purple-500 rounded-lg">
                      <p className="font-semibold text-purple-900 text-center">
                        💑 Choose your drinking buddy!
                      </p>
                    </div>
                  )}

                  {/* Show question master announcement for card Q */}
                  {currentCard.value === 'Q' && players.length > 0 && (() => {
                    const previousPlayerIndex = currentPlayerIndex === 0 ? players.length - 1 : currentPlayerIndex - 1;
                    const previousPlayer = players[previousPlayerIndex];
                    
                    return (
                      <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-500 rounded-lg">
                        <p className="font-semibold text-yellow-900 text-center flex items-center justify-center gap-2">
                          <span className="text-2xl">👑</span>
                          <span>{previousPlayer?.name} is now the Question Master!</span>
                        </p>
                        <p className="text-yellow-800 text-sm text-center mt-2">
                          Anyone who answers their questions must drink until the next Queen is drawn.
                        </p>
                      </div>
                    );
                  })()}
                  
                  {/* Show affected players for Guys (5) or Chicks (6) */}
                  {players.length > 0 && (currentCard.value === '5' || currentCard.value === '6') && (
                    <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-500 rounded-lg">
                      <p className="font-semibold text-blue-900 mb-2">
                        {currentCard.value === '5' ? 'Guys Drink! 🍺' : 'Chicks Drink! 🍺'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {getAffectedPlayers(currentCard.value).map((player) => (
                          <span
                            key={player.id}
                            className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium flex items-center gap-1"
                          >
                            <span>{player.gender === 'male' ? '♂' : '♀'}</span>
                            {player.name}
                          </span>
                        ))}
                      </div>
                      {getAffectedPlayers(currentCard.value).length === 0 && (
                        <p className="text-blue-700 text-sm italic">No affected players</p>
                      )}
                    </div>
                  )}

                  {/* Show mate drinks notification for cards where current player drinks */}
                  {players.length > 1 && ['2', '3', 'A'].includes(currentCard.value) && (() => {
                    const previousPlayerIndex = currentPlayerIndex === 0 ? players.length - 1 : currentPlayerIndex - 1;
                    const previousPlayer = players[previousPlayerIndex];
                    const mate = previousPlayer ? getMateForPlayer(previousPlayer.id) : null;
                    
                    return mate && (
                      <div className="mt-4 p-4 bg-pink-50 border-2 border-pink-500 rounded-lg">
                        <p className="font-semibold text-pink-900 text-center flex items-center justify-center gap-2">
                          <span>💑</span>
                          <span>{mate.name} also drinks! (Mate of {previousPlayer.name})</span>
                        </p>
                      </div>
                    );
                  })()}
                  
                  {currentCard.value === 'K' && kingsDrawn === 4 && (
                    <div className="mt-4 p-4 bg-red-100 border-2 border-red-600 rounded-lg">
                      <p className="text-red-700 font-bold text-center">
                        DRINK THE KING'S CUP! 👑
                      </p>
                    </div>
                  )}
                </div>
              )}

              {deck.length > 0 ? (
                <div className="flex gap-4">
                  <button
                    onClick={drawCard}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 rounded-lg font-bold text-xl shadow-lg"
                  >
                    Draw Card
                  </button>
                  <button
                    onClick={() => setShowEndConfirm(true)}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-lg font-semibold"
                  >
                    End Game
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-6 text-center">
                  <h3 className="text-2xl font-bold mb-4">Game Over!</h3>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={startGame}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
                    >
                      Play Again
                    </button>
                    <button
                      onClick={endGame}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
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

        {showMateSelection && currentCard?.value === '8' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold mb-2">Card 8: Mate!</h3>
              <p className="text-gray-600 mb-4">
                Pick a drinking buddy. They drink when you drink!
              </p>
              <p className="text-sm font-semibold mb-4 text-gray-800">
                {players[currentPlayerIndex]?.name}, choose your mate:
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {players
                  .filter((p) => p.id !== players[currentPlayerIndex]?.id)
                  .map((player) => (
                    <button
                      key={player.id}
                      onClick={() => selectMate(player.id)}
                      className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-purple-100 rounded-lg transition border-2 border-transparent hover:border-purple-500"
                    >
                      <span className={player.gender === 'male' ? 'text-blue-600 text-2xl' : 'text-pink-600 text-2xl'}>
                        {player.gender === 'male' ? '♂' : '♀'}
                      </span>
                      <span className="font-semibold text-lg">{player.name}</span>
                    </button>
                  ))}
              </div>
              <button
                onClick={() => setShowMateSelection(false)}
                className="w-full mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-3 rounded-lg font-semibold"
              >
                Skip (No Mate)
              </button>
            </div>
          </div>
        )}

        {/* Rules Modal */}
        {showRulesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold">King's Cup Rules</h3>
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                {Object.entries(RULES).map(([card, rule]) => (
                  <div key={card} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-start gap-4">
                      <div className={`text-3xl font-bold min-w-[60px] ${
                        card === 'A' || card === 'K' || card === 'Q' || card === 'J' 
                          ? 'text-red-600' 
                          : 'text-gray-800'
                      }`}>
                        {card}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-1">
                          {rule.title}
                        </h4>
                        <p className="text-gray-600">
                          {rule.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-bold text-lg mb-2">Game Setup:</h4>
                <ul className="text-gray-700 space-y-1 list-disc list-inside">
                  <li>Place an empty cup in the center</li>
                  <li>Spread cards face-down in a circle around the cup</li>
                  <li>Take turns drawing cards</li>
                  <li>When you draw a King, pour some of your drink into the center cup</li>
                  <li>The person who draws the 4th King drinks the entire King's Cup!</li>
                </ul>
              </div>
              
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold text-lg"
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
