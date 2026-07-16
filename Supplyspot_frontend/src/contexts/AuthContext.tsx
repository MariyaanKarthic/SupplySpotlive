import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  vendor: any | null;
  token: string | null;
  login: (newToken: string, vendorData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  vendor: null,
  token: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [vendor, setVendor] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Restore vendor info from local storage
      const storedVendor = localStorage.getItem('vendor');
      if (storedVendor) {
        try {
          setVendor(JSON.parse(storedVendor));
        } catch (e) {
          console.error("Failed to parse vendor data from localStorage");
        }
      }
    }
  }, [token]);

  const login = (newToken: string, vendorData: any) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('vendor', JSON.stringify(vendorData));
    setToken(newToken);
    setVendor(vendorData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('vendor');
    setToken(null);
    setVendor(null);
  };

  return (
    <AuthContext.Provider value={{ vendor, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
