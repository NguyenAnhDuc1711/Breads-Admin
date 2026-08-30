import { Constants } from "@/Breads-Shared/Constants";

export const getUserStatusLabel = (status?: number) => {
  const { ACTIVE, INACTIVE, LOCK, BANNED } = Constants.USER_STATUS;
  switch (status) {
    case ACTIVE:
      return "Online";
    case INACTIVE:
      return "Offline";
    case LOCK:
      return "Lock";
    case BANNED:
      return "Banned";
    default:
      return "";
  }
};

export const getUserRoleLabel = (role?: number) => {
  const { ADMIN, USER, MODERATOR } = Constants.USER_ROLE;
  switch (role) {
    case ADMIN:
      return "Admin";
    case USER:
      return "User";
    case MODERATOR:
      return "Moderator";
    default:
      return "";
  }
};
