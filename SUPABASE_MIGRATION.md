# Firebase to Supabase Migration Guide

This guide will help you complete the migration from Firebase to Supabase for the GameHub project.

## 🎯 Overview

The migration has been set up to:
- Replace Firebase with Supabase as the database
- Create a secure API layer that only allows server-side Supabase access
- Maintain the same functionality while improving security and performance

## 📋 Prerequisites

1. **Supabase Account**: Create a new project at [supabase.com](https://supabase.com)
2. **Environment Variables**: Update your `.env` file with Supabase credentials
3. **Database Schema**: The schema is ready in `supabase-schema.sql`

## 🔧 Setup Steps

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Update your `.env` file with the following Supabase variables:

```env
# Supabase Configuration
SUPABASE_PROJECT_URL=your-supabase-project-url
SUPABASE_API_KEY_ANON_PUBLIC=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_SECRET=your-supabase-service-role-secret
```

### 3. Set Up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Execute the SQL to create all tables and indexes

### 4. Run Migration Setup

```bash
pnpm run migrate:supabase
```

This will:
- Test the Supabase connection
- Create sample data
- Verify the setup

## 🏗️ Architecture Changes

### Before (Firebase)
```
Client → Firebase SDK → Firebase Database
```

### After (Supabase)
```
Client → API Client → API Routes → Supabase → Database
```

### Key Benefits

1. **Security**: Supabase keys never exposed to client
2. **Performance**: Optimized queries and indexing
3. **Scalability**: PostgreSQL-based with advanced features
4. **Type Safety**: Better TypeScript integration

## 📁 File Structure

```
src/
├── lib/
│   ├── supabase.ts     # Server-side Supabase client
│   └── api.ts          # Client-side API client
├── api/                # API routes (server-side only)
│   ├── users/
│   ├── rooms/
│   ├── games/
│   └── wallet/
└── [other directories] # Client-side code (no direct Supabase access)
```

## 🔒 Security Rules

### ESLint Rules
- Supabase imports are restricted to `/api/**` files only
- Client-side code must use the API client
- Direct Supabase access from client is blocked

### Database Security
- Row Level Security (RLS) enabled on all tables
- Service role key only used server-side
- API routes handle all database operations

## 🚀 API Usage

### Client-Side Usage

```typescript
import { apiClient } from '@/lib/api';

// Get user data
const userResponse = await apiClient.getUser('user-id');
if (userResponse.success) {
  console.log(userResponse.data);
}

// Create a room
const roomResponse = await apiClient.createRoom({
  name: 'Poker Room',
  game_type: 'poker',
  stake_amount: 100
});

// Update wallet
const walletResponse = await apiClient.addCoins('user-id', 500);
```

### Server-Side Usage (API Routes)

```typescript
import { supabase } from '@/lib/supabase';

// Direct Supabase access (only in API routes)
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);
```

## 📊 Database Schema

### Tables Created

1. **users** - User information and Telegram data
2. **wallets** - User wallet balances
3. **rooms** - Game rooms and settings
4. **games** - Individual game sessions
5. **game_players** - Many-to-many game participants
6. **room_players** - Many-to-many room participants
7. **game_history** - Game action history
8. **transactions** - Wallet transaction history

### Key Features

- UUID primary keys for better performance
- JSONB columns for flexible data storage
- Proper foreign key relationships
- Automatic timestamps
- Indexes for common queries
- Row Level Security policies

## 🔄 Migration Process

### Phase 1: Setup (Complete)
- ✅ Supabase client configuration
- ✅ API routes structure
- ✅ Database schema
- ✅ ESLint rules
- ✅ Migration scripts

### Phase 2: Code Updates (Next)
- Update existing Firebase usage to use API routes
- Replace Firebase imports with API client calls
- Update type definitions
- Test all functionality

### Phase 3: Data Migration (Optional)
- Export Firebase data
- Transform data format
- Import to Supabase
- Verify data integrity

### Phase 4: Cleanup
- Remove Firebase dependencies
- Update deployment scripts
- Update documentation
- Performance testing

## 🧪 Testing

### Run Tests
```bash
pnpm test
```

### Test API Routes
```bash
# Test user creation
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"telegram_id": 123456789, "username": "testuser"}'

# Test room listing
curl http://localhost:3000/api/rooms?game_type=poker
```

## 🚨 Common Issues

### 1. Environment Variables Missing
```
Error: Missing Supabase environment variables
```
**Solution**: Add required environment variables to `.env` file

### 2. ESLint Errors
```
Error: Do not import supabase directly outside of /api
```
**Solution**: Use the API client instead of direct Supabase imports

### 3. Database Connection Issues
```
Error: Connection failed
```
**Solution**: Check Supabase project URL and service role key

### 4. RLS Policy Errors
```
Error: Row Level Security policy violation
```
**Solution**: Check and update RLS policies in Supabase dashboard

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 🤝 Support

If you encounter issues during migration:

1. Check the error logs
2. Verify environment variables
3. Test database connection
4. Review ESLint rules
5. Check Supabase dashboard for errors

## 🎉 Migration Complete

Once all steps are completed:

1. ✅ Supabase is configured and working
2. ✅ API routes are functional
3. ✅ Client code uses API client
4. ✅ Database schema is deployed
5. ✅ Security rules are enforced
6. ✅ Tests are passing

Your application is now successfully migrated from Firebase to Supabase! 