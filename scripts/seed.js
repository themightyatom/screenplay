// Seeds data/ from SCENES.md, CHARACTERS.md, FRAMING.md, RESEARCH.md, characters/*.md.
// Never overwrites: a file that already exists is left alone.
// Run: npm run seed

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');

let written = 0, skipped = 0;
function put(rel, obj) {
  const p = path.join(DATA, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  if (fs.existsSync(p)) { skipped++; return; }
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  written++;
}

const SRC_LIST = 'CHARACTERS.md v1 (Straarup, RAHS 2020; research notes; Knud Birk memoir; Randers Kommune info board)';
const SRC_OLE = 'characters/Ole_Hovedskov.md §1 KNOWN';
const SRC_VOGEL = 'characters/The_German_Officer.md §1';

// ---------------------------------------------------------------- framing

put('framing.json', {
  narrator: 'An old man on the bench by the iron bridge. Never named. Based on Knud Birk (1924–2024), who stood on Langå platform the morning the sleeper flew.',
  listener: 'The cyclist. Fifties, tall, skinny, full kit every ride. Punctures at the bridge, sits down, is told the story. What he knows: nothing. He rides across the bridge every week.',
  strands: [
    { id: 'NOW', label: 'The bench, present day', description: 'Start on the bench, end on the bench. The whole story is told there.' },
    { id: 'THEN', label: 'Randers / Langå 1943–1951', description: 'The bridge, the six, the hunters, the long note.' },
    { id: 'LONDON', label: 'The oak-clad room (open)', description: 'High officials weigh whether Denmark was an ally. Invented: in reality it was Foreign Office/State Dept letters (Warner–Cumming, 1944), Yalta (Churchill blocked Denmark, Feb 1945), and a San Francisco conference vote (June 1945). The room compresses those into one argument. Decision needed: alongside the old man (recommended) or instead of him. If alongside: the room is what the old man can\'t see. It is where the cyclist\'s modern life is decided.' }
  ],
  weight: 'Denmark was counted an ally after the war because of Langå, among other actions. The story behind the story: the cyclist\'s modern life exists because of the bridge that just punctured his tyre. He doesn\'t know it. The old man does.',
  open: [
    'Puncture: too obvious? Alternatives: chain off, a wrong turn, rain. Or keep it and make it the point (the doc\'s note: neither he nor Denmark chose to stop here).',
    'LONDON strand: alongside the old man (recommended) or instead of him?'
  ],
  notes: '',
  sketch: '',
  images: []
});

// ---------------------------------------------------------------- scenes

put('scenes/000_the_bench.json', {
  number: 0,
  title: 'The Bench',
  slug: 'the_bench',
  strand: 'NOW',
  date: '2026',
  location: 'gudenaa_bench',
  characters: ['the_old_man', 'the_cyclist'],
  summary: 'Puncture. The cyclist sits. The old man says the bridge has been blown up twice, and points to where the other two stood. He begins.',
  purpose: 'Opens the film. Sets the narrator\'s voice. Plants the question the cyclist can\'t yet ask: what has this got to do with me?',
  open: ['See Framing: is the puncture too obvious?'],
  status: 'discussed',
  script: '',
  images: [],
  notes: 'Where: the bench by the rust-red box bridge, 1862. Old railway embankment, now cycle path.\nWho: the old man. The cyclist: fifties, tall, skinny, all the gear.',
  sketch: ''
});

put('scenes/001_hotel_randers_dining_room.json', {
  number: 1,
  title: 'Hotel Randers, Dining Room',
  slug: 'hotel_randers_dining_room',
  strand: 'THEN',
  date: '1943-10',
  location: 'hotel_randers',
  characters: ['ole_hovedskov', 'inger', 'ernst_vogel', 'ortskommandant_randers'],
  summary: 'Saturday evening, autumn 1943. Ole and Inger play the dinner set: light classical, Danish songs, a little Lehár for the uniforms. Vogel requests Schubert. Ole plays it well. Vogel sends over a glass and his card: "You should be in Berlin." Ole pockets it.',
  purpose: 'Puts Ole and the officer in one room, on opposite sides of the same music, before either knows who the other is. Establishes the compromise: Ole takes German money. The card stays in his pocket until his arrest.',
  open: [
    'Date: before or after 29 August 1943? (Recommend after.)',
    'Does anyone at a Danish table look at Ole with contempt?',
    'What Inger says on the walk home, if anything.'
  ],
  status: 'discussed',
  script: '',
  images: [],
  notes: 'Where: Hotel Randers, Torvegade. Est. 1856. Art Deco dining room. German use of the hotel is our invention; documented SS venue was Hotel Corner, Storegade.\nAlso present: two or three Wehrmacht officers from the Randers garrison, one senior. Randers bourgeoisie at the other tables. Waiters.\n\nOut: time-travel cut. From the empty bridge today to a black German steam engine rushing across in 1943. Loco: BR 52 Kriegslok, black, swastika flags on the front. DECIDED. See research: german_train.',
  sketch: ''
});

// ---------------------------------------------------------------- locations

// "active" = actually in the film. Everything else stays on file as reference.
const ACTIVE_LOCATIONS = new Set(['gudenaa_bench', 'hotel_randers']);
const ACTIVE_CHARACTERS = new Set(['the_old_man', 'the_cyclist', 'ole_hovedskov', 'inger', 'ernst_vogel', 'ortskommandant_randers']);

function loc(slug, name, real, description, notes = '') {
  put(`locations/${slug}.json`, { name, active: ACTIVE_LOCATIONS.has(slug), description, real, images: [], notes, sketch: '' });
}

loc('gudenaa_bench', 'The bench by the iron bridge, Gudenå valley', true,
  'The bench by the rust-red box bridge, 1862. Old railway embankment, now cycle path. Where the whole story is told. From here you can see where the other two bridges stood.');
loc('langaa_bridges', 'The Langå railway bridges', true,
  'The two bridges over the Gudenå at Langå, blown by the six on the night of 17 November 1943. Supply line to 350,000 men in Norway. Blown up twice (1864 and 1943).',
  'Charges: Bak calculated 75 kg of Nobel 808 on the bearings and main girders; the info board says 80 kg. Blasts at 5.25, 6.15, 7.35, 9.41. Two reserve police guards tied to a post out of blast range.');
loc('langaa_station', 'Langå station and platform', true,
  'Where Knud Birk stood with his toolbox the morning a railway sleeper flew over the town. German officers walk out to inspect the damage when the 9 o\'clock charge goes off and run back to the station.');
loc('vaethvej_bicycle_shop', 'The Birk bicycle shop, Væthvej, Langå', true,
  'Ulla Birk runs it: patches, spokes, tyres, paints frames. Knud grows up here and later builds bombs in his bedroom.');
loc('hotel_randers', 'Hotel Randers, Torvegade', true,
  'Founded 1856, Denmark\'s oldest provincial hotel. Art Deco dining room that won a prize at the 1934 Copenhagen exhibition. Autumn 1943: half German officers, half the kind of Randers bourgeoisie who still come. Ole and Inger play at the far end.',
  'German use of the hotel is our invention. Not documented as German-used in our sources.');
loc('hotel_corner', 'Hotel Corner, Storegade, Randers', true,
  'Documented SS recruiting office and the resistance\'s first target. The nastier alternative venue for the dining-room scene.');
loc('randers_statsskole', 'Randers Statsskole', true,
  'Kai Hoff teaches here as adjunct; Oluf Kroer is an old pupil. Warned by the Truppenortskommandantur in 1944.');
loc('thorsgade_barracks', 'Thorsgade barracks, Randers', true,
  'Where Kai Hoff dies on the night of 30 November 1943, shot in the back through the window while attacking a guard to escape a red-hot-stove interrogation.');
loc('aarhus_university_dormitories', 'Aarhus University, dormitories 4 and 5 (Gestapo HQ)', true,
  'Gestapo Jutland headquarters from October 1943. Flattened by 25 Mosquitos on 31 October 1944 at 11.30 in the morning; Schwitzgebel killed at his desk.');
loc('skaering_hede', 'Skæring Hede', true,
  'The heath north of Aarhus where five Danes were shot at dawn on 2 December 1943 by about 50 Wehrmacht soldiers pulled off a train in transit from the Russian front to Norway. Kaj Munk\'s verse is on the stone.');
loc('vestre_faengsel', 'Vestre Fængsel, Copenhagen', true,
  'The death cell. Ole and Torstensson sit here summer 1944 in the wing where the Hvidsten group sat. Eight Hvidsten men shot 29 June; then the executions stop.');
loc('dreibergen_butzow', 'Dreibergen-Bützow prison, Mecklenburg', true,
  'German prison where Ole serves the life sentence from October 1944. Cold, hunger, the cough that starts in January and doesn\'t stop.');
loc('vejlefjord_sanatorium', 'Vejlefjord Sanatorium', true,
  'Where Ole spends 1945–51: a bed on a veranda, sea air, the disease advancing and retreating. Børge visits once, from Gothenburg, with drawings for a monument.');
loc('mindelunden_randers', 'Mindelunden, Nordre Kirkegård, Randers', true,
  'The memorial grove. Kai Hoff buried here at night, the townspeople cover the grave in red and white flowers next day. Ole buried here 1951, in front of the stone with Kaj Munk\'s verse, with the men shot in 1943.');
loc('hvidsten_kro', 'Hvidsten Kro', true,
  'Marius Fiil\'s inn. Base of the receiver group that collects the Halifax drops, including the 80 kg for Langå on 15 November 1943.');
loc('wolfsschanze', 'Führerhauptquartier Wolfsschanze, East Prussia', true,
  '30 December 1943. Hitler, Himmler, Kaltenbrunner, Best, von Hanneken, Pancke. Hitler rules that trials "would only create martyrs" and orders murder for murder, sabotage for sabotage against purely Danish targets.',
  'Documented from the Best trial transcript. See research: wolfsschanze_30_dec_1943.');
loc('london_room', 'The oak-clad room, London', false,
  'Invented. High officials weigh whether Denmark was an ally. Compresses the Warner–Cumming letters (1944), Yalta (Feb 1945) and the San Francisco vote (June 1945) into one argument. What the old man can\'t see; where the cyclist\'s modern life is decided.');

// ---------------------------------------------------------------- research

put('research/german_train.json', {
  title: 'The German train (scene 1 cut)',
  source: 'signalposten.dk forum thread 2129; jernbanen.dk; Arbeitskreis Lokgeschichte. Book recommended: "Roer på skinner".',
  summary: 'DECIDED: BR 52 Kriegslok, black, swastika flags on the front.\n\nGerman classes documented running in Denmark 1940–45: BR 17, 38, 50, 52, 55, 56, 57, 89, 93, 99.\nBR 38.10 (Prussian P8): confirmed in Jutland from 1940, hauling the "SF" fast trains for naval personnel, Flensburg up through Jutland, until 1944. Most likely German engine actually crossing Langå in 1943.\nBR 52 Kriegslok: the iconic black war locomotive, built from Sept 1942, did run in Denmark. The stronger film image, plausible but less certain on this line.\nCaveat: most German military transports in Jutland were hauled by DSB engines (litra E, R, P) with Danish crews. A German-crewed black engine is the exception, which is why it reads as the enemy.',
  scenes: ['001_hotel_randers_dining_room'],
  characters: [],
  images: [],
  notes: '',
  sketch: ''
});

put('research/nobel_808_explosive.json', {
  title: 'Nobel 808 and the "808 headache"',
  source: 'characters/Ole_Hovedskov.md §3; Straarup (Bak\'s calculation); Randers Kommune info board.',
  summary: 'Nobel 808 was the explosive at Langå. Plastic, kneaded by hand, smells of almonds; nitroglycerin absorbed through the skin gives everyone who handles it a splitting headache within the hour. Every saboteur of the period mentions it. Bak calculated 75 kg of 808 on the bearings and main girders; the info board says 80 kg (and "plastic PE2", which is wrong).',
  scenes: [],
  characters: ['ole_hovedskov', 'christian_bak'],
  images: [],
  notes: 'The scene: a violinist kneading explosive with the fingers he has spent nine years training, riding home with his skull splitting, washing the almond smell off before his mother wakes.',
  sketch: ''
});

put('research/wolfsschanze_30_dec_1943.json', {
  title: 'The Hitler meeting, 30 December 1943',
  source: 'Best trial transcript; Danish Wikipedia, Langåbrosprængningerne.',
  summary: 'Present: Hitler, Himmler, Kaltenbrunner, Best, von Hanneken, Pancke.\nHitler asked Best how a small country like Denmark could not be controlled. Best argued Denmark\'s economic importance, said the security situation was favourable, recommended faster court procedures. Pancke asked for SS and police courts. Hitler rejected both: jurisdiction "blot ville skabe martyrer" (would only create martyrs). He ordered every killing of a German or German-friendly person answered immediately and under the same conditions, and sabotage answered with sabotage against "rene danske objekter: bladhuse, sportsindretninger, forlystelsessteder". Ratio five to one; Pancke later proposed one to one. Best and Pancke both protested afterwards that this would destabilise the country. They were right and it didn\'t matter.\n4 January 1944: Kaj Munk murdered by Schwerdt\'s group.',
  scenes: [],
  characters: ['werner_best', 'gunther_pancke', 'hermann_von_hanneken', 'ernst_vogel', 'kaj_munk', 'otto_schwerdt'],
  images: [],
  notes: 'What we invent is the temperature of the room, and the moment Best realises Skæring Hede, which he thought was the answer, was the thing that made Hitler ask the question.',
  sketch: ''
});

put('research/source_discrepancies.json', {
  title: 'Flagged discrepancies in the sources',
  source: 'CHARACTERS.md v1; Straarup (RAHS 2020); research notes; Randers Kommune info board.',
  summary: '1. The research notes say Anders Andersen and Otto Manley Christiansen were "also executed"; Straarup makes clear they were in other Randers groups and NOT on the bridge. Decide whether the film keeps that distinction.\n2. Ages: notes give Hoff 31 and Jacobsen "unknown"; Straarup gives Hoff 30, Jacobsen 29.\n3. Explosive: info board says 80 kg; Bak calculated 75 kg of "808" (not plastic PE2).\n4. Niels Birk "forced to work for the Nazis" is not in the scanned text; only a repair contract with the Danish dam contractor.\n5. Two different Jensens: Harvy (interpreter, Randers) and "Jacob" (SOE agent, Aarhus). The notes conflate the arrests; Straarup credits Harvy Jensen with the Langå round-up, "Jacob" with Hvidsten.\n6. Straarup says the two policemen were tied to a post after the charges were laid; the info board says before. Minor, but it changes the scene.',
  scenes: [],
  characters: ['anders_andersen', 'otto_manley_christiansen', 'kai_hoff', 'ejvind_jacobsen', 'christian_bak', 'niels_birk', 'harvy_jensen', 'jacob_jensen', 'reserve_police_guards'],
  images: [],
  notes: '',
  sketch: ''
});

// ---------------------------------------------------------------- characters

function known(list, source = SRC_LIST) {
  return list.map(f => (typeof f === 'string' ? { fact: f, source } : f));
}
function rel(character, label) { return { character, label }; }

function ch(slug, o) {
  put(`characters/${slug}.json`, {
    name: o.name,
    active: ACTIVE_CHARACTERS.has(slug),
    age_1943: o.age || '',
    role: o.role || '',
    fate: o.fate || '',
    known: known(o.known || [], o.source),
    invented: o.invented || [],
    arc: o.arc || '',
    relationships: o.relationships || [],
    images: [],
    notes: o.notes || '',
    sketch: ''
  });
}

// --- A. The six on the bridge

ch('kai_hoff', {
  name: 'Kai Hannibal Hoff', age: '30–31', role: '"Carlo". Leader of the Randers network', fate: 'died 30 Nov 1943',
  known: [
    'Adjunct teacher at Randers Statsskole, Winter War veteran from the Finnish army, runs the Terrain Sports Club as cover.',
    'Leader of the whole Randers network. Refuses to flee after the arrests, is taken 30 Nov 1943.',
    'Dies attacking a guard to escape a red-hot-stove interrogation at Thorsgade barracks; shot in the back through the window.',
    'Buried at night in the memorial grove; Pastor Borchsenius forbidden to speak, sings instead. Next day the townspeople cover the grave in red and white flowers.'
  ],
  relationships: [rel('jorgen_rojel', 'plans the bridges with'), rel('oluf_kroer', 'old pupil'), rel('thorup_petersen', 'driven by'), rel('ernst_vogel', 'interrogated by / dies in his custody'), rel('poul_borchsenius', 'buried by')],
  notes: 'Ages disagree: notes 31, Straarup 30.'
});

ch('jorgen_rojel', {
  name: 'Jørgen Røjel', age: '27', role: 'The doctor. SOE\'s planner for the bridges', fate: 'survived; died aged 90',
  known: [
    'Junior doctor at Randers Hospital since August 1943, ordered by SOE (Geisler) to plan the bridges and stay away from every other illegal circle.',
    'Goes to bed convinced the fuses have failed, hears the first blast from his pillow.',
    'Warned by Dr Thorup Petersen on the morning of 20 Nov that the arrests have begun; flees to Sweden two days later.',
    'Lives to 90 and writes the books everyone else quotes.',
    'Called Harvy Jensen a traitor for 27 years, read the case file in 2000, and wasn\'t sure any more.'
  ],
  relationships: [rel('kai_hoff', 'co-planner'), rel('ole_geisler', 'takes orders from'), rel('thorup_petersen', 'warned by'), rel('harvy_jensen', 'judged, then doubted')]
});

ch('sven_johannesen', {
  name: 'Sven Christian Johannesen', age: '20', role: 'The young leader', fate: 'shot Skæring Hede 2 Dec 1943',
  known: [
    'Machinist at Scandia railway works, from Odense, Conservative Youth (KU), leader of two earlier sabotage groups.',
    'Draws a pistol when the Gestapo break in.',
    'Tells the court-martial his death will raise new fighters.',
    'Hides a farewell note under a stamp: "My God, My Country, My Honour."',
    'Named to the interrogator by Anders Andersen, who was told his friend had already confessed.'
  ],
  relationships: [rel('ole_hovedskov', 'recruits (proposed); knows from KU dances'), rel('director_waerum', 'employer, who refuses to sign the clemency petition'), rel('anders_andersen', 'named by')]
});

ch('oluf_kroer', {
  name: 'Oluf Akselbo Kroer', age: '27', role: 'The banker', fate: 'shot Skæring Hede 2 Dec 1943',
  known: [
    'Savings-bank clerk, Conservative Youth board member, old pupil of Hoff\'s school.',
    'Walks into a Gestapo trap carrying two pistols, one of them a policeman\'s from the bridge.',
    'Writes to his mother that he goes to death a believing man.'
  ],
  relationships: [rel('kai_hoff', 'former pupil of'), rel('reserve_police_guards', 'carries one of their pistols; it hangs him')]
});

ch('ole_hovedskov', {
  name: 'Ole Hovedskov', age: '20', role: 'The violinist', fate: 'sentenced to death, reprieved; died of TB 8 Dec 1951, aged 28',
  source: SRC_OLE,
  known: [
    'Born 1923, Randers. Spelled Hovedskov in Straarup, Hovedskou in the notes.',
    'Father: Peter Valdemar Hovedskov, gas and water master. Mother: Wilhelmine, née Hansen.',
    'Brother Børge, b. 1910, painter and sculptor, Academy-trained, also resistance, escaped to Sweden 1943.',
    'Konservativ Ungdom (KU) member, same as Sven Johannesen and Oluf Kroer.',
    '"Violinist" in Straarup, "professional violinist" in the notes.',
    '17 Nov 1943: one of the six who cycle from Randers to the plantation and lay the charges. Straarup: few of them knew each other beforehand and no names were exchanged.',
    '30 Nov 1943: arrested the same day as Kai Hoff, together with journalist trainee Viggo Torstensson. Hoff dies that night at Thorsgade barracks.',
    '16 May 1944: court-martial. Sentenced to death with Torstensson.',
    'Summer 1944: death cell, Vestre Fængsel, where the Hvidsten group had sat. Eight Hvidsten men shot 29 June. The Germans then halt executions. That halt is what keeps him alive.',
    '19 Sep 1944: sentence changed to life imprisonment in Germany. Dreibergen-Bützow prison, Mecklenburg.',
    'Contracts pulmonary tuberculosis in Germany.',
    'April 1945: brought out by Bernadotte\'s Swedish Red Cross (the white buses).',
    '1945–51: Vejlefjord Sanatorium.',
    '8 Dec 1951: dies, age 28. Buried in Mindelunden, Nordre Kirkegård, Randers, in front of the stone with Kaj Munk\'s verse.',
    'Not one sentence he said survives. Not one photograph in our folder. No instrument, no teacher, no girl.'
  ],
  invented: [
    'WANT: to play. To get out of Randers and into a real orchestra. Radio Symphony auditions, spring 1944. Every choice in November 1943 is made by someone who believes he has a spring.',
    'NEED: to find out whether he is anything when the violin is taken away. The film answers yes. It costs him everything to learn it.',
    'WOUND: thirteen years younger than Børge. The family\'s second artist, the one who was "also musical". Langå is the first thing he ever did that Børge didn\'t do first.',
    'THE LIE: that his hands are who he is.',
    'Trained at Det Jyske Musikkonservatorium, Aarhus, from autumn 1940. Commutes weekly on the Aarhus–Randers line; knows the Langå bridges by the change in sound from embankment to iron.',
    'Money: dance orchestras, restaurant trios, weddings, cinema when the sound fails. Plays the Hotel Randers dining room with Inger, German officers present. DECIDED: he played for Germans, and never forgives himself.',
    'The instrument: a German trade violin, Markneukirchen, bought second-hand by his father when Ole was eleven. He is tired of the joke.',
    'Absolute pitch. He hears rooms. Knows a train\'s speed by its pitch on the rails. It is Ole who identifies the whistled all-clear as a quarter-tone flat, the way that constable always whistles, and therefore not a German. The musician\'s ear saves the mission.',
    'Kneads the 808 with the fingers he has spent nine years training; rides home with the 808 headache; washes the almond smell off before his mother wakes.',
    'Voice: quiet, exact, listens more than he talks, describes things in terms of sound. Never makes a speech. One line at the court-martial, about music; the judges don\'t understand it.',
    'He never learns that eight Hvidsten deaths bought his life. The audience carries that for him.',
    'Motifs: pitch (train on iron, time pencils, the whistle, the bedframe at 5.25, his forearm in the cell, the cough). Almonds (808 in November, marzipan at Christmas 1943 in a cell, the sanatorium kitchen in 1950). Hands. The German violin.',
    'The violin\'s fate (open): buried with him / given to a pupil / Inger keeps it unplayed / sold by the father to pay the sanatorium (cruellest, probably truest).'
  ],
  arc: 'I. THE SPRING HE THINKS HE HAS (Sept–Oct 1943). Randers after 29 August. Practising the Sibelius for the Radio audition. Sven asks a question that isn\'t quite a question; Ole says yes before it is finished. For Denmark, and partly to have something Børge doesn\'t.\n\nII. THE NIGHT (17–18 Nov). Six bicycles in the sleet. Sacks of almond-smelling clay. The shot from the darkness and thirty seconds of believing it\'s over. The whistled tune, a quarter-tone flat. Kneading the charge onto a bearing with hands he can no longer feel. The time pencil. Home with a headache like a spike. Bed at three. Then at 5.25 a sound from the south he feels in the bedframe. He counts: 6.15, 7.35, 9.41. Four. He knows what six would have sounded like.\n\nIII. THIRTEEN DAYS (18–30 Nov). A dance on the Saturday. Otto and Anders taken. Sven on the Friday, Oluf that evening; he learns it from a newspaper boy. Røjel gone. Hoff stays, so Ole stays. A wedding on the 27th; the bride\'s uncle is a policeman. On the 30th they come for Hoff in the morning and Ole in the afternoon. He is practising. He asks if he can put the violin in its case first, and they let him.\n\nIV. THE MACHINE (Dec 1943 – May 1944). Aarhus, then Copenhagen. Learns of Hoff\'s death from a guard who thinks he\'ll enjoy it; of Skæring from the silence. They have every confession, so there is nothing to protect, and he tells them nothing anyway. Court-martial 16 May: death. Torstensson beside him. He is twenty.\n\nV. THE CELL (May–Sept 1944). Vestre Fængsel. The Hvidsten men in the same wing. 29 June, eight taken out at dawn. Then the executions stop and no one tells him why. No instrument; he plays the Sibelius on his forearm and hears every note. 19 September: "livsvarigt". He is going to Germany. He is going to live.\n\nVI. GERMANY (Oct 1944 – April 1945). Dreibergen-Bützow. Cold, hunger, a cough from January. He stops playing on his forearm because his fingers won\'t close. In April a Swedish bus with a red cross on the roof. He does not believe it until Malmö.\n\nVII. THE LONG NOTE (1945–1951). The platform. Inger. His mother. His father, who has brought the violin, and Ole who cannot lift his arm to take it. Vejlefjord: a bed on a veranda. Børge comes once, from Gothenburg, with drawings for a monument: the brothers\' scene, the best-written in the film. 1951: twenty-eight, the last of the six to die of the war. Buried under Kaj Munk\'s verse, eight years late.',
  relationships: [
    rel('borge_hovedskov', 'elder brother by thirteen years; recruiter (proposed)'),
    rel('inger', 'duo partner and the girl (DECIDED 5 Sep 2026)'),
    rel('peter_valdemar_hovedskov', 'father'),
    rel('wilhelmine_hovedskov', 'mother'),
    rel('sven_johannesen', 'recruited by (proposed); KU acquaintance'),
    rel('viggo_torstensson', 'arrested and sentenced with'),
    rel('ernst_vogel', 'plays for him at Hotel Randers; interrogated by him (proposed)')
  ],
  notes: 'Theme fit: "makers who became breakers" lives most literally in him. The others are broken quickly, by a bullet. Ole is broken slowly, over eight years, and the thing that breaks is the exact thing that made him: lungs, breath, hands. He is the film\'s long note.\n\nOpen: Was Børge on the bridge? (Recommend no: recruiter, in Sweden by December; his guilt drives the brothers\' scene.) Fate of the violin.'
});

ch('ejvind_jacobsen', {
  name: 'Ejvind Jacobsen', age: '29', role: '"Ravn" (the Raven). Parachute-reception leader', fate: 'survived; post-war city leader in Randers',
  known: [
    'Municipal schoolteacher, FDF scout leader, runs a parachute-reception group.',
    'Stays put for seven months under the Germans\' noses, then escapes down a too-short paper rope from a second-floor balcony, breaks his foot, and is smuggled across Jutland to Sweden.',
    'Works with Carl and Gertrud Pedersen on the drops; they are alerted via a butcher when he goes on the run.'
  ],
  relationships: [rel('carl_pedersen', 'works the drops with'), rel('gertrud_pedersen', 'works the drops with')],
  notes: 'Age: notes "unknown", Straarup 29.'
});

// --- B. The others executed at Skæring Hede

ch('anders_andersen', {
  name: 'Anders William Andersen', age: '19', role: 'Randers boy, Terrain Sports Club', fate: 'shot Skæring Hede 2 Dec 1943',
  known: [
    'Randers boy, Conservative Youth and FDF, member of Hoff\'s Terrain Sports Club.',
    'Not on the bridge. Arrested at the dairy on 19 Nov and, told his friend has already confessed, gives the interrogator Sven Johannesen\'s name.'
  ],
  relationships: [rel('sven_johannesen', 'names under interrogation'), rel('harvy_jensen', 'broken by')]
});

ch('otto_manley_christiansen', {
  name: 'Otto Manley Christiansen', age: '19', role: 'Timber-yard worker. The first thread', fate: 'shot Skæring Hede 2 Dec 1943',
  known: [
    'Timber-yard worker, Conservative Youth and FDF, in an illegal-newspaper group and a sabotage group.',
    'Not on the bridge. The first thread the Gestapo pull, on the morning of 19 Nov, and the one that unravels the rest.'
  ]
});

ch('georg_morch_christiansen', {
  name: 'Georg Mørch Christiansen', age: '22', role: 'Economics student, Aarhus group', fate: 'shot Skæring Hede 2 Dec 1943',
  known: [
    'Economics student at Aarhus University, from Vejle, Aarhus group.',
    'Shot alongside the four from Randers; a stranger to them until the death cell.'
  ]
});

ch('per_moesgaard_nielsen', {
  name: 'Per Moesgaard-Nielsen', age: '17–18', role: 'One of the two youngest', fate: 'life imprisonment in Germany',
  known: [
    'Caught almost by accident: ran down a staircase and it looked like flight.',
    'Spared by the court because of his age: life imprisonment in Germany.'
  ],
  relationships: [rel('kaj_sorensen', 'the other youngest'), rel('court_martial', 'defence counsel pleads their ages and wins')]
});

ch('kaj_sorensen', {
  name: 'Kaj Sørensen', age: '17–18', role: 'One of the two youngest', fate: 'life imprisonment in Germany',
  known: ['Spared by the court because of his age: life imprisonment in Germany.'],
  relationships: [rel('per_moesgaard_nielsen', 'the other youngest')]
});

ch('viggo_torstensson', {
  name: 'Viggo Torstensson', role: 'Journalist trainee', fate: 'sentenced to death May 1944, reprieved',
  known: [
    'Arrested with Ole Hovedskov on 30 Nov 1943, sentenced to death with him in May 1944, reprieved with him.',
    'Shares Ole\'s whole arc except the illness.'
  ],
  relationships: [rel('ole_hovedskov', 'arrested and sentenced with')]
});

// --- C. Planners and helpers

ch('ole_geisler', {
  name: 'Ole Geisler', role: 'SOE captain. Parachuted British organiser',
  known: [
    'Gives Røjel the order to hit the bridges and sets off around fifteen sabotages across Jutland in the same days.',
    'Attends every Hvidsten drop; his tolerance of parachutists lodging at the inn is the crack the Gestapo later widen.'
  ],
  relationships: [rel('jorgen_rojel', 'gives orders to'), rel('marius_fiil', 'attends his drops')]
});

ch('thorup_petersen', {
  name: 'Dr. Thorup Petersen', role: 'The driver. Randers physician with a car',
  known: [
    'Drives Hoff and Røjel to reconnoitre; drives the explosives to the plantation on 15 Nov.',
    'Warns Røjel on the morning of 20 Nov that the arrests have begun.'
  ],
  relationships: [rel('jorgen_rojel', 'warns'), rel('kai_hoff', 'drives')]
});

ch('christian_bak', {
  name: 'Christian Bak', role: 'The "sabotage technician". Municipal engineer',
  known: [
    'Calculates that 75 kg of 808 on the bearings and main girders will bring the bridges down.',
    'Goes with the explosives to the burial site; a man who does the maths and then goes home.'
  ]
});

ch('borge_hovedskov', {
  name: 'Børge Hovedskov', age: '33', role: 'The painter. Ole\'s elder brother', fate: 'survived; died 1966',
  known: [
    'Born 1910. Academy-trained painter and sculptor. Married the painter "Pepi" (Agnethe Dahl).',
    'Also in the resistance; sources disagree on whether he was at Langå.',
    'Escapes to Sweden 1943, founds an art school in Gothenburg 1945, later designs a memorial to his dead comrades while his brother dies slowly.'
  ],
  invented: [
    'The resistance came to him first, through the art world, and he brought Ole in. He is out of the country before Ole is arrested.',
    'Recommend: recruiter, not saboteur; in Sweden by December. His guilt is the engine of the brothers\' scene at Vejlefjord.'
  ],
  relationships: [rel('ole_hovedskov', 'younger brother')]
});

ch('otto_westergaard_olesen', {
  name: 'Otto Westergård Olesen', role: 'The bookseller, Køsters Boghandel', fate: 'Frøslev, then Dachau; survived',
  known: ['Runs Køsters Boghandel in Randers, where the parachuted weapons are stored before distribution. Arrested, Frøslev, then Dachau. Survives.']
});

ch('helpful_policeman', {
  name: 'The helpful policeman (unnamed)', role: 'Danish officer who supplies the guard rota',
  known: ['Supplies the guard rota, post positions and shift times for the bridge.'],
  invented: ['May be the same man as Carl Pedersen, or someone we invent.'],
  relationships: [rel('carl_pedersen', 'possibly the same man')]
});

// --- D. At the bridge

ch('reserve_police_guards', {
  name: 'The two reserve police guards (unnamed)', role: 'Bridge guards, in on the plan',
  known: [
    'One whistles "Det var en lørdag aften" as the all-clear when a stray shot nearly aborts the mission, having already phoned the main guard to check.',
    'They surrender their pistols for appearances, are tied to a post out of blast range. One of their pistols later hangs Oluf Kroer.',
    'What happened to them afterwards is a loose thread. Straarup: tied up after the charges were laid; info board: before.'
  ],
  invented: ['Ole identifies the whistle as a quarter-tone flat, the way that constable always whistles it.'],
  relationships: [rel('oluf_kroer', 'his pistol hangs him'), rel('ole_hovedskov', 'whistle identified by')]
});

ch('niels_gunnar_pedersen', {
  name: 'Niels Gunnar Pedersen', role: 'Reserve police officer',
  known: ['Buried in the memorial grove beside Kai Hoff in June 1945. Sources don\'t say how he died or whether he was one of the bridge guards. Worth chasing.']
});

// --- E. Langå, the town

ch('knud_birk', {
  name: 'Knud Birk', age: '18–19', role: 'The mechanic\'s son. Basis for the old man on the bench', fate: 'survived (1924–2024)',
  known: [
    'Only child of the Væthvej bicycle shop, standing on Langå platform with his toolbox that morning when a railway sleeper flies over the town.',
    'Not involved in the bridges but later builds bombs in his bedroom, cycles them to the Viborg line, escapes to Sweden.'
  ],
  relationships: [rel('niels_birk', 'father'), rel('ulla_birk', 'mother'), rel('the_old_man', 'basis for'), rel('langaa_informer', 'asked after by')]
});

ch('niels_birk', {
  name: 'Niels Birk', role: 'The father. Blacksmith, foreman at Rekord',
  known: [
    'Blacksmith, ex-motorcycle racer, foreman at the Rekord machine factory, contracted to repair the dam contractor\'s machines.',
    'When an informer comes asking about his son he says the boy is on a course in Copenhagen.'
  ],
  invented: ['The research notes say he was "forced to work for the Nazis". The scanned pages only say he had a repair contract with the Danish dam contractor. Decide whether we keep the invented version.'],
  relationships: [rel('knud_birk', 'son'), rel('ulla_birk', 'wife')]
});

ch('ulla_birk', {
  name: 'Ulla Birk', role: 'The mother. Runs the bicycle shop',
  known: ['Runs the bicycle shop herself: patches, spokes, tyres, paints frames. The person who keeps everyone in Langå moving during rationing.'],
  relationships: [rel('knud_birk', 'son'), rel('niels_birk', 'husband')]
});

ch('langaa_informer', {
  name: 'The Langå informer (unnamed)', role: 'Local man fishing for news of Knud', fate: 'liquidated by the resistance near the war\'s end',
  known: ['Visits Niels Birk fishing for news of Knud. Liquidated by the resistance near the war\'s end. A whole subplot in one sentence.'],
  relationships: [rel('niels_birk', 'questions')]
});

ch('hans_nissen', {
  name: 'Hans Nissen', role: 'Woodwork-factory owner', fate: 'German concentration camp',
  known: ['Caught with his truck driver Laust Jensen collecting a compromised weapons drop at Tange Sø in 1944. Owner to a German concentration camp.'],
  relationships: [rel('laust_jensen', 'employer of')]
});

ch('laust_jensen', {
  name: 'Laust Jensen', role: 'Truck driver', fate: 'Frøslev',
  known: ['Caught with Hans Nissen collecting a compromised weapons drop at Tange Sø in 1944. Driver to Frøslev.'],
  relationships: [rel('hans_nissen', 'drives for')]
});

ch('german_officers_platform', {
  name: 'The German officers on the platform', role: 'The only comic beat in the sources',
  known: ['Walking out to inspect the damage when the 9 o\'clock charge goes off; run back to the station.']
});

// --- F. The hunters

ch('ernst_vogel', {
  name: 'Kriminalrat Ernst Vogel', age: '43', role: 'The German officer. Composite. SS-Sturmbannführer, Sicherheitspolizei', fate: 'killed at his desk 31 Oct 1944 (as Schwitzgebel)',
  source: SRC_VOGEL,
  known: [
    'COMPOSITE. Built from Eugen Schwitzgebel (the spine: rank, energy, informant-recruiting, death), Harvy Jensen (the face: the method), and the unnamed Truppen-Ortskommandant of Randers (the social man: the dinner table, the culture, the humiliation).',
    'Name is a placeholder. "Vogel" echoes General Vogel von Falckenstein, who blew the same bridge in 1864.'
  ],
  invented: [
    'A German policeman of the professional kind. Kriminalrat is a civil police rank: a detective in Munich before he was ever SS. Likes music, genuinely, and knows enough to know Ole is good. In Denmark since 1940; three years of being polite in a country that was polite back. Believes on 16 Nov 1943 that he understands the Danes.',
    'WANT: order. Denmark to stay the one posting in Europe where a policeman can do his job without becoming a butcher. Not a good man: a man who has arranged his life so he never has to find out what he is.',
    'Langå takes that away. He chooses the police way over the SS way and it works, horribly well: a 22-year-old Danish interpreter and a kind voice break the network in two days without a blow. He has proven you don\'t need torture. He has also proven he will deliver five corpses on schedule.',
    'THE TURN: Hoff, 30 November. The stove is lit. He leaves the room (recommended). It is worse. When Hoff is shot through the window, something in him decides he is exactly what the uniform says.',
    'Then Hitler abolishes his method from above (30 Dec 1943). Kaj Munk in a ditch five days later. In January the murderers come through Aarhus and he gives them dinner.',
    'He recognises the violinist in the cell. The one interrogation he conducts himself; he is gentle; it is the most frightening scene in the film.',
    'His end: 31 Oct 1944, 11.30, at his desk in dormitory 4 when the Mosquitos arrive. The telegram that brought them was sent because of the chain that started at Langå. He doesn\'t know.'
  ],
  relationships: [rel('ole_hovedskov', 'hears him play; arrests and interrogates him'), rel('inger', 'tells her, in good Danish, that her partner should be in Berlin'), rel('harvy_jensen', 'watches him do the job better'), rel('kai_hoff', 'leaves the room'), rel('eugen_schwitzgebel', 'built on'), rel('gunther_pancke', 'pressed by')],
  notes: 'Open: one man or two (keep Eriksen separate, recommended)? Is he in the room when Hoff dies (recommend: he leaves)? Name.'
});

ch('eugen_schwitzgebel', {
  name: 'Eugen Schwitzgebel', age: '43', role: 'Chief of Gestapo Jutland. The spine of Vogel', fate: 'killed 31 Oct 1944, Aarhus',
  source: SRC_VOGEL,
  known: [
    'Kriminalrat and SS-Hauptsturmführer (later Sturmbannführer), chief of Gestapo Jutland. 1900–1944.',
    'Arrived Aarhus October 1943, six weeks before Langå, set up in dormitories 4 and 5 at Aarhus University.',
    'Short, stocky Bavarian, ruthless, impatient, loved to terrorise his subordinates. "Remarkably energetic" at recruiting Danish informants.',
    'Led raids in person: 13 Jan 1944, the Kæraas villa in Risskov, where a woman was shot dead in front of her seven-year-old.',
    'Received Kaj Munk\'s murderers as honoured guests in January 1944 and proposed to hire them for reprisal bombings in Aarhus.',
    'Killed at his desk 31 Oct 1944 when 25 Mosquitos flattened the dormitories. Buried Vestre Kirkegård, Copenhagen.'
  ],
  relationships: [rel('ernst_vogel', 'basis for')]
});

ch('ortskommandant_randers', {
  name: 'The Truppen-Ortskommandant, Randers', role: 'Wehrmacht garrison commander. The social man in Vogel',
  source: SRC_VOGEL,
  known: [
    'Documented as existing (the Statsskole was warned by the Truppenortskommandantur in 1944) but not named in our sources.',
    'Army, not SS. The man who would actually sit in a hotel dining room.'
  ],
  invented: ['Older. The kind who had a decent war until November 1943. Someone in Randers was responsible for the security of that bridge, and on 18 November his career ended.'],
  relationships: [rel('ernst_vogel', 'folded into')]
});

ch('harvy_jensen', {
  name: 'Harvy Jensen', age: '22', role: '"Eriksen", the Gestapo interpreter', fate: '18 years; released 1950',
  known: [
    'Danish civilian hired as Gestapo interpreter 36 hours before Langå.',
    'Not a torturer. A listener. Friendly, brilliant at reading people; asks teenagers about their families and their clubs, tells each one the last one has already confessed. Breaks the Randers groups in 48 hours. His work leads to 18 executions.',
    'Later warns the resistance of coming raids. Sentenced to 18 years, out in 1950.',
    'Røjel called him a traitor for 27 years, read the file in 2000, and wasn\'t sure.'
  ],
  relationships: [rel('anders_andersen', 'breaks'), rel('jorgen_rojel', 'judged by'), rel('ernst_vogel', 'works for')],
  notes: 'Not the same man as "Jacob" Jensen (SOE agent, Aarhus). Straarup credits Harvy with the Langå round-up.'
});

ch('jacob_jensen', {
  name: '"Jacob Jensen"', role: 'The SOE agent who broke', fate: 'vanishes from the record after the war',
  known: [
    'British-trained Danish parachutist captured in Aarhus 13 Dec 1943.',
    'Under torture gives up the whole Jutland receiver network: 145 arrests, Hvidsten destroyed. Used as a prosecution witness.'
  ],
  notes: 'A different Jensen from Harvy. The notes conflate the arrests.'
});

ch('werner_best', {
  name: 'Dr. Werner Best', role: 'Reich plenipotentiary',
  known: [
    'Wants a quiet, productive Denmark and as little German violence as possible.',
    'Reports to Berlin that the saboteurs are already caught and asks that no reprisals be taken against the population. The reason Langå was not Lidice.',
    'Summoned to the Wolfsschanze 30 Dec 1943 with Pancke and von Hanneken; argues for faster courts; overruled by Hitler.'
  ],
  relationships: [rel('gunther_pancke', 'at odds with'), rel('hermann_von_hanneken', 'at odds with')]
});

ch('gunther_pancke', {
  name: 'Günther Pancke', role: 'Higher SS and Police Leader',
  known: [
    'Promises Himmler that 24 arrested saboteurs will be tried and shot within days. The pressure behind the fourteen-day turnaround from bridge to firing squad.',
    'At the Wolfsschanze asks for SS and police courts; refused. Later proposes one-to-one reprisals.'
  ],
  relationships: [rel('werner_best', 'at odds with'), rel('ernst_vogel', 'pressures')]
});

ch('hermann_von_hanneken', {
  name: 'General Hermann von Hanneken', role: 'Wehrmacht commander in Denmark',
  known: [
    'The military chief, at odds with Best and Pancke. The army\'s view: the bridge is a supply line to 350,000 men in Norway.',
    'Present at the Wolfsschanze 30 Dec 1943.'
  ]
});

ch('court_martial', {
  name: 'The court-martial: judges, defence counsel, Feldpräst Plate', role: 'Figures for the trial and execution scenes',
  known: [
    'Three SS judges.',
    'A defender who pleads the ages of the two youngest and wins.',
    'Feldpräst Plate, a German army chaplain who takes a last communion with the condemned.'
  ]
});

ch('firing_squad', {
  name: 'The firing squad', role: 'About 50 Wehrmacht soldiers in transit',
  known: ['In transit from the Russian front to Norway, pulled off a train to shoot five Danes on a heath at dawn. They are the reason the bridge mattered, meeting the men who blew it.']
});

ch('otto_schwerdt', {
  name: 'Otto Schwerdt', role: '"Peter Schäfer". Runs the terror unit from Dec 1943', fate: 'sentenced to death, freed 1953, died in Cologne',
  known: [
    'Skorzeny\'s number two at the Mussolini rescue, sent by Himmler to run a terror unit in Denmark from December 1943.',
    'Murders Kaj Munk a month after Skæring.'
  ],
  relationships: [rel('kaj_munk', 'murders')]
});

// --- G. Hvidsten

ch('marius_fiil', {
  name: 'Marius Fiil', role: 'The innkeeper, Hvidsten Kro', fate: 'shot Ryvangen June 1944',
  known: [
    'Owner of Hvidsten Kro, leader of the receiver group that collects the Halifax drops, including the 80 kg for Langå on 15 Nov.',
    'Arrested at dawn 11 Mar 1944 with his son Niels and son-in-law Peder Sørensen; all three shot at Ryvangen in June.'
  ],
  relationships: [rel('kirstine_fiil', 'daughter'), rel('gerda_fiil', 'daughter'), rel('ole_geisler', 'hosts his drops')]
});

ch('kirstine_fiil', {
  name: 'Kirstine Fiil', role: 'Daughter of Marius', fate: 'life imprisonment; survived',
  known: ['Life imprisonment. Survives to see her father, brother and husband reburied at Hvidsten.'],
  relationships: [rel('marius_fiil', 'father')]
});

ch('gerda_fiil', {
  name: 'Gerda Fiil', role: 'Daughter of Marius', fate: 'two years',
  known: ['Two years\' imprisonment.'],
  relationships: [rel('marius_fiil', 'father')]
});

ch('flemming_juncker', {
  name: 'Flemming Juncker', role: 'The landowner, Overgaard estate',
  known: ['The organiser who put Jutland\'s resistance together and offered his own fields for drops. Above the story, pulling strings.']
});

ch('jens_toldstrup', {
  name: 'Jens Toldstrup (Anton Ingersøn Jensen)', role: 'Commander of air-drop reception in Jutland', fate: 'survived',
  known: ['Tax collector turned commander of all air-drop reception in Jutland. Runs a courier network of women known as "Toldstrup\'s girls".'],
  relationships: [rel('gertrud_pedersen', 'one of his girls')]
});

ch('carl_pedersen', {
  name: 'Carl Pedersen', role: 'Randers police officer',
  known: ['Works with Ejvind Jacobsen on the drops. Alerted, via a butcher, when Jacobsen goes on the run.'],
  invented: ['May be the helpful policeman who supplies the bridge guard rota.'],
  relationships: [rel('gertrud_pedersen', 'wife'), rel('ejvind_jacobsen', 'works the drops with'), rel('helpful_policeman', 'possibly the same man')]
});

ch('gertrud_pedersen', {
  name: 'Gertrud Pedersen', role: 'One of Toldstrup\'s girls',
  known: ['Wife of Carl Pedersen, one of Toldstrup\'s girls, works with Ejvind Jacobsen on the drops.'],
  relationships: [rel('carl_pedersen', 'husband'), rel('jens_toldstrup', 'courier for')]
});

// --- H. After

ch('poul_borchsenius', {
  name: 'Pastor Poul Borchsenius', role: 'Buries Kai Hoff',
  known: ['Forbidden to speak at Kai Hoff\'s night-time burial, so he sings instead. Next day the townspeople cover the grave in red and white flowers.'],
  relationships: [rel('kai_hoff', 'buries')]
});

ch('kaj_munk', {
  name: 'Kaj Munk', role: 'The poet', fate: 'murdered 4 Jan 1944',
  known: ['Writes "Drenge, I drenge som døde" for the fallen; murdered by the Peter Group on 4 Jan 1944, body in a ditch near Silkeborg with a note pinned to it. His verse is on the stone at Skæring Hede.'],
  relationships: [rel('otto_schwerdt', 'murdered by')]
});

ch('director_waerum', {
  name: 'Director Wærum, Scandia', role: 'Sven Johannesen\'s employer. The town\'s other opinion',
  known: ['Refuses to sign the clemency petition: no punishment too hard for people who destroy Danish property.'],
  relationships: [rel('sven_johannesen', 'employer of')]
});

ch('kaj_jensen_dean', {
  name: 'Stiftsprovst Kaj Jensen', role: 'Dean',
  known: ['Visits the five in the death cell and gives each a New Testament.']
});

ch('german_nco_burial', {
  name: 'The German NCO who buried them', role: 'Comes forward after the war',
  known: ['Says where the bodies are: 500 m west of Husbjerg on the Oksbøl training ground. Six coffins are dug up and sent home.']
});

// --- I. London / Washington

ch('henrik_kauffmann', {
  name: 'Henrik Kauffmann', role: 'Danish ambassador in Washington',
  known: ['Refuses orders from occupied Copenhagen, signs Greenland to the Americans, is charged with treason at home, signs the UN Charter for Denmark in 1945.']
});

ch('christmas_moller', {
  name: 'Christmas Møller', role: 'Conservative politician in London',
  known: ['Voice of the BBC Danish Service, lobbies the British relentlessly for recognition.']
});

ch('cfa_warner', {
  name: 'C.F.A. Warner', role: 'Foreign Office. One of the men in the wood-panelled room',
  known: ['His letters with Hugh Cumming (1944) decide whether Denmark is "Allied", "associated", or neither.'],
  relationships: [rel('hugh_cumming', 'corresponds with')]
});

ch('hugh_cumming', {
  name: 'Hugh Cumming', role: 'State Department. One of the men in the wood-panelled room',
  known: ['His letters with C.F.A. Warner (1944) decide whether Denmark is "Allied", "associated", or neither.'],
  relationships: [rel('cfa_warner', 'corresponds with')]
});

ch('roosevelt', {
  name: 'Franklin D. Roosevelt', role: 'At Yalta',
  known: ['Proposes Denmark for San Francisco, February 1945.']
});
ch('churchill', {
  name: 'Winston Churchill', role: 'At Yalta',
  known: ['Objects to Denmark for San Francisco, February 1945.']
});
ch('stalin', {
  name: 'Joseph Stalin', role: 'At Yalta',
  known: ['Agrees with Churchill against Denmark, February 1945.']
});

ch('vagn_bennike', {
  name: 'Vagn Bennike', role: 'Jutland resistance commander',
  known: ['His desperate telegram brings the Mosquitos down on Gestapo HQ in Aarhus, 31 Oct 1944.'],
  relationships: [rel('eugen_schwitzgebel', 'his telegram kills'), rel('ernst_vogel', 'his telegram kills')]
});

// --- J. The framing device

ch('the_cyclist', {
  name: 'The cyclist', role: 'Listener. Audience surrogate',
  known: [],
  invented: [
    'Fifties, tall, skinny, full kit every ride. Punctures at the bridge, sits down, is told the story.',
    'Knows nothing. Rides across the bridge every week.',
    'His modern life exists because of the bridge that just punctured his tyre.',
    'Hold: may be Inger\'s grandchild. Don\'t decide yet.'
  ],
  relationships: [rel('the_old_man', 'listens to'), rel('inger', 'possibly grandchild of')]
});

ch('the_old_man', {
  name: 'The old man on the bench', role: 'Narrator',
  known: [],
  invented: [
    'Never named. Based on Knud Birk (1924–2024), who stood on Langå platform the morning the sleeper flew.',
    'Carries both the heroes\' story and the town\'s compromises.'
  ],
  relationships: [rel('knud_birk', 'based on'), rel('the_cyclist', 'tells the story to')]
});

ch('inger', {
  name: 'Inger', age: '21', role: 'The accompanist. Ole\'s girl (DECIDED 5 Sep 2026)',
  known: [],
  invented: [
    'Piano student at the same conservatory, a year older, from a farm outside Randers.',
    'They play together for money: weddings, the Hotel Randers dining room, Saturday dances. Music gives them scenes with no dialogue.',
    'The one waiting on the platform at the end of the white-bus journey, and the one who, in 1951, is asked by the family what to do with the violin.',
    'The rule: she does not die, she does not betray, she does not become a symbol. She lives the six years of slow goodbye, and after 1951 she goes on.',
    'The cyclist may be her grandchild. Hold.'
  ],
  relationships: [rel('ole_hovedskov', 'duo partner; the girl'), rel('ernst_vogel', 'is told her partner should be in Berlin')]
});

ch('town_chorus', {
  name: 'The town as chorus', role: 'Framing device',
  known: [],
  invented: ['Kebab shop, library, bridgeheads, Skæring: each stop a different keeper of a fragment.']
});

ch('peter_valdemar_hovedskov', {
  name: 'Peter Valdemar Hovedskov', role: 'Ole\'s father. Gas and water master, Randers',
  source: SRC_OLE,
  known: ['Gas and water master for Randers.'],
  invented: ['A municipal man, a keeper of pipes and pressure, whose whole life is about things flowing safely under the ground. Two sons who both became artists; he understands neither and has paid for both. He pays for the violin. He will pay for the sanatorium. He never once says he is proud, and then, at the end, does something that says it.'],
  relationships: [rel('ole_hovedskov', 'son'), rel('borge_hovedskov', 'son'), rel('wilhelmine_hovedskov', 'wife')]
});

ch('wilhelmine_hovedskov', {
  name: 'Wilhelmine Hovedskov, née Hansen', role: 'Ole\'s mother',
  source: SRC_OLE,
  known: ['Née Hansen.'],
  invented: ['The one who noticed the almond smell. The household\'s intelligence service. Works out what Ole is doing at least a week before the bridge, and says nothing, because saying something would make her responsible for stopping him and she cannot decide whether she wants to.'],
  relationships: [rel('ole_hovedskov', 'son'), rel('borge_hovedskov', 'son'), rel('peter_valdemar_hovedskov', 'husband')]
});

console.log(`seed: ${written} written, ${skipped} skipped (already existed)`);
