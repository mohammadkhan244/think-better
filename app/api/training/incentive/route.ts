import { NextRequest, NextResponse } from 'next/server'
import { generateIncentiveTraining } from '@/lib/training'

export async function POST(req: NextRequest) {
  const { text, incentiveSystem, domain } = await req.json()
  const scenario = await generateIncentiveTraining(text, incentiveSystem, domain)
  return NextResponse.json({ scenario })
}
