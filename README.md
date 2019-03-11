# Tieba Crawler
贴吧爬虫可以根据指定的贴吧名和结束页数来获取贴子标题、发贴人、和贴子链接。

## 安装
首先需要安装[Node.js](https://nodejs.org)，然后进入到项目根路径后执行：
```
npm install
```
## 使用 
启动程序：
```
node index.js
```
然后进入交互式命令行，爬取贴子。
可以输入两个参数：贴吧名 结束页数，比如：
```
wp7 20
```
表示爬取wp7吧的1-20页贴子。

爬取的结果保存在`output/result`文件夹里，并且每次执行时会覆盖相关结果。
