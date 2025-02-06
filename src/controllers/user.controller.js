import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res, next) => {
  try {
    /*
    1. get user details from frontend
    2. validation - not empty
    3. check if user already exists: username, email
    4. check for images, check for avatar
    5. upload them to cloudinary, avatar
    6. create user object - create entry in database
    7. remove password and refresh token from response
    8. check for user creation
    9. return response
    */

    // get user details from frontend
    const { fullname, email, username, password } = req.body;

    // if (fullName === "") {
    //     throw new ApiError(400, "fullname is required");
    // }

    // check if any field is empty
    // if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
    //     throw new ApiError(400, "All fields are required");
    // }

    // validate email format
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!emailRegex.test(email)) {
    //     throw new ApiError(400, "Invalid email format");
    // }

    // check if user already exists: username, email
    // const existedUser = User.findOne({
    //     $or: [{ username }, { email }]
    // });

    // if (existedUser) {
    //     throw new ApiError(409, "username or email already exists");
    // }

    // Check if username already exists
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      // throw new ApiError(409, "Username already exists");
      return next(new ApiError(409, "Username already exists"));
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      // throw new ApiError(409, "Email already exists");
      return next(new ApiError(409, "Email already exists"));
    }

    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
      // throw new ApiError(400, "Avatar file not stored on localpath");
      return next(new ApiError(400, "Avatar file not stored on localpath"));
    }

    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
      // throw new ApiError(400, "Avatar file not uploaded on cloudinary");
      return next(new ApiError(400, "Avatar file not uploaded on cloudinary"));
    }

    // create user object - create entry in database
    const user = await User.create({
      fullname,
      email,
      username: username.toLowerCase(),
      password,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
    });

    // remove password and refresh token from response
    // const createdUser = await User.findById(user._id); // check user object created or not in database

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken" // (-)minus sign means remove
    );

    // check for user creation
    // if not created user object throw error
    if (!createdUser) {
      // throw new ApiError(
      //   500,
      //   "Something went wrong while registering the user"
      // );

      return next(
        new ApiError(500, "Something went wrong while registering the user")
      );
    }

    // return response
    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
  } catch (error) {
    next(error); // Pass unexpected errors to the error handler
  }
});

const loginUser = asyncHandler(async (req, res) => {
  /*
    1. get user details from frontend (username or password)
    2. validate username or password
    3. check if user exists
    4. check if password is correct
    5. generate access token and refresh token
    6. send cookie with access token and refresh token
    7. return response
    */

  // get user details from frontend
  const { email, username, password } = req.body;

  // Check if either email or username is provided
  if (!email && !username) {
    throw new ApiError(400, "Email or Username is required");
  }

  // check if user exists
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // check if password is correct
  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Password is incorrect");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // Check if user is authenticated
  if (!req.user) {
    throw new ApiError(400, "User not authenticated");
  }

  // Clear the refresh token in the database
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: null,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const updateUser = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  // Ensure user is authenticated
  if (!req.user || !req.user._id) {
    throw new ApiError(400, "User not authenticated");
  }

  // Prepare the update object
  const updateFields = {};

  // Only add fields to the update object if they are provided in the request
  if (fullname) {
    updateFields.fullname = fullname;
  }
  if (email) {
    updateFields.email = email;
  }

  // If neither fullname nor email is provided, throw an error
  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(
      400,
      "At least one of 'fullname' or 'email' must be provided"
    );
  }

  // Update the user in the database
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: updateFields,
    },
    {
      // 'new: true' অপশনটি নিশ্চিত করে যে, আপডেট অপারেশনের পর আপডেট হওয়া ডকুমেন্টটি রিটার্ন হবে,
      // অর্থাৎ এটি ডকুমেন্টের নতুন (আপডেট হওয়া) অবস্থাটি দেখাবে, পূর্বের (আগের) অবস্থাটি নয়।
      new: true,
    }
  ).select("-password -refreshToken"); // Exclude sensitive fields like password and refreshToken

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file not stored on localpath");
  }

  // delete old avatar from cloudinary
  if (req.user?.avatar) {
    const publicId = req.user.avatar.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(publicId);
  }

  // upload avatar to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Avatar file not uploaded on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file not stored on localpath");
  }

  // delete old cover image from cloudinary
  if (req.user?.coverImage) {
    const publicId = req.user.coverImage.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(publicId);
  }

  // upload cover image to cloudinary
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Cover image file not uploaded on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!req.user || !req.user._id) {
    throw new ApiError(400, "User not authenticated");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (newPassword !== confirmNewPassword) {
    throw new ApiError(
      400,
      "New password and confirm new password do not match"
    );
  }

  const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false }); // Save the user object to the database, skipping validation checks before saving.

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(400, "User not authenticated");
  }

  // const user = await User.findById(req.user?._id).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user found successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "Subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "User",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribed",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        subscribedCount: {
          $size: "$subscribed",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        username: 1,
        fullname: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        subscribedCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel?.lengtn) {
    throw new ApiError(404, "Channel does not exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "Channel profile found successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "Video",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "User",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullname: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history found successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateUser,
  updateUserAvatar,
  updateUserCoverImage,
  changePassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
};
