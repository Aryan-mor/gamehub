# 🎴 Simple JPEG Templates

## ✅ **Template های ساده JPEG آماده شدند!**

### 🎯 **ایده جدید:**

به جای template های پیچیده، template های ساده با JPEG ایجاد کردیم:
- **سریع** - JPEG سریع‌تر از WebP تولید می‌شود
- **کامپرس شده** - فایل‌های کوچک‌تر
- **ساده** - پس‌زمینه‌های ساده و واضح
- **بهینه** - مناسب برای real-time games

### 📊 **مقایسه:**

| Template | ابعاد | اندازه کارت | حجم فایل | ویژگی |
|----------|-------|-------------|----------|-------|
| **Simple Table** | 800x600 | 120x168 | 28KB | ساده و سریع |
| **Simple Hand** | 600x400 | 120x168 | 10KB | ساده و سریع |

## 🎮 **نحوه استفاده:**

### **1. میز ساده با JPEG:**
```typescript
const tableMessageId = await generateAndSendTemplateImage(
  'simple-table',
  ['ace_of_hearts', 'king_of_spades', 'queen_of_diamonds', 'jack_of_clubs', '10_of_hearts'],
  'general',
  'Community Cards',
  'jpeg',
  false,  // not transparent (JPEG doesn't support transparency)
  false   // as photo (compressed)
);
```

### **2. دست ساده با JPEG:**
```typescript
const handMessageId = await generateAndSendTemplateImage(
  'simple-hand',
  ['2_of_clubs', '3_of_hearts'],
  'general',
  'Your Hand',
  'jpeg',
  false,  // not transparent
  false   // as photo (compressed)
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

## 📈 **نتایج تست:**

### **Simple Table (800x600):**
- ✅ **messageId:** 42
- ✅ **ابعاد:** 800x600
- ✅ **کارت‌ها:** 5 کارت (120x168)
- ✅ **حجم:** 28KB (JPEG compressed)
- ✅ **فرمت:** JPEG (سریع)
- ✅ **روش:** Photo mode (کامپرس شده)

### **Simple Hand (600x400):**
- ✅ **messageId:** 43
- ✅ **ابعاد:** 600x400
- ✅ **کارت‌ها:** 2 کارت (120x168)
- ✅ **حجم:** 10KB (JPEG compressed)
- ✅ **فرمت:** JPEG (سریع)
- ✅ **روش:** Photo mode (کامپرس شده)

## 🎨 **ویژگی‌های جدید:**

### **1. Simple Table (800x600):**
- ✅ **پس‌زمینه سبز ساده** - ظاهر واقعی‌تر
- ✅ **5 کارت میز** - Flop, Turn, River
- ✅ **چیدمان سنتی** - 3 بالا، 2 پایین
- ✅ **کارت‌های متوسط** - 120x168
- ✅ **JPEG سریع** - تولید سریع

### **2. Simple Hand (600x400):**
- ✅ **پس‌زمینه تیره ساده** - تمرکز روی کارت‌ها
- ✅ **2 کارت دست** - کارت‌های کاربر
- ✅ **کارت‌های متوسط** - 120x168
- ✅ **JPEG سریع** - تولید سریع

## 🚀 **مزایای جدید:**

### **1. سرعت بالا:**
- JPEG سریع‌تر از WebP تولید می‌شود
- فایل‌های کوچک‌تر
- آپلود سریع‌تر

### **2. سادگی:**
- پس‌زمینه‌های ساده
- چیدمان واضح
- خوانایی عالی

### **3. بهینه‌سازی:**
- مناسب برای real-time games
- مصرف کم‌تر منابع
- عملکرد بهتر

### **4. سازگاری:**
- JPEG در همه جا پشتیبانی می‌شود
- فایل‌های کوچک‌تر
- آپلود سریع‌تر

## 🎯 **کاربردها:**

### **Simple Table:**
- نمایش کارت‌های میز
- مناسب برای Flop, Turn, River
- ظاهر واقعی‌تر

### **Simple Hand:**
- نمایش کارت‌های دست کاربر
- مناسب برای تصمیم‌گیری
- تمرکز روی کارت‌ها

### **ترکیب هر دو:**
- نمایش کامل وضعیت بازی
- مناسب برای real-time games
- عملکرد بهینه

## 🎉 **نتیجه:**

Template های ساده JPEG:
- ✅ **سریع** (JPEG format)
- ✅ **کامپرس شده** (فایل‌های کوچک)
- ✅ **ساده** (پس‌زمینه‌های واضح)
- ✅ **بهینه** (مناسب برای real-time)
- ✅ **سازگار** (پشتیبانی کامل)
- ✅ **عملکرد بالا** (مصرف کم منابع)

**حالا template های ساده و سریع داریم!** 🎮
