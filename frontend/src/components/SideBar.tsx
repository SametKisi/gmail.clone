import { TrayIcon, PencilSimpleLineIcon, StarIcon, TrashSimpleIcon, GearIcon, PaperPlaneRightIcon } from "@phosphor-icons/react";
import { NavLink } from "react-router-dom";

const SideBar = ({ isOpen, setIsCompose }: { isOpen: boolean, setIsCompose: (val: boolean) => void }) => {
    const sideBarStyle = "select-none flex flex-col items-start gap-6 px-5 h-[calc(100vh-60px)] transition-[width] bg-card duration-300 overflow-hidden";
    const widthStyle = isOpen ? "w-56" : "w-20";
    const marginStyle = isOpen ? "w-auto" : "w-0 overflow-hidden opacity-0";
    const create = isOpen ? "min-w-[128px]" : "min-w-[48px] ";

    const navLinkStyle = ({ isActive }: { isActive: boolean }) =>
        `shrink-0 group flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 text-foreground ${isActive ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-muted'
        } ${isOpen ? 'gap-2 px-1.5' : 'justify-center w-12 '}`;

    return (
        <div className={`${sideBarStyle} ${widthStyle}`}>

            <div onClick={() => setIsCompose(true)} className={`${create}  hover:shadow-shadows select-none ml-1.3 flex items-center gap-2 bg-primary text-primary-foreground rounded-2xl h-13 mt-10 hover:shadow-xl transition-all cursor-pointer box-content shrink-0`}>
                <PencilSimpleLineIcon className="size-6 ml-3 shrink-0" />
                <div className={`${marginStyle} transition-all duration-200`}>
                    <span className="whitespace-nowrap">Oluştur</span>
                </div>
            </div>

            <NavLink to="/" className={navLinkStyle}>
                <TrayIcon className="size-5" />
                <div className={`${marginStyle}`}>
                    <span className="whitespace-nowrap">Gelen Kutusu</span>
                </div>
            </NavLink>

            <NavLink to="/Starred" className={navLinkStyle}>
                <StarIcon className="size-5 group-hover:fill-yellow-500" />
                <div className={`${marginStyle}`}>
                    <span className="whitespace-nowrap">Yıldızlı Mesajlar</span>
                </div>
            </NavLink>
            <NavLink to="/Sent" className={navLinkStyle}>
                {({ isActive }) => (
                    <>
                        <PaperPlaneRightIcon
                            className={`size-5 transition-transform duration-300 ${isActive ? "-rotate-45" : ""}`}
                        />
                        <div className={`${marginStyle} transition-all duration-300`}>
                            <span className="whitespace-nowrap">Gönderilmiş Postalar</span>
                        </div>
                    </>
                )}
            </NavLink>
            <NavLink to="/Deleted" className={navLinkStyle}>
                <TrashSimpleIcon className='size-5' />
                <div className={`${marginStyle} transition-all duration-300`}>
                    <span className="whitespace-nowrap">Çöp Kutusu</span>
                </div>
            </NavLink>
            <div className="shrink-0 group flex items-center text-foreground hover:bg-muted gap-1 mt-auto mb-3 justify-items-end ml-2 rounded-full p-1 cursor-pointer">
                <GearIcon className="size-6" />
                <div className={`${marginStyle} transition-all duration-300`}>
                    <span className="whitespace-nowrap">Ayarlar</span>
                </div>
            </div>
        </div>
    )
}
export default SideBar;