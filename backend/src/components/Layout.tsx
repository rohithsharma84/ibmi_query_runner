import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-xl font-bold">
                Query Runner
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link
                  href="/"
                  className={`px-3 py-2 rounded ${
                    router.pathname === '/' ? 'bg-blue-700' : 'hover:bg-blue-500'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/query-sets"
                  className={`px-3 py-2 rounded ${
                    router.pathname.startsWith('/query-sets')
                      ? 'bg-blue-700'
                      : 'hover:bg-blue-500'
                  }`}
                >
                  Query Sets
                </Link>
                <Link
                  href="/runs"
                  className={`px-3 py-2 rounded ${
                    router.pathname.startsWith('/runs')
                      ? 'bg-blue-700'
                      : 'hover:bg-blue-500'
                  }`}
                >
                  Runs
                </Link>
                <Link
                  href="/comparisons"
                  className={`px-3 py-2 rounded ${
                    router.pathname.startsWith('/comparisons')
                      ? 'bg-blue-700'
                      : 'hover:bg-blue-500'
                  }`}
                >
                  Comparisons
                </Link>
                {user.isAdmin && (
                  <Link
                    href="/admin"
                    className={`px-3 py-2 rounded ${
                      router.pathname.startsWith('/admin')
                        ? 'bg-blue-700'
                        : 'hover:bg-blue-500'
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm">
                {user.username} {user.isAdmin && '(Admin)'}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            &copy; 2025 Query Runner. IBM i DB2 Query Testing Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
