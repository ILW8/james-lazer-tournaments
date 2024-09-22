if WinExist(" Tournament Manager")
    WinActivate ; Use the window found by WinExist.
	Sleep 10
	MouseClick "left", 1500, 1100,, 0, "D"
	Sleep 70
	MouseClick "left", 1500, 1100,, 0, "U"
	Sleep 10
	WinMinimize ; hide tourney window cause annoying
