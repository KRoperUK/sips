'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const GAMES = [
  {
    id: 'kings-cup',
    title: "King's Cup",
    description: 'Classic card-based drinking game with rules for each card',
    color: 'from-green-500 to-green-700',
    icon: '👑',
    route: '/games/kings-cup',
  },
  {
    id: 'truth-or-dare',
    title: 'Truth or Dare',
    description: 'Answer truthfully or complete a dare... or drink!',
    color: 'from-pink-500 to-purple-600',
    icon: '🤔',
    route: '/games/truth-or-dare',
  },
  {
    id: 'would-you-rather',
    title: 'Would You Rather',
    description: 'Choose between two options. The minority drinks!',
    color: 'from-orange-500 to-red-600',
    icon: '🤷',
    route: '/games/would-you-rather',
  },
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showCreateParty, setShowCreateParty] = useState(false);
  const [showJoinParty, setShowJoinParty] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [partyCode, setPartyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleCreateParty = async (game: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/party/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game }),
      });

      if (!res.ok) {
        throw new Error('Failed to create party');
      }

      const party = await res.json();
      toast.success('Party created! Share the code with your friends.');
      router.push(`/party?id=${party.id}`);
    } catch (err) {
      toast.error('Failed to create party. Please try again.');
      setLoading(false);
    }
  };

  const handleJoinParty = async () => {
    if (!partyCode.trim()) {
      toast.error('Please enter a party code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/party/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: partyCode.toUpperCase() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to join party');
      }

      const party = await res.json();
      toast.success('Successfully joined party!');
      router.push(`/party?id=${party.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to join party. Please check the code and try again.');
      setLoading(false);
    }
  };

  const handleGameClick = (game: typeof GAMES[0]) => {
    setSelectedGame(game.id);
    setShowCreateParty(true);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center drink-pattern-bg">
        <div className="text-gray-900 dark:text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen drink-pattern-bg p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Drinking Games</h1>
            <p className="text-gray-600 dark:text-gray-300">Welcome back, {session.user.name}!</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/profile')}
              className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition flex items-center gap-2 shadow-md"
            >
              <span>👤</span>
              <span>Profile</span>
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition shadow-md"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {GAMES.map((game) => (
            <div
              key={game.id}
              className="cursor-pointer group"
            >
              <div className={`bg-gradient-to-br ${game.color} rounded-xl p-8 shadow-2xl transform transition hover:scale-105`}>
                <div className="text-6xl mb-4">{game.icon}</div>
                <h2 className="text-3xl font-bold text-white mb-2">{game.title}</h2>
                <p className="text-white/90 mb-4">{game.description}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push(game.route)}
                    className="flex-1 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition"
                  >
                    Play Solo
                  </button>
                  <button
                    onClick={() => handleGameClick(game)}
                    className="flex-1 bg-white hover:bg-white/90 text-gray-800 px-4 py-2 rounded-lg font-semibold transition"
                  >
                    Create Party
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => setShowJoinParty(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg"
          >
            Join Party with Code
          </button>
        </div>

        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">How to Play</h3>
          <ul className="text-gray-700 dark:text-gray-300 space-y-2">
            <li>• Choose a game from above</li>
            <li>• Gather your friends and drinks</li>
            <li>• Follow the rules and have fun!</li>
            <li>• Remember to drink responsibly</li>
          </ul>
        </div>

        <div className="mt-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>Please drink responsibly. Must be of legal drinking age.</p>
        </div>

        {/* Create Party Modal */}
        {showCreateParty && selectedGame && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Create Party</h2>
              <p className="text-gray-600 mb-6">
                You'll get a code to share with friends so they can join your game!
              </p>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateParty(false);
                    setSelectedGame(null);
                    setError('');
                  }}
                  disabled={loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCreateParty(selectedGame)}
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  {loading ? 'Creating...' : 'Create Party'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join Party Modal */}
        {showJoinParty && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Join Party</h2>
              <p className="text-gray-600 mb-4">
                Enter the party code your friend shared with you:
              </p>
              <input
                type="text"
                value={partyCode}
                onChange={(e) => setPartyCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                maxLength={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-4 text-center text-2xl font-bold tracking-wider uppercase"
                disabled={loading}
              />
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowJoinParty(false);
                    setPartyCode('');
                    setError('');
                  }}
                  disabled={loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinParty}
                  disabled={loading || !partyCode.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  {loading ? 'Joining...' : 'Join Party'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
