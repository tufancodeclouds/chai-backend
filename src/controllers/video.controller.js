import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import fs from "fs"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", userId } = req.query;
    //TODO: get all videos based on query, sort, pagination

    // Ensure page and limit are positive integers
    const pageNumber = Math.max(1, parseInt(page));
    const pageLimit = Math.max(1, parseInt(limit));

    // Construct the filter object based on the query string
    const searchQuery = query ? { title: { $regex: query, $options: "i" } } : {};  // Simple case-insensitive search by title

    // Construct the sorting object
    const sort = {};
    sort[sortBy] = sortType === "asc" ? 1 : -1;  // Default sorting by createdAt descending if not provided

    // Get videos with the specified filters, pagination, and sorting
    const videos = await Video.find(searchQuery)
        .skip((pageNumber - 1) * pageLimit)  // Calculate the skip value based on the page number
        .limit(pageLimit)  // Limit the number of videos per page
        .sort(sort);  // Apply sorting

    // Get the total number of videos that match the query (for pagination)
    const totalVideos = await Video.countDocuments(searchQuery);

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalVideos / pageLimit);

    // Return response with videos and pagination info
    return res.status(200).json(
        new ApiResponse({
            videos,
            totalVideos,
            totalPages,
            currentPage: pageNumber,
            perPage: pageLimit,
        }, "Videos fetched successfully")
    );

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, duration, isPublished, owner } = req.body;
    // TODO: get video, upload to cloudinary, create video

    // Ensure the video file exists
    if (!req.files || !req.files.video) {
        throw new ApiError(400, "Video file is required");
    }

    // Get the video file
    const videoFile = req.files.video;

    // Upload the video file to Cloudinary
    const uploadedVideo = await uploadOnCloudinary(videoFile.tempFilePath);

    // Ensure the video was uploaded successfully
    if (!uploadedVideo || !uploadedVideo.url) {
        throw new ApiError(500, "Failed to upload video to Cloudinary");
    }

    // Ensure the thumbnail file exists
    const thumbnailFile = req.files.thumbnail;
    if (!thumbnailFile) {
        throw new ApiError(400, "Thumbnail image file is required");
    }

    // Upload the thumbnail image to Cloudinary
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailFile.tempFilePath);

    // Ensure the thumbnail was uploaded successfully
    if (!uploadedThumbnail || !uploadedThumbnail.url) {
        throw new ApiError(500, "Failed to upload thumbnail to Cloudinary");
    }

    // Remove the temporary files
    fs.unlinkSync(videoFile.tempFilePath);
    fs.unlinkSync(thumbnailFile.tempFilePath);

    // Create a new video in the database
    const video = new Video({
        title,
        description,
        videoFile: uploadedVideo.url,
        thumbnail: uploadedThumbnail.url,
        duration,
        isPublished: isPublished ?? true, // Use default if not provided
        owner, // Assumes owner is passed in the request body; validate ownership
    });

    // Save the video to the database
    const savedVideo = await video.save();

    // Return the saved video details in the response
    return res.status(201).json(
        new ApiResponse(201, savedVideo, "Video published successfully")
    );
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: get video by id

    // Validate the video ID
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Find the video by its ID
    const video = await Video.findById(videoId).populate("owner", "-password -refreshToken");

    // Check if the video exists
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Return the video details
    return res.status(200).json(
        new ApiResponse(200, video, "Video retrieved successfully")
    );
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const { title, description } = req.body;
    const thumbnailFile = req.files?.thumbnail; // Assuming thumbnail is uploaded as a file

    // Validate the video ID
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Find the video by ID
    const video = await Video.findById(videoId);

    // Check if the video exists
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // If a thumbnail file is provided, upload it to Cloudinary
    let updatedThumbnailUrl = video.thumbnail; // Default to existing thumbnail
    if (thumbnailFile) {
        // Delete the old thumbnail from Cloudinary
        const publicId = video.thumbnail.split("/").pop().split(".")[0];
        await uploadOnCloudinary.destroy(publicId);

        // Upload the new thumbnail
        const uploadedThumbnail = await uploadOnCloudinary(thumbnailFile.tempFilePath);
        if (!uploadedThumbnail || !uploadedThumbnail.url) {
            throw new ApiError(500, "Failed to upload new thumbnail on cloudinary");
        }

        // Update the thumbnail URL
        updatedThumbnailUrl = uploadedThumbnail.url;

        // Remove the temporary file
        fs.unlinkSync(thumbnailFile.tempFilePath);
    }

    // Update the video details
    video.title = title ?? video.title;
    video.description = description ?? video.description;
    video.thumbnail = updatedThumbnailUrl;

    // Save the updated video
    const updatedVideo = await video.save();

    // Return the updated video details
    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    );

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    // Validate the video ID
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Find the video by ID
    const video = await Video.findById(videoId);

    // Check if the video exists
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Delete the video from Cloudinary
    const publicId = video.videoFile.split("/").pop().split(".")[0];
    await deleteVideoFromCloudinary(publicId);

    // Delete the video from MongoDB
    await Video.findByIdAndDelete(videoId);

    // Return success response
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle publish status

    // Validate the video ID
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Find the video by ID
    const video = await Video.findById(videoId);

    // Check if the video exists
    if (!video) {
        throw new ApiError(404, "Video not found"); 
    }

    // Toggle the isPublished field
    video.isPublished = !video.isPublished;

    // Save the updated video
    const updatedVideo = await video.save();

    // Return the updated video details
    return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Publish status toggled successfully"));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}