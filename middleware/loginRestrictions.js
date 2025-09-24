// middleware/restrictLogin.js

// Allowed IPs (Static IPs from ISP/Office)
const ALLOWED_IPS = new Set(["45.116.117.147", "103.248.119.226"]);

// Regex checks for device types
const MOBILE_REGEX = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
const TABLET_REGEX = /iPad|Tablet|Nexus 7|Nexus 10|SM-T\w+|Kindle|Silk/i;
const TV_REGEX = /SmartTV|AppleTV|HbbTV|NetCast|Tizen|Web0S|webOS.TV|Viera|BRAVIA|DTV/i;

/**
 * Get client IP safely from req.ip / x-forwarded-for / socket
 */
function getClientIp(req) {
  let ip = "";

  // Prefer x-forwarded-for (when behind proxy/load balancer)
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

  // Normalize IPv6-mapped IPv4 (::ffff:1.2.3.4 → 1.2.3.4)
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return ip;
}

/**
 * Middleware to enforce restrictions:
 * 1. IP restriction
 * 2. Only Desktop/Laptop devices allowed
 * 3. Online check (optional via client header)
 */
export const enforceLoginRestrictions = (req, res, next) => {
  try {
    // Get client IP
    const clientIp = getClientIp(req);
    console.log("Detected client IP:", clientIp);
    // Extra diagnostics to verify proxy headers and Express ip resolution
    console.log("X-Forwarded-For:", req.headers["x-forwarded-for"], "req.ip:", req.ip);

    // Restrict by IP
    if (!ALLOWED_IPS.has(clientIp)) {
      return res.status(403).json({
        status: "error",
        message: "Please connnect your device to the office wifi network to login",
        details: { ip: clientIp }
      });
    }

    // Restrict by Device Type
    const ua = req.headers["user-agent"] || "";
    const isMobile = MOBILE_REGEX.test(ua);
    const isTablet = TABLET_REGEX.test(ua);
    const isTv = TV_REGEX.test(ua);

    if (isMobile || isTablet || isTv) {
      return res.status(403).json({
        status: "error",
        message: "Login is allowed only from desktop/laptop devices",
        details: { userAgent: ua }
      });
    }

    // (Optional) Client must confirm online state via header
    // Uncomment this if you also want to enforce navigator.onLine check
    /*
    const clientOnlineHeader = String(req.headers["x-client-online"] || "").toLowerCase();
    if (clientOnlineHeader && clientOnlineHeader !== "true") {
      return res.status(403).json({ status: "error", message: "Client reported offline state" });
    }
    */

    // ✅ All checks passed
    return next();
  } catch (error) {
    console.error("Login restriction error:", error);
    return res.status(403).json({
      status: "error",
      message: "Login not allowed",
      error: error.message
    });
  }
};

export default enforceLoginRestrictions;
