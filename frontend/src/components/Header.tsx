import GmailLogo from "../constants/GmailLogo.js";
import { GearIcon, DotsNineIcon, ListIcon } from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import { useState, useRef } from "react";
import { useOutsideClick } from '../hooks/useOutsideClick';
import SettingMenu from '../hooks/useSettingMenu.tsx';
import { authClient } from "../lib/authClient";
import { logoutManager } from "../utils/logoutManager";

interface HeaderProps {
    toggleSidebar: () => void;
    toggleTheme: (theme?: string) => void;
    theme: string;
}

const Header = ({ toggleSidebar, toggleTheme, theme }: HeaderProps) => {
    const navigate = useNavigate();

    const { data: session } = authClient.useSession();

    const userInitial = session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "S";
    const userMail = session?.user?.email ? session.user.email : "Undefined";

    const settingsRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    const [isSettings, setIsSettings] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useOutsideClick(settingsRef, () => setIsSettings(false), isSettings);
    useOutsideClick(profileRef, () => setIsProfileOpen(false), isProfileOpen);

    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);
        await logoutManager.performLogout('user-initiated', 'Çıkış yapıldı.', navigate);
        setIsLoading(false);
    };

    return (
        <div className="bg-card text-foreground items-center flex h-16 m-0 px-4 relative select-none">
            <div className="flex items-center gap-7 shrink-0">
                <ListIcon onClick={toggleSidebar} className="select-none size-5 ml-3 cursor-pointer text-xl font-medium hover:bg-muted rounded-full px-1 py-1 transition box-content" />
                <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="select-none flex 1 gap-3 items-center">
                    <GmailLogo className="cursor-pointer size-8 gmail-font" />
                    <div className="hidden md:block text-lg cursor-pointer">Gmail</div>
                </Link>
            </div>

            <SearchBar />

            <div className="flex items-center gap-2 sm:gap-4 md:gap-7 ml-auto shrink-0 relative">
                <div ref={settingsRef} className="relative flex items-center">
                    <SettingMenu theme={theme} toggleTheme={toggleTheme} isSettings={isSettings} setIsSettings={setIsSettings} />

                    <GearIcon
                        onClick={() => setIsSettings(!isSettings)}
                        className="select-none cursor-pointer size-5 p-1 shrink-0 box-content hover:bg-muted hover:text-foreground text-muted-foreground transition rounded-full"
                    />
                </div>

                <DotsNineIcon
                    weight="bold"
                    className="cursor-pointer size-5 hidden sm:block hover:bg-muted rounded-full p-1 box-content transition text-muted-foreground hover:text-foreground"
                />

                <div ref={profileRef} className="relative flex items-center">
                    <div
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center justify-center rounded-full select-none cursor-pointer w-8 h-8 sm:w-9 sm:h-9 bg-primary text-primary-foreground font-medium text-sm sm:text-base shrink-0"
                    >
                        {userInitial}
                    </div>

                    {isProfileOpen && (
                        <div className="absolute right-0 top-12 w-50 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
                            <div className="w-full text-left px-4 py-2 text-m text-foreground select-none transition-colors font-medium flex items-center justify-center">{userMail}</div>
                            <button
                                onClick={handleLogout}
                                className="cursor-pointer w-full text-left px-4 py-2 flex justify-center text-sm text-foreground hover:bg-muted transition-colors font-medium "
                            >
                                {isLoading ? 'Çıkış Yapılıyor...' : 'Çıkış Yap'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Header;