# GameHub Source Structure

## 📁 ساختار جدید پروژه

```
src/
├── actions/              # 🎯 Actions & Business Logic
│   ├── games/           # Game actions (poker, etc.)
│   │   └── poker/
│   │       └── room/
│   │           ├── call/
│   │           ├── join/
│   │           ├── create/
│   │           └── ...
│   └── financial/       # Financial actions (wallet, etc.)
│       └── user-wallet/
├── modules/             # 🔧 Core Modules & Systems
│   ├── core/           # Router, handler, utilities
│   │   ├── smart-router.ts
│   │   ├── handler.ts
│   │   └── utils/
│   └── global/         # Global configurations
├── utils/              # 🛠️ Utilities & Helpers
│   ├── types/          # Type definitions
│   ├── typeGuards.ts   # ID validation
│   └── demos/          # Demo files
├── archive/            # 📦 Archived code
│   └── games/          # Old games
└── scripts/            # 🔧 Build & deployment scripts
```

## 🎯 مزایای ساختار جدید

### 1. **جداسازی منطقی**
- **`actions/`**: همه business logic و actions
- **`modules/`**: سیستم‌های core و configurations
- **`utils/`**: ابزارها و helper functions

### 2. **مقیاس‌پذیری**
- آسان برای اضافه کردن actions جدید
- ساختار واضح برای modules جدید
- سازماندهی بهتر utilities

### 3. **قابلیت نگهداری**
- پیدا کردن فایل‌ها آسان‌تر
- وابستگی‌ها واضح‌تر
- ساختار predictable

## 📝 Import Patterns

### از actions به modules
```typescript
import { HandlerContext } from '@/modules/core/handler';
import { registerModule } from '@/modules/core/smart-router';
```

### از actions به utils
```typescript
import { RoomId, UserId } from '@/utils/types';
import { createRoomId } from '@/utils/typeGuards';
```

### از modules به utils
```typescript
import { UserId } from '@/utils/types';
```

## 🚀 نحوه استفاده

### اضافه کردن Action جدید
1. در `src/actions/` پوشه مناسب بسازید
2. ساختار `{action}/index.ts` را دنبال کنید
3. از `export default` استفاده کنید
4. Import paths را درست کنید

### اضافه کردن Module جدید
1. در `src/modules/` پوشه جدید بسازید
2. از `@/modules/` prefix استفاده کنید
3. در README مستند کنید

### اضافه کردن Utility جدید
1. در `src/utils/` فایل جدید بسازید
2. از `@/utils/` prefix استفاده کنید
3. Type definitions را در `src/utils/types/` قرار دهید

## 🔧 Migration Notes

### تغییرات Import Paths
- `@/core/` → `@/modules/core/`
- `@/games/` → `@/actions/games/`
- `@/financial/` → `@/actions/financial/`
- `@/types/` → `@/utils/types/`
- `@/utils/typeGuards` → `@/utils/typeGuards`

### Demo Files
- همه demo ها در `src/utils/demos/` قرار دارند
- Import paths آپدیت شده‌اند
- README کامل در پوشه demos

## 📚 Best Practices

### برای Actions
- هر action یک پوشه با `index.ts`
- از `export default` استفاده کنید
- Type safety را رعایت کنید
- Error handling مناسب داشته باشید

### برای Modules
- Core functionality در `modules/core/`
- Global configs در `modules/global/`
- از dependency injection استفاده کنید
- Interface-based design داشته باشید

### برای Utils
- Type definitions در `utils/types/`
- Helper functions در `utils/`
- Demo files در `utils/demos/`
- Reusable و pure functions بسازید

## 🎯 نتیجه

این ساختار جدید:
- ✅ **منطقی‌تر** است
- ✅ **مقیاس‌پذیر** است  
- ✅ **قابل نگهداری** است
- ✅ **واضح‌تر** است
- ✅ **پیش‌بینی‌پذیر** است 