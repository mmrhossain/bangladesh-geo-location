export function cachePublic(maxAge = 300) {
    return function setCacheHeaders(req, res, next) {
        res.set(
            "Cache-Control",
            `public, max-age=${maxAge}, stale-while-revalidate=86400`
        );
        next();
    };
}

export default cachePublic;
