import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (address === null) {
    return new Response("Null address", { status: 400 });
  }
  const repository = req.nextUrl.searchParams.get("repository");
  if (repository === null) {
    return new Response("Null repository", { status: 400 });
  }
  const tag = req.nextUrl.searchParams.get("tag");
  if (tag === null) {
    return new Response("Null tag", { status: 400 });
  }
  const scPath = req.nextUrl.searchParams.get("scPath");
  if (scPath === null) {
    return new Response("Null scPath", { status: 400 });
  }

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
