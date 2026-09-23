const jwt = require("jsonwebtoken");
const protect = (req, res, next) => {
    try {
        console.log("\n================ AUTH DEBUG ================");
        console.log("METHOD:", req.method);
        console.log("URL:", req.originalUrl);
        console.log(
            "AUTH HEADER:",
            req.headers.authorization
        );
        console.log(
            "JWT SECRET EXISTS:",
            !!process.env.JWT_SECRET
        );
        if (!req.headers.authorization) {
            console.log(" NO AUTHORIZATION HEADER");
            return res.status(401).json({
                success: false,
                message: "Not authorized"
            });
        }
        if (!req.headers.authorization.startsWith("Bearer ")) {
            console.log(
                "AUTH HEADER DOES NOT START WITH BEARER"
            );
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format"
            });
        }
        const token =
            req.headers.authorization.split(" ")[1];
        console.log(
            "TOKEN RECEIVED:",
            token
                ? `${token.substring(0, 20)}...`
                : "NO TOKEN"
        );
        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );
        console.log("TOKEN VERIFIED");
        console.log("DECODED USER:", decoded);
        req.user = decoded;
        console.log("================ AUTH SUCCESS ================\n");
        next();
    } catch (error) {
        console.log("\nJWT VERIFICATION FAILED");
        console.log("ERROR NAME:", error.name);
        console.log("ERROR MESSAGE:", error.message);
        console.log("================================================\n");
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};
module.exports = protect;