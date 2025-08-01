export type ParsedKey = {
  path: string[];         // ['games', 'poker', 'room', 'call']
  action?: string;        // 'call'
  query: Record<string, string>; // { roomId: '123' }
};

export function parseMessageKey(messageKey: string): ParsedKey {
  // Split by ? to separate path from query
  const [pathPart, queryPart] = messageKey.split('?');
  
  // Split path by dots
  const path = pathPart.split('.');
  
  // Extract action (last part of path)
  const action = path.length > 0 ? path[path.length - 1] : undefined;
  
  // Parse query parameters
  const query: Record<string, string> = {};
  if (queryPart) {
    const urlSearchParams = new URLSearchParams(queryPart);
    for (const [key, value] of urlSearchParams.entries()) {
      query[key] = value;
    }
  }
  
  return {
    path,
    action,
    query
  };
} 