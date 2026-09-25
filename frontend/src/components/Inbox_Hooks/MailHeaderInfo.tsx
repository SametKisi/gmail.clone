import { StarIcon } from '@phosphor-icons/react';
import { formatDateForDisplay } from '../../../../backend/utils/formatDateForDisplay.js';

type MailHeaderInfoProps = {
    avatarLetter: string;
    displayName: string;
    displayEmail: string;
    targetRecipient: string;
    date: unknown;
    isStarred: boolean;
    onToggleStar: () => void;
};

const MailHeaderInfo = ({ avatarLetter, displayName, displayEmail, targetRecipient, date, isStarred, onToggleStar }: MailHeaderInfoProps) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 relative w-full">
        <div className="flex items-start sm:items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg uppercase font-medium">
                {avatarLetter}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-2 min-w-0">
                    <span className="font-bold text-sm text-foreground truncate">{displayName}</span>
                    <span className="italic text-xs text-foreground truncate mt-0.5 sm:mt-0">{'<'}{displayEmail}{'>'}</span>
                </div>
                <span className="text-xs text-muted-foreground truncate mt-0.5 sm:mt-0">Alıcı: {targetRecipient}</span>
            </div>
        </div>

        <div className="absolute right-0 top-0 sm:relative sm:ml-auto flex items-center gap-1 sm:gap-3 shrink-0 bg-background/80 sm:bg-transparent px-1 sm:px-0 rounded-md">
            <span className="text-[11px] sm:text-xs text-muted-foreground font-medium whitespace-nowrap">{formatDateForDisplay(date)}</span>
            <StarIcon
                onClick={onToggleStar}
                size={20}
                weight={isStarred ? 'fill' : 'regular'}
                className={`select-none cursor-pointer box-content p-1 sm:p-2 transition-colors ${isStarred ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground hover:text-foreground'}`}
            />
        </div>
    </div>
);

export default MailHeaderInfo;