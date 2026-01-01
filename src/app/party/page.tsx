'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

export const dynamic = 'force-dynamic';

interface PartyPlayer {
  userId: string;
  name: string;
  image?: string;
  joinedAt: string;
}

interface Party {
  id: string;
  code: string;
  hostId: string;
  hostName: string;
  game: string;
  players: PartyPlayer[];
  status: string;
}

export default function PartyWaitingRoom() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const partyId = searchParams.get('id');
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (!partyId) {
      router.push('/dashboard');
      return;
    }

    // Fetch party details
    const fetchParty = async () => {
      try {
        const res = await fetch(`/api/party/${partyId}`);
        if (!res.ok) {
          router.push('/dashboard');
          return;
        }
        const data = await res.json();
        setParty(data);
      } catch (error) {
        console.error('Error fetching party:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchParty();

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchParty, 2000);
    return () => clearInterval(interval);
  }, [partyId, router]);

  const handleCopyCode = () => {
    if (party) {
      navigator.clipboard.writeText(party.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartGame = async () => {
    if (!party) return;

    try {
      const res = await fetch(`/api/party/${party.id}/start`, {
        method: 'POST',
      });

      if (res.ok) {
        const gameRoutes: Record<string, string> = {
          'kings-cup': '/games/kings-cup',
          'truth-or-dare': '/games/truth-or-dare',
          'would-you-rather': '/games/would-you-rather',
        };
        router.push(`${gameRoutes[party.game]}?partyId=${party.id}`);
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handleLeaveParty = async () => {
    if (!party || !session?.user) return;

    try {
      await fetch(`/api/party/${party.id}/leave`, {
        method: 'POST',
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Error leaving party:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (!party) {
    return null;
  }

  const isHost = session?.user?.id === party.hostId;
  const gameNames: Record<string, string> = {
    'kings-cup': "King's Cup",
    'truth-or-dare': 'Truth or Dare',
    'would-you-rather': 'Would You Rather',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleLeaveParty}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg"
          >
            ← Leave Party
          </button>
          <h1 className="text-4xl font-bold text-white">Party Lobby</h1>
          <div className="w-32"></div>
        </div>

        <div className="bg-white rounded-lg p-8 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">{gameNames[party.game]}</h2>
            <p className="text-gray-600 mb-4">Share this code with your friends to join!</p>
            <div className="flex items-center justify-center gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 text-white px-8 py-4 rounded-lg">
                <span className="text-4xl font-bold tracking-wider">{party.code}</span>
              </div>
              <button
                onClick={handleCopyCode}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-semibold"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-xl font-bold mb-4">
              Players ({party.players.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {party.players.map((player) => (
                <div
                  key={player.userId}
                  className="bg-gray-50 rounded-lg p-4 flex items-center gap-3"
                >
                  {player.image ? (
                    <img
                      src={player.image}
                      alt={player.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{player.name}</p>
                    {player.userId === party.hostId && (
                      <p className="text-xs text-purple-600 font-semibold">HOST</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isHost && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <p className="text-white mb-4">
              Waiting for players to join... You can start the game whenever you're ready!
            </p>
            <button
              onClick={handleStartGame}
              disabled={party.players.length < 1}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold text-lg"
            >
              Start Game
            </button>
          </div>
        )}

        {!isHost && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <p className="text-white text-lg">
              Waiting for {party.hostName} to start the game...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
