@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 工班費用管理 - 更新網站

echo.
echo ==========================================================
echo   工班費用管理系統   更新網站內容
echo ==========================================================
echo.
echo 這個檔案用在「網站已經部署過、之後改版要重新上線」的時候。
echo 它會重新建置並上傳網站，也會同步更新資料庫安全規則。
echo.
echo 按任意鍵開始...
pause >nul

echo.
echo 重新建置網站
echo ----------------------------------------------------------
call pnpm install
if errorlevel 1 goto :fail
call pnpm run build:prod
if errorlevel 1 goto :fail

echo.
echo 上傳網站並更新安全規則
echo ----------------------------------------------------------
call firebase deploy --only hosting,firestore:rules,storage
if errorlevel 1 goto :fail

echo.
echo ==========================================================
echo   更新完成
echo   網站網址： https://install-2ec19.web.app
echo ==========================================================
goto :end

:fail
echo.
echo ==========================================================
echo   發生錯誤，更新沒有完成
echo   請把上面出現的訊息拍照或複製給工程師
echo ==========================================================

:end
echo.
echo 按任意鍵關閉這個視窗...
pause >nul
