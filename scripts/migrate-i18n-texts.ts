#!/usr/bin/env tsx

/**
 * Migration script to replace hardcoded Persian texts with translation keys
 */

import fs from 'fs';
import path from 'path';

// Translation mappings
const translations = {
  // Form errors
  '❌ <b>خطا در پردازش فرم</b>\\n\\nمتأسفانه مشکلی در پردازش اطلاعات فرم پیش آمده.\\nلطفاً دوباره تلاش کنید.': 'poker.form.error.processing',
  '❌ <b>خطا در پردازش فرم</b>\\n\\nمرحله نامعتبر:': 'poker.form.error.invalidStep',
  
  // Form step successes
  '📝 <b>نام روم</b>\\n\\n✅ "${name}" انتخاب شد.\\n\\nدر مرحله بعدی نوع روم را انتخاب کنید:': 'poker.form.nameStep.success',
  '🔒 <b>نوع روم</b>\\n\\n✅ ${privacyType} انتخاب شد.\\n\\nدر مرحله بعدی تعداد حداکثر بازیکنان را انتخاب کنید:': 'poker.form.privacyStep.success',
  '👥 <b>حداکثر بازیکنان</b>\\n\\n✅ ${maxPlayers} نفر انتخاب شد.\\n\\nدر مرحله بعدی مقدار Small Blind را انتخاب کنید:': 'poker.form.maxPlayersStep.success',
  '💰 <b>Small Blind</b>\\n\\n✅ ${smallBlind} سکه انتخاب شد.\\n\\nدر مرحله بعدی زمان تایم‌اوت را انتخاب کنید:': 'poker.form.smallBlindStep.success',
  '⏱️ <b>زمان تایم‌اوت</b>\\n\\n✅ ${timeout} ثانیه انتخاب شد.\\n\\nفرم تکمیل شد! حالا می‌توانید روم را بسازید.': 'poker.form.timeoutStep.success',
  
  // Room creation
  '❌ <b>خطا در تایید روم</b>\\n\\nاطلاعات فرم ناقص است.\\nلطفاً ابتدا فرم را تکمیل کنید.': 'poker.form.confirmation.error',
  '🏠 <b>روم با موفقیت ساخته شد!</b>': 'poker.room.created.success',
  '❌ <b>خطا در ساخت روم</b>\\n\\nمتأسفانه مشکلی در ساخت روم پیش آمده.\\nلطفاً دوباره تلاش کنید.': 'poker.room.creation.error',
  '❌ <b>خطا در شروع فرم</b>\\n\\nمتأسفانه مشکلی در شروع فرم ساخت روم پیش آمده.\\nلطفاً دوباره تلاش کنید.': 'poker.form.start.error',
  
  // Room info
  '🏠 <b>اطلاعات روم پوکر</b>': 'poker.room.info.title',
  '📋 <b>مشخصات روم:</b>': 'poker.room.info.details',
  '• نام:': 'poker.room.info.name',
  '• شناسه:': 'poker.room.info.id',
  '• وضعیت:': 'poker.room.info.status',
  '• نوع:': 'poker.room.info.type',
  '🔒 خصوصی': 'poker.room.info.type.private',
  '🌐 عمومی': 'poker.room.info.type.public',
  '⚙️ <b>تنظیمات بازی:</b>': 'poker.room.info.gameSettings',
  '• Small Blind:': 'poker.room.info.smallBlind',
  '• Big Blind:': 'poker.room.info.bigBlind',
  '• حداکثر بازیکن:': 'poker.room.info.maxPlayers',
  '• تایم‌اوت نوبت:': 'poker.room.info.timeout',
  '👥 <b>بازیکنان': 'poker.room.info.playersTitle',
  ' <i>(سازنده)</i>': 'poker.room.info.creator',
  ' <i>(شما)</i>': 'poker.room.info.you',
  
  // Room status
  '⏳ <b>وضعیت روم:</b>': 'poker.room.status.waiting.title',
  '• بازیکنان:': 'poker.room.status.waiting.players',
  '• حداقل مورد نیاز:': 'poker.room.status.waiting.minRequired',
  '🎮 <b>شما می‌توانید بازی را شروع کنید!</b>': 'poker.room.status.waiting.canStart',
  '⏳ <b>منتظر بازیکنان بیشتر...</b>': 'poker.room.status.waiting.needMore',
  '⏳ <b>منتظر شروع بازی توسط سازنده...</b>': 'poker.room.status.waiting.waitingStart',
  '🎮 <b>بازی در حال اجرا</b>': 'poker.room.status.active.title',
  '• پات:': 'poker.room.status.active.pot',
  '• دور:': 'poker.room.status.active.round',
  '• نوبت:': 'poker.room.status.active.turn',
  'آخرین بروزرسانی:': 'poker.room.lastUpdated',
  
  // Buttons
  '🎮 شروع بازی': 'poker.room.buttons.startGame',
  '📤 اشتراک‌گذاری': 'poker.room.buttons.share',
  '🔁 بروزرسانی': 'poker.room.buttons.refresh',
  '🚪 خروج از روم': 'poker.room.buttons.leave',
  '🔙 بازگشت به منو': 'poker.room.buttons.backToMenu',
  '🔙 بازگشت به اطلاعات روم': 'poker.room.buttons.backToRoomInfo',
  '🚪 خروج از بازی': 'poker.room.buttons.exitGame',
  '🔙 بازگشت به بازی': 'poker.room.buttons.backToGame',
  '🔄 بروزرسانی': 'poker.room.buttons.update',
  
  // Status labels
  '⏳ منتظر بازیکنان': 'poker.status.waiting',
  '🎮 فعال': 'poker.status.active',
  '🎮 در حال بازی': 'poker.status.playing',
  '🏁 تمام شده': 'poker.status.finished',
  '❌ لغو شده': 'poker.status.cancelled'
};

function migrateFile(filePath: string): void {
  console.log(`\n🔄 Migrating: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let changes = 0;
  
  for (const [persianText, translationKey] of Object.entries(translations)) {
    const regex = new RegExp(persianText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (content.includes(persianText)) {
      content = content.replace(regex, `ctx.t('${translationKey}')`);
      changes++;
      console.log(`  ✅ Replaced: ${translationKey}`);
    }
  }
  
  if (changes > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`  🎉 ${changes} changes applied to ${filePath}`);
  } else {
    console.log(`  ℹ️  No changes needed in ${filePath}`);
  }
}

function findPokerFiles(): string[] {
  const pokerDir = path.join(process.cwd(), 'src/actions/games/poker');
  const files: string[] = [];
  
  function scanDirectory(dir: string): void {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  scanDirectory(pokerDir);
  return files;
}

function main(): void {
  console.log('🚀 Starting i18n migration...\n');
  
  const files = findPokerFiles();
  console.log(`📁 Found ${files.length} TypeScript files in poker directory`);
  
  for (const file of files) {
    try {
      migrateFile(file);
    } catch (error) {
      console.error(`❌ Error migrating ${file}:`, error);
    }
  }
  
  console.log('\n✅ Migration completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Review the changes');
  console.log('2. Test the bot functionality');
  console.log('3. Run lint and fix any issues');
  console.log('4. Commit the changes');
}

if (require.main === module) {
  main();
}
