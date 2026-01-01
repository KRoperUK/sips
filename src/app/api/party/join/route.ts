import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPartyByCode, joinParty } from '@/lib/data';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { code } = await req.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Party code is required' }, { status: 400 });
    }

    const party = await getPartyByCode(code);
    
    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    if (party.status !== 'waiting') {
      return NextResponse.json({ error: 'Party has already started or finished' }, { status: 400 });
    }

    const updatedParty = await joinParty(
      party.id,
      session.user.id,
      session.user.name || 'Anonymous',
      session.user.image || undefined
    );

    return NextResponse.json(updatedParty);
  } catch (error) {
    console.error('Error joining party:', error);
    return NextResponse.json({ error: 'Failed to join party' }, { status: 500 });
  }
}
