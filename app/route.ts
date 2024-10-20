import { NextRequest } from "next/server";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (address === null) {
    return new Response("Null address", { status: 400 });
  }
  const tagUrl = req.nextUrl.searchParams.get("tagUrl");
  if (tagUrl === null) {
    return new Response("Null tag URL", { status: 400 });
  }
  const scPath = req.nextUrl.searchParams.get("scPath");
  if (scPath === null) {
    return new Response("Null scPath", { status: 400 });
  }

  let mainnetRes = await fetch(`https://gateway.multiversx.com/address/${address}/code-hash`, { cache: "no-store" }).then(r => r.json());
  let mainnetCodeHash = Buffer.from(mainnetRes.data.codeHash, "base64").toString("hex");

  const match = tagUrl.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+\/[^\/]+)\/releases\/tag\/(.+)$/);
  if (match === null) {
    return new Response("No match", { status: 400 });
  }

  const repo = match[1];
  const tag = match[2];
  const sc = scPath.split("/").at(-1);
  const releaseRes = await fetch(`https://api.github.com/repos/${repo}/releases/tags/${tag}`, { cache: "force-cache" }).then(r => r.json());
  let releaseCodeHash: string | undefined;
  for (const line of releaseRes.body.split("\n")) {
    const match = line.match(new RegExp(`(?: - )?\\*\\*${sc}\\.wasm\\*\\*: \`([0-9a-z]+)\``));
    if (match) {
      if (releaseCodeHash !== undefined) {
        return new Response("Two code hashes matching", { status: 400 });
      }
      releaseCodeHash = match[1];
    };
  }

  if (mainnetCodeHash === releaseCodeHash) {
    return Response.json(true);
  }

  mainnetRes = await fetch(`https://gateway.multiversx.com/address/${address}`, { cache: "no-store" }).then(r => r.json());
  mainnetCodeHash = crypto.createHash('sha256').update(Buffer.from(mainnetRes.data.account.code, 'hex')).digest("hex");

  return Response.json(mainnetCodeHash === releaseCodeHash);
}
