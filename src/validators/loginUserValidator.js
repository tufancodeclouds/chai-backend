import { body, oneOf } from "express-validator";

const loginUserValidator = [
  // Check if either email or username is provided
  oneOf(
    [
      body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid Email"),
      
      body("username")
        .trim()
        .notEmpty()
        .withMessage("Username is required")
        .isString()
        .withMessage("Invalid Username")
    ],
    "Email or Username is required"
  ),

  // Password validation
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .matches(/^(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one digit or special character, and be at least 8 characters long"
    ),
];

export { loginUserValidator };
