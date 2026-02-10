// middleware/restrictLogin.js

// WFH allowed users (ghar se login allowed)
const WFH_ALLOWED_USERS = new Set([
  "rupam.priya@unifostedu.com",
  "neha.suman@unifostedu.com",
]);

// Users jo office IP set kar sakte hain (HR / IT)
const TRUSTED_IP_SETTERS = new Set([
  "hr@company.com",
  "brishbhan.singh.bhadoriya@unifostedu.com"
]);

// Users jo mobile se login allowed
const MOBILE_ALLOWED_USERS = new Set([]);

// Device detection regex
const MOBILE_REGEX = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
const TABLET_REGEX = /iPad|Tablet|Nexus 7|Nexus 10|SM-T\w+|Kindle|Silk/i;
const TV_REGEX = /SmartTV|AppleTV|HbbTV|NetCast|Tizen|Web0S|webOS.TV|Viera|BRAVIA|DTV/i;

// Dynamic office IP
let CURRENT_OFFICE_IP = null;

// Function to get client IP
function getClientIp(req) {
  let ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
           req.ip ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           "";

  if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");
  return ip;
}

// Function to get user identifier (email/username)
function getUserIdentifier(req) {
  return req.body?.username?.toLowerCase() || null;
}

// Main middleware
export const enforceLoginRestrictions = (req, res, next) => {
  try {
    const clientIp = getClientIp(req);
    const userIdentifier = getUserIdentifier(req);

    //  Trusted users (HR / IT) → set office IP
    if (userIdentifier && TRUSTED_IP_SETTERS.has(userIdentifier)) {
      CURRENT_OFFICE_IP = clientIp;
      console.log("Office IP updated by trusted user:", userIdentifier, clientIp);
      return next();
    }

    //  WFH allowed users → login from anywhere
    if (userIdentifier && WFH_ALLOWED_USERS.has(userIdentifier)) {
      return next();
    }

    //  Normal employees → check office IP
    if (!CURRENT_OFFICE_IP || clientIp !== CURRENT_OFFICE_IP) {
      return res.status(403).json({
        status: "error",
        message: "Please connect your device to the office network to login",
        details: { ip: clientIp }
      });
    }

    //  Device type restriction
    const ua = req.headers["user-agent"] || "";
    const isMobile = MOBILE_REGEX.test(ua);
    const isTablet = TABLET_REGEX.test(ua);
    const isTv = TV_REGEX.test(ua);

    if (isMobile || isTablet || isTv) {
      return res.status(403).json({
        status: "error",
        message: "Login allowed only from laptop/desktop (Mobile detected)",
        details: { userAgent: ua }
      });
    }

    //  Screen width validation
    const rawDeviceWidth = req.body.deviceWidth;
    const deviceWidth =
      rawDeviceWidth !== null && rawDeviceWidth !== ""
        ? Number(rawDeviceWidth)
        : null;
    const hasValidDeviceWidth = Number.isFinite(deviceWidth);
    const isMobileOverrideUser =
      userIdentifier && MOBILE_ALLOWED_USERS.has(userIdentifier);
    const requiresDeviceWidth = !isMobileOverrideUser;

    if (requiresDeviceWidth && !hasValidDeviceWidth) {
      return res.status(403).json({
        status: "error",
        message: "Device width missing. Please update your app.",
      });
    }

    if (isMobileOverrideUser) {
      console.log("Mobile allowed user:", userIdentifier);
      return next();
    } else if (deviceWidth !== null && deviceWidth < 1050) {
      return res.status(403).json({
        status: "error",
        message: "Login not allowed from mobile or small-screen browser.",
        details: { width: deviceWidth }
      });
    }

    // ✅ All checks passed
    return next();

  } catch (error) {
    console.error("Login Restriction Error:", error);
    return res.status(403).json({
      status: "error",
      message: "Login not allowed",
      error: error.message
    });
  }
};

export default enforceLoginRestrictions;
