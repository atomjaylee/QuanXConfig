var anye = JSON.parse($response.body)
anye = {
    "userprofile_id": "_42a87dba768b4b7e7300b54f9e15397a",
    "nickname": "Filmixer_4a70ea",
    "nickname_last_changed_at": null,
    "is_vip": true,
    "vip_level": 9,
    "user": {
        "id": 13534,
        "username": "七个老头",
        "email": "",
        "is_active": true
    },
    "token": "dc4768a21edba9193f05c9aac06053763c602ae8",
    "first_vip_start_time": "2025-04-28T03:46:04Z",
    "vip_start_time": "2025-04-28T03:46:01Z",
    "vip_end_time": "2099-04-28T03:46:01Z",
    "year_total_match": 38330,
    "created_at": "2025-03-08T02:38:54.339Z",
    "updated_at": "2025-10-02T05:07:01.793Z",
    "app_account_token": "cffa043b-f905-4f55-89fc-50966a523217",
    "is_need_refresh": false,
    "hash_version": 0,
    "check_appleid_subscription": false,
    "register_source": "apple",
    "social_auth": {
        "provider": "apple",
        "social_id": "001204.219d742d608549e38c0fea255a481c55.0416",
        "social_username": "\u674e\u6770",
        "social_email": "t4fqcrxfvp@privaterelay.appleid.com",
        "is_email_hidden": true
    },
    "source_config_upload_status": "completed"
}

$done({body : JSON.stringify(anye)})
