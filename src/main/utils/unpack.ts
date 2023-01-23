/* eslint-disable */

export const P_A_C_K_E_R = {
  detect(str) {
    return P_A_C_K_E_R.get_chunks(str).length > 0;
  },

  get_chunks(str) {
    const chunks = str.match(
      /eval\(\(?function\(.*?(,0,\{\}\)\)|split\('\|'\)\)\))($|\n)/g
    );
    return chunks || [];
  },

  unpack(str) {
    const chunks = P_A_C_K_E_R.get_chunks(str);
    let chunk;
    for (let i = 0; i < chunks.length; i += 1) {
      chunk = chunks[i].replace(/\n$/, '');
      str = str.split(chunk).join(P_A_C_K_E_R.unpack_chunk(chunk));
    }
    return str;
  },

  unpack_chunk(str) {
    let unpackedSource = '';
    if (P_A_C_K_E_R.detect(str)) {
      try {
        const __eval = new Function(
          's',
          'unpackedSource += s; return unpackedSource;'
        );
        __eval(str);
        if (typeof unpackedSource === 'string' && unpackedSource) {
          str = unpackedSource;
        }
      } catch (e) {
        // well, it failed. we'll just return the original, instead of crashing on user.
      }
    }
    return str;
  },
};
