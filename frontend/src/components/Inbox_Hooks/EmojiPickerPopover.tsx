import { forwardRef } from 'react';
import { EmojiPicker } from '@ferrucc-io/emoji-picker';

type EmojiSelectValue = string | { native?: string; emoji?: string };
type Props = { onSelect: (emoji: EmojiSelectValue) => void };

const EmojiPickerPopover = forwardRef<HTMLDivElement, Props>(({ onSelect }, ref) => (
    <div ref={ref} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 shadow-2xl rounded-lg bg-white dark:bg-zinc-900 border border-border">
        <EmojiPicker className="font-['Lato'] w-[380px] border-none" emojisPerRow={9} emojiSize={36} onEmojiSelect={onSelect}>
            <EmojiPicker.Header>
                <EmojiPicker.Input
                    placeholder="Search all emoji"
                    className="h-[36px] bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 w-full rounded-[8px] text-[15px] focus:shadow-[0_0_0_1px_#1d9bd1,0_0_0_6px_rgba(29,155,209,0.3)] dark:focus:shadow-[0_0_0_1px_#1d9bd1,0_0_0_6px_rgba(29,155,209,0.3)] focus:border-transparent focus:outline-none mb-1"
                    hideIcon
                />
            </EmojiPicker.Header>
            <EmojiPicker.Group>
                <EmojiPicker.List containerHeight={320} />
            </EmojiPicker.Group>
            <EmojiPicker.Preview>
                {({ previewedEmoji }) => (
                    <>
                        {previewedEmoji ? <EmojiPicker.Content /> : <button type="button" className="text-sm text-muted-foreground">Add Emoji</button>}
                        <EmojiPicker.SkinTone />
                    </>
                )}
            </EmojiPicker.Preview>
        </EmojiPicker>
    </div>
));

export default EmojiPickerPopover;