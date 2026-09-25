import { forwardRef } from 'react';
import { LinkIcon } from '@phosphor-icons/react';

type Props = {
    linkText: string;
    onLinkTextChange: (v: string) => void;
    linkUrl: string;
    onLinkUrlChange: (v: string) => void;
    onSubmit: () => void;
};

const LinkModalPopover = forwardRef<HTMLDivElement, Props>(({ linkText, onLinkTextChange, linkUrl, onLinkUrlChange, onSubmit }, ref) => (
    <div ref={ref} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-80 p-3 bg-background border border-border shadow-2xl rounded-xl flex flex-col gap-3">
        <div className="flex items-center border border-border rounded-md px-2 py-1 bg-transparent focus-within:ring-1 focus-within:ring-primary">
            <span className="text-muted-foreground mr-2 font-bold select-none">=</span>
            <input
                type="text"
                placeholder="Metin"
                value={linkText}
                onChange={(e) => onLinkTextChange(e.target.value)}
                className="flex-1 py-1 outline-none text-sm bg-transparent text-foreground placeholder:text-muted-foreground"
            />
        </div>

        <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center border border-border rounded-md px-2 py-1 bg-transparent focus-within:ring-1 focus-within:ring-primary">
                <LinkIcon className="text-muted-foreground mr-2 size-4" />
                <input
                    type="url"
                    placeholder="Bağlantı yazın veya yapıştırın"
                    value={linkUrl}
                    onChange={(e) => onLinkUrlChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); }}
                    className="flex-1 py-1 outline-none text-sm bg-transparent text-foreground placeholder:text-muted-foreground"
                />
            </div>
            <button
                type="button"
                onClick={onSubmit}
                disabled={!linkUrl}
                className="text-primary cursor-pointer font-semibold text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted rounded-md transition-colors"
            >
                Uygula
            </button>
        </div>
    </div>
));

export default LinkModalPopover;