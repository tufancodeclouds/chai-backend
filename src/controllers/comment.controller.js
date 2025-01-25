import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video with pagination
    const {videoId} = req.params // Extract videoId from route parameters
    const {page = 1, limit = 10} = req.query // Extract pagination and limit from query parameters

    // Ensure page and limit are positive integers
    const pageNumber = Math.max(1, parseInt(page));
    const pageLimit = Math.max(1, parseInt(limit));

    // Fetch comments for the video with filtering and pagination
    const comments = await Comment.find({ video: videoId })
    .skip((pageNumber - 1) * pageLimit)  // Calculate the starting point based on the page number
    .limit(pageLimit)  // Limit the number of comments per page
    .sort({ createdAt: -1 });  // Sort comments by creation date, newest first

    // Get the total number of comments for the video
    const totalComments = await Comment.countDocuments({ video: videoId });

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalComments / pageLimit);

    // return response with pagination data
    return res.status(200).json(
        new ApiResponse(200, {
            comments,
            totalComments,
            totalPages,
            currentPage: pageNumber,
            perPage: pageLimit
        }, "Comments fetched successfully")
    );
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {user, comment} = req.body

    // Validate input
    if (!user || !comment) {
        throw new ApiError(400, "User and comment content are required");
    }

    // Create a new comment in the database
    const newComment = await Comment.create({
        video: videoId,
        user,
        comment
    })

    // return response
    return res.status(201).json(
        new ApiResponse(201, newComment, "Comment added successfully")
    );
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: Update a comment
    const { commentId } = req.params;  // Extract commentId from the route parameters
    const { user, comment } = req.body;  // Extract user and new comment content from the request body

    if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }

    if (!comment) {
        throw new ApiError(400, "Comment content is required");
    }

    // Find the comment by ID to check if it exists
    const existingComment = await Comment.findById(commentId);

    // If no comment is found with the provided commentId
    if (!existingComment) {
        throw new ApiError(404, "Comment not found");
    }

    // Optional: Check if the user is the author of the comment
    // if (existingComment.user.toString() !== user.toString()) {
    //     throw new ApiError(403, "You are not authorized to update this comment");
    // }

    // Find the comment by ID and update it
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,  // Use commentId to find the comment to update
        { comment },  // Update the comment field with the new comment text
        { new: true }  // Return the updated comment
    );

    // Return the updated comment in the response
    return res.status(200).json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;  // Extract commentId from the route parameters

    if(!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }

    // Find the comment by ID and delete it
    const deletedComment = await Comment.findByIdAndDelete(commentId);

    // If no comment is found with the provided commentId
    if (!deletedComment) {
        throw new ApiError(404, "Comment not found");
    }

    // Return a success message (no need to return the deleted comment itself)
    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    );
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}