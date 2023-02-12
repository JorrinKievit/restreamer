import axios from 'axios';
import { load } from 'cheerio';

export const getCaptchaToken = async (siteKey: string, url: string) => {
  const uri = new URL(url);
  const domain = new TextEncoder().encode(
    `${uri.protocol}//${uri.hostname}:443`
  );
  const domainEncoded = Buffer.from(domain)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  let res = await axios.get(
    `https://www.google.com/recaptcha/api.js?render=${siteKey}`
  );
  const vToken = res.data.split('releases/')[1].split('/')[0];

  res = await axios.get(
    `https://www.google.com/recaptcha/api2/anchor?ar=1&hl=en&size=invisible&cb=cs3&k=${siteKey}&co=${domainEncoded}&v=${vToken}`
  );

  const $ = load(res.data);
  const recapToken = $('#recaptcha-token').attr('value');

  res = await axios.post(
    `https://www.google.com/recaptcha/api2/reload?k=${siteKey}`,
    {
      v: vToken,
      k: siteKey,
      c: recapToken,
      co: domainEncoded,
      sa: '',
      reason: 'q',
    },
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  return JSON.parse(res.data.split('\n')[1])[1];
};
