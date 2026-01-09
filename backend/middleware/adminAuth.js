import jwt from "jsonwebtoken";

const adminAuth = (req, res, next) => {
  try {
    const token = req.headers.token; // <-- Important: using lowercase 'token'

    if (!token) {
      return res.json({ success: false, message: "Not Authorized Login Again" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // check if the token is admin
    if (!decoded.isAdmin) {
      return res.json({ success: false, message: "Not Authorized Login Again" });
    }

    req.adminEmail = decoded.email;
    next();
  } catch (error) {
    console.error("AdminAuth Error:", error.message);
    return res.json({ success: false, message: "Not Authorized Login Again" });
  }
};

export default adminAuth;
