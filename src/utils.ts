import type { Chat, Message } from './types';

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

export const simulateStreamingResponse = async (
  prompt: string,
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void
): Promise<void> => {
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
};
