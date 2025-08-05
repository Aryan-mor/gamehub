import { 
  CreateRoomFormData 
} from '../types';

/**
 * Validation errors for room creation
 */
export interface RoomValidationError {
  field: keyof CreateRoomFormData;
  message: string;
}

/**
 * Validation result for room creation
 */
export interface RoomValidationResult {
  isValid: boolean;
  errors: RoomValidationError[];
}

/**
 * Validate room name
 */
export function validateRoomName(name: string): string | null {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return 'نام روم نمی‌تواند خالی باشد';
  }
  
  if (trimmedName.length > 30) {
    return 'نام روم نمی‌تواند بیشتر از ۳۰ کاراکتر باشد';
  }
  
  if (trimmedName.length < 3) {
    return 'نام روم باید حداقل ۳ کاراکتر باشد';
  }
  
  return null;
}

/**
 * Validate small blind amount
 */
export function validateSmallBlind(amount: number): string | null {
  if (!Number.isInteger(amount) || amount <= 0) {
    return 'مقدار small blind باید عدد صحیح مثبت باشد';
  }
  
  if (amount > 1000) {
    return 'مقدار small blind نمی‌تواند بیشتر از ۱۰۰۰ باشد';
  }
  
  return null;
}

/**
 * Validate turn timeout
 */
export function validateTurnTimeout(timeout: number): string | null {
  if (!Number.isInteger(timeout) || timeout <= 0) {
    return 'زمان تایم‌اوت باید عدد صحیح مثبت باشد';
  }
  
  if (timeout < 30) {
    return 'زمان تایم‌اوت نمی‌تواند کمتر از ۳۰ ثانیه باشد';
  }
  
  if (timeout > 600) {
    return 'زمان تایم‌اوت نمی‌تواند بیشتر از ۶۰۰ ثانیه باشد';
  }
  
  return null;
}

/**
 * Validate max players
 */
export function validateMaxPlayers(maxPlayers: number): string | null {
  const validValues = [2, 4, 6, 8];
  
  if (!validValues.includes(maxPlayers)) {
    return 'تعداد بازیکنان باید یکی از مقادیر ۲، ۴، ۶ یا ۸ باشد';
  }
  
  return null;
}

/**
 * Validate complete room creation form
 */
export function validateRoomForm(formData: Partial<CreateRoomFormData>): RoomValidationResult {
  const errors: RoomValidationError[] = [];
  
  // Check if all required fields are present
  if (formData.name === undefined) {
    errors.push({ field: 'name', message: 'نام روم الزامی است' });
  } else {
    const nameError = validateRoomName(formData.name);
    if (nameError) {
      errors.push({ field: 'name', message: nameError });
    }
  }
  
  if (formData.isPrivate === undefined) {
    errors.push({ field: 'isPrivate', message: 'نوع روم الزامی است' });
  }
  
  if (formData.maxPlayers === undefined) {
    errors.push({ field: 'maxPlayers', message: 'تعداد بازیکنان الزامی است' });
  } else {
    const maxPlayersError = validateMaxPlayers(formData.maxPlayers);
    if (maxPlayersError) {
      errors.push({ field: 'maxPlayers', message: maxPlayersError });
    }
  }
  
  // Validate small blind
  if (formData.smallBlind === undefined) {
    errors.push({ field: 'smallBlind', message: 'Small blind is required' });
  } else if (formData.smallBlind < 1) {
    errors.push({ field: 'smallBlind', message: 'Small blind must be at least 1' });
  }
  
  // Validate turn timeout
  if (formData.turnTimeoutSec === undefined) {
    errors.push({ field: 'turnTimeoutSec', message: 'Turn timeout is required' });
  } else if (formData.turnTimeoutSec < 10 || formData.turnTimeoutSec > 300) {
    errors.push({ field: 'turnTimeoutSec', message: 'Turn timeout must be between 10 and 300 seconds' });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if user is already in an active room
 */
export async function checkUserActiveRoom(): Promise<boolean> {
  // This will be implemented when we have the room service
  // For now, return false (no active room)
  return false;
} 