import mongoose from "mongoose";

const postOfficeSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        bn_name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        district: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "District",
            required: true,
        },
        upazila: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Upazila",
            default: null,
        },
        aliases: {
            type: [String],
            default: [],
        },
        search_text: {
            type: String,
            required: true,
            trim: true,
        },
        dataset_version: {
            type: String,
            required: true,
            trim: true,
        },
        deprecated_at: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

postOfficeSchema.index({ district: 1, name: 1 });
postOfficeSchema.index({ upazila: 1 });
postOfficeSchema.index({ slug: 1 });
postOfficeSchema.index({ deprecated_at: 1 });

const PostOffice =
    mongoose.models.PostOffice ||
    mongoose.model("PostOffice", postOfficeSchema);

export default PostOffice;
