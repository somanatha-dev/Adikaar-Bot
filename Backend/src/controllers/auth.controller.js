const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const chatModel = require('../models/chat.model');
const messageModel = require('../models/message.model');
const { deleteMemoriesByMessageIds, deleteMemoriesByFilter } = require('../services/vector.service');

async function registerUser(req, res) {
    const { fullName: { firstName, lastName } = { firstName: '', lastName: '' }, email, password } = req.body || {};

    const isUserAlreadyExists = await userModel.findOne({ email });
    if (isUserAlreadyExists) {
        return res.status(400).json({ message: "User already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
        fullName: { firstName, lastName },
        email,
        password: hashPassword
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.cookie("token", token, { httpOnly: true });

    return res.status(201).json({
        message: "User registered successfully",
        user: { email: user.email, _id: user._id, fullName: user.fullName }
    });
}

async function loginUser(req, res) {
    const { email, password } = req.body || {};

    const user = await userModel.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.cookie("token", token, { httpOnly: true });

    return res.status(200).json({
        message: "user logged in successfully",
        user: { email: user.email, _id: user._id, fullName: user.fullName }
    });
}

async function getMe(req, res) {
    const user = req.user;
    return res.status(200).json({
        user: { _id: user._id, email: user.email, fullName: user.fullName }
    });
}

async function changePassword(req, res) {
    const user = req.user;
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashPassword;
    await user.save();
    return res.status(200).json({ message: "Password updated successfully" });
}

async function deleteAccount(req, res) {
    const user = req.user;
    const chats = await chatModel.find({ user: user._id }).select('_id').lean();
    const chatIds = chats.map(c => c._id);

    // Collect related message ids BEFORE deletion for Pinecone cleanup
    const messages = await messageModel.find({
        $or: [ { user: user._id }, { chat: { $in: chatIds } } ]
    }).select('_id').lean();
    const messageIds = messages.map(m => m._id);

    // Delete vectors for this user across Pinecone robustly (legacy + current)
    try {
        // 1) Primary: by normalized user metadata
        await deleteMemoriesByFilter({ user: user._id });

        // 2) Legacy aliases just in case older vectors used a different metadata key
        await deleteMemoriesByFilter({ userId: String(user._id) });
        await deleteMemoriesByFilter({ uid: String(user._id) });

        // 3) By chat filter (handles any vectors missing user metadata but having chat)
        if (chatIds.length) {
            await deleteMemoriesByFilter({ chat: { $in: chatIds.map(id => String(id)) } });
        }

        // 4) By explicit message ids (covers cases where filter matching fails)
        if (messageIds.length) await deleteMemoriesByMessageIds(messageIds);
    } catch (e) {
        console.error('Error deleting vectors for user', user._id.toString(), e?.message || e);
    }

    await messageModel.deleteMany({ $or: [ { user: user._id }, { chat: { $in: chatIds } } ] });
    await chatModel.deleteMany({ user: user._id });
    await userModel.deleteOne({ _id: user._id });
    res.clearCookie('token');
    return res.status(200).json({ message: "Account deleted" });
}

async function logout(req, res) {
    res.clearCookie('token');
    return res.status(200).json({ message: "Logged out" });
}

module.exports = {
    registerUser,
    loginUser,
    getMe,
    changePassword,
    deleteAccount,
    logout
};