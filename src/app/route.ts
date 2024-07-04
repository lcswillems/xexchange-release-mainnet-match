export const dynamic = "force-dynamic";

export async function GET() {
  const address = "erd1qqqqqqqqqqqqqpgqq66xk9gfr4esuhem3jru86wg5hvp33a62jps2fy57p";
  const repository = "https://github.com/multiversx/mx-exchange-sc";
  const tag = "v3.0.5";
  const scPath = "dex/router";

  const mainnetRes = await fetch(`https://gateway.multiversx.com/address/${address}/code-hash`, { cache: "no-store" }).then(r => r.json());
  const mainnetCodeHash = Buffer.from(mainnetRes.data.codeHash, "base64").toString("hex");

  const repo = repository.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '');
  const sc = scPath.split("/").at(-1);
  const releaseRes = await fetch(`https://api.github.com/repos/${repo}/releases/tags/${tag}`, { cache: "force-cache" }).then(r => r.json());
  let releaseCodeHash: string | undefined;
  for (const line of releaseRes.body.split("\n")) {
    const match = line.match(new RegExp(`(?: - )?\\*\\*${sc}\\.wasm\\*\\*: \`([0-9a-z]+)\``));
    if (match) {
      releaseCodeHash = match[1];
    };
  }
  if (releaseCodeHash === undefined) {
    return new Response("No code hash found in the release", { status: 400 });
  }

  return Response.json(mainnetCodeHash === releaseCodeHash);
}
