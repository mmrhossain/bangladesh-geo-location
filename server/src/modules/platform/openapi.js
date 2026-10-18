const entityProperties = {
    code: { type: "string", example: "BD-13" },
    name: { type: "string", example: "Dhaka" },
    bn_name: { type: "string", example: "ঢাকা" },
    slug: { type: "string", example: "dhaka" },
    aliases: { type: "array", items: { type: "string" } },
    deprecated_at: {
        type: "string",
        format: "date-time",
        nullable: true,
    },
    dataset_version: { type: "string", example: "1.0.0" },
};

const entityListResponse = {
    type: "object",
    properties: {
        status: { type: "string", example: "success" },
        data: { type: "array", items: { type: "object" } },
        meta: {
            type: "object",
            nullable: true,
            properties: {
                limit: { type: "integer", example: 50 },
                hasMore: { type: "boolean" },
                nextCursor: { type: "string", nullable: true },
            },
        },
    },
};

const errorResponse = {
    type: "object",
    properties: {
        status: { type: "string", example: "fail" },
        code: { type: "string", example: "GEO_DIVISION_NOT_FOUND" },
        message: { type: "string" },
        details: { type: "object", nullable: true },
        requestId: { type: "string" },
    },
};

const parameters = {
    code: {
        name: "code",
        in: "path",
        required: true,
        schema: { type: "string", example: "BD-13" },
    },
    resource: {
        name: "resource",
        in: "path",
        required: true,
        schema: {
            type: "string",
            enum: [
                "divisions",
                "districts",
                "upazilas",
                "unions",
                "post-offices",
            ],
        },
    },
    includeDeprecated: {
        name: "includeDeprecated",
        in: "query",
        schema: { type: "boolean", default: false },
    },
    limit: {
        name: "limit",
        in: "query",
        schema: { type: "integer", minimum: 1, maximum: 200 },
    },
    cursor: {
        name: "cursor",
        in: "query",
        schema: { type: "string" },
    },
    divisionCode: {
        name: "divisionCode",
        in: "query",
        schema: { type: "string", example: "BD-13" },
    },
    districtCode: {
        name: "districtCode",
        in: "query",
        schema: { type: "string", example: "DHK" },
    },
    upazilaCode: {
        name: "upazilaCode",
        in: "query",
        schema: { type: "string", example: "DHK-SAV" },
    },
};

function listOperation(tag, summary, extraParameters = []) {
    return {
        tags: [tag],
        summary,
        parameters: [
            { $ref: "#/components/parameters/includeDeprecated" },
            { $ref: "#/components/parameters/limit" },
            { $ref: "#/components/parameters/cursor" },
            ...extraParameters,
        ],
        responses: {
            200: {
                description: "Successful response",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/ListResponse" },
                    },
                },
            },
            400: { $ref: "#/components/responses/BadRequest" },
        },
    };
}

const openApiSpec = {
    openapi: "3.0.3",
    info: {
        title: "Bangladesh Geography Service",
        version: "1.0.0",
        description:
            "Reference-data API for the Bangladesh administrative hierarchy: Division, District, Upazila, Union, and Post Office.",
    },
    servers: [{ url: "/api/v1" }],
    tags: [
        { name: "Divisions" },
        { name: "Districts" },
        { name: "Upazilas" },
        { name: "Unions" },
        { name: "Post offices" },
        { name: "Meta" },
        { name: "Admin" },
    ],
    components: {
        securitySchemes: {
            AdminApiKey: {
                type: "apiKey",
                in: "header",
                name: "x-api-key",
            },
        },
        parameters,
        schemas: {
            Division: {
                type: "object",
                properties: {
                    ...entityProperties,
                    iso_code: { type: "string", nullable: true },
                },
            },
            District: {
                type: "object",
                properties: {
                    ...entityProperties,
                    divisionCode: { type: "string", nullable: true },
                },
            },
            Upazila: {
                type: "object",
                properties: {
                    ...entityProperties,
                    districtCode: { type: "string", nullable: true },
                    divisionCode: { type: "string", nullable: true },
                },
            },
            Union: {
                type: "object",
                properties: {
                    ...entityProperties,
                    upazilaCode: { type: "string", nullable: true },
                    districtCode: { type: "string", nullable: true },
                    divisionCode: { type: "string", nullable: true },
                },
            },
            PostOffice: {
                type: "object",
                properties: {
                    ...entityProperties,
                    districtCode: { type: "string", nullable: true },
                    upazilaCode: { type: "string", nullable: true },
                    divisionCode: { type: "string", nullable: true },
                },
            },
            ListResponse: entityListResponse,
            EntityResponse: {
                type: "object",
                properties: {
                    status: { type: "string", example: "success" },
                    data: { type: "object" },
                },
            },
            SearchResponse: {
                type: "object",
                properties: {
                    status: { type: "string", example: "success" },
                    data: {
                        type: "object",
                        properties: {
                            items: { type: "array", items: { type: "object" } },
                            page: { type: "integer" },
                            limit: { type: "integer" },
                            total: { type: "integer" },
                            totalPages: { type: "integer" },
                        },
                    },
                },
            },
            DatasetMeta: {
                type: "object",
                properties: {
                    datasetVersion: { type: "string" },
                    importedAt: { type: "string", format: "date-time", nullable: true },
                    loadedAt: { type: "string", format: "date-time", nullable: true },
                    note: { type: "string", nullable: true },
                    counts: {
                        type: "object",
                        properties: {
                            divisions: { type: "integer" },
                            districts: { type: "integer" },
                            upazilas: { type: "integer" },
                            unions: { type: "integer" },
                            postOffices: { type: "integer" },
                        },
                    },
                },
            },
            ImportPayload: {
                type: "object",
                properties: {
                    datasetVersion: { type: "string" },
                    note: { type: "string" },
                    divisions: { type: "array", items: { type: "object" } },
                    districts: { type: "array", items: { type: "object" } },
                    upazilas: { type: "array", items: { type: "object" } },
                    unions: { type: "array", items: { type: "object" } },
                    postOffices: { type: "array", items: { type: "object" } },
                },
            },
            Error: errorResponse,
        },
        responses: {
            BadRequest: {
                description: "Invalid request",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                    },
                },
            },
            Unauthorized: {
                description: "Missing or invalid admin API key",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                    },
                },
            },
            NotFound: {
                description: "Resource not found",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                    },
                },
            },
        },
    },
    paths: {
        "/divisions": {
            get: listOperation("Divisions", "List divisions"),
        },
        "/divisions/{code}": {
            get: {
                tags: ["Divisions"],
                summary: "Get a division by code",
                parameters: [{ $ref: "#/components/parameters/code" }],
                responses: {
                    200: {
                        description: "Division",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/EntityResponse",
                                },
                            },
                        },
                    },
                    404: { $ref: "#/components/responses/NotFound" },
                },
            },
        },
        "/divisions/{code}/districts": {
            get: listOperation("Divisions", "List districts of a division", [
                { $ref: "#/components/parameters/code" },
            ]),
        },
        "/districts": {
            get: listOperation("Districts", "List districts", [
                { $ref: "#/components/parameters/divisionCode" },
            ]),
        },
        "/districts/{code}": {
            get: {
                tags: ["Districts"],
                summary: "Get a district by code",
                parameters: [{ $ref: "#/components/parameters/code" }],
                responses: {
                    200: {
                        description: "District",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/EntityResponse",
                                },
                            },
                        },
                    },
                    404: { $ref: "#/components/responses/NotFound" },
                },
            },
        },
        "/districts/{code}/upazilas": {
            get: listOperation("Districts", "List upazilas of a district", [
                { $ref: "#/components/parameters/code" },
            ]),
        },
        "/upazilas": {
            get: listOperation("Upazilas", "List upazilas", [
                { $ref: "#/components/parameters/districtCode" },
            ]),
        },
        "/upazilas/{code}": {
            get: {
                tags: ["Upazilas"],
                summary: "Get an upazila by code",
                parameters: [{ $ref: "#/components/parameters/code" }],
                responses: {
                    200: {
                        description: "Upazila",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/EntityResponse",
                                },
                            },
                        },
                    },
                    404: { $ref: "#/components/responses/NotFound" },
                },
            },
        },
        "/upazilas/{code}/unions": {
            get: listOperation("Upazilas", "List unions of an upazila", [
                { $ref: "#/components/parameters/code" },
            ]),
        },
        "/unions": {
            get: listOperation("Unions", "List unions", [
                { $ref: "#/components/parameters/districtCode" },
                { $ref: "#/components/parameters/upazilaCode" },
            ]),
        },
        "/unions/{code}": {
            get: {
                tags: ["Unions"],
                summary: "Get a union by code",
                parameters: [{ $ref: "#/components/parameters/code" }],
                responses: {
                    200: {
                        description: "Union",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/EntityResponse",
                                },
                            },
                        },
                    },
                    404: { $ref: "#/components/responses/NotFound" },
                },
            },
        },
        "/post-offices": {
            get: listOperation("Post offices", "List post offices", [
                { $ref: "#/components/parameters/districtCode" },
                { $ref: "#/components/parameters/upazilaCode" },
            ]),
        },
        "/post-offices/{code}": {
            get: {
                tags: ["Post offices"],
                summary: "Get a post office by code",
                parameters: [{ $ref: "#/components/parameters/code" }],
                responses: {
                    200: {
                        description: "Post office",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/EntityResponse",
                                },
                            },
                        },
                    },
                    404: { $ref: "#/components/responses/NotFound" },
                },
            },
        },
        "/hierarchy": {
            get: {
                tags: ["Meta"],
                summary: "Get the administrative hierarchy tree",
                parameters: [
                    {
                        name: "depth",
                        in: "query",
                        schema: {
                            type: "integer",
                            minimum: 1,
                            maximum: 4,
                            default: 4,
                        },
                    },
                    { $ref: "#/components/parameters/includeDeprecated" },
                ],
                responses: {
                    200: {
                        description: "Hierarchy",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/EntityResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/search": {
            get: {
                tags: ["Meta"],
                summary: "Search by name, Bangla name, alias, or code",
                parameters: [
                    {
                        name: "q",
                        in: "query",
                        required: true,
                        schema: { type: "string" },
                    },
                    {
                        name: "type",
                        in: "query",
                        schema: {
                            type: "string",
                            enum: [
                                "division",
                                "district",
                                "upazila",
                                "union",
                                "post-office",
                            ],
                        },
                    },
                    {
                        name: "page",
                        in: "query",
                        schema: { type: "integer", minimum: 1, default: 1 },
                    },
                    {
                        name: "limit",
                        in: "query",
                        schema: {
                            type: "integer",
                            minimum: 1,
                            maximum: 100,
                            default: 20,
                        },
                    },
                    { $ref: "#/components/parameters/includeDeprecated" },
                ],
                responses: {
                    200: {
                        description: "Search results",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/SearchResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/meta/dataset": {
            get: {
                tags: ["Meta"],
                summary: "Get dataset version, import time, and counts",
                responses: {
                    200: {
                        description: "Dataset metadata",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/EntityResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/openapi.json": {
            get: {
                tags: ["Meta"],
                summary: "Get this OpenAPI document",
                responses: { 200: { description: "OpenAPI document" } },
            },
        },
        "/admin/import": {
            post: {
                tags: ["Admin"],
                summary: "Idempotent hierarchical dataset import",
                security: [{ AdminApiKey: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ImportPayload",
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Import summary" },
                    400: { $ref: "#/components/responses/BadRequest" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                },
            },
        },
        "/admin/{resource}/{code}": {
            patch: {
                tags: ["Admin"],
                summary: "Update a record",
                security: [{ AdminApiKey: [] }],
                parameters: [
                    { $ref: "#/components/parameters/resource" },
                    { $ref: "#/components/parameters/code" },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    bn_name: { type: "string" },
                                    aliases: {
                                        type: "array",
                                        items: { type: "string" },
                                    },
                                    iso_code: { type: "string", nullable: true },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Updated record" },
                    400: { $ref: "#/components/responses/BadRequest" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    404: { $ref: "#/components/responses/NotFound" },
                },
            },
        },
        "/admin/{resource}/{code}/deprecate": {
            post: {
                tags: ["Admin"],
                summary: "Deprecate or restore a record",
                security: [{ AdminApiKey: [] }],
                parameters: [
                    { $ref: "#/components/parameters/resource" },
                    { $ref: "#/components/parameters/code" },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["deprecated"],
                                properties: {
                                    deprecated: {
                                        type: "boolean",
                                        default: true,
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Updated record" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    404: { $ref: "#/components/responses/NotFound" },
                },
            },
        },
    },
};

export default openApiSpec;
