import { useState, ReactNode } from "react";
import { Lock, ArrowRight } from "lucide-react";

interface AuthGuardProps {
    children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    // Site Access State
    const [accessPassword, setAccessPassword] = useState('');
    const [isAccessGranted, setIsAccessGranted] = useState(() => {
        // Check if access is already granted in this browser
        return localStorage.getItem('burilar_access_granted') === 'true';
    });
    const [accessError, setAccessError] = useState(false);

    const handleAccessSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (accessPassword === 'kenseiyasue123') {
            localStorage.setItem('burilar_access_granted', 'true');
            setIsAccessGranted(true);
            setAccessError(false);
        } else {
            setAccessError(true);
        }
    };

    // Site Access Gate
    if (!isAccessGranted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
                <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl">
                    <div className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                            <Lock className="h-6 w-6 text-amber-600" aria-hidden="true" />
                        </div>
                        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                            サイトアクセス
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            アクセスパスワードを入力してください
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleAccessSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="access-password" className="sr-only">
                                    パスワード
                                </label>
                                <input
                                    id="access-password"
                                    name="password"
                                    type="password"
                                    required
                                    className="relative block w-full rounded-xl border-0 py-3.5 px-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-amber-600 sm:text-sm sm:leading-6 bg-gray-50/50 backdrop-blur-sm transition-all duration-200"
                                    placeholder="パスワード"
                                    value={accessPassword}
                                    onChange={(e) => setAccessPassword(e.target.value)}
                                />
                            </div>
                            {accessError && (
                                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 animate-shake">
                                    パスワードが正しくありません
                                </div>
                            )}
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="group relative flex w-full justify-center rounded-xl bg-amber-500 px-4 py-4 text-sm font-medium text-white hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all shadow-lg shadow-amber-200"
                            >
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <ArrowRight className="h-5 w-5 text-amber-500 group-hover:text-amber-400" aria-hidden="true" />
                                </span>
                                アクセスする
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
