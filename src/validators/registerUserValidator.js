import { body, check } from "express-validator";

const registerUserValidator = [
  // Fullname validation
  body("fullname")
    .trim() // Trim whitespace from the fullname
    .notEmpty() // Fullname is required
    .withMessage("Fullname is required")
    .bail() // Stop further validations if this fails
    .isLength({ min: 3 }) // Ensure fullname is at least 3 characters long
    .withMessage("Fullname must be at least 3 characters long"),

  // Email validation
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail() // Stop further validations if this fails
    .isEmail()
    .withMessage("Invalid email format"),

  // Username validation
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .bail() // Stop further validations if this fails
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long"),

  // Password validation
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .bail() // Stop further validations if this fails
    .matches(/^(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one digit or special character, and be at least 8 characters long"
    ),

  // Avatar validation
  check("avatar")
    .custom((value, { req }) => {
      if (!req.files || !req.files.avatar || req.files.avatar.length === 0) {
        throw new Error("Avatar file is required");
      }
      return true;
    }),
];

export { registerUserValidator };