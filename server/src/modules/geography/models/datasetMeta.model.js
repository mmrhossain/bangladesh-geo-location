import mongoose from "mongoose";

const datasetMetaSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
            default: "dataset",
        },
        version: {
            type: String,
            required: true,
            trim: true,
        },
        imported_at: {
            type: Date,
            required: true,
        },
        note: {
            type: String,
            trim: true,
            maxlength: 500,
            default: null,
        },
        counts: {
            divisions: { type: Number, default: 0 },
            districts: { type: Number, default: 0 },
            upazilas: { type: Number, default: 0 },
            unions: { type: Number, default: 0 },
            postOffices: { type: Number, default: 0 },
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const DatasetMeta =
    mongoose.models.DatasetMeta ||
    mongoose.model("DatasetMeta", datasetMetaSchema);

export default DatasetMeta;
