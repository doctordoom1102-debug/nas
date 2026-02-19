@echo off
setlocal
set java_exe=java.exe
if defined JAVA_HOME set "java_exe=%JAVA_HOME%\bin\java.exe"
"%java_exe%" -jar -Xmx1024M -Duser.language=en -Dfile.encoding=UTF8 "%~dp0apktool.jar" %*
