"use server";

export const logout = async () => {
  // Logout happens on client side with NextAuth v4
  return { success: true };
};
