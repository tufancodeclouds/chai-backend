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

// Generate Access Token
userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY, // Use correct expiry format (e.g., '1d')
        }
    );
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY, // Use correct expiry format (e.g., '10d')
        }
    );
};

export const User = mongoose.model("User", userSchema);
