/*
 * 贝乐虎古诗 5.8.2 — 本地课程/会员响应改写
 * Surge http-response script. No network requests or persistent storage.
 * Based on responses captured on 2026-11-08.
 * This changes client-visible responses, not the server's account records.
 */
(function () {
  "use strict";

  var COURSE = /^https:\/\/aicblhapp\.ubestkid\.com\/course\/get[A-Za-z0-9_]+(?:\?[^#]*)?$/;
  var PROFILE = /^https:\/\/uc\.ubestkid\.com\/web\/user\/getUserProfile(?:\?[^#]*)?$/;
  var TARGET_MEMBERSHIP = "com.ubestkid.supervip";
  var UNTIL_MS = 4102444799000; // 2099-12-31 23:59:59 UTC
  var changed = 0;

  function object(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function put(target, key, value) {
    if (target[key] !== value) {
      target[key] = value;
      changed += 1;
    }
  }

  function extendExpiry(target, key) {
    var old = target[key];
    // Captured responses use milliseconds. Preserve positive seconds if encountered.
    if (typeof old !== "number" || !Number.isFinite(old) || old < 0) return;
    var future = old > 0 && old < 100000000000 ? Math.floor(UNTIL_MS / 1000) : UNTIL_MS;
    put(target, key, Math.max(old, future));
  }

  function course(value) {
    if (Array.isArray(value)) {
      value.forEach(course);
      return;
    }
    if (!object(value)) return;

    // Modify only the numeric flags observed in the app's course responses.
    if (value.free === 0) put(value, "free", 1);
    if (value.unlockStatus === 0) put(value, "unlockStatus", 1);
    if (object(value.userData)) {
      if (value.userData.bought === 0) put(value.userData, "bought", 1);
      extendExpiry(value.userData, "expiretime");
      // identity / boughtTime / timestamp are deliberately preserved:
      // their full semantics were not established by the captured sample.
    }

    Object.keys(value).forEach(function (key) {
      // Do not rewrite product definitions, account data, or encoded extData.
      if (key !== "userData" && key !== "product" && key !== "products" && key !== "extData") {
        course(value[key]);
      }
    });
  }

  function profile(result) {
    if (!Array.isArray(result.membershipResponse)) return;
    result.membershipResponse.forEach(function (membership) {
      if (object(membership) && membership.name === TARGET_MEMBERSHIP) {
        extendExpiry(membership, "expireDate");
        // Preserve the observed rightType; do not invent an unverified paid-tier enum.
      }
    });
  }

  var output = {};
  try {
    var url = typeof $request === "object" ? $request.url : "";
    var isCourse = COURSE.test(url);
    var isProfile = PROFILE.test(url);
    var status = Number($response.status);
    if ((!isCourse && !isProfile) || status < 200 || status >= 300 || !Number.isFinite(status)) {
      $done(output);
      return;
    }
    if (typeof $response.body !== "string" || !$response.body.trim()) {
      $done(output);
      return;
    }
    var body = JSON.parse($response.body);
    if (!object(body) || body.errorCode !== 0 || (!object(body.result) && !Array.isArray(body.result))) {
      $done(output);
      return;
    }
    if (isCourse) course(body.result);
    else if (object(body.result)) profile(body.result);

    if (changed > 0) {
      output.body = JSON.stringify(body);
      console.log("[ubestkid-local] " + (isCourse ? "course" : "profile") + ": " + changed + " fields changed");
    }
  } catch (error) {
    // Keep the original response if parsing or processing fails. Never log its contents.
    output = {};
    console.log("[ubestkid-local] response passed through: " + (error && error.name ? error.name : "error"));
  }
  $done(output);
}());
