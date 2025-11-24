# Model Lab Database Schema

This directory contains the production-ready database schema for Model Lab.

## 🚀 Deployment

### Fresh Installation
Run the entire `schema.sql` file in your Supabase SQL Editor:

```sql
-- Copy and paste the entire contents of schema.sql
```

### Updates to Existing Database
The schema includes:
- Automatic cleanup of test data
- Conflict-safe policy creation (drops existing policies first)
- Robust error handling for user creation

## 🏗️ Schema Overview

### Tables
- **users**: User profiles linked to auth.users
- **chats**: Chat conversations belonging to users  
- **messages**: Individual messages within chats

### Key Features
- ✅ **Custom Message IDs**: Uses TEXT IDs for reliable message persistence
- ✅ **Robust RLS Policies**: Comprehensive row-level security
- ✅ **Error Handling**: Graceful failure handling in triggers
- ✅ **Performance Indexes**: Optimized for common queries
- ✅ **Auto Cleanup**: Removes test data automatically

### Security
- Users can only access their own data
- Messages are protected through chat ownership
- Automatic user profile creation on signup
- GRANT statements for proper permissions

## ✅ Verification

After running the schema, you should see:
```
NOTICE: Model Lab schema deployed successfully
NOTICE: Tables: X users, Y chats, Z messages
```

## 🔧 Troubleshooting

If you encounter issues:
1. Ensure you have OWNER permissions on the database
2. Check that the auth schema exists (Supabase Auth enabled)
3. Verify environment variables are set correctly

## 📝 Changes from Previous Versions

- Consolidated all fixes into single schema file
- Added automatic test data cleanup  
- Improved error handling in user creation trigger
- Added WITH CHECK clauses to UPDATE policies
- Added performance indexes
- Removed dependency on separate cleanup scripts

