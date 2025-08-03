// API client for communicating with internal API routes
// This ensures all database operations go through our API layer

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.API_BASE_URL || '/api';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // User operations
  async getUser(userId: string) {
    return this.request(`/users/${userId}`);
  }

  async createUser(userData: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, userData: any) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Room operations
  async getRoom(roomId: string) {
    return this.request(`/rooms/${roomId}`);
  }

  async createRoom(roomData: any) {
    return this.request('/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async updateRoom(roomId: string, roomData: any) {
    return this.request(`/rooms/${roomId}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });
  }

  async deleteRoom(roomId: string) {
    return this.request(`/rooms/${roomId}`, {
      method: 'DELETE',
    });
  }

  async listRooms(filters?: any) {
    const queryParams = filters ? `?${new URLSearchParams(filters)}` : '';
    return this.request(`/rooms${queryParams}`);
  }

  // Game operations
  async getGame(gameId: string) {
    return this.request(`/games/${gameId}`);
  }

  async createGame(gameData: any) {
    return this.request('/games', {
      method: 'POST',
      body: JSON.stringify(gameData),
    });
  }

  async updateGame(gameId: string, gameData: any) {
    return this.request(`/games/${gameId}`, {
      method: 'PUT',
      body: JSON.stringify(gameData),
    });
  }

  async deleteGame(gameId: string) {
    return this.request(`/games/${gameId}`, {
      method: 'DELETE',
    });
  }

  // Wallet operations
  async getUserWallet(userId: string) {
    return this.request(`/wallet/${userId}`);
  }

  async updateWallet(userId: string, walletData: any) {
    return this.request(`/wallet/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(walletData),
    });
  }

  async addCoins(userId: string, amount: number) {
    return this.request(`/wallet/${userId}/add-coins`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient; 