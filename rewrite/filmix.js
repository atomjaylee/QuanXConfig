var anye = JSON.parse($response.body)
anye = {
  "first_vip_start_time" : "2025-04-28T03:46:04Z",
  "year_total_match" : 2,
  "hash_version" : 0,
  "created_at" : "2025-03-08T02:38:54.339Z",
  "check_appleid_subscription" : false,
  "userprofile_id" : "_42a87dba768b4b7e7300b54f9e15397a",
  "vip_start_time" : "2025-04-28T03:46:01Z",
  "token" : "dc4768a21edba9193f05c9aac06053763c602ae8",
  "vip_level" : 2,
  "updated_at" : "2025-06-25T06:49:53.210Z",
  "app_account_token" : "cffa043b-f905-4f55-89fc-50966a523217",
  "is_need_refresh" : false,
  "is_vip" : true,
  "user" : {
    "username" : "4a70ea",
    "id" : 13534,
    "email" : "",
    "is_active" : true
  },
  "vip_end_time" : "2099-04-28T03:46:01Z"
}

$done({body : JSON.stringify(anye)})