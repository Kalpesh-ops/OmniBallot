import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DisclaimerModal } from '../components/DisclaimerModal';

describe('DisclaimerModal', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        window.localStorage.clear();
    });

    it('renders by default when localStorage is empty', () => {
        render(<DisclaimerModal />);
        
        // Assert modal is in DOM
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Important Disclaimer')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /I Understand — Continue/i })).toBeInTheDocument();
    });

    it('removes the modal from the DOM and sets localStorage when accept button is clicked', async () => {
        render(<DisclaimerModal />);
        
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        
        const acceptBtn = screen.getByRole('button', { name: /I Understand — Continue/i });
        fireEvent.click(acceptBtn);
        
        // Assert modal is removed from DOM (wait for Framer Motion AnimatePresence exit)
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
        
        // Assert localStorage is updated
        expect(window.localStorage.getItem('omniballot-disclaimer-accepted')).toBe('true');
    });
});
