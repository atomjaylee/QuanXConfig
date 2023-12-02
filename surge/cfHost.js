const ssid = $network.wifi.ssid;
// $notification.post("SSID名称", "", ssid);
if (ssid == "Kikyo") {
  $done({ address: "104.21.230.67", ttl: 600 });
} else if (ssid == "atomjaylee" || ssid == "atomjaylee_5G") {
  $done({ address: "162.159.43.32", ttl: 600 });
} else if (ssid == null) {
  $done({ address: "162.159.43.32", ttl: 600 });
} else {
  $done({});
}
