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
    triggers: [
      /\byou('re| are) (stupid|wrong|ignorant|biased|clueless)\b/i,
      /\btypical (liberal|conservative|leftist|rightist|boomer|millennial)\b/i,
      /\bof course (you|they) would say that\b/i,
      /\bwhat (do|would) (you|they) know\b/i,
      /\bjust another .{2,30} who\b/i,
      /\bpeople like (you|them|him|her) always\b/i,
    ],
    contextValidators: [/\bargue\b/i, /\bclaim\b/i, /\bsay\b/i, /\bbelieve\b/i, /.*/],
    floaterDimension: 'L'
  },
  {
    name: 'Strawman',
    type: 'fallacy',
    definition: "Misrepresenting someone's argument to make it easier to attack.",
    triggers: [
      /\bso you('re| are) saying\b/i,
      /\bwhat (you|they) really mean\b/i,
      /\bbasically arguing (that|for)\b/i,
      /\bthey (just |simply )?(want|believe|think) that\b/i,
      /\bin other words (you|they) (want|think|believe)\b/i,
      /\byou('re| are) basically saying\b/i,
    ],
    contextValidators: [/\bopponent\b/i, /\bcritic\b/i, /\bthey\b/i, /\bsome people\b/i, /.*/],
    floaterDimension: 'L'
  },
  {
    name: 'Hasty Generalization',
    type: 'fallacy',
    definition: 'Drawing a broad conclusion from a small or unrepresentative sample.',
    triggers: [
      /\bjust look at (all the|the|how many)\b/i,
      /\bthis (proves?|shows?|demonstrates?) (the model|that everyone|that all|that it)\b/i,
      /\b(clearly|obviously) (everyone|no one|all companies|all people|all startups)\b/i,
      /\bif (my|one|this) .{2,40} (can|could|did), (then |so |therefore )?(everyone|all)\b/i,
      /\b(all|every) .{2,40} (is|are|do|does|will|always)\b/i,
      /\b(proves?|shows?) the (model|pattern|rule|point)\b/i,
      /\bfailing lately\b/i,
      /\ball .{2,40} (fail|succeed|work|collapse)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'E'
  },
  {
    name: 'False Cause (Post Hoc)',
    type: 'fallacy',
    definition: 'Assuming causation from correlation or temporal sequence.',
    triggers: [
      /\bafter .{3,40}, (therefore|so|thus)\b/i,
      /\bwent .{3,60} (and|then) (shut down|failed|collapsed|declined)\b/i,
      /\b(shut down|failed|collapsed) .{3,60} (proves?|shows?|demonstrates?)\b/i,
      /\bwhich proves? (the model|that it|that this|it)\b/i,
      /\bproved? (that|it) caused\b/i,
      /\bsince .{3,60} (happened|started|began).{0,30} (therefore|so|clearly)\b/i,
      /\bbecause .{3,40} happened (before|first)\b/i,
      /\blinked to\b/i,
      /\b(went|turned|became) .{3,40} and .{3,40} (within|after|soon)\b/i,
    ],
    contextValidators: [/\bcause\b/i, /\bresult\b/i, /\bdue to\b/i, /\bprove\b/i, /\bshut\b/i, /\bfail\b/i, /.*/],
    floaterDimension: 'L'
  },
  {
    name: 'Slippery Slope',
    type: 'fallacy',
    definition: 'Claiming one event will lead to extreme consequences without justification.',
    triggers: [
      /\bif we allow\b/i,
      /\bnext (thing|step|you know)\b/i,
      /\binev(itably|itable)\b/i,
      /\bwill (eventually|certainly|slowly|gradually) lead to\b/i,
      /\bopens the door to\b/i,
      /\b(slowly|gradually|eventually) (collapse|decline|fail|erode|deteriorate)\b/i,
      /\baccept that .{3,60} (will|shall) (collapse|fail|decline|fall behind)\b/i,
      /\bfall behind .{2,40} (who are|that are|with)\b/i,
      /\bwill (fall|crumble|decay|unravel)\b/i,
    ],
    contextValidators: [/\bthen\b/i, /\bleads? to\b/i, /\bwill\b/i, /\bwould\b/i, /.*/],
    floaterDimension: 'L'
  },
  {
    name: 'False Dichotomy',
    type: 'fallacy',
    definition: 'Presenting only two options when more exist.',
    triggers: [
      /\beither .{3,80} or\b/i,
      /\bonly (two|2) (options?|choices?|paths?|ways?)\b/i,
      /\byou('re| are) either .{3,60} or\b/i,
      /\bno (middle ground|other option|third option|alternative)\b/i,
      /\bmust choose between\b/i,
      /\bor (accept|face|embrace) (that|the fact)\b/i,
      /\byou can (either|only)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'A'
  },
  {
    name: 'Appeal to Authority',
    type: 'fallacy',
    definition: "Substituting an authority figure's opinion for actual evidence or reasoning.",
    triggers: [
      /\bexperts (all )?agree\b/i,
      /\bscientists say\b/i,
      /\bstudies (show|suggest|find|prove)\b/i,
      /\bresearch (proves?|shows?|suggests?|finds?|showing)\b/i,
      /\b(dr\.?|professor|prof\.?) [A-Z][a-z]+ (says?|argues?|claims?|believes?)\b/i,
      /\bfamous .{2,20} (said|says|argues?|claims?|believes?|stated)\b/i,
      /\b(ceo|founder|expert|scientist|researcher) (said|says|told|argues?)\b/i,
      /\b(harvard|stanford|mit|oxford|yale|princeton) .{0,30} (published|research|study|shows?|found)\b/i,
      /\buniversity .{0,30} (published|research|study|shows?|found)\b/i,
      /\bthe science is settled\b/i,
      /\baccording to (a|the|an) (famous|leading|top|senior|prominent)\b/i,
      /\bsomeone at .{2,30} (published|said|found|showed)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'E'
  },
  {
    name: 'Appeal to Nature',
    type: 'fallacy',
    definition: "Assuming something is good or correct because it's natural, or bad because it's unnatural.",
    triggers: [
      /\bhumans? (evolved|were designed|are built|are wired|are meant) to\b/i,
      /\bnatural(ly)? (better|superior|correct|right|the way)\b/i,
      /\bnatural order\b/i,
      /\bgoes against (biology|nature|human nature|our nature|evolution|our biology)\b/i,
      /\bunnatural (to|for)\b/i,
      /\bagainst (our|human|basic) (nature|biology|instincts?|design)\b/i,
      /\bwe('re| are) (biologically|evolutionarily|naturally) (wired|designed|built|meant)\b/i,
      /\bthrough screens goes against\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'L'
  },
  {
    name: 'Bandwagon (Ad Populum)',
    type: 'fallacy',
    definition: 'Arguing something is true or good because many people believe or do it.',
    triggers: [
      /\beveryone (knows?|agrees?|is doing|can see)\b/i,
      /\bmillions (of people )?(believe|use|do|agree)\b/i,
      /\bmost people (think|agree|believe|know)\b/i,
      /\bpopular (belief|opinion|view|consensus)\b/i,
      /\bthe (whole world|entire industry|everyone)\b/i,
      /\bno one (disputes?|questions?|doubts?)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Appeal to Emotion',
    type: 'fallacy',
    definition: 'Manipulating emotions instead of using valid reasoning.',
    triggers: [
      /\bthink of the (children|future|families)\b/i,
      /\bdo you want .{3,40} to (die|suffer|fail|collapse)\b/i,
      /\bif you (really |truly )?cared\b/i,
      /\bhow could (anyone|you)\b/i,
      /\bit('?s| is) (heartbreaking|devastating|terrifying|outrageous)\b/i,
    ],
    contextValidators: [/\bfeel\b/i, /\bscared\b/i, /\bfear\b/i, /\bhope\b/i, /\bterrible\b/i, /.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Circular Reasoning',
    type: 'fallacy',
    definition: 'The conclusion is used as a premise — the argument assumes what it is trying to prove.',
    triggers: [
      /(\b\w{4,}\b).{0,50}because.{0,50}\1/i,
      /\btrue because (it'?s?|that'?s?) true\b/i,
      /\bby definition (it is|that is)\b/i,
      /\bproves? itself\b/i,
      /\bobviously .{3,40} because .{3,40} obviously\b/i,
      /\b(lazy|unmotivated|inefficient) .{3,60} because .{3,60} (lazy|unmotivated|inefficient)\b/i,
      /\b(makes?|makes people) .{2,30} probably because .{2,30} (makes?|makes people)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'L'
  },
  {
    name: 'Anecdotal Evidence',
    type: 'fallacy',
    definition: 'Using personal experience or isolated examples to support a general claim.',
    triggers: [
      /\bI (personally|once|know someone who)\b/i,
      /\bmy (friend|neighbor|cousin|uncle|colleague|boss|company)\b/i,
      /\bI've (seen|noticed|experienced|watched)\b/i,
      /\bI know (for a fact|someone who)\b/i,
      /\ba friend('?s)? (company|business|team|startup)\b/i,
      /\bone (company|person|team|case|example) (I know|shows?|proves?)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'E'
  },
  {
    name: 'No True Scotsman',
    type: 'fallacy',
    definition: 'Dismissing counterexamples by redefining terms to exclude them.',
    triggers: [
      /\bno (real|true|genuine|serious) .{3,30} would\b/i,
      /\bthat'?s? not (real|true|genuine)\b/i,
      /\ba (real|true|serious) .{3,30} doesn'?t\b/i,
      /\bnot a (real|true|genuine)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'L'
  },
  {
    name: 'Sunk Cost Fallacy',
    type: 'bias',
    definition: 'Continuing a course of action because of past investment rather than future value.',
    triggers: [
      /\bwe('ve| have) (already )?(invested|spent|committed|put in) .{0,30}(million|billion|thousand|years?|months?)\b/i,
      /\balready invested\b/i,
      /\btoo much (invested|spent|committed) to (stop|quit|change|reverse)\b/i,
      /\bcan'?t (stop|quit|reverse|turn back) now\b/i,
      /\bafter all (this|we've done|the work|the investment)\b/i,
      /\breversing course would be (irrational|foolish|wasteful|wrong)\b/i,
      /\btoo far (in|along|gone) to (stop|quit|change)\b/i,
      /\bwould be (irrational|foolish) (to|after) .{0,30}(already|invested|spent)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'L'
  },
  {
    name: 'Survivorship Bias',
    type: 'bias',
    definition: 'Focusing only on visible successes while ignoring the failures that are no longer observable.',
    triggers: [
      /\bsuccessful (people|companies|cases?|founders?|leaders?|ceos?) (always|typically|usually|all|tend to)\b/i,
      /\bthose who (succeeded|made it|won|thrived|survived)\b/i,
      /\bwinner(s)? (all|always|typically|tend to)\b/i,
      /\bmost successful .{2,40} (all |always |tend to |wake up|commute|work)\b/i,
      /\bif you want to win, (you should|copy|do what|follow)\b/i,
      /\bcopy what (winners?|successful people|the best) do\b/i,
      /\b(all|the best|top) .{2,30} (wake up|commute|work|do) .{0,30}(daily|every day|5 am|early)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'A'
  },
  {
    name: 'Fundamental Attribution Error',
    type: 'bias',
    definition: 'Attributing others\' behavior to character or personality rather than situational factors.',
    triggers: [
      /\b(seem|seems|are) (less |more )?(lazy|unmotivated|undisciplined|disengaged|distracted)\b/i,
      /\bworking from home makes? (people|workers?|employees?|them) (lazy|unproductive|unmotivated|distracted)\b/i,
      /\bremote workers? .{0,30}(lazy|unmotivated|less motivated|disengaged)\b/i,
      /\bpeople (are just|are simply|tend to be) (lazy|unmotivated|selfish|irrational)\b/i,
      /\bprobably because .{2,60}(lazy|unmotivated|lack discipline|don'?t care)\b/i,
      /\b(character|personality|nature) of .{2,30} (who|people)\b/i,
      /\bthey'?re (just |simply )?(lazy|selfish|incompetent|unmotivated)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Availability Heuristic',
    type: 'bias',
    definition: 'Overestimating likelihood or importance based on how easily examples come to mind.',
    triggers: [
      /\bI (keep|always) (hearing|seeing|reading|noticing) about\b/i,
      /\bseems (more|very) common (now|lately|these days|recently)\b/i,
      /\beverywhere (I look|you look|you turn)\b/i,
      /\bjust look at (all the|how many|the number of)\b/i,
      /\ball the (startups?|companies|businesses|teams?) (failing|collapsing|struggling) (lately|recently|these days)\b/i,
      /\b(failing|struggling|collapsing) (lately|recently|these days|now)\b/i,
      /\bseem(s|ingly) (everywhere|constant|rampant|widespread) (now|lately|these days)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'E'
  },
  {
    name: 'Linear Extrapolation',
    type: 'bias',
    definition: 'Assuming current trends will continue in a straight line, ignoring feedback loops and inflection points.',
    triggers: [
      /\b(advancing|growing|changing|moving) so fast (that|companies?|teams?|people)\b/i,
      /\bif .{3,40} (keeps?|continues?) (advancing|growing|at this rate)\b/i,
      /\bfall behind .{2,40} (who are|that are|more) (disciplined|focused|aggressive|moving faster)\b/i,
      /\bcompanies? .{0,30}(experimenting|flexible|remote) will fall behind\b/i,
      /\bat this (rate|pace|speed|trajectory)\b/i,
      /\b(trend|trajectory|momentum) (will|is going to|shall) (continue|accelerate|compound)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'T'
  },
  {
    name: 'Historical Analogy Fallacy',
    type: 'fallacy',
    definition: 'Using a loose historical or civilizational parallel as a predictive model without accounting for differences.',
    triggers: [
      /\bcivilizations? (that|which) (lost|lacked|abandoned) (structure|discipline|order|values)\b/i,
      /\b(rome|roman empire|greece|ancient .{2,20}) .{0,40}(declined|fell|collapsed|same)\b/i,
      /\b(history|the past) (shows?|proves?|tells?) us\b/i,
      /\bsame (pattern|thing|mistake|story) (happened|occurred|played out) (in|with|during)\b/i,
      /\bsign(s)? of (the same |that same )?(decay|decline|collapse|rot)\b/i,
      /\bparallel(s?) (to|with) .{2,40}(history|past|decline|fall)\b/i,
      /\bfeel(s?) like (another|a) sign of .{2,40}(decay|decline|collapse)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'A'
  },
  {
    name: 'Dunning-Kruger Effect',
    type: 'bias',
    definition: "Overestimating one's competence or certainty in a domain.",
    triggers: [
      /\bit'?s? (really )?simple\b/i,
      /\banyone can (see|tell|understand|figure out)\b/i,
      /\bI don'?t need (to|a) (study|expert|research|data)\b/i,
      /\bjust (common sense|obvious|logical|simple)\b/i,
      /\bno (expertise|research|data|evidence) needed\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Confirmation Bias',
    type: 'bias',
    definition: 'Seeking or presenting only evidence that confirms pre-existing beliefs.',
    triggers: [
      /\bonly (cites?|references?|mentions?|looks? at)\b/i,
      /\bas (I|we) (expected|predicted|knew|suspected)\b/i,
      /\bconfirms? (what|that) (I|we) (already )?knew\b/i,
      /\bthis supports? (my|our|the) (view|position|belief|thesis)\b/i,
      /\bfurther (proof|evidence|confirmation) that\b/i,
      /\bjust as (I|we) (thought|predicted|expected|said)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Texas Sharpshooter',
    type: 'fallacy',
    definition: 'Cherry-picking data clusters to suit an argument after the fact.',
    triggers: [
      /\bselected (these|the best|only the)\b/i,
      /\bif we look at (just|only)\b/i,
      /\bchose (only|specifically) (the data|examples?|cases?)\b/i,
      /\bfocusing (only|just) on .{2,40} (that|which) (support|confirm|show)\b/i,
    ],
    contextValidators: [/\bdata\b/i, /\bevidence\b/i, /\bexample\b/i, /.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Genetic Fallacy',
    type: 'fallacy',
    definition: 'Judging an argument by its source rather than its content.',
    triggers: [
      /\bcoming from (a|someone who)\b/i,
      /\bof course (they|he|she) would (say|think|believe)\b/i,
      /\bfunded by\b/i,
      /\bthat source is (biased|corrupt|unreliable|compromised)\b/i,
      /\bcan'?t trust .{2,30} because (they|he|she)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'L'
  },
  {
    name: 'Overconfidence Bias',
    type: 'bias',
    definition: "Excessive certainty about one's own conclusions or predictions.",
    triggers: [
      /\bI (am|am absolutely|am completely) (sure|certain|confident)\b/i,
      /\bguaranteed to\b/i,
      /\bno (way|chance) (that|this)? (I am|I'm|we are|we're) wrong\b/i,
      /\bI know (for a fact|without a doubt|with certainty)\b/i,
      /\bwithout (any |a )?(doubt|question)\b/i,
      /\bwill (definitely|certainly|absolutely|undoubtedly)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'T'
  },
  {
    name: 'Hindsight Bias',
    type: 'bias',
    definition: 'Believing after an event that one would have predicted it beforehand.',
    triggers: [
      /\bI knew (all along|it would|this would)\b/i,
      /\bwas (always|obviously) going to\b/i,
      /\bcould have (seen|predicted) (this|it) coming\b/i,
      /\bobvious in retrospect\b/i,
      /\bsaw (this|it) coming\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Narrative Fallacy',
    type: 'bias',
    definition: 'Forcing unrelated events into a causal story to create an illusion of understanding.',
    triggers: [
      /\bthe story of\b/i,
      /\bit all (makes sense|came together|started when)\b/i,
      /\bthis (journey|path|story|pattern|trend) (shows?|proves?|tells?)\b/i,
      /\bconnecting the dots\b/i,
      /\b(decay|decline|collapse) .{0,40}sign(s?) of .{0,40}(same|pattern|trend)\b/i,
      /\banother (sign|example|symptom|chapter) of .{2,40}(decay|decline|same pattern|collapse)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'L'
  },
  {
    name: 'Anchoring Bias',
    type: 'bias',
    definition: 'Over-relying on the first piece of information encountered when making decisions.',
    triggers: [
      /\bstarting (point|assumption|from)\b/i,
      /\binitially (set|assumed|established|proposed)\b/i,
      /\boriginal (estimate|figure|number|proposal)\b/i,
      /\bfirst (figure|number|price|estimate|offer)\b/i,
      /\bcompared to (the original|the initial|our first)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Cherry Picking',
    type: 'bias',
    definition: 'Selecting only favorable evidence while ignoring contradictory data.',
    triggers: [
      /\bonly (look at|consider|mention|cite|reference)\b/i,
      /\bignor(ing|es?) (the|all|any|other) (evidence|data|cases?|examples?|counterexamples?)\b/i,
      /\bconveniently (leaves? out|omits?|ignores?|forgets?)\b/i,
      /\bselectively (citing|choosing|presenting|reporting)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Base Rate Neglect',
    type: 'bias',
    definition: 'Ignoring background statistical rates when drawing conclusions from specific cases.',
    triggers: [
      /\bmust (therefore|be|have) (a |the )?(problem|issue|cause|sign)\b/i,
      /\b(clearly|obviously) (is|has|will|means)\b/i,
      /\bthis (person|company|case|example) (has|shows|demonstrates|proves?)\b/i,
      /\bif .{2,30} then (it must|they must|we must|that must)\b/i,
    ],
    contextValidators: [/\bprobability\b/i, /\bchance\b/i, /\blikely\b/i, /\brate\b/i, /\bmost\b/i, /.*/],
    floaterDimension: 'E'
  },
  {
    name: 'Framing Effect',
    type: 'bias',
    definition: "Drawing different conclusions from the same information depending on how it's presented.",
    triggers: [
      /\b(95%|nine out of ten) (success|survival)\b/i,
      /\bonly (5%|one in ten) (fail|die|lose)\b/i,
      /\bframed as\b/i,
      /\bwhen (presented|described|positioned) as\b/i,
      /\bthe way (it'?s?|this is|we) (framed|described|presented|positioned)\b/i,
    ],
    contextValidators: [/.*/],
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
