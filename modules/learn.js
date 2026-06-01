// modules/learn.js
// Inder's Feature: The Learn Tab — Scientific Habit & Productivity Education
// Micro-lessons, quizzes, circadian calculator, case studies, bookshelf
// All storage via getProfile/saveProfile — no direct localStorage

import { getProfile, saveProfile } from './storage.js';

// ─── LESSONS DATABASE ─────────────────────────────────────────────────────────

const LESSONS = [
  {
    id: 'dopamine_focus',
    title: 'The Neurobiology of Focus & Dopamine',
    emoji: '🧠',
    gradient: 'linear-gradient(135deg, #ff4b4b 0%, #ff9600 100%)',
    gradientBorder: '#ff4b4b',
    tag: 'Neuroscience',
    readTime: '4 min read',
    body: `
      <p>Most people think dopamine is the "pleasure chemical." But neuroscientist <strong>Dr. Andrew Huberman</strong> and psychiatrist <strong>Dr. Anna Lembke</strong> reveal something far more important: <em>dopamine drives anticipation, not satisfaction.</em></p>
      <h4>🔬 The Science</h4>
      <p>Your brain's dopamine system fires <strong>before</strong> you get the reward — during the pursuit. When you check off a task, you feel a spike. But if you get dopamine too easily (scrolling, junk food), your brain resets the <strong>baseline lower</strong>, meaning everyday tasks feel harder and less rewarding over time.</p>
      <blockquote>"Every time we pursue a pleasurable stimulus, the brain compensates by moving the pain balance slightly in the opposite direction." — Dr. Anna Lembke, <em>Dopamine Nation</em></blockquote>
      <h4>⚡ The Action</h4>
      <ul>
        <li><strong>Increase friction</strong> for negative habits (delete social apps from home screen)</li>
        <li><strong>Decrease friction</strong> for positive habits (set your book on your pillow)</li>
        <li>Avoid "dopamine stacking" — doing multiple pleasurable things at once (e.g., eating + scrolling)</li>
        <li>Do a <strong>dopamine fast</strong>: 24 hours without quick-hit stimuli to reset your baseline</li>
      </ul>
    `,
    quiz: [
      {
        q: 'Dopamine primarily fires during:',
        options: ['The moment of reward', 'The anticipation of reward', 'Sleep', 'Eating'],
        answer: 1
      },
      {
        q: 'What happens to your dopamine baseline after excess quick rewards?',
        options: ['It rises permanently', 'It stays the same', 'It drops, making normal tasks feel harder', 'It doubles'],
        answer: 2
      },
      {
        q: 'Which action reduces friction for positive habits?',
        options: ['Hiding your running shoes', 'Setting your book on your pillow before bed', 'Deleting apps you want to use', 'None of the above'],
        answer: 1
      }
    ]
  },
  {
    id: 'bj_fogg_habit',
    title: 'The BJ Fogg Habit Loop (B = MAP)',
    emoji: '🔁',
    gradient: 'linear-gradient(135deg, #58cc02 0%, #1cb0f6 100%)',
    gradientBorder: '#58cc02',
    tag: 'Habit Science',
    readTime: '3 min read',
    body: `
      <p>Stanford researcher <strong>Dr. BJ Fogg</strong> spent decades studying behavior. His conclusion? Most habit advice is wrong — willpower is unreliable, and motivation fluctuates wildly.</p>
      <h4>🔬 The Science: B = MAP</h4>
      <p>A behavior (B) happens when three elements converge at the same moment:</p>
      <ul>
        <li><strong>M — Motivation:</strong> Your desire to do it</li>
        <li><strong>A — Ability:</strong> How easy it is to do</li>
        <li><strong>P — Prompt:</strong> A cue that triggers the behavior</li>
      </ul>
      <p>The most powerful lever? <strong>Ability</strong>. Make the habit so tiny it requires near-zero motivation.</p>
      <blockquote>"If you want to create a habit, make it tiny. Not easy. Tiny." — Dr. BJ Fogg, <em>Tiny Habits</em></blockquote>
      <h4>⚡ The Action</h4>
      <ul>
        <li>Start with <strong>2-minute versions</strong> of habits ("Read 1 page", "Do 2 push-ups")</li>
        <li>Attach habits to <strong>anchor events</strong> ("After I brew coffee, I will write my plan")</li>
        <li>Your Odyssey time blocks act as <strong>visual Prompts</strong> — honor them!</li>
        <li>Celebrate immediately when you complete a tiny habit — it hardwires the loop</li>
      </ul>
    `,
    quiz: [
      {
        q: 'In the B = MAP model, what does "A" stand for?',
        options: ['Attention', 'Ability', 'Ambition', 'Awareness'],
        answer: 1
      },
      {
        q: 'Which is the most powerful lever for building habits according to Fogg?',
        options: ['Motivation', 'Willpower', 'Ability (making it tiny)', 'Rewards'],
        answer: 2
      },
      {
        q: 'An "anchor event" in habit building is:',
        options: ['A weekly goal review', 'A daily alarm', 'An existing routine you hook a new habit onto', 'A punishment for missing a habit'],
        answer: 2
      }
    ]
  },
  {
    id: 'circadian_sleep',
    title: 'Circadian Rhythm & Sleep Pressure',
    emoji: '🌙',
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #1cb0f6 100%)',
    gradientBorder: '#7c3aed',
    tag: 'Sleep Science',
    readTime: '5 min read',
    body: `
      <p>Dr. <strong>Matthew Walker</strong>, neuroscientist and sleep researcher at UC Berkeley, calls sleep "the single most effective thing you can do to reset your brain and body health."</p>
      <h4>🔬 The Science: Two Forces That Control Sleep</h4>
      <p><strong>1. Adenosine (Sleep Pressure):</strong> A chemical that builds up every hour you're awake. The longer you stay up, the more adenosine accumulates, creating sleep pressure. Caffeine works by <em>blocking</em> adenosine receptors — it doesn't eliminate the pressure, just masks it.</p>
      <p><strong>2. Circadian Rhythm:</strong> Your 24-hour internal clock, anchored by light. Morning sunlight triggers a <strong>cortisol spike</strong> within 30 minutes of waking — this is healthy and sharpens alertness and sets the clock for the whole day.</p>
      <blockquote>"Routinely sleeping less than 6 hours a night demolishes your immune system, doubles your risk of cancer, and contributes to Alzheimer's disease." — Matthew Walker, <em>Why We Sleep</em></blockquote>
      <h4>⚡ The Action</h4>
      <ul>
        <li>Get <strong>morning sunlight within 30 minutes</strong> of waking — no sunglasses, outside if possible</li>
        <li>Cut caffeine after <strong>2 PM</strong> — it has a 5–7 hour half-life</li>
        <li>Keep a <strong>consistent sleep/wake time</strong> — even on weekends</li>
        <li>Drop room temperature to <strong>18°C (65°F)</strong> for optimal sleep onset</li>
      </ul>
    `,
    quiz: [
      {
        q: 'What is adenosine?',
        options: ['A stress hormone', 'A sleep-pressure chemical that builds while you are awake', 'A neurotransmitter that creates focus', 'A type of caffeine molecule'],
        answer: 1
      },
      {
        q: 'When should you ideally get morning sunlight?',
        options: ['Within 3 hours of waking', 'After breakfast', 'Within 30 minutes of waking', 'Only on cloudy days'],
        answer: 2
      },
      {
        q: 'What does caffeine actually do?',
        options: ['Eliminates sleep pressure permanently', 'Blocks adenosine receptors without clearing sleep pressure', 'Increases deep sleep quality', 'Resets your circadian rhythm'],
        answer: 1
      }
    ]
  },
  {
    id: 'automaticity_66',
    title: 'The 66-Day Automaticity Rule',
    emoji: '📅',
    gradient: 'linear-gradient(135deg, #ff9600 0%, #ffc800 100%)',
    gradientBorder: '#ff9600',
    tag: 'Habit Formation',
    readTime: '3 min read',
    body: `
      <p>You've probably heard the myth: "It takes 21 days to form a habit." That number came from a 1960s plastic surgeon who noticed patients took about 21 days to adjust to their new appearance. It was never about habits.</p>
      <h4>🔬 The Science</h4>
      <p>In 2009, Dr. <strong>Phillippa Lally</strong> at University College London studied 96 people over 12 weeks. The actual finding: it takes an average of <strong>66 days</strong> for a behavior to become automatic. The range? 18 to 254 days — depending on the complexity of the habit and the person.</p>
      <p>The key metric is <strong>automaticity</strong> — the point at which you perform the habit without thinking, deliberating, or needing motivation.</p>
      <blockquote>"Missing one opportunity to perform the behavior did not measurably affect the habit formation process." — Dr. Phillippa Lally, 2009 UCL Study</blockquote>
      <h4>⚡ The Action</h4>
      <ul>
        <li>Focus on your <strong>streak count</strong> in Odyssey — each day is building automaticity</li>
        <li>Don't panic if you miss a day — <strong>missing once doesn't reset</strong> your habit wiring</li>
        <li>Complex habits (exercise) take longer; simple habits (drinking water) take less time</li>
        <li>Track the <strong>first 66 days</strong> as your "Habit Foundation Window"</li>
      </ul>
    `,
    quiz: [
      {
        q: 'How many days does it take on average to form a habit, according to Dr. Lally?',
        options: ['21 days', '30 days', '66 days', '90 days'],
        answer: 2
      },
      {
        q: 'What is "automaticity" in habit science?',
        options: ['Doing a habit automatically without deliberation', 'Setting automatic phone reminders', 'A habit that earns automatic rewards', 'Following a pre-made schedule'],
        answer: 0
      },
      {
        q: 'What happens to your habit if you miss one day?',
        options: ['It resets completely', 'It is not measurably affected', 'You must start the 66-day count again', 'Your automaticity score drops by 50%'],
        answer: 1
      }
    ]
  }
];

// ─── BOOKS DATABASE ───────────────────────────────────────────────────────────

const BOOKS = [
  {
    id: 'atomic_habits',
    title: 'Atomic Habits',
    author: 'James Clear',
    emoji: '⚛️',
    color: '#ff9600',
    colorDark: '#e68500',
    spine: 'linear-gradient(180deg, #ff9600, #ff4b4b)',
    thesis: 'Habits compound over time. A 1% improvement every day makes you 37× better in a year. Focus on system design, not willpower or motivation.',
    takeaways: [
      { icon: '🪪', point: 'Identity-Based Habits', detail: 'Focus on who you want to become, not what you want to achieve. "I am a writer" beats "I want to write a book."' },
      { icon: '👁️', point: 'Make it Obvious', detail: 'Design your environment so good habits are visible. Leave your guitar by the couch.' },
      { icon: '😍', point: 'Make it Attractive', detail: 'Bundle a habit you need to do with one you want to do (temptation bundling).' },
      { icon: '🪶', point: 'Make it Easy', detail: 'Reduce the friction for good habits. Standardize before you optimize.' },
      { icon: '🏆', point: 'Make it Satisfying', detail: 'Give yourself an immediate reward. Use a habit tracker — never break the chain.' }
    ],
    odysseyLink: 'Our daily schedule planners help you write clear Implementation Intentions (Time + Place + Action), which is the #1 evidence-based technique from this book.'
  },
  {
    id: 'tiny_habits',
    title: 'Tiny Habits',
    author: 'BJ Fogg',
    emoji: '🌱',
    color: '#58cc02',
    colorDark: '#46a302',
    spine: 'linear-gradient(180deg, #58cc02, #1cb0f6)',
    thesis: 'Behaviors are created when Motivation, Ability, and a Prompt converge simultaneously (B = MAP). Never start big — start so small it requires zero motivation.',
    takeaways: [
      { icon: '🔗', point: 'Anchor Habits', detail: 'Hook a new habit to a strong existing routine. "After I pour my morning coffee, I will write one sentence."' },
      { icon: '🐜', point: 'Shrink the Behavior', detail: 'Make the habit ridiculously small. Read 1 page. Do 2 push-ups. Walk to the mailbox.' },
      { icon: '🎉', point: 'Celebrate Immediately', detail: 'The emotional spike right after completing a habit is what wires it into your brain. Fist pump, say "Yes!", do a little dance.' },
      { icon: '📍', point: 'Design Your Prompts', detail: 'Without a reliable prompt, habits fail. Use your Odyssey time blocks as visual triggers.' }
    ],
    odysseyLink: 'The hourly checkboxes in Odyssey act as visual Prompts that trigger your scheduled behaviors — exactly the P in B = MAP.'
  },
  {
    id: 'deep_work',
    title: 'Deep Work',
    author: 'Cal Newport',
    emoji: '🎯',
    color: '#1cb0f6',
    colorDark: '#1899d6',
    spine: 'linear-gradient(180deg, #1cb0f6, #4c1d95)',
    thesis: 'The ability to focus without distraction on cognitively demanding tasks is a superpower. Deep work produces results that shallow work cannot.',
    takeaways: [
      { icon: '🧠', point: 'Cognitive Residue', detail: 'Every time you switch tasks, part of your attention remains stuck on the previous task. Batch your work to minimize switching.' },
      { icon: '📵', point: 'Embrace Boredom', detail: 'If you never let your brain be bored, you train it to crave distraction. Practice boredom daily.' },
      { icon: '🕐', point: 'Time Block Deep Work', detail: 'Schedule 90-minute deep work sessions on your calendar. Protect them like meetings.' },
      { icon: '🔁', point: 'Shutdown Ritual', detail: 'End each workday with a ritual that signals your brain work is done — reduces evening rumination.' }
    ],
    odysseyLink: 'Odyssey\'s block scheduler is built for Time Blocking — the exact technique Newport prescribes for protecting deep work focus windows.'
  },
  {
    id: 'dopamine_nation',
    title: 'Dopamine Nation',
    author: 'Dr. Anna Lembke',
    emoji: '⚖️',
    color: '#ff4b4b',
    colorDark: '#ea2b2b',
    spine: 'linear-gradient(180deg, #ff4b4b, #ff9600)',
    thesis: 'The brain processes pleasure and pain in the same region. In our overstimulated world, constant dopamine hits create a deficit state where everyday life feels grey.',
    takeaways: [
      { icon: '⚖️', point: 'Pleasure-Pain Balance', detail: 'Every pleasure tips the balance; the brain compensates with pain. Moderation restores equilibrium.' },
      { icon: '🚫', point: 'Dopamine Fast', detail: 'A 24-hour break from high-stimulation activities resets the dopamine baseline. Life starts to feel vivid again.' },
      { icon: '🪞', point: 'Radical Honesty', detail: 'Compulsive behavior thrives on secrecy. Honest self-disclosure to a trusted person is the first step to rewiring.' },
      { icon: '📉', point: 'Reduce Before You Abstain', detail: 'Cold-turkey rarely works. Gradually reduce exposure to high-dopamine triggers.' }
    ],
    odysseyLink: 'The Honesty Checking System in Odyssey — marking tasks as missed and logging reasons — directly cultivates the radical self-awareness Lembke prescribes.'
  },
  {
    id: 'why_we_sleep',
    title: 'Why We Sleep',
    author: 'Matthew Walker',
    emoji: '😴',
    color: '#7c3aed',
    colorDark: '#5b21b6',
    spine: 'linear-gradient(180deg, #7c3aed, #1cb0f6)',
    thesis: 'Sleep is the single most important biological function for learning, memory consolidation, emotional regulation, and physical health.',
    takeaways: [
      { icon: '🔋', point: 'Sleep Clears the Brain', detail: 'The glymphatic system flushes toxins (including Alzheimer\'s-linked amyloid) only during sleep. You literally clean your brain at night.' },
      { icon: '☕', point: 'Caffeine Half-Life', detail: 'A cup of coffee at 3 PM still has 50% of its caffeine in your system at 9 PM. This silently sabotages sleep quality.' },
      { icon: '📅', point: 'Consistency > Duration', detail: 'Sleeping 7 hours at consistent times beats 9 hours at irregular times. Your circadian clock hates unpredictability.' },
      { icon: '📵', point: 'Pre-Sleep Ritual', detail: 'Dim lights, no screens 1 hour before bed. Blue light suppresses melatonin for up to 3 hours.' }
    ],
    odysseyLink: 'Remind yourself that sleep schedules deserve the same planning and protection as work sessions. Block sleep in Odyssey just like a non-negotiable commitment.'
  }
];

// ─── CASE STUDIES ─────────────────────────────────────────────────────────────

const CASE_STUDIES = [
  {
    id: 'marginal_gains',
    emoji: '🚴',
    title: 'Marginal Gains: British Cycling',
    subtitle: 'How 1% improvements led to Olympic dominance',
    gradient: 'linear-gradient(135deg, #ffc800 0%, #ff9600 100%)',
    story: `In 2003, the British cycling team had never won the Tour de France. Performance director <strong>Dave Brailsford</strong> introduced the philosophy of "aggregation of marginal gains" — if you break down everything that goes into riding a bike and improve each element by just 1%, you get a significant overall increase.

They redesigned bike seats, tested which pillow reduced athlete fatigue, painted the inside of their truck white to spot maintenance issues, and taught cyclists the best way to wash their hands to reduce illness.

<strong>The result:</strong> In 2012, Britain won 70% of the gold medals available in cycling at the London Olympics. From 2007 to 2017, British cyclists won 178 World Championships and 66 Olympic or Paralympic gold medals.`,
    lesson: 'You don\'t rise to the level of your goals — you fall to the level of your systems. 1% better every day = 37× better every year.'
  },
  {
    id: 'cookie_loop',
    emoji: '🍪',
    title: 'The Cookie Habit Loop',
    subtitle: 'Charles Duhigg diagnoses his own habit',
    gradient: 'linear-gradient(135deg, #58cc02 0%, #1cb0f6 100%)',
    story: `<em>The Power of Habit</em> author <strong>Charles Duhigg</strong> noticed he was walking to the cafeteria every afternoon for a cookie — and gaining weight. Instead of using willpower, he investigated his habit loop.

He identified: <strong>Cue</strong> (around 3:30 PM, feeling bored), <strong>Routine</strong> (walk to cafeteria, chat with colleagues, eat cookie), <strong>Reward</strong> (socializing and mental stimulation — not actually the cookie).

He experimented. He tried eating an apple. Still went back for the cookie. He tried coffee. Still felt the urge. Finally he just walked to a colleague's desk and chatted for 10 minutes. <strong>The craving vanished.</strong>

The cookie was never the point. Social connection was the real reward.`,
    lesson: 'Identify your real reward before trying to change a habit. The craving is often not what you think it is.'
  }
];

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────

function getCompletedLessons() {
  try {
    const profile = getProfile();
    return Array.isArray(profile.completedLessons) ? profile.completedLessons : [];
  } catch (e) {
    console.error('[Learn] Error reading completed lessons:', e);
    return [];
  }
}

function markLessonComplete(lessonId) {
  try {
    const profile = getProfile();
    if (!Array.isArray(profile.completedLessons)) profile.completedLessons = [];
    if (!profile.completedLessons.includes(lessonId)) {
      profile.completedLessons.push(lessonId);
      profile.diamonds = (profile.diamonds || 0) + 5;
      saveProfile(profile);
      return true; // first time — diamond awarded
    }
    return false; // already completed
  } catch (e) {
    console.error('[Learn] Error marking lesson complete:', e);
    return false;
  }
}

// ─── CIRCADIAN CALCULATOR ─────────────────────────────────────────────────────

function renderCircadianCalculator() {
  return `
    <div class="learn-calculator card-3d">
      <div class="learn-calc-header">
        <span class="learn-calc-icon">⏰</span>
        <div>
          <h3 class="learn-calc-title">Circadian Peak Calculator</h3>
          <p class="learn-calc-sub">Discover your daily performance windows</p>
        </div>
      </div>
      <div class="learn-calc-input-row">
        <label class="learn-calc-label">Your average wake-up time:</label>
        <input type="time" id="learn-wakeup-input" class="learn-time-input" value="07:00" />
      </div>
      <button class="learn-calc-btn" id="learn-calc-btn">Calculate My Windows ✨</button>
      <div id="learn-calc-results" class="learn-calc-results hidden"></div>
    </div>
  `;
}

function computePeakWindows(wakeTime) {
  try {
    const [h, m] = wakeTime.split(':').map(Number);
    const base = h * 60 + m;

    function toTime(mins) {
      const total = base + mins;
      const hh = Math.floor(total / 60) % 24;
      const mm = total % 60;
      const period = hh >= 12 ? 'PM' : 'AM';
      const displayH = hh % 12 || 12;
      return `${displayH}:${String(mm).padStart(2, '0')} ${period}`;
    }

    return [
      {
        label: 'First Peak Focus Window',
        time: toTime(180),
        offset: 'Wake + 3 hrs',
        desc: 'Deep creative work, coding, writing, studying. Cortisol and alertness are at maximum.',
        icon: '🔥',
        color: '#ff4b4b'
      },
      {
        label: 'Afternoon Performance Window',
        time: toTime(420),
        offset: 'Wake + 7 hrs',
        desc: 'Physical exercise, admin tasks, meetings. Body temperature peaks — reaction time is fastest.',
        icon: '💪',
        color: '#58cc02'
      },
      {
        label: 'Wind-Down Alert',
        time: toTime(660),
        offset: 'Wake + 11 hrs',
        desc: 'Reduce screen exposure. Dim lights. Begin dopamine fasting prep. Sleep pressure is building.',
        icon: '🌙',
        color: '#7c3aed'
      }
    ];
  } catch (e) {
    console.error('[Learn] Circadian calculation error:', e);
    return [];
  }
}

// ─── LESSON MODAL ─────────────────────────────────────────────────────────────

function openLessonModal(lesson, completedLessons, container) {
  try {
    const isCompleted = completedLessons.includes(lesson.id);

    const modal = document.createElement('div');
    modal.className = 'learn-modal';
    modal.id = 'learn-modal-overlay';
    modal.innerHTML = `
      <div class="learn-modal-backdrop" id="learn-modal-backdrop"></div>
      <div class="learn-modal-sheet card-3d animate-pop">
        <div class="learn-modal-hero" style="background: ${lesson.gradient}">
          <span class="learn-modal-hero-emoji">${lesson.emoji}</span>
          <div class="learn-modal-hero-labels">
            <span class="learn-modal-tag">${lesson.tag}</span>
            <h2 class="learn-modal-title">${lesson.title}</h2>
            <span class="learn-modal-readtime">${lesson.readTime}</span>
          </div>
        </div>
        <div class="learn-modal-body" id="learn-modal-body">
          <div class="learn-lesson-content">${lesson.body}</div>

          ${isCompleted
            ? `<div class="learn-completed-badge">✅ Lesson Complete — You earned 💎 +5 diamonds!</div>`
            : `
              <div class="learn-quiz-section" id="learn-quiz-section-${lesson.id}">
                <h3 class="learn-quiz-title">📝 Quick Comprehension Check</h3>
                <p class="learn-quiz-sub">Answer all 3 correctly to earn +5 💎</p>
                ${lesson.quiz.map((q, qi) => `
                  <div class="learn-quiz-q" data-qi="${qi}">
                    <p class="learn-q-text">${qi + 1}. ${q.q}</p>
                    <div class="learn-q-options">
                      ${q.options.map((opt, oi) => `
                        <button class="learn-q-opt" data-qi="${qi}" data-oi="${oi}">${opt}</button>
                      `).join('')}
                    </div>
                    <p class="learn-q-feedback hidden" id="learn-fb-${lesson.id}-${qi}"></p>
                  </div>
                `).join('')}
                <button class="learn-quiz-submit btn-3d" id="learn-quiz-submit-${lesson.id}" disabled>
                  Submit Answers 🚀
                </button>
                <div class="learn-quiz-result hidden" id="learn-quiz-result-${lesson.id}"></div>
              </div>
            `
          }
        </div>
        <button class="learn-modal-close" id="learn-modal-close">✕ Close</button>
      </div>
    `;

    container.appendChild(modal);

    // Close handlers
    modal.querySelector('#learn-modal-backdrop').addEventListener('click', () => {
      try { modal.remove(); } catch (e) { console.error('[Learn] Modal close error:', e); }
    });
    modal.querySelector('#learn-modal-close').addEventListener('click', () => {
      try { modal.remove(); } catch (e) { console.error('[Learn] Modal close error:', e); }
    });

    if (isCompleted) return;

    // Quiz logic
    const answers = {};
    const submitBtn = modal.querySelector(`#learn-quiz-submit-${lesson.id}`);

    modal.querySelectorAll('.learn-q-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          const qi = parseInt(btn.dataset.qi);
          const oi = parseInt(btn.dataset.oi);
          answers[qi] = oi;
          // Highlight selected
          modal.querySelectorAll(`.learn-q-opt[data-qi="${qi}"]`).forEach(b => b.classList.remove('learn-q-opt--selected'));
          btn.classList.add('learn-q-opt--selected');
          // Enable submit when all answered
          if (Object.keys(answers).length === lesson.quiz.length) {
            submitBtn.disabled = false;
            submitBtn.classList.add('learn-quiz-submit--ready');
          }
        } catch (e) { console.error('[Learn] Quiz option error:', e); }
      });
    });

    submitBtn.addEventListener('click', () => {
      try {
        let correct = 0;
        lesson.quiz.forEach((q, qi) => {
          const fb = modal.querySelector(`#learn-fb-${lesson.id}-${qi}`);
          const userAnswer = answers[qi];
          if (userAnswer === q.answer) {
            correct++;
            fb.textContent = '✅ Correct!';
            fb.className = 'learn-q-feedback learn-q-feedback--correct';
          } else {
            fb.textContent = `❌ Incorrect. Correct answer: "${q.options[q.answer]}"`;
            fb.className = 'learn-q-feedback learn-q-feedback--wrong';
          }
          fb.classList.remove('hidden');
          // Lock options
          modal.querySelectorAll(`.learn-q-opt[data-qi="${qi}"]`).forEach(b => {
            b.disabled = true;
            if (parseInt(b.dataset.oi) === q.answer) b.classList.add('learn-q-opt--correct');
          });
        });

        submitBtn.disabled = true;
        const resultEl = modal.querySelector(`#learn-quiz-result-${lesson.id}`);
        resultEl.classList.remove('hidden');

        if (correct === lesson.quiz.length) {
          const firstTime = markLessonComplete(lesson.id);
          resultEl.innerHTML = firstTime
            ? `<div class="learn-result--win">🎉 Perfect Score! <strong>+5 💎 diamonds</strong> added to your wallet!</div>`
            : `<div class="learn-result--win">✅ Perfect Score! (Diamonds already claimed for this lesson)</div>`;
          // Update header diamond counter
          window.dispatchEvent(new CustomEvent('tempo_profile_changed'));
        } else {
          resultEl.innerHTML = `<div class="learn-result--retry">You got ${correct}/${lesson.quiz.length}. Re-read the lesson and try again! 💪</div>`;
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Try Again 🔁';
            submitBtn.classList.remove('learn-quiz-submit--ready');
          }, 1500);
        }
      } catch (e) { console.error('[Learn] Quiz submit error:', e); }
    });

  } catch (e) {
    console.error('[Learn] Open lesson modal error:', e);
  }
}

// ─── BOOK MODAL ───────────────────────────────────────────────────────────────

function openBookModal(book, container) {
  try {
    const modal = document.createElement('div');
    modal.className = 'learn-modal';
    modal.id = 'learn-book-modal';
    modal.innerHTML = `
      <div class="learn-modal-backdrop" id="learn-book-backdrop"></div>
      <div class="learn-modal-sheet card-3d animate-pop">
        <div class="learn-modal-hero" style="background: ${book.spine}">
          <span class="learn-modal-hero-emoji" style="font-size: 48px;">${book.emoji}</span>
          <div class="learn-modal-hero-labels">
            <span class="learn-modal-tag">📚 Book Summary</span>
            <h2 class="learn-modal-title">${book.title}</h2>
            <span class="learn-modal-readtime">by ${book.author}</span>
          </div>
        </div>
        <div class="learn-modal-body">
          <div class="learn-book-thesis">
            <span class="learn-thesis-label">Core Thesis</span>
            <p>${book.thesis}</p>
          </div>
          <h3 class="learn-takeaways-title">Key Takeaways</h3>
          ${book.takeaways.map(t => `
            <div class="learn-takeaway-card">
              <span class="learn-takeaway-icon">${t.icon}</span>
              <div>
                <strong class="learn-takeaway-point">${t.point}</strong>
                <p class="learn-takeaway-detail">${t.detail}</p>
              </div>
            </div>
          `).join('')}
          <div class="learn-odyssey-link">
            <span class="learn-odyssey-link-label">🔗 Odyssey Connection</span>
            <p>${book.odysseyLink}</p>
          </div>
        </div>
        <button class="learn-modal-close" id="learn-book-close">✕ Close</button>
      </div>
    `;

    container.appendChild(modal);
    modal.querySelector('#learn-book-backdrop').addEventListener('click', () => {
      try { modal.remove(); } catch (e) { console.error('[Learn] Book modal close error:', e); }
    });
    modal.querySelector('#learn-book-close').addEventListener('click', () => {
      try { modal.remove(); } catch (e) { console.error('[Learn] Book modal close error:', e); }
    });
  } catch (e) {
    console.error('[Learn] Open book modal error:', e);
  }
}

// ─── MAIN RENDER ─────────────────────────────────────────────────────────────

export function renderLearn(container) {
  try {
    const completedLessons = getCompletedLessons();

    container.innerHTML = `
      <div class="learn-view">

        <!-- Header -->
        <div class="learn-header">
          <h2 class="learn-main-title">📚 Learn</h2>
          <p class="learn-main-sub">Science-backed habits, productivity & performance</p>
          <div class="learn-progress-pill">
            <span>${completedLessons.length} / ${LESSONS.length} lessons complete</span>
            <div class="learn-progress-bar">
              <div class="learn-progress-fill" style="width: ${Math.round((completedLessons.length / LESSONS.length) * 100)}%"></div>
            </div>
          </div>
        </div>

        <!-- Circadian Calculator -->
        <div class="learn-section">
          <div class="learn-section-label">⏰ Circadian Peak Calculator</div>
          ${renderCircadianCalculator()}
        </div>

        <!-- Micro-Lessons -->
        <div class="learn-section">
          <div class="learn-section-label">🔬 Scientific Micro-Lessons</div>
          <div class="learn-lessons-grid" id="learn-lessons-grid">
            ${LESSONS.map(lesson => {
              const done = completedLessons.includes(lesson.id);
              return `
                <div class="learn-lesson-card card-3d ${done ? 'learn-lesson-card--done' : ''}"
                     data-lesson-id="${lesson.id}"
                     style="--lesson-gradient: ${lesson.gradient}; --lesson-border: ${lesson.gradientBorder}">
                  <div class="learn-card-inner" style="background: ${lesson.gradient}">
                    <span class="learn-card-emoji">${lesson.emoji}</span>
                    <div class="learn-card-tag">${lesson.tag}</div>
                  </div>
                  <div class="learn-card-footer">
                    <h4 class="learn-card-title">${lesson.title}</h4>
                    <div class="learn-card-meta">
                      <span class="learn-card-time">${lesson.readTime}</span>
                      ${done
                        ? `<span class="learn-card-done-badge">✅ Done</span>`
                        : `<span class="learn-card-reward">+5 💎</span>`
                      }
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Case Studies Carousel -->
        <div class="learn-section">
          <div class="learn-section-label">📖 Case Studies</div>
          <div class="learn-case-carousel" id="learn-case-carousel">
            ${CASE_STUDIES.map((cs, i) => `
              <div class="learn-case-card card-3d ${i === 0 ? 'learn-case-card--active' : ''}"
                   data-case-idx="${i}"
                   style="background: ${cs.gradient}">
                <span class="learn-case-emoji">${cs.emoji}</span>
                <h4 class="learn-case-title">${cs.title}</h4>
                <p class="learn-case-sub">${cs.subtitle}</p>
                <div class="learn-case-body hidden" id="learn-case-body-${i}">
                  <div class="learn-case-story">${cs.story}</div>
                  <div class="learn-case-lesson">💡 ${cs.lesson}</div>
                </div>
                <button class="learn-case-toggle" data-case-idx="${i}">Read More ▾</button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Bookshelf -->
        <div class="learn-section">
          <div class="learn-section-label">📚 The Bookshelf</div>
          <p class="learn-bookshelf-sub">Tap any book to read a premium interactive summary</p>
          <div class="learn-bookshelf" id="learn-bookshelf">
            ${BOOKS.map(book => `
              <div class="learn-book-spine" data-book-id="${book.id}"
                   style="background: ${book.spine}; box-shadow: 4px 0 0 ${book.colorDark}">
                <span class="learn-book-emoji">${book.emoji}</span>
                <div class="learn-book-text">
                  <span class="learn-book-title-spine">${book.title}</span>
                  <span class="learn-book-author-spine">${book.author}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    // ── Circadian Calculator ────────────────────────────────────────────────

    container.querySelector('#learn-calc-btn').addEventListener('click', () => {
      try {
        const input = container.querySelector('#learn-wakeup-input').value;
        if (!input) return;
        const windows = computePeakWindows(input);
        const resultsEl = container.querySelector('#learn-calc-results');
        resultsEl.innerHTML = windows.map(w => `
          <div class="learn-calc-window" style="border-left: 4px solid ${w.color}">
            <div class="learn-calc-window-header">
              <span class="learn-calc-window-icon">${w.icon}</span>
              <div>
                <strong class="learn-calc-window-time">${w.time}</strong>
                <span class="learn-calc-window-offset">${w.offset}</span>
              </div>
            </div>
            <p class="learn-calc-window-label">${w.label}</p>
            <p class="learn-calc-window-desc">${w.desc}</p>
          </div>
        `).join('');
        resultsEl.classList.remove('hidden');
      } catch (e) { console.error('[Learn] Calc error:', e); }
    });

    // ── Lesson Cards ───────────────────────────────────────────────────────

    container.querySelectorAll('.learn-lesson-card').forEach(card => {
      card.addEventListener('click', () => {
        try {
          const lessonId = card.dataset.lessonId;
          const lesson = LESSONS.find(l => l.id === lessonId);
          if (lesson) openLessonModal(lesson, getCompletedLessons(), container);
        } catch (e) { console.error('[Learn] Card click error:', e); }
      });
    });

    // ── Case Study Toggles ─────────────────────────────────────────────────

    container.querySelectorAll('.learn-case-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        try {
          e.stopPropagation();
          const idx = btn.dataset.caseIdx;
          const body = container.querySelector(`#learn-case-body-${idx}`);
          const isOpen = !body.classList.contains('hidden');
          body.classList.toggle('hidden');
          btn.textContent = isOpen ? 'Read More ▾' : 'Collapse ▴';
        } catch (e) { console.error('[Learn] Case toggle error:', e); }
      });
    });

    // ── Bookshelf Spines ──────────────────────────────────────────────────

    container.querySelectorAll('.learn-book-spine').forEach(spine => {
      spine.addEventListener('click', () => {
        try {
          const bookId = spine.dataset.bookId;
          const book = BOOKS.find(b => b.id === bookId);
          if (book) openBookModal(book, container);
        } catch (e) { console.error('[Learn] Book spine click error:', e); }
      });
    });

  } catch (e) {
    console.error('[Learn] Render error:', e);
    container.innerHTML = `<div class="learn-error">⚠️ Learn tab failed to load. Please refresh.</div>`;
  }
}
