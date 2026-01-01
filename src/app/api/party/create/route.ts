import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createParty } from '@/lib/data';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { game } = await req.json();
    
    if (!game || !['kings-cup', 'truth-or-dare', 'would-you-rather'].includes(game)) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    const party = await createParty(
      session.user.id,
      session.user.name || 'Anonymous',
      game
    );

    return NextResponse.json(party);
  } catch (error) {
    console.error('Error creating party:', error);
    return NextResponse.json({ error: 'Failed to create party' }, { status: 500 });
  }
}
