// The curated pool of subreddits the daily game draws from.
// Each entry carries a category (used to pick plausible distractors),
// a post-reveal blurb, and two hint variants (vague first, more telling second).

export type PoolSub = {
  name: string;
  category: string;
  blurb: string;
  hints: [string, string];
};

export const POOL: PoolSub[] = [
  { name: 'AskReddit', category: 'qa', blurb: 'The town square of open questions — millions answer everything from silly to profound.', hints: ['One of the largest communities on Reddit, built entirely around questions.', 'People here ask the crowd things like "what\'s a smell you\'ll never forget?"'] },
  { name: 'AskHistorians', category: 'qa', blurb: 'Rigorous, sourced answers about the past — bad answers get removed fast.', hints: ['A Q&A community famous for extremely strict moderation.', 'Answers here cite sources and can read like mini essays about the past.'] },
  { name: 'explainlikeimfive', category: 'qa', blurb: 'Complex things explained in plain words anyone can understand.', hints: ['A place where complicated topics get simplified.', 'Its name is a request: explain it so a child would get it.'] },
  { name: 'NoStupidQuestions', category: 'qa', blurb: 'Ask anything without embarrassment — every question is welcome.', hints: ['A judgment-free zone for questions you\'d feel silly asking out loud.', 'Its name promises that no question is a dumb one.'] },
  { name: 'AmItheAsshole', category: 'stories', blurb: 'People lay out a conflict and the crowd delivers a verdict: YTA or NTA.', hints: ['A courtroom of public opinion for personal conflicts.', 'Famous for its four-letter verdicts on who was wrong.'] },
  { name: 'relationship_advice', category: 'stories', blurb: 'Anonymous posters ask the internet what to do about the people in their lives.', hints: ['Drama, heartbreak and dilemmas — always about the people in someone\'s life.', 'Posters here usually start with ages and genders, like "I (26F) and my partner (29M)…"'] },
  { name: 'tifu', category: 'stories', blurb: 'Confessions of spectacular mistakes — today someone definitely messed up.', hints: ['Every post is a confession of a blunder, and its name is a four-letter acronym.', 'Posts famously begin with the obligatory "Obligatory this didn\'t happen today…"'] },
  { name: 'pettyrevenge', category: 'stories', blurb: 'Small wrongs answered with deliciously small acts of revenge.', hints: ['Stories of payback — but keep it small, that\'s the whole point.', 'Neighbors, coworkers and rude customers get what\'s coming, in miniature.'] },
  { name: 'MaliciousCompliance', category: 'stories', blurb: 'Following the rules exactly as written — with predictably satisfying chaos.', hints: ['Stories about obeying instructions a little too literally.', 'Bosses and bureaucrats get exactly what they asked for. Exactly.'] },
  { name: 'nosleep', category: 'fiction', blurb: 'Horror stories told as if they\'re true — everyone stays in character.', hints: ['A fiction community where everyone plays along like it\'s all real.', 'Turn the lights off: these campfire tales are meant to scare you.'] },
  { name: 'WritingPrompts', category: 'fiction', blurb: 'A one-line scenario sparks hundreds of short stories in the comments.', hints: ['Every post is a spark, and the comments are the stories it lights.', 'Often starts with "[ WP ]" — a single line that launches a thousand tales.'] },
  { name: 'EarthPorn', category: 'photos', blurb: 'Breathtaking landscape photography — despite the name, completely safe for work.', hints: ['Despite its cheeky name, this one is pure, stunning photography.', 'Mountains, valleys and lakes looking almost unreal.'] },
  { name: 'aww', category: 'photos', blurb: 'Puppies, kittens and everything cute enough to make you say the name out loud.', hints: ['The reaction it provokes is literally its name.', 'Tiny animals doing tiny adorable things.'] },
  { name: 'mildlyinteresting', category: 'photos', blurb: 'Photos of things that are just interesting enough — never more, never less.', hints: ['The vibe is calibrated: interesting, but only mildly.', 'A perfectly peeled orange, a cloud shaped like a dog — that kind of energy.'] },
  { name: 'oddlysatisfying', category: 'photos', blurb: 'Perfect fits, smooth swirls and pressure-washed patios for your brain\'s comfort.', hints: ['Content here scratches an itch you didn\'t know you had.', 'Perfect fits, perfect swirls, perfect pressure-washing lines.'] },
  { name: 'OldSchoolCool', category: 'photos', blurb: 'Vintage photos proving everyone\'s grandparents were cooler than us.', hints: ['Sepia-toned proof that style existed before filters.', 'Grandparents in leather jackets, parents at woodstock — nostalgia in photo form.'] },
  { name: 'food', category: 'photos', blurb: 'A global buffet of homemade and restaurant dishes, shot lovingly.', hints: ['Come hungry: it\'s plate after plate from kitchens around the world.', 'Everything posted here is technically edible. Mostly.'] },
  { name: 'todayilearned', category: 'knowledge', blurb: 'Surprising facts people just discovered, served daily with a "TIL".', hints: ['Every title starts with a three-letter acronym about learning something new.', 'Fact after fact you\'ll want to repeat at dinner.'] },
  { name: 'science', category: 'knowledge', blurb: 'Peer-reviewed research discussed seriously — anecdotes get removed.', hints: ['Strict, sourced, and fascinated by new research.', 'Comments here must stay on-topic — this community takes its subject seriously.'] },
  { name: 'space', category: 'knowledge', blurb: 'Rockets, planets and the occasional mind-bending photo of a nebula.', hints: ['Look up. That\'s the whole topic.', 'From Mars rovers to JWST images, it\'s all up there.'] },
  { name: 'history', category: 'knowledge', blurb: 'Discussion of the past — everything older than twenty years counts.', hints: ['Its subject is everything that already happened.', 'A rule of thumb here: it only counts if it\'s at least 20 years old.'] },
  { name: 'technology', category: 'knowledge', blurb: 'Gadgets, platforms and policy — where the future gets argued about.', hints: ['News and debate about the stuff that runs our lives.', 'New gadgets, big companies, and fights about regulation.'] },
  { name: 'personalfinance', category: 'knowledge', blurb: 'Budgets, debt and windfalls — strangers help strangers with money.', hints: ['Budgets, emergency funds and "what do I do with this inheritance?"', 'The unofficial motto might be: don\'t touch your 401k.'] },
  { name: 'books', category: 'media', blurb: 'Readers comparing favorites, habits and towering to-be-read piles.', hints: ['A quiet corner for people who still love paper (and e-readers).', 'Discussions about what to read, what you read, and what broke your heart.'] },
  { name: 'movies', category: 'media', blurb: 'Trailers, reviews and endless debates about the silver screen.', hints: ['Opening weekends, Oscar bait, and hot takes welcome.', 'Its subject comes with popcorn.'] },
  { name: 'gaming', category: 'hobbies', blurb: 'Clips, memes and news from every console and PC under the sun.', hints: ['Controllers, keyboards and a million screenshots.', 'The biggest hobby community of its kind on the platform.'] },
  { name: 'DIY', category: 'hobbies', blurb: 'Impressive builds and repairs, documented step by step.', hints: ['Why hire someone when you can spend six weekends doing it yourself?', 'Before-and-after albums of things people built with their own hands.'] },
  { name: 'gardening', category: 'hobbies', blurb: 'Tomatoes, houseplants and the eternal war against pests.', hints: ['Soil, seeds and the joy of a first tomato.', 'Green thumbs share wins and diagnose mysterious leaf spots.'] },
  { name: 'travel', category: 'hobbies', blurb: 'Itineraries, hidden gems and visa questions from around the globe.', hints: ['Passports, backpacks and a lot of itinerary advice.', 'People here are either planning a trip or making you jealous of one.'] },
  { name: 'Showerthoughts', category: 'fun', blurb: 'Tiny philosophical epiphanies, best read while shampooing.', hints: ['These miniature epiphanies famously arrive while washing your hair.', '"If you clean a vacuum, you become the vacuum" — that kind of place.'] },
  { name: 'dataisbeautiful', category: 'fun', blurb: 'Charts and visualizations so good they qualify as art.', hints: ['Numbers, but make it gorgeous.', 'Bar races, heat maps and Sankey diagrams that people actually upvote.'] },
  { name: 'funny', category: 'fun', blurb: 'One of Reddit\'s oldest and biggest homes for jokes and absurdity.', hints: ['One of the oldest and biggest communities on the whole site.', 'Its mission statement is one word: make people laugh.'] },
];

export const POOL_BY_NAME: Record<string, PoolSub> = Object.fromEntries(
  POOL.map((s) => [s.name, s])
);
