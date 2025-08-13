# 🎨 Separate Templates

## ✅ **Template های جداگانه آماده شدند!**

### 🎯 **ایده جدید:**

به جای یک template بزرگ، دو template جداگانه ساخته‌ایم:
1. **Table Only** - فقط کارت‌های میز
2. **Hand Only** - فقط کارت‌های دست کاربر

### 📊 **مقایسه:**

| Template | ابعاد | تعداد کارت | اندازه کارت | کیفیت |
|----------|-------|------------|-------------|-------|
| **Table Only** | 1200x800 | 5 کارت | 280x392 | خیلی عالی |
| **Hand Only** | 800x600 | 2 کارت | 280x392 | خیلی عالی |

## 🎮 **نحوه استفاده:**

### **1. ارسال کارت‌های میز:**
```typescript
const tableMessageId = await generateAndSendTemplateImage(
  'table-only',
  [
    'ace_of_hearts', 'king_of_spades', 'queen_of_diamonds',
    'jack_of_clubs', '10_of_hearts'
  ],
  'general',
  'Community Cards',
  'webp',
  true,  // transparent background
  true   // asDocument
);
```

### **2. ارسال کارت‌های دست کاربر:**
```typescript
const handMessageId = await generateAndSendTemplateImage(
  'hand-only',
  ['2_of_clubs', '3_of_hearts'],
  'general',
  'Your Hand',
  'webp',
  true,  // transparent background
  true   // asDocument
);
```

### **3. استفاده در GameHub:**
```typescript
// ابتدا کارت‌های میز را ارسال کن
await ctx.replyWithPhoto(tableMessageId, {
  caption: 'Community Cards'
});

// سپس کارت‌های دست کاربر را ارسال کن
await ctx.replyWithPhoto(handMessageId, {
  caption: 'Your Hand'
});
```

## 🎨 **ویژگی‌های جدید:**

### **1. Table Only (1200x800):**
- ✅ **5 کارت میز** - Flop, Turn, River
- ✅ **دو ردیف** - 3 کارت بالا، 2 کارت پایین
- ✅ **کارت‌های بزرگ** - 280x392
- ✅ **پس‌زمینه شفاف** - مناسب برای overlay

### **2. Hand Only (800x600):**
- ✅ **2 کارت دست** - کارت‌های کاربر
- ✅ **کارت‌های خیلی بزرگ** - 280x392
- ✅ **تمرکز کامل** - فقط روی کارت‌های کاربر
- ✅ **پس‌زمینه شفاف** - مناسب برای overlay

## 📈 **نتایج تست:**

### **Table Only:**
- ✅ **messageId:** 35
- ✅ **ابعاد:** 1200x800
- ✅ **کارت‌ها:** 5 کارت (280x392)
- ✅ **حجم:** 57.8KB (WebP transparent)
- ✅ **کیفیت:** Document mode

### **Hand Only:**
- ✅ **messageId:** 36
- ✅ **ابعاد:** 800x600
- ✅ **کارت‌ها:** 2 کارت (280x392)
- ✅ **حجم:** 14.5KB (WebP transparent)
- ✅ **کیفیت:** Document mode

## 🚀 **مزایای جدید:**

### **1. وضوح بهتر:**
- هر template روی یک چیز تمرکز دارد
- کارت‌ها خیلی بزرگ و واضح
- خوانایی عالی

### **2. انعطاف‌پذیری بیشتر:**
- می‌توان فقط میز یا فقط دست را ارسال کرد
- کنترل بهتر روی محتوا
- مناسب برای مراحل مختلف بازی

### **3. عملکرد بهتر:**
- فایل‌های کوچک‌تر
- آپلود سریع‌تر
- کش بهتر

### **4. تجربه کاربری بهتر:**
- نمایش مرحله به مرحله
- تمرکز روی هر بخش
- درک بهتر بازی

## 🎯 **کاربردها:**

### **Table Only:**
- نمایش کارت‌های میز
- مناسب برای Flop, Turn, River
- تمرکز روی community cards

### **Hand Only:**
- نمایش کارت‌های دست کاربر
- مناسب برای تصمیم‌گیری
- تمرکز روی player cards

### **ترکیب هر دو:**
- نمایش کامل وضعیت بازی
- مناسب برای showdown
- تجربه کامل بازی

## 🎉 **نتیجه:**

Template های جداگانه:
- ✅ **وضوح بهتر** (تمرکز روی هر بخش)
- ✅ **انعطاف‌پذیری بیشتر** (کنترل بهتر)
- ✅ **عملکرد بهتر** (فایل‌های کوچک‌تر)
- ✅ **تجربه کاربری بهتر** (مرحله به مرحله)
- ✅ **کارت‌های خیلی بزرگ** (280x392)
- ✅ **پس‌زمینه شفاف** (مناسب برای overlay)
- ✅ **کیفیت بالا** (WebP + Document mode)

**حالا دو template جداگانه و واضح داریم!** 🎮
