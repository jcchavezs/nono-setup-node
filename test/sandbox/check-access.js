// Runs as an npm lifecycle script, i.e. inside the nono sandbox.
// Reads two folders: the one allowed by the nono profile must succeed and
// the one denied by it must fail. Exits non-zero otherwise.
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.join(os.homedir(), "nono-test");
const cases = [
  { dir: path.join(root, "allowed"), shouldSucceed: true },
  { dir: path.join(root, "denied"), shouldSucceed: false },
];

let failed = false;
for (const { dir, shouldSucceed } of cases) {
  let succeeded = true;
  try {
    fs.readdirSync(dir);
    fs.readFileSync(path.join(dir, "file.txt"), "utf8");
  } catch (err) {
    succeeded = false;
    console.log(`read ${dir}: FAILED (${err.code})`);
  }
  if (succeeded) console.log(`read ${dir}: OK`);

  if (succeeded !== shouldSucceed) {
    console.error(
      `UNEXPECTED: ${dir} should ${shouldSucceed ? "be readable" : "be denied"}`
    );
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
