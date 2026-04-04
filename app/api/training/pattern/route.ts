import { NextRequest, NextResponse } from 'next/server'
import { getCuratedScenario } from '@/lib/training'

export async function POST(req: NextRequest) {
  const { patternName } = await req.json()
  const scenario = getCuratedScenario(patternName)

  if (scenario) {
    return NextResponse.json({ scenario })
  }

  // Fallback for patterns not in curated library
  return NextResponse.json({
    scenario: {
      scenario: 'A company\'s marketing team presents data showing that customers who use their premium tier are happier than those on the free tier. They conclude the premium features cause higher satisfaction.',
      prompt: 'What might this reasoning be leaving out about who chooses the premium tier?',
      reveal: 'Customers who upgrade to premium may already be more engaged and satisfied before upgrading. The premium features may not be causing the satisfaction — both might be caused by a third factor: the customer\'s prior level of engagement.',
      insight: 'This pattern — confusing correlation with causation — appears constantly in product analytics, health research, and educational studies.'
    }
  })
}
