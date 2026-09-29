@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 工班費用管理 - 一鍵部署

echo.
echo ==========================================================
echo   工班費用管理系統   一鍵部署到 Firebase
echo ==========================================================
echo.
echo 這個視窗會自動完成全部步驟，中途會開啟瀏覽器請你登入 Google。
echo 過程中請不要關閉這個視窗，跑完會顯示「部署完成」。
echo.
echo 如果出現權限相關的紅字，請關掉視窗，改成在這個檔案上按右鍵
echo 選「以系統管理員身分執行」。
echo.
echo 按任意鍵開始...
pause >nul

echo.
echo [第 1 步 / 共 6 步] 檢查 Node.js
echo ----------------------------------------------------------
where node >nul 2>nul
if errorlevel 1 goto :no_node
node -v

echo.
echo [第 2 步 / 共 6 步] 安裝部署工具，第一次會比較久，請耐心等待
echo ----------------------------------------------------------
call npm install -g pnpm firebase-tools
if errorlevel 1 goto :fail

echo.
echo [第 3 步 / 共 6 步] 安裝專案需要的套件
echo ----------------------------------------------------------
call pnpm install
if errorlevel 1 goto :fail

echo.
echo [第 4 步 / 共 6 步] 登入 Google 帳號，瀏覽器會自動打開
echo ----------------------------------------------------------
echo 請選擇建立 install-2ec19 專案的那個 Google 帳號，並按「允許」
call firebase login
if errorlevel 1 goto :fail

echo.
echo [第 5 步 / 共 6 步] 部署資料庫安全規則
echo ----------------------------------------------------------
call firebase deploy --only firestore:rules,storage
if errorlevel 1 goto :fail

echo.
echo 接著部署師傅連結用的後端函式，約需 3 到 5 分鐘
echo ----------------------------------------------------------
if not exist "firebase\functions\index.js" goto :no_functions
cd firebase\functions
call npm install
if errorlevel 1 goto :fail
cd ..\..
call firebase deploy --only functions
if errorlevel 1 goto :fail

echo.
echo [第 6 步 / 共 6 步] 建置並上傳網站
echo ----------------------------------------------------------
call pnpm run build:prod
if errorlevel 1 goto :fail
call firebase deploy --only hosting
if errorlevel 1 goto :fail

echo.
echo ==========================================================
echo   部署完成
echo.
echo   網站網址： https://install-2ec19.web.app
echo   請用你建立的管理員 Email 和密碼登入
echo ==========================================================
goto :end

:no_node
echo.
echo 找不到 Node.js。
echo 請先到 https://nodejs.org 下載 LTS 版本安裝，安裝完再執行一次這個檔案。
goto :end

:no_functions
echo.
echo 找不到 firebase\functions\index.js。
echo 請確認你是從壓縮檔解壓縮後才執行這個檔案，而不是在壓縮檔裡面點兩下。
goto :end

:fail
echo.
echo ==========================================================
echo   這一步發生錯誤，後面的步驟沒有繼續執行
echo   請把上面出現的訊息拍照或複製給工程師
echo ==========================================================

:end
echo.
echo 按任意鍵關閉這個視窗...
pause >nul
