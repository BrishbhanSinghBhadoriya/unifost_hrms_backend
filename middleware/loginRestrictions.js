// middleware/restrictLogin.js

// WFH allowed users
const WFH_ALLOWED_USERS = new Set([
  "rupam.priya@unifostedu.com",
  "neha.suman@unifostedu.com",
]);

// Users who can set office IP (HR / IT) - login allowed from anywhere and can update office IP
const TRUSTED_IP_SETTERS = new Set([
  "atul.prasad@unifostedu.com",
  "brishbhan.singh.bhadoriya@unifostedu.com"
]);

// Users allowed to login from mobile (optional)
const MOBILE_ALLOWED_USERS = new Set([]);

// Device detection regex
const MOBILE_REGEX = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
const TABLET_REGEX = /iPad|Tablet|Nexus 7|Nexus 10|SM-T\w+|Kindle|Silk/i;
const TV_REGEX = /SmartTV|AppleTV|HbbTV|NetCast|Tizen|Web0S|webOS.TV|Viera|BRAVIA|DTV/i;

// Dynamic office IP
let CURRENT_OFFICE_IP = null;

// Get client IP from request
function getClientIp(req) {
  let ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
           req.ip ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           "";

  if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");
  return ip;
}

// Get user identifier (email/username)
function getUserIdentifier(req) {
  return req.body?.username?.toLowerCase() || null;
}

// Main middleware
export const loginRestriction = (req, res, next) => {
  try {
    const clientIp = getClientIp(req);
    const userIdentifier = getUserIdentifier(req);

    // 🔹 Trusted users → set office IP
    if (userIdentifier && TRUSTED_IP_SETTERS.has(userIdentifier)) {
      CURRENT_OFFICE_IP = clientIp;
      console.log("Office IP updated by trusted user:", userIdentifier, clientIp);
      return next();
    }

    //  WFH users → login from anywhere
    if (userIdentifier && WFH_ALLOWED_USERS.has(userIdentifier)) {
      return next();
    }

    //  Normal employees → must be connected to office IP
    if (!CURRENT_OFFICE_IP || clientIp !== CURRENT_OFFICE_IP) {
      return res.status(403).json({
        status: "error",
        message: "Please connect your device to the office network to login",
        details: { ip: clientIp }
      });
    }

    // 🔹 Device type detection
    const ua = req.headers["user-agent"] || "";
    const isMobile = MOBILE_REGEX.test(ua);
    const isTablet = TABLET_REGEX.test(ua);
    const isTv = TV_REGEX.test(ua);

    // 🔹 Screen width validation (frontend must send deviceWidth)
    const rawDeviceWidth = req.body.deviceWidth;
    const deviceWidth = rawDeviceWidth ? Number(rawDeviceWidth) : 0;

    const isMobileOverrideUser =
      userIdentifier && MOBILE_ALLOWED_USERS.has(userIdentifier);

    // Block login if device is mobile/tablet/TV or width < 1050 and not override user
    if (!isMobileOverrideUser && (isMobile || isTablet || isTv || deviceWidth < 1050)) {
      return res.status(403).json({
        status: "error",
        message: "Login not allowed from mobile, tablet, TV or small screen browser",
        details: { userAgent: ua, width: deviceWidth }
      });
    }

    
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

export default loginRestriction;
