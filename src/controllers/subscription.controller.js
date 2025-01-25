import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    // Validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Validate userId
    const userId = req.user.id;
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Check if the user has already subscribed to the channel
    const existingSubscription = await Subscription.findOne({ subscriber: userId, channel: channelId });
    if (existingSubscription) {
        // If a subscription exists, delete it (unsubscribe)
        await Subscription.findByIdAndDelete(existingSubscription._id);
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
    } else {
        // If no subscription exists, create a new one (subscribe)
        const newSubscription = await Subscription.create({ subscriber: userId, channel: channelId });
        return res
            .status(200)
            .json(new ApiResponse(200, newSubscription, "Subscribed successfully"));
    }

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Find subscribers of the channel and populate subscriber details
    const subscribers = await Subscription.find({ channel: channelId })
        .populate('subscriber', 'name email'); // Adjust fields as needed

    return res
        .status(200)
        .json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"));
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    // Validate subscriberId
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    // Find channels subscribed by the user
    const subscriptions = await Subscription.find({ subscriber: subscriberId }).populate('channel', 'name email'); // Adjust fields as needed

    if (!subscriptions.length) {
        throw new ApiError(404, "No subscriptions found for this user.");
    }

    // Map the populated channel details
    const channels = subscriptions.map(subscription => subscription.channel);

    return res
        .status(200)
        .json(new ApiResponse(200, channels, "Subscribed channels fetched successfully"));
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}