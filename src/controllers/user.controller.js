import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({
    //     message: "ok"
    // })

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
    const {fullname, email, username, password} = req.body;

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
        throw new ApiError(409, "Username already exists");
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
        throw new ApiError(409, "Email already exists");
    }

    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file not stored on localpath");
    }

    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file not uploaded on cloudinary");
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
    )

    // check for user creation
    // if not created user object throw error
    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    );

});

export { registerUser };