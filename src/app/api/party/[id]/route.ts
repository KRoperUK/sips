import { NextRequest, NextResponse } from 'next/server';
import { getParty } from '@/lib/data';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const party = await getParty(params.id);
    
    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    return NextResponse.json(party);
  } catch (error) {
    console.error('Error fetching party:', error);
    return NextResponse.json({ error: 'Failed to fetch party' }, { status: 500 });
  }
}
