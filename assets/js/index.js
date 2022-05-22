$(function () {
  getUserInfo();
  const layer = layui.layer;
  // 退出登录
  $("#btnLogout").click(() => {
    layer.confirm("确定退出登录？", { icon: 3, title: "" }, function (index) {
      // 清空本地存储里面的 token
      localStorage.removeItem("token");
      // 重新跳转到登录页面
      location.href = "/login.html";
    });
  });
});
const layer = layui.layer;

function getUserInfo() {
  $.ajax({
    type: "GET",
    url: "/my/userinfo",
    // headers: {
    //     Authorization: localStorage.getItem("token"),
    // },
    success: (res) => {
      if (res.status !== 0) {
        return layer.msg("获取信息失败！");
      }
      layer.msg("获取信息成功！");
      renderAvatar(res.data);
    },
  });
}

function renderAvatar(user) {
  console.log(user);
  const uname = user.nickname || user.username;
  $("#welcome").html(`欢迎${uname}`);
  if (user.user_pic !== null) {
    $(".layui-nav-img").attr("src", user.user_pic).show();
    $(".text-avatar").hide();
  } else {
    $(".layui-nav-img").hide();
    $(".text-avatar").html(`${uname[0].toUpperCase()}`).show();
  }
}
function change() {
  $("#art_list").addClass("layui-this").next().removeClass("layui-this");
}
