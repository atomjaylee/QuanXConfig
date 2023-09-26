const ssid = $network.wifi.ssid;
// $notification.post("SSID名称", "", ssid);
if (ssid == "Kikyo") {
  $done({ address: "172.66.2.111", ttl: 600 });
} else if (ssid == "atomjaylee" || ssid == "atomjaylee_5G") {
  $done({ address: "104.18.124.62", ttl: 600 });
} else if (ssid == null) {
  $done({ address: "104.18.124.62", ttl: 600 });
} else {
  $done({});
}
