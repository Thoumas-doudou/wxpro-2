#!/usr/bin/env python
# -*- coding: utf-8 -*-
print '======================================================================='
print '这个脚本需要requests库。'
print '如果提示找不到requests模块，请先执行pip install requests之后再跑这个脚本'
print '======================================================================='
print ''

#脚本用来生成小程序码。
#详情请参考 
#doc-1 获取access_token: https://developers.weixin.qq.com/miniprogram/dev/api/open-api/access-token/getAccessToken.html
#doc-2 生成小程序码：https://developers.weixin.qq.com/miniprogram/dev/api/open-api/qr-code/getWXACode.html
#主要步骤：1. 获取access_token; 2. 用access_token调用api生成二维码。

import requests as req
import time
import json
import sys

#总的获取token的入口。
#token有个过期时间。过期之前可以反复使用。
#所以我们把token和过期时间存到本地的token.txt里。第一行是token，第二行是过期时间戳。
#如果有缓存token，且没有过期，就返回缓存的token。
#否则调用api拉取新的token.
def getToken():
    f = None
    try:
        f = open('token.txt', 'r')
        lines = [line.strip() for line in f]
        [token, expire] = lines
        print '找到了缓存token: ', token
        if time.time() > int(expire):
            print '缓存token已过期，拉取新的token...'
            return getNewToken()
        return token
    except Exception, e:
        if f:
            f.close()
            f = None
        print '没有缓存的token，拉取新的token...'
        return getNewToken()
    return None

#拉取新的token，并更新缓存文件token.txt。第一行是token，第二行是过期时间戳
def getNewToken():
    tokenRes = req.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx6b91acc90141a2c5&secret=f260ed7357d9673d203048ce1f13f9be')
    print 'response code: ', tokenRes.status_code
    print 'response text: ', tokenRes.text
    tokenResponse = tokenRes.json()
    token = tokenResponse['access_token']
    expire = tokenResponse['expires_in']
    expireAt = int(time.time()) + expire - 10*60*1000

    f = open('token.txt', 'w')
    f.writelines([token, '\n', str(expireAt)])
    f.close()
    print '拉取到了新的token: ', token, ', 存储在token.txt中'
    return token

#生成小程序码。个数有上限。优点是不用动代码就能支持。
def getQrCode(postId):
    print '为帖子id ', postId, ' 生成二维码'
    token = getToken()
    params = {
        "path": "/pages/index/share-router?url=/pages/post/post?id=" + postId,
        #"auto_color": True
    }
    #这个是正统的方块二维码
    #r = req.post('https://api.weixin.qq.com/cgi-bin/wxaapp/createwxaqrcode?access_token='+token, data = json.dumps(params))
    #这个是放射形的小程序码
    r = req.post('https://api.weixin.qq.com/wxa/getwxacode?access_token='+token, data = json.dumps(params))
    f = open('qrcode-%s.png' % postId, 'wb')
    f.write(r.content)
    f.close()
    print '二维码已保存到qrcode-%s.png中' % postId 

#生成小程序码。个数无上限。需要添加代码处理特殊字段。
#给小程序传的参数只能传32个字符，而且只能是数字字母和标点符号，不支持%，所以不能encodeURI，传中文需要用其他编码
def getQrCodeUnlimited(postId):
    print '为帖子id ', postId, ' 生成无限制(指不限制生成数量)小程序码'
    token = getToken()
    params = {
        "page": "pages/index/share-router",
        "scene": "/pages/post/post?id=" + postId,
        #"auto_color": True
    }
    r = req.post('https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token='+token, data = json.dumps(params))
    f = open('qrcode-unlimited-%s.png' % postId, 'wb')
    f.write(r.content)
    f.close()
    print '小程序码已保存到qrcode-unlimited-%s.png中' % postId 

#要求脚本的要有一个入口参数：帖子ID
if len(sys.argv) is not 2:
    print '请传入帖子id. 例如'
    print './generate_qr_codes.py 19'
    exit(1)

postId = sys.argv[1] 
print 'postId = ', postId
#getQrCode(postId)
getQrCodeUnlimited(postId)
