const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');



async function authUser(req, res, next) {

    // Try to get token from cookie first, then from Authorization header
    let token = req.cookies.token;
    
    if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.id)

        req.user = user;

        next()

    } catch (err) {
        res.status(401).json({ message: 'Unauthorized' });
    }

}

module.exports = {
    authUser
}