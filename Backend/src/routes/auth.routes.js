const express = require('express');
const authControllers = require("../controllers/auth.controller")
const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();



router.post("/register", authControllers.registerUser)
router.post("/login", authControllers.loginUser)

// Authenticated routes
router.get("/me", authMiddleware.authUser, authControllers.getMe)
router.post("/change-password", authMiddleware.authUser, authControllers.changePassword)
router.delete("/delete-account", authMiddleware.authUser, authControllers.deleteAccount)

// Logout
router.post("/logout", authControllers.logout)



module.exports = router;