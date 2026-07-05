export const mockEncrypt = (text) => text.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');

export const mockDecrypt = (hex) => {
  try {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) str += String.fromCharCode(parseInt(hex.substring(i, i+2), 16));
    return decodeURIComponent(escape(str));
  } catch(e) { return hex; }
};
