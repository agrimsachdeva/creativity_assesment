The telemetry measures are calculated using the following sources of data:

User Interactions:

Keystrokes: Captured from user input fields using keydown and keyup events.
Mouse Movements: Captured using mousemove, click, and scroll events.
Focus/Blur Events: Captured using window event listeners for focus and blur.
Visibility Changes: Captured using the visibilitychange event on the document.
User Messages:

The text entered by the user in the chat interface is analyzed for linguistic features such as word count, sentence count, emotional tone, and creativity indicators.
This text is processed in real-time when the user types or sends a message.
Task Context:

The current task type (e.g., convergent or divergent) and the associated word sets are used to calculate task progress and completion.
The currentWordSet and user responses are used to evaluate task-specific metrics.
System Metrics:

AI response times and latency are measured during interactions with the AI system.
Session duration is calculated from the session start time.
TelemetryCollector Class:

The TelemetryCollector class aggregates all these data points and generates a comprehensive telemetry object.

<!-- Details -->

User Information
userId: A unique identifier for the user. Generated when the user starts a session.
sessionId: A unique identifier for the session. Created at the beginning of each session to track user activity.
Device and Environment
language: The user's browser language setting. Captured using the navigator.language API.
platform: The user's operating system or device platform. Captured using the navigator.platform API.
timezone: The user's timezone. Captured using the Intl.DateTimeFormat().resolvedOptions().timeZone API.
viewport: The dimensions of the user's browser viewport. Captured using window.innerWidth and window.innerHeight.
devicePixelRatio: The ratio of physical pixels to device-independent pixels. Captured using window.devicePixelRatio.
screenResolution: The resolution of the user's screen. Captured using screen.width and screen.height.
connectionType: The type of network connection (e.g., 4G, Wi-Fi). Captured using the navigator.connection.effectiveType API.
Task Information
taskType: The type of task the user is performing (e.g., convergent). Set based on the current page or task context.
currentRound: The current round of the task. Updated as the user progresses through rounds.
taskProgress: The percentage of task completion. Calculated based on the number of completed rounds or steps.
taskCompletion: A boolean indicating whether the task is complete. Set to true when the user finishes all rounds.
Cognitive Load
cognitiveLoad: Metrics related to the user's cognitive effort:
longestPause: The longest pause between keystrokes. Calculated from keydown and keyup events.
taskSwitching: The number of times the user switches tasks or focus. Captured using focus and blur events.
thinkingPauses: Pauses in typing that indicate thinking. Derived from keystroke timing.
avgThinkingTime: Average time spent thinking before typing. Calculated from pause durations.
editingBehavior: Tracks user edits:
deletions: Number of backspaces.
revisions: Number of changes to existing text.
insertions: Number of new characters added.
cursorMovements: Number of cursor movements.
Mouse Activity
mouseActivity: Logs mouse movements and interactions:
x and y: Cursor coordinates.
type: Type of mouse event (e.g., move, click, scroll).
element: The DOM element under the cursor.
velocity: Speed of mouse movement. Calculated from position changes over time.
timestamp: Time of the event.
Typing Pattern
typingPattern: Metrics related to typing behavior:
pauseCount: Number of pauses during typing.
avgTypingSpeed: Average typing speed in characters per second.
backspaceCount: Number of backspaces used.
correctionRatio: Ratio of corrections to total keystrokes.
peakTypingSpeed: Maximum typing speed.
totalKeypresses: Total number of keypresses.
keystrokeDynamics: Detailed typing metrics:
rhythm: Consistency of typing speed.
dwellTimes: Time a key is held down.
flightTimes: Time between releasing one key and pressing the next.
Attention Tracking
attentionTracking: Metrics related to user attention:
focusEvents: Logs when the user focuses or blurs the application.
scrollBehavior: Tracks scroll positions and timestamps.
visibilityChanges: Logs when the application becomes visible or hidden.
Linguistic Features
linguisticFeatures: Analyzes the content of user messages:
charCount: Number of characters in the message.
wordCount: Number of words in the message.
avgWordLength: Average length of words.
emotionalTone: Sentiment analysis of the message:
neutral, negative, positive: Proportions of each tone.
sentenceCount: Number of sentences.
readabilityScore: A score indicating how easy the text is to read.
avgSentenceLength: Average number of words per sentence.
semanticComplexity: Complexity of the message's meaning.
vocabularyRichness: Diversity of vocabulary.
creativityIndicators: Metrics related to creativity:
ideaCount: Number of distinct ideas.
uniqueWords: Number of unique words.
metaphorCount: Number of metaphors used.
questionCount: Number of questions asked.
Interaction Sequence
interactionSequence: Logs user interactions in chronological order:
interactionType: Type of interaction (e.g., message_start, message_complete).
context: Additional context for the interaction (e.g., word count, message length).
duration: Time taken for the interaction.
sequenceNumber: Order of the interaction in the session.
Message Metrics
messageMetrics: Metrics related to user messages:
editCount: Number of edits made to the message.
responseTime: Time taken for the AI to respond.
messageLength: Length of the message in characters.
finalMessageDifferentFromFirst: Whether the final message differs from the initial draft.
Quality Metrics
qualityMetrics: Evaluates the quality of user responses:
coherenceScore: How logically connected the response is.
relevanceScore: How relevant the response is to the task.
creativityScore: How creative the response is.
Temporal Features
temporalFeatures: Tracks user activity over time:
Each entry contains:
x: Number of interactions.
y: Time elapsed.
z: Number of pauses.
t: Timestamp.
Current Word Set
currentWordSet: The current set of words for the task:
words: The three words presented to the user.
answer: The correct answer for the word set.
Session Duration
sessionDuration: Total time spent in the session. Calculated from the session start time.
Keystroke Sequence
keystrokeSequence: Logs individual keystrokes:
key: The key pressed.
type: Type of event (keydown or keyup).
timestamp: Time of the event.
isBackspace: Whether the key is a backspace.
isSpecialKey: Whether the key is a special key (e.g., Enter, Shift).