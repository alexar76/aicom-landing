// The image probe follows URLs a model wrote from an anonymous brief: it must not reach
// the factory host's own network. Run: node --test test/image-probe-ssrf.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { isNonPublicAddress, probeImageUrl } from "../lib/repairExternalImages.mjs";

test("internal and reserved addresses are recognised", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.18.0.1", "192.168.1.1", "169.254.169.254",
                    "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"]) {
    assert.equal(isNonPublicAddress(ip), true, ip);
  }
  for (const ip of ["93.184.216.34", "2606:4700::6810:84e5"]) {
    assert.equal(isNonPublicAddress(ip), false, ip);
  }
});

test("a probe of an internal address is refused before any request is sent", async () => {
  let hits = 0;
  const server = http.createServer((req, res) => { hits++; res.writeHead(200, { "content-type": "image/png" }); res.end(); });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address();
  try {
    assert.equal(await probeImageUrl(`http://127.0.0.1:${port}/x.png`), false);
    assert.equal(await probeImageUrl(`http://localhost:${port}/x.png`), false);
    assert.equal(hits, 0, "the internal server must never be contacted");
  } finally {
    server.close();
  }
});
