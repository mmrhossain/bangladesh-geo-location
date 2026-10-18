import Division from "./models/division.model.js";
import District from "./models/district.model.js";
import Upazila from "./models/upazila.model.js";
import Union from "./models/union.model.js";
import PostOffice from "./models/postOffice.model.js";
import DatasetMeta from "./models/datasetMeta.model.js";

export const models = {
    divisions: Division,
    districts: District,
    upazilas: Upazila,
    unions: Union,
    "post-offices": PostOffice,
};

export async function loadAllLean() {
    const [divisions, districts, upazilas, unions, postOffices, meta] =
        await Promise.all([
            Division.find().lean(),
            District.find().lean(),
            Upazila.find().lean(),
            Union.find().lean(),
            PostOffice.find().lean(),
            DatasetMeta.findById("dataset").lean(),
        ]);

    return { divisions, districts, upazilas, unions, postOffices, meta };
}

export async function listCodeIdMap(model) {
    const docs = await model.find({}, { _id: 1, code: 1 }).lean();
    return new Map(docs.map((doc) => [doc.code, doc._id]));
}

export async function upsertByCode(model, code, fields) {
    return model.updateOne(
        { code },
        { $set: fields, $setOnInsert: { code } },
        { upsert: true, runValidators: true }
    );
}

export async function upsertManyByCode(model, items, buildFields) {
    if (items.length === 0) {
        return { matchedCount: 0, upsertedCount: 0 };
    }

    const operations = items.map((item) => ({
        updateOne: {
            filter: { code: item.code },
            update: {
                $set: buildFields(item),
                $setOnInsert: { code: item.code },
            },
            upsert: true,
        },
    }));

    return model.bulkWrite(operations, { ordered: true });
}

export async function updateByCode(model, code, fields) {
    return model
        .findOneAndUpdate(
            { code },
            { $set: fields },
            { new: true, runValidators: true }
        )
        .lean();
}

export async function setDeprecatedByCode(model, code, deprecated) {
    return model
        .findOneAndUpdate(
            { code },
            { $set: { deprecated_at: deprecated ? new Date() : null } },
            { new: true }
        )
        .lean();
}

export async function findByCode(model, code) {
    return model.findOne({ code }).lean();
}

export async function findMeta() {
    return DatasetMeta.findById("dataset").lean();
}

export async function saveMeta({ version, importedAt, counts, note = null }) {
    return DatasetMeta.findByIdAndUpdate(
        "dataset",
        {
            $set: {
                version,
                imported_at: importedAt,
                counts,
                note,
            },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
}
