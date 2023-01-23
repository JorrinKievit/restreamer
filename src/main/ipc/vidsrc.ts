import axios from 'axios';
import { ipcMain } from 'electron';
import { load } from 'cheerio';
import { ContentType } from 'types/tmbd';
import { P_A_C_K_E_R } from '../utils/unpack';

ipcMain.handle(
  'vidsrc',
  async (event, id, type: ContentType, season?: number, episode?: number) => {
    try {
      const url =
        // eslint-disable-next-line no-nested-ternary
        type === 'movie'
          ? `https://v2.vidsrc.me/embed/${id}/`
          : type === 'tv'
          ? `https://v2.vidsrc.me/embed/${id}/${season}-${episode}/`
          : '';
      let res = await axios.get(url);

      let $ = load(res.data);
      const hashes = $('div.source')
        .map((_, el) => $(el).attr('data-hash'))
        .get();

      const serverlist = await Promise.all(
        hashes.map(async (hash) => {
          res = await axios.get(`https://v2.vidsrc.me/src/${hash}`, {
            headers: {
              referer: 'https://v2.vidsrc.me/',
            },
          });
          return res.request.res.responseUrl;
        })
      );

      const finalServerlist = await Promise.all(
        serverlist.map(async (server) => {
          const linkfixed = server.replace(
            'https://vidsrc.xyz/',
            'https://embedsito.com/'
          );
          if (linkfixed.includes('/pro')) {
            res = await axios.get(server, {
              headers: {
                referer: 'https://v2.vidsrc.me/',
              },
            });
            const m3u8Regex = /((https:|http:)\/\/.*\.m3u8)/g;
            const srcm3u8 = m3u8Regex.exec(res.data)[0];
            const extractorDataRegex = /['"](.*set_pass[^"']*)/;
            const extractorData = extractorDataRegex
              .exec(res.data)[1]
              .replace('//', 'https://');
            return {
              server: 'pro',
              url: srcm3u8,
              extractorData,
            };
          }
          return {
            server: linkfixed.split('/')[2].split('.')[0],
            url: linkfixed,
          };
        })
      );

      const sourceURLS = await Promise.all(
        finalServerlist.map(async (server) => {
          if (server.server === 'pro') {
            res = await axios.get(server.url, {
              method: 'GET',
              headers: {
                referer: 'https://vidsrc.stream/',
              },
            });
            if (res.request.res.responseUrl.includes('m3u8')) {
              return {
                server: 'pro',
                url: res.request.res.responseUrl,
                extractorData: server.extractorData,
              };
            }
          }
          if (server.server === 'embedsito') {
            res = await axios.post(
              `https://embedsito.com/api/source/${server.url.split('/').pop()}`
            );
            return {
              server: 'embedsito',
              url: res.data.data[0].file as string,
            };
          }
          // mixdrop doesn't work yet, HTTP 509
          if (server.server === 'mixdrop') {
            res = await axios.get(server.url);
            $ = load(res.data);
            const result = $('script')
              .map((_, el) => $(el).html())
              .get()
              .filter((el) => el.includes('MDCore.ref'))[0];

            const unpackedResult = P_A_C_K_E_R.unpack(result);
            // get everything after MDCore.wurl=
            const regex = /MDCore.wurl="([^"]*)/g;
            const result2 = regex.exec(unpackedResult);

            if (!result2) {
              return {
                server: 'mixdrop',
                url: '',
              };
            }
            return {
              server: 'mixdrop',
              url: result2[1].replace('//', 'https://'),
            };
          }
          return null;
        })
      );
      return sourceURLS;
    } catch (error) {
      return null;
    }
  }
);
