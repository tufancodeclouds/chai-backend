import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp') // `cb` is the callback function to pass the destination path. The first argument is `null` to indicate no error.
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
});
  
export const upload = multer({ storage });