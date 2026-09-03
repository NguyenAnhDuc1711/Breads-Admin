import { Constants } from "@/Breads-Shared/Constants";

export const ROUTE_ROLES: Record<string, number[]> = {
  "/": [Constants.USER_ROLE.ADMIN, Constants.USER_ROLE.MODERATOR],
  "/posts": [Constants.USER_ROLE.ADMIN, Constants.USER_ROLE.MODERATOR],
  "/posts/validation": [
    Constants.USER_ROLE.ADMIN,
    Constants.USER_ROLE.MODERATOR,
  ],
  "/report": [Constants.USER_ROLE.ADMIN, Constants.USER_ROLE.MODERATOR],
  "/users": [Constants.USER_ROLE.ADMIN],
};
