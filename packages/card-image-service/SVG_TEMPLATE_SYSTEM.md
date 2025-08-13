# 🎨 SVG Template System

## ✅ **سیستم SVG Template آماده است!**

### 🎯 **ویژگی‌های کلیدی:**

✅ **SVG Templates** - پس‌زمینه‌های SVG با مکان‌های مشخص  
✅ **Dynamic Card Placement** - قرار دادن کارت‌ها در مکان‌های مشخص  
✅ **WebP + Document Mode** - کیفیت بالا بدون فشرده‌سازی  
✅ **Caching System** - کش کردن تصاویر برای عملکرد بهتر  
✅ **Multiple Formats** - پشتیبانی از PNG و WebP  
✅ **Transparent Backgrounds** - پس‌زمینه‌های شفاف  

## 🎮 **نحوه استفاده:**

### **1. تولید تصویر میز پوکر با 7 کارت:**

```typescript
import { generateAndSendTemplateImage } from './card-image-service';

const messageId = await generateAndSendTemplateImage(
  'poker-table',  // template ID
  [
    'ace_of_hearts',    // Flop 1
    'king_of_spades',   // Flop 2  
    'queen_of_diamonds', // Flop 3
    'jack_of_clubs',    // Turn
    '10_of_hearts',     // River
    '2_of_clubs',       // Player 1
    '3_of_hearts'       // Player 2
  ],
  'general',           // style
  'Poker Game State',  // debug tag
  'webp',             // format
  false,              // transparent
  true                // asDocument (no compression)
);
```

### **2. تولید buffer فقط (برای تست):**

```typescript
import { generateTemplateBufferOnly } from './card-image-service';

const buffer = await generateTemplateBufferOnly(
  'poker-table',
  ['ace_of_hearts', 'king_of_spades'],
  'general',
  'Test',
  'webp',
  false
);
```

### **3. Regenerate (اگر messageId نامعتبر شد):**

```typescript
import { regenerateTemplateImage } from './card-image-service';

const newMessageId = await regenerateTemplateImage(
  'poker-table',
  ['ace_of_hearts', 'king_of_spades'],
  'general',
  'Regenerated',
  'webp',
  false,
  true
);
```

## 📁 **ساختار فایل‌ها:**

```
assets/
├── templates/
│   └── poker-table.svg          # SVG template
└── template-configs/
    └── poker-table.json         # تنظیمات مکان کارت‌ها

src/
├── image/templates/
│   └── composer.ts              # SVG composer
├── generateTemplateImage.ts     # API اصلی
└── template-test.ts             # تست سریع
```

## 🎨 **Template فعلی:**

### **Poker Table (میز پوکر):**
- **ابعاد:** 800x600
- **کارت‌های میز:** 5 کارت (Flop, Turn, River)
- **کارت‌های دست:** 2 کارت (Player)
- **پس‌زمینه:** میز پوکر سبز

### **مکان‌های کارت:**
1. **Flop 1:** x=250, y=250
2. **Flop 2:** x=320, y=250  
3. **Flop 3:** x=390, y=250
4. **Turn:** x=460, y=250
5. **River:** x=530, y=250
6. **Player 1:** x=300, y=450
7. **Player 2:** x=380, y=450

## 🚀 **نتایج تست:**

✅ **تصویر تولید شد:** messageId: 17  
✅ **فرمت:** WebP (15,428 bytes)  
✅ **کیفیت:** Document mode (بدون فشرده‌سازی)  
✅ **ابعاد:** 800x600  
✅ **کش:** ذخیره شده برای استفاده بعدی  

## 🎯 **مزایا:**

### **1. انعطاف‌پذیری:**
- هر template می‌تواند مکان‌های مختلف داشته باشد
- به راحتی template های جدید اضافه می‌شوند

### **2. کیفیت بالا:**
- SVG vector graphics
- WebP با کیفیت بالا
- Document mode بدون فشرده‌سازی

### **3. عملکرد بهتر:**
- سیستم کش هوشمند
- تولید سریع تصاویر
- استفاده مجدد از template ها

### **4. قابلیت توسعه:**
- API ساده و قابل فهم
- TypeScript support
- Error handling کامل

## 🔧 **اضافه کردن Template جدید:**

### **1. ایجاد SVG template:**
```svg
<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
  <!-- پس‌زمینه -->
  <rect width="600" height="400" fill="#1a1a1a"/>
  
  <!-- مکان‌های کارت -->
  <rect x="100" y="150" width="60" height="84" fill="none" stroke="#fff" stroke-width="2" opacity="0.3"/>
  <rect x="200" y="150" width="60" height="84" fill="none" stroke="#fff" stroke-width="2" opacity="0.3"/>
</svg>
```

### **2. ایجاد فایل config:**
```json
{
  "id": "new-template",
  "name": "New Template",
  "width": 600,
  "height": 400,
  "cardPositions": [
    {
      "id": "card-1",
      "x": 100,
      "y": 150,
      "width": 60,
      "height": 84,
      "rotation": 0,
      "zIndex": 1
    }
  ]
}
```

### **3. استفاده:**
```typescript
const messageId = await generateAndSendTemplateImage(
  'new-template',
  ['ace_of_hearts', 'king_of_spades'],
  'general',
  'New Template Test',
  'webp',
  false,
  true
);
```

## 🎉 **نتیجه:**

سیستم SVG template آماده است و می‌تواند:
- تصاویر با کیفیت بالا تولید کند
- کارت‌ها را در مکان‌های مشخص قرار دهد
- WebP با پسوند درست ارسال کند
- از سیستم کش استفاده کند
- به راحتی توسعه یابد

**آماده برای استفاده در GameHub!** 🚀
