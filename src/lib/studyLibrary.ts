export const K8_GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"] as const;
export type LibraryGrade = typeof K8_GRADES[number];

export const LIBRARY_SUBJECTS = [
  "Math",
  "Science",
  "Reading",
  "Grammar",
  "English",
  "Writing",
  "History",
  "Vocabulary",
] as const;
export type LibrarySubject = typeof LIBRARY_SUBJECTS[number];

export type OriginalSet = {
  id: string;
  title: string;
  grade: LibraryGrade;
  gradeBand: "K–2" | "3–5" | "6–8";
  subject: LibrarySubject;
  topic: string;
  summary: string;
  learningGoals: string[];
  standards: string[];
  prerequisites: string[];
  skillTags: string[];
  difficulty: "FOUNDATION" | "CORE" | "EXTENSION";
  estimatedMinutes: number;
  flashcardCount: number;
  questionCount: number;
  readAloud: boolean;
  gradeFocus: string;
  editorialApproach: string;
  source: {
    label: "StudySmart Originals";
    kind: "ORIGINAL";
    license: "StudySmart Original · educator-reviewed blueprint";
  };
};

type Blueprint = {
  subject: LibrarySubject;
  units: Array<{
    topic: string;
    summary: string;
    goals: string[];
    standards: string[];
    prerequisites: string[];
    skills: string[];
  }>;
};

const BLUEPRINTS: Record<"K–2" | "3–5" | "6–8", Blueprint[]> = {
  "K–2": [
    {
      subject: "Math",
      units: [
        { topic: "Counting, Place Value & Operations", summary: "Build a flexible sense of quantity, place value, addition, and subtraction through models and explanations.", goals: ["Represent quantities with objects, drawings, and numerals", "Explain addition and subtraction as joining, separating, and comparing", "Use place value to compose and decompose two-digit numbers"], standards: ["CCSS Math K–2 · Counting & Cardinality", "CCSS Math K–2 · Operations & Algebraic Thinking"], prerequisites: ["One-to-one counting", "Recognizing numerals"], skills: ["quantity", "place value", "addition", "subtraction"] },
        { topic: "Patterns & Early Algebra", summary: "Notice, extend, and explain patterns so learners begin to reason about unknowns and rules.", goals: ["Identify repeating and growing patterns", "Describe a pattern rule in words or pictures", "Find a missing part in a simple equation or story"], standards: ["CCSS Math K–2 · Operations & Algebraic Thinking"], prerequisites: ["Counting to 20", "Comparing quantities"], skills: ["patterns", "reasoning", "unknowns", "equations"] },
        { topic: "Shape, Space & Measurement", summary: "Use attributes, units, and spatial language to describe the world around us.", goals: ["Sort and describe two- and three-dimensional shapes", "Compare length, height, weight, and capacity", "Measure with repeated nonstandard and standard units"], standards: ["CCSS Math K–2 · Geometry", "CCSS Math K–2 · Measurement & Data"], prerequisites: ["Comparing more and less", "Common shape names"], skills: ["attributes", "measurement", "spatial language", "geometry"] },
        { topic: "Data & Story Problems", summary: "Turn observations and everyday situations into tables, graphs, and mathematical explanations.", goals: ["Collect and sort data by a clear question", "Read picture graphs and bar graphs", "Choose an operation and explain a solution"], standards: ["CCSS Math K–2 · Measurement & Data", "CCSS Math K–2 · Mathematical Practices"], prerequisites: ["Counting", "Comparing quantities"], skills: ["data", "graphs", "word problems", "justification"] },
      ],
    },
    {
      subject: "Science",
      units: [
        { topic: "Living Things & Needs", summary: "Observe living things and explain how structures and behaviors help them survive.", goals: ["Sort living and nonliving things using evidence", "Describe what plants and animals need", "Connect a body part or behavior to a function"], standards: ["NGSS K–2 · Life Science"], prerequisites: ["Careful observation", "Using because to explain"], skills: ["observation", "needs", "structures", "evidence"] },
        { topic: "Weather, Sky & Seasonal Patterns", summary: "Use repeated observations to describe weather, seasons, and patterns in the sky.", goals: ["Record weather observations with words or symbols", "Compare seasonal patterns", "Explain how weather affects choices and living things"], standards: ["NGSS K–2 · Earth & Space Science"], prerequisites: ["Sorting by observable features"], skills: ["weather", "seasons", "patterns", "measurement"] },
        { topic: "Matter, Materials & Motion", summary: "Investigate material properties and how pushes and pulls change motion.", goals: ["Describe materials by observable properties", "Choose a material for a purpose and defend the choice", "Predict how a push or pull will affect an object"], standards: ["NGSS K–2 · Physical Science"], prerequisites: ["Describing observations", "Comparing objects"], skills: ["properties", "materials", "forces", "prediction"] },
        { topic: "Earth, Land & Resources", summary: "Explore land, water, and natural resources while practicing care for the local environment.", goals: ["Identify land and water features", "Describe how wind and water can change a place", "Propose one way to conserve a resource"], standards: ["NGSS K–2 · Earth & Space Science", "NGSS K–2 · Engineering Design"], prerequisites: ["Local place vocabulary"], skills: ["landforms", "resources", "change", "design"] },
      ],
    },
    {
      subject: "Reading",
      units: [
        { topic: "Phonics, Word Work & Fluency", summary: "Build accurate, expressive reading by connecting sounds, letters, syllables, and high-frequency patterns.", goals: ["Blend and segment sounds in increasingly complex words", "Use spelling patterns to decode unfamiliar words", "Reread to improve accuracy, phrasing, and expression"], standards: ["CCSS ELA K–2 · Foundational Skills"], prerequisites: ["Letter-sound knowledge", "Oral language"], skills: ["phonemic awareness", "decoding", "fluency", "word recognition"] },
        { topic: "Story Structure & Character Thinking", summary: "Use story elements and evidence to explain what characters want, do, and learn.", goals: ["Retell a story in a logical sequence", "Describe characters using actions and details", "Explain how a problem changes across the story"], standards: ["CCSS ELA K–2 · Literature"], prerequisites: ["Listening comprehension", "Sequence words"], skills: ["retelling", "characters", "sequence", "evidence"] },
        { topic: "Main Idea & Informational Text", summary: "Read to learn by finding key details, asking questions, and explaining the main idea.", goals: ["Ask and answer questions about a text", "Name the main topic and supporting details", "Use headings, captions, and diagrams to locate information"], standards: ["CCSS ELA K–2 · Informational Text"], prerequisites: ["Topic vocabulary", "Picture-to-word connections"], skills: ["main idea", "details", "text features", "questions"] },
        { topic: "Compare, Connect & Explain", summary: "Make thoughtful connections across stories and texts using clear evidence and language.", goals: ["Compare two texts on a shared topic", "Connect an event to a personal or community experience", "Explain an idea with a complete sentence and evidence"], standards: ["CCSS ELA K–2 · Reading Comprehension"], prerequisites: ["Retelling", "Finding details"], skills: ["compare", "connect", "explain", "evidence"] },
      ],
    },
    {
      subject: "Grammar",
      units: [
        { topic: "Complete Sentences & Word Jobs", summary: "Build complete thoughts and notice the jobs words do in a sentence.", goals: ["Tell a complete thought from a word group", "Name nouns and verbs in a simple sentence", "Add a describing word to make meaning clearer"], standards: ["CCSS ELA K–2 · Language"], prerequisites: ["Oral sentence practice", "Recognize common words"], skills: ["sentences", "nouns", "verbs", "describing words"] },
        { topic: "Capitals, Spaces & End Marks", summary: "Use print conventions that help a reader know where a sentence starts, pauses, and ends.", goals: ["Use a capital at the start of a sentence", "Leave spaces between words", "Choose a period, question mark, or exclamation mark"], standards: ["CCSS ELA K–2 · Language & Conventions"], prerequisites: ["Letter formation", "Sentence meaning"], skills: ["capitalization", "spacing", "punctuation", "editing"] },
        { topic: "Nouns, Verbs & Describing Words", summary: "Choose precise words for people, places, things, actions, and qualities.", goals: ["Sort common nouns and verbs", "Match an action word to a subject", "Choose a describing word that fits a noun"], standards: ["CCSS ELA K–2 · Parts of Speech"], prerequisites: ["Complete sentences", "Oral vocabulary"], skills: ["nouns", "verbs", "adjectives", "word choice"] },
        { topic: "Questions, Commands & Joining Ideas", summary: "Use sentence types and joining words to communicate a complete idea.", goals: ["Recognize a statement, question, and command", "Use because or and to join two ideas", "Reread a sentence to check its meaning"], standards: ["CCSS ELA K–2 · Language & Syntax"], prerequisites: ["End punctuation", "Complete thoughts"], skills: ["sentence types", "conjunctions", "syntax", "revision"] },
      ],
    },
    {
      subject: "English",
      units: [
        { topic: "Listening & Speaking Clearly", summary: "Listen for meaning and share ideas with clear words, turns, and voice.", goals: ["Follow and give a short set of directions", "Ask a question that matches the topic", "Speak in a complete sentence and take turns"], standards: ["CCSS ELA K–2 · Speaking & Listening"], prerequisites: ["Oral language", "Conversation turns"], skills: ["listening", "speaking", "questions", "conversation"] },
        { topic: "Read-Aloud Thinking", summary: "Use read-alouds, pictures, and talk to make meaning before independent reading is fluent.", goals: ["Retell the important parts of a read-aloud", "Use a picture or detail to explain an idea", "Ask and answer a who, what, where, or why question"], standards: ["CCSS ELA K–2 · Literature & Informational Text"], prerequisites: ["Listening comprehension", "Story sequence"], skills: ["read-aloud", "retelling", "questions", "details"] },
        { topic: "Words for Learning", summary: "Use school words for time, place, cause, comparison, and explanation.", goals: ["Use first, next, and last to explain steps", "Compare two ideas with same and different", "Explain a new word with a picture or example"], standards: ["CCSS ELA K–2 · Academic Language"], prerequisites: ["Everyday vocabulary", "Oral sentence practice"], skills: ["sequence", "compare", "explain", "academic language"] },
        { topic: "Tell, Show & Present", summary: "Plan a short story or explanation and share it with a listener.", goals: ["Choose a topic and name the important parts", "Use a picture, object, or gesture to support meaning", "Speak loudly enough and respond to one listener question"], standards: ["CCSS ELA K–2 · Speaking & Presentation"], prerequisites: ["Complete sentences", "Retelling"], skills: ["presentation", "organization", "details", "audience"] },
      ],
    },
    {
      subject: "Writing",
      units: [
        { topic: "Sentence Builders & Conventions", summary: "Write complete sentences and use punctuation, capitalization, and spacing to help readers.", goals: ["Build complete thoughts with a subject and action", "Use capitals and end punctuation consistently", "Reread and revise for clarity"], standards: ["CCSS ELA K–2 · Language", "CCSS ELA K–2 · Writing"], prerequisites: ["Oral sentence practice", "Letter formation or keyboard familiarity"], skills: ["sentences", "punctuation", "capitalization", "revision"] },
        { topic: "Narrative Storytelling", summary: "Plan and tell a small story with a beginning, meaningful event, and ending.", goals: ["Choose a focused event", "Use temporal words to guide the reader", "Add details about actions, thoughts, and feelings"], standards: ["CCSS ELA K–2 · Narrative Writing"], prerequisites: ["Story sequence", "Basic sentence construction"], skills: ["planning", "sequence", "details", "narrative"] },
        { topic: "Informative Writing", summary: "Teach a reader about a familiar topic with facts, labels, and clear organization.", goals: ["Name a topic and group related facts", "Use topic-specific words", "Add a picture, label, or example that clarifies an idea"], standards: ["CCSS ELA K–2 · Informative Writing"], prerequisites: ["Main idea and details", "Sorting information"], skills: ["facts", "organization", "domain words", "explanation"] },
        { topic: "Opinion & Evidence", summary: "State an opinion, give a reason, and respond respectfully to another idea.", goals: ["State a clear preference or claim", "Support a claim with a reason or example", "Use linking words such as because and also"], standards: ["CCSS ELA K–2 · Opinion Writing"], prerequisites: ["Comparing choices", "Complete sentences"], skills: ["claim", "reason", "example", "revision"] },
      ],
    },
    {
      subject: "History",
      units: [
        { topic: "My Community & Its Helpers", summary: "Understand how people, places, and shared responsibilities shape a community.", goals: ["Identify community roles and services", "Explain how rules help people work together", "Use a simple map to locate familiar places"], standards: ["C3 Framework K–2 · Civic Engagement", "C3 Framework K–2 · Geography"], prerequisites: ["Place vocabulary", "Following a sequence"], skills: ["community", "rules", "maps", "responsibility"] },
        { topic: "Then & Now", summary: "Use photographs, objects, and stories to compare daily life across time.", goals: ["Sort evidence as past or present", "Describe one change and one continuity", "Ask a question about a historical object"], standards: ["C3 Framework K–2 · Historical Sources"], prerequisites: ["Before/after language", "Observation"], skills: ["time", "change", "sources", "questions"] },
        { topic: "Families, Stories & Traditions", summary: "Learn how family and community stories preserve identity while respecting differences.", goals: ["Distinguish a memory, artifact, and record", "Compare traditions without ranking them", "Explain why people preserve stories"], standards: ["C3 Framework K–2 · History & Culture"], prerequisites: ["Respectful discussion", "Compare and contrast"], skills: ["traditions", "perspective", "sources", "culture"] },
        { topic: "Needs, Wants & Fair Choices", summary: "Explore how people make choices with limited resources and shared rules.", goals: ["Distinguish needs from wants", "Explain a simple trade-off", "Practice listening and fairness in a group decision"], standards: ["C3 Framework K–2 · Economics", "C3 Framework K–2 · Civics"], prerequisites: ["Sorting categories", "Community rules"], skills: ["needs", "wants", "trade-offs", "fairness"] },
      ],
    },
    {
      subject: "Vocabulary",
      units: [
        { topic: "Words for Thinking & Talking", summary: "Grow precise everyday language for asking, explaining, comparing, and reasoning.", goals: ["Use new words in an oral sentence", "Notice shades of meaning", "Choose a word that matches the situation"], standards: ["CCSS ELA K–2 · Language & Vocabulary"], prerequisites: ["Oral language", "Picture and context clues"], skills: ["meaning", "context", "speaking", "precision"] },
        { topic: "Word Parts & Families", summary: "Use common roots, endings, and word families to unlock new words.", goals: ["Recognize related words", "Use a familiar word to infer a new word", "Explain how an ending changes meaning"], standards: ["CCSS ELA K–2 · Phonics & Word Analysis"], prerequisites: ["Letter-sound knowledge", "Common word families"], skills: ["word families", "morphology", "meaning", "decoding"] },
        { topic: "School & Science Words", summary: "Build the language needed to describe observations, steps, and explanations.", goals: ["Use sequence and comparison words", "Sort words by meaning or function", "Explain a new word with an example"], standards: ["CCSS ELA K–2 · Academic Language"], prerequisites: ["Everyday category words"], skills: ["academic language", "categories", "examples", "sequence"] },
        { topic: "Feelings, Choices & Perspective", summary: "Use precise words to describe feelings, choices, viewpoints, and respectful disagreement.", goals: ["Distinguish similar feeling words", "Describe a choice without labeling a person", "Use sentence frames for agreement and disagreement"], standards: ["CCSS ELA K–2 · Language & Speaking"], prerequisites: ["Basic emotion vocabulary"], skills: ["feelings", "perspective", "self-expression", "discussion"] },
      ],
    },
  ],
  "3–5": [
    {
      subject: "Math",
      units: [
        { topic: "Multiplication, Division & Place Value", summary: "Connect models, equations, and strategies to solve multi-step whole-number problems.", goals: ["Use place value and properties to calculate efficiently", "Explain the relationship between multiplication and division", "Check a solution with estimation or an inverse operation"], standards: ["CCSS Math 3–5 · Operations & Base Ten"], prerequisites: ["Multiplication facts", "Place-value reasoning"], skills: ["multi-digit operations", "division", "estimation", "reasoning"] },
        { topic: "Fractions, Decimals & Equivalence", summary: "Treat fractions and decimals as numbers that can be compared, composed, and used in context.", goals: ["Represent fractions on a number line", "Compare and generate equivalent fractions", "Connect tenths and hundredths to decimal notation"], standards: ["CCSS Math 3–5 · Number & Operations—Fractions"], prerequisites: ["Unit fractions", "Whole-number operations"], skills: ["fractions", "equivalence", "decimals", "number lines"] },
        { topic: "Geometry, Area & Volume", summary: "Use attributes and formulas to reason about two- and three-dimensional space.", goals: ["Classify shapes using defining attributes", "Find area and perimeter and explain the difference", "Build and decompose rectangular prisms"], standards: ["CCSS Math 3–5 · Geometry", "CCSS Math 3–5 · Measurement"], prerequisites: ["Multiplication", "Length measurement"], skills: ["attributes", "area", "perimeter", "volume"] },
        { topic: "Data, Patterns & Multi-Step Problems", summary: "Choose representations and strategies that make complex problems visible and solvable.", goals: ["Read and create line plots and scaled graphs", "Identify a pattern and state its rule", "Plan, solve, and justify a multi-step problem"], standards: ["CCSS Math 3–5 · Measurement & Data", "CCSS Math 3–5 · Mathematical Practices"], prerequisites: ["Four operations", "Reading tables"], skills: ["data", "patterns", "modeling", "justification"] },
      ],
    },
    {
      subject: "Science",
      units: [
        { topic: "Matter, Mixtures & Energy", summary: "Use evidence to explain properties, changes, and energy transfer in familiar systems.", goals: ["Compare properties before and after a change", "Distinguish a mixture from a new substance", "Trace energy through a simple system"], standards: ["NGSS 3–5 · Physical Science"], prerequisites: ["Measurement", "Evidence statements"], skills: ["matter", "energy", "systems", "evidence"] },
        { topic: "Ecosystems & Adaptations", summary: "Model how organisms depend on one another and how traits support survival.", goals: ["Describe roles in a food web", "Connect an adaptation to an environment", "Explain how a change can affect a system"], standards: ["NGSS 3–5 · Life Science"], prerequisites: ["Needs of living things", "Cause and effect"], skills: ["ecosystems", "adaptations", "food webs", "systems"] },
        { topic: "Earth Processes & Resources", summary: "Investigate patterns in weather, landforms, water, and the use of Earth’s resources.", goals: ["Model a repeating Earth process", "Use data to describe weather or climate patterns", "Evaluate a way to reduce resource impact"], standards: ["NGSS 3–5 · Earth & Space Science"], prerequisites: ["Graph reading", "Observation over time"], skills: ["cycles", "weather", "resources", "models"] },
        { topic: "Engineering Design & Evidence", summary: "Define a problem, compare solutions, and improve a design using fair tests.", goals: ["Identify criteria and constraints", "Plan a fair test", "Use test results to revise a solution"], standards: ["NGSS 3–5 · Engineering Design"], prerequisites: ["Measurement", "Cause and effect"], skills: ["design", "criteria", "constraints", "iteration"] },
      ],
    },
    {
      subject: "Reading",
      units: [
        { topic: "Main Idea, Theme & Evidence", summary: "Move beyond retelling by explaining what a text means and how details support it.", goals: ["State a main idea or theme", "Select details that support an interpretation", "Summarize without adding unrelated opinions"], standards: ["CCSS ELA 3–5 · Literature & Informational Text"], prerequisites: ["Literal comprehension", "Paragraph structure"], skills: ["theme", "main idea", "evidence", "summary"] },
        { topic: "Text Structure & Author Choices", summary: "Recognize how authors organize information and use language for a purpose.", goals: ["Identify a text structure", "Explain how a feature supports understanding", "Describe how word choice shapes tone"], standards: ["CCSS ELA 3–5 · Informational Text & Language"], prerequisites: ["Main idea and details", "Vocabulary in context"], skills: ["structure", "text features", "tone", "purpose"] },
        { topic: "Characters, Point of View & Theme", summary: "Analyze how characters, settings, and points of view develop a story’s meaning.", goals: ["Explain a character’s change with evidence", "Compare first- and third-person points of view", "Connect a repeated idea to a theme"], standards: ["CCSS ELA 3–5 · Literature"], prerequisites: ["Story elements", "Evidence sentences"], skills: ["character", "point of view", "theme", "analysis"] },
        { topic: "Research, Sources & Synthesis", summary: "Gather information from multiple sources and combine it into a clear understanding.", goals: ["Ask a focused research question", "Separate a source’s fact from an inference", "Synthesize information without copying"], standards: ["CCSS ELA 3–5 · Research to Build Knowledge"], prerequisites: ["Main idea", "Note-taking"], skills: ["research", "sources", "synthesis", "paraphrase"] },
      ],
    },
    {
      subject: "Grammar",
      units: [
        { topic: "Parts of Speech in Context", summary: "Use the job a word performs in a sentence to make meaning precise.", goals: ["Identify nouns, pronouns, verbs, adjectives, and adverbs in context", "Explain how a word’s job affects a sentence", "Replace a vague word with a precise choice"], standards: ["CCSS ELA 3–5 · Language"], prerequisites: ["Complete sentences", "Basic word classes"], skills: ["parts of speech", "syntax", "precision", "editing"] },
        { topic: "Verb Tense & Agreement", summary: "Keep time and subject relationships clear when writing and speaking.", goals: ["Maintain consistent verb tense", "Match a subject and verb", "Revise a sentence when the time or subject changes"], standards: ["CCSS ELA 3–5 · Language & Conventions"], prerequisites: ["Sentence parts", "Common verb forms"], skills: ["verb tense", "agreement", "revision", "clarity"] },
        { topic: "Compound & Complex Sentences", summary: "Join ideas with conjunctions and clauses so relationships are clear.", goals: ["Join related ideas with coordinating conjunctions", "Recognize a dependent clause", "Choose a sentence structure that fits the relationship"], standards: ["CCSS ELA 3–5 · Syntax"], prerequisites: ["Complete sentences", "Conjunctions"], skills: ["clauses", "conjunctions", "sentence variety", "relationships"] },
        { topic: "Punctuation & Editing", summary: "Use commas, quotation marks, apostrophes, and paragraph breaks to guide readers.", goals: ["Use commas in a series and after an introduction", "Punctuate dialogue and quotations", "Edit a paragraph for conventions and meaning"], standards: ["CCSS ELA 3–5 · Language & Conventions"], prerequisites: ["End punctuation", "Paragraph structure"], skills: ["commas", "dialogue", "apostrophes", "editing"] },
      ],
    },
    {
      subject: "English",
      units: [
        { topic: "Discussion & Presentation", summary: "Build on ideas, ask useful questions, and present information in a logical order.", goals: ["Refer to a text or source during discussion", "Ask a follow-up question that moves thinking forward", "Organize a short presentation with an opening and closing"], standards: ["CCSS ELA 3–5 · Speaking & Listening"], prerequisites: ["Complete sentences", "Main idea and details"], skills: ["discussion", "questions", "presentation", "organization"] },
        { topic: "Literature Talk & Interpretation", summary: "Use specific details from stories, poems, and plays to explain an interpretation.", goals: ["Support an idea about a character or theme with details", "Compare how two texts treat a similar idea", "Respond to another interpretation respectfully"], standards: ["CCSS ELA 3–5 · Literature & Speaking"], prerequisites: ["Evidence sentences", "Story elements"], skills: ["interpretation", "discussion", "comparison", "evidence"] },
        { topic: "Research & Source Use", summary: "Ask questions, take notes, and communicate what sources actually show.", goals: ["Turn a broad topic into a research question", "Group notes by idea rather than by website", "Paraphrase a source and record where it came from"], standards: ["CCSS ELA 3–5 · Research to Build Knowledge"], prerequisites: ["Main idea", "Note-taking"], skills: ["research", "notes", "paraphrase", "sources"] },
        { topic: "Clear Communication & Revision", summary: "Make writing and speech easier to follow by checking purpose, audience, and organization.", goals: ["Name the purpose and audience for a message", "Choose details that support the purpose", "Revise for clarity after reader or listener feedback"], standards: ["CCSS ELA 3–5 · Writing & Speaking"], prerequisites: ["Paragraph organization", "Sentence conventions"], skills: ["audience", "purpose", "clarity", "revision"] },
      ],
    },
    {
      subject: "Writing",
      units: [
        { topic: "Paragraphs, Organization & Elaboration", summary: "Build focused paragraphs with a clear idea, logical order, and meaningful details.", goals: ["Write a topic sentence that matches the paragraph", "Group details logically", "Elaborate with examples, reasons, and precise language"], standards: ["CCSS ELA 3–5 · Writing & Language"], prerequisites: ["Complete sentences", "Main idea"], skills: ["paragraphs", "organization", "elaboration", "transitions"] },
        { topic: "Narrative Craft & Dialogue", summary: "Use pacing, description, and dialogue to make a narrative feel intentional and vivid.", goals: ["Zoom in on a meaningful moment", "Use sensory details and precise verbs", "Format dialogue and show character through action"], standards: ["CCSS ELA 3–5 · Narrative Writing"], prerequisites: ["Story sequence", "Sentence conventions"], skills: ["narrative", "pacing", "dialogue", "description"] },
        { topic: "Informative Explanations", summary: "Teach a reader about a topic by grouping facts, defining terms, and using helpful structures.", goals: ["Introduce a topic clearly", "Use definitions, examples, and categories", "Link ideas with precise transitions"], standards: ["CCSS ELA 3–5 · Informative Writing"], prerequisites: ["Research notes", "Paragraph structure"], skills: ["explanation", "definitions", "facts", "cohesion"] },
        { topic: "Opinion, Reasons & Sources", summary: "Develop an opinion with reasons, evidence, and a respectful response to another position.", goals: ["State a precise claim", "Choose relevant evidence", "Acknowledge a different view and respond"], standards: ["CCSS ELA 3–5 · Opinion Writing"], prerequisites: ["Evidence selection", "Paragraph organization"], skills: ["claim", "reasons", "evidence", "counterpoint"] },
      ],
    },
    {
      subject: "History",
      units: [
        { topic: "Local History & Primary Sources", summary: "Ask historical questions and use objects, images, maps, and records as evidence.", goals: ["Distinguish primary and secondary sources", "Place an event on a timeline", "Explain what a source can and cannot tell us"], standards: ["C3 Framework 3–5 · Historical Sources & Evidence"], prerequisites: ["Chronology", "Main idea"], skills: ["sources", "chronology", "perspective", "evidence"] },
        { topic: "Geography, Regions & Human-Environment Interaction", summary: "Explain how geography shapes settlement, movement, resources, and community decisions.", goals: ["Use maps and geographic tools", "Compare how people adapt to environments", "Explain a human impact and possible response"], standards: ["C3 Framework 3–5 · Geography"], prerequisites: ["Map symbols", "Cause and effect"], skills: ["regions", "maps", "adaptation", "impact"] },
        { topic: "Civic Ideas & Local Government", summary: "Explore how communities make decisions, resolve conflicts, and protect shared rights.", goals: ["Describe a local government responsibility", "Compare a rule, law, and right", "Use evidence to propose a community improvement"], standards: ["C3 Framework 3–5 · Civics"], prerequisites: ["Community roles", "Opinion and evidence"], skills: ["civics", "rights", "government", "participation"] },
        { topic: "Trade, Resources & Innovation", summary: "Trace how resources, trade, and new ideas change communities over time.", goals: ["Explain a simple supply-and-demand relationship", "Map the movement of a good or idea", "Evaluate who benefits and who faces a cost"], standards: ["C3 Framework 3–5 · Economics & History"], prerequisites: ["Needs, wants, and trade-offs", "Maps"], skills: ["trade", "resources", "innovation", "consequences"] },
      ],
    },
    {
      subject: "Vocabulary",
      units: [
        { topic: "Academic Words for Reasoning", summary: "Use high-utility words for comparing, explaining, analyzing, and supporting a claim.", goals: ["Infer meaning from context and word parts", "Use a word accurately in speaking and writing", "Distinguish near-synonyms by strength and purpose"], standards: ["CCSS ELA 3–5 · Vocabulary Acquisition & Use"], prerequisites: ["Context clues", "Complete paragraphs"], skills: ["academic vocabulary", "context", "nuance", "precision"] },
        { topic: "Roots, Prefixes & Suffixes", summary: "Use morphology to unlock unfamiliar words across subjects.", goals: ["Identify a common Greek or Latin root", "Predict how a prefix or suffix changes meaning", "Verify an inference with a glossary or dictionary"], standards: ["CCSS ELA 3–5 · Word Analysis"], prerequisites: ["Word families", "Alphabetical order"], skills: ["morphology", "roots", "affixes", "verification"] },
        { topic: "Science & Social Studies Language", summary: "Master domain-specific words by connecting definitions, examples, visuals, and systems.", goals: ["Define a domain word in student-friendly language", "Use a model or example to clarify meaning", "Group related terms into a concept network"], standards: ["CCSS ELA 3–5 · Domain-Specific Vocabulary"], prerequisites: ["Academic words", "Main idea"], skills: ["domain language", "concept maps", "definitions", "examples"] },
        { topic: "Figurative Language & Tone", summary: "Interpret comparisons and word choices that create tone, emphasis, or humor.", goals: ["Distinguish literal and figurative meaning", "Explain the effect of a comparison", "Choose words that create a desired tone"], standards: ["CCSS ELA 3–5 · Language"], prerequisites: ["Literal comprehension", "Emotion vocabulary"], skills: ["figurative language", "tone", "imagery", "word choice"] },
      ],
    },
  ],
  "6–8": [
    {
      subject: "Math",
      units: [
        { topic: "Ratios, Rates & Proportional Reasoning", summary: "Use equivalent ratios, rates, and representations to model real-world relationships.", goals: ["Represent a ratio in multiple forms", "Solve unit-rate and percent problems", "Explain whether a relationship is proportional"], standards: ["CCSS Math 6–7 · Ratios & Proportional Relationships"], prerequisites: ["Fractions and decimals", "Coordinate plane basics"], skills: ["ratios", "rates", "percent", "proportions"] },
        { topic: "Expressions, Equations & Functions", summary: "Represent unknown quantities symbolically and explain how equations model situations.", goals: ["Translate a situation into an expression or equation", "Solve multi-step equations and check solutions", "Describe a relationship with a table, graph, or rule"], standards: ["CCSS Math 6–8 · Expressions & Equations", "CCSS Math 8 · Functions"], prerequisites: ["Integer operations", "Order of operations"], skills: ["algebra", "equations", "functions", "modeling"] },
        { topic: "Geometry, Transformations & Measurement", summary: "Use transformations, similarity, and formulas to reason about shape and space.", goals: ["Describe a transformation precisely", "Use similarity or the Pythagorean relationship", "Choose and justify a measurement formula"], standards: ["CCSS Math 6–8 · Geometry"], prerequisites: ["Coordinate plane", "Area and volume"], skills: ["transformations", "similarity", "geometry", "formulas"] },
        { topic: "Statistics, Probability & Data Claims", summary: "Analyze distributions and probability while questioning whether a data claim is justified.", goals: ["Describe center and variability", "Compare distributions with appropriate displays", "Explain how sample size and bias affect a claim"], standards: ["CCSS Math 6–8 · Statistics & Probability"], prerequisites: ["Fractions and decimals", "Graph interpretation"], skills: ["statistics", "probability", "variability", "data claims"] },
      ],
    },
    {
      subject: "Science",
      units: [
        { topic: "Cells, Body Systems & Organization", summary: "Explain how structures at different scales work together in living systems.", goals: ["Compare plant and animal cell structures", "Connect structure to function", "Model interactions among body systems"], standards: ["NGSS 6–8 · Life Science"], prerequisites: ["Living things and needs", "Evidence-based models"], skills: ["cells", "systems", "structure-function", "models"] },
        { topic: "Energy, Matter & Chemical Reactions", summary: "Track matter and energy through physical and chemical changes.", goals: ["Distinguish physical and chemical changes", "Use particle models to explain observations", "Apply conservation of matter and energy"], standards: ["NGSS 6–8 · Physical Science"], prerequisites: ["Properties of matter", "Measurement"], skills: ["reactions", "particles", "conservation", "energy"] },
        { topic: "Earth Systems, Climate & Human Impact", summary: "Use evidence and models to explain Earth-system interactions and climate patterns.", goals: ["Connect geosphere, hydrosphere, atmosphere, and biosphere", "Interpret climate data and patterns", "Evaluate mitigation or adaptation choices"], standards: ["NGSS 6–8 · Earth & Space Science"], prerequisites: ["Cycles and systems", "Graph interpretation"], skills: ["Earth systems", "climate", "data", "human impact"] },
        { topic: "Forces, Waves & Engineering Solutions", summary: "Model forces and waves, then use constraints and evidence to improve a design.", goals: ["Represent balanced and unbalanced forces", "Describe wave properties and information transfer", "Optimize a design using test data"], standards: ["NGSS 6–8 · Physical Science", "NGSS 6–8 · Engineering Design"], prerequisites: ["Forces and motion", "Ratios and graphs"], skills: ["forces", "waves", "engineering", "optimization"] },
      ],
    },
    {
      subject: "Reading",
      units: [
        { topic: "Argument, Evidence & Reasoning", summary: "Evaluate claims by tracing evidence, reasoning, and the limits of a source.", goals: ["Identify a claim and supporting evidence", "Distinguish relevant evidence from a weak connection", "Explain how reasoning links evidence to a claim"], standards: ["CCSS ELA 6–8 · Reading Informational Text"], prerequisites: ["Main idea", "Source and evidence basics"], skills: ["argument", "evidence", "reasoning", "evaluation"] },
        { topic: "Theme, Character & Author Craft", summary: "Analyze how authors develop complex ideas through structure, language, and point of view.", goals: ["Trace a theme across scenes or sections", "Analyze a character’s conflicting motivations", "Explain how a craft choice affects meaning"], standards: ["CCSS ELA 6–8 · Literature"], prerequisites: ["Character and theme", "Evidence paragraphs"], skills: ["theme", "character", "craft", "analysis"] },
        { topic: "Source Reliability & Media Literacy", summary: "Read laterally and evaluate credibility, perspective, evidence, and purpose.", goals: ["Identify an author’s purpose and perspective", "Compare how sources frame the same event", "Use corroboration to test a claim"], standards: ["CCSS ELA 6–8 · Research & Media Literacy"], prerequisites: ["Primary and secondary sources", "Argument basics"], skills: ["credibility", "perspective", "corroboration", "media literacy"] },
        { topic: "Complex Text & Synthesis", summary: "Synthesize ideas across challenging texts while preserving nuance and source boundaries.", goals: ["Track a text’s central idea across sections", "Paraphrase accurately", "Synthesize multiple sources into a defensible conclusion"], standards: ["CCSS ELA 6–8 · Reading & Research"], prerequisites: ["Annotation", "Evidence selection"], skills: ["synthesis", "paraphrase", "nuance", "conclusion"] },
      ],
    },
    {
      subject: "Grammar",
      units: [
        { topic: "Sentence Structure & Clauses", summary: "Analyze how clauses and phrases work together to control meaning, emphasis, and flow.", goals: ["Identify independent and dependent clauses", "Use sentence structures that show logical relationships", "Repair fragments, run-ons, and unclear joins"], standards: ["CCSS ELA 6–8 · Language & Syntax"], prerequisites: ["Complete sentences", "Compound and complex sentences"], skills: ["clauses", "syntax", "sentence boundaries", "revision"] },
        { topic: "Verbals, Voice & Mood", summary: "Choose verb forms and sentence voice that make time, agency, and purpose clear.", goals: ["Use verbals and phrases without dangling modifiers", "Compare active and passive voice", "Choose a mood that fits the speaker’s purpose"], standards: ["CCSS ELA 6–8 · Language"], prerequisites: ["Verb tense and agreement", "Parts of speech"], skills: ["verbals", "voice", "mood", "style"] },
        { topic: "Punctuation, Syntax & Style", summary: "Use punctuation and sentence design to signal relationships and create deliberate emphasis.", goals: ["Use semicolons, colons, dashes, and parentheses accurately", "Explain how punctuation changes a reading", "Revise sentence patterns for rhythm and emphasis"], standards: ["CCSS ELA 6–8 · Language & Conventions"], prerequisites: ["Clause structure", "Comma rules"], skills: ["punctuation", "syntax", "style", "emphasis"] },
        { topic: "Editing for Precision & Cohesion", summary: "Edit at the word, sentence, and paragraph levels so ideas remain accurate and connected.", goals: ["Replace vague or repetitive language", "Check pronoun reference and modifier placement", "Edit transitions and sentence patterns for cohesion"], standards: ["CCSS ELA 6–8 · Language & Writing"], prerequisites: ["Sentence analysis", "Paragraph cohesion"], skills: ["precision", "cohesion", "editing", "revision"] },
      ],
    },
    {
      subject: "English",
      units: [
        { topic: "Literature, Rhetoric & Interpretation", summary: "Read closely across genres and explain how language, structure, and context shape meaning.", goals: ["Develop an interpretation with precise textual evidence", "Analyze rhetorical choices and their effects", "Distinguish an author’s claim from a reader’s inference"], standards: ["CCSS ELA 6–8 · Literature & Informational Text"], prerequisites: ["Evidence and reasoning", "Author craft"], skills: ["close reading", "rhetoric", "interpretation", "inference"] },
        { topic: "Speaking, Listening & Academic Discussion", summary: "Participate in discussions that test ideas, represent evidence accurately, and make room for other speakers.", goals: ["Build on or challenge an idea with evidence", "Summarize another speaker’s point before responding", "Adjust tone, pace, and detail for an audience"], standards: ["CCSS ELA 6–8 · Speaking & Listening"], prerequisites: ["Evidence paragraphs", "Discussion norms"], skills: ["discussion", "listening", "evidence", "audience"] },
        { topic: "Research, Citation & Digital Communication", summary: "Research responsibly, track sources, and communicate findings across digital and print formats.", goals: ["Refine a research question through source reading", "Cite and paraphrase without losing the source’s meaning", "Choose a format and design that fit an audience"], standards: ["CCSS ELA 6–8 · Research & Media Literacy"], prerequisites: ["Source reliability", "Paraphrase and synthesis"], skills: ["research", "citation", "digital literacy", "communication"] },
        { topic: "Academic Communication & Presentation", summary: "Plan, deliver, and revise explanations and arguments for real audiences and purposes.", goals: ["Sequence an explanation or argument for a listener", "Use visuals or examples without replacing reasoning", "Use feedback to revise delivery and content"], standards: ["CCSS ELA 6–8 · Speaking, Writing & Presentation"], prerequisites: ["Organization", "Audience and purpose"], skills: ["presentation", "argument", "visuals", "revision"] },
      ],
    },
    {
      subject: "Writing",
      units: [
        { topic: "Argument Writing & Counterclaims", summary: "Build a defensible argument with precise claims, evidence, reasoning, and a fair counterclaim.", goals: ["Narrow a claim to a debatable question", "Integrate evidence with explanation", "Address a counterclaim without misrepresenting it"], standards: ["CCSS ELA 6–8 · Argument Writing"], prerequisites: ["Argument reading", "Paragraph cohesion"], skills: ["claim", "evidence", "reasoning", "counterclaim"] },
        { topic: "Informative Structure & Synthesis", summary: "Organize complex information so readers can follow relationships among ideas.", goals: ["Choose a structure that fits the purpose", "Integrate definitions, examples, and comparisons", "Maintain source boundaries while synthesizing"], standards: ["CCSS ELA 6–8 · Informative Writing"], prerequisites: ["Research and paraphrase", "Transitions"], skills: ["organization", "synthesis", "cohesion", "source use"] },
        { topic: "Narrative Voice & Revision", summary: "Use deliberate voice, pacing, and structure to create a meaningful narrative experience.", goals: ["Control point of view and narrative distance", "Vary pacing to emphasize a turning point", "Revise for voice, precision, and impact"], standards: ["CCSS ELA 6–8 · Narrative Writing"], prerequisites: ["Narrative craft", "Sentence variety"], skills: ["voice", "pacing", "point of view", "revision"] },
        { topic: "Research Writing & Citation", summary: "Plan and communicate a research answer with credible sources and responsible attribution.", goals: ["Develop a focused research question", "Evaluate and record source information", "Use quotation, paraphrase, and citation responsibly"], standards: ["CCSS ELA 6–8 · Research to Build Knowledge"], prerequisites: ["Source reliability", "Synthesis"], skills: ["research", "citation", "paraphrase", "documentation"] },
      ],
    },
    {
      subject: "History",
      units: [
        { topic: "Historical Thinking & Evidence", summary: "Use sourcing, contextualization, corroboration, and chronology to make defensible historical claims.", goals: ["Question who created a source and why", "Place evidence in historical context", "Corroborate two accounts and explain differences"], standards: ["C3 Framework 6–8 · Historical Sources & Evidence"], prerequisites: ["Primary and secondary sources", "Argument basics"], skills: ["sourcing", "context", "corroboration", "chronology"] },
        { topic: "Civics, Rights & Institutions", summary: "Analyze how institutions, rights, responsibilities, and civic action shape public life.", goals: ["Compare roles of civic institutions", "Use evidence to explain a rights conflict", "Evaluate a civic action and its likely effects"], standards: ["C3 Framework 6–8 · Civics"], prerequisites: ["Rules, laws, and rights", "Evidence writing"], skills: ["institutions", "rights", "civic action", "perspective"] },
        { topic: "Migration, Exchange & Cultural Change", summary: "Trace how movement, exchange, and power reshape communities and identities.", goals: ["Map causes and effects of migration", "Compare perspectives on cultural exchange", "Distinguish voluntary and forced movement"], standards: ["C3 Framework 6–8 · Geography & History"], prerequisites: ["Maps and regions", "Cause and effect"], skills: ["migration", "exchange", "culture", "causation"] },
        { topic: "Economics, Technology & Systems", summary: "Explain how incentives, resources, technology, and policy interact across historical systems.", goals: ["Identify incentives and trade-offs", "Trace a technology’s intended and unintended effects", "Use data to support a historical economic claim"], standards: ["C3 Framework 6–8 · Economics & History"], prerequisites: ["Resources and trade", "Data claims"], skills: ["economics", "technology", "systems", "consequences"] },
      ],
    },
    {
      subject: "Vocabulary",
      units: [
        { topic: "Academic Language & Precision", summary: "Use high-utility academic words to make explanations, arguments, and analysis more precise.", goals: ["Infer meaning from context and morphology", "Choose language that matches a claim’s strength", "Use a new term accurately across contexts"], standards: ["CCSS ELA 6–8 · Vocabulary Acquisition & Use"], prerequisites: ["Context clues", "Paragraph analysis"], skills: ["precision", "nuance", "morphology", "academic language"] },
        { topic: "Greek & Latin Roots Across Subjects", summary: "Unlock science, math, and history terminology by analyzing roots, affixes, and cognates.", goals: ["Break a complex word into meaningful parts", "Predict a word’s meaning and verify it", "Connect related terms across subjects"], standards: ["CCSS ELA 6–8 · Word Analysis"], prerequisites: ["Common prefixes and suffixes", "Dictionary skills"], skills: ["roots", "affixes", "cognates", "verification"] },
        { topic: "Figurative Language, Tone & Rhetoric", summary: "Analyze how figurative language and rhetorical choices shape a reader’s response.", goals: ["Explain metaphor, analogy, and connotation", "Trace how diction creates tone", "Use rhetorical vocabulary to analyze a passage"], standards: ["CCSS ELA 6–8 · Language"], prerequisites: ["Literal and figurative meaning", "Tone basics"], skills: ["rhetoric", "connotation", "tone", "figurative language"] },
        { topic: "Domain Vocabulary Networks", summary: "Build connected concept networks instead of memorizing isolated definitions.", goals: ["Group terms by relationship", "Explain a term with a model or example", "Use a concept network to retrieve related knowledge"], standards: ["CCSS ELA 6–8 · Domain-Specific Vocabulary"], prerequisites: ["Academic language", "Concept mapping"], skills: ["concept networks", "definitions", "retrieval", "transfer"] },
      ],
    },
  ],
};

function bandForGrade(grade: LibraryGrade): "K–2" | "3–5" | "6–8" {
  if (["K", "1", "2"].includes(grade)) {return "K–2";}
  if (["3", "4", "5"].includes(grade)) {return "3–5";}
  return "6–8";
}

function difficultyFor(grade: LibraryGrade, unitIndex: number): OriginalSet["difficulty"] {
  if (grade === "K" || (grade === "1" && unitIndex < 2)) {return "FOUNDATION";}
  if (grade === "8" || (grade === "7" && unitIndex === 3)) {return "EXTENSION";}
  return "CORE";
}

const gradeLabel = (grade: LibraryGrade) => grade === "K" ? "Kindergarten" : `Grade ${grade}`;
const slug = (value: string) => value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const GRADE_FOCUS: Record<LibraryGrade, string> = {
  K: "Build language, number sense, routines, and curiosity through concrete examples and talk.",
  "1": "Move from concrete models to drawings, short explanations, and increasingly independent practice.",
  "2": "Use efficient strategies, connected details, and complete explanations to show understanding.",
  "3": "Shift toward fluency, evidence, and multi-step reasoning across texts and problems.",
  "4": "Connect models to general rules, compare strategies, and support answers with evidence.",
  "5": "Synthesize ideas, explain relationships, and transfer skills to unfamiliar situations.",
  "6": "Analyze systems, sources, and representations while making reasoning visible.",
  "7": "Evaluate evidence, revise models, and communicate nuanced explanations and arguments.",
  "8": "Integrate skills across disciplines, defend conclusions, and prepare for increasingly independent study.",
};

const HISTORY_APPROACH = "Literal, source-based history: establish chronology, describe evidence, separate fact from interpretation, and present competing accounts without partisan persuasion.";

export const STUDYSMART_ORIGINALS: OriginalSet[] = K8_GRADES.flatMap((grade) => {
  const band = bandForGrade(grade);
  return BLUEPRINTS[band].flatMap((blueprint) => blueprint.units.map((unit, unitIndex) => ({
    id: `original-${grade === "K" ? "k" : grade}-${slug(blueprint.subject)}-${unitIndex + 1}`,
    title: `${unit.topic} · ${gradeLabel(grade)}`,
    grade,
    gradeBand: band,
    subject: blueprint.subject,
    topic: unit.topic,
    summary: unit.summary,
    learningGoals: unit.goals,
    standards: unit.standards,
    prerequisites: unit.prerequisites,
    skillTags: unit.skills,
    difficulty: difficultyFor(grade, unitIndex),
    estimatedMinutes: grade === "K" || grade === "1" ? 12 + unitIndex * 2 : grade === "2" || grade === "3" ? 16 + unitIndex * 2 : 20 + unitIndex * 3,
    flashcardCount: grade === "K" || grade === "1" ? 8 + unitIndex * 2 : grade === "2" || grade === "3" ? 12 + unitIndex * 2 : 16 + unitIndex * 3,
    questionCount: grade === "K" || grade === "1" ? 6 + unitIndex : grade === "2" || grade === "3" ? 8 + unitIndex : 10 + unitIndex,
    readAloud: true,
    gradeFocus: GRADE_FOCUS[grade],
    editorialApproach: blueprint.subject === "History" ? HISTORY_APPROACH : "Standards-aligned, skills-first instruction with explicit modeling, guided practice, and transfer.",
    source: {
      label: "StudySmart Originals",
      kind: "ORIGINAL",
      license: "StudySmart Original · educator-reviewed blueprint",
    },
  })));
});

export function listOriginalSets(filters?: {
  grade?: LibraryGrade | "ALL";
  subject?: LibrarySubject | "ALL";
  search?: string;
}) {
  const search = filters?.search?.trim().toLocaleLowerCase() ?? "";
  return STUDYSMART_ORIGINALS.filter((set) => {
    if (filters?.grade && filters.grade !== "ALL" && set.grade !== filters.grade) {return false;}
    if (filters?.subject && filters.subject !== "ALL" && set.subject !== filters.subject) {return false;}
    if (search && ![set.title, set.topic, set.summary, ...set.skillTags].join(" ").toLocaleLowerCase().includes(search)) {return false;}
    return true;
  });
}

export function getOriginalLibraryStats() {
  return {
    totalSets: STUDYSMART_ORIGINALS.length,
    grades: K8_GRADES.length,
    subjects: LIBRARY_SUBJECTS.length,
    setsPerGrade: STUDYSMART_ORIGINALS.length / K8_GRADES.length,
    sources: new Set(STUDYSMART_ORIGINALS.map((set) => set.source.label)).size,
  };
}
