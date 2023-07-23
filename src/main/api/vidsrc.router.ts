import z from 'zod';
import FormData from 'form-data';
import { axiosInstance } from '../utils/axios';
import { t } from './trpc-client';

export const vidSrcRouter = t.router({
  getSubUrl: t.procedure
    .input(
      z.object({
        url: z.string(),
        hash: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const gzippedRes = await axiosInstance.get(input.url, {
        headers: {
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'en-US,en;q=0.5',
          TE: 'trailers',
        },
        responseType: 'arraybuffer',
      });
      const gzipId = input.url.split('/').pop()?.replace('.gz', '');

      const formData = new FormData();
      formData.append('sub_data', gzippedRes.data, {
        filename: 'blob',
        contentType: 'application/octet-stream',
      });
      formData.append('sub_id', gzipId);
      formData.append('sub_enc', 'UTF-8');
      formData.append('sub_src', 'ops');
      formData.append('subformat', 'srt');

      const subUrl = await axiosInstance.post('https://vidsrc.stream/get_sub_url', formData, {
        headers: {
          'Content-Type': 'multipart/form-data; boundary=---------------------------17099936243183683645642750180',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'en-US,en;q=0.5',
          Origin: 'https://vidsrc.stream',
          Referer: `https://vidsrc.stream/prorcp/${input.hash}`,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      return `https://vidsrc.stream${subUrl.data}`;
    }),
});
