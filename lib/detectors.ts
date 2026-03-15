interface DetectorEntry {
  name: string
  type: 'bias' | 'fallacy'
  definition: string
  triggers: RegExp[]
  contextValidators: RegExp[]
  floaterDimension: 'F' | 'L' | 'O' | 'A' | 'T' | 'E' | 'R'
}

const DETECTORS: DetectorEntry[] = [
  {
    name: 'Ad Hominem',
    type: 'fallacy',
    definition: 'Attacking the person making the argument rather than the argument itself.',
    triggers: [/\byou('re| are) (stupid|wrong|ignorant|biased)\b/i, /\btypical (liberal|conservative|leftist|rightist)\b/i, /\bof course (you|they) would say that\b/i, /\bwhat (do|would) (you|they) know\b/i],
    contextValidators: [/\bargue\b/i, /\bclaim\b/i, /\bsay\b/i, /\bbelieve\b/i],
    floaterDimension: 'L'
  },
  {
    name: 'Strawman',
    type: 'fallacy',
    definition: "Misrepresenting someone's argument to make it easier to attack.",
    triggers: [/\bso you('re| are) saying\b/i, /\bwhat (you|they) really mean\b/i, /\bbasically arguing (that|for)\b/i, /\bthey (just |simply )?(want|believe|think) that\b/i],
    contextValidators: [/\bopponent\b/i, /\bcritic\b/i, /\bthey\b/i, /\bsome people\b/i],
    floaterDimension: 'L'
  },
  {
    name: 'False Cause (Post Hoc)',
    type: 'fallacy',
    definition: 'Assuming causation from correlation or temporal sequence.',
    triggers: [/\bafter .{3,40}, (therefore|so|thus)\b/i, /\bbecause .{3,40} happened (before|first)\b/i, /\bproved? (that|it) caused\b/i, /\blinked to\b/i],
    contextValidators: [/\bcause\b/i, /\bresult\b/i, /\bdue to\b/i, /\bfollowed by\b/i],
    floaterDimension: 'L'
  },
  {
    name: 'Slippery Slope',
    type: 'fallacy',
    definition: 'Claiming one event will inevitably lead to extreme consequences without justification.',
    triggers: [/\bif we allow\b/i, /\bnext (thing|step|you know)\b/i, /\binev(itably|itable)\b/i, /\bwill (eventually|certainly) lead to\b/i, /\bopens the door to\b/i],
    contextValidators: [/\bthen\b/i, /\bleads? to\b/i, /\bwill\b/i, /\bwould\b/i],
    floaterDimension: 'L'
  },
  {
    name: 'False Dichotomy',
    type: 'fallacy',
    definition: 'Presenting only two options when more exist.',
    triggers: [/\beither .{3,60} or\b/i, /\bonly (two|2) (options?|choices?|paths?)\b/i, /\byou('re| are) either .{3,40} or\b/i, /\bno (middle ground|other option|third option)\b/i, /\bmust choose between\b/i],
    contextValidators: [/.*/],
    floaterDimension: 'A'
  },
  {
    name: 'Appeal to Authority',
    type: 'fallacy',
    definition: "Using an authority figure's opinion as evidence without citing their actual reasoning or data.",
    triggers: [/\bexperts (all )?agree\b/i, /\bscientists say\b/i, /\bstudies show\b/i, /\bresearch (proves?|shows?)\b/i, /\b(dr\.?|professor) [A-Z][a-z]+ says?\b/i],
    contextValidators: [/\bno citation\b/i, /without reference to/i, /.*/],
    floaterDimension: 'E'
  },
  {
    name: 'Bandwagon (Ad Populum)',
    type: 'fallacy',
    definition: 'Arguing something is true or good because many people believe or do it.',
    triggers: [/\beveryone (knows?|agrees?|is doing)\b/i, /\bmillions (of people )?(believe|use|do)\b/i, /\bmost people (think|agree|believe)\b/i, /\bpopular (belief|opinion|view)\b/i],
    contextValidators: [/\btherefore\b/i, /\bso it must be\b/i, /\bcan't be wrong\b/i, /\bproves?\b/i, /.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Appeal to Emotion',
    type: 'fallacy',
    definition: 'Manipulating emotions instead of using valid reasoning.',
    triggers: [/\bthink of the children\b/i, /\bdo you want .{3,40} to (die|suffer|fail)\b/i, /\bif you (really |truly )?cared\b/i, /\bhow could (anyone|you)\b/i],
    contextValidators: [/\bfeel\b/i, /\bscared\b/i, /\bfear\b/i, /\bhope\b/i, /\bterrible\b/i],
    floaterDimension: 'O'
  },
  {
    name: 'Circular Reasoning',
    type: 'fallacy',
    definition: 'The conclusion is used as a premise in the argument.',
    triggers: [/(\b\w+\b).{0,40}because.{0,40}\1/i, /\btrue because (it'?s?|that'?s?) true\b/i, /\bby definition (it is|that is)\b/i, /\bproves? itself\b/i],
    contextValidators: [/.*/],
    floaterDimension: 'L'
  },
  {
    name: 'Anecdotal Evidence',
    type: 'fallacy',
    definition: 'Using personal experience or isolated examples instead of sound evidence.',
    triggers: [/\bI (personally|once|know someone who)\b/i, /\bmy (friend|neighbor|cousin|uncle)\b/i, /\bI've (seen|noticed|experienced)\b/i, /\bI know (for a fact|someone who)\b/i],
    contextValidators: [/\btherefore\b/i, /\bproves?\b/i, /\bshows?\b/i, /\bdemonstrates?\b/i, /.*/],
    floaterDimension: 'E'
  },
  {
    name: 'No True Scotsman',
    type: 'fallacy',
    definition: 'Dismissing counterexamples by redefining terms to exclude them.',
    triggers: [/\bno (real|true|genuine) .{3,30} would\b/i, /\bthat'?s? not (real|true|genuine)\b/i, /\ba (real|true) .{3,30} doesn'?t\b/i],
    contextValidators: [/.*/],
    floaterDimension: 'L'
  },
  {
    name: 'Texas Sharpshooter',
    type: 'fallacy',
    definition: 'Cherry-picking data clusters to suit an argument after the fact.',
    triggers: [/\bselected (these|the best|only)\b/i, /\bchose (only|specifically) (the data|examples?)\b/i, /\bif we look at (just|only)\b/i],
    contextValidators: [/\bdata\b/i, /\bevidence\b/i, /\bexample\b/i],
    floaterDimension: 'O'
  },
  {
    name: 'Genetic Fallacy',
    type: 'fallacy',
    definition: 'Judging an argument by its source rather than its content.',
    triggers: [/\bcoming from (a|someone who)\b/i, /\bof course (they|he|she) would\b/i, /\bfunded by\b/i, /\bthat source is (biased|corrupt|unreliable)\b/i],
    contextValidators: [/\bbelieve\b/i, /\btrust\b/i, /\baccept\b/i],
    floaterDimension: 'L'
  },
  {
    name: 'Confirmation Bias',
    type: 'bias',
    definition: 'Seeking or presenting only evidence that confirms pre-existing beliefs.',
    triggers: [/\bonly (cites?|references?|mentions?)\b/i, /\bas (I|we) (expected|predicted|knew)\b/i, /\bconfirms? (what|that) (I|we) (already )?knew\b/i, /\bthis supports? (my|our|the) (view|position|belief)\b/i],
    contextValidators: [/.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Survivorship Bias',
    type: 'bias',
    definition: 'Focusing only on successful examples while ignoring failures.',
    triggers: [/\bsuccessful (people|companies|cases?) (always|typically|usually)\b/i, /\bthose who (succeeded|made it|won)\b/i, /\bwinner(s)? (all|always|typically)\b/i],
    contextValidators: [/\bprove\b/i, /\bshow\b/i, /\bdemonstrate\b/i, /\bsuggest\b/i, /.*/],
    floaterDimension: 'A'
  },
  {
    name: 'Dunning-Kruger Effect',
    type: 'bias',
    definition: "Overestimating one's competence or knowledge in a domain.",
    triggers: [/\bit'?s? (really )?simple\b/i, /\banyone can (see|tell|understand)\b/i, /\bI don'?t need (to|a) (study|expert|research)\b/i, /\bjust (common sense|obvious)\b/i],
    contextValidators: [/\bI\b/i, /\bwe\b/i, /.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Sunk Cost Fallacy',
    type: 'bias',
    definition: 'Continuing a course of action because of past investment rather than future value.',
    triggers: [/\bwe('ve| have) (already|come too far|invested too much)\b/i, /\btoo much (invested|spent|committed) to (stop|quit|change)\b/i, /\bcan'?t stop now\b/i, /\bafter all (this|we've done)\b/i],
    contextValidators: [/.*/],
    floaterDimension: 'L'
  },
  {
    name: 'Availability Heuristic',
    type: 'bias',
    definition: 'Overestimating likelihood based on how easily examples come to mind.',
    triggers: [/\bI (keep|always) (hearing|seeing|reading) about\b/i, /\bseems (more|very) common (now|lately|these days)\b/i, /\beverywhere (I look|you look|you turn)\b/i],
    contextValidators: [/\btherefore\b/i, /\bso\b/i, /\bwhich means\b/i, /.*/],
    floaterDimension: 'E'
  },
  {
    name: 'Anchoring Bias',
    type: 'bias',
    definition: 'Over-relying on the first piece of information encountered.',
    triggers: [/\bstarting (point|assumption|from)\b/i, /\binitially (set|assumed|established)\b/i, /\boriginal (estimate|figure|number)\b/i, /\bfirst (figure|number|price|estimate)\b/i],
    contextValidators: [/\bnow\b/i, /\bcurrent\b/i, /\bcompared to\b/i, /.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Framing Effect',
    type: 'bias',
    definition: "Drawing different conclusions from the same information depending on how it's presented.",
    triggers: [/\b(95%|nine out of ten) (success|survival)\b/i, /\bonly (5%|one in ten) (fail|die|lose)\b/i, /\bframed as\b/i, /\bwhen (presented|described) as\b/i],
    contextValidators: [/.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Overconfidence Bias',
    type: 'bias',
    definition: "Excessive confidence in one's own answers or the accuracy of one's beliefs.",
    triggers: [/\bI (am|am absolutely|am completely) (sure|certain|confident)\b/i, /\bguaranteed to\b/i, /\bno (way|chance) (that|this)? (I am|I'm|we are|we're) wrong\b/i, /\bI know (for a fact|without a doubt)\b/i],
    contextValidators: [/.*/],
    floaterDimension: 'T'
  },
  {
    name: 'Hindsight Bias',
    type: 'bias',
    definition: 'Believing after an event that one would have predicted it beforehand.',
    triggers: [/\bI knew (all along|it would)\b/i, /\bwas (always|obviously) going to\b/i, /\bcould have (seen|predicted) (this|it) coming\b/i, /\bobvious in retrospect\b/i],
    contextValidators: [/.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Narrative Fallacy',
    type: 'bias',
    definition: 'Forcing events into a causal story when they may be unrelated.',
    triggers: [/\bthe story of\b/i, /\bit all (makes sense|came together|started when)\b/i, /\bthis (journey|path|story) shows\b/i, /\bconnecting the dots\b/i],
    contextValidators: [/\btherefore\b/i, /\bproves?\b/i, /\bshows?\b/i, /.*/],
    floaterDimension: 'L'
  },
  {
    name: 'Base Rate Neglect',
    type: 'bias',
    definition: 'Ignoring statistical base rates when evaluating the probability of an event.',
    triggers: [/\bthis person (has|shows|demonstrates)\b/i, /\bmust (therefore|be|have)\b/i, /\b(clearly|obviously) (is|has|will)\b/i],
    contextValidators: [/\bprobability\b/i, /\bchance\b/i, /\blikely\b/i, /\brate\b/i, /.*/],
    floaterDimension: 'E'
  },
  {
    name: 'Cherry Picking',
    type: 'bias',
    definition: 'Selecting only favorable evidence while ignoring contradictory data.',
    triggers: [/\bonly (look at|consider|mention)\b/i, /\bignor(ing|es?) (the|all|other)\b/i, /\bconveniently (leaves? out|omits?|ignores?)\b/i, /\bselectively (citing|choosing|presenting)\b/i],
    contextValidators: [/\bdata\b/i, /\bevidence\b/i, /\bresearch\b/i, /\bstudy\b/i, /.*/],
    floaterDimension: 'O'
  },
]

export interface DetectionResult {
  name: string
  type: 'bias' | 'fallacy'
  definition: string
  matchedText: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  floaterDimension: string
}

export function runDetectors(rawText: string): DetectionResult[] {
  const results: DetectionResult[] = []
  const lower = rawText.toLowerCase()

  for (const detector of DETECTORS) {
    const triggerMatches: string[] = []

    for (const trigger of detector.triggers) {
      const match = lower.match(trigger)
      if (match) triggerMatches.push(match[0])
    }

    if (triggerMatches.length === 0) continue

    const contextHit = detector.contextValidators.some(v => v.source === '.*' || v.test(lower))

    let confidence: 'HIGH' | 'MEDIUM' | 'LOW'
    if (triggerMatches.length >= 2 && contextHit) confidence = 'HIGH'
    else if (triggerMatches.length >= 1 && contextHit) confidence = 'MEDIUM'
    else confidence = 'LOW'

    results.push({
      name: detector.name,
      type: detector.type,
      definition: detector.definition,
      matchedText: triggerMatches[0],
      confidence,
      floaterDimension: detector.floaterDimension
    })
  }

  return results.sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    return order[a.confidence] - order[b.confidence]
  })
}
