import DOMPurify from 'dompurify';

const MailBody = ({ body }: { body: string }) => {
    const sanitizedHTML = DOMPurify.sanitize(body, {
        ALLOWED_URI_REGEXP: /^(?:(?:(?:https?|ftp):)?\/\/|data:image\/|blob:|cid:)/i,
        ADD_ATTR: ['target', 'style'],
    });

    return (
        <div className="flex flex-col gap-4 overflow-hidden mt-4">
            <div
                className="text-sm sm:text-base text-foreground wrap-break-words prose dark:prose-invert max-w-none dark:[&_*]:!bg-transparent dark:[&_table]:!bg-transparent dark:[&_td]:!bg-transparent dark:[&_div]:!bg-transparent [&_*:not(a)]:!text-foreground [&_a]:!text-blue-500 [&_a]:!underline [&_a]:cursor-pointer"
                dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
            />
        </div>
    );
};

export default MailBody;