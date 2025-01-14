const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
    app.use(
        createProxyMiddleware("/lama", {  //   这个/api，就是识别的请求路径拼接，告诉请求，当什么请求时，需要用到这里跨域
            target: "http://localhost:6080",
            changeOrigin: true,
            pathRewrite: {// 重写path地址
                '^/lama': ''// 将请求的/api/aaa重写解析到/api/bbb
            },
        })
    )
    app.use(
        createProxyMiddleware("/api", {  //   这个/api，就是识别的请求路径拼接，告诉请求，当什么请求时，需要用到这里跨域
            target: "http://localhost:5000",
            changeOrigin: true,
            pathRewrite: {// 重写path地址
                '^/api': ''// 将请求的/api/aaa重写解析到/api/bbb
            },
        })
    )
}
