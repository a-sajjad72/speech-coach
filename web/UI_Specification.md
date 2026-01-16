# **SPEECHCOACH - COMPREHENSIVE FRONTEND UI SPECIFICATION**

## **Executive Summary**

SpeechCoach is a modern, responsive web-based language learning application built with Next.js and React. It features an AI-powered conversation practice interface with real-time chat, voice recording capabilities, full-screen call mode, and comprehensive settings management. The application is designed with a beautiful gradient color scheme (purple to orange) and supports mobile-first responsive design.

---

## **1. APPLICATION ARCHITECTURE**

### **1.1 Technology Stack**

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **UI Library:** React with shadcn/ui components
- **Styling:** Tailwind CSS
- **State Management:** React hooks (useState, useEffect)
- **Icons:** Lucide React
- **Package Manager:** npm


### **1.2 Main App Structure (app/page.tsx)**

The root component manages global state and view routing:

```typescript
AppView = "conversation" | "settings" | "history"
State Variables:
  - currentView: AppView (default: "conversation")
  - currentLanguage: string (default: "Spanish")
  - currentTopic: string (default: "Travel Planning")
  - selectedModel: string (default: "Llama-3-8B-Instruct (Q4_K_M)")
```

**View Navigation:**

- Routes between three main views via `setCurrentView()`
- Passes state and callbacks to each view component
- Maintains consistent background gradient across all views


---

## **2. MAIN CONVERSATION VIEW (DESKTOP & MOBILE)**

### **2.1 Layout Structure**

**Desktop (lg breakpoint and above):**

```plaintext
┌─────────────────────────────────────────────────┐
│ Fixed Left Sidebar (280px) │ Main Chat Area     │
│ - Logo                     │ - Chat Header      │
│ - Language Selection       │ - Message Display  │
│ - Topic Selection          │ - Feedback Buttons │
│ - Model Selection          │ - Chat Input       │
│ - Quick Actions            │ - Call Mode Button │
│ - Session Info             │                    │
└─────────────────────────────────────────────────┘
```

**Mobile (< 768px):**

```plaintext
┌──────────────────────────┐
│ Mobile Header            │
│ Menu + Title + Options   │
├──────────────────────────┤
│ Message Display (full)   │
├──────────────────────────┤
│ Chat Input               │
└──────────────────────────┘
Mobile Sidebar slides from left
```

### **2.2 Left Sidebar (Desktop Only)**

**Component:** `MainConversation.tsx` (sidebar section)**Dimensions:** Width: 320px, Hidden on md, Visible on lg+**Background:** `bg-white/60 backdrop-blur-xl`**Border:** `border-r border-purple-100`

#### **A. Sidebar Header (p-6)**

- **Logo Container:**

- Size: 48x48px circular
- Background: Gradient `from-purple-500 to-orange-500`
- Content: Sparkles icon (white)
- Margin bottom: 24px



- **Logo Text:**

- "SpeechCoach" (text-xl font-bold, gradient text)
- "AI Language Tutor" (text-sm text-gray-500)





#### **B. Language Selection**

- **Label:** "Language" (text-sm text-gray-600)
- **Badge Display:**

- Format: `🌍 {currentLanguage}`
- Background: `bg-gradient-to-r from-purple-500 to-purple-600`
- Text color: white
- Border radius: rounded-full
- Clickable to toggle dropdown



- **Dropdown Trigger:** Toggle button with Globe icon
- **Languages Available (12 total):**

- Spanish, French, German, Italian, Portuguese, Japanese, Korean, Chinese, Russian, Arabic, Hindi, Dutch



- **Behavior:**

- Clicking language changes state
- Backend call: `POST /conversations/create` with new language
- Clears previous conversation
- Shows new greeting in selected language





#### **C. Topic Selection**

- **Label:** "Topic" (text-sm text-gray-600)
- **Badge Display:**

- Format: `📚 {currentTopic}`
- Border: `border-orange-200`
- Text: `text-orange-700`
- Hover: `bg-orange-50`
- Clickable to toggle



- **Default Topics (10 options):**

- Travel Planning, Restaurant Dining, Job Interview, Shopping & Markets, Medical Appointments, Business Meetings, Social Conversations, Academic Discussions, Daily Routines, Hobbies & Interests



- **Custom Topic Input:**

- Input placeholder: "Or enter custom topic..."
- Border: `border-orange-200`
- Submit on Enter key or Send button click
- Send button: Gradient `from-orange-500 to-red-500`



- **Behavior:**

- Topic change triggers conversation reset
- Backend: Conversation updated with new topic





#### **D. Model Selection**

- **Label:** "Model" (text-sm text-gray-600)
- **Badge Display:**

- Format: `🤖 {modelName}` (first word only)
- Border: `border-gray-200`
- Text: `text-gray-600`
- Rounded: rounded-full



- **Available Models (4 options):**

1. Llama-3-8B-Instruct (Q4_K_M)
2. Mistral-7B-Instruct-v0.3
3. CodeLlama-13B-Instruct
4. Llama-3-70B-Instruct (Q4_K_M)



- **Behavior:**

- Model change via `POST /models/select`
- Takes effect immediately
- Updates default in user settings





#### **E. Quick Actions (p-6)**

Four buttons with icons and text:

1. **View History**

1. Icon: History (4x4)
2. Text: "View History"
3. Action: Navigate to history view
4. Hover: `hover:text-purple-600 hover:bg-purple-50`



2. **Settings**

1. Icon: Settings (4x4)
2. Text: "Settings"
3. Action: Navigate to settings view
4. Hover: `hover:text-purple-600 hover:bg-purple-50`



3. **Change Topic**

1. Icon: Plus (4x4)
2. Text: "Change Topic"
3. Action: Toggle topic selector
4. Hover: `hover:text-orange-600 hover:bg-orange-50`



4. **Start Call Mode**

1. Icon: Phone (4x4)
2. Text: "Start Call Mode"
3. Action: Opens full-screen call overlay
4. Hover: `hover:text-teal-600 hover:bg-teal-50`





#### **F. Session Info Box (mt-auto)**

- **Position:** Bottom of sidebar
- **Background:** `bg-gradient-to-r from-purple-50 to-orange-50`
- **Rounded:** rounded-2xl
- **Padding:** p-4
- **Contents:**

- Title: "Current Session" (text-sm font-semibold)
- **Messages Count:** `{messages.length}` (text-purple-600)
- **Status:** "Active" (text-green-600)





---

### **2.3 Chat Header (Desktop & Mobile)**

**Component:** `MainConversation.tsx` (header section)**Background:** `bg-white/80 backdrop-blur-xl`**Border:** `border-b border-purple-100`**Padding:** `p-4 md:p-6`

#### **A. Left Section**

- **Mobile Menu Button:** (hidden on lg+)

- Icon: Menu (5x5)
- Action: Opens mobile sidebar
- Styling: `text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full`



- **Title & Subtitle:**

- Title: "Practice Session" (text-lg md:text-xl font-semibold)
- Subtitle: "Practicing language • Topic: topic" (text-xs md:text-sm text-gray-500)





#### **B. Right Section**

- **Call Mode Button:**

- Icon: Phone (4x4)
- Text: "Call Mode"
- Background: `bg-gradient-to-r from-teal-500 to-cyan-500`
- Hover: `from-teal-600 to-cyan-600`
- Size: sm
- Action: Opens `CallModeOverlay`



- **Session Menu (Three Dots):**

- Icon: MoreVertical (5x5)
- Styling: `hover:text-purple-600 hover:bg-purple-50`
- Dropdown menu with 5 options (see Section 2.6)





---

### **2.4 Message Display Area**

**Container:**

- Full width, flexible height
- Overflow: `overflow-y-auto`
- Padding: `p-3 md:p-6`
- Max width: `max-w-4xl mx-auto`
- Background: Gradient `from-purple-50 via-white to-orange-50`
- Spacing between messages: `space-y-4 md:space-y-6`


#### **A. User Messages (Right Aligned)**

- **Alignment:** `justify-end`
- **Max width:** `max-w-[85%] md:max-w-[70%]`
- **Margin left:** `ml-4 md:ml-20`
- **Message Bubble:**

- Background: `bg-gradient-to-r from-purple-500 to-purple-600`
- Text color: white
- Border radius: `rounded-2xl md:rounded-3xl`
- Padding: `p-3 md:p-5`
- Shadow: `shadow-lg border-0`



- **Message Content:**

- Text: `leading-relaxed`
- Timestamp: `text-xs`, `text-purple-100`
- Alignment: Flex between text and time





#### **B. AI Messages (Left Aligned)**

- **Alignment:** `justify-start`
- **Max width:** `max-w-[85%] md:max-w-[70%]`
- **Margin right:** `mr-4 md:mr-20`
- **Message Bubble:**

- Background: white with shadow
- Text color: `text-gray-800`
- Border radius: `rounded-2xl md:rounded-3xl`
- Padding: `p-3 md:p-5`
- Shadow: `shadow-lg shadow-purple-100`



- **Message Content:**

- Text: `leading-relaxed`
- Timestamp: `text-xs text-gray-500`



- **Audio Controls (for AI messages):**

- **Play Button:**

- Icon: Volume2 (3x3)
- Text: "Listen" or "Playing"
- Styling:

- When playing: `bg-orange-100 text-orange-600`
- When idle: `hover:bg-gray-100 text-gray-600`



- Size: Small (8x8, px-3)



- **Audio Visualizer (when playing):**

- Shows animated bars
- Gradient: `from-purple-500 to-orange-500`
- Size: Small (sm)
- 8 animated bars with varying heights
- Updates every 100ms








#### **C. Processing State**

When waiting for AI response:

- **Message bubble:** White with gray text
- **Content:** "Processing your speech..."
- **Animation:** Shows animated audio visualizer
- **Opacity:** Slightly transparent


#### **D. Message Auto-Scroll**

- Refs to last message: `messagesEndRef`
- Scrolls to bottom on new messages
- Animation: smooth scroll behavior


---

### **2.5 Feedback Buttons**

**Component:** `FeedbackButtons.tsx`**Location:** Above chat input (when messages.length > 1)**Background:** `bg-white/60 backdrop-blur-sm`**Border:** `border-t border-purple-100`**Padding:** `px-6 py-4`**Layout:** Flexbox centered, `space-x-3`

**Three Buttons (outline style):**

1. **Grammar Help**

1. Icon: BookOpen (green, 3x3)
2. Text: "Grammar Help"
3. Border: `border-green-200`
4. Text color: `text-green-700`
5. Hover: `bg-green-50`
6. Border radius: rounded-full
7. Size: sm, px-4, py-2
8. Action: `onFeedbackRequest("grammar")`



2. **Fluency Tips**

1. Icon: Zap (blue, 3x3)
2. Text: "Fluency Tips"
3. Border: `border-blue-200`
4. Text color: `text-blue-700`
5. Hover: `bg-blue-50`
6. Border radius: rounded-full
7. Action: `onFeedbackRequest("fluency")`



3. **Correct Me**

1. Icon: MessageSquare (orange, 3x3)
2. Text: "Correct Me"
3. Border: `border-orange-200`
4. Text color: `text-orange-700`
5. Hover: `bg-orange-50`
6. Border radius: rounded-full
7. Action: `onFeedbackRequest("correction")`





**Backend Call:**

- `POST /conversations/{conversationId}/feedback`
- Request body:

```json
{
  "type": "grammar" | "fluency" | "correction",
  "lastMessageId": "msg-id"
}
```


- Response adds new AI message with feedback


---

### **2.6 Chat Input Area**

**Component:** `ChatInput.tsx`**Background:** `bg-white/80 backdrop-blur-xl`**Border:** `border-t border-purple-100`**Padding:** `p-4 md:p-6`

#### **A. Recording Indicator**

When `isRecording === true`:

- **Background:** `bg-red-50`
- **Border:** `border border-red-200`
- **Padding:** `px-4 py-3`
- **Border radius:** rounded-xl
- **Content:**

- Red pulsing dot (2x2, animate-pulse)
- Text: "Recording in progress..."
- Audio visualizer on the right (small)





#### **B. Text Input Section**

- **Layout:** Flexbox with items-end
- **Spacing:** `space-x-2 md:space-x-3`
- **Text Input:**

- Placeholder: "Type your message or use voice..."
- Disabled when recording or processing
- Border: `border-purple-200`
- Focus: `border-purple-400 ring-purple-400`
- Border radius: rounded-xl
- Disabled state: reduced opacity





#### **C. Send Text Button**

- **Icon:** Send (4x4)
- **Background:** `bg-gradient-to-r from-purple-500 to-orange-500`
- **Hover:** `from-purple-600 to-orange-600`
- **Border radius:** rounded-xl
- **Padding:** px-3 md:px-4, h-10 md:h-11
- **Disabled when:**

- Text input is empty
- isRecording is true
- isProcessing is true



- **Action:** Calls `onSendText(textInput)`


#### **D. Voice Record Button**

- **Icon:** Mic (4x4)
- **Border radius:** rounded-full
- **Padding:** px-3 md:px-4, h-10 md:h-11
- **Disabled when:** isProcessing is true
- **Styling:**

- **Not Recording:**

- Background: `bg-gradient-to-r from-teal-500 to-cyan-500`
- Hover: `from-teal-600 to-cyan-600`



- **Recording (isRecording === true):**

- Background: `bg-gradient-to-r from-red-500 to-pink-500`
- Hover: `from-red-600 to-pink-600`
- Animation: `animate-pulse`






- **Action:** Calls `onStartVoiceRecording()`


#### **E. Helper Text**

- **Content:** "Press Enter to send or use the voice button"
- **Color:** `text-gray-500`
- **Font size:** text-xs md:text-sm
- **Margin top:** mt-3
- **Alignment:** text-center


---

### **2.7 Session Menu (Dropdown)**

**Component:** `SessionMenu.tsx`**Trigger:** Three-dots button in chat header**Menu styling:**

- Width: w-56
- Border radius: rounded-2xl
- Border: `border-purple-100`
- Separator: `bg-purple-100`


**Menu Items (5 items):**

1. **Export Conversation**

1. Icon: Download (blue, 4x4)
2. Text: "Export Conversation"
3. Hover: `bg-blue-50`
4. Action: Downloads JSON file with conversation
5. File format: `conversation-{date}.json`



2. **Copy to Clipboard**

1. Icon: Copy (cyan, 4x4)
2. Text: "Copy to Clipboard"
3. Hover: `bg-cyan-50`
4. Action: Copies full conversation text



3. **Report Issue**

1. Icon: AlertCircle (amber, 4x4)
2. Text: "Report Issue"
3. Hover: `bg-amber-50`
4. Action: Opens report dialog (backend: `POST /issues`)



4. **Reset Session**

1. Icon: RotateCcw (orange, 4x4)
2. Text: "Reset Session"
3. Hover: `bg-orange-50`
4. Action: Confirmation dialog, then starts new conversation
5. Keeps language/topic/model settings



5. **Clear Conversation**

1. Icon: Trash2 (red, 4x4)
2. Text: "Clear Conversation" (font-medium, text-red-600)
3. Hover: `bg-red-50`
4. Action: Confirmation dialog, clears all messages
5. Does NOT reset settings





---

## **3. CALL MODE OVERLAY**

**Component:** `CallModeOverlay.tsx`**Visibility:** Full-screen overlay (fixed, inset-0)**Z-index:** z-50**Trigger:** "Start Call Mode" button or header "Call Mode" button

### **3.1 Background & Layout**

- **Background:** `bg-gradient-to-br from-purple-900 via-purple-700 to-orange-600`
- **Layout:** Flexbox column, centered
- **Content:** Absolutely positioned header, centered main content, bottom tips


### **3.2 Header Section**

**Position:** `absolute top-6 left-6 right-6`**Layout:** Flex justify-between

- **Left Section:**

- Title: "Practice Call" (text-lg font-semibold text-white)
- Subtitle: "language • topic" (text-sm text-purple-100)



- **Right Section (Duration Display):**

- Duration: Monospace font (MM:SS format) (text-2xl font-mono font-bold text-white)
- Label: "Duration" (text-xs text-purple-100)
- Format: Hours not shown if < 1 hour
- Example: "12:35"





### **3.3 Main Content (Center)**

#### **A. AI Avatar & Status**

- **Avatar Circle:**

- Size: 128x128px (w-32 h-32)
- Background: Gradient `from-purple-400 to-orange-400`
- Animation: `animate-pulse`
- Inner circle: w-28 h-28, `bg-white/20`
- Icon: Volume2 (white, 12x12)



- **Status Text:**

- "AI is speaking..." OR "Your turn to speak"
- Font: text-lg font-semibold text-white
- Margin bottom: mb-4





#### **B. Audio Visualizer**

- **Size:** Large (lg)
- **Active state:** Shows when `isAISpeaking === true`
- **Styling:** 8 animated bars, gradient `from-purple-500 to-orange-500`
- **Margin bottom:** mb-6


#### **C. Instructions Text**

- **Content:**

- If AI speaking: "Listen to the AI tutor's response"
- If user's turn: "Speak clearly and naturally (up to 30 seconds)"



- **Font:** text-sm text-purple-100


### **3.4 Control Buttons**

**Layout:** Flex centered, `space-x-4 md:space-x-6`**Margin bottom:** mb-12

#### **1. Mute Button**

- **Size:** 16x16 (w-16 h-16) or md:20x20 (md:w-20 md:h-20)
- **Border radius:** rounded-full
- **Transitions:** `transition-all`
- **When Muted (isMuted === true):**

- Background: `bg-red-500`
- Hover: `bg-red-600`
- Icon: MicOff (white, 8x8 or 10x10)



- **When Not Muted:**

- Background: `bg-white/20`
- Hover: `bg-white/30`
- Border: `border border-white/30`
- Icon: Mic (white, 8x8 or 10x10)





#### **2. End Call Button**

- **Size:** 20x20 (w-20 h-20) or md:24x24 (md:w-24 md:h-24)
- **Border radius:** rounded-full
- **Background:** `bg-red-500`
- **Hover:** `bg-red-600 hover:scale-105`
- **Shadow:** shadow-2xl
- **Icon:** Phone (white, 10x10 or 12x12), rotated 135 degrees (`rotate-135`)
- **Action:** Calls `onCallEnd()`, closes overlay
- **Saves conversation automatically**


#### **3. Volume Control**

- **Layout:** Flex column, centered, `space-y-2`
- **Volume Up Button:**

- Size: 10x10 (w-10 h-10)
- Border radius: rounded-full
- Background: `bg-white/20`
- Hover: `bg-white/30`
- Border: `border-white/30`
- Icon: Volume2 (white, 5x5)
- Action: `setVolume(Math.min(100, volume + 10))`



- **Volume Slider:**

- Width: w-20 or md:w-24
- Height: h-1
- Background: `bg-white/20`
- Accent: `accent-orange-400`
- Range: 0-100
- Styling: rounded-full



- **Volume Display:**

- Font: text-xs text-white font-semibold
- Format: "volume%"
- Example: "85%"





### **3.5 Call Tips Box**

**Position:** `absolute bottom-6 left-6 right-6 max-w-md mx-auto`**Background:** `bg-white/10 backdrop-blur-xl`**Border:** `border border-white/20`**Rounded:** rounded-xl**Padding:** p-4

- **Title:** "Call Tips" (text-sm font-semibold text-white)
- **Tips List:**

1. "Speak naturally and at a comfortable pace"
2. "The AI will provide feedback after each exchange"
3. "Use the mute button if you need a moment"
4. "Click the red button to exit and save the conversation"



- **Font:** text-xs text-purple-100, `space-y-1`


### **3.6 Call Mode Logic**

- **Duration:** Updates every 1 second via `setInterval`
- **AI Speaking:** Toggles every 4 seconds (simulated pattern)
- **On End Call:**

- Fetches conversation from backend: `GET /conversations/{conversationId}`
- Merges with existing messages
- Closes overlay
- Returns to main chat view with updated messages





---

## **4. MOBILE SIDEBAR**

**Component:** `MobileSidebar.tsx`**Trigger:** Hamburger menu button (hidden on lg+)**Implementation:** Sheet component (side="left")

### **4.1 Structure**

- **Width:** w-80 (320px)
- **Background:** `bg-white/95 backdrop-blur-xl`
- **Animation:** Slides in from left


### **4.2 Sections**

Identical to desktop sidebar:

1. Header (with close button X)
2. Language selection
3. Topic selection
4. Model selection
5. Quick actions
6. Session info


**Key Differences from Desktop:**

- Compact text in badges (truncated topics)
- Close button (X icon) to dismiss
- Touch-friendly spacing
- No "Start Call Mode" button (available in header on mobile)


---

## **5. SETTINGS VIEW**

**Component:** `ModelSettings.tsx`**Navigation:** Accessed via "Settings" button

### **5.1 Layout**

**Desktop:**

- Left sidebar (272px) with tab navigation
- Main content area (flex-1) with settings
- Bottom system status box


**Mobile:**

- Horizontal tab navigation at top
- Full-width content below tabs


### **5.2 Left Navigation Tabs**

Six tabs with icons:

1. **AI Models** (Brain icon)

1. Shows model browser with search
2. Displays system info
3. Model cards with download/delete options



2. **Default Language** (Globe icon)

1. Language selector dropdown
2. Current language display



3. **Audio Settings** (Volume2 icon)

1. Microphone device selector
2. Speaker device selector
3. Input/output volume sliders (0-100)



4. **System Info** (Cpu icon)

1. Hardware specs display
2. RAM, CPU, GPU information
3. System status



5. **Storage & Paths** (Database icon)

1. Models path display
2. Data path
3. Cache size info
4. Total sessions and practice time



6. **About** (Sparkles icon)

1. Version number
2. Platform info
3. Supported languages count
4. Support email link





### **5.3 Models Tab Details**

**Search Bar:**

- Placeholder: "Search models..."
- Real-time filtering


**System Information Card:**

- Grid layout: 3 columns (md responsive)
- RAM Available
- Processor
- AI Status (shows "Ready")


**Model Cards:**

- Grid: 1 col, 2 cols on lg
- Each card shows:

- Model name
- "Recommended" badge (if applicable)
- Family (e.g., "Llama")
- RAM required badge
- Description
- Download progress bar (if downloading)
- Action buttons:

- "Use Model" (if downloaded and not selected)
- "Download" (if not downloaded)
- "Delete" (if downloaded)






- Selected model: Ring highlight `ring-2 ring-purple-400`


### **5.4 Mobile Tab Navigation**

- Horizontal scroll
- Flex with space-x-1
- Button per tab with icon + label
- Active tab: white background
- Inactive: gray text


---

## **6. CONVERSATION HISTORY VIEW**

**Component:** `ConversationHistory.tsx`**Navigation:** Accessed via "View History" button

### **6.1 Header Section**

- **Back Button:** Returns to main conversation
- **Title:** "Conversation History"
- **Subtitle:** "Review your practice sessions"
- **Session Count Badge:** "count Sessions"
- **Filter Button:** (icon only)


### **6.2 Search & Filters**

- **Search Input:**

- Placeholder: "Search conversations..."
- Real-time filtering by topic/language
- Icon: Search (4x4)



- **View Toggle:**

- "Grid" button
- "List" button
- Active button: filled, inactive: outline





### **6.3 Grid View**

- **Layout:** 1 col (mobile), 2 cols (tablet), 3 cols (lg), 4 cols (xl)
- **Gap:** gap-4 lg:gap-6


**Session Card:**

- **Background:** `bg-white/60 backdrop-blur-sm`
- **Rounded:** rounded-2xl
- **Padding:** p-4 lg:p-6
- **Contents:**

- **Language Badge:** Gradient `from-teal-500 to-cyan-500`, rounded-full
- **More Options Button:** Three dots
- **Topic Title:** Line clamp 2
- **Date:** Small gray text
- **Duration Badge:** Orange background with Clock icon
- **Message Count:** Purple background badge



- **Hover Effect:**

- `hover:shadow-xl hover:scale-105`
- Cursor pointer



- **On Click:** Shows detailed session view


### **6.4 List View**

- **Layout:** Vertical stack, full-width cards
- **Gap:** gap-3 lg:gap-4


**Session Row:**

- **Left Section:**

- Calendar icon (background gradient)
- Topic title (truncate)
- Date + language badge



- **Right Section:**

- Duration (hidden on mobile)
- Message count (hidden on tablet)
- More options button



- **Hover Effect:** `hover:shadow-lg`


### **6.5 Detailed Session View**

Triggered by selecting a session

**Header:**

- **Back Button:** "← Back to History"
- **Topic Title:** Large, bold
- **Metadata Badges:**

- Date (calendar icon, blue background)
- Duration (clock icon, green background)
- Language (teal gradient)



- **Action Buttons:**

- **Export:** Blue gradient, downloads JSON
- **Delete:** Red gradient, with confirmation





**Messages Display:**

- **Layout:** Identical to main chat messages
- **User messages:** Right aligned, purple gradient
- **AI messages:** Left aligned, white background
- **Full message history visible**


### **6.6 Empty State**

- **Icon:** Large calendar (centered)
- **Title:** "No Conversations Found"
- **Subtitle:** "Try adjusting your search terms"


---

## **7. DATA FLOW & STATE MANAGEMENT**

### **7.1 Message Object Structure (Frontend)**

```typescript
interface Message {
  id: string // Unique identifier
  type: "user" | "ai" // Message source
  text: string // Message content
  timestamp: Date // When message was sent/received
  isPlaying?: boolean // Audio playback state
  audioUrl?: string // URL to audio file
}
```

### **7.2 Conversation Session (Frontend)**

```typescript
interface ConversationSession {
  id: string
  date: Date
  language: string
  topic: string
  duration: string // "12 min"
  messageCount: number
  messages: Message[]
}
```

### **7.3 Main Conversation State**

```typescript
State Variables:
  - messages: Message[] (initially empty)
  - isRecording: boolean (default: false)
  - isProcessing: boolean (default: false)
  - showMobileSidebar: boolean (default: false)
  - showLanguageSelect: boolean (default: false)
  - showTopicSelect: boolean (default: false)
  - showModelSelect: boolean (default: false)
  - customTopic: string (default: "")
  - isCallModeOpen: boolean (default: false)
  - pendingCallMessages: Message[] (accumulated during call)
```

### **7.4 API Call Flow**

**1. New Message (Text or Voice):**

```plaintext
User sends message
  ↓
isProcessing = true
  ↓
POST /conversations/{id}/messages
  {
    type: "text" | "voice"
    content: string | audioBlob
  }
  ↓
Response contains:
  {
    userMessage: Message
    aiResponse: Message
  }
  ↓
Add both to messages array
isProcessing = false
Auto-scroll to bottom
```

**2. Call Mode:**

```plaintext
User clicks "Start Call Mode"
  ↓
WebSocket connection to /ws/call/{conversationId}
  ↓
Send "START_CALL" event
  ↓
Receive "CALL_STARTED" event
  ↓
CallModeOverlay opens
  ↓
Audio exchange happens
  ↓
User clicks end call
  ↓
Send "END_CALL" event
  ↓
Receive "CALL_ENDED" event
  ↓
GET /conversations/{id} (fetch full conversation)
  ↓
Close overlay
Messages updated in main view
```

**3. Settings Change:**

```plaintext
User changes language/topic/model
  ↓
POST /conversations/create (new conversation)
  ↓
New conversation ID returned
  ↓
Clear messages array
  ↓
Show new greeting message
```

---

## **8. RESPONSIVE DESIGN BREAKPOINTS**

```plaintext
Mobile: < 768px (no md: prefix)
Tablet: 768px - 1023px (md: prefix)
Desktop: 1024px+ (lg: prefix)
Extra Large: 1536px+ (xl: prefix)
```

**Key Breakpoints Usage:**

| Element | Mobile | Tablet | Desktop
|-----|-----|-----|-----
| Sidebar | Hidden | Hidden | Visible
| Chat Width | 85% | 75% | 70%
| Message Padding | p-3 | p-3 | p-5
| Font Size | text-sm | text-base | text-base
| Input Height | h-10 | h-10 | h-11
| Rounded Corners | rounded-2xl | rounded-2xl | rounded-3xl


---

## **9. COLOR SCHEME & DESIGN TOKENS**

### **9.1 Color Palette**

| Name | Value | Usage
|-----|-----|-----|-----
| Purple Primary | `#A855F7` | Main brand, gradients
| Orange Accent | `#F97316` | CTA buttons, accents
| Teal Secondary | `#14B8A6` | History, call mode
| Green Success | `#10B981` | Status indicators, success
| Red Error | `#EF4444` | Delete, errors, stop
| White | `#FFFFFF` | Cards, backgrounds
| Gray (50-900) | Scale | Neutrals, text


### **9.2 Gradients**

**Primary Gradient:** `from-purple-500 to-orange-500`**Teal Gradient:** `from-teal-500 to-cyan-500`**Background:** `from-purple-50 via-white to-orange-50`**Dark (Call Mode):** `from-purple-900 via-purple-700 to-orange-600`

### **9.3 Shadows & Effects**

- **Standard Shadow:** `shadow-lg`
- **Purple Tint Shadow:** `shadow-purple-100`
- **Backdrop:** `backdrop-blur-xl`
- **Opacity Backgrounds:** `bg-white/60`, `bg-white/80`, `bg-white/20`


---

## **10. ANIMATION & TRANSITIONS**

- **Pulse Animation:** `animate-pulse` (mute button, avatar)
- **Transitions:** `transition-all duration-300`
- **Hover Scale:** `hover:scale-105` (cards)
- **Message Fade:** Implicit CSS transitions
- **Visualizer Animation:** 100ms interval, smooth bar transitions
- **Button Transforms:** Color and shadow on hover


---

## **11. ACCESSIBILITY FEATURES**

- **ARIA Labels:** All buttons have `aria-label` or text
- **Focus States:** All interactive elements have visible focus rings
- **Screen Readers:** Semantic HTML, proper heading hierarchy
- **Color Contrast:** WCAG AA compliant
- **Touch Targets:** Minimum 44px on mobile
- **Keyboard Navigation:** Full keyboard support
- **Icon + Text:** All important icons paired with text labels


---

## **12. FORM INPUTS & VALIDATION**

### **Text Input Styling**

```plaintext
Default: border-purple-200
Focus: border-purple-400 focus:ring-purple-400
Disabled: opacity-50, cursor-not-allowed
```

### **Select/Dropdown**

```plaintext
Trigger: Button with caret/chevron
Content: Rounded dropdown menu
Items: Hover highlight effect
Keyboard: Arrow keys to navigate
```

### **Slider Input**(Volume)

```plaintext
Range: 0-100
Accent: color from gradient (orange-400)
Thumb: Interactive, draggable
Label: Shows current value
```

---

## **13. LOADING & ERROR STATES**

### **Loading States**

- **Processing:** Shows "Processing your speech..." + visualizer
- **Downloading:** Progress bar with percentage
- **Recording:** Red pulsing indicator


### **Error States**(When Implemented)

- Error toast notification
- Red border on failed input
- Error message with icon


### **Empty States**

- No conversations: Calendar icon + message
- No search results: Same empty state


---

## **14. KEYBOARD SHORTCUTS**

| Shortcut | Action
|-----|-----|-----|-----
| Enter | Send text message
| Shift+Enter | New line in text input
| Esc | Close mobile sidebar, close menu
| Ctrl+K / Cmd+K | Focus search (future)


---

## **15. BROWSER SUPPORT**

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari, Chrome Mobile


---

## **16. PERFORMANCE METRICS**

- **First Contentful Paint:** < 2 seconds
- **Time to Interactive:** < 3 seconds
- **Lighthouse Score:** Target 90+
- **Message Rendering:** < 100ms per message
- **Call Mode Startup:** < 1 second


---

## **17. FUTURE UI ENHANCEMENTS**

- Real-time transcription display during recording
- Progress dashboard with learning analytics
- User profile and account management page
- Theme switcher (light/dark mode)
- Notification center
- Keyboard shortcuts panel
- Session replay feature
- Conversation sharing/collaboration
- Mobile app (React Native/Flutter)


---

This comprehensive specification provides the backend team with complete understanding of the UI layout, components, interactions, and data flows. All API calls, state management patterns, and user interactions are clearly documented for seamless backend implementation.