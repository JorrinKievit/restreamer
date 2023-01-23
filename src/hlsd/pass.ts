import axios from 'axios';

export const validatePass = async (url: string) => {
  console.log(url);
  const uri = new URL(url);
  const { host } = uri;

  // Basically turn https://tm3p.vidsrc.stream/ -> https://vidsrc.stream/
  let referer = `${host.split('.').slice(-2).join('.')}/`;
  referer = `https://${referer}`;

  console.log(referer);

  const res = await axios.get(url, { headers: { referer } });
  return res.data;
};
