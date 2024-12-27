import { body } from "express-validator";

const updateUserValidator = [
  // Fullname validation (optional, but if provided, it must be valid)
  body("fullname")
    .optional() // Make it optional, so it's not required
    .trim() // Trim whitespace from the fullname
    .isLength({ min: 3 }) // Ensure fullname is at least 3 characters long if provided
    .withMessage("Full name must be at least 3 characters long"),

  // Email validation (optional, but if provided, it must be a valid email)
  body("email")
    .optional() // Make it optional, so it's not required
    .trim()
    .isEmail() // Ensure the email is in a valid format if provided
    .withMessage("Invalid email format"),
];

export { updateUserValidator };
