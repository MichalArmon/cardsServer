import { verifyToken } from "../providers/jwtProvider.js";

export const auth = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(401).send("Authentication Error: Please Login");
  } // --- START: עוטפים את הלוגיקה ב-try/catch ---

  try {
    const userInfo = verifyToken(token);

    // בדיקה נוספת למקרה שהפונקציה verifyToken מחזירה null/false במקום לזרוק שגיאה
    if (!userInfo) {
      return res
        .status(401)
        .send("Authentication Error: Invalid token provided");
    } // הצלחה: מגדירים את המשתמש וממשיכים

    req.user = userInfo;
    next();
  } catch (error) {
    // אם jwt.verify זורק שגיאה (פג תוקף, שונה מפתח סודי, פגום) - מטפלים בה כאן.
    console.error("JWT Verification Failed:", error.message);
    return res.status(401).send("Authentication Error: Invalid token provided");
  }
};
