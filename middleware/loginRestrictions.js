// middleware/restrictLogin.js
import dotenv from "dotenv";
dotenv.config(); // to load WFH users list from .env if needed

//  Allowed Office IPs (Static IPs from ISP/Office)
const ALLOWED_IPS = new Set(["45.116.117.147", "103.248.119.226"]);

//  WFH Allowed Users (from .env, comma-separated emails/usernames)
const WFH_ALLOWED_USERS = new Set(
  (process.env.WFH_ALLOWED_USERS || "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean)
);
console.log("WFH _ALLowed_Employee",WFH_ALLOWED_USERS)

//  Regex for device detection
const MOBILE_REGEX = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
const TABLET_REGEX = /iPad|Tablet|Nexus 7|Nexus 10|SM-T\w+|Kindle|Silk/i;
const TV_REGEX = /SmartTV|AppleTV|HbbTV|NetCast|Tizen|Web0S|webOS.TV|Viera|BRAVIA|DTV/i;

/**
 *  Safely get client IP from req.ip / x-forwarded-for / socket
 */
function getClientIp(req) {
  let ip = "";

  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    ip = xff.split(",")[0].trim();
  } else if (req.ip) {
    ip = req.ip;
  } else if (req.connection?.remoteAddress) {
    ip = req.connection.remoteAddress;
  } else if (req.socket?.remoteAddress) {
    ip = req.socket.remoteAddress;
  }

  // Normalize IPv6 mapped IPv4 (::ffff:1.2.3.4 → 1.2.3.4)
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return ip;
}

/**
 *  Middleware: Restrict login to office network or approved WFH users
 */
export const enforceLoginRestrictions = (req, res, next) => {
  try {
    const clientIp = getClientIp(req);
    console.log("Detected client IP:", clientIp);
    console.log("X-Forwarded-For:", req.headers["x-forwarded-for"], "req.ip:", req.ip);

    const ua = req.headers["user-agent"] || "";
    const isMobile = MOBILE_REGEX.test(ua);
    const isTablet = TABLET_REGEX.test(ua);
    const isTv = TV_REGEX.test(ua);

    //  Identify user (depends on your login system)
    const userEmail =
      req.body?.username;

    const isWfhAllowed = userEmail && WFH_ALLOWED_USERS.has(userEmail);
    console.log("WFH_ALLOWED_USERS",WFH_ALLOWED_USERS)
    console.log("userEmail",userEmail)
    console.log("isWfhAllowed",isWfhAllowed)

    //  Step 1: IP Restriction (Skip for WFH users)
    if (!isWfhAllowed && !ALLOWED_IPS.has(clientIp)) {
      return res.status(403).json({
        status: "error",
        message: "Please connect your device to the office Wi-Fi network to login.",
        details: { ip: clientIp },
      });
    }

    //  Step 2: Device Restriction (applies to all)
    if (isMobile || isTablet || isTv) {
      return res.status(403).json({
        status: "error",
        message: "Login is allowed only from desktop/laptop devices.",
        details: { userAgent: ua },
      });
    }

    //  Step 3: (Optional) Online header check
    /*
    const clientOnlineHeader = String(req.headers["x-client-online"] || "").toLowerCase();
    if (clientOnlineHeader && clientOnlineHeader !== "true") {
      return res.status(403).json({ status: "error", message: "Client reported offline state" });
    }
    */

    console.log(`Login restriction passed for ${userEmail || "unknown user"}`);
    return next();
  } catch (error) {
    console.error("Login restriction error:", error);
    return res.status(403).json({
      status: "error",
      message: "Login not allowed",
      error: error.message,
    });
  }
};

export default enforceLoginRestrictions;
