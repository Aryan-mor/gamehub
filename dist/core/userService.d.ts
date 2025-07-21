import { User } from './types';
export declare const getUser: (userId: string) => Promise<User>;
export declare const addCoins: (userId: string, amount: number, reason: string) => Promise<void>;
export declare const deductCoins: (userId: string, amount: number, reason: string) => Promise<boolean>;
export declare const canClaimDaily: (userId: string) => Promise<{
    canClaim: boolean;
    nextClaimIn: number;
}>;
export declare const setLastFreeCoinAt: (userId: string) => Promise<void>;
export declare const setUserProfile: (userId: string, username?: string, name?: string) => Promise<void>;
//# sourceMappingURL=userService.d.ts.map