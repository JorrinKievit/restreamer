import axios from 'axios';

export const validatePass = async (url: string) => {
  const uri = new URL(url);
  const { host } = uri;

  // Basically turn https://tm3p.vidsrc.stream/ -> https://vidsrc.stream/
  let referer = `${host.split('.').slice(-2).join('.')}/`;
  referer = `https://${referer}`;

  const res = await axios.get(url, { headers: { referer } });
  return res.data;
};
