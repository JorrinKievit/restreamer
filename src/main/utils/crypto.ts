import CryptoJS from "crypto-js";

export var CryptoJSAesJson = {
  encrypt: function (value: string, password: string) {
    return CryptoJS.AES.encrypt(JSON.stringify(value), password, {
      format: CryptoJSAesJson,
    }).toString();
  },
  decrypt: function (jsonStr: string, password: string) {
    return JSON.parse(
      CryptoJS.AES.decrypt(jsonStr, password, {
        format: CryptoJSAesJson,
      }).toString(CryptoJS.enc.Utf8),
    );
  },
  stringify: function (cipherParams: any) {
    var j: any = {
      ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64),
    };
    if (cipherParams.iv) j.iv = cipherParams.iv.toString();
    if (cipherParams.salt) j.s = cipherParams.salt.toString();
    return JSON.stringify(j).replace(/\s/g, "");
  },
  parse: function (jsonStr: string) {
    var j = JSON.parse(jsonStr);
    var cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(j.ct),
    });
    if (j.iv) cipherParams.iv = CryptoJS.enc.Hex.parse(j.iv);
    if (j.s) cipherParams.salt = CryptoJS.enc.Hex.parse(j.s);
    return cipherParams;
  },
};
