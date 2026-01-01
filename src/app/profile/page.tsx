'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: string;
  lastLogin: string;
}

interface GameHistory {
  id: string;
  userId: string;
  game: 'kings-cup' | 'truth-or-dare' | 'would-you-rather';
  timestamp: string;
  players: string[];
  duration?: number;
}

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (!res.ok) {
        throw new Error('Failed to fetch profile data');
      }
      const data = await res.json();
      setUser(data.user);
      setGameHistory(data.gameHistory);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (!session || !user) {
    return null;
  }

  const gameNames: Record<string, string> = {
    'kings-cup': "King's Cup",
    'truth-or-dare': 'Truth or Dare',
    'would-you-rather': 'Would You Rather',
  };

  const gameIcons: Record<string, string> = {
    'kings-cup': '👑',
    'truth-or-dare': '🤔',
    'would-you-rather': '🤷',
  };

  // Calculate stats
  const totalGames = gameHistory.length;
  const gamesByType = gameHistory.reduce((acc, game) => {
    acc[game.game] = (acc[game.game] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const favoriteGame = Object.entries(gamesByType).sort((a, b) => b[1] - a[1])[0];
  const totalPlayTime = gameHistory.reduce((acc, game) => acc + (game.duration || 0), 0);
  const avgPlayTime = totalGames > 0 ? Math.round(totalPlayTime / totalGames) : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-white">My Profile</h1>
          <div className="w-40"></div>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-xl p-8 mb-6 shadow-2xl">
          <div className="flex items-center gap-6 mb-6">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="w-24 h-24 rounded-full border-4 border-purple-500"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-purple-500">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-3xl font-bold text-gray-800">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500 mt-2">
                Member since {formatDate(user.createdAt)}
              </p>
              <p className="text-sm text-gray-500">
                Last login: {formatDate(user.lastLogin)}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-white mb-2">{totalGames}</div>
            <div className="text-white/80">Games Played</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">
              {favoriteGame ? gameIcons[favoriteGame[0]] : '🎮'}
            </div>
            <div className="text-white font-semibold">
              {favoriteGame ? gameNames[favoriteGame[0]] : 'No games yet'}
            </div>
            <div className="text-white/80 text-sm">Favorite Game</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-white mb-2">
              {formatDuration(totalPlayTime)}
            </div>
            <div className="text-white/80">Total Play Time</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-white mb-2">
              {formatDuration(avgPlayTime)}
            </div>
            <div className="text-white/80">Avg Game Time</div>
          </div>
        </div>

        {/* Games by Type */}
        {totalGames > 0 && (
          <div className="bg-white rounded-xl p-6 mb-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Games by Type</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(gameNames).map(([gameId, gameName]) => {
                const count = gamesByType[gameId] || 0;
                const percentage = totalGames > 0 ? Math.round((count / totalGames) * 100) : 0;
                return (
                  <div key={gameId} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{gameIcons[gameId]}</span>
                        <span className="font-semibold text-gray-800">{gameName}</span>
                      </div>
                      <span className="text-2xl font-bold text-purple-600">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{percentage}% of games</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Game History */}
        <div className="bg-white rounded-xl p-6 shadow-2xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Game History</h3>
          
          {gameHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎮</div>
              <p className="text-gray-600 text-lg mb-2">No games played yet</p>
              <p className="text-gray-500">Start playing to build your history!</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Play Your First Game
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {gameHistory.map((game) => (
                <div
                  key={game.id}
                  className="bg-gray-50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{gameIcons[game.game]}</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{gameNames[game.game]}</h4>
                      <p className="text-sm text-gray-600">
                        {formatDate(game.timestamp)}
                      </p>
                      {game.players.length > 1 && (
                        <p className="text-sm text-gray-500">
                          {game.players.length} players
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {game.duration && (
                      <p className="text-sm font-semibold text-purple-600">
                        {formatDuration(game.duration)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-white/60 text-sm">
          <p>Keep playing to unlock more achievements!</p>
        </div>
      </div>
    </div>
  );
}
