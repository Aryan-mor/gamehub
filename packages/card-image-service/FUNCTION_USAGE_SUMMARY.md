# �� Function Usage Summary

## ✅ **Template بهبود یافته آماده است و قابل استفاده!**

### 🎯 **نحوه استفاده در پروژه اصلی:**

#### **1. تولید تصویر میز پوکر کامل:**
```typescript
import { generatePokerTableImage } from './card-image-service';

// تولید تصویر میز پوکر با 7 کارت
const messageId = await generatePokerTableImage(
  [
    'ace_of_hearts',    // Flop 1
    'king_of_spades',   // Flop 2  
    'queen_of_diamonds', // Flop 3
    'jack_of_clubs',    // Turn
    '10_of_hearts'      // River
  ],
  [
    '2_of_clubs',       // Player 1
    '3_of_hearts'       // Player 2
  ],
  'Poker Game State'    // debug tag
);

console.log(`تصویر میز پوکر: messageId ${messageId}`);
```

#### **2. تولید تصویر دست شخصی:**
```typescript
import { generatePlayerHandImage } from './card-image-service';

// تولید تصویر دست شخصی با 2 کارت
const messageId = await generatePlayerHandImage(
  [
    'ace_of_hearts',    // Player 1
    'king_of_spades'    // Player 2
  ],
  'Your Hand'           // debug tag
);

console.log(`تصویر دست شخصی: messageId ${messageId}`);
```

#### **3. استفاده مستقیم از template:**
```typescript
import { generateAndSendTemplateImage } from './card-image-service';

// استفاده مستقیم از template
const messageId = await generateAndSendTemplateImage(
  'poker-table',        // template ID
  [
    'ace_of_hearts', 'king_of_spades', 'queen_of_diamonds',
    'jack_of_clubs', '10_of_hearts', '2_of_clubs', '3_of_hearts'
  ],
  'general',           // style
  'Poker Game State',  // debug tag
  'jpeg',             // format (JPEG)
  false,              // transparent (false for JPEG)
  false               // asDocument (false = photo mode = compressed)
);
```

## 📊 **ویژگی‌های کلیدی:**

### **1. کارت‌های خیلی بزرگتر:**
- **اندازه:** 120x168 (100% بزرگتر از قبل)
- **وضوح:** کاملاً قابل مشاهده
- **خوانایی:** عالی

### **2. فرمت JPEG:**
- **سرعت:** سریع‌تر از WebP
- **حجم:** متعادل (49KB)
- **کیفیت:** مناسب برای real-time

### **3. طراحی بهتر:**
- **ابعاد:** 1200x800
- **پس‌زمینه:** میز پوکر واقعی‌تر
- **چیدمان:** 5 کارت روی میز + 2 کارت دست

### **4. سیستم کش:**
- **کش کردن:** خودکار
- **بازیابی:** سریع برای درخواست‌های تکراری
- **Regenerate:** امکان تولید مجدد

## 🎮 **نتایج تست:**

✅ **messageId:** 44 (کش شده)  
✅ **messageId:** 46 (جدید)  
✅ **ابعاد:** 1200x800  
✅ **کارت‌ها:** 120x168 (100% بزرگتر)  
✅ **حجم:** 49KB (JPEG compressed)  
✅ **فرمت:** JPEG (سریع)  
✅ **روش:** Photo mode (کامپرس شده)  

## 🚀 **مزایای استفاده:**

### **1. سادگی:**
- فقط 2 function ساده
- پارامترهای واضح
- Error handling کامل

### **2. انعطاف‌پذیری:**
- پشتیبانی از JPEG و WebP
- Photo mode و Document mode
- کش کردن خودکار

### **3. عملکرد:**
- سرعت بالا
- کیفیت مناسب
- مناسب برای real-time

### **4. قابلیت اطمینان:**
- Error handling
- Regenerate capability
- Logging کامل

## 🎯 **آماده برای استفاده در GameHub!**

Template بهبود یافته با کارت‌های خیلی بزرگ و JPEG آماده است و می‌توانید از function های زیر استفاده کنید:

1. **`generatePokerTableImage()`** - برای میز پوکر کامل
2. **`generatePlayerHandImage()`** - برای دست شخصی
3. **`generateAndSendTemplateImage()`** - برای استفاده مستقیم

**همه چیز آماده است!** 🎮
