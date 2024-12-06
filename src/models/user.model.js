import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true, // Create an index for efficient searching
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: [true, "fullname is required"],
            trim: true,
            index: true, // Index for searching full name
        },
        avatar: {
            type: String, // Cloudinary URL
            required: true,
        },
        coverImage: {
            type: String, // Cloudinary URL
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video", // Reference the `Video` model
            },
        ],
        password: {
            type: String,
            required: [true, "Password is required"], // Custom validation error message
        },
        refreshToken: {
            type: String, // For storing refresh tokens if using JWT
        },
    },
    {
        timestamps: true, // Automatically adds `createdAt` and `updatedAt`
    }
);

// Pre-save middleware to hash the password
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next(); // Only hash if password is modified

    this.password = await bcrypt.hash(this.password, 10); // Hash with a salt of 10 rounds
    next();
});

// Method to verify the password
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

// Define a method called "generateAccessToken" for the user schema
userSchema.methods.generateAccessToken = function() {
    // Use the `jwt.sign` method to generate a signed JSON Web Token
    return jwt.sign(
        {
            // The payload of the token includes user-specific details:
            _id: this._id,        // The unique identifier of the user from the database
            email: this.email,    // The user's email address
            username: this.username, // The user's username
            fullName: this.fullName  // The user's full name
        },
        process.env.ACCESS_TOKEN_SECRET, // The secret key used to sign the token, stored in an environment variable
        {
            expireIn: process.env.ACCESS_TOKEN_EXPIRY // Token expiration time, defined in the environment variable (e.g., '1h', '30m')
        }
    )
    // The resulting token is returned to the caller
}

// Add a method called "generateRefreshToken" to the user schema
userSchema.methods.generateRefreshToken = function() {
    // Generate a refresh token using the `jwt.sign` method
    return jwt.sign(
        {
            // Include the user's unique ID in the token payload
            _id: this._id, // The user's database ID
        },
        process.env.REFRESH_TOKEN_SECRET, // Secret key for signing the refresh token
        {
            expireIn: process.env.REFRESH_TOKEN_EXPIRY // How long the refresh token is valid
        }
    )
    // Return the generated refresh token
}

export const User = mongoose.model("User", userSchema);
