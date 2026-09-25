import React from 'react';
import { Link } from 'react-router-dom';
import { SquareIcon, CheckSquareIcon, StarIcon, TrashIcon, ArrowUUpLeftIcon } from '@phosphor-icons/react';
import { formatDateForDisplay } from '../../../backend/utils/formatDateForDisplay.js';

export const MailSkeleton = () => (
    <div className="animate-pulse flex items-center justify-between p-3 sm:p-4 border-b border-border bg-background ml-2 sm:ml-4 md:ml-7 mr-2 sm:mr-3">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-muted rounded shrink-0"></div>
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-muted rounded-full shrink-0"></div>
            <div className="w-20 sm:w-32 md:w-48 h-3 sm:h-4 bg-muted rounded shrink-0"></div>
            <div className="w-1/3 h-3 sm:h-4 bg-muted rounded min-w-20"></div>
        </div>
        <div className="flex items-center shrink-0 w-auto justify-end gap-1 sm:gap-2">
            <div className="hidden sm:block w-5 h-5 bg-muted rounded-full shrink-0"></div>
            <div className="w-12 sm:w-20 h-3 sm:h-4 bg-muted rounded shrink-0"></div>
        </div>
    </div>
);

interface MailData {
    id: string | number;
    from?: string;
    subject?: string;
    isStarred?: boolean;
    date?: string | Date;
    [key: string]: unknown;
}

interface MailProps {
    mail: MailData;
    isSelected?: boolean;
    onToggleSelect?: (id: string | number) => void;
    onDelete?: (id: string | number) => void;
    onToggleStar?: (id: string | number) => void;
    onRestore?: (id: string | number) => void;
    showStar?: boolean;
}

export const MailItem = ({
    mail,
    isSelected = false,
    onToggleSelect,
    onDelete,
    onToggleStar,
    onRestore,
    showStar = true
}: MailProps) => {
    const handleCheck = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onToggleSelect?.(mail.id); };
    const handleDelete = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onDelete?.(mail.id); };
    const handleStar = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onToggleStar?.(mail.id); };
    const handleRestore = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onRestore?.(mail.id); };

    return (
        <Link
            to={`/Inbox/${mail.id}`}
            state={{ mail }}
            className={`flex items-center gmail-font w-full border-t border-b py-2 sm:py-1 ${
                isSelected ? 'border-primary/30 bg-primary/10' : 'border-border hover:bg-muted/50'
            }`}
        >
            <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 ml-2 sm:ml-4 md:ml-7 h-full">
                {onToggleSelect && (
                    isSelected ? (
                        <CheckSquareIcon onClick={handleCheck} className="size-5 p-2 box-content cursor-pointer rounded-full shrink-0 text-primary hover:bg-primary/20" />
                    ) : (
                        <SquareIcon onClick={handleCheck} className="size-5 p-2 box-content cursor-pointer rounded-full shrink-0 text-muted-foreground hover:bg-muted" />
                    )
                )}

                {showStar && (
                    <div className='p-1 shrink-0' onClick={handleStar}>
                        <StarIcon
                            className={`size-4 sm:size-5 p-1 box-content rounded-full cursor-pointer transition-colors ${
                                mail.isStarred
                                ? 'fill-yellow-500 text-yellow-500 hover:bg-yellow-500/20'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                            weight={mail.isStarred ? 'fill' : 'regular'}
                        />
                    </div>
                )}

                <div className="text-foreground shrink-0 font-medium text-sm sm:text-base truncate w-20 sm:w-32 md:w-48">
                    {mail.from}
                </div>
                
                <div className="text-foreground text-sm sm:text-base truncate flex-1 min-w-0">
                    {mail.subject}
                </div>
            </div>

            <div className="flex items-center shrink-0 w-auto justify-end gap-1 sm:gap-2 mr-2 sm:mr-3">
                {onRestore && (
                    <ArrowUUpLeftIcon
                        onClick={handleRestore}
                        className="size-4 sm:size-5 text-primary p-1 box-content shrink-0 hover:bg-primary/20 rounded-full cursor-pointer"
                        weight="bold"
                    />
                )}
                {onDelete && (
                    <TrashIcon
                        onClick={handleDelete}
                        className="select-none size-4 sm:size-5 text-muted-foreground p-1 box-content shrink-0 hover:bg-muted rounded-full cursor-pointer hover:text-foreground"
                    />
                )}
                
                <div className="text-muted-foreground w-14 sm:w-24 text-right text-xs sm:text-sm truncate">
                    {formatDateForDisplay(mail.date)}
                </div>
            </div>
        </Link>
    );
};