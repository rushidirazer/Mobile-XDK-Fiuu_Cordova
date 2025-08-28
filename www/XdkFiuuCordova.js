var exec = require('cordova/exec');

function toJsonErr(e) {
  if (typeof e === 'string') return { error: e };
  if (e && typeof e === 'object') return e;
  return { error: String(e) };
}

function errorAsStringCb(cb) {
  return function (err) {
    if (typeof cb === 'function') {
      try { cb(JSON.stringify(toJsonErr(err))); }
      catch (_) { cb(JSON.stringify({ Error: 'stringify failed' })); }
    }
  };
}

exports.startPayment = function (arg0, success, error) {
    exec(success, errorAsStringCb(error), 'XdkFiuuCordova', 'startPayment', [arg0]);
};


// exports.startPayment =function(params, onProgress) {
//   return new Promise((resolve, reject) => {
//     cordova.exec(
//       (msg) => {
//         // Native can send multiple messages. Distinguish by 'type'.
//         if (msg && msg.type === "progress") {
//           onProgress?.(msg);    // { type:'progress', step:'launching', percent: 20 }
//         } else {
//           resolve(msg);         // final payload
//         }
//       },
//       (err) => reject(err),
//       "XdkFiuuCordova",
//       "startPayment",
//       [params]
//     );
//   });
// }