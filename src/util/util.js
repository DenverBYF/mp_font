/* 公共函数文件 */
const baseUrl = 'https://ivanbai.club'

/*
* 获取用户基本信息，存入本地储存
*/
function getUserInfo() {
  wx.getUserInfo({
    withCredentials: true,
    lang: 'zh_CN',
    success: res => {
      wx.setStorage({
        key: 'userInfo',
        data: res.userInfo
      })
    }
  })
}

/*
* 用户登陆函数，获取平台session，存入本地储存
*/
function login() {
  wx.login({
    success (res) {
      if (res.code) {
        // 换取平台session
        req({
          url: '/mplogin',
          data: {
            code: res.code
          }
        }).then(res => {
          if (res.data.ret_code) {
            console.log('login fail' + res.data.ret_msg)
          } else {
            console.log('login success')
            wx.setStorage({
              key: 'session',
              data: res.header['Set-Cookie'].match(/laravel_session=(.*);/)[1].split(';')[0]
            })
            wx.setStorage({
              key: 'token',
              data: res.header['Set-Cookie'].match(/XSRF-TOKEN=(.*);/)[1].split(';')[0]
            });
          }
        }).catch(res => {
          console.log('error')
        })
      } else {
        console.log('登录失败！' + res.errMsg)
      }
    }
  })
}

/*
* 网络请求函数，返回Promise对象
* obj.showLoading => 控制是否现实Loading框
*/
function req(obj = {
  method: 'GET',
  data: {},
  header: {},
  dataType: 'json',
  responseType: 'text',
  showLoading: false
}) {
  if (obj.showLoading) {
    wx.showLoading({
      title: 'Loading'
    })
  }
  let baseHeader = {
    'cookie': 'laravel_session=' + wx.getStorageSync('session')
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: baseUrl + obj.url,
      header: Object.assign({}, baseHeader, obj.header),
      data: obj.data,
      method: obj.method,
      dataType: obj.dataType,
      responseType: obj.responseType,
      success: res => {
        resolve(res)
      },
      fail: res => {
        reject(res)
      },
      complete: res => {
        if (obj.showLoading) {
          wx.hideLoading()
        }
      }
    })
  })
}

module.exports = {
  req: req,
  login: login,
  getUserInfo: getUserInfo
}
