import { AppError } from "../errors/AppError.js";

const DEFAULT_PAGE_SIZE = 50;
const NAME_LOCALE = "en";

function encodeCursor(item) {
    return Buffer.from(
        JSON.stringify({ n: item.name, c: item.code }),
        "utf8"
    ).toString("base64url");
}

function decodeCursor(cursor) {
    try {
        const raw = Buffer.from(cursor, "base64url").toString("utf8");
        const parsed = JSON.parse(raw);

        if (typeof parsed?.n !== "string" || typeof parsed?.c !== "string") {
            throw new Error("Invalid cursor payload");
        }

        return parsed;
    } catch {
        throw AppError.badRequest(
            "INVALID_CURSOR",
            "The pagination cursor is invalid"
        );
    }
}

function findStartIndex(items, cursor) {
    const index = items.findIndex(
        (item) =>
            item.name.localeCompare(cursor.n, NAME_LOCALE) > 0 ||
            (item.name === cursor.n &&
                item.code.localeCompare(cursor.c, NAME_LOCALE) > 0)
    );

    return index === -1 ? items.length : index;
}

export function paginate(items, { limit, cursor } = {}) {
    if (limit === undefined && !cursor) {
        return { items, meta: null };
    }

    const pageSize = limit ?? DEFAULT_PAGE_SIZE;
    const start = cursor ? findStartIndex(items, decodeCursor(cursor)) : 0;
    const page = items.slice(start, start + pageSize);
    const hasMore = start + page.length < items.length;

    return {
        items: page,
        meta: {
            limit: pageSize,
            hasMore,
            nextCursor:
                hasMore && page.length > 0
                    ? encodeCursor(page[page.length - 1])
                    : null,
        },
    };
}

export default paginate;
