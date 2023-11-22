import axios, { RawAxiosRequestHeaders } from 'axios';
import { load } from 'cheerio';
import { Source } from 'types/sources';
import * as m3u8Parser from 'm3u8-parser';

export const getCaptchaToken = async (siteKey: string, url: string) => {
  const uri = new URL(url);
  const domain = new TextEncoder().encode(`${uri.protocol}//${uri.hostname}:443`);
  const domainEncoded = Buffer.from(domain).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  let res = await axios.get(`https://www.google.com/recaptcha/api.js?render=${siteKey}`);
  const vToken = res.data.split('releases/')[1].split('/')[0];

  res = await axios.get(`https://www.google.com/recaptcha/api2/anchor?ar=1&hl=en&size=invisible&cb=cs3&k=${siteKey}&co=${domainEncoded}&v=${vToken}`);

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

export const randomString = (length: number) => {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = length; i > 0; i -= 1) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};

export const getResolutionName = (resolution: number): Source['quality'] => {
  switch (resolution) {
    case 2160:
      return '4k';
    case 1440:
      return '1440p';
    case 1080:
      return '1080p';
    case 808:
      return '1080p';
    case 720:
      return '720p';
    case 534:
      return '720p';
    case 480:
      return '480p';
    case 360:
      return '360p';
    default:
      return 'Unknown';
  }
};

export const getResolutionFromM3u8 = async (m3u8: string, shouldRequest: boolean, headers: RawAxiosRequestHeaders = {}): Promise<Source['quality']> => {
  try {
    let m3u8Manifest = m3u8;
    if (shouldRequest) {
      const res = await axios.get(m3u8, {
        headers,
      });
      m3u8Manifest = res.data;
    }
    const parser = new m3u8Parser.Parser();
    parser.push(m3u8Manifest);
    parser.end();

    const parsedManifest = parser.manifest;
    const highestQuality = parsedManifest.playlists.reduce((prev: any, current: any) => {
      return prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH ? prev : current;
    });
    return getResolutionName(highestQuality.attributes.RESOLUTION.height);
  } catch {
    return 'Unknown';
  }
};

export const findHighestResolutionStream = (m3u8Content: string) => {
  const streamEntries = m3u8Content.split('#EXT-X-STREAM-INF').slice(1);
  let highestResolution = '';
  let maxResolution = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const entry of streamEntries) {
    const resolutionMatch = entry.match(/RESOLUTION=(\d+)x(\d+)/);
    if (resolutionMatch) {
      const width = parseInt(resolutionMatch[1], 10);
      const height = parseInt(resolutionMatch[2], 10);
      const resolution = width * height;

      if (resolution > maxResolution) {
        maxResolution = resolution;
        highestResolution = entry.split('\n')[1].trim(); // Get the URL
      }
    }
  }

  return highestResolution;
};

export const getResolution = (fileName: string | number): Source['quality'] => {
  const fileNameLower = fileName.toString().toLowerCase();
  if (fileNameLower.includes('2160p') || fileNameLower.includes('2160') || fileNameLower.includes('4K')) return '4k';
  if (fileNameLower.includes('1440p') || fileNameLower.includes('1440')) return '1440p';
  if (fileNameLower.includes('1080p') || fileNameLower.includes('1080')) return '1080p';
  if (fileNameLower.includes('808p') || fileNameLower.includes('808')) return '808p';
  if (fileNameLower.includes('720p') || fileNameLower.includes('720')) return '720p';
  if (fileNameLower.includes('480p') || fileNameLower.includes('480')) return '480p';
  if (fileNameLower.includes('360p') || fileNameLower.includes('360')) return '360p';
  return 'Unknown';
};

export const addLeadingZero = (number: number) => {
  return number.toString().padStart(2, '0');
};

export const resolveRelativePaths = (m3u8Content: string, baseUrl: string) => {
  return m3u8Content.replace(/^(.*\.jpg)$/gm, `${baseUrl}$1`);
};

export const formatToJSON = (str: string) => {
  return str.replace(/([{,])(\s*)([a-zA-Z0-9_]+?)\s*:/g, '$1"$3":');
};
