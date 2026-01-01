import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { getParty, updateParty } from '@/lib/data';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const party = await getParty(params.id);
    
    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    if (party.hostId !== session.user.id) {
      return NextResponse.json({ error: 'Only the host can start the game' }, { status: 403 });
    }

    party.status = 'in-progress';
    await updateParty(party);

    return NextResponse.json(party);
  } catch (error) {
    console.error('Error starting party:', error);
    return NextResponse.json({ error: 'Failed to start party' }, { status: 500 });
  }
}
