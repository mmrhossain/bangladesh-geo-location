export function sendSuccess(res, data, meta) {
    return res.json({
        status: "success",
        ...(meta ? { meta } : {}),
        data,
    });
}

export default sendSuccess;
