import { body } from "express-validator";

const changePasswordValidator = [
  // Current Password validation (required)
  body("currentPassword")
    .trim() // Trim whitespace
    .notEmpty() // Current password is required
    .withMessage("Current password is required")
    .bail(), // Stop further validations if this fails

  // New Password validation (required)
  body("newPassword")
    .trim() // Trim whitespace
    .notEmpty() // New password is required
    .withMessage("New password is required")
    .bail() // Stop further validations if this fails
    .matches(/^(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one digit or special character, and be at least 8 characters long"
    ),

  // Confirm New Password validation (required)
  body("confirmNewPassword")
    .trim() // Trim whitespace
    .notEmpty() // Confirm password is required
    .withMessage("Confirm new password is required")
    .bail() // Stop further validations if this fails
    .custom((value, { req }) => {
      // Check if newPassword and confirmNewPassword match
      if (value !== req.body.newPassword) {
        throw new Error("New password and confirm new password do not match");
      }
      return true;
    }),
];

export { changePasswordValidator };
