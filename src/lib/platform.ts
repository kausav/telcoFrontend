import { setting } from './appConfig';

/**
 * The ModelOS platform this application is a module of ("Source" is this module's name inside it). The ModelOS logo in the header
 * links here. Set VITE_PLATFORM_URL in .env to change it.
 */
export const PLATFORM_URL: string =
  setting('VITE_PLATFORM_URL', import.meta.env.VITE_PLATFORM_URL as string | undefined) || 'http://modelos-dashboard.s3-website.ap-south-1.amazonaws.com/#/';
