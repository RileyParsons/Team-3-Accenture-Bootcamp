import React from 'react';
import { useFormContext } from '../../context/FormContext';
import { validationEngine } from '../../utils/validation/validation';
import './NavigationControls.css';

export interface NavigationControlsProps {
    /**
     * Optional callback when navigation occurs
     */
    onNavigate?: (direction: 'previous' | 'next') => void;
}

/**
 * Checks if the current section has all required fields completed and valid
 * 
 * @param sectionId - The section identifier ('income', 'expenses', 'goals', 'review')
 * @param formState - The current form state
 * @returns true if section is valid and complete, false otherwise
 */
const isSectionValid = (sectionId: string, formState: any): boolean => {
    switch (sectionId) {
        case 'income':
            // At least one income source with valid data
            return formState.data.income?.sources?.some(
                (source: any) =>
                    source.name.trim().length > 0 &&
                    source.amount > 0 &&
                    ['weekly', 'bi-weekly', 'monthly', 'annual'].includes(source.frequency)
            ) ?? false;

        case 'expenses':
            // At least one category selected (predefined or custom)
            return (
                (formState.data.expenses?.selectedCategories?.length ?? 0) > 0 ||
                (formState.data.expenses?.customCategories?.length ?? 0) > 0
            );

        case 'goals':
            // At least one goal with valid data
            return formState.data.goals?.some(
                (goal: any) =>
                    goal.description.trim().length > 0 &&
                    goal.targetAmount > 0
            ) ?? false;

        case 'review':
            // Review section is always valid (it's just a summary)
            return true;

        default:
            return false;
    }
};

/**
 * NavigationControls component provides Previous and Next buttons
 * for navigating between form sections.
 * 
 * The Next button is disabled when required fields in the current section
 * are incomplete or invalid.
 * 
 * Requirements: 6.1, 6.2, 6.4
 */
export const NavigationControls: React.FC<NavigationControlsProps> = ({ onNavigate }) => {
    const { formState, nextSection, previousSection } = useFormContext();

    const currentSectionIndex = formState.currentSection;
    const currentSection = formState.sections[currentSectionIndex];
    const isFirstSection = currentSectionIndex === 0;
    const isLastSection = currentSectionIndex === formState.sections.length - 1;

    // Check if current section is valid for forward navigation
    const canGoNext = isSectionValid(currentSection.id, formState) && !isLastSection;
    const canGoPrevious = !isFirstSection;

    const handlePrevious = () => {
        if (canGoPrevious) {
            previousSection();
            onNavigate?.('previous');
        }
    };

    const handleNext = () => {
        if (canGoNext) {
            nextSection();
            onNavigate?.('next');
        }
    };

    return (
        <div className="navigation-controls" role="navigation" aria-label="Form navigation">
            <button
                type="button"
                className="navigation-controls__button navigation-controls__button--previous"
                onClick={handlePrevious}
                disabled={!canGoPrevious}
                aria-label="Go to previous section"
            >
                Previous
            </button>

            <button
                type="button"
                className="navigation-controls__button navigation-controls__button--next"
                onClick={handleNext}
                disabled={!canGoNext}
                aria-label="Go to next section"
            >
                Next
            </button>
        </div>
    );
};
