import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { loginUser } from "../controllers/user.controller.js";
import { logoutUser } from "../controllers/user.controller.js";
import { refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { registerUserValidator } from "../validators/registerUserValidator.js";
import { loginUserValidator } from "../validators/loginUserValidator.js";
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
router.route("/refresh-access-token").post(refreshAccessToken);

export default router;
