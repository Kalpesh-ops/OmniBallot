export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    onSuggestionClick: (text: string) => void;
    hasStartedChat: boolean;
}
