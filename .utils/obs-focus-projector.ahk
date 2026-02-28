if WinExist("Windowed Projector (Program)")
{
    WinActivate ; Use the window found by WinExist.
	Exit ;
}

if WinExist("Projector - Program")
{
	WinActivate
	Exit
}

SetTitleMatchMode "RegEx" ;

if WinExist("Windowed Projector.*")
{
	WinActivate
	Exit
}

if WinExist("Projector - .*")
{
	WinActivate
	Exit
}
