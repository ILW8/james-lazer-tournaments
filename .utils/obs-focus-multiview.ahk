if WinExist("Multiview (Windowed)")
{
    WinActivate
	Exit
}

if WinExist("Projector - Multiview") ; OBS 32 has changed window titles
{
    WinActivate
	Exit
}