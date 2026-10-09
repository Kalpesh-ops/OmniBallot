export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export type LanguageCode = 'en' | 'es' | 'hi';

export interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    onSuggestionClick: (text: string) => void;
    language: LanguageCode;
    onLanguageChange: (lang: LanguageCode) => void;
}
