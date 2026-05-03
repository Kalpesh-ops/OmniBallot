import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../components/Sidebar';

describe('Sidebar', () => {
    const mockOnToggle = jest.fn();
    const mockOnSuggestionClick = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the correct number of suggestions when open', () => {
        render(
            <Sidebar
                isOpen={true}
                onToggle={mockOnToggle}
                onSuggestionClick={mockOnSuggestionClick}
                hasStartedChat={false}
            />
        );

        // Expect 5 suggestion buttons + 1 toggle button = 6 buttons total
        const buttons = screen.getAllByRole('button');
        
        // 5 suggestions
        expect(screen.getByText('Voter Registration')).toBeInTheDocument();
        expect(screen.getByText('Polling Locations')).toBeInTheDocument();
        expect(screen.getByText('Election Timelines')).toBeInTheDocument();
        expect(screen.getByText('Ballot Information')).toBeInTheDocument();
        expect(screen.getByText('Voter ID Requirements')).toBeInTheDocument();
    });

    it('fires the mock callback function when a suggestion is clicked', () => {
        render(
            <Sidebar
                isOpen={true}
                onToggle={mockOnToggle}
                onSuggestionClick={mockOnSuggestionClick}
                hasStartedChat={false}
            />
        );

        const suggestionBtn = screen.getByText('Voter Registration').closest('button');
        expect(suggestionBtn).not.toBeNull();
        
        fireEvent.click(suggestionBtn!);

        expect(mockOnSuggestionClick).toHaveBeenCalledWith('How do I register to vote in my state?');
    });
});
