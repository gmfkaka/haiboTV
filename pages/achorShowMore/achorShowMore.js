// pages/achorShowMore/achorShowMore.js
import getUrl from '../../utils/api.js'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    sort_id: 0, //分类ID 
    count: 10, //获取数量
    offset: 0, //偏移量
    currntPage: 1, //当前页下标 从1开始
    achorShowList: [], //直播 数据列表
    isAllList: false, //是否加载全部直播
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 设置小程序标题
    wx.setNavigationBarTitle({
      title: '更多直播'
    })
    this.getAchorShowList('', 1, this.data.sort_id)
  },
  //获取主播秀列表信息
  getAchorShowList(resolve, onReachBottom, id) {
    const that = this
    wx.request({
      url: getUrl('anchorShow', 'list'),
      data: {
        count: that.data.count,
        offset: (that.data.currntPage - 1) * that.data.count,
        sort_id: id,
        //是否推荐 取ID值
        is_recommend: 1
      },
      header: {
        'content-type': 'application/json'
      },
      method: 'GET',
      dataType: 'json',
      responseType: 'text',
      success: (result) => {
        console.log(result)
        let resultList = result.data;
        if (resultList.length > 0) {
          resultList.map((item, index) => {
            resultList[index].imgSrc = `${item.indexpic.host}${item.indexpic.dir}${item.indexpic.filepath}${item.indexpic.filename}`;
          })
          this.setData({
            currntPage: this.data.currntPage + 1,
            achorShowList: [...this.data.achorShowList, ...resultList]
          })
        } else {
          this.setData({
            isAllList: true
          })

        }

      },
      fail: () => {},
      complete: () => {}
    });

  },
  //跳转到播放页面
  goDetail(e) {
    var detailId = e.currentTarget.dataset.id;



    wx.navigateBack({
      delta: 1,
      complete: () => {
        wx.showToast({
          title: '加载中...',
          icon: 'loading'
        })
        wx.closeSocket({
          complete: () => {
            wx.hideToast();
            getApp().globalData.detail_id = detailId;
            wx.redirectTo({
              url: `../achorShow/index?detailId=${detailId}`
            })

          }
        })

      }
    })



  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

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

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (!this.data.isAllList) {
      this.getAchorShowList('', 1, this.data.sort_id);
    } else {
      wx.showToast({
        title: '已经加载全部直播',
        icon: 'none'
      })
    }

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})