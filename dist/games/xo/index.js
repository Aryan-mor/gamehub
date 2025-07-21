"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerXoHandlers = registerXoHandlers;
const handlers_1 = require("./handlers");
function registerXoHandlers(bot) {
    console.log("[XO] registerXoHandlers called. Registering X/O game handlers...");
    (0, handlers_1.registerXoTelegramHandlers)(bot);
}
//# sourceMappingURL=index.js.map