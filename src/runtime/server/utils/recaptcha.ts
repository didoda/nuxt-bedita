import { type H3Event, createError } from 'h3';
import { ofetch } from 'ofetch';
import { isRecaptchaEnabled } from '../../utils/recaptcha-helpers';
import type { RecaptchaResponse } from '../../types';
import { useRuntimeConfig } from '#imports';

export const recaptchaVerifyToken = async (event: H3Event, token: string, action: string, throwError = true): Promise<boolean> => {
  if (!isRecaptchaEnabled(event)) {
    return true;
  }

  const config = useRuntimeConfig(event);
  const data: RecaptchaResponse = await ofetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${config.bedita.recaptchaSecretKey}&response=${token}`,
  });

  const test = data.action === action && data.success && (data.score || 0) > 0.5;
  if (!test && throwError) {
    throw createError({
      statusCode: 400,
      message: `Recaptcha token not valid. ${(data?.['error-codes'] || []).join(', ')}`,
    });
  }

  return test;
};
