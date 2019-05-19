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
function login(url = '') {
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
              data: res.header['Set-Cookie'].match(/laravel_session=(.*);/)[1].split(';')[0],
              success: res => {
                console.log(res)
                wx.hideLoading()
                if (url !== '') {
                  wx.reLaunch({
                    url: url,
                    fail: res => {
                      console.log('fail', res)
                    }
                  })
                }
              }
            })
            wx.setStorage({
              key: 'token',
              data: res.header['Set-Cookie'].match(/XSRF-TOKEN=(.*);/)[1].split(';')[0],
            })
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
        if (res.statusCode === 403) {
          // 登陆过期，重新执行login，更新本地缓存的session后再重新发送请求
          wx.hideLoading()
          wx.showModal({
            title: '登陆过期',
            content: '您的身份认证信息已过期，请重新登陆',
            confirmText: '重新登陆',
            success: res => {
              if (res.confirm) {
                // eslint-disable-next-line no-undef
                let pages = getCurrentPages()
                let url = pages[pages.length - 1].route
                wx.showLoading({
                  title: '登陆中'
                })
                login(url)
              } else if (res.cancel) {
                console.log('cancel')
              }
            }
          })
        } else {
          if (res.data.ret_code === 0) {
            resolve(res)
          } else {
            wx.showModal({
              title: '',
              content: res.data.ret_msg,
              showCancel: false
            })
          }
        }
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
