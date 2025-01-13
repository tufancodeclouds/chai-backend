import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { loginUser } from "../controllers/user.controller.js";
import { logoutUser } from "../controllers/user.controller.js";
import { refreshAccessToken } from "../controllers/user.controller.js";
import { changePassword } from "../controllers/user.controller.js";
import { updateUser } from "../controllers/user.controller.js";
import { updateUserAvatar } from "../controllers/user.controller.js";
import { getCurrentUser } from "../controllers/user.controller.js";
import { updateUserCoverImage } from "../controllers/user.controller.js";
import { getUserChannelProfile } from "../controllers/user.controller.js";
import { getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { registerUserValidator } from "../validators/registerUserValidator.js";
import { loginUserValidator } from "../validators/loginUserValidator.js";
import { updateUserValidator } from "../validators/updateUserValidator.js";
import { changePasswordValidator } from "../validators/changePasswordValidator.js";
import { validate } from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUserValidator, // Apply input validators
    validate, // Handle validation errors
    registerUser // Controller logic
);

router.route("/login").post(
    loginUserValidator, // Apply input validators
    validate, // Handle validation errors
    loginUser // Controller logic
);

// secured routes
router.route("/logout").post(authenticate, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(authenticate, changePasswordValidator, validate, changePassword);
router.route("/update-user").patch(authenticate, updateUserValidator, validate, updateUser);
router.route("/avatar").patch(authenticate, upload.single('avatar'), updateUserAvatar);
router.route("/cover-image").patch(authenticate, upload.single('coverImage'), updateUserCoverImage);
router.route("/current-user").get(authenticate, getCurrentUser);
router.route("/c/:username").get(authenticate, getUserChannelProfile);
router.route("/history").get(authenticate, getWatchHistory);

export default router;
