const ssid = $network.wifi.ssid;
// $notification.post("SSID名称", "", ssid);
if (ssid == "Kikyo") {
  $done({ address: "173.245.49.134", ttl: 600 });
} else if (ssid == "atomjaylee") {
  $done({ address: "104.17.141.223", ttl: 600 });
} else if (ssid == null) {
  $done({ address: "104.17.141.223", ttl: 600 });
} else {
  $done({});
}
