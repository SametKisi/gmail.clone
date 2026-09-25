import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authClient } from "../lib/authClient.ts";
import { EnvelopeIcon, LockIcon } from "@phosphor-icons/react";

export default function LoginPage() {
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true)
        setError("");

        if (!formData.email || !formData.password) {
            setError("Lütfen e-posta ve şifrenizi girin.");
            setIsLoading(false)
            return;
        }

        try {
            const { error } = await authClient.signIn.email({
                email: formData.email,
                password: formData.password,
            });

            if (error) {
                console.log('[login] signIn hata:', error);
                setError("Giriş başarısız bilgileriniz kontrol edin.");
                setIsLoading(false);
                return;
            }

            console.log('[login] tamamlandı, yönlendiriliyor');
            setIsLoading(false)
            navigate('/');

        } catch (err) {
            setIsLoading(false)
            console.error("GERÇEK HATA:", err);
            setError('Sunucuya bağlanırken beklenmeyen bir hata oluştu.');
        }
    };

    return (
        <div className="w-full min-h-screen bg-gray-600 flex justify-center items-center px-4">
            <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-xl shadow-lg flex flex-col p-8 gap-6">

                <h1 className="text-gray-800 font-bold text-2xl text-center mb-2">
                    Giriş Yap
                </h1>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-lg border border-red-200 text-center">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-sm font-semibold text-gray-600 ml-1">E-posta</label>
                    <div className="relative">
                        <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="ornek@eposta.com"
                            type="email"
                            className="bg-gray-50 border border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none rounded-lg w-full h-12 text-gray-800 pl-10 transition-all duration-200"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-sm font-semibold text-gray-600 ml-1">Şifre</label>
                    <div className="relative">
                        <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            id="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            type="password"
                            className="bg-gray-50 border border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none rounded-lg w-full h-12 text-gray-800 pl-10 transition-all duration-200"
                        />
                    </div>
                </div>

                <button type="submit" disabled={isLoading} className={`cursor-pointer w-full py-3.5 rounded-lg text-white text-lg font-bold mt-2 transition-all duration-200 shadow-md ${isLoading ? 'bg-green-300' : 'bg-green-600 hover:bg-green-500'}`}>
                    {isLoading ? "Giriş yapılıyor..." : "Giriş yap"}
                </button>

                <span className="text-gray-500 text-center mt-2 text-sm">
                    Hesabın yok mu? <Link to="/register" className="text-green-600 font-bold hover:underline">Kayıt Ol</Link>
                </span>
            </form>
        </div>
    );
}