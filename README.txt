装懂同伴 Agent Demo - GitHub Pages 部署包

1. 将 index.html 和 .nojekyll 上传到 GitHub 仓库 ruka1001/rukawa 的 main 分支根目录。
2. 打开仓库 Settings -> Pages。
3. Build and deployment -> Source 选择 Deploy from a branch。
4. Branch 选择 main，文件夹选择 /(root)，点击 Save。
5. 等待 GitHub Actions 构建完成后，在 Pages 页面点击 Visit site。

注意：网页使用浏览器端调用 SiliconFlow API。演示者需要在页面中自行输入 API Key；不要将 API Key 写入公开仓库文件。
