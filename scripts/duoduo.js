/*
 * @Date: 2023-01-16 11:20:27
 * @FilePath: /QuanXConfig/scripts/duoduo.js
 * @LastEditTime: 2023-01-16 11:32:14
 * @Description: 多多视频VIP测试
 */

if (!$response.body) $done({});
const url = $request.url;
let obj = JSON.parse($response.body);

if (obj.data) {
  obj.data.level = "99";
  obj.data.valid = false;
  obj.data.expiredTime = +new Date("2099/12/31");
}

body = JSON.stringify(obj);
$done({ body });
