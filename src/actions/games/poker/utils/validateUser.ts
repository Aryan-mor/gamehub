import { HandlerContext } from '@/modules/core/handler';

/**
 * Validate user context and return user information
 */
export function validateUser(context: HandlerContext): any {
  if (!context.user) {
    throw new Error('User information is required but not provided.');
  }
  
  if (!context.user.id) {
    throw new Error('User ID is required but not provided.');
  }
  
  return context.user;
}

/**
 * Check if user has sufficient permissions for the action
 */
export function checkUserPermissions(user: any): boolean {
  // Basic permission check - can be extended based on your user model
  if (!user) {
    return false;
  }
  
  // Add your permission logic here
  // For now, we'll assume all authenticated users have basic permissions
  return true;
} 