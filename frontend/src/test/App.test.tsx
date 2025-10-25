import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from '../App';

describe('App', () => {
    it('should render without crashing', () => {
        render(<App />);
        expect(screen.getByText(/Start writing your app here!/i)).toBeInTheDocument();
    });
});
