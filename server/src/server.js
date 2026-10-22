const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const User = require("./models/User");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "AI Interview Platform API is running",
    });
});

app.get("/api/project-info", (req, res) => {
    res.json({
        success: true,
        message: "Project information API running",
        data: {
            "name": "AI Interview Platform",
            "version": "1.0.0",
            "stack": ["React", "Node.js", "Express", "MongoDB"]
        }
    });
});


app.get("/api/stats/users", async (req, res) => {
    try {
        const usersCollection =
            mongoose.connection.db.collection("users");

        const totalUsers = await usersCollection.countDocuments();

        res.json({
            success: true,
            data: {
                totalUsers,
            },
        });
    } catch (error) {
        console.error("User stats API error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch user statistics",
        });
    }
});


app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select(
            "name email role"
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account no longer exists",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Authentication successful",
            data: {
                userId: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Get current user error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Could not retrieve user information",
        });
    }
});


const PORT = process.env.PORT || 5001;

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });