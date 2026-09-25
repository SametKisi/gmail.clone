import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';

const SearchBar = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const navigate = useNavigate();
    const location = useLocation();

    const isFirstRender = useRef(true);
    const isUserTyping = useRef(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        isUserTyping.current = true;
        setSearchTerm(e.target.value);
    };

    const executeSearch = useCallback((term: string, replace: boolean = false) => {
        if (term.trim()) {
            navigate(`/?search=${encodeURIComponent(term)}`, { replace });
        } else {
            navigate('/', { replace });
        }
    }, [navigate]);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            isUserTyping.current = true;
            executeSearch(searchTerm);
        }
    };

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (isUserTyping.current) {
            executeSearch(debouncedSearchTerm, true);
        }
    }, [debouncedSearchTerm, executeSearch]);


    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const hasSearchQuery = searchParams.has('search');

        if (location.pathname !== '/' || !hasSearchQuery) {
            isUserTyping.current = false;
            // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local input state to the URL (an external system via React Router), not deriving state from a prop
            setSearchTerm('');
        }
    }, [location.pathname, location.search]);

    const handleClear = () => {
        isUserTyping.current = true;
        setSearchTerm('');
        navigate('/');
    };

    return (
        <div className="flex-1 w-full max-w-40 sm:max-w-80 md:max-w-165 gmail-font text-foreground h-12 bg-muted md:ml-10 ml-2 rounded-full transition-all duration-300 ease-in-out focus-within:bg-background focus-within:shadow-[0_1px_3px_rgba(0,0,0,0.2)] flex items-center px-4">

            <MagnifyingGlassIcon
                onClick={() => {
                    isUserTyping.current = true;
                    executeSearch(searchTerm);
                }}
                className="text-muted-foreground size-5 cursor-pointer shrink-0"
            />

            <input
                type="text"
                placeholder="Mail ara"
                value={searchTerm}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="select-none text-foreground placeholder:text-muted-foreground bg-transparent border-none outline-none w-full px-3 h-full"
            />

            {searchTerm && (
                <XIcon
                    className="text-muted-foreground size-5 cursor-pointer hover:bg-card rounded-full p-1 box-content shrink-0 transition-colors"
                    onClick={handleClear}
                />
            )}
        </div>
    );
};

export default SearchBar;