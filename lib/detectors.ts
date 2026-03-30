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
      /\b(mostly|just|simply) (activists?|ideologues?|propagandists?) (pretending|disguised)\b/i,
      /\bactivists? pretending to be\b/i,
      /\bpretending to be (researchers?|scientists?|experts?|journalists?)\b/i,
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
      /\bevery .{3,40} (I'?ve?| have) (spoken to|talked to|met|asked|surveyed)\b/i,
      /\bwhich proves? (that |it |the )(science|research|model|theory|idea)\b/i,
      /\b(proves?|shows?|demonstrates?) (it|that it|the whole thing) (is |)(too uncertain|doesn'?t work|is wrong|is flawed)\b/i,
      /\bso clearly (it'?s?|the|this|that)\b/i,
      /\b(surged|risen|spiked|increased) in every\b/i,
      /\bevery (major |)(city|state|country|nation) (that|which|where)\b/i,
      /\bproof that .{3,60} always (fail|fails|work|works|succeed|succeeds)\b/i,
      /\b(always|never) (fail|fails|work|works|happen|happens)\b/i,
      /\bsoft[- ]on[- ]crime approaches? always\b/i,
      /\bevery (great |successful |top )?founder I'?ve? studied\b/i,
      /\bshares? the same pattern\b/i,
      /\bthe lesson is clear\b/i,
      /\bthe best .{3,40} (come from|require|need|is)\b/i,
      /\b(always|never|every time) (works?|wins?|succeeds?|fails?|happens?)\b/i,
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
      /\b(bloodwork|test results?|numbers?|health) (is |are |)(fine|good|normal|okay).{0,40}(so |therefore |clearly |which means |proves?)\b/i,
      /\b(eat|drink|do|take) .{3,40} (for |)(years?|months?|decades?).{0,40}(fine|healthy|no problem|no issues?)\b/i,
      /\bso clearly (it'?s?|that'?s?|this) (not|the|a) (problem|issue|cause)\b/i,
      /\b(cut|reduced|defunded).{0,40}(spiked|surged|rose|increased|climbed)\b/i,
      /\b(spiked|surged|rose|increased) (immediately |right |soon )?after\b/i,
      /\b(reduced|cut|eliminated).{0,60}(now|and now|ever since).{0,40}(unsafe|dangerous|worse|higher crime)\b/i,
      /\bthe connection is obvious\b/i,
      /\bwhich is why .{3,60}(climbing|rising|increasing|surging)\b/i,
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
      /\bif (we|you) (wait|delay|slow down|take longer).{0,40}(lose|miss|fall behind|too late)\b/i,
      /\b(every day|every week|each day|each week) (we|you) (wait|delay|don'?t ship)\b/i,
      /\bcompetitors? (will|are going to|could) (take|steal|capture|own) (our |the )?(market|users?|customers?|lead)\b/i,
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
      /\bif (we|you) don'?t .{3,60}(we'?ll?|you'?ll?) (lose|fail|miss|fall behind)\b/i,
      /\b(ship|launch|move|act) (now|fast|quickly) or (lose|miss|fall behind)\b/i,
      /\bwindow is (closing|closing fast|almost gone|nearly closed)\b/i,
      /\b(conviction|vision|instinct|judgment)[,]? not (consensus|data|feedback|research|testing)\b/i,
      /\b(listening to users|customer feedback|user research) (means?|causes?|leads? to|makes? you) (miss|lose|fail|optimize for the present)\b/i,
      /\byou'?re? (either|constantly) (listening|optimizing|following) (or|and) (missing|losing|failing)\b/i,
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
      /\bmillions of (people|americans?|europeans?|french|japanese)\b/i,
      /\b(entire|whole) (country|nation|population|culture|society) (eats?|does|practices?|consumes?)\b/i,
      /\b(lower|higher|better|worse) .{3,40} than (americans?|the (us|usa|united states))\b/i,
      /\bthe majority of\b/i,
      /\ba \d{4} poll\b/i,
      /\bpoll (which |that )?(confirms?|proves?|shows?|validates?)\b/i,
      /\b(confirms?|proves?|validates?) (these|this|that) (policies|views?|ideas?|approaches?)\b/i,
      /\b(all|every) (the )?(great|successful|best|top) (founders?|ceos?|leaders?|companies)\b/i,
      /\bwinner(s)? (all|always|consistently|typically) (do|did|ignore|trusted|built)\b/i,
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
      /\b(honestly|frankly|look).{0,20}(we need to|we have to|we must|we can'?t wait)\b/i,
      /\bI know .{3,60}but (honestly|the truth is|the reality is|look)\b/i,
      /\b(the clock|time) is (ticking|running out|against us)\b/i,
      /\bwe'?ll? (regret|miss) (this|it) if (we|you) (don'?t|wait|hesitate)\b/i,
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
      /\bI('ve| have) been .{3,60} for (years?|months?|decades?)\b/i,
      /\bmy (bloodwork|results?|tests?|numbers?|health|doctor)\b/i,
      /\b(clearly|obviously|so) it'?s? not (the |a )?(problem|issue|cause)\b/i,
      /\bI'?m? (fine|healthy|okay|good) (and |so |therefore )\b/i,
      /\b(proves?|shows?) (it'?s?|that it'?s?) not\b/i,
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
      /\bwe'?ve? already (built|created|established|trained|invested in|developed)\b/i,
      /\b(built|trained|established|created).{0,40}for (decades?|years?|generations?)\b/i,
      /\bdismantling .{3,40}would (waste|throw away|destroy|undermine)\b/i,
      /\b(decades?|years?|generations?) of (investment|work|building|training)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'L'
  },
  {
    name: 'Survivorship Bias',
    type: 'bias',
    definition: 'Focusing only on visible successes while ignoring the failures that are no longer observable.',
    triggers: [
      /\b(millions of )?(people in |the )(france|japan|mediterranean|denmark|sweden|finland|iceland)\b/i,
      /\b(country|nation|population|culture|society) (that |which )?(eats?|consumes?|does|practices?)\b/i,
      /\b(successful|healthy|long[- ]lived|happy) (people|countries|populations?|cultures?|nations?)\b/i,
      /\bpeople who .{3,40} (live longer|are healthier|are happier|are more successful|are thinner|are wealthier)\b/i,
      /\bthe (best|most successful|healthiest|happiest) .{3,40} (all |always |tend to |typically )(do|have|eat|are)\b/i,
      /\bif you want to (win|succeed|be healthy|live longer).{0,40}copy (what|how)\b/i,
      /\b(conservative|liberal|red|blue) (cities|states|countries) .{3,60}(safer|more dangerous|lower crime|higher crime)\b/i,
      /\bcities with (strong|weak|more|less|better|fewer) .{3,40}(consistently|always|tend to)\b/i,
      /\bconsistently have (safer|more dangerous|lower|higher)\b/i,
      /\b(look at|think about|remember) (how |what |when )?(company|startup|brand|product).{0,40}(shipped|launched|moved fast|won)\b/i,
      /\bcompanies? (that |who |which )?(ship|move|act) (fast|first|quickly) (win|succeed|dominate)\b/i,
      /\bour competitors? aren'?t (perfect|done|finished|ready) (either|also)\b/i,
      /\bevery (great |successful |top )?(founder|ceo|leader|entrepreneur)s? (I'?ve?|I have) (studied|researched|looked at|read about|analyzed)\b/i,
      /\bshares? the same pattern\b/i,
      /\b(visionary|successful|great) founders? (succeed|win|build|create) by\b/i,
      /\bthe (best|most successful|greatest) .{3,40} (all |always |)(did|do|ignored|trusted|rejected)\b/i,
      /\b(jobs|musk|bezos|zuckerberg|gates) didn'?t\b/i,
      /\bpeople who (made it|succeeded|won|are successful|become great)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'A'
  },
  {
    name: 'Fundamental Attribution Error',
    type: 'bias',
    definition: 'Attributing others\' behavior to character or personality rather than situational factors.',
    triggers: [
      /\b(people|they|anyone|workers?|employees?|users?) (just |simply )?(lack|don'?t have|have no) (discipline|willpower|motivation|drive|work ethic)\b/i,
      /\b(just |simply )?doesn'?t have (the )?(willpower|discipline|motivation|drive)\b/i,
      /\bthe (real |actual )?problem is (that )?people\b/i,
      /\b(lazy|undisciplined|unmotivated|careless|irresponsible) (people|person|individuals?|workers?|employees?)\b/i,
      /\bpeople (who|that) .{3,40} (just |simply )?(don'?t|lack|won'?t|can'?t)\b/i,
      /\bprobably because (people|they|workers?|employees?|humans?) (are |just )?(lazy|weak|undisciplined|unmotivated)\b/i,
      /\bsimply have (bad|poor|weak|no) (values?|character|morals?|ethics?)\b/i,
      /\b(poverty|trauma|systemic).{0,40}(just |are just |)(excuses?|deflection|avoidance)\b/i,
      /\binvented to avoid (accountability|responsibility|blame)\b/i,
      /\bpeople (who|that) commit .{3,40}(bad values?|no morals?|weak character)\b/i,
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
      /\bmarket window is (closing|shrinking|disappearing)\b/i,
      /\b(two|2|three|3|four|4) weeks? (left|remaining|to act|or we lose)\b/i,
      /\bif we don'?t (act|move|ship|launch) (now|immediately|fast)\b/i,
      /\bwe'?ll? lose (our )?(advantage|edge|window|opportunity|lead)\b/i,
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
      /\bwhen (rome|the roman empire|athens|sparta|greece|the ussr|the soviet union|weimar)\b/i,
      /\b(rome|the roman empire|ancient|historical).{0,60}(collapsed?|declined?|fell|failed)\b/i,
      /\bhistory shows? that when\b/i,
      /\b(empire|civilization|society) collapsed?.{0,40}(within|in) (a |one )?(generation|century|decade)\b/i,
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
      /\b(clearly|obviously|so) (overstated|exaggerated|wrong|false|untrue)\b/i,
      /\bthe idea that .{3,60} is (clearly |obviously )?(overstated|wrong|false|exaggerated|a myth)\b/i,
      /\b(proves?|shows?) (it'?s?|that) not (the |a )?problem\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Status Quo Bias',
    type: 'bias',
    definition: 'Preferring the current state of affairs and perceiving change as a loss, regardless of evidence.',
    triggers: [
      /\b(our |my |the )?(family|culture|tradition|community) has (always|traditionally)\b/i,
      /\bdecades? of (tradition|practice|habit|routine)\b/i,
      /\bchanging (that|this|it) (now |)(would (destroy|ruin|undermine|eliminate))\b/i,
      /\b(worked|been done|been this way) for (generations?|decades?|centuries?|years?|a long time)\b/i,
      /\bno (proven|clear|real|actual) benefit (to changing|in changing|from changing)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'A'
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
      /\b(soros|koch|funded by|backed by).{0,40}(so|therefore|which means|meaning)\b/i,
      /\b[A-Z][a-z]+[- ]backed\b/i,
      /\bbacked by .{3,40}(so|therefore|which means|shouldn'?t be trusted)\b/i,
      /\b(findings?|research|conclusions?) (are |is |)(compromised|tainted|biased|suspect)\b/i,
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
      /\bthe team that .{3,40} (wins?|succeeds?|dominates?)\b/i,
      /\b(always|never) (wins?|works?|succeeds?|loses?)\b/i,
      /\bwhoever .{3,40} (wins?|dominates?|owns?)\b/i,
      /\bthat'?s? (just |simply )?(how|what) (it works|you win|you lose|wins)\b/i,
      /\bthe lesson is clear\b/i,
      /\bit'?s? (obvious|clear|evident|plain) that\b/i,
      /\b(conviction|vision|instinct) (over|beats?|trumps?|wins? over) (consensus|data|feedback|research)\b/i,
      /\btrust (your|their|our) (own )?(judgment|instincts?|conviction|vision)\b/i,
      /\b(conviction|instinct|vision) (is|are) (more important|better|superior|stronger) than\b/i,
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
  // ── New Fallacies ──────────────────────────────────────────────────────────
  {
    name: 'Appeal to Ignorance',
    type: 'fallacy',
    definition: 'Claiming something is true because it has not been proven false, or false because it has not been proven true.',
    triggers: [
      /\bno (one |)has (ever |)proved? (it'?s?|that it'?s?|this is) (wrong|false|harmful|dangerous)\b/i,
      /\bcan'?t (prove|disprove) (it|that|this|me) wrong\b/i,
      /\buntil (someone |you |they |)(prove|disprove|show)s? (otherwise|me wrong|it false)\b/i,
      /\bno evidence (against|disproving|contradicting)\b/i,
      /\bnobody has (shown|demonstrated|proven) (that |it |this )?(doesn'?t|isn'?t|won'?t)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'F'
  },
  {
    name: 'Burden of Proof Shift',
    type: 'fallacy',
    definition: 'Demanding the opponent disprove a claim rather than providing evidence for it.',
    triggers: [
      /\bprove (me |it |that |this )?(wrong|false|incorrect)\b/i,
      /\byou can'?t (prove|show|demonstrate) (that |it |this )?(I'?m?|it'?s?|this is) wrong\b/i,
      /\bshow me (the |one |any )?(study|evidence|proof|example) (that |which |)proves? (otherwise|me wrong|it false)\b/i,
      /\bif you can'?t (prove|disprove|refute)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'F'
  },
  {
    name: 'Tu Quoque (Whataboutism)',
    type: 'fallacy',
    definition: 'Deflecting criticism by pointing to the opponent\'s similar behavior rather than addressing the argument.',
    triggers: [
      /\bwhat about (china|russia|them|the other side|when|how|the time)\b/i,
      /\b(you'?re?|they'?re?|he'?s?|she'?s?) (one to talk|doing the same|no better|just as bad)\b/i,
      /\bbut (china|russia|they|the other side|liberals?|conservatives?|democrats?|republicans?) (also|do the same|did the same|are worse|pollute more)\b/i,
      /\bhow (come|is it that) (nobody|no one) (talks? about|mentions?|criticizes?)\b/i,
      /\bwhat about .{2,40}(they|you|he|she|it) (do|did|are|were|pollute|emit|cause)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'L'
  },
  {
    name: 'False Equivalence',
    type: 'fallacy',
    definition: 'Treating two fundamentally different things as if they are the same.',
    triggers: [
      /\bsame (thing|difference|argument|logic|reasoning)\b/i,
      /\bjust as (bad|good|harmful|dangerous|valid) as\b/i,
      /\bno different (from|than|to)\b/i,
      /\bboth sides (are|do|say|claim|argue)\b/i,
      /\bequally (valid|wrong|bad|harmful|dangerous|guilty)\b/i,
      /\bexactly (like|the same as|equivalent to)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'L'
  },
  {
    name: 'Composition Fallacy',
    type: 'fallacy',
    definition: 'Assuming what is true of the parts must be true of the whole.',
    triggers: [
      /\beach (part|component|member|individual|element) .{3,40}so the (whole|entire|overall|group|team|system)\b/i,
      /\bif every (part|member|individual|person|component)\b/i,
      /\bbecause (each|every) (one|person|part|member) (is|does|can)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'L'
  },
  {
    name: 'Division Fallacy',
    type: 'fallacy',
    definition: 'Assuming what is true of the whole must be true of each part.',
    triggers: [
      /\b(the company|the team|the country|the system|the industry|the group) (is|does|has|performs) .{3,40}so (each|every|all) (member|person|part|employee|individual)\b/i,
      /\bsince (the whole|the entire|the overall|the group|america|the us)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'L'
  },
  {
    name: 'Equivocation',
    type: 'fallacy',
    definition: 'Using the same word with two different meanings to make an argument appear valid.',
    triggers: [
      /\bthe word .{3,30} means\b/i,
      /\btechnically (speaking|defined|correct|means)\b/i,
      /\bby (definition|that logic|that reasoning) .{3,40}(also means|implies|proves)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'F'
  },
  {
    name: 'Motte and Bailey',
    type: 'fallacy',
    definition: 'Conflating a strong controversial claim with a weaker defensible one to avoid criticism.',
    triggers: [
      /\ball I('?m| am) saying is\b/i,
      /\bI never said .{3,60}I (just |only |merely |simply )said\b/i,
      /\bthat'?s? not what I (meant|said|claimed|argued)\b/i,
      /\byou'?re? (twisting|misrepresenting|distorting) (my |what I )(words?|said|meant|claimed)\b/i,
      /\bI('?m| am) (just|only|merely|simply) saying (that |)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'F'
  },
  {
    name: 'Loaded Question',
    type: 'fallacy',
    definition: 'Asking a question that contains an embedded assumption the respondent cannot answer without accepting.',
    triggers: [
      /\bwhen did you stop\b/i,
      /\bwhy (do|did|are|were) you (always|still|continue to)\b/i,
      /\bhow (long|many times) (have you|did you) (keep|continue|persist)\b/i,
      /\bwhy (is it that|does) (everyone|nobody|all|no one) (always|never|still)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'F'
  },
  {
    name: 'Middle Ground Fallacy',
    type: 'fallacy',
    definition: 'Assuming the truth must lie between two extremes when one side may simply be correct.',
    triggers: [
      /\bthe truth (is|lies?) (somewhere |)(in the middle|between)\b/i,
      /\bboth (sides|extremes|positions|views) have (a point|merit|some truth|valid points)\b/i,
      /\bsomewhere between .{3,60}and .{3,60}is (the truth|correct|right|reality)\b/i,
      /\bcompromise (position|view|answer|solution) (is|must be|has to be) (right|correct|true|best)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'A'
  },
  {
    name: 'Nirvana Fallacy',
    type: 'fallacy',
    definition: 'Rejecting a solution because it is not perfect, rather than comparing it to realistic alternatives.',
    triggers: [
      /\buntil (it|we|they|this) (can |)(guarantee|ensure|eliminate|solve|fix) (all|every|complete)\b/i,
      /\bif it (can'?t|doesn'?t|won'?t) (solve|fix|eliminate|guarantee) (everything|all|the entire|complete)\b/i,
      /\bnot worth (it|doing|trying|implementing) (unless|until|if) (it|we|they) (can|will) (fully|completely|perfectly)\b/i,
      /\bperfect (solution|answer|system|approach) (or|otherwise|or else|or we)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'A'
  },
  // ── New Cognitive Biases ───────────────────────────────────────────────────
  {
    name: 'In-Group Bias',
    type: 'bias',
    definition: 'Favoring members of one\'s own group and applying stricter standards to outsiders.',
    triggers: [
      /\bour (side|team|group|party|country|culture|community) has always been (more|better|less|more honest|more fair)\b/i,
      /\b(we|our side|our group|our party) (always|tend to|generally|typically) (act|behave|think|reason|argue) (better|more honestly|more fairly|more carefully)\b/i,
      /\b(they|their side|the other side|those people) always (lie|distort|manipulate|exaggerate|mislead|get it wrong)\b/i,
      /\b(liberals?|conservatives?|democrats?|republicans?|the left|the right) always (do|say|claim|act|argue|believe|distort)\b/i,
      /\bpeople like (us|me|them|you)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Illusion of Control',
    type: 'bias',
    definition: 'Overestimating one\'s ability to control events that are largely determined by chance or complex systems.',
    triggers: [
      /\bif (we|they|you|I) just (do|follow|implement|apply|enforce)\b/i,
      /\ball (we|they|you) (need to do|have to do|need) is\b/i,
      /\bsimply (enforce|implement|apply|follow|do) (the|this|that|our) (rules?|policy|plan|strategy|law)\b/i,
      /\bit'?s? (that |just |really |)(simple|easy|straightforward) — just\b/i,
      /\bwe can (always|just|easily) (roll back|fix|patch|update|hotfix)\b/i,
      /\b(updates?|patches?|fixes?) (are|is) (easy|simple|straightforward|quick)\b/i,
      /\bno (big deal|problem|issue) (if|when) (something|it|bugs?) (breaks?|fails?|goes wrong)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'T'
  },
  {
    name: 'Optimism Bias',
    type: 'bias',
    definition: 'Overestimating the likelihood of positive outcomes for oneself or one\'s preferred approach.',
    triggers: [
      /\b(this|it|we|they) will (definitely|certainly|absolutely|surely|without question) (work|succeed|solve|fix|improve)\b/i,
      /\bno (reason|doubt|question) (this|it|that|the plan) (will|won'?t) (fail|work|succeed)\b/i,
      /\bguaranteed to (work|succeed|improve|solve|fix)\b/i,
      /\bcan'?t (fail|go wrong|miss|lose)\b/i,
      /\bwe can (fix|patch|address|handle|deal with) (it|that|bugs?|issues?) (later|after|post[- ]launch|after launch)\b/i,
      /\bthat'?s? what (updates?|patches?|v2|version 2|hotfixes?) are for\b/i,
      /\b(fix|patch|improve) (it|that|bugs?) (after|post)[- ]?(launch|ship|release)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'T'
  },
  {
    name: 'Pessimism Bias',
    type: 'bias',
    definition: 'Overestimating the likelihood of negative outcomes or treating worst-case scenarios as inevitable.',
    triggers: [
      /\b(this|it|they|we) will (definitely|certainly|inevitably|surely) (fail|collapse|decline|get worse|deteriorate)\b/i,
      /\b(always|inevitably|eventually) (leads? to|results? in|ends? in|causes?) (failure|collapse|decline|disaster|ruin)\b/i,
      /\bthere'?s? (no|little|no realistic) (hope|chance|possibility|way) (that|of|for)\b/i,
      /\bdoomed to (fail|repeat|collapse|decline)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'T'
  },
  {
    name: 'Recency Bias',
    type: 'bias',
    definition: 'Giving more weight to recent events than older data when forming judgments.',
    triggers: [
      /\b(lately|recently|these days|in recent (months?|years?|times?)) .{3,60}(proves?|shows?|demonstrates?|confirms?|means?)\b/i,
      /\bever since (last year|recently|the past (few |)(months?|years?))\b/i,
      /\b(last (year|month|quarter|election|cycle)|recent (events?|data|news|results?))\b/i,
      /\bthings have (changed|gotten|become) (so much |)(worse|better|different) (lately|recently|these days)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'E'
  },
  {
    name: 'Reactance Bias',
    type: 'bias',
    definition: 'Rejecting a position primarily because someone is trying to persuade you to accept it.',
    triggers: [
      /\bthey('re| are) (just |only |)(trying to|attempting to) (manipulate|control|push|force|pressure) (us|you|me|people)\b/i,
      /\bI (refuse|won'?t|will not) (believe|accept|trust) (it|this|that) (just |simply |)(because|since) (they|someone|the media|the government) (say|says|told|wants)\b/i,
      /\bthe (more|harder) (they|someone|the media) (push(es)?|tries?|insists?), the (more|less) (I|we|people)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Ostrich Effect',
    type: 'bias',
    definition: 'Avoiding negative information by refusing to engage with contradictory evidence.',
    triggers: [
      /\bI (don'?t|won'?t|refuse to) (read|watch|listen to|look at|consider|engage with) (that|those|the other side|mainstream media|alternative media|their|anything from)\b/i,
      /\bnot (worth|going to) (reading|watching|listening to|considering|engaging with)\b/i,
      /\bdon'?t need to (read|watch|look at|consider|hear) (it|that|their|the) (to know|to see|to understand)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Zero-Risk Bias',
    type: 'bias',
    definition: 'Preferring to eliminate a small risk entirely over reducing a much larger risk significantly.',
    triggers: [
      /\bany (risk|chance|possibility|danger|case) (of |)(false positives?|error|harm|failure|side effect) is (simply |absolutely |just )?(unacceptable|too much|intolerable|not acceptable)\b/i,
      /\bnot worth (it|doing|funding|trying|implementing) unless (it|we|they) (can|will|does|guarantees?)\b/i,
      /\bunless it (catches?|detects?|prevents?|eliminates?|stops?) (100%|every|all|each)\b/i,
      /\b100% (of cases|effective|guaranteed|certain|success|accuracy)\b/i,
      /\bzero (tolerance|risk|exceptions?|errors?|failures?)\b/i,
      /\beven (one|a single|any) (case|instance|error|exception|failure) is (too many|unacceptable|proof)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'A'
  },
  {
    name: 'Neglect of Probability',
    type: 'bias',
    definition: 'Failing to account for the actual likelihood of an event when making decisions.',
    triggers: [
      /\b(it|this|that) (could|might|may|can) happen\b/i,
      /\b(what if|imagine if|suppose) (it|this|that) (happened|happens|does|did|were to)\b/i,
      /\b(the possibility|the chance|the risk) (that|of) .{3,60}(means?|requires?|demands?|justifies?)\b/i,
      /\bjust (because|since) (it'?s?|something is) (possible|conceivable|imaginable)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'E'
  },
  {
    name: 'Bandwagon Effect (Momentum)',
    type: 'bias',
    definition: 'Believing something is correct or good primarily because it is gaining popularity or momentum.',
    triggers: [
      /\b(growing|increasing|rising|more and more) (number of people|companies|countries|experts?|researchers?|scientists?) (are |now )?(saying|believing|accepting|adopting|doing)\b/i,
      /\bthe (tide|wind|momentum|direction) is (turning|shifting|moving|changing) toward\b/i,
      /\beveryone is (moving|shifting|switching|turning) to\b/i,
      /\bthe (future|trend|direction) is (clearly|obviously|definitely|undeniably)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Affect Heuristic',
    type: 'bias',
    definition: 'Making judgments based on emotional response rather than analysis.',
    triggers: [
      /\b(feels?|seemed?|sounds?) (wrong|right|dangerous|safe|good|bad|off|correct|true|false)\b/i,
      /\bmy (gut|instinct|intuition|feeling) (tells?|says?|knows?)\b/i,
      /\bsomething (just |)(feels?|seems?) (off|wrong|right|suspicious|dangerous|safe)\b/i,
      /\bI (just |)(feel|sense|know) (it'?s?|that it'?s?) (wrong|right|true|false|dangerous|safe)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'O'
  },
  {
    name: 'Semmelweis Reflex',
    type: 'bias',
    definition: 'Reflexively rejecting new evidence because it contradicts established norms or beliefs.',
    triggers: [
      /\bwe('ve| have) (always|never) (done|believed|accepted|practiced|followed) (it|this|that) (this way|like this|before)\b/i,
      /\bthat'?s? (just |)(how|the way) (it'?s?|things|we|they) (always |)(work|done|been|operated)\b/i,
      /\bif (it|this|that) (worked|was true|was correct|was right), we would (already|have already) (know|known|be doing|have done)\b/i,
      /\bpeople (have|were) (always|never) (done|believed|thought|said|known) (this|that|it) (before|until now)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'A'
  },
  {
    name: 'Planning Fallacy',
    type: 'bias',
    definition: 'Underestimating the time, costs, and risks of future actions while overestimating benefits.',
    triggers: [
      /\bshould (only|just) take (a few|two|three|four|five|several) (days?|weeks?|months?)\b/i,
      /\bwill (be done|be complete|be finished|be ready) (by|within|in) (a few|two|three|several)\b/i,
      /\bonce (we|they|it) (implement|deploy|launch|finish|complete|build)\b/i,
      /\bit'?s? (just|only|simply|really) a matter of (time|implementation|execution|doing it)\b/i,
      /\beasily (done|implemented|deployed|executed|achieved|completed)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'T'
  },
  {
    name: 'Decoy Effect',
    type: 'bias',
    definition: 'Having preferences influenced by an irrelevant third option introduced to make one choice seem superior.',
    triggers: [
      /\bcompared to (option|choice|alternative) [A-C]\b/i,
      /\bwhen you consider (all|both|the) (options?|choices?|alternatives?)\b/i,
      /\bthe (obvious|clear|only rational|best) choice (when|if|given|considering)\b/i,
    ],
    contextValidators: [/.*/],
    floaterDimension: 'A'
  },
  {
    name: 'Moral Licensing',
    type: 'bias',
    definition: 'Using past good behavior as justification for current questionable behavior.',
    triggers: [
      /\bwe'?ve? earned (the right|this|that|it)\b/i,
      /\bafter everything (this|our|the) (company|organization|team|community|family|country) has (done|contributed|given|built|sacrificed)\b/i,
      /\b(earned|deserve|have earned) the right to (handle|decide|manage|do|act)\b/i,
      /\bgiven (everything|all) (we'?ve?|they'?ve?|I'?ve?) (done|contributed|given|built|sacrificed)\b/i,
      /\bafter (40|30|20|50|decades?|years?) of (contribution|service|work|building|giving)\b/i,
      /\bconsidering (how much|everything) (we'?ve?|they'?ve?|I'?ve?) (done|given|sacrificed|contributed|built)\b/i,
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
