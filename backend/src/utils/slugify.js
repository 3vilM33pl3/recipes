import slugifyLib from 'slugify';
import { nanoid } from 'nanoid';

export function createSlug(title) {
  const baseSlug = slugifyLib(title || 'recipe', {
    lower: true,
    strict: true,
    trim: true,
  });

  // Add a short unique suffix
  const suffix = nanoid(6);

  return `${baseSlug}-${suffix}`;
}
