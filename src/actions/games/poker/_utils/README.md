# 🛠️ Poker Utils

این پوشه شامل تمام ابزارها و توابع کمکی برای سیستم پوکر است.

## 📁 ساختار فایل‌ها

### **Keyboard Generators**
- `gameActionKeyboardGenerator.ts` - تولید کیبوردهای اکشن بازی
- `joinRoomKeyboardGenerator.ts` - تولید کیبوردهای ورود به روم
- `formKeyboardGenerator.ts` - تولید کیبوردهای فرم

### **Validation & Guards**
- `typeGuards.ts` - بررسی نوع داده‌ها (RoomId, PlayerId, etc.)
- `roomValidation.ts` - اعتبارسنجی روم‌ها
- `roomJoinValidation.ts` - اعتبارسنجی ورود به روم
- `validateUser.ts` - اعتبارسنجی کاربر

### **State Management**
- `formStateManager.ts` - مدیریت وضعیت فرم‌ها
- `roomInfoHelper.ts` - کمک‌رسان اطلاعات روم

### **Utilities**
- `cardUtils.ts` - ابزارهای کارت (تولید، ترکیب، نمایش)
- `errorHandler.ts` - مدیریت خطاها
- `getRoomId.ts` - استخراج شناسه روم

## 🔧 نحوه استفاده

### **Import کردن**
```typescript
// Keyboard generators
import { generateGameActionKeyboard } from '../_utils/gameActionKeyboardGenerator';
import { generateJoinRoomKeyboard } from '../_utils/joinRoomKeyboardGenerator';

// Validation
import { validateRoomId, validatePlayerId } from '../_utils/typeGuards';
import { validateUser } from '../_utils/validateUser';

// Utilities
import { createDeck, shuffleDeck } from '../_utils/cardUtils';
import { handleError } from '../_utils/errorHandler';
```

### **مثال استفاده**
```typescript
// اعتبارسنجی شناسه روم
const roomId = validateRoomId(roomIdParam) as RoomId;

// تولید کیبورد بازی
const keyboard = generateGameActionKeyboard(gameState, playerId, isCurrentTurn);

// مدیریت خطا
try {
  // کد اصلی
} catch (error) {
  handleError('functionName', error, { context });
}
```

## 📋 لیست کامل فایل‌ها

| فایل | توضیحات | اندازه |
|------|---------|--------|
| `gameActionKeyboardGenerator.ts` | تولید کیبوردهای اکشن بازی | 4.0KB |
| `joinRoomKeyboardGenerator.ts` | تولید کیبوردهای ورود به روم | 2.8KB |
| `formKeyboardGenerator.ts` | تولید کیبوردهای فرم | 2.1KB |
| `typeGuards.ts` | بررسی نوع داده‌ها | 2.2KB |
| `roomValidation.ts` | اعتبارسنجی روم‌ها | 3.9KB |
| `roomJoinValidation.ts` | اعتبارسنجی ورود به روم | 3.1KB |
| `validateUser.ts` | اعتبارسنجی کاربر | 0.8KB |
| `formStateManager.ts` | مدیریت وضعیت فرم‌ها | 4.0KB |
| `roomInfoHelper.ts` | کمک‌رسان اطلاعات روم | 6.3KB |
| `cardUtils.ts` | ابزارهای کارت | 8.7KB |
| `errorHandler.ts` | مدیریت خطاها | 6.7KB |
| `getRoomId.ts` | استخراج شناسه روم | 0.4KB |

## 🎯 ویژگی‌های کلیدی

### **Type Safety**
- تمام توابع با TypeScript نوشته شده‌اند
- استفاده از type guards برای اعتبارسنجی
- پشتیبانی از custom types (RoomId, PlayerId)

### **Error Handling**
- مدیریت متمرکز خطاها
- لاگ کردن خطاها با context
- پیام‌های خطای فارسی

### **Modularity**
- هر فایل مسئولیت مشخصی دارد
- Import/export تمیز
- قابلیت استفاده مجدد

### **Performance**
- توابع بهینه‌سازی شده
- کش کردن نتایج پرکاربرد
- مدیریت حافظه مناسب

## 🔄 تغییرات اخیر

### **انتقال فایل‌ها**
- تمام فایل‌ها از `_utils/utils/` به `_utils/` منتقل شدند
- پوشه `utils` حذف شد
- Import های مربوطه اصلاح شدند

### **ساختار جدید**
```
src/actions/games/poker/_utils/
├── gameActionKeyboardGenerator.ts
├── joinRoomKeyboardGenerator.ts
├── formKeyboardGenerator.ts
├── typeGuards.ts
├── roomValidation.ts
├── roomJoinValidation.ts
├── validateUser.ts
├── formStateManager.ts
├── roomInfoHelper.ts
├── cardUtils.ts
├── errorHandler.ts
├── getRoomId.ts
└── README.md
```

## 🧪 تست

### **تست‌های موجود**
- تست type guards
- تست validation functions
- تست keyboard generators
- تست error handling

### **اجرای تست‌ها**
```bash
# تست تمام فایل‌های utils
pnpm test src/actions/games/poker/_utils/

# تست فایل خاص
pnpm test src/actions/games/poker/_utils/typeGuards.test.ts
```

## 📈 آمار

- **تعداد فایل‌ها**: 12
- **کل حجم**: ~45KB
- **خطوط کد**: ~1,800 خط
- **توابع**: ~150 تابع
- **Type definitions**: ~50 type

## 🔮 آینده

### **پیشنهادات بهبود**
1. **کش کردن**: کش کردن نتایج پرکاربرد
2. **بهینه‌سازی**: بهبود عملکرد توابع
3. **مستندسازی**: اضافه کردن JSDoc
4. **تست‌ها**: افزایش پوشش تست

### **نظارت**
- نظارت بر عملکرد توابع
- گزارش‌گیری از خطاها
- آمار استفاده 