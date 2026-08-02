cd "C:\Users\r_vi\Desktop\roblox-systems\packages\combat"

npm run build
npm version patch --no-git-tag-version

Remove-Item *.tgz -Force -ErrorAction SilentlyContinue

npm pack