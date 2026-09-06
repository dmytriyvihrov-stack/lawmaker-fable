@echo off
REM Double click this. It is the whole deploy: refresh the source from the desk
REM next door, build, check the sound is in the page, commit, push.
REM Anything you type after it is passed straight through, so this works too:
REM     deploy.cmd -Check -m "the winter pass"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy.ps1" %*
echo.
pause
