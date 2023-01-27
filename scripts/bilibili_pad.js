if (!$response.body) $done({});
const url = $request.url;
let obj = JSON.parse($response.body);

if (obj.data) {
  // 开启本地会员标识
  obj.data.vip_type = 2;
  obj.data.vip.type = 2;
  obj.data.vip.status = 1;
  obj.data.vip.vip_pay_type = 1;
  obj.data.vip.due_date = 2208960000; // Unix 时间戳 2040-01-01 00:00:00
}

body = JSON.stringify(obj);
$done({ body });
