// GENERATED FILE – DO NOT EDIT
// Generated from src/actions folder structure

export const ALL_ROUTES = ["games.poker","games.poker.room.create","games.poker.start","start"] as const;
export type ActionRoute = typeof ALL_ROUTES[number];
export const ROUTES = {
  "games": {
    "poker": {
      "_self": "games.poker",
      "room": {
        "create": "games.poker.room.create"
      },
      "start": "games.poker.start"
    }
  },
  "start": "start"
} as const;
export function isRoute(v: string): v is ActionRoute { return (ALL_ROUTES as readonly string[]).includes(v); }
