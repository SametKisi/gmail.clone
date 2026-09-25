import { useEffect, type RefObject } from 'react';

export const useOutsideClick = <T extends HTMLElement>(
    ref: RefObject<T | null>,
    onOutsideClick: () => void,
    isActive: boolean = true
) => {
    useEffect(() => {
        if (!isActive) return;

        const handleClick = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onOutsideClick();
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [ref, onOutsideClick, isActive]);
};