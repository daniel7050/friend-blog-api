// small shapes used across the users module
export type PublicUser = {
  id: number;
  name: string;
  username: string;
  email?: string; // omitted in public responses when needed
  createdAt: string;
};

export type UpdateUserDto = {
  name?: string;
  username?: string;
  bio?: string | null;
  // avatarUrl handled as string; consider signed upload for production
  avatarUrl?: string | null;
};
