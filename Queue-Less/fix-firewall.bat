@echo off
echo ============================================
echo  QueueLess - Allow Port 5000 Through Firewall
echo ============================================
echo.
echo This will add a Windows Firewall rule to allow
echo mobile phones on your Wi-Fi to reach the server.
echo.
netsh advfirewall firewall delete rule name="QueueLess-5000" >nul 2>&1
netsh advfirewall firewall add rule name="QueueLess-5000" dir=in action=allow protocol=TCP localport=5000
echo.
echo ============================================
echo  DONE! Port 5000 is now open to all devices.
echo  Your phone can now connect to the server.
echo  Test URL: http://10.36.186.147:5000/api/health
echo ============================================
echo.
pause
