// middleware/restrictLogin.js

// WFH allowed users - login from anywhere
const WFH_ALLOWED_USERS = new Set([
  "rupam.priya@unifostedu.com",
  "neha.suman@unifostedu.com",
]);

// Users who can set office IP 
const TRUSTED_IP_SETTERS = new Set([
  "atul.prasad@unifostedu.com",
  "brishbhan.singh.bhadoriya@unifostedu.com"
]);


const MOBILE_ALLOWED_USERS = new Set([
  // "example@unifostedu.com"  // Uncomment to allow mobile
]);

// Device detection regex
const MOBILE_REGEX = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
const TABLET_REGEX = /iPad|Tablet|Nexus 7|Nexus 10|SM-T\w+|Kindle|Silk/i;
const TV_REGEX = /SmartTV|AppleTV|HbbTV|NetCast|Tizen|Web0S|webOS.TV|Viera|BRAVIA|DTV/i;

// Dynamic office IP
let CURRENT_OFFICE_IP = null;

/**
 * Get client IP address from request
 */
function getClientIp(req) {
  let ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
           req.ip ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           "";

  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }
  
  return ip;
}

/**
 * Get user identifier (email/username) from request
 */
function getUserIdentifier(req) {
  return req.body?.username?.toLowerCase() || null;
}

/**
 * Main middleware to enforce login restrictions
 */
export const enforceLoginRestrictions = (req, res, next) => {
  try {
    const clientIp = getClientIp(req);
    const userIdentifier = getUserIdentifier(req);

    console.log("Login attempt from:", { ip: clientIp, user: userIdentifier });

    //  Trusted users (HR/IT) → set office IP and allow
    if (userIdentifier && TRUSTED_IP_SETTERS.has(userIdentifier)) {
      CURRENT_OFFICE_IP = clientIp;
      console.log("✅ Office IP updated by trusted user:", userIdentifier, "→", clientIp);
      return next();
    }

    //  Check if user is in mobile allowed list
    const isMobileAllowedUser = userIdentifier && MOBILE_ALLOWED_USERS.has(userIdentifier);

    //  Device Type Detection
    const ua = req.headers["user-agent"] || "";
    const isMobile = MOBILE_REGEX.test(ua);
    const isTablet = TABLET_REGEX.test(ua);
    const isTv = TV_REGEX.test(ua);
    const isMobileDevice = isMobile || isTablet || isTv;

    //  Block mobile/tablet UNLESS user is in allowed list
    if (isMobileDevice && !isMobileAllowedUser) {
      return res.status(403).json({
        status: "error",
        message: "Mobile/Tablet login is not allowed for your account. Please use a laptop or desktop.",
        details: { 
          userAgent: ua,
          deviceType: isMobile ? "Mobile" : isTablet ? "Tablet" : "TV",
          hint: "Contact HR/IT to request mobile access"
        }
      });
    }

    //   WFH users → skip IP check
    const isWfhUser = userIdentifier && WFH_ALLOWED_USERS.has(userIdentifier);

    //   IP Restriction (skip for WFH users)
    if (!isWfhUser) {
      if (!CURRENT_OFFICE_IP) {
        return res.status(403).json({
          status: "error",
          message: "Office IP not set. Please contact HR/IT to set the office IP first.",
          details: { currentIp: clientIp }
        });
      }

      if (clientIp !== CURRENT_OFFICE_IP) {
        return res.status(403).json({
          status: "error",
          message: "Please connect your device to the office network to login",
          details: { 
            yourIp: clientIp,
            officeIp: CURRENT_OFFICE_IP 
          }
        });
      }
    }

    //  Screen Width Validation (skip for mobile allowed users)
    if (!isMobileAllowedUser) {
      const rawDeviceWidth = req.body.deviceWidth;
      const deviceWidth = rawDeviceWidth !== null && rawDeviceWidth !== "" 
        ? Number(rawDeviceWidth) 
        : null;
      const hasValidDeviceWidth = Number.isFinite(deviceWidth);

      console.log("Device width check:", { 
        width: deviceWidth, 
        valid: hasValidDeviceWidth
      });

      // Check if device width is required but missing
      if (!hasValidDeviceWidth) {
        return res.status(403).json({
          status: "error",
          message: "Device width missing. Please update your app or refresh the page.",
        });
      }

      // Block small screens
      if (deviceWidth < 1050) {
        return res.status(403).json({
          status: "error",
          message: "Login not allowed from mobile or small-screen browser.",
          details: { 
            width: deviceWidth,
            minimumRequired: 1050 
          }
        });
      }
    } else {
      console.log("✅ Mobile allowed user - skipping screen width check:", userIdentifier);
    }

    // ✅ All checks passed
    console.log("✅ Login restrictions passed for:", userIdentifier);
    return next();

  } catch (error) {
    console.error("❌ Login Restriction Error:", error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred during login validation",
      error: error.message
    });
  }
};

export default enforceLoginRestrictions;