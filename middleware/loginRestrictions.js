// middleware/restrictLogin.js

const ALLOWED_IPS = new Set(["45.116.117.147", "103.248.119.226"]);

const WFH_ALLOWED_USERS = new Set([
  "rupam.priya@unifostedu.com",
  "neha.suman@unifostedu.com",
  "kajal.patil@unifostedu.com",
]);
const MOBILE_ALLOWED_USERS = new Set([
  "alka.unifost@gmail.com",
  "anjli.unifost@gmail.com",
  "amanunifost2000@gmail.com",
  "manjesh.unifost@gmail.com"
  
]);

const MOBILE_REGEX = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
const TABLET_REGEX = /iPad|Tablet|Nexus 7|Nexus 10|SM-T\w+|Kindle|Silk/i;
const TV_REGEX = /SmartTV|AppleTV|HbbTV|NetCast|Tizen|Web0S|webOS.TV|Viera|BRAVIA|DTV/i;

function getClientIp(req) {
  let ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
           req.ip ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           "";

  if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");
  return ip;
}

function getUserIdentifier(req) {
  return req.body?.username?.toLowerCase() || null;
}

export const enforceLoginRestrictions = (req, res, next) => {
  try {
    const clientIp = getClientIp(req);
    const userIdentifier = getUserIdentifier(req);

    const isWfhUser = userIdentifier && WFH_ALLOWED_USERS.has(userIdentifier);

    // IP Restriction
    if (!isWfhUser && !ALLOWED_IPS.has(clientIp)) {
      return res.status(403).json({
        status: "error",
        message: "Please connect your device to the office wifi network to login",
        details: { ip: clientIp }
      });
    }

    // Device Type Restriction (User-Agent)
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

    // *************  NEW: SCREEN SIZE VALIDATION  *************
    const rawDeviceWidth =
      req.body.deviceWidth ;
    const deviceWidth =
      rawDeviceWidth !== null && rawDeviceWidth !== ""
        ? Number(rawDeviceWidth)
        : null;
    const hasValidDeviceWidth = Number.isFinite(deviceWidth);
    const isMobileOverrideUser =
      userIdentifier && MOBILE_ALLOWED_USERS.has(userIdentifier);
    const requiresDeviceWidth = !isMobileOverrideUser;

    console.log("deviceWidth", deviceWidth);

    if (requiresDeviceWidth && !hasValidDeviceWidth) {
      return res.status(403).json({
        status: "error",
        message: "Device width missing. Please update your app.",
      });
    }

    // Mobile screens (even in desktop-mode) are < 800px
    if (isMobileOverrideUser) {
      console.log("Mobile allowed users");
      return next();
    } else if (deviceWidth !== null && deviceWidth < 1050) {
      return res.status(403).json({
        status: "error",
        message: "Login not allowed from mobile or desktop-mode browser.",
        details: { width: deviceWidth }
      });
    }
    
    // **********************************************************

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
