export function hasStatus(err: unknown): err is { status?: number } {
    return typeof err === 'object' && err !== null && 'status' in err;
}