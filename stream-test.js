import http from 'http';
import unbzip2Stream from 'unbzip2-stream';
import through from 'through';
import concat from 'concat-stream';
import test from 'tape';


http.get({ path: '/test/fixtures/text.bz2', responseType: "arraybuffer" }, function (res) {
  res.pipe(unbzip2Stream()).pipe(
    concat(function (data) {
      console.log(data.toString('ascii'))
    })
  );
});