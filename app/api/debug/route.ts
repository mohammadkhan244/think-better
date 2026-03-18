import { NextRequest, NextResponse } from 'next/server'
import { runDetectors } from '@/lib/detectors'
import { runFLOATER } from '@/lib/floater'

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  const detections = runDetectors(text)
  const floater = runFLOATER(text)
  return NextResponse.json({
    detectionCount: detections.length,
    detections,
    floaterScores: floater.scores,
    floaterOverall: floater.overall
  })
}
