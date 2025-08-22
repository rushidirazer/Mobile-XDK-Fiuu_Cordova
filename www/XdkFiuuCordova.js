var exec = require('cordova/exec');

exports.startPayment = function (arg0, success, error) {
    exec(success, error, 'XdkFiuuCordova', 'startPayment', [arg0]);
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