import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authClient } from "../lib/authClient.ts";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true)
        setError("");

        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
            setError("Lütfen tüm alanları doldurun.");
            setIsLoading(false)
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Şifreler birbiriyle eşleşmiyor.");
            setIsLoading(false)
            return;
        }

        if (formData.password.length < 8) {
            setError("Şifreniz en az 8 karakter olmalıdır.");
            setIsLoading(false)
            return;
        }

        try {
            const { error } = await authClient.signUp.email({
                email: formData.email,
                password: formData.password,
                name: formData.name,
            });

            if (error) {
                setIsLoading(false)
                return;
            }
            setIsLoading(false)
            navigate('/login');

        } catch {
            setIsLoading(false)
            setError('Sunucuya bağlanırken beklenmeyen bir hata oluştu.');
        }
    };

    return (
        <div className="w-full min-h-screen bg-gray-800 flex justify-center items-center px-4">
            <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-xl shadow-lg flex flex-col p-8 gap-6">

                <h1 className="text-gray-800 font-bold text-2xl text-center mb-2">
                    Kayıt Ol
                </h1>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-lg border border-red-200 text-center">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="name" className="text-sm font-semibold text-gray-600 ml-1">Ad Soyad</label>
                    <input
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Adınız Soyadınız"
                        type="text"
                        className="bg-gray-50 border border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none rounded-lg w-full h-12 text-gray-800 pl-4 transition-all duration-200"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-sm font-semibold text-gray-600 ml-1">E-posta</label>
                    <input
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="ornek@eposta.com"
                        type="email"
                        className="bg-gray-50 border border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none rounded-lg w-full h-12 text-gray-800 pl-4 transition-all duration-200"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-sm font-semibold text-gray-600 ml-1">Şifre</label>
                    <input
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        type="password"
                        className="bg-gray-50 border border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none rounded-lg w-full h-12 text-gray-800 pl-4 transition-all duration-200"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-600 ml-1">Şifre Tekrar</label>
                    <input
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        type="password"
                        className="bg-gray-50 border border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none rounded-lg w-full h-12 text-gray-800 pl-4 transition-all duration-200"
                    />
                </div>

                <button type="submit" className={`w-full ${isLoading ? 'bg-green-300':'bg-green-600 hover:bg-green-500'} py-3.5 rounded-lg text-white text-lg font-bold mt-2  transition-all duration-200 shadow-md`}>
                    {isLoading ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
                </button>

                <span className="text-gray-500 text-center mt-2 text-sm">
                    Zaten hesabın var mı? <Link to="/login" className="text-green-600 font-bold hover:underline cursor-pointer">Giriş Yap</Link>
                </span>
            </form>
        </div>
    );
}