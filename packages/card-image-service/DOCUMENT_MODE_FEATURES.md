# 📄 Document Mode Features

## ✅ New Capabilities Added

### 1. **Document Sending Mode**
- ✅ **Photo Mode** (`asDocument: false`) - Telegram compresses the image
- ✅ **Document Mode** (`asDocument: true`) - No compression, original quality preserved
- ✅ **Flexible Choice** - Choose between compressed and uncompressed
- ✅ **Quality Preservation** - Document mode maintains original image quality

### 2. **Enhanced API**
- ✅ **asDocument Parameter** - `boolean` (default: false)
- ✅ **Backward Compatibility** - All existing code still works
- ✅ **Cache Integration** - Document mode included in cache key
- ✅ **Separate Methods** - `sendImage()` and `sendDocument()` methods

### 3. **Quality Comparison**
- ✅ **Photo Mode** - Smaller file size, compressed by Telegram
- ✅ **Document Mode** - Original file size, no compression
- ✅ **File ID Differences** - Different file IDs for photo vs document

## 🎯 Usage Examples

### Photo Mode (Compressed)
```typescript
const messageId = await generateAndSendCard(
  ['ace_of_hearts', 'king_of_spades'],
  'general',
  'club',
  'Player Hand',
  'png',
  false,
  false  // asDocument: false (photo mode)
);
```

### Document Mode (No Compression)
```typescript
const messageId = await generateAndSendCard(
  ['ace_of_hearts', 'king_of_spades'],
  'general',
  'general',
  'Player Hand',
  'webp',
  true,
  true   // asDocument: true (document mode)
);
```

### Combined with WebP and Transparency
```typescript
const messageId = await generateAndSendCard(
  ['ace_of_hearts', 'king_of_spades'],
  'general',
  'general',
  'High Quality Hand',
  'webp',   // format
  true,     // transparent
  true      // asDocument (no compression)
);
```

## 📊 Quality Comparison

### From Test Results:
- **Photo Mode (PNG)**: Compressed by Telegram, smaller display
- **Document Mode (PNG)**: Original quality, full resolution
- **Photo Mode (WebP)**: Compressed by Telegram
- **Document Mode (WebP)**: Original WebP quality preserved

### File ID Patterns:
- **Photo Mode**: `AgACAgQAAyEGAASoVOxlAAMFaJy4M3iskZZXfDqcWbbtF2E36XUAAsPMMRutT-BQep25sNGnVzUBAA`
- **Document Mode**: `BQACAgQAAyEGAASoVOxlAAMMaJzfl8GgK5CXBkiHbna9fQLa_9cAAlodAAKtT-hQuES8v9Aqxao2BA`

## 🔧 Technical Details

### Telegram API Methods:
```typescript
// Photo mode (compressed)
await bot.api.sendPhoto(channelId, inputFile, options);

// Document mode (no compression)
await bot.api.sendDocument(channelId, inputFile, options);
```

### Cache Key Generation:
```typescript
const hashData = {
  cards: cards.sort(),
  style,
  area,
  debugTag,
  format,
  transparent,
  asDocument  // New: includes document mode
};
```

### Response Differences:
```typescript
// Photo mode response
{
  messageId: "11",
  fileId: "AgACAgQAAyEGAASoVOxlAAMFaJy4M3iskZZXfDqcWbbtF2E36XUAAsPMMRutT-BQep25sNGnVzUBAA"
}

// Document mode response
{
  messageId: "12",
  fileId: "BQACAgQAAyEGAASoVOxlAAMMaJzfl8GgK5CXBkiHbna9fQLa_9cAAlodAAKtT-hQuES8v9Aqxao2BA"
}
```

## 🎨 Use Cases

### 1. **High Quality Display**
```typescript
// Use document mode for high-quality display
const highQualityImage = await generateAndSendCard(
  playerCards,
  'general',
  'general',
  'High Quality Hand',
  'webp',
  true,   // transparent
  true    // document mode
);
```

### 2. **Fast Loading**
```typescript
// Use photo mode for faster loading
const fastImage = await generateAndSendCard(
  playerCards,
  'general',
  'club',
  'Fast Loading Hand',
  'webp',
  false,  // with background
  false   // photo mode
);
```

### 3. **Quality vs Performance**
```typescript
// Choose based on use case
const imageMode = needsHighQuality ? 'document' : 'photo';
const messageId = await generateAndSendCard(
  playerCards,
  'general',
  'general',
  'Player Hand',
  'webp',
  true,
  imageMode === 'document'  // asDocument
);
```

## ✅ Test Results

All features tested and working:
- ✅ Photo mode (compressed)
- ✅ Document mode (no compression)
- ✅ Cache functionality with document mode
- ✅ Different file IDs for different modes
- ✅ WebP + Document mode combination
- ✅ PNG + Document mode combination
- ✅ Regeneration with document mode

## 🚀 Benefits

### Document Mode Advantages:
- ✅ **Original Quality** - No compression by Telegram
- ✅ **Full Resolution** - Maintains original image dimensions
- ✅ **Better for Overlays** - Perfect quality for transparent images
- ✅ **Professional Look** - High-quality display

### Photo Mode Advantages:
- ✅ **Faster Loading** - Smaller file sizes
- ✅ **Better Performance** - Less bandwidth usage
- ✅ **Mobile Friendly** - Optimized for mobile devices
- ✅ **Standard Display** - Normal Telegram photo display

## 🎯 Perfect for GameHub

The service now supports:
1. **Multiple formats** - PNG and WebP
2. **Transparent backgrounds** - Perfect for overlays
3. **Document mode** - No compression, best quality
4. **Photo mode** - Compressed, faster loading
5. **Flexible choice** - Choose based on use case
6. **Full caching** - All combinations cached separately

Perfect for different game scenarios! 🎮
