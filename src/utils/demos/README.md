# GameHub Demos

این پوشه شامل فایل‌های demo برای تست و نمایش قابلیت‌های مختلف سیستم است.

## 📁 فایل‌های موجود

### 🎯 `demo-type-system.ts`
**هدف**: تست سیستم type جدید با custom ID ها

**کاری که می‌کند**:
- تست validation ID ها (UserId, RoomId, GameId)
- تست creation ID ها با helper functions
- تست type guards و type assertions
- تست entity interfaces (User, Room, Game)
- تست router integration

**اجرا**:
```bash
npx tsx src/demos/demo-type-system.ts
```

### 🔍 `demo-auto-discovery.ts`
**هدف**: تست سیستم auto-discovery router

**کاری که می‌کند**:
- تست auto-discovery برای room actions
- نمایش caching mechanism
- تست error handling برای routes ناموجود
- نمایش final routes بعد از auto-discovery

**اجرا**:
```bash
npx tsx src/demos/demo-auto-discovery.ts
```

### 🚀 `demo-router.ts`
**هدف**: تست hierarchical routing system

**کاری که می‌کند**:
- تست routing بین games → poker → room → actions
- نمایش module handlers
- تست error handling
- نمایش complete routing flow

**اجرا**:
```bash
npx tsx src/_utils/demos/demo-router.ts
```

### 🎯 `demo-start-action.ts`
**هدف**: تست start action با auto-discovery

**کاری که می‌کند**:
- تست auto-discovery برای start action
- نمایش type-safe user ID validation
- تست modular architecture
- نمایش error handling

**اجرا**:
```bash
npx tsx src/_utils/demos/demo-start-action.ts
```

### 🐛 `test-auto-discovery.ts`
**هدف**: Debug کردن auto-discovery system

**کاری که می‌کند**:
- تست direct import
- تست dynamic import
- تست @ alias import
- پیدا کردن مشکلات path resolution

**اجرا**:
```bash
npx tsx src/demos/test-auto-discovery.ts
```

## 🎯 چرا این Demo ها مهم هستند؟

### 1. **تست قابلیت‌ها**
- اطمینان از کارکرد صحیح سیستم
- نمایش نحوه استفاده از API ها
- تست edge cases و error handling

### 2. **مستندات زنده**
- مثال‌های عملی از استفاده سیستم
- نمایش best practices
- راهنمای migration

### 3. **Development Tools**
- Debug کردن مشکلات
- تست تغییرات جدید
- Validation تغییرات

### 4. **Onboarding**
- کمک به توسعه‌دهندگان جدید
- درک بهتر معماری
- یادگیری patterns

## 🚀 نحوه استفاده

### اجرای همه Demo ها
```bash
# Test type system
npx tsx src/_utils/demos/demo-type-system.ts

# Test auto-discovery
npx tsx src/_utils/demos/demo-auto-discovery.ts

# Test router
npx tsx src/_utils/demos/demo-router.ts

# Test start action
npx tsx src/_utils/demos/demo-start-action.ts

# Debug auto-discovery
npx tsx src/_utils/demos/test-auto-discovery.ts
```

### اضافه کردن Demo جدید
1. فایل جدید را در `src/demos/` بسازید
2. نام فایل را با `demo-` شروع کنید
3. در این README توضیح دهید
4. تست کنید که کار می‌کند

## 📝 Best Practices

### برای Demo ها
- **ساده و واضح**: کد باید قابل فهم باشد
- **مستقل**: هر demo باید خودش کار کند
- **مفید**: باید چیزی یاد بدهد
- **به‌روز**: با تغییرات سیستم sync باشد

### برای تست‌ها
- **Comprehensive**: همه موارد را پوشش دهد
- **Realistic**: از data های واقعی استفاده کند
- **Informative**: پیام‌های واضح بدهد
- **Maintainable**: آسان برای نگهداری باشد 