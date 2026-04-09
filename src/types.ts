export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  archived?: boolean;
}

export interface SidebarIcon {
  id: string;
  icon: string;
  label: string;
  ariaLabel: string;
}

export interface UserProfile {
  username: string;
  profilePic: string; // base64 or URL
  githubId?: string;
  githubUsername?: string;
  email?: string;
}

export interface GitHubAuth {
  token: string;
  user: {
    login: string;
    avatar_url: string;
    id: number;
  };
}
