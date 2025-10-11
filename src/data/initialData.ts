import { Topic } from '../types';

// Extended topic information including project details
export interface TopicDetails {
  name: string;
  order: number;
  maxTime: number; // in minutes
  keyTags: string[];
  deliverable: string;
  icon: string;
  technologies?: string[];
  description?: string;
}

// Initial phases for the campus learning program
export const initialPhases: Array<{ name: string; order: number; isSenior?: boolean }> = [
  {
    name: 'Super mentor Phase',
    order: -1,
    isSenior: true
  },
  {
    name: 'Induction: Life Skills & Learning',
    order: 0
  },
  {
    name: 'Phase 0: Foundation',
    order: 1
  },
  {
    name: 'Phase 1: Student Profile & Course Portal (HTML Only)',
    order: 2
  },
  {
    name: 'Phase 2: Styling & Responsive Design',
    order: 3
  },
  {
    name: 'Self Learning Space',
    order: -1
  }
];

// Detailed topic information with project specifications
export const detailedTopics: { [phaseName: string]: TopicDetails[] } = {
  'Super mentor Phase': [
    {
      name: 'Module 4',
      order: 1,
      maxTime: 120,
      keyTags: ['Advanced Concepts'],
      deliverable: 'Complete Module 4 assignments',
      icon: '⭐',
      technologies: ['Mentor Guidance'],
      description: 'Advanced learning and mentorship activities for Module 4.'
    },
    {
      name: 'Module 5',
      order: 2,
      maxTime: 120,
      keyTags: ['Advanced Concepts'],
      deliverable: 'Complete Module 5 assignments',
      icon: '⭐',
      technologies: ['Mentor Guidance'],
      description: 'Advanced learning and mentorship activities for Module 5.'
    },
    {
      name: 'Module 6',
      order: 3,
      maxTime: 120,
      keyTags: ['Advanced Concepts'],
      deliverable: 'Complete Module 6 assignments',
      icon: '⭐',
      technologies: ['Mentor Guidance'],
      description: 'Advanced learning and mentorship activities for Module 6.'
    },
    {
      name: 'React Bootcamp',
      order: 4,
      maxTime: 180,
      keyTags: ['React', 'Bootcamp'],
      deliverable: 'Complete React Bootcamp project',
      icon: '⚛️',
      technologies: ['React', 'Mentor Guidance'],
      description: 'Intensive React bootcamp for advanced students.'
    }
  ],
  'Induction: Life Skills & Learning': [
    // Life Skills Quests (LS0-LS8 + Bonus) - Following original curriculum design
    {
      name: 'LS0: Pre-Check – Tools Setup',
      order: 1,
      maxTime: 120,
      keyTags: ['Digital Tools', 'Setup', 'Prerequisites', 'Technology'],
      deliverable: 'Confirm installation & explore tool usage',
      icon: '🛠️',
      technologies: ['Haal-Chaal', 'Google Translate', 'AudioPen', 'ChatGPT', 'Gemini AI', 'Google Docs'],
      description: `**Quest 0: Pre-Check – Tools Setup**

**Purpose:** Ensure students have basic digital tools for learning & exploration.

**Key Activities:**
• Install Haal-Chaal app for campus communication
• Set up Google Translate for language support
• Install AudioPen for voice-to-text notes
• Set up ChatGPT account and explore basic usage
• Install Gemini AI and test voice features
• Set up Google Docs for collaborative writing

**Deliverable:** Confirm installation & explore tool usage for all 6 tools

**Learning Focus:**
Prepare students with essential digital tools that will support their entire learning journey at NavGurukul.`
    },
    {
      name: 'LS1: Ye NavGurukul Kya Hai? (Intro to NG)',
      order: 2,
      maxTime: 180,
      keyTags: ['NavGurukul', 'Mission', 'Values', 'Learning Philosophy', 'Community'],
      deliverable: '5-min video explaining "What is NavGurukul" + short reflection doc',
      icon: '🏫',
      technologies: ['Video Creation', 'Research', 'Reflection'],
      description: `**Quest 1: Ye NavGurukul Kya Hai? (Intro to NG)**

**Purpose:** Understand NavGurukul's mission, values, and learning philosophy.

**Key Activities:**
• Explore NavGurukul website thoroughly
• Watch alumni success stories and testimonials
• Reflect on NavGurukul's impact on students' lives
• Understand the unique learning approach
• Connect with the mission and vision

**Deliverable:** Create a 5-minute video explaining "What is NavGurukul" + write a short reflection document

**Learning Focus:**
Deep understanding of NavGurukul's educational philosophy and how it differs from traditional education systems.`
    },
    {
      name: 'LS2: English Speaking Culture – B2 in 2 Months',
      order: 3,
      maxTime: 1440, // 24 hours total for all sub-quests
      keyTags: ['English Speaking', 'Culture', 'Communication', 'LSRW', 'Daily Practice'],
      deliverable: 'Multiple sub-quests (2.1–2.7) — uploads, videos, reflections',
      icon: '🗣️',
      technologies: ['Human Library', 'Karaoke', 'AI Tools', 'Voice Recording'],
      description: `**Quest 2: English Speaking Culture – B2 in 2 Months**

**Purpose:** Build daily English-speaking habits & campus culture.

**Key Activities:**
• Human Library sessions for conversational practice
• Karaoke sessions for confidence building
• Drama skits and flash mobs for expression
• AI correction tools for improvement
• Focus on LSRW (Listening, Speaking, Reading, Writing)

**Sub-Quests Overview:**
This quest contains 7 sub-activities (2.1-2.7) designed to create an immersive English learning environment.

**Learning Focus:**
Transform English from a subject to a living, breathing part of daily campus culture.`
    },
    {
      name: 'LS2.1: Story Reading & Retelling',
      order: 4,
      maxTime: 180,
      keyTags: ['Reading Comprehension', 'Narration', 'Storytelling', 'English Practice'],
      deliverable: 'Write doc on story, favorite character, alternate ending',
      icon: '📚',
      technologies: ['Reading', 'Writing', 'Storytelling'],
      description: `**Quest 2.1: Story Reading & Retelling**

**Purpose:** Develop comprehension and narration skills.

**Key Activities:**
• Read a short story from campus library
• Narrate the story in English to peers
• Share personal reflections and insights
• Discuss themes and characters

**Deliverable:** Write a document covering the story summary, favorite character analysis, and create an alternate ending

**Learning Focus:**
Building reading comprehension while developing confident English narration abilities.`
    },
    {
      name: 'LS2.2: English Only Day',
      order: 5,
      maxTime: 480, // Full day activity
      keyTags: ['Immersive Practice', 'English Only', 'Communication Challenge'],
      deliverable: 'Share fun moments from English-only day with LSA',
      icon: '🌅',
      technologies: ['Voice Translate', 'Conversation Practice'],
      description: `**Quest 2.2: English Only Day**

**Purpose:** Encourage immersive English practice.

**Key Activities:**
• Commit to speaking only English for an entire day
• Use voice translate when stuck on words
• Document funny and challenging moments
• Help peers maintain English-only communication

**Deliverable:** Share fun moments and learnings from English-only day with LSA (Life Skills Assistant)

**Learning Focus:**
Experience immersive language learning and build confidence through real-world English usage.`
    },
    {
      name: 'LS2.3: Self-Introduction Video',
      order: 6,
      maxTime: 120,
      keyTags: ['Self Expression', 'Video Creation', 'Confidence Building', 'Personal Branding'],
      deliverable: 'Upload video and share feedback from LSA',
      icon: '🎬',
      technologies: ['Video Recording', 'Self Presentation'],
      description: `**Quest 2.3: Self-Introduction Video**

**Purpose:** Build confidence in self-expression.

**Key Activities:**
• Watch introduction videos for inspiration
• Prepare personal introduction script
• Record engaging self-introduction video
• Practice speaking clearly and confidently

**Deliverable:** Upload introduction video and share feedback received from LSA

**Learning Focus:**
Develop confident self-expression and video communication skills.`
    },
    {
      name: 'LS2.4: Friends Series Roleplay',
      order: 7,
      maxTime: 240,
      keyTags: ['Roleplay', 'Tone Practice', 'Emotional Expression', 'Entertainment Learning'],
      deliverable: 'Upload video + write reflections on favorite episode/character',
      icon: '🎭',
      technologies: ['Video Recording', 'Acting', 'Script Analysis'],
      description: `**Quest 2.4: Friends Series Roleplay**

**Purpose:** Practice tone, emotion & conversational English.

**Key Activities:**
• Watch a season of Friends TV series
• Choose a 15-minute scene to recreate
• Practice emotional expressions and timing
• Act out the scene and record it

**Deliverable:** Upload roleplay video + write reflections on favorite episode and character

**Learning Focus:**
Learn natural English conversation patterns, emotional expression, and cultural context through entertainment.`
    },
    {
      name: 'LS2.5: Harry Potter Dubbing Challenge',
      order: 8,
      maxTime: 180,
      keyTags: ['Dubbing', 'Pronunciation', 'Voice Acting', 'Timing'],
      deliverable: 'Upload dubbed video + short presentation on process',
      icon: '⚡',
      technologies: ['Voice Recording', 'Video Editing', 'Dubbing'],
      description: `**Quest 2.5: Harry Potter Dubbing Challenge**

**Purpose:** Improve pronunciation & emotional fluency.

**Key Activities:**
• Select a 3-5 minute scene from Harry Potter
• Practice matching voice timing and emotion
• Focus on clear pronunciation and expression
• Record dubbed version with proper timing

**Deliverable:** Upload dubbed video + create short presentation explaining the dubbing process

**Learning Focus:**
Master pronunciation, timing, and emotional expression through creative voice work.`
    },
    {
      name: 'LS2.6: 10-Day AI English Practice',
      order: 9,
      maxTime: 600, // 10 days × 60 minutes
      keyTags: ['AI Practice', 'Daily Habit', 'Conversation', 'Feedback Loop'],
      deliverable: 'Upload AI feedback + share chat with LSA',
      icon: '🤖',
      technologies: ['ChatGPT', 'Gemini', 'AI Conversation'],
      description: `**Quest 2.6: 10-Day AI English Practice**

**Purpose:** Build daily English habit using AI chat tools.

**Key Activities:**
• Chat with AI for 10 minutes daily for 10 consecutive days
• Discuss different topics each day
• Ask AI for feedback on language improvement
• Track progress and areas of improvement

**Deliverable:** Upload AI feedback from Day 10 + share interesting chat conversations with LSA

**Learning Focus:**
Establish consistent English practice routine with AI assistance and personalized feedback.`
    },
    {
      name: 'LS2.7: Read an English Book',
      order: 10,
      maxTime: 360,
      keyTags: ['Reading Comprehension', 'Book Analysis', 'Peer Teaching'],
      deliverable: 'Upload short written summary & reflection',
      icon: '📖',
      technologies: ['Reading', 'Analysis', 'Peer Discussion'],
      description: `**Quest 2.7: Read an English Book**

**Purpose:** Strengthen reading comprehension & expression.

**Key Activities:**
• Pick an interesting book from campus library
• Finish reading the book in 3-5 days
• Understand the story, themes, and characters
• Explain the story to a peer in English

**Deliverable:** Upload short written summary and personal reflection on the book

**Learning Focus:**
Develop sustained reading habits and ability to comprehend and communicate complex narratives.`
    },
    {
      name: 'LS3: Morning Exercise – Break the Loop!',
      order: 11,
      maxTime: 240,
      keyTags: ['Physical Fitness', 'Energy Building', 'Consistency', 'Health'],
      deliverable: 'Article on "My experience of morning exercise" (with ChatGPT)',
      icon: '🏃‍♂️',
      technologies: ['Physical Training', 'ChatGPT', 'Health Tracking'],
      description: `**Quest 3: Morning Exercise – Break the Loop!**

**Purpose:** Build energy & consistency through fitness.

**Key Activities:**
• Explore self-defence techniques and training
• Interview peers about their exercise experiences
• Watch fitness and health-related videos
• Join morning exercise sessions regularly

**Deliverable:** Write an article on "My experience of morning exercise" using ChatGPT assistance

**Learning Focus:**
Establish healthy physical habits that boost energy and create positive daily momentum.`
    },
    {
      name: 'LS4: Reward System – Mehnat Ka Medal',
      order: 12,
      maxTime: 180,
      keyTags: ['Recognition', 'Input Tracking', 'Effort Appreciation', 'Motivation'],
      deliverable: '1-min reflection video + points tracking sheet',
      icon: '🏅',
      technologies: ['Point Tracking', 'Video Reflection'],
      description: `**Quest 4: Reward System – Mehnat Ka Medal**

**Purpose:** Understand recognition through inputs & efforts.

**Key Activities:**
• Read and understand the Reward System documentation
• Observe how peers earn recognition and points
• Track your own input activities and efforts
• Reflect on the importance of consistent effort

**Deliverable:** Create 1-minute reflection video + maintain detailed points tracking sheet

**Learning Focus:**
Learn that success comes from consistent input and effort, not just output and results.`
    },
    {
      name: 'LS5: Apna Ghar, Apni Pehchaan (House System)',
      order: 13,
      maxTime: 180,
      keyTags: ['House System', 'Belonging', 'Team Spirit', 'Identity'],
      deliverable: 'Upload reflection doc + English chant video',
      icon: '🏠',
      technologies: ['Community Building', 'Creative Expression'],
      description: `**Quest 5: Apna Ghar, Apni Pehchaan (House System)**

**Purpose:** Learn about the House structure & belonging.

**Key Activities:**
• Talk to 3 different house members about their experiences
• Choose your house based on values and connection
• Create an original house chant or song
• Read house documentation and understand traditions

**Deliverable:** Upload reflection document + create English chant video for your house

**Learning Focus:**
Develop sense of belonging and team identity within the larger NavGurukul community.`
    },
    {
      name: 'LS6: GBU – Good, Bad, Ugly Reflection',
      order: 14,
      maxTime: 240,
      keyTags: ['Self Reflection', 'Honest Assessment', 'Growth Mindset', 'Learning'],
      deliverable: 'GBU table + overall video reflection',
      icon: '🪞',
      technologies: ['Reflection Tools', 'Video Creation'],
      description: `**Quest 6: GBU – Good, Bad, Ugly Reflection**

**Purpose:** Build self-awareness through honest reflection.

**Key Activities:**
• Reflect on each completed activity (Intro, English, Rewards, Exercise, House, etc.)
• Identify Good aspects (what worked well)
• Acknowledge Bad aspects (what could be improved)
• Face Ugly aspects (honest self-criticism and areas for growth)

**Deliverable:** Create comprehensive GBU table + record overall video reflection

**Learning Focus:**
Develop honest self-assessment skills and growth mindset through structured reflection.`
    },
    {
      name: 'LS7: Council Hunt – Etiocracy',
      order: 15,
      maxTime: 180,
      keyTags: ['Student Governance', 'Etiocracy', 'Decision Making', 'Leadership'],
      deliverable: 'Google Doc summary + reflection "What I understood about Etiocracy"',
      icon: '🏛️',
      technologies: ['Interview Skills', 'AI Writing', 'Research'],
      description: `**Quest 7: Council Hunt – Etiocracy**

**Purpose:** Understand student governance & decision-making.

**Key Activities:**
• Interview 2 or more council members about their roles
• Record Q&A sessions about student governance
• Write comprehensive summary using AI assistance
• Understand the concept and practice of Etiocracy

**Deliverable:** Create Google Doc summary + reflection "What I understood about Etiocracy"

**Learning Focus:**
Learn about democratic decision-making, student leadership, and collaborative governance systems.`
    },
    {
      name: 'LS8: Mini AI Challenge – Create App with PartyRock',
      order: 16,
      maxTime: 240,
      keyTags: ['AI Tools', 'App Creation', 'Creative Problem Solving', 'Technology'],
      deliverable: 'Published app link + presentation/demo shared with LSA',
      icon: '🎉',
      technologies: ['PartyRock', 'App Development', 'AI Tools'],
      description: `**Quest 8: Mini AI Challenge – Create App with PartyRock**

**Purpose:** Introduce creative use of AI for problem-solving.

**Key Activities:**
• Explore PartyRock platform and its capabilities
• Brainstorm app ideas (quotes, jokes, games, utilities)
• Create and publish a simple but functional app
• Test and refine the app based on feedback

**Deliverable:** Share published app link + create presentation/demo to share with LSA

**Learning Focus:**
Experience the power of AI-assisted creativity and learn to build functional applications.`
    },
    {
      name: 'LSB1: Vipassana – Inner Reflection & Calmness (Bonus)',
      order: 17,
      maxTime: 300,
      keyTags: ['Vipassana', 'Mindfulness', 'Inner Peace', 'Meditation', 'Bonus Quest'],
      deliverable: 'Reflection note / verbal sharing session',
      icon: '🧘',
      technologies: ['Meditation', 'Mindfulness Practice'],
      description: `**Bonus Quest: Vipassana – Inner Reflection & Calmness**

**Purpose:** Experience mindfulness and emotional balance.

**Key Activities:**
• Attend structured Vipassana meditation session
• Practice silence and inner observation
• Reflect on the experience of stillness
• Learn mindfulness techniques for daily life

**Deliverable:** Write reflection note or participate in verbal sharing session about the experience

**Learning Focus:**
Develop inner calm, emotional balance, and mindfulness practices for mental well-being.`
    },
    {
      name: 'LSB2: Payforward – Giving Back to Community (Bonus)',
      order: 18,
      maxTime: 360,
      keyTags: ['Community Service', 'Giving Back', 'Gratitude', 'Social Impact', 'Bonus Quest'],
      deliverable: 'Short write-up/video on your Payforward experience',
      icon: '🎁',
      technologies: ['Community Engagement', 'Social Impact'],
      description: `**Bonus Quest: Payforward – Giving Back to Community**

**Purpose:** Encourage contribution and gratitude.

**Key Activities:**
• Support peers or juniors using skills you've learned
• Share knowledge and experiences generously
• Help others navigate challenges you've overcome
• Create positive impact in the community

**Deliverable:** Create short write-up or video documenting your Payforward experience

**Learning Focus:**
Develop gratitude, generosity, and understanding of how giving back strengthens the entire community.`
    },

    // Learning Quests (LE1-LE8)
    {
      name: 'LE1: Learning How to Learn',
      order: 18,
      maxTime: 360,
      keyTags: ['Learning Methodology', 'Metacognition', 'Practice', 'Reflection', 'Experiential Learning'],
      deliverable: 'Complete origami activity, laptop exploration, and self-learning challenges',
      icon: '🧠',
      technologies: ['Visual Learning', 'Hands-on Practice', 'Self-Learning'],
      description: `**Quest 1: Learning How to Learn**

**Step 1: Visual Learning**
• Learning through seeing instead of only instructions
• Group activity: Follow facilitator guide for origami
• Realize how visual demonstration + practice improves understanding

**Step 2: Laptop Hackathon**
• Learning by doing yourself (Mohit cleaning laptop story)
• Identify laptop parts, make short fun video explaining them
• Learn technical skills + gain confidence through hands-on experience

**Step 3: Self-Learning Challenge**
• Learning like a child – discover through exploration
• Use Khan Academy or similar platform
• Pick any topic you're curious about and learn for 2 hours
• Reflect: What made it interesting? What was difficult?

**Learning Objectives:**
• Understand different learning styles and methods
• Experience visual, hands-on, and self-directed learning
• Develop confidence in exploration and discovery
• Build metacognitive awareness of your learning process`
    },
    {
      name: 'LE2: Research & Information Literacy',
      order: 19,
      maxTime: 300,
      keyTags: ['Research Skills', 'Information Literacy', 'Critical Evaluation', 'Source Analysis'],
      deliverable: 'Complete research project with credible sources and analysis',
      icon: '🔍',
      technologies: ['Google Scholar', 'Research Databases', 'Fact-Checking Tools'],
      description: `Learn essential research skills and how to evaluate information credibility in the digital age.

**Learning Objectives:**
• Master effective search strategies
• Learn to evaluate source credibility
• Practice information synthesis
• Develop critical thinking about information
• Build academic research foundations`
    },
    {
      name: 'LE3: Critical Thinking & Problem Solving',
      order: 20,
      maxTime: 240,
      keyTags: ['Critical Thinking', 'Problem Solving', 'Logic', 'Analysis', 'Decision Making'],
      deliverable: 'Solve complex problems using structured thinking frameworks',
      icon: '🧩',
      technologies: ['Problem Solving Frameworks', 'Logic Tools'],
      description: `Develop critical thinking skills and systematic approaches to problem-solving.

**Learning Objectives:**
• Learn structured problem-solving methods
• Practice logical reasoning and analysis
• Develop decision-making frameworks
• Build critical evaluation skills
• Master systematic thinking approaches`
    },
    {
      name: 'LE4: Digital Literacy & Basic Computing',
      order: 21,
      maxTime: 300,
      keyTags: ['Digital Literacy', 'Computing Basics', 'File Management', 'Internet Safety'],
      deliverable: 'Demonstrate proficiency in digital tools and computing basics',
      icon: '💾',
      technologies: ['Operating Systems', 'File Management', 'Internet Browsers', 'Security Tools'],
      description: `Build foundational digital literacy skills and understanding of basic computing concepts.

**Learning Objectives:**
• Master file management and organization
• Understand operating system basics
• Learn internet safety and security
• Develop keyboard and navigation skills
• Build confidence with digital tools`
    },
    {
      name: 'LE5: Introduction to Programming Concepts',
      order: 22,
      maxTime: 360,
      keyTags: ['Programming Basics', 'Logic', 'Algorithms', 'Computational Thinking'],
      deliverable: 'Create simple programs demonstrating basic programming concepts',
      icon: '👨‍💻',
      technologies: ['Scratch', 'Block Programming', 'Basic Coding'],
      description: `Introduction to programming logic and computational thinking through visual and interactive tools.

**Learning Objectives:**
• Understand programming logic and flow
• Learn algorithmic thinking
• Practice problem decomposition
• Build computational problem-solving skills
• Gain confidence in logical thinking`
    },
    {
      name: 'LE6: Web Technologies Overview',
      order: 23,
      maxTime: 300,
      keyTags: ['Web Technologies', 'HTML', 'CSS', 'Internet Basics', 'Web Development'],
      deliverable: 'Create simple web page demonstrating understanding of web technologies',
      icon: '🌐',
      technologies: ['HTML', 'CSS', 'Web Browsers', 'Developer Tools'],
      description: `Explore how websites work and get hands-on experience with basic web technologies.

**Learning Objectives:**
• Understand how the internet and websites work
• Learn HTML structure and CSS styling basics
• Explore web development tools
• Create your first web page
• Build foundation for web development`
    },
    {
      name: 'LE7: Creative Technology Projects',
      order: 24,
      maxTime: 360,
      keyTags: ['Creative Technology', 'Digital Art', 'Multimedia', 'Innovation', 'Design'],
      deliverable: 'Complete creative technology project combining multiple skills',
      icon: '🎨',
      technologies: ['Design Tools', 'Multimedia Software', 'Creative Platforms'],
      description: `Combine technology skills with creativity to build innovative and artistic projects.

**Learning Objectives:**
• Integrate technical and creative skills
• Learn design thinking principles
• Practice innovation and creativity
• Build multimedia projects
• Develop artistic expression through technology`
    },
    {
      name: 'LE8: Portfolio Development & Presentation',
      order: 25,
      maxTime: 300,
      keyTags: ['Portfolio', 'Presentation', 'Documentation', 'Reflection', 'Showcase'],
      deliverable: 'Create comprehensive learning portfolio and present achievements',
      icon: '📁',
      technologies: ['Portfolio Platforms', 'Presentation Tools', 'Documentation'],
      description: `Create a comprehensive portfolio showcasing your learning journey and present your achievements to the community.

**Learning Objectives:**
• Document and reflect on learning journey
• Create professional portfolio presentation
• Practice public presentation skills
• Showcase projects and achievements
• Prepare for next phase transition`
    }
  ],
  'Phase 0: Foundation': [
    {
      name: 'Mathematics Fundamentals',
      order: 1,
      maxTime: 600,
      keyTags: ['BODMAS', 'Algebra', 'Exponents', 'Number Theory', 'Mathematical Operations'],
      deliverable: 'Complete Khan Academy Math Module and pass Module 0 Assessment',
      icon: '🔢',
      technologies: ['Mathematics', 'Problem Solving', 'Khan Academy'],
      description: `1-week intensive math primer to strengthen foundation for programming logic.

**Topics Covered:**
• BODMAS & Order of Operations - Learn the fundamental rules for evaluating mathematical expressions
• Number Types & Properties - Understanding even/odd, prime, composite, and natural numbers
• Division & Number Operations - Master long division, HCF (Highest Common Factor), and LCM (Lowest Common Multiple)
• Basic Algebra - Introduction to variables, equations, and algebraic expressions
• Basic Exponents - Understanding powers and exponential notation

**Key Learning Outcomes:**
- Apply BODMAS rules to solve complex expressions
- Classify and work with different number types
- Perform division operations and find HCF/LCM
- Work with variables and solve simple equations
- Understand and calculate exponents

**Assessment:** Complete all Khan Academy exercises and pass the Module 0 test to demonstrate mastery of mathematical fundamentals essential for programming.`
    },
    {
      name: 'Number Systems & Binary Logic',
      order: 2,
      maxTime: 960,
      keyTags: ['Binary', 'Decimal', 'Number Systems', 'Base Conversion', 'Computer Fundamentals'],
      deliverable: 'Complete number systems exercises and participate in facilitation session',
      icon: '💻',
      technologies: ['Binary Systems', 'Computer Science', 'Number Theory'],
      description: `2-week deep dive into number systems - the language computers speak.

**Topics Covered:**
• Introduction to Number Systems - Understanding different base systems (binary, decimal, octal, hexadecimal)
• Binary Numbers & Representation - How computers represent data using only 0s and 1s
• Base Conversions - Converting between decimal, binary, octal, and hexadecimal systems
• Adding Numbers in Different Bases - Arithmetic operations in binary and other bases
• Fun Facilitation Session - Interactive mentor-led activities to solidify concepts

**Key Learning Outcomes:**
- Understand how computers process and store information
- Convert numbers between different base systems (binary ↔ decimal ↔ hex)
- Perform binary arithmetic operations
- Grasp the relationship between bits, bytes, and computer memory
- Apply number system concepts to real-world computing scenarios

**Activities:** Daily exercises, base conversion practice, binary addition problems, and interactive mentor session with group discussions and reflections on Moodle.`
    },
    {
      name: 'Problem Solving & Flowcharts',
      order: 3,
      maxTime: 1680,
      keyTags: ['Flowcharts', 'Problem Solving', 'Algorithms', 'Logic', 'Computational Thinking'],
      deliverable: 'Create flowcharts for complex problems and pass Module 2 Assessment',
      icon: '📊',
      technologies: ['Flowcharts', 'Algorithmic Thinking', 'Visual Programming'],
      description: `5-week intensive program to master systematic problem-solving using flowcharts.

**Topics Covered:**
• Introduction to Problem Solving - Breaking down complex problems into manageable steps
• Variables & Data - Understanding data storage and manipulation concepts
• Loops & Repetition - Representing iterative processes visually
• Mathematical Logic - Boolean logic and conditional decision-making
• Flowchart Design Basics - Mastering flowchart symbols and conventions
• Advanced Flowchart Design - Complex problems with nested logic and multiple paths
• Problem-Solving Practice - Daily practice with real-world challenges
• Module 2 Review & Assessment - Comprehensive test of all concepts

**Key Learning Outcomes:**
- Analyze problems systematically and identify solution steps
- Design clear flowcharts using standard notation and symbols
- Represent variables, loops, and conditions visually
- Apply boolean logic to decision-making processes
- Create flowcharts for complex, multi-step problems
- Translate real-world problems into algorithmic solutions

**Activities:** Daily practice sessions, individual gap analysis with facilitators, mentor-guided problem-solving workshops, and comprehensive final assessment demonstrating mastery of computational thinking and flowchart design.`
    }
  ],
  'Phase 1: Student Profile & Course Portal (HTML Only)': [
    {
      name: '🏠 Home Page',
      order: 1,
      maxTime: 90,
      keyTags: ['<header>', '<nav>', '<footer>', '<main>', '<ul>', '<li>', '<a>'],
      deliverable: 'Project Video 1 (Page Walkthrough)',
      icon: '🏠',
      technologies: ['HTML5 Semantics', 'Tables', 'Forms'],
      description: 'Create the main landing page. Focus is on mastering fundamental page structure and implementing basic site navigation using the new semantic tags and the anchor tag (<a>) for linking.'
    },
    {
      name: '👤 Profile Page',
      order: 2,
      maxTime: 75,
      keyTags: ['<img> (with src, alt)', '<ol>', '<br>', '<hr>'],
      deliverable: 'Project Video 2 (Page Walkthrough)',
      icon: '👤',
      technologies: ['HTML5 Semantics', 'Tables', 'Forms'],
      description: 'Build a simple "About Me" page. Focus on embedding images, using ordered (<ol>) and unordered (<ul>) lists, and using structural tags like <hr> for visual separation.'
    },
    {
      name: '📚 Courses Page',
      order: 3,
      maxTime: 75,
      keyTags: ['Relative Paths in <a> tags'],
      deliverable: 'Project Video 3 (Page Walkthrough)',
      icon: '📚',
      technologies: ['HTML5 Semantics', 'Tables', 'Forms'],
      description: 'List courses and their descriptions. Focus on creating a clear content hierarchy using heading tags and correctly using relative paths in <a> tags to link to other pages within the project structure.'
    },
    {
      name: '📝 Feedback Page',
      order: 4,
      maxTime: 90,
      keyTags: ['<form>', '<label>', '<input> (types: email, radio, checkbox)', '<textarea>', '<select>', '<button>'],
      deliverable: 'Project Video 4 (Page Walkthrough)',
      icon: '📝',
      technologies: ['HTML5 Semantics', 'Tables', 'Forms'],
      description: 'Construct a fully-featured input form. Focus is on the proper structure of a form, labeling inputs (<label>), and utilizing a wide range of input types for data collection.'
    },
    {
      name: '📊 Grades Table Page',
      order: 5,
      maxTime: 60,
      keyTags: ['<table>', '<caption>', '<thead>', '<tbody>', '<tfoot>', '<tr>', '<th>', '<td>'],
      deliverable: 'Project Video 5 (Page Walkthrough)',
      icon: '📊',
      technologies: ['HTML5 Semantics', 'Tables', 'Forms'],
      description: 'Display tabular data (grades). Focus is entirely on table structure: organizing data into rows and cells, defining columns with headers, and structuring the table body and footer semantically.'
    },
    {
      name: '📞 Contact Us Page',
      order: 6,
      maxTime: 45,
      keyTags: ['mailto: in <a>', 'tel: in <a>', '<address>'],
      deliverable: 'Project Video 6 (Page Walkthrough)',
      icon: '📞',
      technologies: ['HTML5 Semantics', 'Tables', 'Forms'],
      description: 'Provide contact information. Focus on creating actionable links that open an email client (mailto:) or initiate a phone call (tel:), and using the semantic <address> tag.'
    },
    {
      name: 'Conceptual Review',
      order: 7,
      maxTime: 0,
      keyTags: ['Focus on Semantics and Navigation'],
      deliverable: 'Concept Video 7 (Linking It All Together)',
      icon: '🔗',
      technologies: ['HTML5 Semantics', 'Tables', 'Forms'],
      description: 'Review and finalize consistent navigation across all six pages. Ensure all links function correctly and the overall HTML structure is clean and semantically correct.'
    }
  ],
  'Phase 2: Styling & Responsive Design': [
    {
      name: 'Global Stylesheet',
      order: 1,
      maxTime: 0,
      keyTags: ['N/A (Focus is on CSS)'],
      deliverable: 'CSS Foundation',
      icon: '🎨',
      technologies: ['CSS Fundamentals', 'Selectors', 'Box Model', 'Flexbox', 'Media Queries'],
      description: 'Establish the foundation: Resetting default browser styles, setting base typography, styling structural elements (<header>, <nav>), and using pseudo-classes for link interaction.'
    },
    {
      name: 'Page-by-Page Styling',
      order: 2,
      maxTime: 0,
      keyTags: ['N/A (Focus is on CSS)'],
      deliverable: 'CSS Content Styling',
      icon: '🖌️',
      technologies: ['CSS Fundamentals', 'Selectors', 'Box Model', 'Flexbox', 'Media Queries'],
      description: 'Apply styles to specific content: using Flexbox for course cards, structuring forms for usability, styling tables with tr:nth-child for readability, and mastering the CSS Box Model for spacing.'
    },
    {
      name: 'Making It Responsive',
      order: 3,
      maxTime: 0,
      keyTags: ['N/A (Focus is on CSS)'],
      deliverable: 'Responsive Design',
      icon: '📱',
      technologies: ['CSS Fundamentals', 'Selectors', 'Box Model', 'Flexbox', 'Media Queries'],
      description: 'Introduce the basics of Responsive Web Design (RWD). Define breakpoints using Media Queries to adjust styles (e.g., stacking navigation links) for mobile and tablet screens.'
    }
  ],
  'Phase 3: Interactive Quiz Master': [
    {
      name: 'Project Introduction: Interactive Quiz Master',
      order: 1,
      maxTime: 30,
      keyTags: ['JavaScript Overview'],
      deliverable: 'No video – intro only',
      icon: '🎯',
      technologies: ['JavaScript Fundamentals'],
      description: 'Learn how JavaScript brings websites to life. Understand the goal of making an interactive quiz application using existing HTML & CSS.'
    },
    {
      name: 'Starting the Quiz (Start Page / quiz.html)',
      order: 2,
      maxTime: 60,
      keyTags: ['Variables', 'Functions', 'DOM Manipulation', 'Events'],
      deliverable: '1 Video: Show Start Page + explain variables, functions, events, DOM Manipulation.',
      icon: '▶️',
      technologies: ['JavaScript', 'DOM API', 'Event Handling'],
      description: 'Implement "Start Quiz" button functionality to reveal the first question or navigate to quiz.html. Learn DOM basics and event handling.'
    },
    {
      name: 'Storing Quiz Questions & Answers',
      order: 3,
      maxTime: 45,
      keyTags: ['Arrays', 'Objects'],
      deliverable: '1 Video: Show array/object structure + explain data organization.',
      icon: '📋',
      technologies: ['JavaScript Arrays', 'JavaScript Objects'],
      description: 'Create an array of question objects holding text, options, and correct answers. Practice storing structured data.'
    },
    {
      name: 'Displaying Questions & Options (quiz.html)',
      order: 4,
      maxTime: 60,
      keyTags: ['Loops', 'Strings', 'Functions', 'DOM Manipulation'],
      deliverable: '1 Video: Show questions & options appearing dynamically + explanation of loops, strings, DOM usage.',
      icon: '❓',
      technologies: ['JavaScript Loops', 'String Manipulation', 'DOM API'],
      description: 'Use loops to iterate through questions and display them dynamically. Build HTML content using strings.'
    },
    {
      name: 'Handling User Answers & Navigation (quiz.html)',
      order: 5,
      maxTime: 75,
      keyTags: ['Variables', 'Operators', 'Conditional Statements', 'Functions', 'DOM', 'Events'],
      deliverable: '1 Video: Show answer handling and navigation + explanation of events, conditionals, and score tracking.',
      icon: '✅',
      technologies: ['JavaScript Conditionals', 'Event Handling', 'DOM Manipulation'],
      description: 'Detect user answers, compare with correct answers, update score, and move to the next question or results page.'
    },
    {
      name: 'Calculating & Displaying Results (results.html)',
      order: 6,
      maxTime: 45,
      keyTags: ['Variables', 'Strings', 'DOM', 'Functions', 'URL Parameters'],
      deliverable: '1 Video: Show results display + explanation of score calculation and DOM usage.',
      icon: '📊',
      technologies: ['JavaScript Variables', 'DOM API', 'URL Parameters'],
      description: 'Calculate final score and display a result message dynamically. Optionally, pass data between pages.'
    },
    {
      name: 'Restarting the Quiz (Optional, results.html or quiz.html)',
      order: 7,
      maxTime: 30,
      keyTags: ['Functions', 'Variables', 'DOM', 'Events'],
      deliverable: '1 Video: Show reset functionality + explanation of functions, events, and state reset.',
      icon: '🔄',
      technologies: ['JavaScript Functions', 'Event Handling', 'State Management'],
      description: 'Implement a "Restart Quiz" feature to reset variables and page state.'
    },
    {
      name: 'Mini Projects: Practice JS Concepts',
      order: 8,
      maxTime: 120,
      keyTags: ['Variables', 'Arrays', 'Objects', 'Functions', 'DOM', 'Events', 'Operators', 'Strings'],
      deliverable: '1 Video per mini-project: Show working demo + explain concepts applied.',
      icon: '🛠️',
      technologies: ['JavaScript Fundamentals', 'DOM API', 'Event Handling'],
      description: 'Build focused practice projects: To-Do List, Tip Calculator, Quote Generator. Solidify JS fundamentals before or alongside the main project.'
    },
    {
      name: 'Project Wrap-Up & Reflection',
      order: 9,
      maxTime: 30,
      keyTags: ['JavaScript Review'],
      deliverable: '1 Video: Reflect on learning + demonstrate final working quiz.',
      icon: '🎉',
      technologies: ['JavaScript Fundamentals'],
      description: 'Review JavaScript fundamentals applied in the project: Variables, Data Types, Operators, Strings, Loops, Arrays, Objects, Functions, DOM, Events, Conditional Statements.'
    }
  ],
  'Phase 4: AI-Powered Content Generator': [
    {
      name: 'Project Introduction: AI-Powered Content Generator',
      order: 1,
      maxTime: 30,
      keyTags: ['ES6+ Overview', 'Gemini API'],
      deliverable: 'No video – intro only',
      icon: '🤖',
      technologies: ['JavaScript ES6+', 'Gemini API'],
      description: 'Understand the goal: use modern JS (ES6+) and Gemini API to build interactive AI-powered web features.'
    },
    {
      name: 'Ask Me Anything Feature',
      order: 2,
      maxTime: 75,
      keyTags: ['let/const', 'Arrow Functions', 'Template Literals', 'fetch()', 'Promises'],
      deliverable: '1 Video: Demonstrate feature + explain ES6 concepts + Gemini API call.',
      icon: '❓',
      technologies: ['JavaScript ES6+', 'Fetch API', 'Gemini API'],
      description: 'Build a feature where users type a question and Gemini returns an answer dynamically. Learn event handling, template literals for API queries, and fetch() for asynchronous calls.'
    },
    {
      name: 'Quick Summarizer Feature',
      order: 3,
      maxTime: 60,
      keyTags: ['let/const', 'Arrow Functions', 'Template Literals', 'fetch()', 'Promises', 'Destructuring'],
      deliverable: '1 Video: Show summarizer + ES6 features + API integration.',
      icon: '📝',
      technologies: ['JavaScript ES6+', 'Destructuring', 'Gemini API'],
      description: 'Users paste text and receive a concise summary via Gemini. Learn destructuring to extract data from API responses and handle asynchronous results.'
    },
    {
      name: 'Idea Spark Feature',
      order: 4,
      maxTime: 60,
      keyTags: ['let/const', 'Arrow Functions', 'Template Literals', 'fetch()', 'Promises', 'Array Methods'],
      deliverable: '1 Video: Demo feature + explain applied JS/ES6 concepts and API usage.',
      icon: '💡',
      technologies: ['JavaScript ES6+', 'Array Methods', 'Gemini API'],
      description: 'Users request creative ideas (blog topics, stories) from Gemini. Apply array methods to process multiple suggestions if needed.'
    },
    {
      name: 'Definition Finder Feature',
      order: 5,
      maxTime: 45,
      keyTags: ['let/const', 'Arrow Functions', 'Template Literals', 'fetch()', 'Promises'],
      deliverable: '1 Video: Demo feature + explain ES6/API usage.',
      icon: '📚',
      technologies: ['JavaScript ES6+', 'Fetch API', 'Gemini API'],
      description: 'Users input terms, and Gemini provides definitions. Practice API request construction, fetch() handling, and DOM manipulation.'
    },
    {
      name: 'Mini Projects / Warm-up Exercises',
      order: 6,
      maxTime: 120,
      keyTags: ['let/const', 'Arrow Functions', 'Template Literals', 'Destructuring', 'fetch()', 'Promises'],
      deliverable: '1 Video per mini-project: Show working demo + explain JS concepts & API integration.',
      icon: '🛠️',
      technologies: ['JavaScript ES6+', 'Gemini API', 'DOM Manipulation'],
      description: 'AI Joke Generator, Gemini-Powered Quiz Helper, Daily Positive Affirmation Fetcher. Focused practice on ES6 features + API calls.'
    },
    {
      name: 'Project Wrap-Up & Reflection',
      order: 7,
      maxTime: 30,
      keyTags: ['ES6+ Review', 'Gemini API Review'],
      deliverable: '1 Video: Demonstrate final AI content generator + reflect on learning outcomes.',
      icon: '🎉',
      technologies: ['JavaScript ES6+', 'Gemini API'],
      description: 'Review ES6 fundamentals (let/const, arrow functions, template literals, destructuring, spread/rest, array methods) and Gemini API integration. Reflect on building a functional, AI-powered web app.'
    }
  ],
  'Phase 5: Ask Gemini Web App': [
    {
      name: 'Project Introduction: Ask Gemini Web App',
      order: 1,
      maxTime: 30,
      keyTags: ['Full-Stack Overview', 'Node.js', 'Express'],
      deliverable: 'No video – intro only',
      icon: '🌐',
      technologies: ['Node.js', 'Express.js', 'Gemini API'],
      description: 'Understand full-stack development: frontend communicates with backend server built in Node.js & Express, which integrates with Gemini API.'
    },
    {
      name: 'Express App Setup & Structure',
      order: 2,
      maxTime: 45,
      keyTags: ['Node.js runtime', 'express()', 'Project folder structure'],
      deliverable: '1 Video: Show setup, folder structure, app.listen(), basic server code.',
      icon: '⚙️',
      technologies: ['Node.js', 'Express.js', 'npm'],
      description: 'Initialize Express server, install dependencies, organize project folders (server code, frontend files).'
    },
    {
      name: 'Backend Routes & Request Handling',
      order: 3,
      maxTime: 60,
      keyTags: ['Express routes (app.get(), app.post())', 'express.json()'],
      deliverable: '1 Video: Demonstrate routes handling user inputs.',
      icon: '🛤️',
      technologies: ['Express.js Routes', 'JSON Parsing'],
      description: 'Handle frontend requests via GET/POST. Parse incoming request data (JSON), structure server responses.'
    },
    {
      name: 'Gemini API Integration on Backend',
      order: 4,
      maxTime: 75,
      keyTags: ['fetch() / axios', 'Promises', 'async/await', 'environment variables (.env, dotenv)'],
      deliverable: '1 Video: Show API integration + explain API key security + backend response processing.',
      icon: '🔗',
      technologies: ['Gemini API', 'Environment Variables', 'Async/Await'],
      description: 'Securely communicate with Gemini API from server. Handle asynchronous responses, parse JSON, return data to frontend.'
    },
    {
      name: 'Frontend-Backend Interaction Demo',
      order: 5,
      maxTime: 60,
      keyTags: ['DOM manipulation', 'fetch() (frontend)', 'Event handling'],
      deliverable: '1 Video: Demo full app flow (frontend → backend → Gemini → frontend).',
      icon: '🔄',
      technologies: ['Fetch API', 'DOM Manipulation', 'Event Handling'],
      description: 'Send user input to backend, receive AI-generated content, update frontend dynamically. Demonstrate full-stack communication.'
    },
    {
      name: 'Mini Projects / Practice Exercises',
      order: 6,
      maxTime: 120,
      keyTags: ['Node.js', 'Express routes', 'fetch()/axios', 'JSON responses'],
      deliverable: '1 Video per mini-project: Demo working backend + explain code and API usage.',
      icon: '🛠️',
      technologies: ['Node.js', 'Express.js', 'Gemini API'],
      description: 'Practice building small backend APIs: AI Fun Facts, AI Daily Journal Prompter, AI Helper Bot with multiple endpoints. Apply async JS and Gemini API integration.'
    },
    {
      name: 'Project Wrap-Up & Reflection',
      order: 7,
      maxTime: 30,
      keyTags: ['Full-Stack Review', 'Node.js Review'],
      deliverable: '1 Video: Demonstrate final full-stack "Ask Gemini" app + reflect on learning outcomes.',
      icon: '🎉',
      technologies: ['Node.js', 'Express.js', 'Gemini API'],
      description: 'Review Node.js, Express.js, backend routing, API integration, async operations, full-stack flow. Reflect on building a functional backend app with AI.'
    }
  ],
  'Phase 6: Student Feedback Manager': [
    {
      name: 'Project Introduction: Student Feedback Manager',
      order: 1,
      maxTime: 30,
      keyTags: ['Database Overview', 'MongoDB', 'Mongoose'],
      deliverable: 'No video – intro only',
      icon: '💬',
      technologies: ['MongoDB', 'Mongoose', 'Node.js'],
      description: 'Understand databases, NoSQL concepts, MongoDB for data storage, Mongoose for schema and model management.'
    },
    {
      name: 'MongoDB Setup & Connection',
      order: 2,
      maxTime: 45,
      keyTags: ['mongoose.connect()', '.env (dotenv)'],
      deliverable: '1 Video: Show database connection, explain .env usage, demonstrate successful connection.',
      icon: '🔌',
      technologies: ['MongoDB', 'Mongoose', 'Environment Variables'],
      description: 'Connect Node.js/Express app to MongoDB (local or Atlas). Keep connection string secure with environment variables.'
    },
    {
      name: 'Define Schema & Model',
      order: 3,
      maxTime: 60,
      keyTags: ['mongoose.Schema()', 'mongoose.model()'],
      deliverable: '1 Video: Explain schema, model, and why schemas structure data.',
      icon: '📋',
      technologies: ['Mongoose Schema', 'Mongoose Model'],
      description: 'Create a Mongoose schema for feedback (name, rating, comments). Build a model to interact with the database.'
    },
    {
      name: 'Storing New Feedback (Create)',
      order: 4,
      maxTime: 75,
      keyTags: ['new Model()', 'instance.save()', 'express.json()'],
      deliverable: '1 Video: Submit feedback via form → save to database → confirm stored data (MongoDB Compass or shell).',
      icon: '💾',
      technologies: ['Mongoose CRUD', 'Express.js', 'JSON Parsing'],
      description: 'Receive POST requests from frontend form, create a new document, save feedback to MongoDB.'
    },
    {
      name: 'Retrieving & Displaying Feedback (Read)',
      order: 5,
      maxTime: 60,
      keyTags: ['Model.find()', 'async/await', 'Express GET route'],
      deliverable: '1 Video: Fetch feedback → render on frontend → explain full data flow.',
      icon: '📖',
      technologies: ['Mongoose Queries', 'Async/Await', 'Express Routes'],
      description: 'Create route to fetch all feedback, send JSON to frontend, dynamically display feedback on "All Feedback" page.'
    },
    {
      name: 'Mini Projects / Practice Exercises',
      order: 6,
      maxTime: 120,
      keyTags: ['CRUD basics (Create & Read focus)', 'Express routes', 'Mongoose models'],
      deliverable: '1 Video per mini-project: Demo backend functionality, explain schema, routes, and database interactions.',
      icon: '🛠️',
      technologies: ['MongoDB', 'Mongoose', 'Express.js'],
      description: 'Build small apps to practice database integration: contact form collector, student progress tracker, quick notes saver. Use POST to store and GET to retrieve data.'
    },
    {
      name: 'Project Wrap-Up & Reflection',
      order: 7,
      maxTime: 30,
      keyTags: ['MongoDB Review', 'Mongoose Review', 'Full-Stack Data Flow'],
      deliverable: '1 Video: Showcase final app, explain end-to-end data flow (frontend → backend → database → frontend).',
      icon: '🎉',
      technologies: ['MongoDB', 'Mongoose', 'Full-Stack Development'],
      description: 'Consolidate knowledge: connect frontend, backend, database; secure connection; handle user data persistently.'
    }
  ],
  'Phase 7: CollabSphere': [
    {
      name: 'Project Introduction: CollabSphere',
      order: 1,
      maxTime: 30,
      keyTags: ['Full-Stack Overview', 'AI Integration', 'SaaS Application'],
      deliverable: 'No video – intro only',
      icon: '🌍',
      technologies: ['Full-Stack Development', 'AI Integration', 'MongoDB'],
      description: 'Understand project scope: full-stack development, AI-powered collaboration, portfolio-ready SaaS application.'
    },
    {
      name: 'User Authentication System',
      order: 2,
      maxTime: 90,
      keyTags: ['bcrypt.js (password hashing)', 'JWT (auth)', 'Express routes', 'MongoDB'],
      deliverable: 'Video 1: Registration & Login demo, explain auth flow and JWT handling',
      icon: '🔐',
      technologies: ['JWT Authentication', 'bcrypt.js', 'MongoDB'],
      description: 'Secure user registration, login, JWT-protected routes, store users in MongoDB.'
    },
    {
      name: 'Project Creation & Collaboration',
      order: 3,
      maxTime: 75,
      keyTags: ['Express routes', 'MongoDB relations', 'Mongoose models'],
      deliverable: 'Video 2: Create project, add members, demo dashboard',
      icon: '👥',
      technologies: ['Express.js', 'MongoDB Relations', 'Mongoose'],
      description: 'Create projects, invite users as members, display user dashboard.'
    },
    {
      name: 'Markdown Notes Management',
      order: 4,
      maxTime: 90,
      keyTags: ['SimpleMDE editor', 'CRUD operations', 'MongoDB'],
      deliverable: 'Video 3: CRUD notes demo, save to DB, frontend interaction',
      icon: '📝',
      technologies: ['SimpleMDE', 'CRUD Operations', 'MongoDB'],
      description: 'Create, edit, save notes; basic collaboration logic.'
    },
    {
      name: 'Gemini AI Integration with Notes',
      order: 5,
      maxTime: 75,
      keyTags: ['Gemini API', 'Express backend routes', 'fetch/axios'],
      deliverable: 'Video 4: Gemini explain & suggestion demo, show backend API routes',
      icon: '🤖',
      technologies: ['Gemini API', 'Express.js', 'Fetch API'],
      description: 'Buttons to explain notes or suggest improvements via Gemini; backend handles API calls securely.'
    },
    {
      name: 'File Upload & Preview',
      order: 6,
      maxTime: 90,
      keyTags: ['Multer (or Cloudinary)', 'file handling', 'MongoDB references'],
      deliverable: 'Video 5: Upload demo, preview, Gemini code explanation',
      icon: '📁',
      technologies: ['Multer', 'File Handling', 'MongoDB'],
      description: 'Upload project files, basic preview, Gemini code explanation for supported files.'
    },
    {
      name: 'Contribution Analytics',
      order: 7,
      maxTime: 60,
      keyTags: ['Express GET routes', 'MongoDB queries', 'data aggregation'],
      deliverable: 'Video 6: Analytics demo, basic dashboard summary',
      icon: '📊',
      technologies: ['Express Routes', 'MongoDB Queries', 'Data Aggregation'],
      description: 'Track user activity: notes created, files uploaded, project contributions.'
    },
    {
      name: 'Public Shareable Project Page & README Generation',
      order: 8,
      maxTime: 75,
      keyTags: ['Public routes', 'Gemini API', 'Markdown generation'],
      deliverable: 'Video 7: Public project page demo, README generation using Gemini',
      icon: '📄',
      technologies: ['Gemini API', 'Markdown Generation', 'Public Routes'],
      description: 'Generate project README via Gemini, make project or README publicly viewable.'
    },
    {
      name: 'Mini Projects / Practice Exercises',
      order: 9,
      maxTime: 150,
      keyTags: ['Authentication', 'Collaborative Notes', 'README Generation'],
      deliverable: 'Optional videos for practice, helps prep final project',
      icon: '🛠️',
      technologies: ['Full-Stack Development', 'AI Integration'],
      description: '1) Authentication system, 2) Collaborative Markdown notes, 3) Gemini-powered README generator.'
    },
    {
      name: 'Project Wrap-Up & Reflection',
      order: 10,
      maxTime: 45,
      keyTags: ['Full-Stack Flow', 'Security', 'AI Enhancement'],
      deliverable: 'Optional reflection video summarizing full app',
      icon: '🎉',
      technologies: ['Full-Stack Development', 'AI Integration', 'Deployment'],
      description: 'Consolidate all features, demonstrate end-to-end functionality, deployment readiness.'
    }
  ],
  'Self Learning Space': [
    {
      name: 'Exam Preparation',
      order: 1,
      maxTime: 480, // 8 hours
      keyTags: ['Self-Study', 'Exam Prep', 'Knowledge Assessment', 'Study Skills'],
      deliverable: 'Personal study plan and exam preparation goals',
      icon: '📚',
      technologies: ['Study Materials', 'Practice Tests', 'Self-Reflection'],
      description: `Dedicated space for exam preparation and knowledge assessment.
Focus on building study habits, taking practice exams, and tracking your learning progress.

**Learning Objectives:**
• Develop effective study strategies
• Practice exam-taking skills
• Track personal learning progress
• Build confidence through preparation`
    },
    {
      name: 'Job Preparation',
      order: 2,
      maxTime: 480, // 8 hours
      keyTags: ['Career Development', 'Job Search', 'Resume Building', 'Interview Skills'],
      deliverable: 'Job application materials and career development plan',
      icon: '💼',
      technologies: ['Resume Writing', 'LinkedIn', 'Interview Practice', 'Networking'],
      description: `Prepare for job opportunities and career advancement.
Build your professional profile, practice interviews, and develop job search strategies.

**Learning Objectives:**
• Create compelling resumes and portfolios
• Practice interview techniques
• Learn job search strategies
• Build professional networking skills`
    }
  ]
};

// Simplified topics for backward compatibility
export const initialTopics: { [phaseName: string]: Omit<Topic, 'id' | 'created_at' | 'phase_id'>[] } = {
  'Phase 1: Student Profile & Course Portal (HTML Only)': detailedTopics['Phase 1: Student Profile & Course Portal (HTML Only)'].map(topic => ({
    name: topic.name,
    order: topic.order
  })),
  'Phase 2: Styling & Responsive Design': detailedTopics['Phase 2: Styling & Responsive Design'].map(topic => ({
    name: topic.name,
    order: topic.order
  }))
};

// Goal templates for better guidance
export const goalTemplates: { [topicName: string]: string[] } = {
  '🏠 Home Page': [
    'Create HTML structure using <header>, <nav>, <main>, and <footer> tags',
    'Build a navigation menu with <ul>, <li>, and <a> elements',
    'Structure content with semantic HTML and proper heading hierarchy',
    'Complete the home page layout within 90 minutes and record walkthrough video'
  ],
  '👤 Profile Page': [
    'Add profile image using <img> tag with proper alt attributes',
    'Create profile information using <h2>/<h3> headings and lists',
    'Organize personal details with <ul>/<ol> and <li> elements',
    'Complete profile page within 75 minutes and record walkthrough video'
  ],
  '📚 Courses Page': [
    'Structure course listings using <h2>/<h3> headings',
    'Add course descriptions with <p> elements and proper content hierarchy',
    'Create course links using <a> tags for navigation',
    'Complete courses page within 75 minutes and record walkthrough video'
  ],
  '📝 Feedback Page': [
    'Build feedback form using <form>, <label>, and various <input> types',
    'Add text area for comments using <textarea> element',
    'Include dropdown selections with <select> and submit with <button>',
    'Complete feedback form within 90 minutes and record walkthrough video'
  ],
  '📊 Grades Table Page': [
    'Create grades table using <table>, <thead>, and <tbody> structure',
    'Add table caption with <caption> and organize data with <tr>, <th>, <td>',
    'Structure tabular data properly for accessibility and readability',
    'Complete grades table within 60 minutes and record walkthrough video'
  ],
  '📞 Contact Us Page': [
    'Add contact information using <p> and <h2>/<h3> elements',
    'Create clickable email links using <a> with mailto: protocol',
    'Add phone links using <a> with tel: protocol for mobile compatibility',
    'Complete contact page within 45 minutes and record walkthrough video'
  ],
  '🔗 Conceptual Review': [
    'Demonstrate understanding of HTML document structure and semantic elements',
    'Show how all pages link together using proper navigation',
    'Explain the relationship between different HTML elements used',
    'Record concept video explaining the complete project structure'
  ],
  'React.js Fundamentals': [
    'Build a todo list application with React components',
    'Implement state management for a shopping cart feature',
    'Create reusable components with proper prop handling'
  ],
  'Node.js & Backend Development': [
    'Set up Express server with basic routing',
    'Implement CRUD operations for a REST API',
    'Integrate authentication middleware for secure endpoints'
  ],
  'Project Planning & Architecture': [
    'Design system architecture for full-stack application',
    'Create user stories and technical specifications',
    'Set up project structure with proper folder organization'
  ]
};

// Helper function to get topic details
export const getTopicDetails = (phaseName: string, topicName: string): TopicDetails | null => {
  const phaseTopics = detailedTopics[phaseName];
  if (!phaseTopics) return null;
  
  return phaseTopics.find(topic => topic.name === topicName) || null;
};

// Achievement level descriptions
export const achievementLevels = {
  beginner: {
    range: [0, 40],
    label: 'Getting Started',
    color: 'red',
    description: 'Learning the basics and building foundation'
  },
  developing: {
    range: [41, 70],
    label: 'Developing',
    color: 'yellow',
    description: 'Understanding concepts and applying knowledge'
  },
  proficient: {
    range: [71, 85],
    label: 'Proficient',
    color: 'blue',
    description: 'Comfortable with concepts and solving problems'
  },
  advanced: {
    range: [86, 100],
    label: 'Advanced',
    color: 'green',
    description: 'Mastering concepts and teaching others'
  }
};