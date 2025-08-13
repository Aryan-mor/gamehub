// GENERATED FILE – DO NOT EDIT
// Generated from src/actions folder structure

export const ALL_ROUTES = ["games.findStep","games.join","games.join.switch","games.poker","games.poker.findRoom","games.poker.help","games.poker.room.call","games.poker.room.check","games.poker.room.create","games.poker.room.fold","games.poker.room.info","games.poker.room.leave","games.poker.room.notready","games.poker.room.ready","games.poker.room.start","games.poker.start","games.start","help","settings","settings.language","settings.language.set","start"] as const;
export type ActionRoute = typeof ALL_ROUTES[number];
export const ROUTES = {
  "games": {
    "findStep": "games.findStep",
    "join": {
      "_self": "games.join",
      "switch": "games.join.switch"
    },
    "poker": {
      "_self": "games.poker",
      "findRoom": "games.poker.findRoom",
      "help": "games.poker.help",
      "room": {
        "call": "games.poker.room.call",
        "check": "games.poker.room.check",
        "create": "games.poker.room.create",
        "fold": "games.poker.room.fold",
        "info": "games.poker.room.info",
        "leave": "games.poker.room.leave",
        "notready": "games.poker.room.notready",
        "ready": "games.poker.room.ready",
        "start": "games.poker.room.start"
      },
      "start": "games.poker.start"
    },
    "start": "games.start"
  },
  "help": "help",
  "settings": {
    "_self": "settings",
    "language": {
      "_self": "settings.language",
      "set": "settings.language.set"
    }
  },
  "start": "start"
} as const;
export function isRoute(v: string): v is ActionRoute { return (ALL_ROUTES as readonly string[]).includes(v); }
