import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { registerUserValidator } from "../validators/registerUserValidator.js";
import { validate } from "../middlewares/validate.middleware.js";

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

export default router;