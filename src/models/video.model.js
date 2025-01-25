import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {
            type: String, // Cloudinary URL
            required: true,
        },
        thumbnail: {
            type: String, // Cloudinary URL
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        duration: {
            type: Number, // Video duration
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        owner: {
            type: Schema.Types.ObjectId, // Correctly reference Schema.Types.ObjectId
            ref: "User",
        },
    },
    {
        timestamps: true, // Automatically manage createdAt and updatedAt fields
    }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema); // Pass the schema, not its name
