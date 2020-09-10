// pages/detail/index.js
/**
 *   没有登陆的情况下 不允许送礼物 但是可以评论
 */
import getUrl from '../../utils/api.js'
//设立顶部栏高度
const App = getApp();
/* 爱心点赞 */
var lastFrameTime = 0;
var ctx = null;
var liveBox = null
var factor = {
  speed: .006, // 运动速度，值越小越慢
  t: 0 //  贝塞尔函数系数
};
var that;
var iconNum;
var timer = null; // 循环定时器
var timerInterface = null
Page({
  /**
   * 页面的初始数据
   */
  data: {
    navH: null,
    detailId: null,
    videoUrl: '',
    isPlay: false,
    liveDetail: {},
    showInput: false, //是否展示评论框
    comValue: '', //评论的value
    videoPlay: false,
    videoContext: {},
    videoIndexpic: '',
    canvasList: [],
    commentList: [],
    startTime: null,
    deviceToken: null,
    socketStatus: 'closed',
    loveNum: 0,
    noticeText: '',
    toView: '',
    maskFlag: false,
    commentFlag: false,
    liveNoticeFlag: false,
    watch_num: '',
    allow_comment: null,
    img_path: [], //这里是贝塞尔曲线参数
    is_modal_Hidden: true,
    is_modal_Msg: '当前操作需要登录哦,是否登录？',
    maskDisplay: false,
    access_token: null,
    maskDisplay: false,
    giftShowStatus: false, //是否开启 送礼物底部模块
    giftNumSelect: 0, //当前选中的礼物
    isAttention: false, //是否关注此主播 liveDetail.is_care
    videoTimeOutStatus: false, //video播放状态
    videoConstIsShow: false, //是否显示控制栏
    videoTimeStart: '00:00', //视频开始时间
    videoTimeEnd: '00:00', //视频结束时间
    progressCircleLeft: '0', //视频圆的左边距
    videoControlsProgressSWidth: '0', //视频已经播放的长度
    userCurrencyType: {
      reward_user_credit: 0
    }, //用户积分信息
    resImgList: [], //礼物列表
    showGiftStatus: false, //是否显示 送礼物 展示
    isModelShowPage: false, //是否显示 结束结算页面
    goodsList: [], //赠送礼物 数组
    showGoodsObj: {
      giftImgSrc: '',
      username: '',
      goodsName: "",
      userImgSrc: "",
      showGoodsObj: true
    }, //当前显示的 礼物


  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('onload')
    this.getCommentListFun()
    that = this;
    setTimeout(() => {
      this.getUserIntegral();
      this.getGoodsList();
    }, 1000);
    //爱心
    setInterval(() => {
      this.getLoveNum()
    }, 5000);
    this.goodsShowFun()
    // that.setData({
    //   detailId: options.detailId
    // })
    //自定义头部方法
    that.setData({
      navH: App.globalData.navHeight
    });
    //获取canvas实例
    ctx = wx.createCanvasContext('mycanvas');
    var value = wx.getStorageSync('deviceToken');
    if (value) {
      that.setData({
        deviceToken: value
      })
    } else {
      wx.setStorageSync('deviceToken', that.genUniqHash())
      that.setData({
        deviceToken: wx.getStorageSync('deviceToken')
      })
    }
  },
  statechange(e) {
    // 直播结束判断
    if (e.detail.code == '2006' || e.detail.code == '3005') {
      this.setData({
        isModelShowPage: true
      })
    }
    // console.log('live-player code:', e.detail.code)
  },
  error(e) {
    // console.error('live-player error:', e.detail.errMsg)
  },
  // closeComment
  closeComment() {
    this.setData({
      commentFlag: false
    })
  },
  closeNotice() {
    this.setData({
      liveNoticeFlag: false
    })
  },
  // video 控制模块 播放/暂停
  videoPlayFun() {
    let videoDom = wx.createVideoContext('myVideo');
    videoDom.play();
    this.setData({
      videoTimeOutStatus: true,
      videoPlay: true
    });
  },
  // 视频 暂停
  videoTimeOutFun() {
    let videoDom = wx.createVideoContext('myVideo');
    videoDom.pause();
    this.setData({
      videoTimeOutStatus: false
    });
  },
  // 关注该主播
  isAttentionFun() {
    wx.showToast({
      title: '请下载海博APP，关注支持主播哦！',
      icon: 'none',
      duration: 3000
    })
  },
  // 获取唯一标识
  genUniqHash() {
    return Math.floor(Date.now() / 1000) + Math.random().toString().slice(2, 8);
  },
  //点击 更多直播
  clickMoreLive() {
    wx.navigateTo({
      url: '/pages/achorShowMore/achorShowMore',
    })
  },
  giftHideFun() {
    this.setData({
      giftShowStatus: false
    })
  },
  // 送礼物模块的开启与关闭
  giftShowFun() {
    this.setData({
      access_token: wx.getStorageSync('token')
    })
    if (this.isUserLoding()) {
      if (this.data.userCurrencyType.length < 2) {
        this.getUserIntegral();
        setTimeout(() => {
          this.setData({
            giftShowStatus: true
          })
        }, 500);
      } else {
        this.setData({
          giftShowStatus: true
        })
      }

    } else {
      this.setData({
        "is_modal_Hidden": false,
        "maskDisplay": true,
      })
    }

  },
  // 选择送出的礼物
  giftNumSelectFun(e) {
    this.setData({
      giftNumSelect: e.currentTarget.dataset.index
    })
  },
  // 直播结束 点击右上角关闭
  endSshutDownFun() {
    wx.navigateBack()
  },
  // 判断是否已登陆
  isUserLoding() {
    let token = wx.getStorageSync('token');
    if (!!token) {
      return true
    } else {
      return false
    }
  },
  // 是否展示评论框
  showInput: function () {
    const that = this;
    if (!that.data.access_token) {
      that.setData({
        access_token: wx.getStorageSync('token')
      })
    }
    this.setData({
      showInput: true
    })
  },
  // 刷新页面
  refresh: function (e) {
    const that = this;
    that.onShow()
  },
  // 获取直播详情 detailId 1564
  initLiveDetai: function (detailId) {
    const that = this;
    wx.request({
      url: getUrl('anchorShow', 'detail'),
      data: {
        id: detailId
      },
      header: {
        'content-type': 'application/json'
      },
      method: 'GET',
      dataType: 'json',
      responseType: 'text',
      success: (result) => {
        var src;
        if (Number(result.data.time_status) == 0) {
          src = result.data.live_notice_info ? result.data.live_notice_info.info.host + result.data.live_notice_info.info.dir + result.data.live_notice_info.info.filepath + result.data.live_notice_info.info.filename : '../../image/moren.png';
        } else {
          src = result.data.indexpic.host + result.data.indexpic.dir + result.data.indexpic.filepath + result.data.indexpic.filename;
        }
        let startTime = result.data.start_time_text.substring(0, 10)
        var token = wx.getStorageSync('token');
        if (token == '') {
          that.setData({
            "is_modal_Hidden": false,
            "maskDisplay": true,
          })
        } else {
          that.setData({
            access_token: token,
          })
        }
        that.setData({
          liveDetail: result.data,
          isAttention: result.data.is_care == 1 ? true : false,
          videoIndexpic: src,
          videoUrl: result.data.camera_info[0].play_stream_list ? result.data.camera_info[0].play_stream_list.rtmp : result.data.camera_info[0].play_stream_url,
          startTime: startTime,
          allow_comment: Number(result.data.comment_auto_audit)
        })
        // 设置小程序标题
        wx.setNavigationBarTitle({
          title: result.data.title
        })
      },
      fail: () => {},
      complete: () => {}
    });
  },
  //获取评论列表
  getCommentListFun() {
    wx.request({
      url: 'https://cloud-livesc.cloud.hoge.cn?m=Apicloud_live&c=share&a=getCommentList',
      header: {
        'content-type': 'application/json'
      },
      data: {
        activity_id: getApp().globalData.detail_id,
        order_type: 'desc'
      },
      method: 'GET',
      dataType: 'json',
      responseType: 'text',
      success: (res) => {
        let list = res.data.map((item, index) => {
          let itemNew = JSON.parse(JSON.stringify(item));
          itemNew.user_info = {user_name:'游客'}
          itemNew.user_info.user_name = itemNew.username;
          itemNew.message = itemNew.content;
          return itemNew
        })
        this.setData({
          commentList:list.reverse()
        },function(){
          wx.createSelectorQuery().select('#comment').boundingClientRect(rect => {
            this.setData({
              toView: 9999999999999
            })
          }).exec();
        })
        
      }
    })
  },
  //获取 礼物列表
  getGoodsList() {
    let that = this;
    wx.request({
      url: getUrl('anchorShow', 'getGoodsList'),
      header: {
        'content-type': 'application/json'
      },
      data: {
        access_token: that.data.access_token,
        app_secret: 'phI3a2T1wh8UXl1SWLk4LN5P0lJ9ZqFn'
      },
      method: 'GET',
      dataType: 'json',
      responseType: 'text',
      success: (res) => {
        let resImgList = res.data;
        resImgList.map((item, index) => {
          let imgSrc = item.img.host + item.img.dir + item.img.filepath + item.img.filename;
          item.imgSrc = imgSrc;
        })
        that.setData({
          giftNumSelect: resImgList[0].id,
          resImgList: resImgList
        })
      }
    })
  },
  //打赏
  goodRewardFun(e) {
    let that = this;
    let item = e.currentTarget.dataset.items;
    if (item.value > 0) {
      wx.showToast({
        title: '下载海博APP，打赏支持主播哦！！',
        icon: 'none',
        duration: 3000
      })
      this.giftHideFun()
      return
    }

    let postData = {
      "type": "cloud_live",
      "goods_id": item.order_id,
      "order_id": item.order_id,
      "origin_title": item.name,
      "origin_id": that.data.detailId,
      "access_token": that.data.access_token,
      "app_secret": "phI3a2T1wh8UXl1SWLk4LN5P0lJ9ZqFn",
      "is_share": 1
    }
    wx.showLoading({
      title: '打赏中...'
    })
    this.giftHideFun()
    wx.request({
      url: getUrl('anchorShow', 'reward'),
      header: {
        'content-type': 'application/json'
      },
      data: postData,
      method: 'GET',
      dataType: 'json',
      responseType: 'text',
      success: (res) => {
        wx.hideLoading()
        console.log(res)
        console.log(postData)
        if (res.data.error_code != 0) {
          if (res.data.error_code == '10012') {
            this.setData({
              "access_token": '',
              "is_modal_Hidden": false,
              "maskDisplay": true
            })
          } else {
            wx.showToast({
              title: '下载海博APP，打赏支持主播哦！',
              icon: 'none',
              duration: 3000
            })
          }

        } else {
          wx.showToast({
            title: '打赏成功...',
            icon: 'none'
          })
        }
      }
    })
  },
  //获取 会员 积分与金币
  getUserIntegral() {
    let that = this;
    wx.request({
      url: getUrl('anchorShow', 'getUserCurrencyType'),
      data: {
        access_token: that.data.access_token,
        app_secret: 'phI3a2T1wh8UXl1SWLk4LN5P0lJ9ZqFn'
      },
      header: {
        'content-type': 'application/json'
      },
      method: 'GET',
      dataType: 'json',
      responseType: 'text',
      success: (res) => {
        this.setData({
          userCurrencyType: res.data.data
        })
      }
    })

  },
  // 获取评论框的值
  getcomInput: function (e) {
    this.comValue = e.detail.value;
    this.setData({
      comValue: this.comValue
    })
  },
  getcomValue: function () {
    this.setData({
      comValue: this.comValue
    })
  },
  // 发表评论
  sendComment: function () {
    const that = this
    wx.request({
      url: getUrl('anchorShow', 'create'),
      data: {
        content: that.data.comValue,
        activity_id: getApp().globalData.detail_id,
        device_token: that.data.deviceToken,
        access_token: that.data.access_token
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      dataType: 'json',
      responseType: 'text',
      success: (result) => {
        this.setData({
          comValue: '',
          showInput: false
        })
        if (!this.data.allow_comment) {
          this.setData({
            commentFlag: true
          })
        }
        wx.createSelectorQuery().select('#comment').boundingClientRect(rect => {
          this.setData({
            toView: 99999999999999999999
          })
        }).exec();
      },
      fail: () => {},
      complete: () => {}
    });
  },
  // input失去焦点
  hideInput() {
    setTimeout(() => { //添加时间定时器
      this.setData({
        comValue: '',
        showInput: false
      })
    }, 500)
  },
  // 获取公告
  getNotice() {
    wx.request({
      url: 'https://cloud-livesc.cloud.hoge.cn/index.php?m=Apicloud_live&c=announcement&a=getAnnouncementList&app_secret=phI3a2T1wh8UXl1SWLk4LN5P0lJ9ZqFn',
      data: {
        activity_id: getApp().globalData.detail_id
      },
      header: {
        'content-type': 'application/json'
      },
      method: 'GET',
      dataType: 'json',
      responseType: 'text',
      success: (result) => {
        if (!result.ErrorCode && result.data[0]) {
          this.setData({
            // liveNoticeFlag: true,
            noticeText: result.data[0].content
          })
        }
      },
      fail: () => {},
      complete: () => {}
    })
  },
  // 获取点击数
  getWatchNum() {
    wx.request({
      url: 'https://cloud-livesc.cloud.hoge.cn/index.php?m=Apicloud_live&c=share&a=getActivityWatchNum',
      data: {
        activity_id: getApp().globalData.detail_id
      },
      header: {
        'content-type': 'application/json'
      },
      method: 'GET',
      dataType: 'json',
      responseType: 'text',
      success: (result) => {
        if (!result.ErrorCode) {
          this.setData({
            watch_num: result.data.num
          })
          if (result.data.transcode) {
            this.setData({
              maskFlag: true
            })
          } else {
            this.setData({
              maskFlag: false
            })
          }
        }
      },
      fail: () => {},
      complete: () => {}
    })
  },
  // 获取点赞数
  getLoveNum(data) {
    wx.request({
      url: getUrl('anchorShow', 'love'),
      data: {
        activity_id: getApp().globalData.detail_id,
        xin_num: data
      },
      header: {
        'content-type': 'application/json'
      },
      method: 'GET',
      dataType: 'json',
      responseType: 'text',
      success: (result) => {
        this.setData({
          loveNum: result.data.data.num
        })
      },
      fail: () => {},
      complete: () => {}
    })
  },
  // 定时刷新接口
  updateInterface() {
    timerInterface = setInterval(() => {
      this.getLoveNum()
      this.getWatchNum()
    }, 1000);
  },
  //视频进度修改
  videoScheduleFun(e) {
    let videoTimeStartNum = e.detail.currentTime,
      videoTimeEndNum = e.detail.duration;
    videoTimeStartNum = Math.trunc(videoTimeStartNum);
    videoTimeEndNum = Math.trunc(videoTimeEndNum);
    let lsNum_1 = Math.trunc(videoTimeStartNum / 60);
    let lsNum_2 = videoTimeStartNum % 60;
    let lsNum_3 = Math.trunc(videoTimeEndNum / 60);
    let lsNum_4 = videoTimeEndNum % 60;
    if (lsNum_1.toString().length < 2) {
      lsNum_1 = `0${lsNum_1}`
    }
    if (lsNum_2.toString().length < 2) {
      lsNum_2 = `0${lsNum_2}`
    }
    if (lsNum_3.toString().length < 2) {
      lsNum_3 = `0${lsNum_3}`
    }
    if (lsNum_4.toString().length < 2) {
      lsNum_4 = `0${lsNum_4}`
    }
    let progressCircleLeft = Math.trunc(videoTimeStartNum / videoTimeEndNum * 500) - 22;
    if (progressCircleLeft < 0) {
      progressCircleLeft = 0
    };
    if (progressCircleLeft > 460) {
      progressCircleLeft = 460
    };
    this.setData({
      videoTimeStart: `${lsNum_1}:${lsNum_2}`,
      videoTimeEnd: `${lsNum_3}:${lsNum_4}`,
      progressCircleLeft: `${progressCircleLeft}rpx`,
      videoControlsProgressSWidth: `${Math.trunc(videoTimeStartNum/videoTimeEndNum * 500) }rpx`
    })
  },
  // 视频播放
  videoPlay: function (e) {
    const that = this
    wx.createVideoContext('myVideo').play();
    this.setData({
      videoPlay: true,
      videoConstIsShow: true,
      videoTimeOutStatus: true
    })
  },
  // 视频停止
  videoEnd: function () {
    this.setData({
      videoPlay: false,
      videoTimeOutStatus: false
    })
  },
  //不断绘制图片到cavans
  requestAnimationFrame(callback) {
    var currTime = new Date().getTime();
    //手机屏幕刷新率一般为60Hz，大概16ms刷新一次，这里为了使页面看上去更流畅自然,通过改变timedis的值可以控制动画的快慢
    var timedis = 16 - (currTime - lastFrameTime)
    var timeToCall = Math.max(0, timedis);
    var id = setTimeout(callback, timeToCall);
    lastFrameTime = currTime + timeToCall;
    return id;
  },
  // cavans图片的移动路径
  drawImage: function (data) {
    data = [
      [{
        x: 30,
        y: 650
      }, {
        x: 30,
        y: 500
      }, {
        x: -30,
        y: 150
      }, {
        x: 30,
        y: 0
      }],
      [{
        x: 30,
        y: 650
      }, {
        x: 40,
        y: 400
      }, {
        x: -30,
        y: 120
      }, {
        x: 30,
        y: 0
      }],
      [{
        x: 30,
        y: 650
      }, {
        x: 50,
        y: 500
      }, {
        x: -20,
        y: 150
      }, {
        x: 30,
        y: 0
      }],
      [{
        x: 30,
        y: 650
      }, {
        x: 30,
        y: 480
      }, {
        x: 80,
        y: 150
      }, {
        x: 30,
        y: 0
      }],
      [{
        x: 30,
        y: 650
      }, {
        x: 0,
        y: 90
      }, {
        x: 80,
        y: 100
      }, {
        x: 30,
        y: 0
      }]
    ]
    var p10 = data[0][0]; // 三阶贝塞尔曲线起点坐标值
    var p11 = data[0][1]; // 三阶贝塞尔曲线第一个控制点坐标值
    var p12 = data[0][2]; // 三阶贝塞尔曲线第二个控制点坐标值
    var p13 = data[0][3]; // 三阶贝塞尔曲线终点坐标值

    var p20 = data[1][0];
    var p21 = data[1][1];
    var p22 = data[1][2];
    var p23 = data[1][3];

    var p30 = data[2][0];
    var p31 = data[2][1];
    var p32 = data[2][2];
    var p33 = data[2][3];

    var p40 = data[3][0];
    var p41 = data[3][1];
    var p42 = data[3][2];
    var p43 = data[3][3];

    var p50 = data[4][0];
    var p51 = data[4][1];
    var p52 = data[4][2];
    var p53 = data[4][3];

    var t = factor.t;

    /*计算多项式系数*/
    var cx1 = 3 * (p11.x - p10.x);
    var bx1 = 3 * (p12.x - p11.x) - cx1;
    var ax1 = p13.x - p10.x - cx1 - bx1;

    var cy1 = 3 * (p11.y - p10.y);
    var by1 = 3 * (p12.y - p11.y) - cy1;
    var ay1 = p13.y - p10.y - cy1 - by1;

    /*计算xt yt坐标值 */
    var xt1 = ax1 * (t * t * t) + bx1 * (t * t) + cx1 * t + p10.x;
    var yt1 = ay1 * (t * t * t) + by1 * (t * t) + cy1 * t + p10.y;

    /** 计算多项式系数*/
    var cx2 = 3 * (p21.x - p20.x);
    var bx2 = 3 * (p22.x - p21.x) - cx2;
    var ax2 = p23.x - p20.x - cx2 - bx2;

    var cy2 = 3 * (p21.y - p20.y);
    var by2 = 3 * (p22.y - p21.y) - cy2;
    var ay2 = p23.y - p20.y - cy2 - by2;

    /*计算xt yt坐标值*/
    var xt2 = ax2 * (t * t * t) + bx2 * (t * t) + cx2 * t + p20.x;
    var yt2 = ay2 * (t * t * t) + by2 * (t * t) + cy2 * t + p20.y;


    /** 计算多项式系数*/
    var cx3 = 3 * (p31.x - p30.x);
    var bx3 = 3 * (p32.x - p31.x) - cx3;
    var ax3 = p33.x - p30.x - cx3 - bx3;

    var cy3 = 3 * (p31.y - p30.y);
    var by3 = 3 * (p32.y - p31.y) - cy3;
    var ay3 = p33.y - p30.y - cy3 - by3;

    /*计算xt yt坐标值*/
    var xt3 = ax3 * (t * t * t) + bx3 * (t * t) + cx3 * t + p30.x;
    var yt3 = ay3 * (t * t * t) + by3 * (t * t) + cy3 * t + p30.y;

    /** 计算多项式系数*/
    var cx4 = 3 * (p41.x - p40.x);
    var bx4 = 3 * (p42.x - p41.x) - cx4;
    var ax4 = p43.x - p40.x - cx4 - bx4;

    var cy4 = 3 * (p41.y - p40.y);
    var by4 = 3 * (p42.y - p41.y) - cy4;
    var ay4 = p43.y - p40.y - cy4 - by4;

    /*计算xt yt坐标值*/
    var xt4 = ax4 * (t * t * t) + bx4 * (t * t) + cx4 * t + p40.x;
    var yt4 = ay4 * (t * t * t) + by4 * (t * t) + cy4 * t + p40.y;

    /** 计算多项式系数*/
    var cx5 = 3 * (p51.x - p50.x);
    var bx5 = 3 * (p52.x - p51.x) - cx5;
    var ax5 = p53.x - p50.x - cx5 - bx5;

    var cy5 = 3 * (p51.y - p50.y);
    var by5 = 3 * (p52.y - p51.y) - cy5;
    var ay5 = p53.y - p50.y - cy5 - by5;

    /*计算xt yt坐标值*/
    var xt5 = ax5 * (t * t * t) + bx5 * (t * t) + cx5 * t + p50.x;
    var yt5 = ay5 * (t * t * t) + by5 * (t * t) + cy5 * t + p50.y;

    factor.t += factor.speed;
    ctx.drawImage("../../images/live/love_icon" + iconNum + "@2x.png", xt1, yt1, 30, 30);
    ctx.drawImage("../../images/live/love_icon" + (iconNum + 1) + "@2x.png", xt2, yt2, 30, 30);
    ctx.drawImage("../../images/live/love_icon" + (iconNum + 2) + "@2x.png", xt3, yt3, 30, 30);
    ctx.drawImage("../../images/live/love_icon" + (iconNum + 3) + "@2x.png", xt4, yt4, 30, 30);
    ctx.drawImage("../../images/live/love_icon" + (iconNum + 4) + "@2x.png", xt5, yt5, 30, 30);
    ctx.draw();
    if (factor.t > 1) {
      factor.t = 0;
      that.cancelTimer(timer, false) //传入true动画重复
    } else {
      timer = that.requestAnimationFrame(function () {
        that.drawImage(that.data.img_path)
      })
    }
  },
  //点击图片
  onClickImage: function (e) {
    iconNum = Math.floor(Math.random() * 3 + 1)
    that.startTimer()
    this.getLoveNum(1)
  },
  startTimer: function () {
    that.drawImage(that.data.img_path)
  },
  //赞 爱心 动画
  cancelTimer(timer, isrepeat) {
    //清除定时器
    clearTimeout(timer)
    if (isrepeat) {
      that.startTimer()
    } else {
      //如果不重复动画则将图片回到原始位置
      // ctx.drawImage("../../images/live/love.png", 30, 1000, 30, 30);
      ctx.draw();
    }
  },
  // 检测 送出礼物显示
  goodsShowFun() {
    setInterval(() => {
      if (this.data.goodsList.length > 0) {
        this.setData({
          showGiftStatus: true,
          showGoodsObj: this.data.goodsList.shift()
        })
      } else {
        this.setData({
          showGoodsObj: {},
          showGiftStatus: false,
        })
      }
    }, 2000);
  },
  //遮罩层隐藏
  onGetCode: function (e) {
    if (e.detail) {
      this.setData({
        maskDisplay: false
      })
    }
  },
  onGetToken: function (e) {
    var data = e.detail;
    var token = data.access_token;
    var avatar = data.avatar;
    var member_id = data.member_id;
    this.setData({
      "avatar": avatar,
      "token": token,
      "member_id": member_id
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.videoContext = wx.createVideoContext('myVideo')
    // 获取直播实例
    liveBox = wx.createLivePlayerContext('liveBox')
    this.setData({
      videoUrl: this.data.videoUrl,
    }, function () {
      liveBox.stop();
      liveBox.play();
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var param_id = getApp().globalData.detail_id;
    this.setData({
      'detailId': param_id
    })
    // 获取详情数据
    this.initLiveDetai(param_id);
    // socket
    if (App.globalData.localSocket.readyState !== 0 && App.globalData.localSocket.readyState !== 1) {
      let url = 'wss://pushserver-api.cloud.hoge.cn/server_all/cloud_live/cloud_live_' + param_id + '?custom_appid=83&custom_appkey=fe9fc289c3ff0af142b6d3bead98a923&device_token=' + this.data.deviceToken
      App.initSocket(url);
    }
    App.globalData.callback = (res) => {
      let message = res.data;
      var socketData = JSON.parse(message);
      if (socketData.event === 'common') {
        if (socketData.text && JSON.parse(socketData.text).websocket_text) {
          socketData = JSON.parse(JSON.parse(socketData.text).websocket_text)
        }
        if (socketData.text) {
          socketData = JSON.parse(socketData.text)
        }
        // 关闭直播
        if (socketData.event == "live_close") {
          this.setData({
            maskFlag: true
          })
        }
        // 公告
        if (socketData.event == 'publish_notice') {
          this.setData({
            noticeText: socketData.message,
            liveNoticeFlag: true
          })
        }
        // 评论
        if (socketData.event == 'chat') {
          if(this.data.commentList.length>20){
            this.data.commentList.shift()
          }
          this.data.commentList.push(socketData);
          this.setData({
            commentList:this.data.commentList
          })
        }
        // 打赏
        if (socketData.event == 'send_gift') {
          let showGoodsObj = {};
          showGoodsObj.giftImgSrc = `${socketData.goods_icon.host}${socketData.goods_icon.dir}${socketData.goods_icon.filepath}${socketData.goods_icon.filename}`;
          showGoodsObj.userName = socketData.user_info.user_name;
          showGoodsObj.goodsName = socketData.message;
          showGoodsObj.userImgSrc = socketData.user_info.avatar
          this.setData({
            goodsList: [...this.data.goodsList, showGoodsObj]
          })
        }
      }
    }
    // 获取公告
    this.getNotice()
    this.getLoveNum()
    this.getWatchNum()
    // this.updateInterface()
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    if (timer != null) {
      that.cancelTimer(timer, false)
    }
    if (timerInterface) {
      clearTimeout(timerInterface)
    }
    console.log('onUnload')
    try {
      App.closeSocket()
    } catch (error) {
      console.log('關閉soket錯誤')
    }

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    wx.showNavigationBarLoading()
    //模拟加载
    setTimeout(function () {
      wx.hideNavigationBarLoading() //完成停止加载
      wx.stopPullDownRefresh() //停止下拉刷新
    }, 500)
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})