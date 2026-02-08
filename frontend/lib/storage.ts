// Frontend-only localStorage for demo/Netlify environment
export const storage = {
  // User authentication
  setUser: (user: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bixfind_user', JSON.stringify(user));
    }
  },
  
  getUser: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('bixfind_user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },
  
  clearUser: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bixfind_user');
    }
  },

  // Wallet data
  setWallet: (wallet: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bixfind_wallet', JSON.stringify(wallet));
    }
  },

  getWallet: () => {
    if (typeof window !== 'undefined') {
      const wallet = localStorage.getItem('bixfind_wallet');
      return wallet ? JSON.parse(wallet) : { balance: 0, transactions: [] };
    }
    return { balance: 0, transactions: [] };
  },

  // Services
  setServices: (services: any[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bixfind_services', JSON.stringify(services));
    }
  },

  getServices: () => {
    if (typeof window !== 'undefined') {
      const services = localStorage.getItem('bixfind_services');
      return services ? JSON.parse(services) : [];
    }
    return [];
  },

  // Generic storage
  set: (key: string, value: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`bixfind_${key}`, JSON.stringify(value));
    }
  },

  get: (key: string) => {
    if (typeof window !== 'undefined') {
      const value = localStorage.getItem(`bixfind_${key}`);
      return value ? JSON.parse(value) : null;
    }
    return null;
  },
};
