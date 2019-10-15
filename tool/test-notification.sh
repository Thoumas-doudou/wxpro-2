#!/bin/bash

curl -X POST https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send\?access_token\=17_-Bgju1hhqiKbtrdc34So4vS5LYkWPGddOUqbeOW-YpCZL4bHf5FuSNLsMg0KMQSmcxS93Uz5G5ujqhdwW6Vbn_67jmk9f_dScWWJzaBUpsUc3hijf8cX1-2rZQlQAZWMJ6mS_WjZXrRAwKVYCANaAJALJW -d '{
  "touser": "$1",
  "template_id": "1GL7lmXTJt5F9m7ypBg-bvNNOF-ydwmkP9BV_Nw3DV4",
  "page": "/pages/post/post?id=3726",
  "form_id": "$2",
  "data": {
    "keyword1": {
      "value": "我是评论内容！"
    },
    "keyword2": {
      "value": "评论人的昵称"
    },
    "keyword3": {
      "value": "这是被评论的帖子的内容"
    },
    "keyword4": {
      "value": "2018年12月22日14:56:41"
    }
  },
  "emphasis_keyword": ""
}'
