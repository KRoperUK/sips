import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { saveGameHistory } from '@/lib/data';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { game, duration, cardsDrawn, roundCount } = await req.json();
    
    if (!game || !['kings-cup', 'truth-or-dare', 'would-you-rather'].includes(game)) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    const gameHistory = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: session.user.id,
      game,
      timestamp: new Date().toISOString(),
      players: [session.user.name || 'Anonymous'],
      duration: duration || 0,
    };

    await saveGameHistory(gameHistory);

    return NextResponse.json({ success: true, gameHistory });
  } catch (error) {
    console.error('Error saving game history:', error);
    return NextResponse.json({ error: 'Failed to save game history' }, { status: 500 });
  }
}
