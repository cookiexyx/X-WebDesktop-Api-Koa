/**
 * Created by OXOYO on 2018/3/9.
 */

import axios from 'axios'
import Model from './Model'
import utils from '../utils'
import auth from '../auth'
import { cookieConfig, accountConfig } from '../config'

export default {
  user: {
    // 执行登录
    doSignIn: async (ctx, next) => {
      await next()
      let reqBody = ctx.request.body
      let res
      if (reqBody && reqBody.account && reqBody.password) {
        // 执行平台内用户查询
        // 加密密码
        let password = utils.des.encrypt(accountConfig.key, reqBody.password, 0)
        console.log('password', password)
        res = await Model.user.doSignIn({
          account: reqBody.account,
          password: password
        })
        console.log('xxx', res)
        let data = {
          userInfo: res
        }
        // 处理结果
        if (res) {
          let userInfo = {
            account: res.account,
            userId: res.id,
            type: res.type,
            status: res.status
          }
          let token = auth.sign(userInfo)

          if (token) {
            // 设置返回token
            data[cookieConfig.keys.token] = token
            res = {
              status: 200,
              msg: '登录成功！',
              data: data
            }
          } else {
            res = {
              status: 5000,
              msg: '登录失败，生成Token失败！',
              data: data
            }
          }
        } else {
          // 动态获取管理员
          let adminInfo = await Model.user.getOneAdmin()
          res = {
            status: 5000,
            msg: '登录失败！' + (adminInfo && adminInfo.account && adminInfo.name ? '请联系管理员 ' + adminInfo.name + ' (' + adminInfo.account + ')' : ''),
            data: data
          }
        }
      } else {
        res = {
          status: 5001,
          msg: '登录失败，上送参数有误！',
          data: {}
        }
      }
      ctx.body = res || {}
    },
    // 获取用户基本信息
    getBaseInfo: async (ctx, next) => {
      await next()
      // TODO 处理参数
      let userInfo = ctx.userInfo
      let res
      if (userInfo && userInfo.userId) {
        // 查询结果
        res = await Model.user.getBaseInfo(userInfo.userId)
        // 处理结果
        if (res) {
          res = {
            status: 200,
            msg: '获取用户基本信息成功！',
            data: res
          }
        } else {
          res = {
            status: 5000,
            msg: '获取用户基本信息失败！',
            data: res
          }
        }
      } else {
        res = {
          status: 5001,
          msg: '获取用户基本信息失败，上送参数有误！',
          data: {}
        }
      }
      ctx.body = res || {}
    },
    // 获取用户的平台配置信息
    getPlatformConfigByUserId: async (ctx, next) => {
      await next()
      // 处理参数
      let reqQuery = ctx.query
      let res
      if (reqQuery && reqQuery.userId) {
        // 查询结果
        res = await Model.user.getPlatformConfigByUserId(reqQuery.userId)
        // 处理结果
        if (res) {
          res = {
            status: 200,
            msg: '查询成功！',
            data: res
          }
        } else {
          res = {
            status: 5000,
            msg: '查询失败！',
            data: res
          }
        }
      } else {
        res = {
          status: 5001,
          msg: '查询失败，上送参数有误！',
          data: {}
        }
      }

      ctx.body = res || {}
    },
    getApplicationListByUserId: async (ctx, next) => {
      await next()
      // TODO 处理参数
      // let reqQuery = ctx.query
      let userInfo = ctx.userInfo
      let res
      if (userInfo && userInfo.userId) {
        // 查询结果
        res = await Model.user.getApplicationListByUserId(userInfo.userId)
        // 处理结果
        if (res) {
          res = {
            status: 200,
            msg: '获取用户应用列表成功！',
            data: {
              count: res.count,
              list: res.rows
            }
          }
        } else {
          res = {
            status: 5000,
            msg: '获取用户应用列表失败！',
            data: res
          }
        }
      } else {
        res = {
          status: 5001,
          msg: '获取用户应用列表失败，上送参数有误！',
          data: {}
        }
      }
      ctx.body = res || {}
    },
    doAppPinnedUpdate: async (ctx, next) => {
      await next()
      let reqBody = ctx.request.body
      let userInfo = ctx.userInfo
      let res
      if (userInfo && userInfo.userId) {
        // 1.先查找用户应用
        let appDetail = await Model.user.getApplicationDetailByUserId({
          user_id: userInfo.userId,
          app_id: reqBody['appId']
        })
        // 2.处理config
        if (appDetail) {
          let appConfig = appDetail.config ? JSON.parse(appDetail.config) : { 'taskBar': {} }
          appConfig['taskBar']['isPinned'] = reqBody['isPinned']
          // 3.执行更新
          let timeNow = new Date()
          let data = {
            user_id: userInfo.userId,
            app_id: reqBody['appId'],
            config: JSON.stringify(appConfig),
            update_time: timeNow
          }
          // 查询结果
          res = await Model.user.doAppPinnedUpdate(data)
          // 处理结果
          if (res) {
            res = {
              status: 200,
              msg: reqBody['isPinned'] ? '锁定成功！' : '解锁成功！',
              data: res
            }
          } else {
            res = {
              status: 5000,
              msg: reqBody['isPinned'] ? '锁定失败！' : '解锁失败！',
              data: res
            }
          }
        } else {
          res = {
            status: 5000,
            msg: reqBody['isPinned'] ? '锁定失败！' : '解锁失败！',
            data: appDetail
          }
        }
      } else {
        res = {
          status: 5001,
          msg: '更新失败，上送参数有误！',
          data: {}
        }
      }

      ctx.body = res || {}
    }
  },
  components: {
    getBingWallpaper: async (ctx, next) => {
      await next()
      let reqQuery = ctx.query
      let bingApi = 'http://cn.bing.com/HPImageArchive.aspx'
      let payload = {
        format: reqQuery.format || 'js',
        idx: reqQuery.idx || 0,
        n: reqQuery.n || 1
      }
      let res
      try {
        res = await axios.get(bingApi, {
          params: payload
        })
        res = {
          status: 200,
          msg: '获取bing壁纸成功！',
          data: res.data
        }
      } catch (err) {
        res = {
          status: 5000,
          msg: '获取bing壁纸失败',
          data: err
        }
      }
      ctx.body = res || {}
    }
  }
}
