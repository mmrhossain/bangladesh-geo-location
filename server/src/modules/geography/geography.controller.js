import { sendSuccess } from "../../shared/http/response.js";
import { asyncHandler } from "../../shared/http/asyncHandler.js";
import { paginate } from "../../shared/http/pagination.js";
import * as locationService from "./geography.service.js";

function respondList(res, items, query) {
    const { items: page, meta } = paginate(items, query);
    return sendSuccess(res, page, meta);
}

export const listDivisions = asyncHandler(async (req, res) => {
    respondList(
        res,
        locationService.listDivisions(req.validated.query),
        req.validated.query
    );
});

export const getDivision = asyncHandler(async (req, res) => {
    sendSuccess(res, locationService.getDivision(req.validated.params.code));
});

export const listDistricts = asyncHandler(async (req, res) => {
    const { divisionCode, includeDeprecated } = req.validated.query;
    const items = locationService.listDistricts({
        divisionCode: req.validated.params?.code ?? divisionCode,
        includeDeprecated,
    });

    respondList(res, items, req.validated.query);
});

export const listDistrictsGlobal = asyncHandler(async (req, res) => {
    respondList(
        res,
        locationService.listDistricts(req.validated.query),
        req.validated.query
    );
});

export const getDistrict = asyncHandler(async (req, res) => {
    sendSuccess(res, locationService.getDistrict(req.validated.params.code));
});

export const listUpazilas = asyncHandler(async (req, res) => {
    const { districtCode, includeDeprecated } = req.validated.query;
    const items = locationService.listUpazilas({
        districtCode: req.validated.params?.code ?? districtCode,
        includeDeprecated,
    });

    respondList(res, items, req.validated.query);
});

export const listUpazilasGlobal = asyncHandler(async (req, res) => {
    respondList(
        res,
        locationService.listUpazilas(req.validated.query),
        req.validated.query
    );
});

export const getUpazila = asyncHandler(async (req, res) => {
    sendSuccess(res, locationService.getUpazila(req.validated.params.code));
});

export const listUnions = asyncHandler(async (req, res) => {
    const { upazilaCode, districtCode, includeDeprecated } =
        req.validated.query;
    const items = locationService.listUnions({
        upazilaCode: req.validated.params?.code ?? upazilaCode,
        districtCode,
        includeDeprecated,
    });

    respondList(res, items, req.validated.query);
});

export const listUnionsGlobal = asyncHandler(async (req, res) => {
    respondList(
        res,
        locationService.listUnions(req.validated.query),
        req.validated.query
    );
});

export const getUnion = asyncHandler(async (req, res) => {
    sendSuccess(res, locationService.getUnion(req.validated.params.code));
});

export const listPostOffices = asyncHandler(async (req, res) => {
    respondList(
        res,
        locationService.listPostOffices(req.validated.query),
        req.validated.query
    );
});

export const getPostOffice = asyncHandler(async (req, res) => {
    sendSuccess(res, locationService.getPostOffice(req.validated.params.code));
});

export const getHierarchy = asyncHandler(async (req, res) => {
    sendSuccess(res, locationService.getHierarchy(req.validated.query));
});

export const search = asyncHandler(async (req, res) => {
    const { q, type, page, limit, includeDeprecated } = req.validated.query;
    sendSuccess(
        res,
        locationService.searchLocations({
            q,
            type,
            page,
            limit,
            includeDeprecated,
        })
    );
});

export const getDatasetMeta = asyncHandler(async (req, res) => {
    sendSuccess(res, locationService.getDatasetMeta());
});
