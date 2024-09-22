if WinExist("Windowed Projector (Program)")
{
    WinActivate ; Use the window found by WinExist.
	Exit ;
}

SetTitleMatchMode "RegEx" ;

if WinExist("Windowed Projector.*")
	WinActivate ;

