import { NextRequest, NextResponse } from 'next/server'
import { generateBeliefTraining } from '@/lib/training'

export async function POST(req: NextRequest) {
  const { text, coreAssumptions, domain } = await req.json()
  const scenario = await generateBeliefTraining(text, coreAssumptions, domain)
  return NextResponse.json({ scenario })
}
