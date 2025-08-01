# Cursor Configuration

این پوشه شامل تنظیمات و قوانین Cursor برای پروژه GameHub است.

## 📁 محتویات

### `rules/gamehub-project.cursorrules`
قوانین اصلی Cursor برای پروژه GameHub که شامل:

- **ساختار پروژه**: Directory structure و architecture patterns
- **TypeScript Best Practices**: قوانین type safety و custom ID system
- **Development Guidelines**: نحوه توسعه و coding standards
- **Code Examples**: مثال‌های عملی برای handlers و type guards
- **Migration Guidelines**: راهنمای migration از ساختار قدیمی
- **Common Pitfalls**: مشکلات رایج و راه‌حل‌ها

## 🎯 نحوه استفاده

### فعال کردن قوانین
Cursor به صورت خودکار فایل‌های `.cursorrules` را در پوشه `rules/` پیدا می‌کند و اعمال می‌کند.

### آپدیت قوانین
برای تغییر قوانین:
1. فایل `rules/gamehub-project.cursorrules` را ویرایش کنید
2. تغییرات را ذخیره کنید
3. Cursor به صورت خودکار قوانین جدید را اعمال می‌کند

### اضافه کردن قوانین جدید
برای اضافه کردن قوانین جدید:
1. فایل جدید با پسوند `.cursorrules` در پوشه `rules/` بسازید
2. قوانین را بنویسید
3. Cursor آن‌ها را اعمال خواهد کرد

## 📝 ساختار فایل قوانین

### بخش‌های اصلی
- **Project Structure**: ساختار پوشه‌ها و فایل‌ها
- **TypeScript Best Practices**: قوانین TypeScript
- **Development Guidelines**: راهنمای توسعه
- **Code Examples**: مثال‌های کد
- **Migration Guidelines**: راهنمای migration

### قوانین مهم
- استفاده از custom ID types
- Auto-discovery router system
- Export default pattern
- Type safety requirements
- Error handling standards

## 🔧 تنظیمات اضافی

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Import Aliases
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 🚀 مزایا

### برای توسعه‌دهندگان
- **Consistency**: کد یکسان در کل پروژه
- **Quality**: کیفیت بالا با type safety
- **Productivity**: افزایش سرعت توسعه
- **Maintainability**: قابلیت نگهداری بهتر

### برای پروژه
- **Scalability**: مقیاس‌پذیری بهتر
- **Reliability**: قابلیت اطمینان بیشتر
- **Documentation**: مستندات زنده
- **Standards**: استانداردهای مشخص

## 📚 منابع

- [Cursor Documentation](https://cursor.sh/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [GameHub Architecture](src/README.md) 