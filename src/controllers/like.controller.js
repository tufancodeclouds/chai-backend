import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on video
    const { videoId } = req.params;
    const userId = req.user.id;

    // Validate videoId and userId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Check if the user has already liked the video
    const existingLike = await Like.findOne({ user: userId, video: videoId });

    if (existingLike) {
        // If a like exists, delete it (unlike the video)
        await Like.findByIdAndDelete(existingLike._id);
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Video unliked successfully"));
    }

    // If no like exists, create a new like
    const newLike = await Like.create({ user: userId, video: videoId });

    return res
        .status(200)
        .json(new ApiResponse(200, newLike, "Video liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on comment
    const {commentId} = req.params;
    const userId = req.user.id;

    // Validate commentId and userId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    
    // Check if the user has already liked the comment
    const existingLike = await Like.findOne({ user: userId, comment: commentId });

    if (existingLike) {
        // If a like exists, delete it (unlike the comment)
        await Like.findByIdAndDelete(existingLike._id);
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Comment unliked successfully"));
    }

    // If no like exists, create a new like
    const newLike = await Like.create({ user: userId, comment: commentId });

    return res
        .status(200)
        .json(new ApiResponse(200, newLike, "Comment liked successfully"));
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on tweet
    const {tweetId} = req.params;
    const userId = req.user.id;

    // Validate tweetId and userId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    
    // Check if the user has already liked the tweet
    const existingLike = await Like.findOne({ user: userId, tweet: tweetId });

    if (existingLike) {
        // If a like exists, delete it (unlike the tweet)
        await Like.findByIdAndDelete(existingLike._id);
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Tweet unliked successfully"));
    }

    // If no like exists, create a new like
    const newLike = await Like.create({ user: userId, tweet: tweetId });

    return res
        .status(200)
        .json(new ApiResponse(200, newLike, "Tweet liked successfully"));
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user.id;

    // Validate userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    
    // Fetch all liked videos for the user and populate video details
    const likedVideos = await Like.find({ user: userId })
        .populate("video");  // Populate the video field

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}