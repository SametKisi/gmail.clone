import {
    ArrowLeftIcon, BoxArrowDownIcon, WarningOctagonIcon,
    TrashIcon, EnvelopeIcon, FileArrowUpIcon, DotsThreeVerticalIcon,
} from '@phosphor-icons/react';

type MailToolbarProps = { onBack: () => void; onDelete: () => void };

const MailToolbar = ({ onBack, onDelete }: MailToolbarProps) => (
    <div className="flex items-center gap-1 sm:gap-2 md:gap-4 p-2 sm:p-3 -mx-4 sm:-mx-6 md:-mx-8 mb-4 border-b border-border overflow-x-auto scrollbar-hide min-w-0 shrink-0">
        <div onClick={onBack} className="p-2 shrink-0 rounded-full hover:bg-muted cursor-pointer ml-4 sm:ml-6 md:ml-8">
            <ArrowLeftIcon size={20} className="size-6 text-muted-foreground" />
        </div>
        <BoxArrowDownIcon size={20} className="hidden size-6 sm:block text-muted-foreground cursor-pointer hover:bg-muted rounded-full p-2 box-content shrink-0" />
        <WarningOctagonIcon size={20} className="hidden size-6 sm:block text-muted-foreground cursor-pointer hover:bg-muted rounded-full p-2 box-content shrink-0" />
        <TrashIcon onClick={onDelete} size={20} className="size-6 text-muted-foreground cursor-pointer hover:bg-muted rounded-full p-2 box-content shrink-0" />
        <div className="hidden sm:block w-px h-5 bg-border mx-1 shrink-0"></div>
        <EnvelopeIcon size={20} className="hidden size-6 md:block text-muted-foreground cursor-pointer hover:bg-muted rounded-full p-2 box-content shrink-0" />
        <FileArrowUpIcon size={20} className="hidden size-6 md:block text-muted-foreground cursor-pointer hover:bg-muted rounded-full p-2 box-content shrink-0" />
        <DotsThreeVerticalIcon size={20} className="size-6 text-muted-foreground cursor-pointer hover:bg-muted rounded-full p-2 box-content shrink-0 sm:ml-0 ml-auto mr-4 sm:mr-6 md:mr-8" />
    </div>
);

export default MailToolbar;