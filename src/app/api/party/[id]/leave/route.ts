import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { leaveParty } from '@/lib/data';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const party = await leaveParty(params.id, session.user.id);
    
    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    return NextResponse.json(party);
  } catch (error) {
    console.error('Error leaving party:', error);
    return NextResponse.json({ error: 'Failed to leave party' }, { status: 500 });
  }
}
