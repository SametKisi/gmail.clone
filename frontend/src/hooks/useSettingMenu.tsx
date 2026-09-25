import { CheckIcon, PlusIcon, MinusIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react';

interface typeProps {
    theme: string;
    isSettings: boolean;
    toggleTheme: (theme?: string) => void;
    setIsSettings: (value: boolean) => void;
}

const SettingMenu = ({ theme, isSettings, setIsSettings, toggleTheme }: typeProps) => {
    const [fontSize, setFontSize] = useState(() => {
        return Number(localStorage.getItem("appFontSize")) || 100;
    });
    useEffect(() => {
        document.documentElement.style.fontSize = `${fontSize}%`;
        localStorage.setItem("appFontSize", String(fontSize));
    }, [fontSize]);
    
    return (

        <>
            {
                isSettings && (
                    <div className="absolute right-0 top-10 w-80 bg-card border border-border rounded-2xl shadow-xl py-4 z-50">
                        <div className="px-6 pb-3 text-sm font-semibold text-foreground border-b border-border flex justify-between items-center">
                            <span>Hızlı ayarlar</span>
                            <button
                                onClick={() => setIsSettings(false)}
                                className="text-muted-foreground hover:text-foreground text-xs cursor-pointer font-normal"
                            >
                                Kapat
                            </button>
                        </div>
                        <div className="py-2 px-4 space-y-1">
                            <div className="p-2 rounded-lg text-sm text-foreground flex flex-col gap-1">
                                <p className="font-medium">Tema</p>
                                {theme === 'dark' && <p className="text-xs text-muted-foreground">Koyu Tema</p>}
                                {theme === 'light' && <p className="text-xs text-muted-foreground">Varsayılan, Açık tema</p>}

                                <div className="flex flex-1 gap-3 w-10 mt-1">
                                    <div onClick={() => toggleTheme('dark')} className="select-none group px-15 h-15 bg-gray-900 border border-gray-700 hover:border-gray-500 p-2 rounded-lg cursor-pointer text-sm justify-items-center items-center transition-all duration-150">
                                        {theme === 'dark' && <CheckIcon className="fill-white size-4 mt-3 transition-all duration-150" weight="bold" />}
                                    </div>
                                    <div onClick={() => toggleTheme('light')} className="select-none group px-15 h-15 bg-gray-100 border border-gray-300 hover:border-gray-400 p-2 rounded-lg cursor-pointer text-sm justify-items-center items-center transition-all duration-150">
                                        {theme === 'light' && <CheckIcon className="fill-black size-4 mt-3 transition-all duration-150" weight="bold" />}
                                    </div>
                                </div>
                            </div>

                            <div className="p-2 rounded-lg text-sm flex flex-col gap-2 text-foreground">
                                <p className="font-medium">Yazı Boyutu</p>
                                <div className="flex flex-1 gap-3 items-center">
                                    <MinusIcon onClick={() => setFontSize(prev => Math.min(200, Math.max(50, prev - 10)))} className="size-4 cursor-pointer hover:bg-muted rounded-2xl p-1 box-content" weight="bold" />
                                    <p className="text-xs text-muted-foreground">% {fontSize}</p>
                                    <PlusIcon onClick={() => setFontSize(prev => Math.min(200, Math.max(50, prev + 10)))} className="size-4 cursor-pointer hover:bg-muted rounded-2xl p-1 box-content" weight="bold" />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-border pt-2 px-4 mt-2">
                            <button className="w-full text-center py-2 text-sm cursor-pointer text-primary font-medium hover:bg-primary/10 rounded-lg transition">
                                Tüm ayarları göster
                            </button>
                        </div>
                    </div>
                )
            }
        </>
    )
}

export default SettingMenu