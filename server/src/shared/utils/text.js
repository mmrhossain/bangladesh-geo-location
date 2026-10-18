const UNICODE_NON_WORD = /[^\p{L}\p{M}\p{N}\s]+/gu;

export function normalizeText(value) {
    return String(value ?? "")
        .normalize("NFKC")
        .toLowerCase()
        .replace(UNICODE_NON_WORD, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function buildSearchText(parts) {
    return normalizeText(parts.filter(Boolean).join(" "));
}

export function slugify(value, fallback = "") {
    const slug = String(value ?? "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    if (slug) {
        return slug;
    }

    return String(fallback ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function searchTokens(query) {
    return normalizeText(query).split(" ").filter(Boolean);
}
