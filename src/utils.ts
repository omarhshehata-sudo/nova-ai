import type { Chat, Message, Memory, MemoryCategory } from './types';

export const generateChatTitle = (firstMessage: string): string => {
  // Extract first 50 characters or first sentence, whichever is shorter
  const sentence = firstMessage.split(/[.!?]/)[0].trim();
  if (sentence.length > 50) {
    return sentence.substring(0, 50) + '...';
  }
  return sentence || 'New Chat';
};

export const createNewChat = (): Chat => {
  return {
    id: Date.now().toString(),
    title: 'New Chat',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

export const createMessage = (role: 'user' | 'assistant', content: string): Message => {
  return {
    id: Date.now().toString() + Math.random(),
    role,
    content,
    timestamp: Date.now(),
  };
};

export const simulateStreamingResponse = (
  prompt: string,
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void
): (() => void) => {
  let aborted = false;
  // Simulate various responses based on keywords
  let fullResponse = '';

  if (prompt.toLowerCase().includes('code') || prompt.toLowerCase().includes('react')) {
    fullResponse = `Here's a simple React component example:

\`\`\`jsx
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
\`\`\`

This component manages a counter state. Click the button to increment the count displayed on the screen.`;
  } else if (prompt.toLowerCase().includes('poem')) {
    fullResponse = `Spring Awakening

Gentle breezes kiss the land,
Blossoms burst where frost did stand,
Colors burst from dreams of night,
Dancing in the warming light.

Soft petals dance upon the breeze,
Singing songs among the trees,
Life returns with tender grace,
Painting smiles on nature's face.`;
  } else if (prompt.toLowerCase().includes('quantum')) {
    fullResponse = `Quantum Computing Explained

Quantum computers leverage quantum mechanics principles to process information differently than classical computers:

• **Qubits**: Unlike classical bits (0 or 1), qubits exist in superposition—simultaneously 0 and 1—until measured.

• **Entanglement**: Qubits can be entangled, meaning the state of one instantly affects others, enabling correlated processing.

• **Quantum Gates**: These manipulate qubit states to perform calculations, creating interference patterns that amplify correct answers.

• **Applications**: Quantum computers excel at optimization, cryptography, drug simulation, and machine learning tasks.

They're not faster at everything—they're specialized tools for specific problem classes.`;
  } else {
    fullResponse = `I appreciate your question: "${prompt}"

While I can't provide real API responses in this demo, this simulated response demonstrates how Nova handles streaming text. In a production environment, responses would come from an actual AI API.

Feel free to explore the interface—try asking about code, poems, quantum computing, or other topics to see different response types!`;
  }

  // Stream character by character with variable delays for natural feel
  let index = 0;
  const streamChar = () => {
    if (aborted) return;
    if (index < fullResponse.length) {
      const char = fullResponse[index];
      onChunk(char);
      index++;

      // Variable delay: slower for punctuation, faster for regular text
      const delay = ['.', '!', '?', ','].includes(char) ? 30 : Math.random() * 15 + 5;
      setTimeout(streamChar, delay);
    } else {
      onComplete(fullResponse);
    }
  };

  // Small delay before starting to stream (simulate API latency)
  setTimeout(streamChar, 200);

  // Return abort function
  return () => { aborted = true; };
};

/* ===== Memory extraction ===== */
const MEMORY_PATTERNS: { pattern: RegExp; category: MemoryCategory }[] = [
  { pattern: /my name is (.+)/i, category: 'personal' },
  { pattern: /i (?:am|'m) (?:a |an )?(\w[\w\s]{2,40})/i, category: 'personal' },
  { pattern: /i live in (.+)/i, category: 'personal' },
  { pattern: /i (?:like|love|enjoy|prefer) (.+)/i, category: 'preferences' },
  { pattern: /i (?:don'?t like|hate|dislike) (.+)/i, category: 'preferences' },
  { pattern: /i(?:'m| am) working on (.+)/i, category: 'projects' },
  { pattern: /my (?:project|app|website|startup) (?:is |called )?(.+)/i, category: 'projects' },
  { pattern: /i want to (.+)/i, category: 'goals' },
  { pattern: /my goal is (.+)/i, category: 'goals' },
  { pattern: /i(?:'m| am) learning (.+)/i, category: 'goals' },
  { pattern: /my favorite (.+)/i, category: 'preferences' },
  { pattern: /i speak (.+)/i, category: 'personal' },
  { pattern: /i use (.+?) (?:for|as|to)/i, category: 'preferences' },
];

export function extractMemories(message: string, existingMemories: Memory[]): Memory[] {
  const newMemories: Memory[] = [];
  const existingContents = new Set(existingMemories.map(m => m.content.toLowerCase()));

  for (const { pattern, category } of MEMORY_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      const content = match[0].trim();
      // Skip short or duplicate
      if (content.length < 8) continue;
      if (existingContents.has(content.toLowerCase())) continue;
      // Skip if very similar to existing
      const isDupe = existingMemories.some(m =>
        m.content.toLowerCase().includes(content.toLowerCase().slice(0, 20)) ||
        content.toLowerCase().includes(m.content.toLowerCase().slice(0, 20))
      );
      if (isDupe) continue;

      newMemories.push({
        id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
        content,
        category,
        createdAt: Date.now(),
      });
      existingContents.add(content.toLowerCase());
    }
  }

  return newMemories;
}

export function getMemoryContext(memories: Memory[]): string {
  if (memories.length === 0) return '';
  const lines = memories.map(m => `- [${m.category}] ${m.content}`);
  return `\n\nHere is what I know about the user:\n${lines.join('\n')}\n`;
}
