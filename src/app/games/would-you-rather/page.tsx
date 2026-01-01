'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Player {
  id: string;
  name: string;
  gender: 'male' | 'female';
}

const QUESTIONS = [
  {
    option1: "Have the ability to fly",
    option2: "Have the ability to be invisible"
  },
  {
    option1: "Never use social media again",
    option2: "Never watch another movie or TV show"
  },
  {
    option1: "Always say everything on your mind",
    option2: "Never speak again"
  },
  {
    option1: "Be able to talk to animals",
    option2: "Be able to speak all human languages"
  },
  {
    option1: "Live without music",
    option2: "Live without movies"
  },
  {
    option1: "Have to sing instead of speak",
    option2: "Have to dance everywhere you go"
  },
  {
    option1: "Be stuck on a broken ski lift",
    option2: "Be stuck in a broken elevator"
  },
  {
    option1: "Have unlimited money",
    option2: "Have unlimited free time"
  },
  {
    option1: "Know how you will die",
    option2: "Know when you will die"
  },
  {
    option1: "Be famous on social media",
    option2: "Win a Nobel Prize but be unknown"
  },
  {
    option1: "Always be 10 minutes late",
    option2: "Always be 20 minutes early"
  },
  {
    option1: "Have no taste buds",
    option2: "Have no sense of smell"
  },
  {
    option1: "Be able to read minds",
    option2: "Be able to see the future"
  },
  {
    option1: "Live in a world without music",
    option2: "Live in a world without color"
  },
  {
    option1: "Have a rewind button for your life",
    option2: "Have a pause button for your life"
  },
  {
    option1: "Be the funniest person in the room",
    option2: "Be the smartest person in the room"
  },
  {
    option1: "Only eat pizza for the rest of your life",
    option2: "Never eat pizza again"
  },
  {
    option1: "Have a chef cook for you every day",
    option2: "Have a personal masseuse every day"
  },
  {
    option1: "Live without heating",
    option2: "Live without air conditioning"
  },
  {
    option1: "Be able to teleport anywhere",
    option2: "Be able to time travel"
  },
  {
    option1: "Always have to tell the truth",
    option2: "Always have to lie"
  },
  {
    option1: "Be trapped in a romantic comedy with your enemies",
    option2: "Be trapped in a horror movie with your friends"
  },
  {
    option1: "Have to wear clown makeup every day",
    option2: "Have to wear a clown wig every day"
  },
  {
    option1: "Only be able to whisper",
    option2: "Only be able to shout"
  },
  {
    option1: "Fight one horse-sized duck",
    option2: "Fight 100 duck-sized horses"
  },
  {
    option1: "Have everyone be able to read your thoughts",
    option2: "Have everyone you know be able to access your search history"
  },
  {
    option1: "Give up your smartphone for a month",
    option2: "Give up all drinks except water for a month"
  },
  {
    option1: "Have a third arm",
    option2: "Have a third leg"
  },
  {
    option1: "Be stranded on a deserted island alone",
    option2: "Be stranded on a deserted island with someone you hate"
  },
  {
    option1: "Always get first pick at everything",
    option2: "Always get the last word"
  }
];

export default function WouldYouRather() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const partyId = searchParams.get('partyId');
  
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<typeof QUESTIONS[0] | null>(null);
  const [usedQuestions, setUsedQuestions] = useState<Set<number>>(new Set());
  const [roundCount, setRoundCount] = useState(0);
  const [votes, setVotes] = useState<{ option1: number; option2: number }>({ option1: 0, option2: 0 });
  const [hasVoted, setHasVoted] = useState(false);
  const [showResults, setShowResults] = useState(false);
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
    setCurrentQuestion(null);
    setUsedQuestions(new Set());
    setRoundCount(0);
    setVotes({ option1: 0, option2: 0 });
    setHasVoted(false);
    setShowResults(false);
    setStartTime(Date.now());
    setShowEndConfirm(false);
    setCurrentPlayerIndex(0);
    setShowPlayerSetup(false);
    nextQuestion();
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
          game: 'would-you-rather',
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

  const getRandomQuestion = () => {
    let used = usedQuestions;
    
    // Reset if all questions have been used
    if (used.size === QUESTIONS.length) {
      setUsedQuestions(new Set());
      used = new Set();
    }
    
    let index;
    do {
      index = Math.floor(Math.random() * QUESTIONS.length);
    } while (used.has(index));
    
    const newUsed = new Set(used);
    newUsed.add(index);
    setUsedQuestions(newUsed);
    
    return QUESTIONS[index];
  };

  const nextQuestion = () => {
    const question = getRandomQuestion();
    setCurrentQuestion(question);
    setRoundCount(roundCount + 1);
    setVotes({ option1: 0, option2: 0 });
    setHasVoted(false);
    setShowResults(false);
    
    // Rotate to next player if players exist
    if (players.length > 0) {
      setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
    }
  };

  const handleVote = (option: 'option1' | 'option2') => {
    if (!hasVoted) {
      setVotes(prev => ({
        ...prev,
        [option]: prev[option] + 1
      }));
      setHasVoted(true);
    }
  };

  const handleShowResults = () => {
    setShowResults(true);
  };

  const handleDrinkAndNext = () => {
    // Minority drinks (those who voted for the option with fewer votes)
    nextQuestion();
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => gameStarted ? setShowEndConfirm(true) : router.push('/dashboard')}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-white">Would You Rather</h1>
          <button
            onClick={() => setShowRulesModal(true)}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg"
          >
            Rules
          </button>
        </div>

        {!gameStarted ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to Would You Rather!</h2>
            <p className="text-gray-600 mb-6">
              Choose between two difficult options. The minority drinks! 
              If playing solo, just pick your preference and ponder your choices.
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
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-semibold text-lg"
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
                  <h2 className="text-4xl font-bold text-orange-600">
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

            {currentQuestion && (
              <div className="flex flex-col items-center space-y-6">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full text-center">
                  <h2 className="text-3xl font-bold text-gray-800 mb-8">Would You Rather...</h2>
                  
                  {!showResults ? (
                    <div className="space-y-4">
                      <button
                        onClick={() => handleVote('option1')}
                        disabled={hasVoted}
                        className={`w-full p-6 rounded-xl text-xl font-semibold transition transform hover:scale-105 ${
                          hasVoted 
                            ? 'bg-gray-300 cursor-not-allowed' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {currentQuestion.option1}
                      </button>
                      
                      <div className="text-2xl font-bold text-gray-400">OR</div>
                      
                      <button
                        onClick={() => handleVote('option2')}
                        disabled={hasVoted}
                        className={`w-full p-6 rounded-xl text-xl font-semibold transition transform hover:scale-105 ${
                          hasVoted 
                            ? 'bg-gray-300 cursor-not-allowed' 
                            : 'bg-purple-500 hover:bg-purple-600 text-white'
                        }`}
                      >
                        {currentQuestion.option2}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-6 rounded-xl bg-blue-100 border-2 border-blue-500">
                        <p className="text-xl font-semibold text-gray-800 mb-2">
                          {currentQuestion.option1}
                        </p>
                        <p className="text-3xl font-bold text-blue-600">
                          {votes.option1} {votes.option1 === 1 ? 'vote' : 'votes'}
                        </p>
                      </div>
                      
                      <div className="text-2xl font-bold text-gray-400">OR</div>
                      
                      <div className="p-6 rounded-xl bg-purple-100 border-2 border-purple-500">
                        <p className="text-xl font-semibold text-gray-800 mb-2">
                          {currentQuestion.option2}
                        </p>
                        <p className="text-3xl font-bold text-purple-600">
                          {votes.option2} {votes.option2 === 1 ? 'vote' : 'votes'}
                        </p>
                      </div>

                      {votes.option1 !== votes.option2 && (
                        <div className="mt-6 p-4 bg-yellow-100 border-2 border-yellow-500 rounded-lg">
                          <p className="text-lg font-bold text-yellow-800">
                            {votes.option1 < votes.option2 
                              ? `Option 1 voters drink! 🍺` 
                              : `Option 2 voters drink! 🍺`
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  {hasVoted && !showResults && (
                    <button
                      onClick={handleShowResults}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg"
                    >
                      Show Results
                    </button>
                  )}
                  
                  {showResults && (
                    <button
                      onClick={handleDrinkAndNext}
                      className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg"
                    >
                      Next Question
                    </button>
                  )}

                  {!hasVoted && (
                    <button
                      onClick={nextQuestion}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg"
                    >
                      Skip Question
                    </button>
                  )}
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
                  <h4 className="font-bold text-lg text-orange-600 mb-2">Basic Rules:</h4>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Read the "Would You Rather" question</li>
                    <li>Each player votes for their choice</li>
                    <li>After everyone votes, reveal results</li>
                    <li>The minority drinks!</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold text-lg text-blue-600 mb-2">Solo Mode:</h4>
                  <p>Just pick your preference and enjoy the thought-provoking questions!</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-lg text-purple-600 mb-2">Multiplayer:</h4>
                  <p>Players in the minority (fewer votes) must drink. If it's a tie, everyone drinks!</p>
                </div>
                
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <p className="text-sm font-semibold text-orange-800">
                    💡 Tip: There are no wrong answers - just choose what feels right for you!
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-full mt-6 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold"
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
